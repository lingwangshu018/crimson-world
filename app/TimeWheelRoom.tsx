"use client";

import { useEffect } from "react";
import "./time-wheel-room.css";

type TimeWheelRoomProps = { onClose: () => void };

type TimeWheelHistoryItem = {
  id?: string;
  module_id?: string;
  module_name?: string;
  topic?: string;
  content?: string;
  created_at?: number | string;
};

const THEME_ID = "crimson-world-time-wheel-theme";
const LOCAL_SEND_BOUND = "crimsonLocalAiSendBound";
const HISTORY_KEY = "public_tm_history_v2";
const OWNER_KEY = "crimson-tavern.vault-owner-key.v1";
const READ_KEY = "crimson-tavern.vault-read-key.v1";
const REPLY_KEY = "crimson-tavern.vault-note-key.v1";
const RECORDS_API_URL =
  "https://crimson-tavern.boarder-72pound.chatgpt.site/api/records";

function createVaultKey() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
  return `ctv1_${window
    .btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "")}`;
}

function ensureVaultKeys(frameWindow: Window) {
  const storage = frameWindow.localStorage;
  let ownerKey = storage.getItem(OWNER_KEY) || "";
  let readKey = storage.getItem(READ_KEY) || "";
  let replyKey = storage.getItem(REPLY_KEY) || "";

  if (!ownerKey) {
    ownerKey = createVaultKey();
    storage.setItem(OWNER_KEY, ownerKey);
  }
  if (!readKey || readKey === ownerKey) {
    readKey = createVaultKey();
    storage.setItem(READ_KEY, readKey);
  }
  if (!replyKey || replyKey === ownerKey || replyKey === readKey) {
    replyKey = createVaultKey();
    storage.setItem(REPLY_KEY, replyKey);
  }

  return { ownerKey, readKey, replyKey };
}

function asIsoDate(value: number | string | undefined) {
  if (typeof value === "number") return new Date(value).toISOString();
  if (typeof value === "string" && !Number.isNaN(new Date(value).getTime())) {
    return new Date(value).toISOString();
  }
  return new Date().toISOString();
}

export function TimeWheelRoom({ onClose }: TimeWheelRoomProps) {
  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.data?.type === "crimson:close-time-wheel") onClose();
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [onClose]);

  const base = import.meta.env.BASE_URL || "/";
  const src = `${base}time-wheel/index.html`;
  const backgroundUrl = `${base}assets/time-wheel-bg.webp`;

  function readHistory(frameWindow: Window): TimeWheelHistoryItem[] {
    try {
      const value = JSON.parse(
        frameWindow.localStorage.getItem(HISTORY_KEY) || "[]",
      );
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  }

  function setStatus(doc: Document, value: string) {
    const status = doc.querySelector<HTMLElement>(".tm-ai-status");
    if (status) status.textContent = value;
  }

  async function copyPrompt(frameWindow: Window, text: string) {
    try {
      await frameWindow.navigator.clipboard.writeText(text);
      setStatus(
        frameWindow.document,
        "已同步到绯界统一记录层，AI 任务单也已复制。",
      );
    } catch {
      frameWindow.prompt("复制这段 AI 任务单：", text);
    }
  }

  async function syncTimeWheelRecord(
    frameWindow: Window,
    item: TimeWheelHistoryItem,
  ) {
    const keys = ensureVaultKeys(frameWindow);
    const createdAt = asIsoDate(item.created_at);
    const title = [item.module_name || "时光之轮", item.topic]
      .filter(Boolean)
      .join(" · ");

    const response = await fetch(RECORDS_API_URL, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${keys.ownerKey}`,
        "X-Crimson-Key": keys.ownerKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        readKey: keys.readKey,
        replyKey: keys.replyKey,
        records: [
          {
            id: String(item.id),
            module: "time-wheel",
            title: title || "时光之轮记录",
            summary: item.topic || "",
            content: String(item.content || ""),
            note: "",
            createdAt,
            updatedAt: createdAt,
            noteUpdatedAt: null,
            metadata: {
              moduleId: item.module_id || null,
              moduleName: item.module_name || "时光之轮",
              topic: item.topic || "",
              source: "public_tm_history_v2",
            },
          },
        ],
      }),
    });

    const data = (await response.json().catch(() => ({}))) as {
      error?: string;
    };
    if (!response.ok) {
      throw new Error(data.error || `同步失败（HTTP ${response.status}）`);
    }

    return keys;
  }

  function bindLocalAISend(frame: HTMLIFrameElement) {
    try {
      const frameWindow = frame.contentWindow;
      const doc = frame.contentDocument;
      if (!frameWindow || !doc?.body) return;
      if (doc.body.dataset[LOCAL_SEND_BOUND] === "1") return;
      doc.body.dataset[LOCAL_SEND_BOUND] = "1";

      doc.addEventListener(
        "click",
        (event) => {
          const target = event.target as Element | null;
          if (!target || typeof target.closest !== "function") return;

          const button = target.closest("button.tm-send");
          if (!button) return;

          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();

          const card = button.closest(".history-card");
          const cards = Array.from(doc.querySelectorAll(".history-card"));
          const index = card ? cards.indexOf(card) : -1;
          const history = readHistory(frameWindow);
          const item = index >= 0 ? history[index] : undefined;
          if (!item?.id) {
            setStatus(doc, "没有找到这条记录。");
            return;
          }
          if (!item.content) {
            setStatus(doc, "这条记录没有可同步的完整内容。");
            return;
          }

          setStatus(doc, "正在同步到绯界统一记录层……");

          void (async () => {
            try {
              const { readKey, replyKey } = await syncTimeWheelRecord(
                frameWindow,
                item,
              );
              const displayNumber = `TW-${String(
                Math.max(1, history.length - index),
              ).padStart(4, "0")}`;
              const prompt = [
                "请读取我的绯界记录，并继续完成这一事件。",
                "",
                "【模块】",
                "时光之轮",
                "",
                "【记录编号】",
                displayNumber,
                "",
                "【记录ID】",
                String(item.id),
                "",
                "【读取钥匙】",
                readKey,
                "",
                "【回复钥匙】",
                replyKey,
                "",
                "请先调用绯界 MCP 工具 read_crimson_record，精确读取这条记录的完整内容。",
                "",
                "结合当前聊天已经加载的：",
                "- 角色卡",
                "- 世界书",
                "- 近期记忆",
                "",
                "继续完成这一事件。",
                "",
                "完成后，请调用 write_crimson_reply，使用完全相同的记录ID，将完整回复写回本条记录的 note 字段。",
                "",
                "请不要：",
                "• 修改原始记录",
                "• 创建新的记录",
                "• 回复到其它记录",
                "",
                "只处理这一条记录即可。",
              ].join("\n");

              await copyPrompt(frameWindow, prompt);
            } catch (error) {
              setStatus(
                doc,
                error instanceof Error
                  ? `同步失败：${error.message}`
                  : "同步失败，请稍后重试。",
              );
            }
          })();
        },
        true,
      );
    } catch {
      // Keep the room available even if the embedded page cannot be accessed.
    }
  }

  function applyCrimsonTheme(frame: HTMLIFrameElement) {
    try {
      const doc = frame.contentDocument;
      if (!doc?.head || !doc.body) return;

      doc.getElementById(THEME_ID)?.remove();

      const style = doc.createElement("style");
      style.id = THEME_ID;
      style.textContent = `
        :root { color-scheme: dark !important; }
        html, body {
          min-height: 100%;
          background-color: #080405 !important;
          color: #f6eadf !important;
        }
        body {
          position: relative !important;
          overflow-x: hidden;
          background-image:
            linear-gradient(rgba(8,4,5,.16), rgba(8,4,5,.34)),
            url("${backgroundUrl}") !important;
          background-size: cover !important;
          background-position: center center !important;
          background-repeat: no-repeat !important;
          background-attachment: fixed !important;
        }
        main, #root, #app, .app, .page, .container {
          background: transparent !important;
        }
        .header {
          position: sticky !important;
          top: 0 !important;
          z-index: 10 !important;
          color: #f2dfbd !important;
          background: linear-gradient(180deg, rgba(31,11,17,.94), rgba(18,7,11,.84)) !important;
          border-bottom: 1px solid rgba(203,168,107,.34) !important;
          backdrop-filter: blur(14px);
        }
        .card, .modal-content {
          color: #f6eadf !important;
          border: 1px solid rgba(224,190,164,.22) !important;
          background: rgba(24,11,16,.66) !important;
          box-shadow: 0 22px 60px rgba(0,0,0,.26) !important;
          backdrop-filter: blur(9px);
        }
        button, input, select, textarea {
          color: #f6eadf !important;
          border-color: rgba(224,190,164,.28) !important;
          background-color: rgba(29,14,20,.74) !important;
        }
        @media (max-width: 700px) {
          body {
            background-position: 60% center !important;
          }
        }
      `;
      doc.head.appendChild(style);
      bindLocalAISend(frame);
    } catch {
      // The outer room remains usable if iframe access is unavailable.
    }
  }

  return (
    <section className="time-wheel-room" aria-label="时光之轮">
      <iframe
        className="time-wheel-frame"
        src={src}
        title="时光之轮"
        allow="clipboard-write"
        onLoad={(event) => applyCrimsonTheme(event.currentTarget)}
      />
    </section>
  );
}
