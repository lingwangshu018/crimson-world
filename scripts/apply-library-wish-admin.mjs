import fs from "node:fs";

const componentPath = "github-pages/WishPool.tsx";
const stylePath = "github-pages/wish-pool.css";
let source = fs.readFileSync(componentPath, "utf8").replace(/\r\n/g, "\n");
let styles = fs.readFileSync(stylePath, "utf8").replace(/\r\n/g, "\n");

if (source.includes("CRIMSON_LIBRARY_WISH_ADMIN")) {
  console.log("Wish Pool owner controls already integrated.");
  process.exit(0);
}

function replace(before, after) {
  if (!source.includes(before)) throw new Error(`Wish admin target not found: ${before.slice(0, 120)}`);
  source = source.replace(before, after);
}

replace(
`type Wish = {
  id: string;
  type: string;
  title: string;
  content: string;
  authorName: string;
  status: string;
  lights: number;
  createdAt: string;
};`,
`type Wish = {
  id: string;
  type: string;
  title: string;
  content: string;
  authorName: string;
  status: string;
  lights: number;
  createdAt: string;
  officialReply?: string;
  pinned?: number;
};

// CRIMSON_LIBRARY_WISH_ADMIN
const WISH_ADMIN_SESSION_KEY = "crimson-world.wish-admin-session.v2";`
);

replace(
`  const [name, setName] = useState("");`,
`  const [name, setName] = useState("");
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminUser, setAdminUser] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminToken, setAdminToken] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminBusy, setAdminBusy] = useState(false);`
);

replace(
`  async function load() {`,
`  useEffect(() => {
    const saved = sessionStorage.getItem(WISH_ADMIN_SESSION_KEY) || "";
    if (saved) { setAdminToken(saved); void verifyAdminSession(saved); }
  }, []);

  async function verifyAdminSession(token: string) {
    try {
      const response = await fetch(OFFICIAL_WISH_API, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ action: "admin-verify" }),
      });
      if (!response.ok) throw new Error("登录状态已失效");
      setIsAdmin(true);
    } catch {
      sessionStorage.removeItem(WISH_ADMIN_SESSION_KEY);
      setAdminToken("");
      setIsAdmin(false);
    }
  }

  async function loginAdmin(event: FormEvent) {
    event.preventDefault();
    setAdminBusy(true);
    try {
      const response = await fetch(OFFICIAL_WISH_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "admin-login", username: adminUser, password: adminPassword }),
      });
      const data = await response.json();
      if (!response.ok || !data.token) throw new Error(data.error || "账号或密码不正确。");
      sessionStorage.setItem(WISH_ADMIN_SESSION_KEY, data.token);
      setAdminToken(data.token);
      setAdminPassword("");
      setIsAdmin(true);
      setAdminOpen(false);
      window.alert("✦ 欢迎回来，初代编纂者。");
    } catch (reason) {
      window.alert(reason instanceof Error ? reason.message : "没有认出编纂者。");
    } finally {
      setAdminBusy(false);
    }
  }

  async function leaveAdmin() {
    const token = adminToken;
    sessionStorage.removeItem(WISH_ADMIN_SESSION_KEY);
    setAdminToken("");
    setIsAdmin(false);
    if (token) {
      await fetch(OFFICIAL_WISH_API, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ action: "admin-logout" }),
      }).catch(() => undefined);
    }
  }

  async function manageWish(wish: Wish) {
    const status = window.prompt("修改状态：waiting / seen / considering / building / done / declined", wish.status)?.trim();
    if (!status) return;
    const officialReply = window.prompt("初代编纂者回应（可留空）：", wish.officialReply || "");
    if (officialReply === null) return;
    const pinned = window.confirm(wish.pinned ? "取消置顶这枚愿望吗？" : "要把这枚愿望置顶吗？");
    const response = await fetch(OFFICIAL_WISH_API, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + adminToken },
      body: JSON.stringify({ id: wish.id, status, officialReply, pinned }),
    });
    const data = await response.json();
    if (!response.ok) { window.alert(data.error || "管理操作失败。"); return; }
    await load();
  }

  async function deleteWish(id: string) {
    if (!window.confirm("确定要永久删除这枚愿望吗？")) return;
    const response = await fetch(OFFICIAL_WISH_API + "?id=" + encodeURIComponent(id), {
      method: "DELETE",
      headers: { Authorization: "Bearer " + adminToken },
    });
    const data = await response.json();
    if (!response.ok) { window.alert(data.error || "删除失败。"); return; }
    await load();
  }

  async function load() {`
);

replace(
`        <button type="button" onClick={() => setOpen(true)}>＋ 投下愿望</button>`,
`        <div className="wish-hero-actions">
          <button type="button" onClick={() => setOpen(true)}>＋ 投下愿望</button>
          {isAdmin ? <button type="button" className="owner" onClick={() => void leaveAdmin()}>✦ 初代编纂者</button> : <button type="button" className="quiet" onClick={() => setAdminOpen(true)}>编纂者登录</button>}
        </div>`
);

replace(
`          <article className="wish-card" key={wish.id}>
            <header><span>{types[wish.type as keyof typeof types] || types.note}</span><em>{statuses[wish.status] || wish.status}</em></header>
            <h3>{wish.title}</h3><p>{wish.content}</p>
            <footer><small>{wish.authorName || "匿名旅人"} · {new Date(wish.createdAt).toLocaleString("zh-CN")}</small><button type="button" onClick={() => light(wish.id)}>✦ 点亮 {wish.lights}</button></footer>
          </article>`,
`          <article className={\`wish-card \${wish.pinned ? "is-pinned" : ""}\`} key={wish.id}>
            <header><span>{types[wish.type as keyof typeof types] || types.note}{wish.pinned ? " · 置顶" : ""}</span><em>{statuses[wish.status] || wish.status}</em></header>
            <h3>{wish.title}</h3><p>{wish.content}</p>
            {wish.officialReply ? <aside className="wish-official-reply"><b>✦ 初代编纂者回应</b><p>{wish.officialReply}</p></aside> : null}
            <footer><small>{wish.authorName || "匿名旅人"} · {new Date(wish.createdAt).toLocaleString("zh-CN")}</small><div><button type="button" onClick={() => light(wish.id)}>✦ 点亮 {wish.lights}</button>{isAdmin ? <><button type="button" className="manage" onClick={() => manageWish(wish)}>管理</button><button type="button" className="danger" onClick={() => deleteWish(wish.id)}>删除</button></> : null}</div></footer>
          </article>`
);

replace(
`      {open ? (`,
`      {adminOpen ? (
        <div className="wish-compose-backdrop" onClick={() => setAdminOpen(false)}>
          <form className="wish-compose wish-admin-login" onSubmit={loginAdmin} onClick={(event) => event.stopPropagation()}>
            <header><div><small>OWNER ACCESS</small><h3>编纂者登录</h3></div><button type="button" onClick={() => setAdminOpen(false)}>×</button></header>
            <p>使用你的初代编纂者账号和密码登录。登录状态会在当前浏览器会话中保存七天以内。</p>
            <label>账号<input autoComplete="username" value={adminUser} onChange={(event) => setAdminUser(event.target.value)} placeholder="编纂者账号" required /></label>
            <label>密码<input type="password" autoComplete="current-password" value={adminPassword} onChange={(event) => setAdminPassword(event.target.value)} placeholder="登录密码" required /></label>
            <button className="submit-wish" type="submit" disabled={adminBusy}>{adminBusy ? "兔兔正在确认……" : "登录编纂者身份"}</button>
          </form>
        </div>
      ) : null}
      {open ? (`
);

styles += `

/* CRIMSON_LIBRARY_WISH_ADMIN_STYLES */
.wish-hero-actions{display:flex;flex-wrap:wrap;gap:10px;justify-content:flex-end}.wish-hero-actions .quiet{background:rgba(255,255,255,.03);color:#a9957c}.wish-hero-actions .owner{border-color:rgba(241,217,166,.7);background:linear-gradient(135deg,#8a5d32,#51321d);color:#fff1c9}.wish-card.is-pinned{border-color:rgba(241,217,166,.58);box-shadow:0 18px 46px rgba(0,0,0,.3),inset 3px 0 0 rgba(241,217,166,.45)}.wish-official-reply{margin:18px 0;padding:16px 18px;border:1px solid rgba(223,188,111,.34);border-radius:12px;background:linear-gradient(135deg,rgba(92,55,30,.34),rgba(55,29,47,.34))}.wish-official-reply b{color:#f0d69d;font-size:13px}.wish-official-reply p{margin:8px 0 0;color:#e6d5b7}.wish-card footer>div{display:flex;flex-wrap:wrap;gap:8px}.wish-card button.manage{background:rgba(94,75,35,.55)}.wish-card button.danger{border-color:rgba(191,83,103,.42);background:rgba(112,28,48,.42);color:#efb4bf}.wish-admin-login>p{margin:0;color:#a9967e;line-height:1.7}.wish-admin-login button:disabled{opacity:.55}@media(max-width:640px){.wish-hero-actions{width:100%;display:grid;grid-template-columns:1fr}.wish-card footer>div{width:100%;display:grid;grid-template-columns:1fr}.wish-card footer>div button{width:100%}}
`;

fs.writeFileSync(componentPath, source);
fs.writeFileSync(stylePath, styles);
console.log("Applied account-and-password owner authentication to the standalone Wish Pool.");
