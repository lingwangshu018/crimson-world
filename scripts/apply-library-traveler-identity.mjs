import fs from "node:fs";

const componentPath = "github-pages/WishPool.tsx";
const stylePath = "github-pages/wish-pool.css";
let source = fs.readFileSync(componentPath, "utf8").replace(/\r\n/g, "\n");
let styles = fs.readFileSync(stylePath, "utf8").replace(/\r\n/g, "\n");

if (source.includes("CRIMSON_LIBRARY_TRAVELER_IDENTITY")) {
  console.log("Wish Pool traveler identity already integrated.");
  process.exit(0);
}

function replaceExact(before, after) {
  if (!source.includes(before)) throw new Error(`Traveler identity target not found: ${before.slice(0, 140)}`);
  source = source.replace(before, after);
}

replaceExact(
`  pinned?: number;
};`,
`  pinned?: number;
  mine?: boolean;
};

// CRIMSON_LIBRARY_TRAVELER_IDENTITY
const TRAVELER_TOKEN_KEY = "crimson-world.wish-traveler-token.v1";
const TRAVELER_NAME_KEY = "crimson-world.wish-traveler-name.v1";`
);

replaceExact(
`  const [adminBusy, setAdminBusy] = useState(false);`,
`  const [adminBusy, setAdminBusy] = useState(false);
  const [travelerOpen, setTravelerOpen] = useState(false);
  const [travelerMode, setTravelerMode] = useState<"register" | "recover">("register");
  const [travelerName, setTravelerName] = useState("");
  const [travelerCode, setTravelerCode] = useState("");
  const [travelerToken, setTravelerToken] = useState("");
  const [travelerBusy, setTravelerBusy] = useState(false);
  const [issuedCode, setIssuedCode] = useState("");`
);

replaceExact(
`  async function load() {`,
`  useEffect(() => {
    const token = localStorage.getItem(TRAVELER_TOKEN_KEY) || "";
    const nickname = localStorage.getItem(TRAVELER_NAME_KEY) || "";
    if (!token) return;
    setTravelerToken(token);
    setTravelerName(nickname);
    void verifyTraveler(token);
  }, []);

  async function verifyTraveler(token = travelerToken) {
    if (!token) return;
    const response = await fetch(OFFICIAL_WISH_API, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Traveler-Token": token },
      body: JSON.stringify({ action: "traveler-verify" }),
    });
    const data = await response.json();
    if (!response.ok) {
      localStorage.removeItem(TRAVELER_TOKEN_KEY);
      localStorage.removeItem(TRAVELER_NAME_KEY);
      setTravelerToken("");
      return;
    }
    setTravelerName(data.traveler?.nickname || "");
  }

  async function submitTraveler(event: FormEvent) {
    event.preventDefault();
    setTravelerBusy(true);
    try {
      const action = travelerMode === "register" ? "traveler-register" : "traveler-login";
      const response = await fetch(OFFICIAL_WISH_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, nickname: travelerName, identityCode: travelerCode }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "兔兔没有认出这位旅人。");
      localStorage.setItem(TRAVELER_TOKEN_KEY, data.token);
      localStorage.setItem(TRAVELER_NAME_KEY, data.traveler.nickname);
      setTravelerToken(data.token);
      setTravelerName(data.traveler.nickname);
      if (data.identityCode) setIssuedCode(data.identityCode);
      else setTravelerOpen(false);
      setTravelerCode("");
      await load(data.token);
    } catch (reason) {
      window.alert(reason instanceof Error ? reason.message : "旅人身份登记失败。");
    } finally {
      setTravelerBusy(false);
    }
  }

  async function leaveTraveler() {
    if (travelerToken) {
      await fetch(OFFICIAL_WISH_API, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Traveler-Token": travelerToken },
        body: JSON.stringify({ action: "traveler-logout" }),
      }).catch(() => undefined);
    }
    localStorage.removeItem(TRAVELER_TOKEN_KEY);
    localStorage.removeItem(TRAVELER_NAME_KEY);
    setTravelerToken("");
    setTravelerName("");
    await load("");
  }

  async function editOwnWish(wish: Wish) {
    const title = window.prompt("修改愿望标题：", wish.title)?.trim();
    if (!title) return;
    const content = window.prompt("修改愿望正文：", wish.content)?.trim();
    if (!content) return;
    const response = await fetch(OFFICIAL_WISH_API, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "X-Traveler-Token": travelerToken },
      body: JSON.stringify({ id: wish.id, title, content }),
    });
    const data = await response.json();
    if (!response.ok) { window.alert(data.error || "没有改动成功。"); return; }
    await load();
  }

  async function deleteOwnWish(id: string) {
    if (!window.confirm("要收回自己投下的这枚愿望吗？")) return;
    const response = await fetch(OFFICIAL_WISH_API + "?id=" + encodeURIComponent(id), {
      method: "DELETE",
      headers: { "X-Traveler-Token": travelerToken },
    });
    const data = await response.json();
    if (!response.ok) { window.alert(data.error || "没有成功收回愿望。"); return; }
    await load();
  }

  async function load(token = travelerToken) {`
);

replaceExact(
`      const response = await fetch(OFFICIAL_WISH_API);`,
`      const response = await fetch(OFFICIAL_WISH_API, { headers: token ? { "X-Traveler-Token": token } : {} });`
);

replaceExact(
`{error ? <div className="wish-state error">{error}<button onClick={load}>重新查看</button></div> : null}`,
`{error ? <div className="wish-state error">{error}<button onClick={() => void load()}>重新查看</button></div> : null}`
);

replaceExact(
`      headers: { "Content-Type": "application/json", "X-Visitor-Id": visitorId },
      body: JSON.stringify({ type, title, content, authorName: name || "匿名旅人" }),`,
`      headers: { "Content-Type": "application/json", "X-Visitor-Id": visitorId, ...(travelerToken ? { "X-Traveler-Token": travelerToken } : {}) },
      body: JSON.stringify({ type, title, content, authorName: travelerToken ? travelerName : (name || "匿名旅人") }),`
);

replaceExact(
`        <div className="wish-hero-actions">
          <button type="button" onClick={() => setOpen(true)}>＋ 投下愿望</button>
          {isAdmin ? <button type="button" className="owner" onClick={() => void leaveAdmin()}>✦ 初代编纂者</button> : <button type="button" className="quiet" onClick={() => setAdminOpen(true)}>编纂者登录</button>}
        </div>`,
`        <div className="wish-hero-actions">
          <button type="button" onClick={() => setOpen(true)}>＋ 投下愿望</button>
          {travelerToken ? <button type="button" className="traveler" onClick={() => void leaveTraveler()}>✧ {travelerName}</button> : <button type="button" className="quiet" onClick={() => { setIssuedCode(""); setTravelerOpen(true); }}>旅人登记</button>}
          {isAdmin ? <button type="button" className="owner" onClick={() => void leaveAdmin()}>✦ 初代编纂者</button> : <button type="button" className="quiet" onClick={() => setAdminOpen(true)}>编纂者登录</button>}
        </div>`
);

const cardPattern = /<article className=\{`wish-card \$\{wish\.pinned \? "is-pinned" : ""\}`\} key=\{wish\.id\}>[\s\S]*?<\/article>/;
if (!cardPattern.test(source)) throw new Error("Traveler identity wish-card target not found.");
source = source.replace(cardPattern,
`<article className={\`wish-card \${wish.pinned ? "is-pinned" : ""} \${wish.mine ? "is-mine" : ""}\`} key={wish.id}>
            <header><span>{types[wish.type as keyof typeof types] || types.note}{wish.pinned ? " · 置顶" : ""}{wish.mine ? " · 我的愿望" : ""}</span><em>{statuses[wish.status] || wish.status}</em></header>
            <h3>{wish.title}</h3><p>{wish.content}</p>
            {wish.officialReply ? <aside className="wish-official-reply"><b>✦ 初代编纂者回应</b><p>{wish.officialReply}</p></aside> : null}
            <footer><small>{wish.authorName || "匿名旅人"} · {new Date(wish.createdAt).toLocaleString("zh-CN")}</small><div><button type="button" onClick={() => light(wish.id)}>✦ 点亮 {wish.lights}</button>{wish.mine && !isAdmin ? <><button type="button" className="manage" onClick={() => editOwnWish(wish)}>修改</button><button type="button" className="danger" onClick={() => deleteOwnWish(wish.id)}>收回</button></> : null}{isAdmin ? <><button type="button" className="manage" onClick={() => manageWish(wish)}>管理</button><button type="button" className="danger" onClick={() => deleteWish(wish.id)}>删除</button></> : null}</div></footer>
          </article>`
);

replaceExact(
`      {adminOpen ? (`,
`      {travelerOpen ? (
        <div className="wish-compose-backdrop" onClick={() => setTravelerOpen(false)}>
          <form className="wish-compose wish-traveler-login" onSubmit={submitTraveler} onClick={(event) => event.stopPropagation()}>
            <header><div><small>TRAVELER IDENTITY</small><h3>{issuedCode ? "请收好身份码" : "旅人登记"}</h3></div><button type="button" onClick={() => setTravelerOpen(false)}>×</button></header>
            {issuedCode ? <div className="traveler-code-card"><p>这是找回旅人身份的唯一凭证，请复制保存。</p><strong>{issuedCode}</strong><button type="button" onClick={() => void navigator.clipboard.writeText(issuedCode)}>复制身份码</button><button type="button" className="submit-wish" onClick={() => { setIssuedCode(""); setTravelerOpen(false); }}>我已经保存好了</button></div> : <><div className="traveler-mode"><button type="button" className={travelerMode === "register" ? "active" : ""} onClick={() => setTravelerMode("register")}>第一次登记</button><button type="button" className={travelerMode === "recover" ? "active" : ""} onClick={() => setTravelerMode("recover")}>恢复身份</button></div><label>旅人昵称<input value={travelerName} maxLength={24} onChange={(event) => setTravelerName(event.target.value)} placeholder="例如：月光旅人" required /></label>{travelerMode === "recover" ? <label>身份码<input value={travelerCode} onChange={(event) => setTravelerCode(event.target.value.toUpperCase())} placeholder="XXXX-XXXX-XXXX" required /></label> : <p>登记后会生成一枚专属身份码。换设备时，用昵称和身份码找回自己的愿望。</p>}<button className="submit-wish" type="submit" disabled={travelerBusy}>{travelerBusy ? "兔兔正在登记……" : travelerMode === "register" ? "领取旅人身份" : "恢复旅人身份"}</button></>}
          </form>
        </div>
      ) : null}
      {adminOpen ? (`
);

styles += `

/* CRIMSON_LIBRARY_TRAVELER_IDENTITY_STYLES */
.wish-hero-actions .traveler{border-color:rgba(119,189,204,.45);background:rgba(43,92,105,.3);color:#a9dce6}.wish-card.is-mine{box-shadow:0 16px 42px rgba(0,0,0,.24),inset 3px 0 0 rgba(118,188,202,.4)}.traveler-mode{display:grid;grid-template-columns:1fr 1fr;gap:8px}.traveler-mode button{border:1px solid rgba(222,187,112,.25);border-radius:999px;padding:10px;background:rgba(255,255,255,.025);color:#a9957c}.traveler-mode button.active{border-color:rgba(119,189,204,.52);background:rgba(43,92,105,.32);color:#b9e7ef}.wish-traveler-login>p,.traveler-code-card p{margin:0;color:#a9967e;line-height:1.7}.traveler-code-card{display:grid;gap:14px;text-align:center}.traveler-code-card strong{padding:18px;border:1px dashed rgba(119,189,204,.58);border-radius:14px;color:#c8f0f4;background:rgba(43,92,105,.18);font:700 22px ui-monospace,SFMono-Regular,Consolas,monospace;letter-spacing:.12em}.traveler-code-card>button:not(.submit-wish){border:1px solid rgba(222,187,112,.3);border-radius:999px;padding:11px;background:rgba(255,255,255,.03);color:#e9d5b0}@media(max-width:640px){.traveler-mode{grid-template-columns:1fr}}
`;

fs.writeFileSync(componentPath, source);
fs.writeFileSync(stylePath, styles);
console.log("Applied traveler nickname and identity-code accounts to the Wish Pool.");