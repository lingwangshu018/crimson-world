import fs from "node:fs";

const componentPath = new URL("../app/page.tsx", import.meta.url);
const stylePath = new URL("../app/globals.css", import.meta.url);
let source = fs.readFileSync(componentPath, "utf8");
let styles = fs.readFileSync(stylePath, "utf8");

if (source.includes("CRIMSON_TAVERN_NUMBERED_AI_SEND")) process.exit(0);

const stateAnchor = '  const [pendingVaultNotes, setPendingVaultNotes] = useState(0); // tavern-ai-workflow-v1';
if (!source.includes(stateAnchor)) {
  throw new Error("Tavern numbered AI state anchor not found");
}
source = source.replace(
  stateAnchor,
  `${stateAnchor}\n  const [tavernAiCode, setTavernAiCode] = useState("");\n  // CRIMSON_TAVERN_NUMBERED_AI_SEND`,
);

const syncAnchor = `  async function syncVault() {\n    if (syncingVault) return;\n    if (!records.length) {`;
if (!source.includes(syncAnchor)) {
  throw new Error("Tavern syncVault anchor not found");
}
source = source.replace(
  syncAnchor,
  `  async function syncVault() {\n    if (syncingVault) return;\n    if (!records.length) {`,
);

const emptyArchiveBlock = `    if (!records.length) {\n      showToast("酒馆档案还是空的，先点一杯酒再同步。");\n      return;\n    }\n\n    let ownerKey = vaultOwnerKey;`;
if (!source.includes(emptyArchiveBlock)) {
  throw new Error("Tavern numbered record validation anchor not found");
}
source = source.replace(
  emptyArchiveBlock,
  `    if (!records.length) {\n      showToast("酒馆档案还是空的，先点一杯酒再同步。");\n      return;\n    }\n\n    const normalizedCode = tavernAiCode.trim().toUpperCase();\n    const codeMatch = normalizedCode.match(/^TV-(\\d{4})$/);\n    if (!codeMatch) {\n      showToast("请输入完整酒签编号，例如 TV-0001。");\n      return;\n    }\n    const displayNumber = Number.parseInt(codeMatch[1], 10);\n    const recordIndex = records.length - displayNumber;\n    const selectedRecord = records[recordIndex];\n    if (displayNumber < 1 || !selectedRecord) {\n      showToast("没有找到这个酒签编号，请检查后重新输入。");\n      return;\n    }\n\n    let ownerKey = vaultOwnerKey;`,
);

const promptBlock = `      const prompt = [\n        "请读取我的绯界酒馆档案，并继续完成随杯手记。",\n        "",\n        "【模块】绯界酒馆",\n        \`【读取钥匙】\${readKey}\`,\n        \`【回复钥匙】\${noteKey}\`,\n        "",\n        "请读取酒馆档案，结合当前聊天已经加载的角色卡、世界书与近期记忆，选择需要续写的已有酒签。",\n        "完成后，请使用回复钥匙把完整回复写回对应记录的 note 字段。",\n        "请不要修改酒单、删除记录或创建无关记录。",\n      ].join("\\n");`;
if (!source.includes(promptBlock)) {
  throw new Error("Tavern AI prompt block not found");
}
source = source.replace(
  promptBlock,
  `      const prompt = [\n        "请读取我的绯界记录，并继续完成这一事件。",\n        "",\n        "【模块】",\n        "绯夜酒馆",\n        "",\n        "【记录编号】",\n        normalizedCode,\n        "",\n        "【记录ID】",\n        selectedRecord.id,\n        "",\n        "【读取钥匙】",\n        readKey,\n        "",\n        "【回复钥匙】",\n        noteKey,\n        "",\n        "请先调用绯界工具 crimson_read_record，使用上面的记录ID与读取钥匙精确读取这一杯酒签。",\n        "",\n        "结合当前聊天已经加载的角色卡、世界书和近期记忆，根据酒签内容继续完成随杯手记。",\n        "",\n        "完成后，请调用 crimson_write_reply，使用完全相同的记录ID与回复钥匙，将完整手记写回 note 字段。",\n        "",\n        "不要修改原始记录，不要创建新记录，不要写入其他记录。",\n        "只处理这一条。",\n      ].join("\\n");`,
);

const uiAnchor = `              <p>发送时会在后台准备档案与钥匙，并复制完整指令；钥匙不再显示，也无需手动管理。</p>\n              <div className="vault-actions">`;
if (!source.includes(uiAnchor)) {
  throw new Error("Tavern AI panel anchor not found");
}
source = source.replace(
  uiAnchor,
  `              <p>像日记本一样，输入酒签编号后直接定位这一杯；不再搜索、不再筛选是否写过。</p>\n              <label className="tavern-ai-code-field">\n                <span>酒签编号</span>\n                <input\n                  value={tavernAiCode}\n                  onChange={(event) => setTavernAiCode(event.target.value.toUpperCase())}\n                  placeholder="例如 TV-0001"\n                  inputMode="text"\n                  maxLength={7}\n                />\n                <small>编号显示在每张酒签左侧；点击编号即可自动填入并复制。</small>\n              </label>\n              <div className="vault-actions">`,
);

const indexBlock = `                        <span className="record-index">\n                          {(records.indexOf(record) + 1)\n                            .toString()\n                            .padStart(2, "0")}\n                        </span>`;
if (!source.includes(indexBlock)) {
  throw new Error("Tavern record index display anchor not found");
}
source = source.replace(
  indexBlock,
  `                        <span\n                          className="record-index tavern-record-code"\n                          role="button"\n                          tabIndex={0}\n                          title="点击填入并复制酒签编号"\n                          onClick={(event) => {\n                            event.stopPropagation();\n                            const code = \`TV-\${String(records.length - records.indexOf(record)).padStart(4, "0")}\`;\n                            setTavernAiCode(code);\n                            void navigator.clipboard.writeText(code)\n                              .then(() => showToast(\`已复制 \${code}，并填入发送框。\`))\n                              .catch(() => window.prompt("复制酒签编号：", code));\n                          }}\n                          onKeyDown={(event) => {\n                            if (event.key !== "Enter" && event.key !== " ") return;\n                            event.preventDefault();\n                            event.stopPropagation();\n                            const code = \`TV-\${String(records.length - records.indexOf(record)).padStart(4, "0")}\`;\n                            setTavernAiCode(code);\n                            void navigator.clipboard.writeText(code)\n                              .then(() => showToast(\`已复制 \${code}，并填入发送框。\`))\n                              .catch(() => window.prompt("复制酒签编号：", code));\n                          }}\n                        >\n                          {\`TV-\${String(records.length - records.indexOf(record)).padStart(4, "0")}\`}\n                        </span>`,
);

if (!styles.includes("CRIMSON_TAVERN_NUMBERED_AI_SEND_STYLES")) {
  styles += `\n\n/* CRIMSON_TAVERN_NUMBERED_AI_SEND_STYLES */\n.tavern-ai-code-field{display:grid;gap:7px;margin:14px 0 12px}.tavern-ai-code-field>span{font-size:11px;letter-spacing:.12em;color:#e0c597}.tavern-ai-code-field input{width:100%;box-sizing:border-box;border:1px solid rgba(203,168,107,.34);border-radius:13px;padding:12px 14px;background:rgba(18,8,11,.72);color:#fff2de;font:700 15px/1.2 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.08em;text-transform:uppercase}.tavern-ai-code-field small{color:rgba(255,240,220,.58);font-size:10px;line-height:1.55}.tavern-record-code{min-width:74px!important;font-size:9px!important;letter-spacing:.06em!important;white-space:nowrap;cursor:pointer;user-select:none}.tavern-record-code:hover,.tavern-record-code:focus-visible{color:#ffe2a6;outline:1px solid rgba(241,217,166,.52);outline-offset:3px;border-radius:5px}.record-summary{gap:12px}.record-main{min-width:0}\n`;
}

fs.writeFileSync(componentPath, source);
fs.writeFileSync(stylePath, styles);
console.log("Applied reverse-numbered, copyable direct AI sending for Tavern records.");