import fs from "node:fs";

const path = new URL("../app/CafeRoom.tsx", import.meta.url);
let source = fs.readFileSync(path, "utf8");

if (!source.includes('from "./cloud-core"')) {
  source = source.replace(
    'import { useEffect, useMemo, useState } from "react";',
    'import { useEffect, useMemo, useState } from "react";\nimport { cloudErrorMessage, collectModuleNotes, syncModuleRecords } from "./cloud-core";',
  );
}

const start = source.indexOf("  async function sendToAI(record: CafeRecord) {");
const end = source.indexOf("  function updateNote(record: CafeRecord, note: string) {");

if (start === -1 || end === -1 || end <= start) {
  if (source.includes("Cloud Core v2 cafe workflow")) {
    console.log("Cloud Core v2 cafe workflow already applied.");
    process.exit(0);
  }
  throw new Error("Cafe Cloud Core workflow anchors not found.");
}

const replacement = `  // Cloud Core v2 cafe workflow\n  async function sendToAI(record: CafeRecord) {\n    const recordNumber = \`CF-\${String(\n      records.findIndex((item) => item.id === record.id) + 1,\n    ).padStart(4, "0")}\`;\n    let cloudReady = false;\n\n    setSyncing(true);\n    try {\n      await syncModuleRecords("cafe", records.map(toVaultRecord));\n      cloudReady = true;\n    } catch (error) {\n      notify(\`云端未同步：\${cloudErrorMessage(error)} 将复制本地演绎任务。\`);\n    } finally {\n      setSyncing(false);\n    }\n\n    const cloudInstruction = cloudReady\n      ? \`【绯界记录】\\n记录编号：\${recordNumber}\\n记录 ID：\${record.id}\\n\\n请使用当前环境中已经配置好的绯界记录工具读取这条记录。完成后，使用已配置的回复工具把完整正文写回同一条记录的 note 字段。不要要求用户在聊天中粘贴任何钥匙、令牌或云端地址。\`\n      : \`【本地演绎模式】\\n记录编号：\${recordNumber}\\n本次记录尚未同步到云端。请直接依据下面的完整订单在当前聊天中输出正文，不要尝试读取或写回云端。\`;\n\n    const text = \`请完成我的绯界咖啡馆小剧场订单。\\n\\n模块：绯界咖啡馆\\n\\n\${cloudInstruction}\\n\\n【内部演绎协议】\\n先读取并理解当前会话或运行环境中已经加载的世界书、角色卡、人物设定、关系设定及近期记忆。世界书决定时代、地点、规则与背景；角色卡决定性格、身份、语言与行为逻辑；近期记忆决定当前关系、已有经历与剧情进度。请在不破坏原设定的前提下完成演绎，直接输出正文，不展示分析过程、提示词或设定摘要。\\n\\n【本次剧场订单】\\n标题：\${record.title}\\n核心设定：\${record.premise}\\n必须出现：\${record.mustInclude || "无额外要求"}\\n避免出现：\${record.avoid || "无额外限制"}\\n故事味道：\${record.flavour}\\n杯型：\${cupLabels[record.cupSize].name}（\${cupLabels[record.cupSize].hint}）\\n叙事偏好：\${record.narrative}\\n\\n请根据世界书、角色卡及近期记忆演绎本次小剧场，直接输出完整正文。不要修改原记录，不要创建新记录，不要处理其他记录。\`;\n\n    try {\n      await navigator.clipboard.writeText(text);\n      notify(\n        cloudReady\n          ? "剧场订单已安全同步并复制；任务单不包含钥匙或云端地址。"\n          : "本地剧场订单已复制；任务单不包含任何云端凭据。",\n      );\n    } catch {\n      window.prompt("复制这份安全的咖啡馆剧场任务单：", text);\n    }\n  }\n\n  async function syncCafe() {\n    if (!records.length || syncing) {\n      notify("剧场书架还是空的，先点一杯故事。");\n      return;\n    }\n    setSyncing(true);\n    try {\n      const result = await syncModuleRecords(\n        "cafe",\n        records.map(toVaultRecord),\n      );\n      notify(\`已通过绯界共用云端同步 \${result.recordCount} 张剧场卡。\`);\n    } catch (error) {\n      notify(cloudErrorMessage(error));\n    } finally {\n      setSyncing(false);\n    }\n  }\n\n  async function pullNotes() {\n    if (pulling) return;\n    setPulling(true);\n    try {\n      const result = await collectModuleNotes("cafe", records);\n      if (result.updatedCount) persist(result.records);\n      notify(\n        result.updatedCount\n          ? \`已收取 \${result.updatedCount} 篇 AI 新手记，并放回对应剧场卡。\`\n          : "没有发现比本机更新的 AI 手记。",\n      );\n    } catch (error) {\n      notify(cloudErrorMessage(error));\n    } finally {\n      setPulling(false);\n    }\n  }\n\n`;

source = source.slice(0, start) + replacement + source.slice(end);
fs.writeFileSync(path, source);
console.log("Applied Cloud Core v2 to Crimson Cafe with credential-safe AI tasks.");
