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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [letterDrafts, setLetterDrafts] = useState<Record<string, string>>({});
  const [recordCode, setRecordCode] = useState("");
  const [sending, setSending] = useState(false);
  const [receiving, setReceiving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const longPressTimer = useRef<number | null>(null);

  function refreshHistory(preferredId?: string) {
    const records = readTravelRecords();
    setHistory(records);
    setRecord(
      preferredId
        ? records.find((item) => item.id === preferredId) ?? records[0] ?? null
        : records[0] ?? null,
    );
  }

  function displayCode(index: number) {
    return `TR-${String(history.length - index).padStart(4, "0")}`;
  }

  function codeForRecord(item: TravelRecord) {
    const index = history.findIndex((entry) => entry.id === item.id);
    return index >= 0 ? displayCode(index) : "";
  }

  function findRecordByCode(value = recordCode) {
    const normalized = value.trim().toUpperCase();
    const match = /^TR-(\d{1,4})$/.exec(normalized);
    if (!match) return null;
    const number = Number(match[1]);
    if (!Number.isInteger(number) || number < 1 || number > history.length) return null;
    return history[history.length - number] ?? null;
  }

  async function fillRecordCode(item: TravelRecord) {
    const code = codeForRecord(item);
    if (!code) return;
    setRecordCode(code);
    setRecord(item);
    setExpandedId(item.id);
    try {
      await navigator.clipboard.writeText(code);
      window.alert(`${code} 已填入并复制。`);
    } catch {
      window.alert(`${code} 已填入。`);
    }
  }

  function startCodeLongPress(item: TravelRecord) {
    cancelCodeLongPress();
    longPressTimer.current = window.setTimeout(() => {
      void fillRecordCode(item);
      longPressTimer.current = null;
    }, 520);
  }

  function cancelCodeLongPress() {
    if (longPressTimer.current !== null) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }

  function beginTravel() {
    const result = startTravel();
    createTravelRecord(result);
    setExpandedId(result.id);
    setEditingId(null);
    refreshHistory(result.id);
  }

  function openHistoryRecord(item: TravelRecord) {
    setExpandedId((current) => (current === item.id ? null : item.id));
    setRecord(item);
  }

  function startWritingLetter(item: TravelRecord) {
    setExpandedId(item.id);
    setRecord(item);
    setLetterDrafts((previous) => ({
      ...previous,
      [item.id]: previous[item.id] ?? getTravelLetter(item),
    }));
    setEditingId(item.id);
  }

  function cancelWritingLetter(item: TravelRecord) {
    setLetterDrafts((previous) => ({
      ...previous,
      [item.id]: getTravelLetter(item),
    }));
    setEditingId(null);
  }

  function saveManualLetter(item: TravelRecord) {
    const note = String(letterDrafts[item.id] ?? "").trim();
    if (!note) {
      window.alert("旅行信还是空的，先写一点内容再保存吧。");
      return;
    }

    const noteUpdatedAt = new Date().toISOString();
    updateTravelRecord(item.id, (current) => ({
      ...current,
      note,
      noteUpdatedAt,
      vaultSyncedAt: null,
    }));
    setEditingId(null);
    setExpandedId(item.id);
    refreshHistory(item.id);
    window.alert("✍️ 旅行信已经保存到这次旅行记录里啦。");
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

  async function sendToAI(target?: TravelRecord | null) {
    const current = target ?? record;
    if (!current || sending) {
      if (!current) window.alert("请先输入或长按选择一条旅行编号。");
      return;
    }

    setSending(true);
    try {
      setRecord(current);
      setExpandedId(current.id);
      const { readKey, replyKey } = await syncTravelRecord(current);
      const displayNumber = codeForRecord(current);
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
        current.id,
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

  async function receiveNewNote(target?: TravelRecord | null) {
    const current = target ?? record;
    if (!current || receiving) {
      if (!current) window.alert("请先输入或长按选择一条旅行编号。");
      return;
    }

    setReceiving(true);
    try {
      setRecord(current);
      setExpandedId(current.id);
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
        (item) => item.id === current.id && (!item.module || item.module === "travel-rabbit"),
      );
      const cloudNote = String(cloudRecord?.note || "").trim();
      const visibleCloudNote = getTravelLetter({ ...current, note: cloudNote });
      if (!visibleCloudNote) {
        window.alert("邮筒里暂时还没有这次旅行的新信。AI 写回后再来收取吧。");
        return;
      }

      const cloudUpdatedAt = cloudRecord?.noteUpdatedAt || new Date().toISOString();
      const localUpdatedAt = new Date(current.noteUpdatedAt || 0).getTime();
      if (
        visibleCloudNote === getTravelLetter(current) &&
        new Date(cloudUpdatedAt).getTime() <= localUpdatedAt
      ) {
        window.alert("没有发现比本机更新的旅行信。");
        return;
      }

      updateTravelRecord(current.id, (item) => ({
        ...item,
        note: visibleCloudNote,
        noteUpdatedAt: cloudUpdatedAt,
      }));
      setLetterDrafts((previous) => ({ ...previous, [current.id]: visibleCloudNote }));
      setEditingId(null);
      refreshHistory(current.id);
      setExpandedId(current.id);
      window.alert("📬 新旅行信已经收取，并放回这次旅行记录里啦。");
    } catch (error) {
      const message = error instanceof Error ? error.message : "收取失败，请稍后重试。";
      window.alert(`新手记没有收取成功：${message}`);
    } finally {
      setReceiving(false);
    }
  }

  function sendSelectedCode() {
    const selected = findRecordByCode();
    if (!selected) {
      window.alert("没有找到这个旅行编号。请输入例如 TR-0001，或长按历史记录中的编号自动填入。");
      return;
    }
    void sendToAI(selected);
  }

  function receiveSelectedCode() {
    const selected = findRecordByCode();
    if (!selected) {
      window.alert("没有找到这个旅行编号。请输入例如 TR-0001，或长按历史记录中的编号自动填入。");
      return;
    }
    void receiveNewNote(selected);
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
          setEditingId(null);
          setLetterDrafts({});
          setRecordCode("");
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
      </section>

      <section className="travel-rabbit-card">
        <h2>🎒 小兔带回来的东西</h2>
        <p>{record?.souvenirs.join("、") ?? "旅行收获会显示在这里。"}</p>
      </section>

      <section className="travel-rabbit-card travel-ai-panel">
        <div className="travel-ai-panel-head">
          <span>AI TRAVEL LETTER</span>
          <em>静候回信</em>
        </div>
        <h2>把这次旅行交给 AI 继续书写</h2>
        <p>输入旅行编号后直接定位这一程；历史记录里的编号可以长按自动填入并复制。</p>
        <label className="travel-code-field">
          <span>旅行编号</span>
          <input
            value={recordCode}
            onChange={(event) => setRecordCode(event.target.value.toUpperCase())}
            placeholder="例如 TR-0001"
            inputMode="text"
          />
        </label>
        <small className="travel-code-help">编号从最下面的第一程开始：最旧记录为 TR-0001，新记录依次向上递增。</small>
        <div className="travel-ai-actions">
          <button type="button" disabled={sending} onClick={sendSelectedCode}>
            <strong>📨 发送给 AI</strong>
            <small>{sending ? "正在准备旅行档案……" : "自动准备档案并复制发送指令"}</small>
          </button>
          <button type="button" disabled={receiving} onClick={receiveSelectedCode}>
            <strong>📬 收取新手记</strong>
            <small>{receiving ? "正在检查邮筒……" : "检查并填回对应旅行信"}</small>
          </button>
        </div>
      </section>

      <section className="travel-rabbit-card travel-history-section">
        <h2>📖 旅行历史</h2>
        {history.length ? history.map((item, index) => {
          const letter = getTravelLetter(item);
          const expanded = expandedId === item.id;
          const editing = editingId === item.id;
          const code = displayCode(index);
          return (
            <article className={`travel-history-entry ${expanded ? "is-open" : ""}`} key={item.id}>
              <button
                type="button"
                className="travel-history-summary"
                onClick={() => openHistoryRecord(item)}
                aria-expanded={expanded}
              >
                <span>
                  <small
                    className="travel-record-code"
                    onPointerDown={(event) => {
                      event.stopPropagation();
                      startCodeLongPress(item);
                    }}
                    onPointerUp={cancelCodeLongPress}
                    onPointerCancel={cancelCodeLongPress}
                    onPointerLeave={cancelCodeLongPress}
                    onContextMenu={(event) => event.preventDefault()}
                    title="长按填入并复制编号"
                  >
                    {code} · {formatTravelDate(item.createdAt)}
                  </small>
                  <strong>{item.city} · {item.location}</strong>
                  <em>{letter ? "已有旅行信" : "等待旅行信"}</em>
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
                    {editing ? (
                      <>
                        <textarea
                          value={letterDrafts[item.id] ?? letter}
                          maxLength={20000}
                          placeholder="把这次旅行写成一封信吧……"
                          onChange={(event) => setLetterDrafts((previous) => ({
                            ...previous,
                            [item.id]: event.target.value,
                          }))}
                        />
                        <small className="travel-letter-count">
                          {(letterDrafts[item.id] ?? letter).length} / 20000
                        </small>
                        <div className="travel-letter-editor-actions">
                          <button type="button" onClick={() => cancelWritingLetter(item)}>取消</button>
                          <button type="button" onClick={() => saveManualLetter(item)}>💾 保存旅行信</button>
                        </div>
                      </>
                    ) : (
                      <>
                        {letter ? <p>{letter}</p> : <p className="is-empty">这封信还在路上，也可以由你亲手写下。</p>}
                        <div className="travel-letter-editor-actions">
                          <button type="button" onClick={() => startWritingLetter(item)}>
                            ✍️ {letter ? "编辑旅行信" : "自己编写"}
                          </button>
                        </div>
                      </>
                    )}
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
