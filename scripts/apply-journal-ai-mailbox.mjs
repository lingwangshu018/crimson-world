import fs from "node:fs";

const path = new URL("../app/JournalRoom.tsx", import.meta.url);
let source = fs.readFileSync(path, "utf8");
if (source.includes("CRIMSON_JOURNAL_AI_MAILBOX")) process.exit(0);

function replace(before, after) {
  if (!source.includes(before)) throw new Error(`Journal mailbox patch target not found: ${before.slice(0, 100)}`);
  source = source.replace(before, after);
}

replace(
  'const FOLDER_KEY = "lu_shared_folders_v7";',
  `const FOLDER_KEY = "lu_shared_folders_v7";
const JOURNAL_OWNER_KEY = "crimson-journal.vault-owner-key.v1";
const JOURNAL_READ_KEY = "crimson-journal.vault-read-key.v1";
const JOURNAL_REPLY_KEY = "crimson-journal.vault-reply-key.v1";
const VAULT_API_URL = "https://crimson-tavern.boarder-72pound.chatgpt.site/api/vault";
const VAULT_KEY_PATTERN = /^ctv1_[A-Za-z0-9_-]{43}$/;

// CRIMSON_JOURNAL_AI_MAILBOX`,
);

replace(
  `function uid() {
  return \`${'${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}'}\`;
}`,
  `function uid() {
  return \`${'${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}'}\`;
}

function createVaultKey() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
  return \`ctv1_${'${window.btoa(binary).replace(/\\+/g, "-").replace(/\\//g, "_").replace(/=+$/g, "")}'}\`;
}

function maskedVaultKey(value: string) {
  return value ? \`${'${value.slice(0, 11)}••••••••${value.slice(-6)}'}\` : "发送后生成";
}

function diaryFingerprint(diary: Diary) {
  const value = \`${'${diary.title}'}\\n${'${diary.content}'}\`;
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}`,
);

replace(
  '  const [customBackground, setCustomBackground] = useState("");',
  `  const [customBackground, setCustomBackground] = useState("");
  const [vaultOwnerKey, setVaultOwnerKey] = useState("");
  const [vaultReadKey, setVaultReadKey] = useState("");
  const [vaultReplyKey, setVaultReplyKey] = useState("");
  const [mailboxBusy, setMailboxBusy] = useState<"send" | "pull" | null>(null);
  const [mailboxMessage, setMailboxMessage] = useState("");
  const [showMailboxDetails, setShowMailboxDetails] = useState(false);`,
);

replace(
  `      if (Array.isArray(savedFolders)) setFolders(savedFolders);`,
  `      if (Array.isArray(savedFolders)) setFolders(savedFolders);
      const ownerKey = localStorage.getItem(JOURNAL_OWNER_KEY) || "";
      const readKey = localStorage.getItem(JOURNAL_READ_KEY) || "";
      const replyKey = localStorage.getItem(JOURNAL_REPLY_KEY) || "";
      if (VAULT_KEY_PATTERN.test(ownerKey)) setVaultOwnerKey(ownerKey);
      if (VAULT_KEY_PATTERN.test(readKey)) setVaultReadKey(readKey);
      if (VAULT_KEY_PATTERN.test(replyKey)) setVaultReplyKey(replyKey);`,
);

replace(
  `  async function requestReply() {
    if (!current) return;
    const text = \`这是我在日记里写下的一篇心事：\\n【标题】：${'${current.title}'}\\n【内容】：${'${current.content}'}\\n\\n（请直接回复回信正文即可，我会贴进日记本里。）\`;
    try {
      await navigator.clipboard.writeText(text);
      window.alert("✨ 呼唤机回信的暗号已经复制啦！写好回信后，点右上角的 ✎ 贴回来。");
    } catch {
      window.prompt("复制这段暗号：", text);
    }
  }`,
  `  function makeCloudRecord(diary: Diary) {
    return {
      id: diary.id,
      createdAt: new Date(diary.createdAt).toISOString(),
      kind: "house",
      drinkName: diary.title,
      bartender: "日记本",
      guest: "回信人",
      bartenderLine: diary.content,
      items: [{ id: "diary", course: "日记正文", dimension: "信件", zh: diary.title, en: "", ja: "" }],
      note: diary.reply || "",
      noteUpdatedAt: diary.replyAt ? new Date(diary.replyAt).toISOString() : null,
      journal: { folderId: diary.folderId, paper: diary.paper },
    };
  }

  function makeReplyInstruction(diary: Diary, readKey: string, replyKey: string) {
    const displayNumber = \`JR-${'${String(diaries.findIndex((item) => item.id === diary.id) + 1).padStart(4, "0")}'}\`;
    return [
      "请读取我的绯界记录，并继续完成这一事件。",
      "",
      "模块：我们的日记",
      "",
      "【记录编号】",
      displayNumber,
      "",
      "【记录ID】",
      diary.id,
      "",
      "【读取钥匙】",
      readKey,
      "",
      "【回复钥匙】",
      replyKey,
      "",
      "请读取本条记录。",
      "",
      "结合：",
      "• 角色卡",
      "• 世界书",
      "• 近期记忆",
      "",
      "根据这篇日记的标题与正文，写一封完整回信。",
      "",
      "完成后请使用回复钥匙",
      "写回 note 字段。",
      "",
      "不要：",
      "• 修改原记录",
      "• 创建新记录",
      "• 回复其它记录",
      "",
      "只处理这一条。",
    ].join("\\n");
  }

  async function copyInstruction(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      window.prompt("复制这段 AI 指令：", text);
      return false;
    }
  }

  async function sendCurrentDiary() {
    if (!current || mailboxBusy) return;
    let ownerKey = vaultOwnerKey;
    let readKey = vaultReadKey;
    let replyKey = vaultReplyKey;
    if (!VAULT_KEY_PATTERN.test(ownerKey)) ownerKey = createVaultKey();
    if (!VAULT_KEY_PATTERN.test(readKey) || readKey === ownerKey) readKey = createVaultKey();
    if (!VAULT_KEY_PATTERN.test(replyKey) || replyKey === ownerKey || replyKey === readKey) replyKey = createVaultKey();
    setVaultOwnerKey(ownerKey); setVaultReadKey(readKey); setVaultReplyKey(replyKey);
    localStorage.setItem(JOURNAL_OWNER_KEY, ownerKey);
    localStorage.setItem(JOURNAL_READ_KEY, readKey);
    localStorage.setItem(JOURNAL_REPLY_KEY, replyKey);
    setMailboxBusy("send");
    setMailboxMessage("正在发送这篇日记……");
    try {
      const response = await fetch(VAULT_API_URL, {
        method: "PUT",
        headers: { Authorization: \`Bearer ${'${ownerKey}'}\`, "Content-Type": "application/json" },
        body: JSON.stringify({
          readKey,
          noteKey: replyKey,
          settings: { space: "journal", selectedDiaryId: current.id },
          records: [makeCloudRecord(current)],
        }),
      });
      const result = await response.json() as { error?: string; syncedAt?: string };
      if (!response.ok || !result.syncedAt) throw new Error(result.error || "发送失败");
      const syncedAt = new Date(result.syncedAt).getTime();
      const fingerprint = diaryFingerprint(current);
      persist(diaries.map((diary) => diary.id === current.id ? { ...diary, vaultSyncedAt: syncedAt, vaultFingerprint: fingerprint } : diary));
      const copied = await copyInstruction(makeReplyInstruction(current, readKey, replyKey));
      setMailboxMessage(copied ? "日记已发送，发送模板也已复制。✨" : "日记已发送，请复制弹窗里的发送模板。");
    } catch (error) {
      setMailboxMessage(error instanceof Error ? error.message : "发送暂时没有成功");
    } finally { setMailboxBusy(null); }
  }

  async function pullReply() {
    if (!current || !current.vaultSyncedAt || !VAULT_KEY_PATTERN.test(vaultOwnerKey) || mailboxBusy) {
      if (current && !current.vaultSyncedAt) setMailboxMessage("请先发送这篇日记。");
      return;
    }
    setMailboxBusy("pull"); setMailboxMessage("正在打开信箱查看回音……");
    try {
      const response = await fetch(\`${'${VAULT_API_URL}'}?limit=50\`, { headers: { Authorization: \`Bearer ${'${vaultOwnerKey}'}\` } });
      const result = await response.json() as { error?: string; records?: Array<{ id?: string; note?: string; noteUpdatedAt?: string }> };
      if (!response.ok) throw new Error(result.error || "收信失败");
      const cloud = (result.records || []).find((item) => item.id === current.id);
      if (!cloud?.note?.trim()) { setMailboxMessage("暂时没有新回信。"); return; }
      const replyAt = cloud.noteUpdatedAt ? new Date(cloud.noteUpdatedAt).getTime() : Date.now();
      persist(diaries.map((diary) => diary.id === current.id ? { ...diary, reply: cloud.note, replyAt } : diary));
      setMailboxMessage("回信已经收到，并放进这篇日记里了。✉️");
      window.setTimeout(() => document.querySelector(".journal-reader aside")?.scrollIntoView({ behavior: "smooth", block: "center" }), 80);
    } catch (error) {
      setMailboxMessage(error instanceof Error ? error.message : "收信暂时没有成功");
    } finally { setMailboxBusy(null); }
  }`,
);

replace(
  `{current.reply ? <aside><b>机的回音</b><p>{current.reply}</p><time>落笔于 {formatDate(current.replyAt)}</time></aside> : <button className="journal-reply" onClick={requestReply}>呼唤机回信</button>}`,
  `{current.reply ? <aside><b>机的回音</b><p>{current.reply}</p><time>落笔于 {formatDate(current.replyAt)}</time></aside> : null}
            {(() => {
              const sent = Boolean(current.vaultSyncedAt);
              const changed = sent && current.vaultFingerprint !== diaryFingerprint(current);
              const stateText = current.reply ? "💌 已回信" : changed ? "✎ 有未同步修改" : sent ? "☁ 等待回信" : "○ 仅本地";
              const sendText = mailboxBusy === "send" ? "处理中…" : "📨 发送";
              return <section className="journal-mailbox">
                <header><div><b>AI 信箱</b><small>{sent ? \`最近发送 ${'${formatDate(current.vaultSyncedAt)}'}\` : "这篇日记还没有发送"}</small></div><span>{stateText}</span></header>
                <div className="journal-mailbox-actions">
                  <button onClick={sendCurrentDiary} disabled={Boolean(mailboxBusy)}>{sendText}</button>
                  <button onClick={pullReply} disabled={!sent || Boolean(mailboxBusy)}>{mailboxBusy === "pull" ? "收信中…" : current.reply ? "📥 检查新回信" : "📥 检查回信"}</button>
                </div>
                <button className="journal-mailbox-details-toggle" onClick={() => setShowMailboxDetails((value) => !value)}>{showMailboxDetails ? "收起高级信息" : "▸ 高级信息"}</button>
                {showMailboxDetails ? <dl><div><dt>读信钥匙</dt><dd>{maskedVaultKey(vaultReadKey)}</dd></div><div><dt>回信钥匙</dt><dd>{maskedVaultKey(vaultReplyKey)}</dd></div><div><dt>日记编号</dt><dd>JR-{String(diaries.findIndex((diary) => diary.id === current.id) + 1).padStart(4, "0")}</dd></div><div><dt>真实 ID</dt><dd><button onClick={() => navigator.clipboard.writeText(current.id)}>复制</button></dd></div></dl> : null}
                {mailboxMessage ? <p className="journal-mailbox-message">{mailboxMessage}</p> : null}
              </section>;
            })()}`,
);

fs.writeFileSync(path, source);
console.log("Applied simplified Crimson Journal AI mailbox workflow.");