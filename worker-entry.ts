import { setD1 } from "./db";
import {
  GET as vaultGET,
  OPTIONS as vaultOPTIONS,
  PATCH as vaultPATCH,
  POST as vaultPOST,
  PUT as vaultPUT,
} from "./app/api/vault/route";
import {
  GET as recordsGET,
  OPTIONS as recordsOPTIONS,
  PATCH as recordsPATCH,
  POST as recordsPOST,
  PUT as recordsPUT,
} from "./app/api/records/route";
import {
  DELETE as mcpDELETE,
  GET as mcpGET,
  OPTIONS as mcpOPTIONS,
  POST as mcpPOST,
} from "./app/api/mcp/route";
import {
  GET as wishesGET,
  OPTIONS as wishesOPTIONS,
  POST as wishesPOST,
} from "./app/api/wishes/route";

type Env = {
  DB: D1Database;
  ASSETS: Fetcher;
};

function methodNotAllowed(allow: string) {
  return Response.json(
    { error: "不支持这种请求方式。" },
    {
      status: 405,
      headers: {
        Allow: allow,
        "Cache-Control": "no-store",
      },
    },
  );
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method.toUpperCase();

    if (url.pathname === "/api/vault" || url.pathname === "/api/vault/") {
      setD1(env.DB);
      switch (method) {
        case "OPTIONS": return vaultOPTIONS();
        case "GET": return vaultGET(request);
        case "PUT": return vaultPUT(request);
        case "POST": return vaultPOST(request);
        case "PATCH": return vaultPATCH(request);
        default: return methodNotAllowed("GET, POST, PUT, PATCH, OPTIONS");
      }
    }

    if (url.pathname === "/api/records" || url.pathname === "/api/records/") {
      setD1(env.DB);
      switch (method) {
        case "OPTIONS": return recordsOPTIONS();
        case "GET": return recordsGET(request);
        case "PUT": return recordsPUT(request);
        case "POST": return recordsPOST(request);
        case "PATCH": return recordsPATCH(request);
        default: return methodNotAllowed("GET, POST, PUT, PATCH, OPTIONS");
      }
    }

    if (url.pathname === "/api/mcp" || url.pathname === "/api/mcp/") {
      setD1(env.DB);
      switch (method) {
        case "OPTIONS": return mcpOPTIONS(request);
        case "GET": return mcpGET(request);
        case "POST": return mcpPOST(request);
        case "DELETE": return mcpDELETE(request);
        default: return methodNotAllowed("GET, POST, DELETE, OPTIONS");
      }
    }

    if (url.pathname === "/api/wishes" || url.pathname === "/api/wishes/") {
      setD1(env.DB);
      switch (method) {
        case "OPTIONS": return wishesOPTIONS();
        case "GET": return wishesGET();
        case "POST": return wishesPOST(request);
        default: return methodNotAllowed("GET, POST, OPTIONS");
      }
    }

    return env.ASSETS.fetch(request);
  },
};
