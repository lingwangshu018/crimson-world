import fs from "node:fs";

const journalPath = new URL("../app/JournalRoom.tsx", import.meta.url);
const wheelPath = new URL("../public/time-wheel/index.html", import.meta.url);

let journal = fs.readFileSync(journalPath, "utf8");
let wheel = fs.readFileSync(wheelPath, "utf8");

if (!journal.includes("CRIMSON_UNIFIED_AI_TASK_INSTRUCTION")) {
  journal = journal.replace(
    /function makeReplyInstruction\(diary: Diary, readKey: string, replyKey: string\) \{[\s\S]*?\n  \}/,
    `function makeReplyInstruction(diary: Diary, readKey: string, replyKey: string) {
    const displayNumber = \`JR-\${String(diaries.findIndex((item) => item.id === diary.id) + 1).padStart(4, "0")}\`;
    return [
      "请读取并处理我的绯界记录。",
      "",
      "【所属模块】",
      "我们的日记",
      "",
      "【记录编号】",
      displayNumber,
      "",
      "【真实记录 ID】",
      diary.id,
      "",
      "【云端服务地址】",
      VAULT_API_URL,
      "",
      "【AI 读取钥匙】",
      readKey,
      "",
      "【AI 回复钥匙】",
      replyKey,
      "",
      "【本次任务】",
      "请只读取这篇指定日记的标题、正文与已有上下文。结合当前聊天中已经加载的角色设定、世界书和近期记忆，写一封完整回信。",
      "",
      "完成后，请使用 AI 回复钥匙，把完整回信写回这条记录的 note 字段。",
      "",
      "请严格遵守：",
      "1. 不要修改原始日记内容。",
      "2. 不要创建新的记录。",
      "3. 不要写入其他记录。",
      "4. 只处理上面指定的真实记录 ID。",
    ].join("\\n");
  }

  // CRIMSON_UNIFIED_AI_TASK_INSTRUCTION`,
  );
}

if (!wheel.includes("CRIMSON_UNIFIED_AI_TASK_INSTRUCTION")) {
  wheel = wheel.replace(
    /const text = \[[\s\S]*?\]\.join\("\\\\n"\);\n    await copyText\(text, "已同步并复制发送指令，可以直接粘贴给 AI。"\);/,
    `const index = readHistory().findIndex(item => String(item.id) === String(id));
    const item = readHistory()[index];
    const text = [
      "请读取并处理我的绯界记录。",
      "",
      "【所属模块】",
      "时光之轮",
      "",
      "【记录编号】",
      displayId(item, index, readHistory().length),
      "",
      "【真实记录 ID】",
      String(id),
      "",
      "【云端服务地址】",
      VAULT_API_URL,
      "",
      "【AI 读取钥匙】",
      read,
      "",
      "【AI 回复钥匙】",
      reply,
      "",
      "【本次任务】",
      "请只读取这条指定记录的主题与完整内容。结合当前聊天中已经加载的角色设定、世界书和近期记忆，继续完成这次事件。",
      "",
      "完成后，请使用 AI 回复钥匙，把完整回复写回这条记录的 note 字段。",
      "",
      "请严格遵守：",
      "1. 不要修改原始记录。",
      "2. 不要创建新的记录。",
      "3. 不要写入其他记录。",
      "4. 只处理上面指定的真实记录 ID。",
    ].join("\\n");
    await copyText(text, "AI 任务单已复制，可以直接粘贴给 AI。");
    // CRIMSON_UNIFIED_AI_TASK_INSTRUCTION`,
  );
}

fs.writeFileSync(journalPath, journal);
fs.writeFileSync(wheelPath, wheel);
console.log("Applied unified AI task instructions to journal and time wheel.");
