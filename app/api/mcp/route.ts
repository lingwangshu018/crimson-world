const PROTOCOL_VERSION = "2025-11-25";
const SUPPORTED_PROTOCOL_VERSIONS = new Set([
  "2025-11-25",
  "2025-06-18",
  "2025-03-26",
]);
const SERVER_NAME = "crimson-world";
const SERVER_VERSION = "0.2.0";
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

const baseHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "Authorization, Content-Type, Accept, Origin, Mcp-Protocol-Version, Mcp-Method, Mcp-Name",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Expose-Headers": "Mcp-Protocol-Version",
  "Cache-Control": "no-store",
  Vary: "Origin",
};

const tools = [
  {
    name: "read_crimson_record",
    title: "读取绯界记录",
    description:
      "使用准确记录 ID 和读取钥匙，从绯界统一记录层读取一条记录。不得用相似结果替代目标记录。",
    inputSchema: {
      type: "object",
      properties: {
        record_id: { type: "string", description: "任务单中的准确记录 ID。" },
        read_key: { type: "string", description: "任务单中的 ctv1_... 读取钥匙。" },
      },
      required: ["record_id", "read_key"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
  },
  {
    name: "search_crimson_records",
    title: "搜索绯界记录",
    description:
      "按关键词搜索绯界记录。仅用于查找记录或排查同步状态；已有准确 ID 时应使用 read_crimson_record。",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "标题、关键词或记录 ID 片段。" },
        read_key: { type: "string", description: "任务单中的 ctv1_... 读取钥匙。" },
        module: { type: "string", description: "可选，例如 time-wheel。" },
        limit: {
          type: "integer",
          minimum: 1,
          maximum: 50,
          default: 10,
          description: "最多返回多少条。",
        },
      },
      required: ["query", "read_key"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
  },
  {
    name: "write_crimson_reply",
    title: "写回绯界回复",
    description:
      "使用回复钥匙，把完整最终回复追加到指定记录的 note。只能写入已有记录，不创建新记录，不覆盖原始 content。",
    inputSchema: {
      type: "object",
      properties: {
        record_id: { type: "string", description: "必须与读取时完全相同的记录 ID。" },
        reply_key: { type: "string", description: "任务单中的 ctv1_... 回复钥匙。" },
        content: {
          type: "string",
          maxLength: MAX_REPLY_LENGTH,
          description: "要写回 note 的完整最终回复，不要只写摘要。",
        },
      },
      required: ["record_id", "reply_key", "content"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
  },
] as const;

const resources = [
  {
    uri: "crimson://server/guide",
    name: "crimson-world-guide",
    title: "绯界 MCP 使用指南",
    description: "绯界记录读取、续写和同记录写回的标准流程。",
    mimeType: "text/markdown",
  },
  {
    uri: "crimson://server/security",
    name: "crimson-world-security",
    title: "绯界 MCP 安全边界",
    description: "三把钥匙的权限划分与 MCP 写回限制。",
    mimeType: "text/markdown",
  },
] as const;

const prompts = [
  {
    name: "continue_crimson_record",
    title: "继续完成绯界记录",
    description: "生成一条要求 AI 读取指定记录、结合会话设定续写并写回原记录的任务消息。",
    arguments: [
      { name: "record_id", description: "绯界记录 ID。", required: true },
      { name: "read_key", description: "读取钥匙。", required: true },
      { name: "reply_key", description: "回复钥匙。", required: true },
    ],
  },
] as const;

function json(data: unknown, status = 200, extraHeaders?: HeadersInit) {
  return Response.json(data, {
    status,
    headers: {
      ...baseHeaders,
      "Mcp-Protocol-Version": PROTOCOL_VERSION,
      ...extraHeaders,
    },
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
      error: { code, message, ...(data === undefined ? {} : { data }) },
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

function object(value: unknown): ToolArguments {
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
        text: details ? `${message}\n${JSON.stringify(details, null, 2)}` : message,
      },
    ],
    isError: true,
  };
}

function validOrigin(request: Request) {
  const origin = request.headers.get("Origin");
  if (!origin) return true;
  const ownOrigin = new URL(request.url).origin;
  const allowed = new Set([
    ownOrigin,
    "https://lingwangshu018.github.io",
    "https://chatgpt.com",
    "https://claude.ai",
  ]);
  return allowed.has(origin);
}

function protocolError(request: Request, method: string) {
  if (method === "initialize") return null;
  const requested = request.headers.get("Mcp-Protocol-Version");
  if (!requested) return null;
  if (!SUPPORTED_PROTOCOL_VERSIONS.has(requested)) {
    return rpcError(
      null,
      -32600,
      "Unsupported MCP protocol version",
      { supported: [...SUPPORTED_PROTOCOL_VERSIONS] },
      400,
    );
  }
  return null;
}

async function recordsRequest(
  request: Request,
  method: "GET" | "POST",
  accessKey: string,
  query = "",
  body?: unknown,
) {
  const url = new URL(`/api/records${query}`, new URL(request.url).origin);
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
  const records = Array.isArray(data.records) ? (data.records as CrimsonRecord[]) : [];
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
      "结合当前聊天已加载的角色卡、世界书和近期记忆继续完成此记录。完成后调用 write_crimson_reply，并使用完全相同的 record_id 写回完整最终回复。",
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
  const records = Array.isArray(data.records) ? (data.records as CrimsonRecord[]) : [];
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
    return toolError(`单次写回最多 ${MAX_REPLY_LENGTH} 字，当前为 ${content.length} 字。`);
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
  const source = object(params);
  const name = text(source.name, 100);
  const args = object(source.arguments);
  try {
    if (name === "read_crimson_record") return await readRecord(request, args);
    if (name === "search_crimson_records") return await searchRecords(request, args);
    if (name === "write_crimson_reply") return await writeReply(request, args);
    throw new Error(`未知工具：${name || "（空）"}`);
  } catch (error) {
    return toolError(error instanceof Error ? error.message : String(error));
  }
}

function readResource(uri: string) {
  if (uri === "crimson://server/guide") {
    return `# 绯界 MCP 使用指南

1. 使用任务单中的 record_id 与 read_key 调用 read_crimson_record。
2. 结合当前聊天中的角色卡、世界书和近期记忆完成内容。
3. 使用完全相同的 record_id、任务单中的 reply_key 调用 write_crimson_reply。
4. 不修改原始 content，不创建新记录，不写入其他记录。`;
  }
  if (uri === "crimson://server/security") {
    return `# 绯界 MCP 安全边界

- 主人钥匙仅由绯界网页用于同步，MCP 工具不接收主人钥匙。
- 读取钥匙只能读取或搜索记录。
- 回复钥匙只能向已有记录的 note 追加内容。
- 服务端按记录 ID 精确匹配，并阻止跨记录写回。
- 重复的完整回复会被识别，避免重复追加。`;
  }
  return null;
}

function getPrompt(params: unknown) {
  const source = object(params);
  const name = text(source.name, 100);
  if (name !== "continue_crimson_record") return null;
  const args = object(source.arguments);
  const recordId = text(args.record_id, 160);
  const readKey = key(args.read_key, "读取钥匙");
  const replyKey = key(args.reply_key, "回复钥匙");
  if (!recordId) throw new Error("record_id 不能为空。");
  return {
    description: "读取指定绯界记录，完成续写，并把完整结果写回同一记录。",
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: [
            "请处理这一条绯界记录。",
            `记录 ID：${recordId}`,
            `读取钥匙：${readKey}`,
            `回复钥匙：${replyKey}`,
            "",
            "先调用 read_crimson_record 精确读取记录。",
            "结合当前聊天中的角色卡、世界书和近期记忆继续完成内容。",
            "完成后调用 write_crimson_reply，使用相同记录 ID 写回完整最终回复。",
            "不要修改原始记录、创建新记录或写入其他记录。",
          ].join("\n"),
        },
      },
    ],
  };
}

export function OPTIONS(request: Request) {
  if (!validOrigin(request)) return new Response(null, { status: 403, headers: baseHeaders });
  return new Response(null, { status: 204, headers: baseHeaders });
}

export function GET(request: Request) {
  if (!validOrigin(request)) {
    return rpcError(null, -32000, "Forbidden Origin", undefined, 403);
  }
  return new Response(null, {
    status: 405,
    headers: {
      ...baseHeaders,
      Allow: "POST, DELETE, OPTIONS",
      "Mcp-Protocol-Version": PROTOCOL_VERSION,
    },
  });
}

export function DELETE(request: Request) {
  if (!validOrigin(request)) {
    return rpcError(null, -32000, "Forbidden Origin", undefined, 403);
  }
  return new Response(null, { status: 204, headers: baseHeaders });
}

export async function POST(request: Request) {
  if (!validOrigin(request)) {
    return rpcError(null, -32000, "Forbidden Origin", undefined, 403);
  }

  let message: JsonRpcRequest;
  try {
    message = (await request.json()) as JsonRpcRequest;
  } catch {
    return rpcError(null, -32700, "Parse error", undefined, 400);
  }

  if (message.jsonrpc !== "2.0" || typeof message.method !== "string") {
    return rpcError(message.id ?? null, -32600, "Invalid Request", undefined, 400);
  }

  const method = message.method;
  const versionFailure = protocolError(request, method);
  if (versionFailure) return versionFailure;

  const isNotification = message.id === undefined;
  if (isNotification) {
    if (
      method === "notifications/initialized" ||
      method === "notifications/cancelled" ||
      method === "notifications/progress"
    ) {
      return new Response(null, { status: 202, headers: baseHeaders });
    }
    return new Response(null, { status: 202, headers: baseHeaders });
  }

  const id = message.id ?? null;
  switch (method) {
    case "initialize": {
      const params = object(message.params);
      const requested = text(params.protocolVersion, 40);
      const negotiated = SUPPORTED_PROTOCOL_VERSIONS.has(requested)
        ? requested
        : PROTOCOL_VERSION;
      return rpcResult(id, {
        protocolVersion: negotiated,
        capabilities: {
          tools: { listChanged: false },
          resources: { subscribe: false, listChanged: false },
          prompts: { listChanged: false },
        },
        serverInfo: {
          name: SERVER_NAME,
          title: "绯界 MCP",
          version: SERVER_VERSION,
          description: "读取绯界记录并将完整回复安全写回同一记录。",
          websiteUrl: "https://lingwangshu018.github.io/crimson-world/",
        },
        instructions:
          "优先按准确 record_id 调用 read_crimson_record；完成后使用相同 record_id 调用 write_crimson_reply。不要修改原始记录，也不要写入其他记录。",
      });
    }
    case "ping":
      return rpcResult(id, {});
    case "tools/list":
      return rpcResult(id, { tools });
    case "tools/call": {
      const params = object(message.params);
      const name = text(params.name, 100);
      if (!name) return rpcError(id, -32602, "Invalid params: tool name is required");
      if (!tools.some((tool) => tool.name === name)) {
        return rpcError(id, -32602, `Unknown tool: ${name}`);
      }
      return rpcResult(id, await callTool(request, params));
    }
    case "resources/list":
      return rpcResult(id, { resources });
    case "resources/read": {
      const params = object(message.params);
      const uri = text(params.uri, 500);
      if (!uri) return rpcError(id, -32602, "Invalid params: uri is required");
      const content = readResource(uri);
      if (content === null) return rpcError(id, -32002, `Resource not found: ${uri}`);
      return rpcResult(id, {
        contents: [{ uri, mimeType: "text/markdown", text: content }],
      });
    }
    case "resources/templates/list":
      return rpcResult(id, { resourceTemplates: [] });
    case "prompts/list":
      return rpcResult(id, { prompts });
    case "prompts/get": {
      try {
        const prompt = getPrompt(message.params);
        if (!prompt) return rpcError(id, -32602, "Unknown prompt");
        return rpcResult(id, prompt);
      } catch (error) {
        return rpcError(
          id,
          -32602,
          error instanceof Error ? error.message : String(error),
        );
      }
    }
    case "completion/complete":
      return rpcResult(id, { completion: { values: [], total: 0, hasMore: false } });
    default:
      return rpcError(id, -32601, `Method not found: ${method}`);
  }
}
