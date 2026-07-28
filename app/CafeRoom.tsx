"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type CupSize = "espresso" | "latte" | "grande" | "share-pot";
type CafeRecord = {
  id: string;
  module: "cafe";
  createdAt: string;
  kind: "menu" | "random" | "recipe" | "daily";
  title: string;
  category: string;
  flavour: string;
  cupSize: CupSize;
  premise: string;
  mustInclude: string;
  avoid: string;
  narrative: string;
  note: string;
  noteUpdatedAt: string | null;
  favorite: boolean;
};

type Recipe = {
  id: string;
  title: string;
  premise: string;
  mustInclude: string;
  avoid: string;
  flavour: string;
  cupSize: CupSize;
  narrative: string;
};

const RECORDS_KEY = "crimson-cafe.records.v1";
const RECIPES_KEY = "crimson-cafe.recipes.v1";
const OWNER_KEY = "crimson-tavern.vault-owner-key.v1";
const READ_KEY = "crimson-tavern.vault-read-key.v1";
const REPLY_KEY = "crimson-tavern.vault-note-key.v1";
const API_URL_KEY = "crimson-world.vault-api-url.v1";
const DEFAULT_RECORDS_API_URL = "https://crimson-world.lingwangshu018.workers.dev/api/records";
const KEY_PATTERN = /^ctv1_[A-Za-z0-9_-]{43}$/;

const cupLabels: Record<CupSize, { name: string; hint: string }> = {
  espresso: { name: "Espresso", hint: "短片段 · 约 600 字" },
  latte: { name: "Latte", hint: "完整故事 · 约 1200 字" },
  grande: { name: "Grande", hint: "充分展开 · 约 2500 字" },
  "share-pot": { name: "Share Pot", hint: "超长篇 · 多幕展开" },
};

const menu = [
  { title: "一起捡到一只猫", category: "日常", flavour: "香草拿铁", premise: "两个人在回家路上捡到一只猫，并一起决定如何照顾它。" },
  { title: "凌晨三点的便利店", category: "陪伴", flavour: "热可可", premise: "睡不着的两个人在凌晨去了便利店，平静的夜里发生了一段只属于彼此的谈话。" },
  { title: "停电的那个晚上", category: "同居", flavour: "焦糖摩卡", premise: "家中突然停电，两个人在黑暗、烛光和过近的距离里度过漫长一晚。" },
  { title: "雨后的图书馆", category: "校园", flavour: "抹茶拿铁", premise: "雨停之后，两个人被留在安静的图书馆里，原本没有说出口的话逐渐浮上来。" },
  { title: "错过末班车", category: "旅行", flavour: "冰美式", premise: "两个人在陌生城市错过末班车，只能一起寻找临时落脚处。" },
  { title: "初雪来信", category: "恋爱", flavour: "白巧拿铁", premise: "初雪落下时，一封迟到的信改变了两个人原本平静的一天。" },
];

const randomTitles = [
  "被困在同一部电梯里",
  "醒来后交换了身体",
  "共同照顾一盆快枯萎的花",
  "在旧相册里发现陌生合照",
  "约定只说真话的一天",
  "突然下起大雨的海边",
];

function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `cafe-${crypto.randomUUID()}`;
  return `cafe-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createSharedVaultKey() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
  return `ctv1_${window.btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")}`;
}

function ensureSharedVaultKeys() {
  let ownerKey = localStorage.getItem(OWNER_KEY) || "";
  let readKey = localStorage.getItem(READ_KEY) || "";
  let replyKey = localStorage.getItem(REPLY_KEY) || "";
  if (!KEY_PATTERN.test(ownerKey)) ownerKey = createSharedVaultKey();
  if (!KEY_PATTERN.test(readKey) || readKey === ownerKey) readKey = createSharedVaultKey();
  if (!KEY_PATTERN.test(replyKey) || replyKey === ownerKey || replyKey === readKey) replyKey = createSharedVaultKey();
  localStorage.setItem(OWNER_KEY, ownerKey);
  localStorage.setItem(READ_KEY, readKey);
  localStorage.setItem(REPLY_KEY, replyKey);
  return { ownerKey, readKey, replyKey };
}

function getRecordsApiUrl() {
  const configured = localStorage.getItem(API_URL_KEY)?.trim();
  if (!configured) return DEFAULT_RECORDS_API_URL;
  try {
    const url = new URL(configured);
    if (url.pathname.endsWith("/api/records")) return url.toString();
    url.pathname = "/api/records";
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return DEFAULT_RECORDS_API_URL;
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
  }).format(new Date(value));
}

function safeParse<T>(raw: string | null, fallback: T): T {
  try { return raw ? JSON.parse(raw) as T : fallback; } catch { return fallback; }
}

export default function CafeRoom() {
  const [records, setRecords] = useState<CafeRecord[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [premise, setPremise] = useState("");
  const [mustInclude, setMustInclude] = useState("");
  const [avoid, setAvoid] = useState("");
  const [flavour, setFlavour] = useState("温柔 · 微甜 · 治愈");
  const [cupSize, setCupSize] = useState<CupSize>("latte");
  const [narrative, setNarrative] = useState("第三人称有限视角，重视动作、对话、心理与现实余波");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "favorite" | "notes">("all");
  const [code, setCode] = useState("");
  const [toast, setToast] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [pulling, setPulling] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loaded = safeParse<CafeRecord[]>(localStorage.getItem(RECORDS_KEY), []);
    setRecords(loaded);
    setRecipes(safeParse<Recipe[]>(localStorage.getItem(RECIPES_KEY), []));
    setActiveId(loaded[0]?.id ?? null);
  }, []);

  const active = records.find((record) => record.id === activeId) || records[0] || null;
  const filtered = useMemo(() => records.filter((record) => {
    if (filter === "favorite" && !record.favorite) return false;
    if (filter === "notes" && !record.note.trim()) return false;
    const query = search.trim().toLowerCase();
    return !query || [record.title, record.category, record.flavour, record.note].join(" ").toLowerCase().includes(query);
  }), [records, search, filter]);

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast((current) => current === message ? "" : current), 2600);
  }

  function persist(next: CafeRecord[]) {
    setRecords(next);
    localStorage.setItem(RECORDS_KEY, JSON.stringify(next));
  }

  function displayNumber(record: CafeRecord) {
    const index = records.findIndex((item) => item.id === record.id);
    return `CF-${String(Math.max(1, records.length - index)).padStart(4, "0")}`;
  }

  function recordByCode() {
    const normalized = code.trim().toUpperCase();
    if (!normalized) return active;
    return records.find((record) => displayNumber(record) === normalized) || null;
  }

  function createRecord(input: Partial<CafeRecord> & Pick<CafeRecord, "title" | "premise">) {
    const record: CafeRecord = {
      id: makeId(), module: "cafe", createdAt: new Date().toISOString(), kind: input.kind || "recipe",
      title: input.title.trim() || "未命名小剧场", category: input.category || "私人配方",
      flavour: input.flavour || flavour, cupSize: input.cupSize || cupSize, premise: input.premise.trim(),
      mustInclude: input.mustInclude ?? mustInclude, avoid: input.avoid ?? avoid,
      narrative: input.narrative || narrative, note: "", noteUpdatedAt: null, favorite: false,
    };
    const next = [record, ...records].slice(0, 300);
    persist(next);
    setActiveId(record.id);
    setCode(`CF-${String(next.length).padStart(4, "0")}`);
    notify("咖啡师已经接下订单，剧场卡已放入档案。");
  }

  function randomOrder() {
    const randomTitle = randomTitles[Math.floor(Math.random() * randomTitles.length)];
    createRecord({ title: randomTitle, premise: `围绕“${randomTitle}”展开一篇符合现有人物关系与世界设定的小剧场。`, category: "随机剧场", flavour: "甜而克制", kind: "random" });
  }

  function orderCustom() {
    if (!premise.trim() && !title.trim()) return notify("先告诉咖啡师今天想看什么故事。");
    createRecord({ title: title || premise.slice(0, 24), premise: premise || title, kind: "recipe" });
  }

  function saveRecipe() {
    if (!title.trim() && !premise.trim()) return notify("配方还是空的，先写一点故事设想吧。");
    const recipe: Recipe = { id: makeId(), title: title || premise.slice(0, 24), premise: premise || title, mustInclude, avoid, flavour, cupSize, narrative };
    const next = [recipe, ...recipes].slice(0, 100);
    setRecipes(next);
    localStorage.setItem(RECIPES_KEY, JSON.stringify(next));
    notify("私人配方已经收进配方柜。");
  }

  function useRecipe(recipe: Recipe) {
    setTitle(recipe.title); setPremise(recipe.premise); setMustInclude(recipe.mustInclude); setAvoid(recipe.avoid);
    setFlavour(recipe.flavour); setCupSize(recipe.cupSize); setNarrative(recipe.narrative);
    document.querySelector("#cafe-workshop")?.scrollIntoView({ behavior: "smooth" });
  }

  async function syncCafeRecord(record: CafeRecord) {
    const keys = ensureSharedVaultKeys();
    const content = [
      `标题：${record.title}`, `核心设定：${record.premise}`,
      `必须出现：${record.mustInclude || "无额外要求"}`, `避免出现：${record.avoid || "无额外限制"}`,
      `故事味道：${record.flavour}`, `杯型：${cupLabels[record.cupSize].name}（${cupLabels[record.cupSize].hint}）`,
      `叙事偏好：${record.narrative}`,
    ].join("\n");
    const response = await fetch(getRecordsApiUrl(), {
      method: "PUT",
      headers: { Authorization: `Bearer ${keys.ownerKey}`, "X-Crimson-Key": keys.ownerKey, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ readKey: keys.readKey, replyKey: keys.replyKey, records: [{
        id: record.id, module: "cafe", title: record.title, summary: record.premise.slice(0, 240), content,
        note: record.note || "", createdAt: record.createdAt, updatedAt: record.noteUpdatedAt || record.createdAt,
        noteUpdatedAt: record.noteUpdatedAt, metadata: { moduleName: "绯界咖啡馆", category: record.category, flavour: record.flavour, cupSize: record.cupSize, source: RECORDS_KEY },
      }] }),
    });
    const data = await response.json().catch(() => ({})) as { error?: string; syncedIds?: string[] };
    if (!response.ok || !data.syncedIds?.includes(record.id)) throw new Error(data.error || `同步失败（HTTP ${response.status}）`);
    return keys;
  }

  async function sendSelectedToAI() {
    const record = recordByCode();
    if (!record || syncing) return notify("请输入有效的咖啡馆订单编号。");
    setSyncing(true);
    try {
      const { readKey, replyKey } = await syncCafeRecord(record);
      const text = `请完成我的绯界咖啡馆小剧场订单。\n\n【记录编号】\n${displayNumber(record)}\n\n【记录ID】\n${record.id}\n\n【读取钥匙】\n${readKey}\n\n【回复钥匙】\n${replyKey}\n\n请先调用 crimson_read_record 精确读取这一条订单。结合当前会话中的世界书、角色卡和近期记忆完成完整小剧场。完成后调用 crimson_write_reply，使用相同记录ID与回复钥匙，把完整正文写回 note 字段。不要修改原记录，不要创建新记录，只处理这一条。`;
      await navigator.clipboard.writeText(text);
      setActiveId(record.id);
      notify("剧场任务单已复制，请发送给 AI。");
    } catch (error) {
      notify(error instanceof Error ? `剧场记录没有同步成功：${error.message}` : "剧场记录没有同步成功。");
    } finally { setSyncing(false); }
  }

  async function pullSelectedNote() {
    const target = recordByCode();
    if (!target || pulling) return notify("请输入有效的咖啡馆订单编号。");
    setPulling(true);
    try {
      const { ownerKey } = ensureSharedVaultKeys();
      const response = await fetch(`${getRecordsApiUrl()}?limit=500`, { headers: { Authorization: `Bearer ${ownerKey}`, "X-Crimson-Key": ownerKey, Accept: "application/json" } });
      const result = await response.json() as { records?: Array<Record<string, unknown>>; error?: string };
      if (!response.ok) throw new Error(result.error || "收取失败");
      const cloud = (result.records || []).find((item) => String(item.id || "") === target.id);
      const note = typeof cloud?.note === "string" ? cloud.note.trim() : "";
      if (!note) return notify("这张剧场卡暂时还没有新手记。");
      const updatedAt = typeof cloud?.noteUpdatedAt === "string" ? cloud.noteUpdatedAt : new Date().toISOString();
      persist(records.map((item) => item.id === target.id ? { ...item, note, noteUpdatedAt: updatedAt } : item));
      setActiveId(target.id);
      notify("AI 新手记已经放回对应剧场卡。");
    } catch { notify("新手记暂时没有取回来，请稍后再试。"); }
    finally { setPulling(false); }
  }

  function updateNote(record: CafeRecord, note: string) {
    persist(records.map((item) => item.id === record.id ? { ...item, note, noteUpdatedAt: new Date().toISOString() } : item));
  }

  function clearNote(record: CafeRecord) {
    if (!record.note.trim()) return notify("这篇剧场手记已经是空的。");
    if (!window.confirm(`确定清空「${record.title}」的剧场手记吗？订单会保留。`)) return;
    updateNote(record, "");
    notify("剧场手记已清空，订单仍保留在档案中。");
  }

  function removeRecord(record: CafeRecord) {
    if (!window.confirm(`确定移除「${record.title}」这张剧场卡吗？`)) return;
    const next = records.filter((item) => item.id !== record.id);
    persist(next);
    setActiveId(next[0]?.id ?? null);
    notify("这张剧场卡已经从档案中移除。");
  }

  function exportRecords() {
    const blob = new Blob([JSON.stringify({ version: 1, records, recipes }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.href = url; link.download = "crimson-cafe-archive.json"; link.click();
    URL.revokeObjectURL(url);
  }

  function importRecords(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result)) as { records?: CafeRecord[]; recipes?: Recipe[] } | CafeRecord[];
        const importedRecords = Array.isArray(data) ? data : data.records || [];
        const merged = [...importedRecords, ...records].filter((item, index, all) => all.findIndex((other) => other.id === item.id) === index).slice(0, 300);
        persist(merged);
        if (!Array.isArray(data) && Array.isArray(data.recipes)) {
          setRecipes(data.recipes); localStorage.setItem(RECIPES_KEY, JSON.stringify(data.recipes));
        }
        setActiveId(merged[0]?.id ?? null);
        notify(`已导入 ${importedRecords.length} 张剧场卡。`);
      } catch { notify("没有识别到有效的咖啡馆档案。"); }
    };
    reader.readAsText(file);
  }

  function copyCode(record: CafeRecord) {
    const value = displayNumber(record);
    setCode(value); setActiveId(record.id);
    navigator.clipboard.writeText(value).catch(() => undefined);
    notify(`${value} 已填入并复制。`);
  }

  return (
    <section id="cafe" className="cafe-room cafe-tavern-layout" style={{ backgroundImage: 'linear-gradient(180deg, rgba(15,5,8,.22), rgba(15,5,8,.5)), url("images/crimson-cafe-background.webp")' }}>
      <div className={`cafe-toast ${toast ? "show" : ""}`}>{toast}</div>

      <header className="cafe-ledger-hero">
        <p>THE STORY LEDGER</p>
        <h2><em>{String(records.length).padStart(2, "0")}</em> 剧场档案</h2>
        <span>每一杯故事都留下一张剧场卡，展开它，继续书写未完的片段。</span>
      </header>

      <section className="cafe-ledger-stats">
        <p className="cafe-label">PRIVATE COLLECTION</p>
        <strong>{String(records.length).padStart(2, "0")}</strong>
        <span>杯茶留下手札</span>
        <dl><div><dt>★ 收藏</dt><dd>{records.filter((item) => item.favorite).length}</dd></div><div><dt>✎ 手记</dt><dd>{records.filter((item) => item.note.trim()).length}</dd></div><div><dt>☕ 配方</dt><dd>{recipes.length}</dd></div></dl>
      </section>

      <div className="cafe-archive-actions">
        <button type="button" onClick={exportRecords}><span>↓</span><b>导出全部档案</b><small>剧场卡与配方保存为 JSON</small></button>
        <button type="button" onClick={() => importRef.current?.click()}><span>↑</span><b>导入咖啡馆档案</b><small>自动合并，不覆盖不同记录</small></button>
        <input ref={importRef} hidden type="file" accept="application/json" onChange={(event) => { const file = event.target.files?.[0]; if (file) importRecords(file); event.currentTarget.value = ""; }} />
      </div>

      <section className="cafe-ai-panel">
        <header><p>AI STORY NOTE</p><span>静候回信</span></header>
        <h3>把这一杯交给 AI 继续书写</h3>
        <label><span>订单编号</span><input value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="例如 CF-0001" /></label>
        <div><button type="button" onClick={sendSelectedToAI} disabled={syncing}>{syncing ? "正在准备……" : "✉ 发送给 AI"}</button><button type="button" onClick={pullSelectedNote} disabled={pulling}>{pulling ? "正在收取……" : "▣ 收取新手记"}</button></div>
      </section>

      <section className="cafe-ledger">
        <div className="cafe-ledger-toolbar">
          <label><span>⌕</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索剧场、味道或手记……" /></label>
          <div><button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>全部</button><button className={filter === "favorite" ? "active" : ""} onClick={() => setFilter("favorite")}>收藏</button><button className={filter === "notes" ? "active" : ""} onClick={() => setFilter("notes")}>手记</button></div>
        </div>

        <div className="cafe-record-list-v2">
          {filtered.length ? filtered.map((record) => {
            const expanded = active?.id === record.id;
            return <article className={`cafe-record-card-v2 ${expanded ? "expanded" : ""}`} key={record.id}>
              <button type="button" className="cafe-record-summary-v2" onClick={() => setActiveId(expanded ? null : record.id)}>
                <span className="cafe-record-code" onContextMenu={(event) => { event.preventDefault(); copyCode(record); }} onTouchStart={() => undefined}>{displayNumber(record)}</span>
                <span><small>BARISTA&apos;S CHOICE · {formatDate(record.createdAt)}</small><strong>{record.title}</strong><em>{record.flavour} · {cupLabels[record.cupSize].name}{record.note ? " · 已有手记" : ""}</em></span>
                <b>{expanded ? "−" : "+"}</b>
              </button>
              {expanded ? <div className="cafe-record-details-v2">
                <section className="cafe-recipe-panel-v2">
                  <p>THE RECIPE · 本杯订单</p>
                  <dl><div><dt>分类</dt><dd>{record.category}</dd></div><div><dt>味道</dt><dd>{record.flavour}</dd></div><div><dt>杯型</dt><dd>{cupLabels[record.cupSize].name}<small>{cupLabels[record.cupSize].hint}</small></dd></div><div><dt>设定</dt><dd>{record.premise}</dd></div>{record.mustInclude ? <div><dt>必须出现</dt><dd>{record.mustInclude}</dd></div> : null}{record.avoid ? <div><dt>避免出现</dt><dd>{record.avoid}</dd></div> : null}</dl>
                </section>
                <section className="cafe-notebook-v2">
                  <header><div><p>STORY NOTE · 剧场手记</p><span>上次保存于 {record.noteUpdatedAt ? formatDate(record.noteUpdatedAt) : "尚未保存"}</span></div><em>PAGE 01</em></header>
                  <textarea value={record.note} onChange={(event) => updateNote(record, event.target.value)} placeholder="AI 的完整小剧场会收取到这里，也可以自己编写……" />
                  <footer><span>{record.note.length} / 20000</span><div><button onClick={() => persist(records.map((item) => item.id === record.id ? { ...item, favorite: !item.favorite } : item))}>{record.favorite ? "取消收藏" : "收藏故事"}</button><button onClick={clearNote} className="danger">删除手记</button><button onClick={() => removeRecord(record)} className="danger">移除订单</button><button onClick={() => notify("剧场手记已经保存在本机。")}>保存手记</button></div></footer>
                </section>
              </div> : null}
            </article>;
          }) : <div className="cafe-empty-v2">还没有符合条件的剧场卡。</div>}
        </div>
      </section>

      <section id="cafe-workshop" className="cafe-order-studio">
        <header><p>STORY RECIPE · 剧场工坊</p><h3>调一份私人故事配方</h3></header>
        <div className="cafe-order-quick"><button onClick={() => createRecord({ ...menu[new Date().getDate() % menu.length], kind: "daily", mustInclude: "", avoid: "", narrative, cupSize })}>今日推荐</button><button onClick={randomOrder}>随机特调</button>{menu.slice(0, 4).map((item) => <button key={item.title} onClick={() => createRecord({ ...item, kind: "menu", mustInclude: "", avoid: "", narrative, cupSize })}>{item.title}</button>)}</div>
        <div className="cafe-order-form">
          <label><span>今天想看什么</span><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="例如：初雪那天，他终于来接我" /></label>
          <label className="wide"><span>核心设定</span><textarea value={premise} onChange={(event) => setPremise(event.target.value)} /></label>
          <label><span>必须出现</span><textarea value={mustInclude} onChange={(event) => setMustInclude(event.target.value)} /></label>
          <label><span>不要出现</span><textarea value={avoid} onChange={(event) => setAvoid(event.target.value)} /></label>
          <label><span>故事味道</span><input value={flavour} onChange={(event) => setFlavour(event.target.value)} /></label>
          <label><span>叙事偏好</span><input value={narrative} onChange={(event) => setNarrative(event.target.value)} /></label>
        </div>
        <div className="cafe-cup-selector-v2">{(Object.keys(cupLabels) as CupSize[]).map((size) => <button className={cupSize === size ? "active" : ""} key={size} onClick={() => setCupSize(size)}><strong>{cupLabels[size].name}</strong><small>{cupLabels[size].hint}</small></button>)}</div>
        <div className="cafe-order-actions"><button onClick={saveRecipe}>保存配方</button><button className="primary" onClick={orderCustom}>开始演绎</button></div>
        {recipes.length ? <div className="cafe-recipe-shelf-v2">{recipes.map((recipe) => <button key={recipe.id} onClick={() => useRecipe(recipe)}><strong>{recipe.title}</strong><span>{recipe.flavour} · {cupLabels[recipe.cupSize].name}</span></button>)}</div> : null}
      </section>
    </section>
  );
}
