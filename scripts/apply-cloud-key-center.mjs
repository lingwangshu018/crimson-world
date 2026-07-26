import fs from "node:fs";

const cloudPath = new URL("../app/CloudCellar.tsx", import.meta.url);
const cssPath = new URL("../app/cloud-cellar.css", import.meta.url);
let cloud = fs.readFileSync(cloudPath, "utf8");
let css = fs.readFileSync(cssPath, "utf8");

if (!cloud.includes("CRIMSON_CLOUD_KEY_CENTER")) {
  const replace = (before, after) => {
    if (!cloud.includes(before)) throw new Error(`Cloud key center target not found: ${before.slice(0, 120)}`);
    cloud = cloud.replace(before, after);
  };

  replace(
    '  const [advancedOpen, setAdvancedOpen] = useState(false);',
    `  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [readKey, setReadKey] = useState("");
  const [replyKey, setReplyKey] = useState("");
  const [visibleKeys, setVisibleKeys] = useState<Record<"owner" | "read" | "reply", boolean>>({ owner: false, read: false, reply: false });
  // CRIMSON_CLOUD_KEY_CENTER`,
  );

  replace(
    '    setApiUrl(read(API_URL_KEY) || DEFAULT_API_URL);',
    `    setApiUrl(read(API_URL_KEY) || DEFAULT_API_URL);
    setReadKey(read(READ_KEY));
    setReplyKey(read(NOTE_KEY));`,
  );

  replace(
    '  async function copyKey() {',
    `  async function copyCredential(label: string, value: string) {
    if (!value) { setMessage(\`请先生成${'${label}'}。\`); return; }
    try {
      await navigator.clipboard.writeText(value);
      setMessage(\`${'${label}'}已复制，请妥善保管。\`);
    } catch {
      window.prompt(\`请复制${'${label}'}：\`, value);
    }
  }

  function saveCredential(kind: "owner" | "read" | "reply", value: string) {
    if (kind === "owner") { write(OWNER_KEY, value); setOwnerKey(value); }
    if (kind === "read") { write(READ_KEY, value); setReadKey(value); }
    if (kind === "reply") { write(NOTE_KEY, value); setReplyKey(value); }
    write(KEYS_DIRTY_KEY, "1");
    setKeySyncPending(true);
  }

  function regenerateCredential(kind: "owner" | "read" | "reply") {
    const labels = { owner: "主钥匙", read: "读取钥匙", reply: "回复钥匙" } as const;
    const current = kind === "owner" ? ownerKey : kind === "read" ? readKey : replyKey;
    if (current && !window.confirm(\`重新生成${'${labels[kind]}'}后，旧钥匙会在下次同步时失效。确定继续吗？\`)) return;
    let next = makeKey();
    const occupied = new Set([ownerKey, readKey, replyKey]);
    while (occupied.has(next)) next = makeKey();
    saveCredential(kind, next);
    setMessage(\`${'${labels[kind]}'}已重新生成，请进行一次全部同步。\`);
  }

  function regenerateAllCredentials() {
    if (!window.confirm("将重新生成主钥匙、读取钥匙和回复钥匙。旧钥匙会在下次同步后失效，确定继续吗？")) return;
    const owner = makeKey();
    let reader = makeKey();
    let reply = makeKey();
    while (reader === owner) reader = makeKey();
    while (reply === owner || reply === reader) reply = makeKey();
    saveCredential("owner", owner);
    saveCredential("read", reader);
    saveCredential("reply", reply);
    setMessage("三把钥匙已全部更新，请立即同步并重新复制给需要使用的 AI。⚠️");
  }

  function toggleKeyVisibility(kind: "owner" | "read" | "reply") {
    setVisibleKeys((current) => ({ ...current, [kind]: !current[kind] }));
  }

  async function copyKey() {`,
  );

  const oldAdvanced = '<div className="cellar-advanced"><label>统一档案 API<input value={apiUrl} onChange={(event) => setApiUrl(event.target.value)} onBlur={() => write(API_URL_KEY, apiUrl || DEFAULT_API_URL)} /></label><div className="patron-key"><code>{mask(ownerKey)}</code>{ownerKey ? <button type="button" onClick={copyKey}>复制主钥匙</button> : null}</div><small>酒馆、日记和时光之轮会共同使用这里的 API、主钥匙、读取钥匙和回复钥匙。</small></div>';
  const newAdvanced = `<div className="cellar-advanced">
                <label className="cloud-service-field">云端服务地址<input value={apiUrl} placeholder="https://你的云端地址/api/vault" onChange={(event) => setApiUrl(event.target.value)} onBlur={() => write(API_URL_KEY, apiUrl.trim())} /></label>
                <div className="cloud-key-list">
                  {([
                    { kind: "owner" as const, icon: "👑", title: "主钥匙", value: ownerKey, description: "拥有全部权限，可同步、恢复并管理完整云档案。" },
                    { kind: "read" as const, icon: "👁️", title: "AI 读取钥匙", value: readKey, description: "供 AI 安全读取酒馆、日记、时光之轮及后续项目。" },
                    { kind: "reply" as const, icon: "💌", title: "AI 回复钥匙", value: replyKey, description: "供 AI 写入回信、随杯手记、小剧场及后续回复内容。" },
                  ]).map((item) => (
                    <article className="cloud-key-card" key={item.kind}>
                      <div className="cloud-key-heading"><span>{item.icon}</span><div><strong>{item.title}</strong><small className={item.value ? "is-ready" : "is-empty"}>{item.value ? "● 已配置" : "● 未生成"}</small></div></div>
                      <p>{item.description}</p>
                      <code>{item.value ? (visibleKeys[item.kind] ? item.value : mask(item.value)) : "尚未生成"}</code>
                      <div className="cloud-key-actions">
                        <button type="button" onClick={() => toggleKeyVisibility(item.kind)} disabled={!item.value}>{visibleKeys[item.kind] ? "🙈 隐藏" : "👁 显示"}</button>
                        <button type="button" onClick={() => void copyCredential(item.title, item.value)} disabled={!item.value}>📋 复制</button>
                        <button type="button" onClick={() => regenerateCredential(item.kind)}>🔄 {item.value ? "重新生成" : "生成"}</button>
                      </div>
                    </article>
                  ))}
                </div>
                <button className="cloud-reset-keys" type="button" onClick={regenerateAllCredentials}>⚠️ 全部重新生成钥匙</button>
                <small className={keySyncPending ? "cloud-key-footnote is-pending" : "cloud-key-footnote"}>{keySyncPending ? "⚠️ 新钥匙尚未同步，云端仍在使用上一套钥匙。请立即执行“全部同步”。" : "三把钥匙已经与最近一次云端同步保持一致。"}</small>
              </div>`;

  if (cloud.includes(oldAdvanced)) {
    cloud = cloud.replace(oldAdvanced, newAdvanced);
  } else {
    const configurableAdvanced = '<div className="cellar-advanced"><label>云端服务地址<input value={apiUrl} placeholder="https://你的云端地址/api/vault" onChange={(event) => setApiUrl(event.target.value)} onBlur={() => write(API_URL_KEY, apiUrl.trim())} /></label><div className="patron-key"><code>{mask(ownerKey)}</code>{ownerKey ? <button type="button" onClick={copyKey}>复制主钥匙</button> : null}</div><small>酒馆、日记和时光之轮会共同使用这里的 API、主钥匙、读取钥匙和回复钥匙。</small></div>';
    if (!cloud.includes(configurableAdvanced)) throw new Error("Cloud key center advanced panel target not found");
    cloud = cloud.replace(configurableAdvanced, newAdvanced);
  }

  fs.writeFileSync(cloudPath, cloud);
}

if (!css.includes("CRIMSON_CLOUD_KEY_CENTER")) {
  css += `
/* CRIMSON_CLOUD_KEY_CENTER */\n.cloud-key-footnote.is-pending{color:#f0c77f;font-weight:700}
.cloud-service-field{display:grid;gap:8px;font-size:12px;color:rgba(255,244,231,.72)}
.cloud-service-field input{width:100%;box-sizing:border-box}
.cloud-key-list{display:grid;gap:12px;margin-top:14px}
.cloud-key-card{padding:14px;border:1px solid rgba(255,255,255,.12);border-radius:18px;background:rgba(255,255,255,.055);box-shadow:inset 0 1px rgba(255,255,255,.06)}
.cloud-key-heading{display:flex;align-items:center;gap:10px}.cloud-key-heading>span{font-size:24px}.cloud-key-heading div{display:grid;gap:2px}.cloud-key-heading strong{font-size:14px;color:#fff4e7}.cloud-key-heading small{font-size:10px}.cloud-key-heading .is-ready{color:#9ee0ae}.cloud-key-heading .is-empty{color:#e6c67f}
.cloud-key-card p{margin:9px 0;color:rgba(255,244,231,.65);font-size:11px;line-height:1.55}.cloud-key-card code{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:10px;border-radius:12px;background:rgba(0,0,0,.24);color:#ffe5b9;font-size:11px}
.cloud-key-actions{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:9px}.cloud-key-actions button,.cloud-reset-keys{border:1px solid rgba(255,255,255,.1);border-radius:11px;background:rgba(255,255,255,.08);color:#fff4e7;padding:8px 6px;font-size:10px;cursor:pointer}.cloud-key-actions button:disabled{opacity:.38;cursor:not-allowed}.cloud-key-actions button:not(:disabled):active,.cloud-reset-keys:active{transform:scale(.97)}
.cloud-reset-keys{width:100%;margin-top:13px;border-color:rgba(226,132,132,.3);background:rgba(154,55,55,.14);color:#ffd6d6}.cloud-key-footnote{display:block;margin-top:9px;line-height:1.55;color:rgba(255,244,231,.52)}
@media(max-width:520px){.cloud-key-actions{grid-template-columns:1fr}.cloud-key-actions button{padding:9px}.cloud-key-card{padding:12px}}
`;
  fs.writeFileSync(cssPath, css);
}

console.log("Applied three-key cloud identity center.");
