import fs from "node:fs";

const path = new URL("../app/api/mcp/route.ts", import.meta.url);
let source = fs.readFileSync(path, "utf8");

const marker = "CRIMSON_MCP_DIRECT_RECORDS_CALL";
if (source.includes(marker)) {
  console.log("MCP already calls the records route directly.");
  process.exit(0);
}

const importAnchor = 'const PROTOCOL_VERSION = "2025-11-25";';
if (!source.includes(importAnchor)) {
  throw new Error("MCP route import anchor not found");
}
source = source.replace(
  importAnchor,
  `import { GET as recordsGET, POST as recordsPOST } from "../records/route";\n\n// ${marker}\n${importAnchor}`,
);

const requestPattern = /async function recordsRequest\([\s\S]*?\n}\n\nasync function readRecord/;
if (!requestPattern.test(source)) {
  throw new Error("MCP recordsRequest function not found");
}

const replacement = `async function recordsRequest(
  request: Request,
  method: "GET" | "POST",
  accessKey: string,
  query = "",
  body?: unknown,
) {
  const url = new URL(\`/api/records\${query}\`, new URL(request.url).origin);
  const internalRequest = new Request(url, {
    method,
    headers: {
      Authorization: \`Bearer \${accessKey}\`,
      "X-Crimson-Key": accessKey,
      Accept: "application/json",
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const response = method === "GET"
    ? await recordsGET(internalRequest)
    : await recordsPOST(internalRequest);
  const raw = await response.text();
  let data: Record<string, unknown> = {};
  try {
    data = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
  } catch {
    data = { error: raw || \`HTTP \${response.status}\` };
  }
  if (!response.ok) {
    throw new Error(text(data.error || data.message, 500) || \`HTTP \${response.status}\`);
  }
  return data;
}

async function readRecord`;

source = source.replace(requestPattern, replacement);
fs.writeFileSync(path, source);
console.log("MCP now calls the records route directly without a Worker self-fetch.");
