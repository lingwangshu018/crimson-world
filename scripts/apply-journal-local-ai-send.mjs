import fs from "node:fs";

const journalPath = new URL("../app/JournalRoom.tsx", import.meta.url);
let source = fs.readFileSync(journalPath, "utf8");

const sendPattern = /  async function sendCurrentDiary\(\) \{[\s\S]*?\n  \}\n\n  async function pullReply\(\) \{/;

if (!sendPattern.test(source)) {
  throw new Error("Journal sendCurrentDiary block not found");
}

source = source.replace(
  sendPattern,
  `  async function sendCurrentDiary() {
    if (!current || mailboxBusy) return;

    const readKey = vaultReadKey || localStorage.getItem(JOURNAL_READ_KEY) || "";
    const replyKey = vaultReplyKey || localStorage.getItem(JOURNAL_REPLY_KEY) || "";

    if (!readKey || !replyKey) {
      setMailboxMessage("请先前往绯界控制中心生成共享读取钥匙与回复钥匙。");
      return;
    }

    setMailboxBusy("send");
    setMailboxMessage("正在生成发送模板……");

    try {
      const copied = await copyInstruction(makeReplyInstruction(current, readKey, replyKey));
      setMailboxMessage(
        copied
          ? "发送模板已复制，可以直接粘贴给 AI。✨"
          : "请复制弹窗中的发送模板。",
      );
    } finally {
      setMailboxBusy(null);
    }
  }

  async function pullReply() {`,
);

source = source.replace(
  /const sendText = [^;]+;/,
  'const sendText = mailboxBusy === "send" ? "处理中…" : "📨 发送";',
);

fs.writeFileSync(journalPath, source);
console.log("Enforced local Journal AI sending with the unified prompt template.");
