import fs from "node:fs";

const path = new URL("../public/time-wheel/index.html", import.meta.url);
let source = fs.readFileSync(path, "utf8");

if (source.includes("CRIMSON_TIME_WHEEL_CONFIRM_ONLY")) process.exit(0);

source = source
  .replaceAll('@click="confirmRun()">生成并保存本次记录</button>', '@click="confirmRun()">确定</button>')
  .replaceAll('@click="confirmRun()">复制提示词</button>', '@click="confirmRun()">确定</button>');

const start = source.indexOf("const confirmRun = () => {");
const end = source.indexOf("const fallbackCopy =", start);

if (start < 0 || end < 0) {
  throw new Error("Time Wheel confirmRun block not found.");
}

const replacement = `const confirmRun = () => {
  const m = runModule.value;
  if (!m) return;
  const topic = runTopic.value.trim();
  const extra = runExtra.value.trim();
  const pendingContent = \`<div style="padding:40px 20px;text-align:center;color:#c9b9ae;font-size:15px;font-weight:bold;line-height:1.7;">记录已经保存。<br><br><span style="font-size:13px;color:#8f7f78;font-weight:normal;">可在运行历史中点击“发送给 AI”继续。</span></div>\`;
  const historyRecord = {
    id: window.crypto && window.crypto.randomUUID ? window.crypto.randomUUID() : Math.random().toString(36).substr(2, 9),
    module_id: m.id,
    module_name: m.name,
    topic: topic || "无主题",
    extra: extra || "",
    content: pendingContent,
    created_at: Date.now(),
  };
  history.value.unshift(historyRecord);
  saveData();
  runModalVisible.value = false;
};
// CRIMSON_TIME_WHEEL_CONFIRM_ONLY
`;

source = source.slice(0, start) + replacement + source.slice(end);
fs.writeFileSync(path, source);
console.log("Simplified Time Wheel run confirmation and removed prompt copying.");
