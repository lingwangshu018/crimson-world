import { StrictMode, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./library-studio.css";

type Category = { id: string; name: string };
type Character = {
  id: string;
  name: string;
  nickname: string;
  profile: string;
  avatar: string;
  categoryId: string;
  enabled: boolean;
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
};
type Worldbook = {
  id: string;
  title: string;
  content: string;
  keywords: string[];
  categoryId: string;
  scope: "public" | "character";
  characterIds: string[];
  position: "before" | "middle" | "after";
  order: number;
  enabled: boolean;
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
};
type LibraryData = {
  version: 1;
  characterCategories: Category[];
  worldbookCategories: Category[];
  characters: Character[];
  worldbooks: Worldbook[];
};

const STORAGE_KEY = "crimson.royal-library.v1";
const now = () => new Date().toISOString();
const id = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const emptyData: LibraryData = {
  version: 1,
  characterCategories: [{ id: "character-default", name: "未分类" }],
  worldbookCategories: [{ id: "worldbook-default", name: "未分类" }],
  characters: [],
  worldbooks: [],
};

function downloadJson(name: string, value: unknown) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function CharacterEditor({ value, categories, onSave, onClose }: {
  value: Character | null;
  categories: Category[];
  onSave: (item: Character) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<Character>(() => value || {
    id: id("character"), name: "", nickname: "", profile: "", avatar: "",
    categoryId: categories[0]?.id || "character-default", enabled: true, favorite: false,
    createdAt: now(), updatedAt: now(),
  });
  const avatarRef = useRef<HTMLInputElement>(null);

  async function changeAvatar(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return alert("请选择图片文件。\n");
    if (file.size > 3 * 1024 * 1024) return alert("头像请控制在 3MB 以内。\n");
    setDraft({ ...draft, avatar: await readFileAsDataUrl(file) });
  }

  function submit() {
    if (!draft.name.trim()) return alert("请填写角色名。\n");
    if (!draft.profile.trim()) return alert("请填写人物设定。\n");
    onSave({ ...draft, name: draft.name.trim(), nickname: draft.nickname.trim(), profile: draft.profile.trim(), updatedAt: now() });
  }

  return <div className="modal-backdrop" onMouseDown={onClose}>
    <section className="editor" onMouseDown={(event) => event.stopPropagation()}>
      <header><div><small>CHARACTER CARD</small><h2>{value ? "编辑角色" : "新建角色"}</h2></div><button onClick={onClose}>×</button></header>
      <div className="editor-body">
        <div className="avatar-editor">
          <button className="avatar-large" onClick={() => avatarRef.current?.click()}>{draft.avatar ? <img src={draft.avatar} /> : <span>＋</span>}</button>
          <div><b>角色头像</b><p>点击上传或更换图片</p>{draft.avatar && <button className="text-button" onClick={() => setDraft({ ...draft, avatar: "" })}>恢复默认头像</button>}</div>
          <input ref={avatarRef} hidden type="file" accept="image/*" onChange={(event) => changeAvatar(event.target.files?.[0])} />
        </div>
        <label>角色名 <em>*</em><input value={draft.name} maxLength={40} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="例如：艾莉西亚" /></label>
        <label>昵称 <span>选填</span><input value={draft.nickname} maxLength={80} onChange={(e) => setDraft({ ...draft, nickname: e.target.value })} placeholder="例如：艾莉、小公主、殿下" /></label>
        <label>角色分类<select value={draft.categoryId} onChange={(e) => setDraft({ ...draft, categoryId: e.target.value })}>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label>人物设定 <em>*</em><textarea value={draft.profile} onChange={(e) => setDraft({ ...draft, profile: e.target.value })} placeholder="身份、性格、经历、说话习惯、关系与其他设定……" /></label>
        <div className="switch-row"><label><input type="checkbox" checked={draft.enabled} onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })} /> 启用角色</label><label><input type="checkbox" checked={draft.favorite} onChange={(e) => setDraft({ ...draft, favorite: e.target.checked })} /> 加入收藏</label></div>
      </div>
      <footer><button className="secondary" onClick={onClose}>取消</button><button className="primary" onClick={submit}>保存角色</button></footer>
    </section>
  </div>;
}

function WorldbookEditor({ value, categories, characters, onSave, onClose }: {
  value: Worldbook | null;
  categories: Category[];
  characters: Character[];
  onSave: (item: Worldbook) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<Worldbook>(() => value || {
    id: id("worldbook"), title: "", content: "", keywords: [], categoryId: categories[0]?.id || "worldbook-default",
    scope: "public", characterIds: [], position: "middle", order: 5, enabled: true, favorite: false,
    createdAt: now(), updatedAt: now(),
  });
  const [keywordText, setKeywordText] = useState(draft.keywords.join("，"));
  function submit() {
    if (!draft.title.trim() || !draft.content.trim()) return alert("请填写标题与条目内容。\n");
    const order = Number.isFinite(draft.order) && draft.order >= 1 && draft.order <= 10 ? draft.order : 5;
    onSave({ ...draft, title: draft.title.trim(), content: draft.content.trim(), keywords: keywordText.split(/[,，\n]/).map((v) => v.trim()).filter(Boolean), order, updatedAt: now() });
  }
  return <div className="modal-backdrop" onMouseDown={onClose}>
    <section className="editor" onMouseDown={(event) => event.stopPropagation()}>
      <header><div><small>WORLD BOOK</small><h2>{value ? "编辑世界书" : "新建世界书"}</h2></div><button onClick={onClose}>×</button></header>
      <div className="editor-body">
        <label>条目标题 <em>*</em><input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></label>
        <label>所属分类<select value={draft.categoryId} onChange={(e) => setDraft({ ...draft, categoryId: e.target.value })}>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label>关键词 <span>选填；留空则始终注入</span><input value={keywordText} onChange={(e) => setKeywordText(e.target.value)} placeholder="用逗号分隔" /></label>
        <div className="two-cols"><label>注入位置<select value={draft.position} onChange={(e) => setDraft({ ...draft, position: e.target.value as Worldbook["position"] })}><option value="before">前（人设之前）</option><option value="middle">中（默认）</option><option value="after">后（人设之后）</option></select></label><label>注入顺序 <span>留空默认 5</span><input type="number" min="1" max="10" value={draft.order || ""} onChange={(e) => setDraft({ ...draft, order: e.target.value ? Number(e.target.value) : 5 })} /></label></div>
        <fieldset><legend>世界书范围</legend><label><input type="radio" checked={draft.scope === "public"} onChange={() => setDraft({ ...draft, scope: "public", characterIds: [] })} /> 公共世界书（全部角色自动读取）</label><label><input type="radio" checked={draft.scope === "character"} onChange={() => setDraft({ ...draft, scope: "character" })} /> 角色世界书</label></fieldset>
        {draft.scope === "character" && <div className="character-picker">{characters.length ? characters.map((character) => <label key={character.id}><input type="checkbox" checked={draft.characterIds.includes(character.id)} onChange={(e) => setDraft({ ...draft, characterIds: e.target.checked ? [...draft.characterIds, character.id] : draft.characterIds.filter((item) => item !== character.id) })} />{character.name}</label>) : <p>还没有角色，请先创建角色。</p>}</div>}
        <label>条目内容 <em>*</em><textarea value={draft.content} onChange={(e) => setDraft({ ...draft, content: e.target.value })} /></label>
        <div className="switch-row"><label><input type="checkbox" checked={draft.enabled} onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })} /> 启用条目</label><label><input type="checkbox" checked={draft.favorite} onChange={(e) => setDraft({ ...draft, favorite: e.target.checked })} /> 加入收藏</label></div>
      </div>
      <footer><button className="secondary" onClick={onClose}>取消</button><button className="primary" onClick={submit}>保存世界书</button></footer>
    </section>
  </div>;
}

function App() {
  const [data, setData] = useState<LibraryData>(emptyData);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<"characters" | "worldbooks">("characters");
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [editingCharacter, setEditingCharacter] = useState<Character | null | undefined>(undefined);
  const [editingWorldbook, setEditingWorldbook] = useState<Worldbook | null | undefined>(undefined);
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try { const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); if (saved?.version === 1) setData(saved); } catch {}
    setReady(true);
  }, []);
  useEffect(() => { if (ready) localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }, [data, ready]);

  const categories = tab === "characters" ? data.characterCategories : data.worldbookCategories;
  const visibleCharacters = useMemo(() => data.characters.filter((item) => (category === "all" || item.categoryId === category) && `${item.name} ${item.nickname} ${item.profile}`.toLowerCase().includes(query.toLowerCase())), [data.characters, category, query]);
  const visibleWorldbooks = useMemo(() => data.worldbooks.filter((item) => (category === "all" || item.categoryId === category) && `${item.title} ${item.content} ${item.keywords.join(" ")}`.toLowerCase().includes(query.toLowerCase())), [data.worldbooks, category, query]);

  function saveCharacter(item: Character) { setData((old) => ({ ...old, characters: old.characters.some((v) => v.id === item.id) ? old.characters.map((v) => v.id === item.id ? item : v) : [item, ...old.characters] })); setEditingCharacter(undefined); }
  function saveWorldbook(item: Worldbook) { setData((old) => ({ ...old, worldbooks: old.worldbooks.some((v) => v.id === item.id) ? old.worldbooks.map((v) => v.id === item.id ? item : v) : [item, ...old.worldbooks] })); setEditingWorldbook(undefined); }
  function addCategory() { const name = prompt("分类名称"); if (!name?.trim()) return; const item = { id: id("category"), name: name.trim() }; setData((old) => tab === "characters" ? { ...old, characterCategories: [...old.characterCategories, item] } : { ...old, worldbookCategories: [...old.worldbookCategories, item] }); }
  function deleteCharacter(item: Character) { if (!confirm(`确定删除角色“${item.name}”吗？\n关联世界书会保留，但会解除该角色绑定。`)) return; setData((old) => ({ ...old, characters: old.characters.filter((v) => v.id !== item.id), worldbooks: old.worldbooks.map((v) => ({ ...v, characterIds: v.characterIds.filter((characterId) => characterId !== item.id) })) })); }
  function importJson(file?: File) { if (!file) return; file.text().then((text) => { try { const value = JSON.parse(text); if (value.version === 1 && Array.isArray(value.characters) && Array.isArray(value.worldbooks)) setData(value); else if (value.profile && value.name) saveCharacter({ ...value, id: value.id || id("character"), createdAt: value.createdAt || now(), updatedAt: now() }); else if (value.content && value.title) saveWorldbook({ ...value, id: value.id || id("worldbook"), createdAt: value.createdAt || now(), updatedAt: now() }); else alert("没有识别到绯界角色或世界书格式。\n"); } catch { alert("JSON 文件读取失败。\n"); } }); }

  return <main className="studio-shell">
    <aside className="studio-sidebar"><div className="studio-brand"><span>♜</span><div><b>皇家图书馆</b><small>编纂室 · STUDIO</small></div></div><nav><button className={tab === "characters" ? "active" : ""} onClick={() => { setTab("characters"); setCategory("all"); }}>👤 角色</button><button className={tab === "worldbooks" ? "active" : ""} onClick={() => { setTab("worldbooks"); setCategory("all"); }}>📚 世界书</button></nav><div className="category-list"><div><b>分类</b><button onClick={addCategory}>＋</button></div><button className={category === "all" ? "active" : ""} onClick={() => setCategory("all")}>全部</button>{categories.map((item) => <button key={item.id} className={category === item.id ? "active" : ""} onClick={() => setCategory(item.id)}>{item.name}</button>)}</div><a href="./library.html">← 返回皇家图书馆</a></aside>
    <section className="studio-main"><header className="studio-topbar"><div><small>ROYAL LIBRARY</small><h1>{tab === "characters" ? "角色" : "世界书"}</h1><p>{tab === "characters" ? "保存角色、分类整理，并让其他模块自动读取启用角色。" : "管理公共世界书与角色专属世界书。"}</p></div><div className="top-actions"><button onClick={() => importRef.current?.click()}>导入 JSON</button><button onClick={() => downloadJson("crimson-royal-library.json", data)}>导出全部</button><button className="primary" onClick={() => tab === "characters" ? setEditingCharacter(null) : setEditingWorldbook(null)}>＋ 新建{tab === "characters" ? "角色" : "世界书"}</button><input ref={importRef} hidden type="file" accept="application/json,.json" onChange={(e) => importJson(e.target.files?.[0])} /></div></header>
      <div className="toolbar"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`搜索${tab === "characters" ? "角色" : "世界书"}……`} /><span>{tab === "characters" ? visibleCharacters.length : visibleWorldbooks.length} 项</span></div>
      <div className="card-grid">{tab === "characters" ? visibleCharacters.map((item) => <article className={`library-card ${item.enabled ? "" : "disabled"}`} key={item.id}><button className="favorite" onClick={() => saveCharacter({ ...item, favorite: !item.favorite })}>{item.favorite ? "★" : "☆"}</button><div className="avatar">{item.avatar ? <img src={item.avatar} /> : item.name.slice(0, 1)}</div><div className="card-content"><div className="card-title"><h2>{item.name}</h2><span>{item.enabled ? "已启用" : "已停用"}</span></div>{item.nickname && <p className="nickname">昵称：{item.nickname}</p>}<p>{item.profile}</p></div><footer><button onClick={() => saveCharacter({ ...item, enabled: !item.enabled })}>{item.enabled ? "停用" : "启用"}</button><button onClick={() => downloadJson(`${item.name}.json`, item)}>导出</button><button onClick={() => setEditingCharacter(item)}>编辑</button><button className="danger" onClick={() => deleteCharacter(item)}>删除</button></footer></article>) : visibleWorldbooks.map((item) => <article className={`library-card worldbook ${item.enabled ? "" : "disabled"}`} key={item.id}><button className="favorite" onClick={() => saveWorldbook({ ...item, favorite: !item.favorite })}>{item.favorite ? "★" : "☆"}</button><div className="book-icon">▥</div><div className="card-content"><div className="card-title"><h2>{item.title}</h2><span>{item.scope === "public" ? "公共" : "角色专属"}</span></div><p>{item.content}</p><div className="chips"><i>{item.position === "before" ? "人设之前" : item.position === "after" ? "人设之后" : "默认位置"}</i><i>顺序 {item.order || 5}</i>{item.keywords.map((word) => <i key={word}>{word}</i>)}</div></div><footer><button onClick={() => saveWorldbook({ ...item, enabled: !item.enabled })}>{item.enabled ? "停用" : "启用"}</button><button onClick={() => downloadJson(`${item.title}.json`, item)}>导出</button><button onClick={() => setEditingWorldbook(item)}>编辑</button><button className="danger" onClick={() => confirm(`确定删除“${item.title}”吗？`) && setData((old) => ({ ...old, worldbooks: old.worldbooks.filter((v) => v.id !== item.id) }))}>删除</button></footer></article>)}</div>
      {((tab === "characters" && !visibleCharacters.length) || (tab === "worldbooks" && !visibleWorldbooks.length)) && <div className="empty"><span>{tab === "characters" ? "👤" : "📚"}</span><h2>这里还是空的</h2><p>创建第一份{tab === "characters" ? "角色卡" : "世界书条目"}，绯界就能开始读取它啦。</p></div>}
    </section>
    {editingCharacter !== undefined && <CharacterEditor value={editingCharacter} categories={data.characterCategories} onSave={saveCharacter} onClose={() => setEditingCharacter(undefined)} />}
    {editingWorldbook !== undefined && <WorldbookEditor value={editingWorldbook} categories={data.worldbookCategories} characters={data.characters} onSave={saveWorldbook} onClose={() => setEditingWorldbook(undefined)} />}
  </main>;
}

createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
