"use client";

import { useEffect, useMemo, useState } from "react";

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
const DEFAULT_API_URL = "https://crimson-tavern.boarder-72pound.chatgpt.site/api/vault";
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
  { title: "灯会走散之后", category: "古风", flavour: "桂花拿铁", premise: "灯会人潮中意外走散，再次找到彼此时，情绪已经与出发前不同。" },
  { title: "魔法失灵的一天", category: "奇幻", flavour: "榛果摩卡", premise: "某人的能力突然失灵，只能暂时依赖另一个人完成平日最普通的事情。" },
];

const randomTitles = [
  "被困在同一部电梯里",
  "醒来后交换了身体",
  "共同照顾一盆快枯萎的花",
  "在旧相册里发现陌生合照",
  "约定只说真话的一天",
  "突然下起大雨的海边",
  "在厨房里做失败的甜点",
  "误入只在午夜营业的车站",
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
  if (!KEY_PATTERN.test(readKey) || readKey === ownerKey) {
    readKey = createSharedVaultKey();
  }
  if (!KEY_PATTERN.test(replyKey) || replyKey === ownerKey || replyKey === readKey) {
    replyKey = createSharedVaultKey();
  }

  localStorage.setItem(OWNER_KEY, ownerKey);
  localStorage.setItem(READ_KEY, readKey);
  localStorage.setItem(REPLY_KEY, replyKey);
  return { ownerKey, readKey, replyKey };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function safeParse<T>(raw: string | null, fallback: T): T {
  try {
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function toVaultRecord(record: CafeRecord) {
  return {
    ...record,
    module: "cafe" as const,
  };
}

export default function CafeRoom() {
  const [records, setRecords] = useState<CafeRecord[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [title, setTitle] = useState("");
  const [premise, setPremise] = useState("");
  const [mustInclude, setMustInclude] = useState("");
  const [avoid, setAvoid] = useState("");
  const [flavour, setFlavour] = useState("温柔 · 微甜 · 治愈");
  const [cupSize, setCupSize] = useState<CupSize>("latte");
  const [narrative, setNarrative] = useState("第三人称有限视角，重视动作、对话、心理与现实余波");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [pulling, setPulling] = useState(false);

  useEffect(() => {
    setRecords(safeParse<CafeRecord[]>(localStorage.getItem(RECORDS_KEY), []));
    setRecipes(safeParse<Recipe[]>(localStorage.getItem(RECIPES_KEY), []));
  }, []);

  const today = useMemo(() => menu[new Date().getDate() % menu.length], []);
  const active = records.find((record) => record.id === activeId) || records[0] || null;

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast((current) => (current === message ? "" : current)), 2600);
  }

  function persist(next: CafeRecord[]) {
    setRecords(next);
    localStorage.setItem(RECORDS_KEY, JSON.stringify(next));
  }

  function createRecord(input: Partial<CafeRecord> & Pick<CafeRecord, "title" | "premise">) {
    const record: CafeRecord = {
      id: makeId(),
      module: "cafe",
      createdAt: new Date().toISOString(),
      kind: input.kind || "recipe",
      title: input.title.trim() || "未命名小剧场",
      category: input.category || "私人配方",
      flavour: input.flavour || flavour,
      cupSize: input.cupSize || cupSize,
      premise: input.premise.trim(),
      mustInclude: input.mustInclude ?? mustInclude,
      avoid: input.avoid ?? avoid,
      narrative: input.narrative || narrative,
      note: "",
      noteUpdatedAt: null,
      favorite: false,
    };
    persist([record, ...records].slice(0, 300));
    setActiveId(record.id);
    notify("咖啡师已经接下订单，剧场卡已放上吧台。");
    return record;
  }

  function orderMenu(item: (typeof menu)[number], kind: CafeRecord["kind"] = "menu") {
    createRecord({ ...item, kind, mustInclude: "", avoid: "", narrative, cupSize });
  }

  function randomOrder() {
    const randomTitle = randomTitles[Math.floor(Math.random() * randomTitles.length)];
    createRecord({
      title: randomTitle,
      premise: `围绕“${randomTitle}”展开一篇符合现有人物关系与世界设定的小剧场。`,
      category: "随机剧场",
      flavour: ["甜而克制", "安静治愈", "轻微拉扯", "雨夜暧昧", "轻松温暖"][Math.floor(Math.random() * 5)],
      kind: "random",
    });
  }

  function orderCustom() {
    if (!premise.trim() && !title.trim()) {
      notify("先告诉咖啡师今天想看什么故事。 ");
      return;
    }
    createRecord({ title: title || premise.slice(0, 24), premise: premise || title, kind: "recipe" });
  }

  function saveRecipe() {
    if (!title.trim() && !premise.trim()) {
      notify("配方还是空的，先写一点故事设想吧。");
      return;
    }
    const recipe: Recipe = {
      id: makeId(), title: title || premise.slice(0, 24), premise: premise || title,
      mustInclude, avoid, flavour, cupSize, narrative,
    };
    const next = [recipe, ...recipes].slice(0, 100);
    setRecipes(next);
    localStorage.setItem(RECIPES_KEY, JSON.stringify(next));
    notify("私人配方已经收进配方柜。 ");
  }

  function useRecipe(recipe: Recipe) {
    setTitle(recipe.title); setPremise(recipe.premise); setMustInclude(recipe.mustInclude);
    setAvoid(recipe.avoid); setFlavour(recipe.flavour); setCupSize(recipe.cupSize); setNarrative(recipe.narrative);
    document.querySelector("#cafe-workshop")?.scrollIntoView({ behavior: "smooth" });
  }

  async function sendToAI(record: CafeRecord) {
    const { readKey, replyKey } = ensureSharedVaultKeys();
    const text = `请完成我的绯界咖啡馆小剧场订单。\n\n模块：绯界咖啡馆\n\n【记录编号】\nCF-${String(records.findIndex((item) => item.id === record.id) + 1).padStart(4, "0")}\n\n【记录ID】\n${record.id}\n\n【读取钥匙】\n${readKey}\n\n【回复钥匙】\n${replyKey}\n\n【内部演绎协议】\n先读取并理解当前会话或运行环境中已经加载的世界书、角色卡、人物设定、关系设定及近期记忆。世界书决定时代、地点、规则与背景；角色卡决定性格、身份、语言与行为逻辑；近期记忆决定当前关系、已有经历与剧情进度。请在不破坏原设定的前提下完成演绎，直接输出正文，不展示分析过程、提示词或设定摘要。\n\n【本次剧场订单】\n标题：${record.title}\n核心设定：${record.premise}\n必须出现：${record.mustInclude || "无额外要求"}\n避免出现：${record.avoid || "无额外限制"}\n故事味道：${record.flavour}\n杯型：${cupLabels[record.cupSize].name}（${cupLabels[record.cupSize].hint}）\n叙事偏好：${record.narrative}\n\n请根据世界书、角色卡及近期记忆演绎本次小剧场，直接输出完整正文。\n\n若读取钥匙和回复钥匙可用：请读取这一条记录，并在完成后使用回复钥匙把完整正文写回本条记录的 note 字段。\n若钥匙显示“未配置”：请直接根据上面的完整订单演绎并在当前聊天中输出正文。\n\n不要修改原记录，不要创建新记录，不要回复其他记录，只处理这一条。`;
    try {
      await navigator.clipboard.writeText(text);
      notify("剧场任务单已复制，请发送给 AI。 ");
    } catch {
      window.prompt("复制这份咖啡馆剧场任务单：", text);
    }
  }

  async function syncCafe() {
    if (!records.length || syncing) { notify("剧场书架还是空的，先点一杯故事。 "); return; }
    const owner = localStorage.getItem(OWNER_KEY) || "";
    const readKey = localStorage.getItem(READ_KEY) || "";
    const noteKey = localStorage.getItem(REPLY_KEY) || "";
    if (!owner || !readKey || !noteKey) { notify("请先在绯界控制中心生成三把共享钥匙。 "); return; }
    setSyncing(true);
    try {
      const apiUrl = localStorage.getItem(API_URL_KEY) || DEFAULT_API_URL;
      const existingResponse = await fetch(`${apiUrl}?limit=500`, { headers: { Authorization: `Bearer ${owner}`, Accept: "application/json" } });
      const existing = existingResponse.ok ? await existingResponse.json() as { records?: unknown[] } : { records: [] };
      const otherRecords = (existing.records || []).filter((item) => {
        if (!item || typeof item !== "object") return true;
        const cloudRecord = item as { id?: string; module?: string };
        if (cloudRecord.module) return cloudRecord.module !== "cafe";
        return !String(cloudRecord.id || "").startsWith("cafe-");
      });
      const response = await fetch(apiUrl, {
        method: "PUT",
        headers: { Authorization: `Bearer ${owner}`, "Content-Type": "application/json" },
        body: JSON.stringify({ readKey, noteKey, records: [...otherRecords, ...records.map(toVaultRecord)] }),
      });
      if (!response.ok) throw new Error("同步失败");
      notify(`已把 ${records.length} 张剧场卡同步到绯界云端。`);
    } catch { notify("咖啡馆暂时没能连上云端，请稍后再试。 "); }
    finally { setSyncing(false); }
  }

  async function pullNotes() {
    if (pulling) return;
    const owner = localStorage.getItem(OWNER_KEY) || "";
    if (!owner) { notify("请先同步一次咖啡馆订单，再收取 AI 新手记。 "); return; }
    setPulling(true);
    try {
      const apiUrl = localStorage.getItem(API_URL_KEY) || DEFAULT_API_URL;
      const response = await fetch(`${apiUrl}?limit=500`, { headers: { Authorization: `Bearer ${owner}`, Accept: "application/json" } });
      const result = await response.json() as { records?: Array<Record<string, unknown>> };
      if (!response.ok) throw new Error("收取失败");
      const byId = new Map((result.records || []).map((item) => [String(item.id || ""), item]));
      let count = 0;
      const next = records.map((record) => {
        const cloud = byId.get(record.id);
        if (cloud?.module !== "cafe") return record;
        const cloudNote = typeof cloud.note === "string" ? cloud.note : "";
        const cloudTime = typeof cloud?.noteUpdatedAt === "string" ? cloud.noteUpdatedAt : null;
        if (cloudNote && cloudNote !== record.note && new Date(cloudTime || 0).getTime() >= new Date(record.noteUpdatedAt || 0).getTime()) {
          count += 1; return { ...record, note: cloudNote, noteUpdatedAt: cloudTime };
        }
        return record;
      });
      if (count) persist(next);
      notify(count ? `已收取 ${count} 篇 AI 新手记，并放回对应剧场卡。` : "没有发现比本机更新的 AI 手记。 ");
    } catch { notify("新手记暂时没有取回来，请稍后再试。 "); }
    finally { setPulling(false); }
  }

  function updateNote(record: CafeRecord, note: string) {
    persist(records.map((item) => item.id === record.id ? { ...item, note, noteUpdatedAt: new Date().toISOString() } : item));
  }

  return (
    <section
      id="cafe"
      className="cafe-room"
      style={{
        backgroundImage:
          'linear-gradient(180deg, rgba(18,7,10,.12), rgba(18,7,10,.28)), url("images/crimson-cafe-background.webp")',
        backgroundPosition: "center top",
        backgroundSize: "cover",
        backgroundAttachment: "fixed",
      }}
    >
      <div className={`cafe-toast ${toast ? "show" : ""}`}>{toast}</div>
      <header className="cafe-hero">
        <div>
          <p>CRIMSON CAFÉ · NOW SERVING STORIES</p>
          <h2>点一杯咖啡，<br /><em>看一段只属于你们的故事。</em></h2>
          <span>咖啡馆负责日常、陪伴与小剧场。今天想喝点什么？</span>
        </div>
        <div className="cafe-cup" aria-hidden="true"><i /><b>☕</b><small>CAFÉ</small></div>
      </header>

      <div className="cafe-dashboard">
        <article className="cafe-daily">
          <p className="cafe-label">TODAY&apos;S RECOMMENDATION · 今日推荐</p>
          <h3>{today.title}</h3><span>{today.flavour} · {today.category}</span><p>{today.premise}</p>
          <button type="button" onClick={() => orderMenu(today, "daily")}>点今日推荐</button>
        </article>
        <article className="cafe-random">
          <p className="cafe-label">BARISTA&apos;S CHOICE · 随机剧场</p>
          <h3>把今天交给咖啡师</h3><p>不用填写任何内容，随机抽取一份只演一次的故事订单。</p>
          <button type="button" onClick={randomOrder}>🎲 随机特调</button>
        </article>
      </div>

      <div className="cafe-menu">
        {menu.map((item) => <button type="button" key={item.title} onClick={() => orderMenu(item)}><small>{item.category}</small><strong>{item.title}</strong><span>{item.flavour}</span></button>)}
      </div>

      <section id="cafe-workshop" className="cafe-workshop">
        <header><p className="cafe-label">STORY RECIPE · 剧场工坊</p><h3>调一份私人故事配方</h3></header>
        <div className="cafe-form">
          <label><span>今天想看什么</span><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例如：初雪那天，他终于来接我" /></label>
          <label className="wide"><span>核心设定</span><textarea value={premise} onChange={(e) => setPremise(e.target.value)} placeholder="想发生的事情、故事起点和主要冲突……" /></label>
          <label><span>必须出现</span><textarea value={mustInclude} onChange={(e) => setMustInclude(e.target.value)} placeholder="对白、动作、场景或关键情节" /></label>
          <label><span>不要出现</span><textarea value={avoid} onChange={(e) => setAvoid(e.target.value)} placeholder="不喜欢的桥段、角色或走向" /></label>
          <label><span>故事味道</span><input value={flavour} onChange={(e) => setFlavour(e.target.value)} /></label>
          <label><span>叙事偏好</span><input value={narrative} onChange={(e) => setNarrative(e.target.value)} /></label>
        </div>
        <div className="cup-selector">{(Object.keys(cupLabels) as CupSize[]).map((size) => <button type="button" className={cupSize === size ? "active" : ""} key={size} onClick={() => setCupSize(size)}><strong>{cupLabels[size].name}</strong><small>{cupLabels[size].hint}</small></button>)}</div>
        <div className="cafe-form-actions"><button type="button" onClick={saveRecipe}>保存配方</button><button className="primary" type="button" onClick={orderCustom}>开始演绎</button></div>
      </section>

      {recipes.length ? <section className="recipe-shelf"><header><p className="cafe-label">PRIVATE RECIPES · 私人配方</p><h3>配方柜</h3></header><div>{recipes.map((recipe) => <button type="button" key={recipe.id} onClick={() => useRecipe(recipe)}><strong>{recipe.title}</strong><span>{recipe.flavour} · {cupLabels[recipe.cupSize].name}</span></button>)}</div></section> : null}

      <section className="cafe-library">
        <header><div><p className="cafe-label">THE STORY SHELF · 剧场书架</p><h3>每一杯故事，都留下一张剧场卡。</h3></div><div className="cafe-cloud-actions"><button type="button" onClick={syncCafe} disabled={syncing}>{syncing ? "同步中…" : "同步剧场订单"}</button><button type="button" onClick={pullNotes} disabled={pulling}>{pulling ? "收取中…" : "收取新手记"}</button></div></header>
        <div className="cafe-record-grid">
          <div className="cafe-record-list">{records.length ? records.map((record, index) => <button type="button" className={active?.id === record.id ? "active" : ""} key={record.id} onClick={() => setActiveId(record.id)}><small>CF-{String(index + 1).padStart(4, "0")} · {formatDate(record.createdAt)}</small><strong>{record.title}</strong><span>{record.flavour} · {cupLabels[record.cupSize].name}{record.note ? " · 已有手记" : ""}</span></button>) : <div className="cafe-empty">还没有剧场卡。先点一杯故事吧。</div>}</div>
          <article className="cafe-record-detail">{active ? <><p className="cafe-label">CURRENT ORDER · 当前订单</p><h3>{active.title}</h3><span>{active.category} · {active.flavour} · {cupLabels[active.cupSize].name}</span><p>{active.premise}</p>{active.mustInclude ? <dl><dt>必须出现</dt><dd>{active.mustInclude}</dd></dl> : null}{active.avoid ? <dl><dt>避免出现</dt><dd>{active.avoid}</dd></dl> : null}<div className="cafe-ai-actions"><button type="button" onClick={() => sendToAI(active)}>发送给 AI</button><button type="button" onClick={() => persist(records.map((item) => item.id === active.id ? { ...item, favorite: !item.favorite } : item))}>{active.favorite ? "取消收藏" : "收藏故事"}</button></div><label className="cafe-note"><span>STORY NOTE · 剧场手记</span><textarea value={active.note} onChange={(e) => updateNote(active, e.target.value)} placeholder="AI 的完整小剧场会收取到这里，也可以自己编辑……" /></label></> : <div className="cafe-empty">选中一张剧场卡查看订单。</div>}</article>
        </div>
      </section>
    </section>
  );
}
