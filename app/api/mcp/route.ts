const PROTOCOL_VERSION = "2025-03-26";
const SERVER_NAME = "crimson-world";
const SERVER_VERSION = "0.1.0";
const KEY_PATTERN = /^ctv1_[A-Za-z0-9_-]{43}$/;
const MAX_REPLY_LENGTH = 12_000;

type JsonRpcId = string | number | null;

type JsonRpcRequest = {
  jsonrpc?: unknown;
  id?: JsonRpcId;
  method?: unknown;
  params?: unknown;
};

type ToolArguments = Record<string, unknown>;

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

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "Authorization, Content-Type, Accept, Mcp-Protocol-Version, Mcp-Session-Id",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Expose-Headers": "Mcp-Session-Id",
  "Cache-Control": "no-store",
};

const tools = [
  {
    name: "read_crimson_record",
    title: "读取绯界记录",
    description:
      "使用记录 ID 和读取钥匙，从绯界统一记录层精确读取一条记录。不得用相似记录替代目标记录。",
    inputSchema: {
      type: "object",
      properties: {
        record_id: {
          type: "string",
          description: "绯界任务单中的准确记录 ID。",
        },
        read_key: {
          type: "string",
          description: "绯界任务单中的 ctv1_... 读取钥匙。",
        },
      },
      required: ["record_id", "read_key"],
      additionalProperties: false,
    },
  },
  {
    name: "search_crimson_records",
    title: "搜索绯界记录",
    description:
      "按关键词搜索绯界统一记录层。仅用于查找记录或排查同步状态；已有准确记录 ID 时应使用 read_crimson_record。",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "记录编号、标题、关键词或记录 ID 片段。",
        },
        read_key: {
          type: "string",
          description: "绯界任务单中的 ctv1_... 读取钥匙。",
        },
        module: {
          type: "string",
          description: "可选，限定记录所属模块，例如 time-wheel。",
        },
        limit: {
          type: "integer",
          minimum: 1,
          maximum: 50,
          default: 10,
          description: "最多返回多少条记录。",
        },
      },
      required: ["query", "read_key"],
      additionalProperties: false,
    },
  },
  {
    name: "write_crimson_reply",
    title: "写回绯界回复",
    description:
      "使用回复钥匙，把完整最终回复追加到指定记录的 note 字段。只能写入已有记录，不会创建新记录，也不会覆盖原始 content。",
    inputSchema: {
      type: "object",
      properties: {
        record_id: {
          type: "string",
          description: "必须与读取时完全相同的记录 ID。",
        },
        reply_key: {
          type: "string",
          description: "绯界任务单中的 ctv1_... 回复钥匙。",
        },
        content: {
          type: "string",
          maxLength: MAX_REPLY_LENGTH,
          description: "要写回 note 字段的完整最终回复，不要只写摘要。",
        },
      },
      required: ["record_id", "reply_key", "content"],
      additionalProperties: false,
    },
  },
] as const;

function json(data: unknown, status = 200, extraHeaders?: HeadersInit) {
  return Response.json(data, {
    status,
    headers: { ...corsHeaders, ...extraHeaders },
  });
}

function rpcResult(id: JsonRpcId, result: unknown) {
  return json({ jsonrpc: "2.0", id, result });
}

function rpcError(
  id: JsonRpcId,
  code: number,
  message: string,
  data?: unknown,
  status = 200,
) {
  return json(
    {
      jsonrpc: "2.0",
      id,
      error: {
        code,
        message,
        ...(data === undefined ? {} : { data }),
      },
    },
    status,
  );
}

function text(value: unknown, maxLength: number) {
  return String(value ?? "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim()
    .slice(0, maxLength);
}

function key(value: unknown, label: string) {
  const result = text(value, 80).replace(/\s+/g, "");
  if (!KEY_PATTERN.test(result)) {
    throw new Error(`${label}格式不正确，请重新复制完整的 ctv1_... 钥匙。`);
  }
  return result;
}

function argumentsObject(value: unknown): ToolArguments {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as ToolArguments;
}

function toolText(data: unknown) {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    structuredContent: data,
  };
}

function toolError(message: string, details?: unknown) {
  return {
    content: [
      {
        type: "text",
        text: details
          ? `${message}\n${JSON.stringify(details, null, 2)}`
          : message,
      },
    ],
    isError: true,
  };
}

async function recordsRequest(
  request: Request,
  method: "GET" | "POST",
  accessKey: string,
  query = "",
  body?: unknown,
) {
  const base = new URL(request.url);
  const url = new URL(`/api/records${query}`, base.origin);
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessKey}`,
      "X-Crimson-Key": accessKey,
      Accept: "application/json",
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

  const raw = await response.text();
  let data: Record<string, unknown> = {};
  try {
    data = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
  } catch {
    data = { error: raw || `HTTP ${response.status}` };
  }

  if (!response.ok) {
    throw new Error(text(data.error || data.message, 500) || `HTTP ${response.status}`);
  }
  return data;
}

async function readRecord(request: Request, args: ToolArguments) {
  const recordId = text(args.record_id, 160);
  if (!recordId) return toolError("record_id 不能为空。");
  const readKey = key(args.read_key, "读取钥匙");
  const data = await recordsRequest(
    request,
    "GET",
    readKey,
    `?recordId=${encodeURIComponent(recordId)}&limit=1`,
  );
  const records = Array.isArray(data.records)
    ? (data.records as CrimsonRecord[])
    : [];
  const record = records.find((item) => item?.id === recordId);
  if (!record) {
    return toolError(
      `没有找到记录 ID 为 ${recordId} 的记录。请回到绯界重新点击“发送给 AI”，确保同步成功。`,
    );
  }

  return toolText({
    record_id: record.id,
    module: record.module,
    title: record.title,
    summary: record.summary,
    content: record.content,
    note: record.note,
    metadata: record.metadata,
    created_at: record.createdAt,
    updated_at: record.updatedAt,
    note_updated_at: record.noteUpdatedAt,
    instruction:
      "请结合当前聊天已经加载的角色卡、世界书和近期记忆继续完成这条记录。完成后调用 write_crimson_reply，并使用完全相同的 record_id 写回完整最终回复。",
  });
}

async function searchRecords(request: Request, args: ToolArguments) {
  const query = text(args.query, 120);
  if (!query) return toolError("query 不能为空。");
  const readKey = key(args.read_key, "读取钥匙");
  const moduleName = text(args.module, 60);
  const requestedLimit = Number(args.limit);
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(50, Math.max(1, Math.trunc(requestedLimit)))
    : 10;
  const params = new URLSearchParams({ q: query, limit: String(limit) });
  if (moduleName) params.set("module", moduleName);
  const data = await recordsRequest(request, "GET", readKey, `?${params}`);
  const records = Array.isArray(data.records)
    ? (data.records as CrimsonRecord[])
    : [];

  return toolText({
    query,
    total: Number(data.total || 0),
    matched: Number(data.matched || records.length),
    records: records.map((record) => ({
      id: record.id,
      module: record.module,
      title: record.title,
      summary: record.summary,
      created_at: record.createdAt,
      updated_at: record.updatedAt,
    })),
  });
}

async function writeReply(request: Request, args: ToolArguments) {
  const recordId = text(args.record_id, 160);
  const content = text(args.content, MAX_REPLY_LENGTH + 1);
  if (!recordId) return toolError("record_id 不能为空。");
  if (!content) return toolError("content 不能为空，请传入完整最终回复。");
  if (content.length > MAX_REPLY_LENGTH) {
    return toolError(
      `单次写回最多 ${MAX_REPLY_LENGTH} 字，当前内容为 ${content.length} 字。`,
    );
  }
  const replyKey = key(args.reply_key, "回复钥匙");
  const data = await recordsRequest(request, "POST", replyKey, "", {
    recordId,
    content,
  });
  if (text(data.recordId, 160) !== recordId) {
    return toolError("接口返回的记录 ID 与目标记录不一致，已停止确认成功。", data);
  }

  return toolText({
    record_id: recordId,
    title: data.title || null,
    already_applied: Boolean(data.alreadyApplied),
    appended_chars: Number(data.appendedChars || 0),
    note_updated_at: data.noteUpdatedAt || null,
    note: data.note || content,
    message: data.alreadyApplied
      ? "这段回复此前已经写入，无需重复追加。"
      : "完整回复已经写回指定记录的 note 字段。",
  });
}

async function callTool(request: Request, params: unknown) {
  const source = argumentsObject(params);
  const name = text(source.name, 100);
  const args = argumentsObject(source.arguments);
  try {
    if (name === "read_crimson_record") return await readRecord(request, args);
    if (name === "search_crimson_records") return await searchRecords(request, args);
    if (name === "write_crimson_reply") return await writeReply(request, args);
    return toolError(`未知工具：${name || "（空）"}`);
  } catch (error) {
    return toolError(error instanceof Error ? error.message : String(error));
  }
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export function GET() {
  return json({
    name: SERVER_NAME,
    version: SERVER_VERSION,
    protocolVersion: PROTOCOL_VERSION,
    transport: "streamable-http",
    endpoint: "/api/mcp",
    tools: tools.map((tool) => tool.name),
  });
}

export function DELETE() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: Request) {
  let message: JsonRpcRequest;
  try {
    message = (await request.json()) as JsonRpcRequest;
  } catch {
    return rpcError(null, -32700, "Parse error", undefined, 400);
  }

  if (message.jsonrpc !== "2.0" || typeof message.method !== "string") {
    return rpcError(message.id ?? null, -32600, "Invalid Request", undefined, 400);
  }

  const id = message.id ?? null;
  switch (message.method) {
    case "initialize":
      return rpcResult(id, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
        instructions:
          "读取绯界任务单时，优先按准确 record_id 调用 read_crimson_record；完成内容后使用相同 record_id 调用 write_crimson_reply。不要修改原始记录，也不要写入其他记录。",
      });
    case "notifications/initialized":
    case "notifications/cancelled":
      return new Response(null, { status: 202, headers: corsHeaders });
    case "ping":
      return rpcResult(id, {});
    case "tools/list":
      return rpcResult(id, { tools });
    case "tools/call":
      return rpcResult(id, await callTool(request, message.params));
    default:
      return rpcError(id, -32601, `Method not found: ${message.method}`);
  }
}
