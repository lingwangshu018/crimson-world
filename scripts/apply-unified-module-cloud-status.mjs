import fs from "node:fs";

const cloudPath = new URL("../app/CloudCellar.tsx", import.meta.url);
const journalPath = new URL("../app/JournalRoom.tsx", import.meta.url);
const wheelPath = new URL("../public/time-wheel/index.html", import.meta.url);

let cloud = fs.readFileSync(cloudPath, "utf8");
let journal = fs.readFileSync(journalPath, "utf8");
let wheel = fs.readFileSync(wheelPath, "utf8");

const marker = "CRIMSON_UNIFIED_MODULE_CLOUD_STATUS";

if (!cloud.includes(marker)) {
  const writeAnchor = `function write(key: string, value: string) {
  try { window.localStorage.setItem(key, value); } catch {}
}`;
  const migration = `${writeAnchor}

function migrateLegacyCloudConfiguration() {
  const migrations = [
    { target: OWNER_KEY, legacy: ["crimson-journal.vault-owner-key.v1", "crimson-time-wheel.vault-owner-key.v1"] },
    { target: READ_KEY, legacy: ["crimson-journal.vault-read-key.v1", "crimson-time-wheel.vault-read-key.v1"] },
    { target: NOTE_KEY, legacy: ["crimson-journal.vault-reply-key.v1", "crimson-time-wheel.vault-reply-key.v1"] },
  ];

  for (const item of migrations) {
    if (!KEY_PATTERN.test(read(item.target))) {
      const legacyValue = item.legacy.map(read).find((value) => KEY_PATTERN.test(value));
      if (legacyValue) write(item.target, legacyValue);
    }
    item.legacy.forEach((key) => {
      try { window.localStorage.removeItem(key); } catch {}
    });
  }
}

// ${marker}`;

  if (!cloud.includes(writeAnchor)) throw new Error("Cloud migration write anchor not found");
  cloud = cloud.replace(writeAnchor, migration);

  const effectAnchor = `  useEffect(() => {
    setOwnerKey(read(OWNER_KEY));`;
  if (!cloud.includes(effectAnchor)) throw new Error("Cloud migration effect anchor not found");
  cloud = cloud.replace(effectAnchor, `  useEffect(() => {
    migrateLegacyCloudConfiguration();
    setOwnerKey(read(OWNER_KEY));`);
}

if (!journal.includes(marker)) {
  const stateLine = '  const [showMailboxDetails, setShowMailboxDetails] = useState(false);';
  journal = journal.replace(stateLine, `  // ${marker}`);

  const generatedKeyBlock = `    let ownerKey = vaultOwnerKey;
    let readKey = vaultReadKey;
    let replyKey = vaultReplyKey;
    if (!VAULT_KEY_PATTERN.test(ownerKey)) ownerKey = createVaultKey();
    if (!VAULT_KEY_PATTERN.test(readKey) || readKey === ownerKey) readKey = createVaultKey();
    if (!VAULT_KEY_PATTERN.test(replyKey) || replyKey === ownerKey || replyKey === readKey) replyKey = createVaultKey();
    setVaultOwnerKey(ownerKey); setVaultReadKey(readKey); setVaultReplyKey(replyKey);
    localStorage.setItem(JOURNAL_OWNER_KEY, ownerKey);
    localStorage.setItem(JOURNAL_READ_KEY, readKey);
    localStorage.setItem(JOURNAL_REPLY_KEY, replyKey);`;

  const sharedKeyBlock = `    const ownerKey = localStorage.getItem(JOURNAL_OWNER_KEY) || vaultOwnerKey;
    const readKey = localStorage.getItem(JOURNAL_READ_KEY) || vaultReadKey;
    const replyKey = localStorage.getItem(JOURNAL_REPLY_KEY) || vaultReplyKey;
    if (!VAULT_API_URL.trim()) {
      setMailboxMessage("⚠️ 请前往绯界控制中心配置云端服务地址。");
      return;
    }
    if (!VAULT_KEY_PATTERN.test(ownerKey) || !VAULT_KEY_PATTERN.test(readKey) || !VAULT_KEY_PATTERN.test(replyKey)) {
      setMailboxMessage("⚠️ 请前往绯界控制中心生成并配置三把共享钥匙。");
      return;
    }
    setVaultOwnerKey(ownerKey); setVaultReadKey(readKey); setVaultReplyKey(replyKey);`;

  if (!journal.includes(generatedKeyBlock)) throw new Error("Journal generated-key block not found");
  journal = journal.replace(generatedKeyBlock, sharedKeyBlock);

  const detailsBlock = `<button className="journal-mailbox-details-toggle" onClick={() => setShowMailboxDetails((value) => !value)}>{showMailboxDetails ? "收起高级信息" : "▸ 高级信息"}</button>
                {showMailboxDetails ? <dl><div><dt>读信钥匙</dt><dd>{maskedVaultKey(vaultReadKey)}</dd></div><div><dt>回信钥匙</dt><dd>{maskedVaultKey(vaultReplyKey)}</dd></div><div><dt>日记编号</dt><dd>JR-{String(diaries.findIndex((diary) => diary.id === current.id) + 1).padStart(4, "0")}</dd></div><div><dt>真实 ID</dt><dd><button onClick={() => navigator.clipboard.writeText(current.id)}>复制</button></dd></div></dl> : null}`;
  const statusBlock = `<p className="journal-cloud-connection">{VAULT_API_URL && VAULT_KEY_PATTERN.test(vaultOwnerKey) && VAULT_KEY_PATTERN.test(vaultReadKey) && VAULT_KEY_PATTERN.test(vaultReplyKey) ? "☁️ 已连接绯界云端" : "⚠️ 请前往绯界控制中心配置云端"}</p>`;
  if (!journal.includes(detailsBlock)) throw new Error("Journal key details block not found");
  journal = journal.replace(detailsBlock, statusBlock);
}

if (!wheel.includes(marker)) {
  const keyPatternAnchor = `  const KEY_RE = /^ctv1_[A-Za-z0-9_-]{43}$/;`;
  const migration = `${keyPatternAnchor}
  const LEGACY_KEYS = {
    owner: ["crimson-time-wheel.vault-owner-key.v1", "crimson-journal.vault-owner-key.v1"],
    read: ["crimson-time-wheel.vault-read-key.v1", "crimson-journal.vault-read-key.v1"],
    reply: ["crimson-time-wheel.vault-reply-key.v1", "crimson-journal.vault-reply-key.v1"],
  };

  const migrateLegacyKeys = () => {
    const targets = { owner: OWNER_KEY, read: READ_KEY, reply: REPLY_KEY };
    Object.entries(targets).forEach(([kind, target]) => {
      if (!KEY_RE.test(localStorage.getItem(target) || "")) {
        const legacy = LEGACY_KEYS[kind].map(key => localStorage.getItem(key) || "").find(value => KEY_RE.test(value));
        if (legacy) localStorage.setItem(target, legacy);
      }
      LEGACY_KEYS[kind].forEach(key => localStorage.removeItem(key));
    });
  };
  // ${marker}`;
  if (!wheel.includes(keyPatternAnchor)) throw new Error("Time Wheel key anchor not found");
  wheel = wheel.replace(keyPatternAnchor, migration);

  const ensureKeysPattern = /  const ensureKeys = \(\) => \{[\s\S]*?    return \{ owner, read, reply \};\n  \};/;
  if (!ensureKeysPattern.test(wheel)) throw new Error("Time Wheel ensureKeys block not found");
  wheel = wheel.replace(ensureKeysPattern, `  const ensureKeys = () => {
    const owner = localStorage.getItem(OWNER_KEY) || "";
    const read = localStorage.getItem(READ_KEY) || "";
    const reply = localStorage.getItem(REPLY_KEY) || "";
    return KEY_RE.test(owner) && KEY_RE.test(read) && KEY_RE.test(reply) ? { owner, read, reply } : null;
  };`);

  const syncAnchor = `    const history = readHistory();
    if (!history.length) { setStatus("还没有运行历史可以同步。"); return false; }
    const keys = ensureKeys();`;
  const syncReplacement = `    const history = readHistory();
    if (!history.length) { setStatus("还没有运行历史可以同步。"); return false; }
    if (!VAULT_API_URL) { setStatus("⚠️ 请前往绯界控制中心配置云端服务地址。"); return false; }
    const keys = ensureKeys();
    if (!keys) { setStatus("⚠️ 请前往绯界控制中心生成并配置三把共享钥匙。"); return false; }`;
  if (!wheel.includes(syncAnchor)) throw new Error("Time Wheel sync configuration anchor not found");
  wheel = wheel.replace(syncAnchor, syncReplacement);

  const detailLine = `    if (detail) detail.textContent = synced ? "最近同步：" + new Date(synced).toLocaleString() + " · 读取钥匙 " + mask(read) : "记录保存在本地；发送给 AI 时会自动同步";`;
  const detailReplacement = `    if (detail) detail.textContent = VAULT_API_URL && ensureKeys() ? (synced ? "☁️ 已连接绯界云端 · 最近同步：" + new Date(synced).toLocaleString() : "☁️ 已连接绯界云端") : "⚠️ 请前往绯界控制中心配置云端";`;
  if (!wheel.includes(detailLine)) throw new Error("Time Wheel detail line not found");
  wheel = wheel.replace(detailLine, detailReplacement);

  const startAnchor = `  const start = () => {
    ensurePanel();`;
  if (!wheel.includes(startAnchor)) throw new Error("Time Wheel start anchor not found");
  wheel = wheel.replace(startAnchor, `  const start = () => {
    migrateLegacyKeys();
    ensurePanel();`);
}

fs.writeFileSync(cloudPath, cloud);
fs.writeFileSync(journalPath, journal);
fs.writeFileSync(wheelPath, wheel);
console.log("Applied unified module cloud status and legacy key migration.");
