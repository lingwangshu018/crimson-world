import fs from "node:fs";

const componentPath = "github-pages/library.tsx";
const stylePath = "github-pages/library.css";
let source = fs.readFileSync(componentPath, "utf8").replace(/\r\n/g, "\n");
let styles = fs.readFileSync(stylePath, "utf8").replace(/\r\n/g, "\n");

if (source.includes("CRIMSON_LIBRARY_WISH_ADMIN")) process.exit(0);

function replace(before, after) {
  if (!source.includes(before)) throw new Error(`Wish admin target not found: ${before.slice(0, 120)}`);
  source = source.replace(before, after);
}

replace(
  'type Wish = { id: string; type: string; title: string; content: string; authorName: string; status: string; lights: number; createdAt: string; };',
  'type Wish = { id: string; type: string; title: string; content: string; authorName: string; status: string; lights: number; createdAt: string; officialReply?: string; pinned?: number; };\n\n// CRIMSON_LIBRARY_WISH_ADMIN\nconst WISH_ADMIN_SESSION_KEY = "crimson-world.wish-admin-key.v1";',
);

replace(
  '  const [wishName, setWishName] = useState("");',
  '  const [wishName, setWishName] = useState("");\n  const [wishAdminOpen, setWishAdminOpen] = useState(false);\n  const [wishAdminKey, setWishAdminKey] = useState("");\n  const [wishAdmin, setWishAdmin] = useState(false);\n  const [wishAdminBusy, setWishAdminBusy] = useState(false);',
);

replace(
  '  async function loadWishes() {',
  '  useEffect(() => {\n    const saved = sessionStorage.getItem(WISH_ADMIN_SESSION_KEY) || "";\n    if (saved) { setWishAdminKey(saved); void verifyWishAdmin(saved, false); }\n  }, []);\n\n  async function verifyWishAdmin(key = wishAdminKey, notify = true) {\n    if (!key.trim()) return;\n    setWishAdminBusy(true);\n    try {\n      const response = await fetch(OFFICIAL_WISH_API, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${key.trim()}` }, body: JSON.stringify({ action: "admin-login" }) });\n      const data = await response.json();\n      if (!response.ok) throw new Error(data.error || "编纂者凭证不正确。");\n      sessionStorage.setItem(WISH_ADMIN_SESSION_KEY, key.trim());\n      setWishAdminKey(key.trim()); setWishAdmin(true); setWishAdminOpen(false);\n      if (notify) window.alert("✦ 欢迎回来，初代编纂者。");\n    } catch (error) {\n      sessionStorage.removeItem(WISH_ADMIN_SESSION_KEY); setWishAdmin(false);\n      if (notify) window.alert(error instanceof Error ? error.message : "没有认出编纂者。");\n    } finally { setWishAdminBusy(false); }\n  }\n\n  function leaveWishAdmin() {\n    sessionStorage.removeItem(WISH_ADMIN_SESSION_KEY); setWishAdminKey(""); setWishAdmin(false);\n  }\n\n  async function manageWish(wish: Wish) {\n    const status = window.prompt("修改愿望状态：waiting / seen / considering / building / done / declined", wish.status)?.trim();\n    if (!status) return;\n    const officialReply = window.prompt("编纂者回应（可留空）：", wish.officialReply || "");\n    if (officialReply === null) return;\n    const pinned = window.confirm(wish.pinned ? "取消置顶这枚愿望吗？" : "要把这枚愿望置顶吗？");\n    const response = await fetch(OFFICIAL_WISH_API, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${wishAdminKey}` }, body: JSON.stringify({ id: wish.id, status, officialReply, pinned }) });\n    const data = await response.json();\n    if (!response.ok) { window.alert(data.error || "管理操作失败。"); return; }\n    await loadWishes();\n  }\n\n  async function deleteWish(id: string) {\n    if (!window.confirm("确定要永久删除这枚愿望吗？")) return;\n    const response = await fetch(`${OFFICIAL_WISH_API}?id=${encodeURIComponent(id)}`, { method: "DELETE", headers: { Authorization: `Bearer ${wishAdminKey}` } });\n    const data = await response.json();\n    if (!response.ok) { window.alert(data.error || "删除失败。"); return; }\n    await loadWishes();\n  }\n\n  async function loadWishes() {',
);

replace(
  '<div className="wish-pool-hero"><div><span>OFFICIAL COMMUNITY</span><h2>许愿池</h2><p>这里连接的是绯界官方云端，不会跟随访客的私人云端设置改变。</p></div><button type="button" onClick={() => setWishOpen(true)}>＋ 投下愿望</button></div>',
  '<div className="wish-pool-hero"><div><span>OFFICIAL COMMUNITY</span><h2>许愿池</h2><p>这里连接的是绯界官方云端，不会跟随访客的私人云端设置改变。</p></div><div className="wish-hero-actions"><button type="button" onClick={() => setWishOpen(true)}>＋ 投下愿望</button>{wishAdmin ? <button type="button" className="owner" onClick={leaveWishAdmin}>✦ 初代编纂者</button> : <button type="button" className="quiet" onClick={() => setWishAdminOpen(true)}>编纂者登录</button>}</div></div>',
);

replace(
  '<div className="wish-list">{wishes.map((wish) => <article className="wish-card" key={wish.id}><header><span>{wishTypes[wish.type as keyof typeof wishTypes] || wishTypes.note}</span><em>{wishStatuses[wish.status] || wish.status}</em></header><h3>{wish.title}</h3><p>{wish.content}</p><footer><small>{wish.authorName || "匿名旅人"} · {new Date(wish.createdAt).toLocaleString("zh-CN")}</small><button type="button" onClick={() => lightWish(wish.id)}>✦ 点亮 {wish.lights}</button></footer></article>)}</div>',
  '<div className="wish-list">{wishes.map((wish) => <article className={`wish-card ${wish.pinned ? "is-pinned" : ""}`} key={wish.id}><header><span>{wishTypes[wish.type as keyof typeof wishTypes] || wishTypes.note}{wish.pinned ? " · 置顶" : ""}</span><em>{wishStatuses[wish.status] || wish.status}</em></header><h3>{wish.title}</h3><p>{wish.content}</p>{wish.officialReply ? <aside className="wish-official-reply"><b>✦ 初代编纂者回应</b><p>{wish.officialReply}</p></aside> : null}<footer><small>{wish.authorName || "匿名旅人"} · {new Date(wish.createdAt).toLocaleString("zh-CN")}</small><div><button type="button" onClick={() => lightWish(wish.id)}>✦ 点亮 {wish.lights}</button>{wishAdmin ? <><button type="button" className="manage" onClick={() => manageWish(wish)}>管理</button><button type="button" className="danger" onClick={() => deleteWish(wish.id)}>删除</button></> : null}</div></footer></article>)}</div>',
);

replace(
  '{wishOpen ? <div className="wish-compose-backdrop" onClick={() => setWishOpen(false)}>',
  '{wishAdminOpen ? <div className="wish-compose-backdrop" onClick={() => setWishAdminOpen(false)}><form className="wish-compose wish-admin-login" onSubmit={(event) => { event.preventDefault(); void verifyWishAdmin(); }} onClick={(event) => event.stopPropagation()}><header><div><small>OWNER ACCESS</small><h3>编纂者身份</h3></div><button type="button" onClick={() => setWishAdminOpen(false)}>×</button></header><p>请输入保存在 Cloudflare Secret 中的最高权限凭证。</p><label>管理员密钥<input type="password" autoComplete="current-password" value={wishAdminKey} onChange={(event) => setWishAdminKey(event.target.value)} placeholder="WISH_ADMIN_KEY" required /></label><button className="submit-wish" type="submit" disabled={wishAdminBusy}>{wishAdminBusy ? "兔兔正在确认……" : "确认编纂者身份"}</button></form></div> : null}\n              {wishOpen ? <div className="wish-compose-backdrop" onClick={() => setWishOpen(false)}>',
);

styles += `\n\n/* CRIMSON_LIBRARY_WISH_ADMIN_STYLES */\n.wish-hero-actions{display:flex;flex-wrap:wrap;gap:10px;justify-content:flex-end}.wish-hero-actions .quiet{background:rgba(255,255,255,.03);color:#a9957c}.wish-hero-actions .owner{border-color:rgba(241,217,166,.7);background:linear-gradient(135deg,#8a5d32,#51321d);color:#fff1c9}.wish-card.is-pinned{border-color:rgba(241,217,166,.58);box-shadow:0 18px 46px rgba(0,0,0,.3),inset 3px 0 0 rgba(241,217,166,.45)}.wish-official-reply{margin:18px 0;padding:16px 18px;border:1px solid rgba(223,188,111,.34);border-radius:12px;background:linear-gradient(135deg,rgba(92,55,30,.34),rgba(55,29,47,.34))}.wish-official-reply b{color:#f0d69d;font-size:13px}.wish-official-reply p{margin:8px 0 0;color:#e6d5b7}.wish-card footer>div{display:flex;flex-wrap:wrap;gap:8px}.wish-card button.manage{background:rgba(94,75,35,.55)}.wish-card button.danger{border-color:rgba(191,83,103,.42);background:rgba(112,28,48,.42);color:#efb4bf}.wish-admin-login>p{margin:0;color:#a9967e;line-height:1.7}.wish-admin-login button:disabled{opacity:.55}@media(max-width:640px){.wish-hero-actions{width:100%;display:grid;grid-template-columns:1fr}.wish-card footer>div{width:100%;display:grid;grid-template-columns:1fr}.wish-card footer>div button{width:100%}}\n`;

fs.writeFileSync(componentPath, source);
fs.writeFileSync(stylePath, styles);
console.log("Applied owner authentication and moderation controls to the Wish Pool.");
