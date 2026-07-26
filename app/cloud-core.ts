export type CloudModuleId = "tavern" | "journal" | "wheel" | "cafe";

export type CloudRecord = {
  id: string;
  module?: string;
  note?: string;
  noteUpdatedAt?: string | null;
  [key: string]: unknown;
};

type CloudConfig = {
  apiUrl: string;
  ownerKey: string;
  readKey: string;
  replyKey: string;
};

type VaultResponse = {
  access?: string;
  error?: string;
  records?: CloudRecord[];
  settings?: Record<string, unknown>;
  syncedAt?: string;
};

const OWNER_KEY = "crimson-tavern.vault-owner-key.v1";
const READ_KEY = "crimson-tavern.vault-read-key.v1";
const REPLY_KEY = "crimson-tavern.vault-note-key.v1";
const API_URL_KEY = "crimson-world.vault-api-url.v1";
const DEFAULT_API_URL =
  "https://crimson-tavern.boarder-72pound.chatgpt.site/api/vault";
const KEY_PATTERN = /^ctv1_[A-Za-z0-9_-]{43}$/;

export class CloudCoreError extends Error {
  code: "NOT_CONFIGURED" | "READ_FAILED" | "SYNC_FAILED";

  constructor(
    code: CloudCoreError["code"],
    message: string,
  ) {
    super(message);
    this.name = "CloudCoreError";
    this.code = code;
  }
}

function getCloudConfig(): CloudConfig {
  const ownerKey = localStorage.getItem(OWNER_KEY) || "";
  const readKey = localStorage.getItem(READ_KEY) || "";
  const replyKey = localStorage.getItem(REPLY_KEY) || "";
  const apiUrl = localStorage.getItem(API_URL_KEY) || DEFAULT_API_URL;

  if (
    !KEY_PATTERN.test(ownerKey) ||
    !KEY_PATTERN.test(readKey) ||
    !KEY_PATTERN.test(replyKey)
  ) {
    throw new CloudCoreError(
      "NOT_CONFIGURED",
      "请先在绯界控制中心完成云端配置。",
    );
  }

  return { apiUrl, ownerKey, readKey, replyKey };
}

function belongsToModule(record: CloudRecord, moduleId: CloudModuleId) {
  if (record.module === moduleId) return true;
  const id = String(record.id || "");
  if (moduleId === "cafe") return id.startsWith("cafe-");
  if (moduleId === "journal") return id.startsWith("journal-") || id.startsWith("jr-");
  if (moduleId === "wheel") return id.startsWith("wheel-") || id.startsWith("tw-");
  return !record.module && !id.startsWith("cafe-") && !id.startsWith("journal-") && !id.startsWith("jr-") && !id.startsWith("wheel-") && !id.startsWith("tw-");
}

async function readVault(config: CloudConfig): Promise<VaultResponse> {
  const response = await fetch(`${config.apiUrl}?limit=500`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${config.ownerKey}`,
      Accept: "application/json",
    },
  });
  const result = (await response.json()) as VaultResponse;
  if (!response.ok || result.access !== "owner") {
    throw new CloudCoreError(
      "READ_FAILED",
      result.error || "无法读取绯界云端记录。",
    );
  }
  return result;
}

export async function syncModuleRecords(
  moduleId: CloudModuleId,
  moduleRecords: CloudRecord[],
): Promise<{ syncedAt: string | null; recordCount: number }> {
  const config = getCloudConfig();
  const existing = await readVault(config);
  const preserved = (existing.records || []).filter(
    (record) => !belongsToModule(record, moduleId),
  );
  const normalized = moduleRecords.map((record) => ({
    ...record,
    module: moduleId,
  }));

  const response = await fetch(config.apiUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${config.ownerKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      readKey: config.readKey,
      noteKey: config.replyKey,
      settings: existing.settings || {},
      records: [...preserved, ...normalized],
    }),
  });
  const result = (await response.json()) as VaultResponse;
  if (!response.ok) {
    throw new CloudCoreError(
      "SYNC_FAILED",
      result.error || "绯界云端同步失败。",
    );
  }

  return {
    syncedAt: result.syncedAt || null,
    recordCount: normalized.length,
  };
}

export async function collectModuleNotes<T extends CloudRecord>(
  moduleId: CloudModuleId,
  localRecords: T[],
): Promise<{ records: T[]; updatedCount: number }> {
  const config = getCloudConfig();
  const result = await readVault(config);
  const cloudById = new Map(
    (result.records || [])
      .filter((record) => belongsToModule(record, moduleId))
      .map((record) => [record.id, record]),
  );

  let updatedCount = 0;
  const records = localRecords.map((record) => {
    const cloud = cloudById.get(record.id);
    if (!cloud) return record;
    const cloudNote = typeof cloud.note === "string" ? cloud.note : "";
    const cloudTime =
      typeof cloud.noteUpdatedAt === "string" ? cloud.noteUpdatedAt : null;
    const localTime =
      typeof record.noteUpdatedAt === "string" ? record.noteUpdatedAt : null;

    if (
      cloudNote &&
      cloudNote !== String(record.note || "") &&
      new Date(cloudTime || 0).getTime() >= new Date(localTime || 0).getTime()
    ) {
      updatedCount += 1;
      return {
        ...record,
        note: cloudNote,
        noteUpdatedAt: cloudTime,
      };
    }
    return record;
  });

  return { records, updatedCount };
}

export function cloudErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "绯界云端暂时不可用。";
}
