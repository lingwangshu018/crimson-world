import fs from "node:fs";

const wheelPath = new URL("../public/time-wheel/index.html", import.meta.url);
let wheel = fs.readFileSync(wheelPath, "utf8");

const marker = "CRIMSON_TIME_WHEEL_LOCAL_AI_SEND";

if (!wheel.includes(marker)) {
  const pattern = /  async function sendRecordToAI\(id\) \{[\s\S]*?\n  \}\n\n  async function pullReplies\(\) \{/;

  if (!pattern.test(wheel)) {
    throw new Error("Time Wheel sendRecordToAI block not found");
  }

  const replacement = `  async function sendRecordToAI(id) {
    const history = readHistory();
    const index = history.findIndex(item => String(item.id) === String(id));
    const item = history[index];
    if (!item) return setStatus("没有找到这条记录。");

    const keys = ensureKeys();
    if (!keys) return setStatus("⚠️ 请前往绯界控制中心生成并配置共享读取钥匙与回复钥匙。");

    const text = [
      "请读取我的绯界记录，并继续完成这一事件。",
      "",
      "模块：时光之轮",
      "",
      "【记录编号】",
      displayId(item, index, history.length),
      "",
      "【记录ID】",
      String(id),
      "",
      "【读取钥匙】",
      keys.read,
      "",
      "【回复钥匙】",
      keys.reply,
      "",
      "请读取这条记录的完整内容。",
      "",
      "结合当前聊天已经加载的：",
      "- 角色卡",
      "- 世界书",
      "- 近期记忆",
      "",
      "继续完成这一事件。",
      "",
      "完成后，请使用回复钥匙，将完整回复写回本条记录的 note 字段。",
      "",
      "请不要：",
      "• 修改原始记录",
      "• 创建新的记录",
      "• 回复到其它记录",
      "",
      "只处理这一条记录即可。",
    ].join("\\n");

    await copyText(text, "AI 任务单已复制，可以直接粘贴给 AI。");
  }

  // ${marker}

  async function pullReplies() {`;

  wheel = wheel.replace(pattern, replacement);
}

fs.writeFileSync(wheelPath, wheel);
console.log("Decoupled Time Wheel AI sending from cloud synchronization.");
