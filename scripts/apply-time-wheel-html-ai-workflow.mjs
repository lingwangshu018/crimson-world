import fs from "node:fs";

const path = new URL("../public/time-wheel/index.html", import.meta.url);
let source = fs.readFileSync(path, "utf8");
const marker = "CRIMSON_TIME_WHEEL_HTML_AI_WORKFLOW";

if (source.includes(marker)) {
  console.log("Time Wheel HTML AI workflow already applied.");
  process.exit(0);
}

source = source.replace(
  '@click="previewHtml(h.content, h.id)"',
  '@click="previewHtml(h.ai_reply || h.content, h.id)"',
);

const itemAnchor = `    const item = history[index];
    if (!item) return setStatus("没有找到这条记录。");

    const keys = ensureKeys();`;

if (!source.includes(itemAnchor)) {
  throw new Error("Time Wheel direct-send item anchor not found");
}

source = source.replace(
  itemAnchor,
  `    const item = history[index];
    if (!item) return setStatus("没有找到这条记录。");

    const savedModules = (() => {
      try {
        const value = JSON.parse(localStorage.getItem("public_tm_modules_v2") || "[]");
        return Array.isArray(value) ? value : [];
      } catch {
        return [];
      }
    })();
    const sourceModule = savedModules.find(module => String(module.id || "") === String(item.module_id || ""))
      || savedModules.find(module => String(module.name || "") === String(item.module_name || ""))
      || null;
    const modulePrompt = String(sourceModule?.prompt || item.prompt || "").trim();
    const templateHtml = String(sourceModule?.template_html || item.template_html || item.content || "").trim();
    const topic = String(item.topic || "").trim();
    const extra = String(item.extra || item.run_extra || item.requirement || "").trim();
    const randomMode = !topic && !extra;

    const keys = ensureKeys();`,
);

const contentAnchor = `            content: item.content || "",
            note: item.ai_reply || "",`;

if (!source.includes(contentAnchor)) {
  throw new Error("Time Wheel unified-record content anchor not found");
}

source = source.replace(
  contentAnchor,
  `            content: [
              "【时光之轮模块名称】",
              String(item.module_name || sourceModule?.name || "未命名模块"),
              "",
              "【本次主题】",
              topic || "（未填写：由 AI 根据模板、角色设定、世界书与近期记忆随机生成）",
              "",
              "【补充要求】",
              extra || "（未填写）",
              "",
              "【模块提示词】",
              modulePrompt || "（未填写）",
              "",
              "【HTML 模板】",
              templateHtml || "（模板为空）",
            ].join("\\n"),
            note: item.ai_reply || "",`,
);

const metadataAnchor = `              topic: item.topic || "",
            },`;

if (source.includes(metadataAnchor)) {
  source = source.replace(
    metadataAnchor,
    `              topic,
              extra,
              randomMode,
              outputFormat: "single-line-html",
            },`,
  );
}

const taskAnchor = `      "请读取这条记录的完整内容。",
      "",
      "结合当前聊天已经加载的角色卡、世界书和近期记忆，继续完成这一事件。",
      "",
      "完成后，请使用回复钥匙，将完整回复写回本条记录的 note 字段。",
      "不要修改原始记录，不要创建新的记录，不要回复到其它记录。",
      "只处理这一条记录即可。",`;

if (!source.includes(taskAnchor)) {
  throw new Error("Time Wheel AI task instruction anchor not found");
}

source = source.replace(
  taskAnchor,
  `      "请读取这条记录的完整内容，其中包含本次主题、补充要求、模块提示词和完整 HTML 模板。",
      "",
      randomMode
        ? "本次没有填写主题和补充要求。请根据记录中的 HTML 模板，并结合当前聊天已加载的角色卡、世界书、核心记忆与近期记忆，随机生成一次符合设定的完整内容。"
        : "请严格依据本次主题、补充要求、模块提示词，并结合当前聊天已加载的角色卡、世界书、核心记忆与近期记忆，填充 HTML 模板。",
      "",
      "【代码输出约束】",
      "• 核心警告：严禁使用 ```html 或任何 Markdown 代码块包裹，必须直接输出纯 HTML 字符串。",
      "• 严格使用记录中提供的 HTML/CSS 架构，严禁修改样式。",
      "• 必须将全部代码压缩为单行输出，中间禁止任何换行。",
      "• 将模板占位符依次替换，填充内容字数充足。",
      "• 填充内容必须严格依据角色设定、世界书、核心记忆与近期记忆。",
      "",
      "完成后，请使用回复钥匙，将这段单行纯 HTML 完整写回本条记录的 note 字段。",
      "不要修改原始记录，不要创建新的记录，不要回复到其它记录。",
      "只处理这一条记录即可。",`,
);

source = source.replace(
  "  // CRIMSON_TIME_WHEEL_DIRECT_REPLY_COLLECTION",
  `  // CRIMSON_TIME_WHEEL_DIRECT_REPLY_COLLECTION\n  // ${marker}`,
);

fs.writeFileSync(path, source);
console.log("Applied Time Wheel HTML template reading, single-line HTML output, and reply preview.");
