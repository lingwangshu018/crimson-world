"use client";

import { useEffect } from "react";
import "./time-wheel-room.css";

type TimeWheelRoomProps = { onClose: () => void };

type TimeWheelHistoryItem = {
  id?: string;
  module_name?: string;
  topic?: string;
};

const THEME_ID = "crimson-world-time-wheel-theme";
const LOCAL_SEND_BOUND = "crimsonLocalAiSendBound";
const HISTORY_KEY = "public_tm_history_v2";
const READ_KEY = "crimson-tavern.vault-read-key.v1";
const REPLY_KEY = "crimson-tavern.vault-note-key.v1";

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
      const value = JSON.parse(frameWindow.localStorage.getItem(HISTORY_KEY) || "[]");
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  }

  async function copyPrompt(frameWindow: Window, text: string) {
    try {
      await frameWindow.navigator.clipboard.writeText(text);
      const status = frameWindow.document.querySelector<HTMLElement>(".tm-ai-status");
      if (status) status.textContent = "AI 任务单已复制，可以直接粘贴给 AI。";
    } catch {
      frameWindow.prompt("复制这段 AI 任务单：", text);
    }
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
          const target = event.target;
          if (!(target instanceof frameWindow.Element)) return;
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
            const status = doc.querySelector<HTMLElement>(".tm-ai-status");
            if (status) status.textContent = "没有找到这条记录。";
            return;
          }

          const readKey = frameWindow.localStorage.getItem(READ_KEY) || "";
          const replyKey = frameWindow.localStorage.getItem(REPLY_KEY) || "";
          const displayNumber = `TW-${String(Math.max(1, history.length - index)).padStart(4, "0")}`;
          const prompt = [
            "请读取我的绯界记录，并继续完成这一事件。",
            "",
            "模块：时光之轮",
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
            "请读取这条记录的完整内容。",
            "",
            "结合当前聊天已经加载的：",
            "- 角色卡",
            "- 世界书",
            "- 近期记忆",
            "",
            "继续完成这一事件。",
            "",
            "完成后，请使用回复钥匙，将完整回复写回本条记录的 note 字段。",
            "",
            "请不要：",
            "• 修改原始记录",
            "• 创建新的记录",
            "• 回复到其它记录",
            "",
            "只处理这一条记录即可。",
          ].join("\n");

          void copyPrompt(frameWindow, prompt);
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
