"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import "./journal-room.css";

type PaperStyle = "default" | "grid" | "blank" | "night" | "custom";
type Folder = { id: string; name: string };
type Diary = {
  id: string;
  title: string;
  content: string;
  folderId: string;
  createdAt: number;
  reply?: string;
  replyAt?: number;
  vaultSyncedAt?: number;
  vaultFingerprint?: string;
  paper: PaperStyle;
  customBackground?: string;
};

type View = "list" | "write" | "read";

const DIARY_KEY = "lu_shared_diary_v7";
const FOLDER_KEY = "lu_shared_folders_v7";
const OWNER_KEY = "crimson-tavern.vault-owner-key.v1";
const READ_KEY = "crimson-tavern.vault-read-key.v1";
const REPLY_KEY = "crimson-tavern.vault-note-key.v1";
const RECORDS_API_URL =
  "https://crimson-world.lingwangshu018.workers.dev/api/records";

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

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

function formatDate(value?: number) {
  if (!value) return "";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function normalizeDiary(value: unknown): Diary | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Partial<Diary> & {
    folder_id?: string;
    created_at?: number;
    reply_content?: string;
    reply_at?: number;
    bg_style?: PaperStyle;
    custom_bg?: string;
  };
  if (typeof item.content !== "string") return null;
  return {
    id: String(item.id || uid()),
    title: String(item.title || "未命名的心事"),
    content: item.content,
    folderId: String(item.folderId ?? item.folder_id ?? ""),
    createdAt: Number(item.createdAt ?? item.created_at ?? Date.now()),
    reply: String(item.reply ?? item.reply_content ?? "") || undefined,
    replyAt: Number(item.replyAt ?? item.reply_at ?? 0) || undefined,
    vaultSyncedAt: Number(item.vaultSyncedAt ?? 0) || undefined,
    vaultFingerprint: String(item.vaultFingerprint ?? "") || undefined,
    paper: item.paper ?? item.bg_style ?? "default",
    customBackground: String(item.customBackground ?? item.custom_bg ?? "") || undefined,
  };
}

function recordFingerprint(diary: Diary) {
  return JSON.stringify([
    diary.id,
    diary.title,
    diary.content,
    diary.folderId,
    diary.createdAt,
    diary.reply || "",
    diary.replyAt || 0,
  ]);
}

export function JournalRoom({ onClose }: { onClose: () => void }) {
  const [view, setView] = useState<View>("list");
  const [diaries, setDiaries] = useState<Diary[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [folder, setFolder] = useState("all");
  const [query, setQuery] = useState("");
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [writeFolder, setWriteFolder] = useState("");
  const [paper, setPaper] = useState<PaperStyle>("default");
  const [customBackground, setCustomBackground] = useState("");

  useEffect(() => {
    try {
      const savedDiaries = JSON.parse(localStorage.getItem(DIARY_KEY) || "[]") as unknown[];
      const savedFolders = JSON.parse(localStorage.getItem(FOLDER_KEY) || "[]") as Folder[];
      setDiaries(savedDiaries.map(normalizeDiary).filter((item): item is Diary => Boolean(item)));
      if (Array.isArray(savedFolders)) setFolders(savedFolders);
    } catch {
      // Start with an empty notebook when old data cannot be read.
    }
  }, []);

  function persist(nextDiaries = diaries, nextFolders = folders) {
    setDiaries(nextDiaries);
    setFolders(nextFolders);
    localStorage.setItem(DIARY_KEY, JSON.stringify(nextDiaries));
    localStorage.setItem(FOLDER_KEY, JSON.stringify(nextFolders));
  }

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return diaries.filter((diary) => {
      if (folder !== "all" && diary.folderId !== folder) return false;
      if (!keyword) return true;
      return `${diary.title} ${diary.content} ${diary.reply || ""}`.toLowerCase().includes(keyword);
    });
  }, [diaries, folder, query]);

  const current = diaries.find((diary) => diary.id === currentId) || null;

  function startWriting() {
    setTitle("");
    setContent("");
    setWriteFolder(folder === "all" ? "" : folder);
    setPaper("default");
    setCustomBackground("");
    setView("write");
  }

  function saveDiary() {
    if (!content.trim()) {
      window.alert("还没写内容呢～");
      return;
    }
    const diary: Diary = {
      id: uid(),
      title: title.trim() || "未命名的心事",
      content: content.trim(),
      folderId: writeFolder,
      createdAt: Date.now(),
      paper,
      customBackground: paper === "custom" ? customBackground : undefined,
    };
    persist([diary, ...diaries]);
    setCurrentId(diary.id);
    setView("read");
  }

  function createFolder() {
    const name = window.prompt("给新分类起个名字吧：", "比如：恋爱心事")?.trim();
    if (!name) return;
    persist(diaries, [...folders, { id: uid(), name }]);
  }

  function editFolder(item: Folder) {
    const name = window.prompt("修改分类名称：", item.name)?.trim();
    if (!name) return;
    persist(diaries, folders.map((folderItem) => folderItem.id === item.id ? { ...folderItem, name } : folderItem));
  }

  function deleteCurrent() {
    if (!current || !window.confirm("要把这篇心事擦掉吗？")) return;
    persist(diaries.filter((diary) => diary.id !== current.id));
    setCurrentId(null);
    setView("list");
  }

  function editCurrent() {
    if (!current) return;
    const next = window.prompt("修改日记内容：", current.content);
    if (next === null) return;
    persist(diaries.map((diary) => diary.id === current.id ? { ...diary, content: next, vaultSyncedAt: undefined, vaultFingerprint: undefined } : diary));
  }

  function pasteReply() {
    if (!current) return;
    const reply = window.prompt("贴入机的回信：", current.reply || "");
    if (reply === null) return;
    persist(diaries.map((diary) => diary.id === current.id ? { ...diary, reply, replyAt: Date.now(), vaultSyncedAt: undefined, vaultFingerprint: undefined } : diary));
  }

  async function syncDiaryRecord(diary: Diary) {
    const keys = ensureVaultKeys();
    const createdAt = new Date(diary.createdAt).toISOString();
    const updatedAt = new Date(diary.replyAt || diary.createdAt).toISOString();
    const folderName = folders.find((item) => item.id === diary.folderId)?.name || "";

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
            id: diary.id,
            module: "journal",
            title: diary.title,
            summary: diary.content.slice(0, 240),
            content: diary.content,
            note: diary.reply || "",
            createdAt,
            updatedAt,
            noteUpdatedAt: diary.replyAt
              ? new Date(diary.replyAt).toISOString()
              : null,
            metadata: {
              moduleName: "我们的日记",
              folderId: diary.folderId || null,
              folderName: folderName || null,
              paper: diary.paper,
              source: DIARY_KEY,
            },
          },
        ],
      }),
    });

    const data = (await response.json().catch(() => ({}))) as {
      error?: string;
      syncedIds?: string[];
    };
    if (!response.ok || !data.syncedIds?.includes(diary.id)) {
      throw new Error(data.error || `同步失败（HTTP ${response.status}）`);
    }

    const syncedAt = Date.now();
    const fingerprint = recordFingerprint(diary);
    persist(
      diaries.map((item) =>
        item.id === diary.id
          ? { ...item, vaultSyncedAt: syncedAt, vaultFingerprint: fingerprint }
          : item,
      ),
    );

    return keys;
  }

  async function requestReply() {
    if (!current) return;
    try {
      const { readKey, replyKey } = await syncDiaryRecord(current);
      const displayNumber = `JR-${String(
        Math.max(1, diaries.findIndex((item) => item.id === current.id) + 1),
      ).padStart(4, "0")}`;
      const text = [
        "请读取我的绯界记录，并继续完成这一事件。",
        "",
        "【模块】",
        "我们的日记",
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
        "请先调用绯界工具 crimson_read_record，使用上面的记录ID与读取钥匙精确读取本篇日记。",
        "",
        "结合当前聊天已经加载的角色卡、世界书和近期记忆，根据日记标题与正文写一封完整回信。",
        "",
        "完成后，请调用 crimson_write_reply，使用完全相同的记录ID与回复钥匙，将完整回信写回 note 字段。",
        "",
        "不要修改原始记录，不要创建新记录，不要回复其他记录。",
        "只处理这一条。",
      ].join("\n");

      await navigator.clipboard.writeText(text);
      window.alert("✨ 日记已同步到绯界云端，任务单也复制好了。现在可以直接粘贴给 AI。");
    } catch (error) {
      const message = error instanceof Error ? error.message : "同步失败，请稍后重试。";
      window.alert(`日记没有同步成功：${message}`);
    }
  }

  function uploadBackground(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCustomBackground(String(reader.result || ""));
      setPaper("custom");
    };
    reader.readAsDataURL(file);
  }

  const paperStyle = current?.paper === "custom" && current.customBackground
    ? { backgroundImage: `linear-gradient(rgba(255,255,255,.48),rgba(255,255,255,.48)),url(${current.customBackground})` }
    : undefined;

  return (
    <section className="journal-room">
      {view === "list" && (
        <>
          <header className="journal-header">
            <button type="button" onClick={onClose}>×</button>
            <div><strong>我们的日记</strong><small>THE PRIVATE JOURNAL</small></div>
            <span />
          </header>
          <main className="journal-content">
            <label className="journal-search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索心事……" /></label>
            <div className="journal-folders">
              <button className={folder === "all" ? "active" : ""} onClick={() => setFolder("all")}>全部心事</button>
              {folders.map((item) => <button key={item.id} className={folder === item.id ? "active" : ""} onClick={() => setFolder(item.id)} onDoubleClick={() => editFolder(item)}>{item.name}</button>)}
              <button className="add" onClick={createFolder}>＋ 新建分类</button>
            </div>
            {filtered.length ? filtered.map((diary) => (
              <article className="journal-card" key={diary.id} onClick={() => { setCurrentId(diary.id); setView("read"); }}>
                <time>{formatDate(diary.createdAt)}{diary.folderId ? ` · ${folders.find((item) => item.id === diary.folderId)?.name || "未知分类"}` : ""}</time>
                <h2>{diary.title}</h2><p>{diary.content}</p><span className={diary.reply ? "replied" : ""}>{diary.reply ? "已回音" : "等机回信"}</span>
              </article>
            )) : <div className="journal-empty"><b>📖</b><p>这里还是空的呢<br />快写下今天的心情吧</p></div>}
          </main>
          <button className="journal-fab" type="button" onClick={startWriting}>＋</button>
        </>
      )}

      {view === "write" && (
        <div className={`journal-paper paper-${paper}`} style={paper === "custom" && customBackground ? { backgroundImage: `linear-gradient(rgba(255,255,255,.48),rgba(255,255,255,.48)),url(${customBackground})` } : undefined}>
          <header className="journal-header paper-head"><button onClick={() => setView("list")}>‹</button><div><strong>写给机</strong><small>NEW ENTRY</small></div><button className="done" onClick={saveDiary}>完成</button></header>
          <main className="journal-editor">
            <div className="paper-tools">
              <select value={writeFolder} onChange={(event) => setWriteFolder(event.target.value)}><option value="">不放在任何分类</option>{folders.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
              {(["default", "grid", "blank", "night"] as PaperStyle[]).map((item) => <button key={item} className={paper === item ? "active" : ""} onClick={() => setPaper(item)} aria-label={item} />)}
              <label className={paper === "custom" ? "active upload" : "upload"}>图<input type="file" accept="image/*" onChange={uploadBackground} /></label>
            </div>
            <input className="journal-title-input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="今天的主题是……" />
            <textarea value={content} onChange={(event) => setContent(event.target.value)} placeholder="我在听，今天发生了什么？开心的、委屈的，都可以写下来……" />
          </main>
        </div>
      )}

      {view === "read" && current && (
        <div className={`journal-paper journal-reader paper-${current.paper}`} style={paperStyle}>
          <header className="journal-reader-actions"><button onClick={() => setView("list")}>‹</button><div><button onClick={editCurrent}>📝</button><button onClick={pasteReply}>✎</button><button className="danger" onClick={deleteCurrent}>⌫</button></div></header>
          <main className="journal-read-sheet"><h1>{current.title}</h1><time>写于 {formatDate(current.createdAt)}</time><div className="journal-read-content">{current.content}</div>{current.reply ? <aside><b>机的回音</b><p>{current.reply}</p><time>落笔于 {formatDate(current.replyAt)}</time></aside> : <button className="journal-reply" onClick={requestReply}>呼唤机回信</button>}</main>
        </div>
      )}
    </section>
  );
}
