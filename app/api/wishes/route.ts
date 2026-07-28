import { getD1 } from "../../../db";

let wishAdminKey = "";

export function setWishAdminKey(value?: string) {
  wishAdminKey = String(value || "");
}

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, X-Visitor-Id, Authorization",
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
    pinned INTEGER NOT NULL DEFAULT 0
  )`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS wish_lights (
    wish_id TEXT NOT NULL,
    visitor_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY (wish_id, visitor_id)
  )`).run();
  await db.prepare("ALTER TABLE wishes ADD COLUMN official_reply TEXT NOT NULL DEFAULT ''").run().catch(() => undefined);
  await db.prepare("ALTER TABLE wishes ADD COLUMN pinned INTEGER NOT NULL DEFAULT 0").run().catch(() => undefined);
}

function getBearer(request: Request) {
  const header = request.headers.get("Authorization") || "";
  return header.startsWith("Bearer ") ? header.slice(7).trim() : "";
}

async function sameSecret(left: string, right: string) {
  if (!left || !right) return false;
  const encoder = new TextEncoder();
  const [a, b] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(left)),
    crypto.subtle.digest("SHA-256", encoder.encode(right)),
  ]);
  const aa = new Uint8Array(a);
  const bb = new Uint8Array(b);
  if (aa.length !== bb.length) return false;
  let mismatch = 0;
  for (let index = 0; index < aa.length; index += 1) mismatch |= aa[index] ^ bb[index];
  return mismatch === 0;
}

async function requireAdmin(request: Request) {
  if (!wishAdminKey) return false;
  return sameSecret(getBearer(request), wishAdminKey);
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: cors });
}

export async function GET() {
  await ensureTables();
  const rows = await getD1().prepare("SELECT id,type,title,content,author_name AS authorName,status,lights,created_at AS createdAt,official_reply AS officialReply,pinned FROM wishes ORDER BY pinned DESC, created_at DESC LIMIT 200").all();
  return Response.json({ wishes: rows.results || [] }, { headers: cors });
}

export async function POST(request: Request) {
  await ensureTables();
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const action = String(body.action || "create");

  if (action === "admin-login") {
    const ok = await requireAdmin(request);
    return Response.json(ok ? { ok: true, role: "owner", displayName: "初代编纂者" } : { error: "编纂者凭证不正确。" }, { status: ok ? 200 : 401, headers: cors });
  }

  const visitorId = (request.headers.get("X-Visitor-Id") || "").slice(0, 80);
  if (!visitorId) return Response.json({ error: "缺少访客标识。" }, { status: 400, headers: cors });
  const db = getD1();

  if (action === "light") {
    const wishId = String(body.wishId || "");
    if (!wishId) return Response.json({ error: "缺少愿望编号。" }, { status: 400, headers: cors });
    const result = await db.prepare("INSERT OR IGNORE INTO wish_lights (wish_id, visitor_id, created_at) VALUES (?, ?, ?)").bind(wishId, visitorId, new Date().toISOString()).run();
    if (result.meta.changes) await db.prepare("UPDATE wishes SET lights = lights + 1 WHERE id = ?").bind(wishId).run();
    const row = await db.prepare("SELECT lights FROM wishes WHERE id = ?").bind(wishId).first();
    return Response.json({ ok: true, lights: Number(row?.lights || 0) }, { headers: cors });
  }

  const type = String(body.type || "feature").slice(0, 24);
  const title = String(body.title || "").trim().slice(0, 80);
  const content = String(body.content || "").trim().slice(0, 1500);
  const authorName = String(body.authorName || "匿名旅人").trim().slice(0, 30) || "匿名旅人";
  if (!title || !content) return Response.json({ error: "愿望标题和内容都要写哦。" }, { status: 400, headers: cors });
  const recent = await db.prepare("SELECT COUNT(*) AS count FROM wishes WHERE visitor_id = ? AND created_at > ?").bind(visitorId, new Date(Date.now() - 10 * 60 * 1000).toISOString()).first();
  if (Number(recent?.count || 0) >= 3) return Response.json({ error: "兔兔正在搬运前面的愿望，请稍后再投。" }, { status: 429, headers: cors });
  const id = `wish_${crypto.randomUUID()}`;
  const createdAt = new Date().toISOString();
  await db.prepare("INSERT INTO wishes (id,type,title,content,author_name,visitor_id,status,lights,created_at,official_reply,pinned) VALUES (?,?,?,?,?,?, 'waiting',0,?,'',0)").bind(id, type, title, content, authorName, visitorId, createdAt).run();
  return Response.json({ ok: true, wish: { id, type, title, content, authorName, status: "waiting", lights: 0, createdAt, officialReply: "", pinned: 0 } }, { status: 201, headers: cors });
}

export async function PATCH(request: Request) {
  await ensureTables();
  if (!(await requireAdmin(request))) return Response.json({ error: "只有初代编纂者可以管理愿望。" }, { status: 401, headers: cors });
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const id = String(body.id || "");
  const status = String(body.status || "").slice(0, 24);
  const officialReply = String(body.officialReply || "").trim().slice(0, 2000);
  const pinned = body.pinned ? 1 : 0;
  const allowed = new Set(["waiting", "seen", "considering", "building", "done", "declined"]);
  if (!id || !allowed.has(status)) return Response.json({ error: "愿望编号或状态不正确。" }, { status: 400, headers: cors });
  await getD1().prepare("UPDATE wishes SET status = ?, official_reply = ?, pinned = ? WHERE id = ?").bind(status, officialReply, pinned, id).run();
  return Response.json({ ok: true }, { headers: cors });
}

export async function DELETE(request: Request) {
  await ensureTables();
  if (!(await requireAdmin(request))) return Response.json({ error: "只有初代编纂者可以删除愿望。" }, { status: 401, headers: cors });
  const id = new URL(request.url).searchParams.get("id") || "";
  if (!id) return Response.json({ error: "缺少愿望编号。" }, { status: 400, headers: cors });
  const db = getD1();
  await db.prepare("DELETE FROM wish_lights WHERE wish_id = ?").bind(id).run();
  await db.prepare("DELETE FROM wishes WHERE id = ?").bind(id).run();
  return Response.json({ ok: true }, { headers: cors });
}
