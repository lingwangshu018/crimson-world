import fs from "node:fs";

const path = new URL("../app/api/records/route.ts", import.meta.url);
let source = fs.readFileSync(path, "utf8");
const marker = "CRIMSON_TIME_WHEEL_HTML_WRITE_GUARD";

if (source.includes(marker)) {
  console.log("Time Wheel HTML write guard already applied.");
  process.exit(0);
}

const inputAnchor = `    const body = (await request.json()) as Record<string, unknown>;
    const recordId = text(body.recordId, 160);
    const addition = text(body.content, MAX_REPLY_APPEND);
    if (!recordId) return json({ error: "缺少记录 ID。" }, 400);
    if (!addition) return json({ error: "回复内容不能为空。" }, 400);`;

if (!source.includes(inputAnchor)) {
  throw new Error("Reply input block not found");
}

source = source.replace(
  inputAnchor,
  `    const body = (await request.json()) as Record<string, unknown>;
    const recordId = text(body.recordId, 160);
    const rawContent = String(body.content ?? "").trim();
    if (!recordId) return json({ error: "缺少记录 ID。" }, 400);
    if (!rawContent) return json({ error: "回复内容不能为空。" }, 400);`,
);

const recordAnchor = `    const payload = JSON.parse(vault.payload) as VaultPayload;
    const record = payload.records.find((item) => item.id === recordId);
    if (!record) return json({ error: "没有找到要写回的记录。" }, 404);

    const previous = record.note.trimEnd();`;

if (!source.includes(recordAnchor)) {
  throw new Error("Reply record block not found");
}

source = source.replace(
  recordAnchor,
  `    const payload = JSON.parse(vault.payload) as VaultPayload;
    const record = payload.records.find((item) => item.id === recordId);
    if (!record) return json({ error: "没有找到要写回的记录。" }, 404);

    const isTimeWheel = record.module === "time-wheel";
    let addition = text(rawContent, isTimeWheel ? MAX_NOTE_LENGTH : MAX_REPLY_APPEND);

    if (isTimeWheel) {
      addition = addition
        .replace(/^\\s*\`\`\`(?:html)?\\s*/i, "")
        .replace(/\\s*\`\`\`\\s*$/i, "")
        .replace(/>\\s+</g, "><")
        .replace(/[\\r\\n]+/g, " ")
        .replace(/\\s{2,}/g, " ")
        .trim();

      const looksLikeHtml =
        addition.startsWith("<") &&
        /<(?:!doctype|html|head|body|div|section|article|main|style)\\b/i.test(addition) &&
        /<\\/[a-z][^>]*>\\s*$/i.test(addition);

      if (!looksLikeHtml) {
        return json(
          {
            error:
              "时光之轮只接受完整 HTML。请依据记录中的模块提示词与 HTML 模板重新生成；不要输出解释、正文或 Markdown 代码块，并将 HTML 压缩为单行后再次写回。",
            code: "TIME_WHEEL_HTML_REQUIRED",
          },
          422,
        );
      }
    }

    const previous = record.note.trimEnd();
    // ${marker}`,
);

const nextAnchor = `    const next = previous ? \`\${previous}\\n\\n\${addition}\` : addition;`;
if (!source.includes(nextAnchor)) {
  throw new Error("Reply merge block not found");
}

source = source.replace(
  nextAnchor,
  `    const next = isTimeWheel
      ? addition
      : previous
        ? \`\${previous}\\n\\n\${addition}\`
        : addition;`,
);

fs.writeFileSync(path, source);
console.log("Applied strict HTML validation and replacement for Time Wheel replies.");
