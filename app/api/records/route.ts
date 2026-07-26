import { getD1 } from "../../../db";

type CrimsonRecord = {
  id: string;
  module: string;
  title: string;
  summary: string;
  content: string;
  note: string;
  createdAt: string;
  updatedAt: string;
  noteUpdatedAt: string | null;
  metadata: Record<string, unknown>;
};

type VaultPayload = {
  schema: "crimson-world-records";
  schemaVersion: 2;
  syncedAt: string;
  records: CrimsonRecord[];
};

type VaultRow = {
  owner_key_hash: string;
  payload: string;
  record_count: number;
  updated_at: string;
};

type ReplyKeyRow = { owner_key_hash: string };

const KEY_PATTERN = /^ctv1_[A-Za-z0-9_-]{43}$/;
const MAX_RECORDS = 500;
const MAX_CONTENT_LENGTH = 120_000;
const MAX_NOTE_LENGTH = 40_000;
const MAX_REPLY_APPEND = 12_000;
const MAX_PAYLOAD_BYTES = 4_000_000;
const encoder = new TextEncoder();
let schemaReady: Promise<void> | null = null;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "Authorization, Content-Type, X-Crimson-Key, X-Tavern-Key",
  "Access-Control-Allow-Methods": "GET, PUT, POST, PATCH, OPTIONS",
  "Access-Control-Max-Age": "86400",
  "Cache-Control": "no-store",
};

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: corsHeaders });
}

function text(value: unknown, maxLength: number) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function validDate(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback;
  return Number.isNaN(new Date(value).getTime()) ? fallback : value;
}

function requestKey(request: Request) {
  const direct =
    request.headers.get("X-Crimson-Key")?.trim() ||
    request.headers.get("X-Tavern-Key")?.trim() ||
    "";
  if (KEY_PATTERN.test(direct)) return direct;
  const match = (request.headers.get("Authorization") || "").match(
    /^Bearer\s+(.+)$/i,
  );
  const bearer = match?.[1]?.trim() || "";
  return KEY_PATTERN.test(bearer) ? bearer : null;
}

async function hashKey(key: string) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(key));
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function sanitizeMetadata(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const serialized = JSON.stringify(value);
  if (serialized.length > 20_000) return {};
  return JSON.parse(serialized) as Record<string, unknown>;
}

function sanitizeRecord(value: unknown): CrimsonRecord | null {
  if (!value || typeof value !== "object") return null;
  const source = value as Record<string, unknown>;
  const id = text(source.id, 160);
  const moduleName = text(source.module, 60);
  const title = text(source.title, 240);
  const content = text(source.content, MAX_CONTENT_LENGTH);
  if (!id || !moduleName || !title || !content) return null;
  const now = new Date().toISOString();
  return {
    id,
    module: moduleName,
    title,
    summary: text(source.summary, 1_000),
    content,
    note: text(source.note, MAX_NOTE_LENGTH),
    createdAt: validDate(source.createdAt, now),
    updatedAt: validDate(source.updatedAt, now),
    noteUpdatedAt:
      typeof source.noteUpdatedAt === "string"
        ? validDate(source.noteUpdatedAt, now)
        : null,
    metadata: sanitizeMetadata(source.metadata),
  };
}

function timestamp(value: string | null | undefined) {
  if (!value) return 0;
  const result = new Date(value).getTime();
  return Number.isNaN(result) ? 0 : result;
}

function mergeRecords(
  existing: CrimsonRecord[],
  incoming: CrimsonRecord[],
): CrimsonRecord[] {
  const byId = new Map(existing.map((record) => [record.id, record]));
  for (const next of incoming) {
    const previous = byId.get(next.id);
    if (
      previous?.note &&
      timestamp(previous.noteUpdatedAt) > timestamp(next.noteUpdatedAt)
    ) {
      next.note = previous.note;
      next.noteUpdatedAt = previous.noteUpdatedAt;
    }
    byId.set(next.id, next);
  }
  return [...byId.values()]
    .sort((a, b) => timestamp(b.updatedAt) - timestamp(a.updatedAt))
    .slice(0, MAX_RECORDS);
}

function ensureSchema() {
  if (!schemaReady) {
    const d1 = getD1();
    schemaReady = d1
      .batch([
        d1.prepare(
          `CREATE TABLE IF NOT EXISTS crimson_record_vaults (
             owner_key_hash TEXT PRIMARY KEY NOT NULL,
             read_key_hash TEXT NOT NULL UNIQUE,
             payload TEXT NOT NULL,
             record_count INTEGER DEFAULT 0 NOT NULL,
             created_at TEXT NOT NULL,
             updated_at TEXT NOT NULL
           )`,
        ),
        d1.prepare(
          `CREATE TABLE IF NOT EXISTS crimson_record_reply_keys (
             reply_key_hash TEXT PRIMARY KEY NOT NULL,
             owner_key_hash TEXT NOT NULL UNIQUE,
             created_at TEXT NOT NULL,
             updated_at TEXT NOT NULL
           )`,
        ),
      ])
      .then(() => undefined)
      .catch((error) => {
        schemaReady = null;
        throw error;
      });
  }
  return schemaReady;
}

function storageError(error: unknown) {
  console.error(error);
  return json({ error: "绯界统一记录库暂时不可用。" }, 500);
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function GET(request: Request) {
  const key = requestKey(request);
  if (!key) return json({ error: "缺少有效的读取钥匙。" }, 401);

  try {
    await ensureSchema();
    const keyHash = await hashKey(key);
    const row = await getD1()
      .prepare(
        `SELECT owner_key_hash, payload, record_count, updated_at
         FROM crimson_record_vaults
         WHERE owner_key_hash = ?1 OR read_key_hash = ?1
         LIMIT 1`,
      )
      .bind(keyHash)
      .first<VaultRow>();
    if (!row) return json({ error: "没有找到这把钥匙对应的绯界档案。" }, 404);

    const payload = JSON.parse(row.payload) as VaultPayload;
    const url = new URL(request.url);
    const recordId = text(url.searchParams.get("recordId"), 160);
    const query = text(url.searchParams.get("q"), 120).toLocaleLowerCase();
    const moduleName = text(url.searchParams.get("module"), 60);
    const requestedLimit = Number.parseInt(
      url.searchParams.get("limit") || "25",
      10,
    );
    const limit = Number.isFinite(requestedLimit)
      ? Math.min(MAX_RECORDS, Math.max(1, requestedLimit))
      : 25;

    let records = payload.records;
    if (recordId) records = records.filter((record) => record.id === recordId);
    if (moduleName) records = records.filter((record) => record.module === moduleName);
    if (query) {
      records = records.filter((record) =>
        [
          record.id,
          record.module,
          record.title,
          record.summary,
          record.content,
          record.note,
          JSON.stringify(record.metadata),
        ]
          .join("\n")
          .toLocaleLowerCase()
          .includes(query),
      );
    }

    return json({
      schema: payload.schema,
      schemaVersion: payload.schemaVersion,
      updatedAt: row.updated_at,
      total: row.record_count,
      matched: records.length,
      records: records.slice(0, limit),
    });
  } catch (error) {
    return storageError(error);
  }
}

export async function PUT(request: Request) {
  const ownerKey = requestKey(request);
  if (!ownerKey) return json({ error: "缺少有效的主人钥匙。" }, 401);

  try {
    await ensureSchema();
    const body = (await request.json()) as Record<string, unknown>;
    const readKey = text(body.readKey, 80);
    const replyKey = text(body.replyKey, 80);
    if (!KEY_PATTERN.test(readKey) || readKey === ownerKey) {
      return json({ error: "读取钥匙无效。" }, 400);
    }
    if (
      !KEY_PATTERN.test(replyKey) ||
      replyKey === ownerKey ||
      replyKey === readKey
    ) {
      return json({ error: "回复钥匙无效。" }, 400);
    }

    const incoming = (Array.isArray(body.records) ? body.records : [])
      .map(sanitizeRecord)
      .filter((record): record is CrimsonRecord => Boolean(record));
    if (!incoming.length) {
      return json({ error: "没有识别到有效的绯界记录。" }, 400);
    }

    const [ownerHash, readHash, replyHash] = await Promise.all([
      hashKey(ownerKey),
      hashKey(readKey),
      hashKey(replyKey),
    ]);
    const d1 = getD1();
    const existing = await d1
      .prepare(
        `SELECT owner_key_hash, payload, record_count, updated_at
         FROM crimson_record_vaults
         WHERE owner_key_hash = ?1
         LIMIT 1`,
      )
      .bind(ownerHash)
      .first<VaultRow>();

    let previousRecords: CrimsonRecord[] = [];
    if (existing) {
      previousRecords = (JSON.parse(existing.payload) as VaultPayload).records;
    }
    const records = mergeRecords(previousRecords, incoming);
    const now = new Date().toISOString();
    const payload: VaultPayload = {
      schema: "crimson-world-records",
      schemaVersion: 2,
      syncedAt: now,
      records,
    };
    const serialized = JSON.stringify(payload);
    if (encoder.encode(serialized).byteLength > MAX_PAYLOAD_BYTES) {
      return json({ error: "统一档案过大，无法继续同步。" }, 413);
    }

    await d1.batch([
      d1
        .prepare(
          `INSERT INTO crimson_record_vaults (
             owner_key_hash, read_key_hash, payload, record_count, created_at, updated_at
           ) VALUES (?1, ?2, ?3, ?4, ?5, ?5)
           ON CONFLICT(owner_key_hash) DO UPDATE SET
             read_key_hash = excluded.read_key_hash,
             payload = excluded.payload,
             record_count = excluded.record_count,
             updated_at = excluded.updated_at`,
        )
        .bind(ownerHash, readHash, serialized, records.length, now),
      d1
        .prepare(
          `INSERT INTO crimson_record_reply_keys (
             reply_key_hash, owner_key_hash, created_at, updated_at
           ) VALUES (?1, ?2, ?3, ?3)
           ON CONFLICT(owner_key_hash) DO UPDATE SET
             reply_key_hash = excluded.reply_key_hash,
             updated_at = excluded.updated_at`,
        )
        .bind(replyHash, ownerHash, now),
    ]);

    return json({
      success: true,
      schemaVersion: 2,
      syncedAt: now,
      recordCount: records.length,
      syncedIds: incoming.map((record) => record.id),
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return json({ error: "没有识别到有效的同步内容。" }, 400);
    }
    return storageError(error);
  }
}

async function appendReply(request: Request) {
  const replyKey = requestKey(request);
  if (!replyKey) return json({ error: "缺少有效的回复钥匙。" }, 401);

  try {
    await ensureSchema();
    const body = (await request.json()) as Record<string, unknown>;
    const recordId = text(body.recordId, 160);
    const addition = text(body.content, MAX_REPLY_APPEND);
    if (!recordId) return json({ error: "缺少记录 ID。" }, 400);
    if (!addition) return json({ error: "回复内容不能为空。" }, 400);

    const d1 = getD1();
    const replyHash = await hashKey(replyKey);
    const keyRow = await d1
      .prepare(
        `SELECT owner_key_hash
         FROM crimson_record_reply_keys
         WHERE reply_key_hash = ?1
         LIMIT 1`,
      )
      .bind(replyHash)
      .first<ReplyKeyRow>();
    if (!keyRow) return json({ error: "这把回复钥匙没有写入权限。" }, 403);

    const vault = await d1
      .prepare(
        `SELECT owner_key_hash, payload, record_count, updated_at
         FROM crimson_record_vaults
         WHERE owner_key_hash = ?1
         LIMIT 1`,
      )
      .bind(keyRow.owner_key_hash)
      .first<VaultRow>();
    if (!vault) return json({ error: "对应的绯界档案不存在。" }, 404);

    const payload = JSON.parse(vault.payload) as VaultPayload;
    const record = payload.records.find((item) => item.id === recordId);
    if (!record) return json({ error: "没有找到要写回的记录。" }, 404);

    const previous = record.note.trimEnd();
    if (previous && previous.endsWith(addition)) {
      return json({
        success: true,
        alreadyApplied: true,
        recordId,
        title: record.title,
        note: record.note,
        noteUpdatedAt: record.noteUpdatedAt,
        appendedChars: 0,
      });
    }

    const next = previous ? `${previous}\n\n${addition}` : addition;
    if (next.length > MAX_NOTE_LENGTH) {
      return json({ error: `note 最多保存 ${MAX_NOTE_LENGTH} 字。` }, 413);
    }
    const now = new Date().toISOString();
    record.note = next;
    record.noteUpdatedAt = now;
    record.updatedAt = now;
    payload.syncedAt = now;
    const serialized = JSON.stringify(payload);
    if (encoder.encode(serialized).byteLength > MAX_PAYLOAD_BYTES) {
      return json({ error: "统一档案空间不足。" }, 413);
    }

    await d1
      .prepare(
        `UPDATE crimson_record_vaults
         SET payload = ?1, updated_at = ?2
         WHERE owner_key_hash = ?3`,
      )
      .bind(serialized, now, keyRow.owner_key_hash)
      .run();

    return json({
      success: true,
      alreadyApplied: false,
      recordId,
      title: record.title,
      note: record.note,
      noteUpdatedAt: now,
      appendedChars: addition.length,
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return json({ error: "没有识别到有效的回复内容。" }, 400);
    }
    return storageError(error);
  }
}

export async function POST(request: Request) {
  return appendReply(request);
}

export async function PATCH(request: Request) {
  return appendReply(request);
}
