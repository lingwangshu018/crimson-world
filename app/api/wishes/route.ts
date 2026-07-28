import { getD1 } from "../../../db";

let wishAdminUser = "";
let wishAdminPassword = "";

export function setWishAdminCredentials(user?: string, password?: string) {
  wishAdminUser = String(user || "").trim();
  wishAdminPassword = String(password || "");
}

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, X-Visitor-Id, X-Traveler-Token, Authorization",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Cache-Control": "no-store",
};

async function ensureTables() {
  const db = getD1();
  await db.prepare(`CREATE TABLE IF NOT EXISTS wishes (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_name TEXT NOT NULL,
    visitor_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'waiting',
    lights INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    official_reply TEXT NOT NULL DEFAULT '',
    pinned INTEGER NOT NULL DEFAULT 0,
    traveler_id TEXT NOT NULL DEFAULT ''
  )`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS wish_lights (
    wish_id TEXT NOT NULL,
    visitor_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY (wish_id, visitor_id)
  )`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS wish_admin_sessions (
    token_hash TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL
  )`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS wish_travelers (
    id TEXT PRIMARY KEY,
    nickname TEXT NOT NULL,
    identity_hash TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL
  )`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS wish_traveler_sessions (
    token_hash TEXT PRIMARY KEY,
    traveler_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL
  )`).run();
  await db.prepare("ALTER TABLE wishes ADD COLUMN official_reply TEXT NOT NULL DEFAULT ''").run().catch(() => undefined);
  await db.prepare("ALTER TABLE wishes ADD COLUMN pinned INTEGER NOT NULL DEFAULT 0").run().catch(() => undefined);
  await db.prepare("ALTER TABLE wishes ADD COLUMN traveler_id TEXT NOT NULL DEFAULT ''").run().catch(() => undefined);
  const now = new Date().toISOString();
  await db.prepare("DELETE FROM wish_admin_sessions WHERE expires_at <= ?").bind(now).run();
  await db.prepare("DELETE FROM wish_traveler_sessions WHERE expires_at <= ?").bind(now).run();
}

function getBearer(request: Request) {
  const header = request.headers.get("Authorization") || "";
  return header.startsWith("Bearer ") ? header.slice(7).trim() : "";
}

async function digestBytes(value: string) {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
}

async function hashText(value: string) {
  const bytes = await digestBytes(value);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function sameSecret(left: string, right: string) {
  if (!left || !right) return false;
  const [aa, bb] = await Promise.all([digestBytes(left), digestBytes(right)]);
  if (aa.length !== bb.length) return false;
  let mismatch = 0;
  for (let index = 0; index < aa.length; index += 1) mismatch |= aa[index] ^ bb[index];
  return mismatch === 0;
}

async function requireAdmin(request: Request) {
  const token = getBearer(request);
  if (!token) return false;
  const tokenHash = await hashText(token);
  const row = await getD1().prepare("SELECT username FROM wish_admin_sessions WHERE token_hash = ? AND expires_at > ?").bind(tokenHash, new Date().toISOString()).first();
  return Boolean(row?.username);
}

async function getTraveler(request: Request) {
  const token = (request.headers.get("X-Traveler-Token") || "").trim();
  if (!token) return null;
  const row = await getD1().prepare(`SELECT t.id,t.nickname
    FROM wish_traveler_sessions s
    JOIN wish_travelers t ON t.id = s.traveler_id
    WHERE s.token_hash = ? AND s.expires_at > ?`).bind(await hashText(token), new Date().toISOString()).first();
  return row ? { id: String(row.id), nickname: String(row.nickname) } : null;
}

function makeIdentityCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  const raw = Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`;
}

async function issueTravelerSession(travelerId: string) {
  const token = `${crypto.randomUUID()}${crypto.randomUUID()}`.replaceAll("-", "");
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000);
  await getD1().prepare("INSERT INTO wish_traveler_sessions (token_hash,traveler_id,created_at,expires_at) VALUES (?,?,?,?)")
    .bind(await hashText(token), travelerId, createdAt.toISOString(), expiresAt.toISOString()).run();
  return { token, expiresAt: expiresAt.toISOString() };
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: cors });
}

export async function GET(request?: Request) {
  await ensureTables();
  const traveler = request ? await getTraveler(request) : null;
  const rows = await getD1().prepare("SELECT id,type,title,content,author_name AS authorName,status,lights,created_at AS createdAt,official_reply AS officialReply,pinned,traveler_id AS travelerId FROM wishes ORDER BY pinned DESC, created_at DESC LIMIT 200").all();
  const wishes = (rows.results || []).map((row: Record<string, unknown>) => ({
    ...row,
    mine: Boolean(traveler && String(row.travelerId || "") === traveler.id),
    travelerId: undefined,
  }));
  return Response.json({ wishes, traveler }, { headers: cors });
}

export async function POST(request: Request) {
  await ensureTables();
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const action = String(body.action || "create");
  const db = getD1();

  if (action === "admin-login") {
    if (!wishAdminUser || !wishAdminPassword) return Response.json({ error: "编纂者账号还没有在官方云端完成配置。" }, { status: 503, headers: cors });
    const username = String(body.username || "").trim();
    const password = String(body.password || "");
    const [userOk, passwordOk] = await Promise.all([sameSecret(username, wishAdminUser), sameSecret(password, wishAdminPassword)]);
    if (!userOk || !passwordOk) return Response.json({ error: "账号或密码不正确。" }, { status: 401, headers: cors });
    const token = `${crypto.randomUUID()}${crypto.randomUUID()}`.replaceAll("-", "");
    const tokenHash = await hashText(token);
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000);
    await db.prepare("INSERT INTO wish_admin_sessions (token_hash,username,created_at,expires_at) VALUES (?,?,?,?)").bind(tokenHash, username, createdAt.toISOString(), expiresAt.toISOString()).run();
    return Response.json({ ok: true, token, expiresAt: expiresAt.toISOString(), role: "owner", displayName: "初代编纂者" }, { headers: cors });
  }

  if (action === "admin-verify") {
    const ok = await requireAdmin(request);
    return Response.json(ok ? { ok: true, role: "owner", displayName: "初代编纂者" } : { error: "登录状态已经失效，请重新登录。" }, { status: ok ? 200 : 401, headers: cors });
  }

  if (action === "admin-logout") {
    const token = getBearer(request);
    if (token) await db.prepare("DELETE FROM wish_admin_sessions WHERE token_hash = ?").bind(await hashText(token)).run();
    return Response.json({ ok: true }, { headers: cors });
  }

  if (action === "traveler-register") {
    const nickname = String(body.nickname || "").trim().slice(0, 24);
    if (nickname.length < 2) return Response.json({ error: "旅人昵称至少写两个字哦。" }, { status: 400, headers: cors });
    const identityCode = makeIdentityCode();
    const id = `traveler_${crypto.randomUUID()}`;
    const createdAt = new Date().toISOString();
    await db.prepare("INSERT INTO wish_travelers (id,nickname,identity_hash,created_at) VALUES (?,?,?,?)")
      .bind(id, nickname, await hashText(identityCode), createdAt).run();
    const session = await issueTravelerSession(id);
    return Response.json({ ok: true, traveler: { id, nickname }, identityCode, ...session }, { status: 201, headers: cors });
  }

  if (action === "traveler-login") {
    const nickname = String(body.nickname || "").trim();
    const identityCode = String(body.identityCode || "").trim().toUpperCase();
    if (!nickname || !identityCode) return Response.json({ error: "请填写旅人昵称和身份码。" }, { status: 400, headers: cors });
    const row = await db.prepare("SELECT id,nickname FROM wish_travelers WHERE identity_hash = ?").bind(await hashText(identityCode)).first();
    if (!row || String(row.nickname) !== nickname) return Response.json({ error: "昵称或身份码没有对上。" }, { status: 401, headers: cors });
    const session = await issueTravelerSession(String(row.id));
    return Response.json({ ok: true, traveler: { id: String(row.id), nickname: String(row.nickname) }, ...session }, { headers: cors });
  }

  if (action === "traveler-verify") {
    const traveler = await getTraveler(request);
    return Response.json(traveler ? { ok: true, traveler } : { error: "旅人身份已经失效，请重新登记。" }, { status: traveler ? 200 : 401, headers: cors });
  }

  if (action === "traveler-logout") {
    const token = (request.headers.get("X-Traveler-Token") || "").trim();
    if (token) await db.prepare("DELETE FROM wish_traveler_sessions WHERE token_hash = ?").bind(await hashText(token)).run();
    return Response.json({ ok: true }, { headers: cors });
  }

  const visitorId = (request.headers.get("X-Visitor-Id") || "").slice(0, 80);
  if (!visitorId) return Response.json({ error: "缺少访客标识。" }, { status: 400, headers: cors });

  if (action === "light") {
    const wishId = String(body.wishId || "");
    if (!wishId) return Response.json({ error: "缺少愿望编号。" }, { status: 400, headers: cors });
    const result = await db.prepare("INSERT OR IGNORE INTO wish_lights (wish_id, visitor_id, created_at) VALUES (?, ?, ?)").bind(wishId, visitorId, new Date().toISOString()).run();
    if (result.meta.changes) await db.prepare("UPDATE wishes SET lights = lights + 1 WHERE id = ?").bind(wishId).run();
    const row = await db.prepare("SELECT lights FROM wishes WHERE id = ?").bind(wishId).first();
    return Response.json({ ok: true, lights: Number(row?.lights || 0) }, { headers: cors });
  }

  const traveler = await getTraveler(request);
  const type = String(body.type || "feature").slice(0, 24);
  const title = String(body.title || "").trim().slice(0, 80);
  const content = String(body.content || "").trim().slice(0, 1500);
  const authorName = traveler?.nickname || String(body.authorName || "匿名旅人").trim().slice(0, 30) || "匿名旅人";
  if (!title || !content) return Response.json({ error: "愿望标题和内容都要写哦。" }, { status: 400, headers: cors });
  const recent = await db.prepare("SELECT COUNT(*) AS count FROM wishes WHERE visitor_id = ? AND created_at > ?").bind(visitor?.id || visitorId, new Date(Date.now() - 10 * 60 * 1000).toISOString()).first();
  if (Number(recent?.count || 0) >= 3) return Response.json({ error: "兔兔正在搬运前面的愿望，请稍后再投。" }, { status: 429, headers: cors });
  const id = `wish_${crypto.randomUUID()}`;
  const createdAt = new Date().toISOString();
  await db.prepare("INSERT INTO wishes (id,type,title,content,author_name,visitor_id,status,lights,created_at,official_reply,pinned,traveler_id) VALUES (?,?,?,?,?,?, 'waiting',0,?,'',0,?)")
    .bind(id, type, title, content, authorName, traveler?.id || visitorId, createdAt, traveler?.id || "").run();
  return Response.json({ ok: true, wish: { id, type, title, content, authorName, status: "waiting", lights: 0, createdAt, officialReply: "", pinned: 0, mine: Boolean(traveler) } }, { status: 201, headers: cors });
}

export async function PATCH(request: Request) {
  await ensureTables();
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const id = String(body.id || "");
  if (await requireAdmin(request)) {
    const status = String(body.status || "").slice(0, 24);
    const officialReply = String(body.officialReply || "").trim().slice(0, 2000);
    const pinned = body.pinned ? 1 : 0;
    const allowed = new Set(["waiting", "seen", "considering", "building", "done", "declined"]);
    if (!id || !allowed.has(status)) return Response.json({ error: "愿望编号或状态不正确。" }, { status: 400, headers: cors });
    await getD1().prepare("UPDATE wishes SET status = ?, official_reply = ?, pinned = ? WHERE id = ?").bind(status, officialReply, pinned, id).run();
    return Response.json({ ok: true }, { headers: cors });
  }
  const traveler = await getTraveler(request);
  if (!traveler) return Response.json({ error: "请先恢复旅人身份。" }, { status: 401, headers: cors });
  const title = String(body.title || "").trim().slice(0, 80);
  const content = String(body.content || "").trim().slice(0, 1500);
  if (!id || !title || !content) return Response.json({ error: "标题和正文都要保留哦。" }, { status: 400, headers: cors });
  const result = await getD1().prepare("UPDATE wishes SET title = ?, content = ? WHERE id = ? AND traveler_id = ?").bind(title, content, id, traveler.id).run();
  if (!result.meta.changes) return Response.json({ error: "这枚愿望不属于当前旅人。" }, { status: 403, headers: cors });
  return Response.json({ ok: true }, { headers: cors });
}

export async function DELETE(request: Request) {
  await ensureTables();
  const id = new URL(request.url).searchParams.get("id") || "";
  if (!id) return Response.json({ error: "缺少愿望编号。" }, { status: 400, headers: cors });
  const db = getD1();
  if (!(await requireAdmin(request))) {
    const traveler = await getTraveler(request);
    if (!traveler) return Response.json({ error: "请先恢复旅人身份。" }, { status: 401, headers: cors });
    const owned = await db.prepare("SELECT id FROM wishes WHERE id = ? AND traveler_id = ?").bind(id, traveler.id).first();
    if (!owned) return Response.json({ error: "这枚愿望不属于当前旅人。" }, { status: 403, headers: cors });
  }
  await db.prepare("DELETE FROM wish_lights WHERE wish_id = ?").bind(id).run();
  await db.prepare("DELETE FROM wishes WHERE id = ?").bind(id).run();
  return Response.json({ ok: true }, { headers: cors });
}
