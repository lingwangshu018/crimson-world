"use client";

import { useRef, useState } from "react";
import {
  createTravelRecord,
  exportTravelRecords,
  importTravelRecords,
  readTravelRecords,
  updateTravelRecord,
} from "./travel-rabbit/travel-storage";
import type { TravelRecord } from "./travel-rabbit/travel-types";
import { startTravel } from "./travel-rabbit/travel-engine";
import "./travel-rabbit.css";

const OWNER_KEY = "crimson-tavern.vault-owner-key.v1";
const READ_KEY = "crimson-tavern.vault-read-key.v1";
const REPLY_KEY = "crimson-tavern.vault-note-key.v1";
const RECORDS_API_URL = "https://crimson-world.lingwangshu018.workers.dev/api/records";
const LEGACY_PROTOCOL_TOKENS = [
  "open_door",
  "look_around",
  "encounter",
  "bring_back_memory",
  "send_postcard",
];

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

function ensureVaultKeys() {
  let ownerKey = localStorage.getItem(OWNER_KEY) || "";
  let readKey = localStorage.getItem(READ_KEY) || "";
  let replyKey = localStorage.getItem(REPLY_KEY) || "";

  if (!ownerKey) {
    ownerKey = createVaultKey();
    localStorage.setItem(OWNER_KEY, ownerKey);
  }
  if (!readKey || readKey === ownerKey) {
    readKey = createVaultKey();
    localStorage.setItem(READ_KEY, readKey);
  }
  if (!replyKey || replyKey === ownerKey || replyKey === readKey) {
    replyKey = createVaultKey();
    localStorage.setItem(REPLY_KEY, replyKey);
  }

  return { ownerKey, readKey, replyKey };
}

function getTravelLetter(record?: TravelRecord | null) {
  const note = String(record?.note || "").trim();
  if (!note) return "";
  const normalized = note.toLowerCase();
  const protocolHits = LEGACY_PROTOCOL_TOKENS.filter((token) => normalized.includes(token)).length;
  return protocolHits >= 2 ? "" : note;
}

function formatTravelDate(value: string) {
  try {
    return new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function recordTitle(record: TravelRecord) {
  return `${record.city} · ${record.location}`;
}

function recordContent(record: TravelRecord) {
  return [
    `目的地：${record.continent}${record.country ? ` · ${record.country}` : ""} · ${record.city}`,
    `地点：${record.location}`,
    `遇见：${record.encounter.join("、")}`,
    `发现：${record.discoveries.join("、")}`,
    `带回：${record.souvenirs.join("、")}`,
    `品尝：${record.food.join("、")}`,
    `旅行记忆：${record.memory}`,
  ].join("\n");
}

export default function TravelRabbitRoom({ onClose }: { onClose?: () => void }) {
  const [record, setRecord] = useState(() => readTravelRecords()[0] ?? null);
  const [history, setHistory] = useState(() => readTravelRecords());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [receiving, setReceiving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function refreshHistory(preferredId?: string) {
    const records = readTravelRecords();
    setHistory(records);
    setRecord(
      preferredId
        ? records.find((item) => item.id === preferredId) ?? records[0] ?? null
        : records[0] ?? null,
    );
  }

  function beginTravel() {
    const result = startTravel();
    createTravelRecord(result);
    setExpandedId(result.id);
    refreshHistory(result.id);
  }

  function openHistoryRecord(item: TravelRecord) {
    setExpandedId((current) => (current === item.id ? null : item.id));
    setRecord(item);
  }

  async function syncTravelRecord(current: TravelRecord) {
    const keys = ensureVaultKeys();
    const now = new Date().toISOString();
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
            id: current.id,
            module: "travel-rabbit",
            title: recordTitle(current),
            summary: current.memory.slice(0, 240),
            content: recordContent(current),
            note: getTravelLetter(current),
            createdAt: current.createdAt,
            updatedAt: current.noteUpdatedAt || current.createdAt || now,
            noteUpdatedAt: current.noteUpdatedAt || null,
            metadata: {
              moduleName: "旅行小兔",
              continent: current.continent,
              country: current.country || null,
              city: current.city,
              location: current.location,
              encounter: current.encounter,
              discoveries: current.discoveries,
              souvenirs: current.souvenirs,
              food: current.food,
              source: "crimson-world.travel-rabbit.records.v1",
            },
          },
        ],
      }),
    });

    const data = (await response.json().catch(() => ({}))) as {
      error?: string;
      syncedIds?: string[];
    };
    if (!response.ok || !data.syncedIds?.includes(current.id)) {
      throw new Error(data.error || `同步失败（HTTP ${response.status}）`);
    }

    updateTravelRecord(current.id, (item) => ({ ...item, vaultSyncedAt: now }));
    refreshHistory(current.id);
    return keys;
  }

  async function sendToAI() {
    if (!record || sending) {
      if (!record) window.alert("请先让旅行小兔完成一次旅行。");
      return;
    }

    setSending(true);
    try {
      const { readKey, replyKey } = await syncTravelRecord(record);
      const displayNumber = `TR-${String(
        Math.max(1, history.findIndex((item) => item.id === record.id) + 1),
      ).padStart(4, "0")}`;
      const text = [
        "请读取我的绯界记录，并继续完成这一事件。",
        "",
        "【模块】",
        "旅行小兔",
        "",
        "【记录编号】",
        displayNumber,
        "",
        "【记录ID】",
        record.id,
        "",
        "【读取钥匙】",
        readKey,
        "",
        "【回复钥匙】",
        replyKey,
        "",
        "请先调用绯界工具 crimson_read_record，使用上面的记录ID与读取钥匙精确读取本次旅行。",
        "",
        "结合当前聊天已经加载的角色卡、世界书和近期记忆，把这次旅行写成一封完整的旅行信。信中应自然写到目的地、地点、遇见、发现、品尝与带回的纪念品，并保持绯界设定一致。",
        "",
        "完成后，请调用 crimson_write_reply，使用完全相同的记录ID与回复钥匙，将完整旅行信写回 note 字段。",
        "",
        "不要修改原始记录，不要创建新记录，不要回复其他记录。",
        "只处理这一条。",
      ].join("\n");

      await navigator.clipboard.writeText(text);
      window.alert("✨ 旅行记录已同步到绯界云端，任务单也复制好了。现在可以直接粘贴给 AI。");
    } catch (error) {
      const message = error instanceof Error ? error.message : "同步失败，请稍后重试。";
      window.alert(`旅行记录没有同步成功：${message}`);
    } finally {
      setSending(false);
    }
  }

  async function receiveNewNote() {
    if (!record || receiving) {
      if (!record) window.alert("还没有可以收取回信的旅行记录。");
      return;
    }

    setReceiving(true);
    try {
      const { ownerKey } = ensureVaultKeys();
      const response = await fetch(`${RECORDS_API_URL}?limit=250`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${ownerKey}`,
          "X-Crimson-Key": ownerKey,
          Accept: "application/json",
        },
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        records?: Array<{
          id?: string;
          module?: string;
          note?: string;
          noteUpdatedAt?: string | null;
        }>;
      };
      if (!response.ok) throw new Error(data.error || `收取失败（HTTP ${response.status}）`);

      const cloudRecord = (data.records || []).find(
        (item) => item.id === record.id && (!item.module || item.module === "travel-rabbit"),
      );
      const cloudNote = String(cloudRecord?.note || "").trim();
      const visibleCloudNote = getTravelLetter({ ...record, note: cloudNote });
      if (!visibleCloudNote) {
        window.alert("邮筒里暂时还没有这次旅行的新信。AI 写回后再来收取吧。");
        return;
      }

      const cloudUpdatedAt = cloudRecord?.noteUpdatedAt || new Date().toISOString();
      const localUpdatedAt = new Date(record.noteUpdatedAt || 0).getTime();
      if (
        visibleCloudNote === getTravelLetter(record) &&
        new Date(cloudUpdatedAt).getTime() <= localUpdatedAt
      ) {
        window.alert("没有发现比本机更新的旅行信。");
        return;
      }

      updateTravelRecord(record.id, (item) => ({
        ...item,
        note: visibleCloudNote,
        noteUpdatedAt: cloudUpdatedAt,
      }));
      refreshHistory(record.id);
      setExpandedId(record.id);
      window.alert("📬 新旅行信已经收取，并放回这次旅行记录里啦。");
    } catch (error) {
      const message = error instanceof Error ? error.message : "收取失败，请稍后重试。";
      window.alert(`新手记没有收取成功：${message}`);
    } finally {
      setReceiving(false);
    }
  }

  function handleExport() {
    const blob = new Blob([exportTravelRecords()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "travel-rabbit-records.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const records = JSON.parse(String(reader.result));
        if (Array.isArray(records)) {
          importTravelRecords(records);
          refreshHistory();
        }
      } catch {
        window.alert("没有识别到有效的旅行小兔档案。");
      }
    };
    reader.readAsText(file);
  }

  const currentLetter = getTravelLetter(record);

  return (
    <div className="travel-rabbit-room">
      <header className="travel-rabbit-hero">
        <div className="travel-rabbit-title">✦ 旅行小兔 ✦</div>
        <p>带着好奇出发，把远方的故事带回来。</p>
        <div className="travel-rabbit-avatar">🐰</div>
        <button type="button" onClick={beginTravel}>🚪 开始旅行</button>
      </header>

      <section className="travel-rabbit-card">
        <h2>✦ 今日旅行结果 ✦</h2>
        {record ? (
          <div className="travel-detail-list">
            <p>🌍 目的地：{record.continent} · {record.city}</p>
            <p>📍 地点：{record.location}</p>
            <p>👀 遇见：{record.encounter.join("、")}</p>
            <p>🔎 发现：{record.discoveries.join("、")}</p>
            <p>🎁 带回：{record.souvenirs.join("、")}</p>
            <p>🍰 品尝：{record.food.join("、")}</p>
            {currentLetter ? <p className="travel-current-letter">✉️ 旅行信：{currentLetter}</p> : null}
          </div>
        ) : <p>今天还没有旅行记录。</p>}

        <div className="travel-letter-actions">
          <button type="button" disabled={!record || sending} onClick={sendToAI}>
            {sending ? "正在同步……" : "📨 发送给 AI"}
          </button>
          <button type="button" disabled={!record || receiving} onClick={receiveNewNote}>
            {receiving ? "正在收取……" : "📬 收取新手记"}
          </button>
        </div>
      </section>

      <section className="travel-rabbit-card">
        <h2>🎒 小兔带回来的东西</h2>
        <p>{record?.souvenirs.join("、") ?? "旅行收获会显示在这里。"}</p>
      </section>

      <section className="travel-rabbit-card travel-history-section">
        <h2>📖 旅行历史</h2>
        {history.length ? history.map((item, index) => {
          const letter = getTravelLetter(item);
          const expanded = expandedId === item.id;
          return (
            <article className={`travel-history-entry ${expanded ? "is-open" : ""}`} key={item.id}>
              <button
                type="button"
                className="travel-history-summary"
                onClick={() => openHistoryRecord(item)}
                aria-expanded={expanded}
              >
                <span>
                  <small>TR-{String(index + 1).padStart(4, "0")} · {formatTravelDate(item.createdAt)}</small>
                  <strong>{item.city} · {item.location}</strong>
                  <em>{letter ? "已收到旅行信" : "等待旅行信"}</em>
                </span>
                <b aria-hidden="true">{expanded ? "−" : "＋"}</b>
              </button>

              {expanded ? (
                <div className="travel-history-detail">
                  <div className="travel-history-facts">
                    <p><span>目的地</span>{item.continent} · {item.city}</p>
                    <p><span>地点</span>{item.location}</p>
                    <p><span>遇见</span>{item.encounter.join("、")}</p>
                    <p><span>发现</span>{item.discoveries.join("、")}</p>
                    <p><span>带回</span>{item.souvenirs.join("、")}</p>
                    <p><span>品尝</span>{item.food.join("、")}</p>
                  </div>
                  <div className="travel-history-letter">
                    <h3>TRAVEL LETTER · 旅行信</h3>
                    {letter ? <p>{letter}</p> : <p className="is-empty">这封信还在路上。</p>}
                  </div>
                </div>
              ) : null}
            </article>
          );
        }) : <p>还没有历史旅行。</p>}
      </section>

      <section className="travel-data-actions">
        <input ref={inputRef} hidden type="file" accept="application/json" onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) handleImport(file);
          event.currentTarget.value = "";
        }} />
        <button type="button" onClick={() => inputRef.current?.click()}>导入记录</button>
        <button type="button" onClick={handleExport}>导出记录</button>
      </section>

      {onClose ? <button type="button" className="travel-back" onClick={onClose}>返回绯界</button> : null}
    </div>
  );
}
