import fs from "node:fs";

const path = "app/page.tsx";
let source = fs.readFileSync(path, "utf8");

const clearNoteFunction = `
  function clearNote(record: TavernRecord) {
    const draft = drafts[record.id] === undefined ? record.note : drafts[record.id];
    if (!draft.trim() && !record.note.trim()) {
      showToast("这篇随杯手记已经是空的。");
      return;
    }
    if (!window.confirm(\`确定清空「\${record.drinkName}」的随杯手记正文吗？酒签会保留。\`)) {
      return;
    }

    const updatedAt = new Date().toISOString();
    const nextRecords = records.map((item) =>
      item.id === record.id
        ? { ...item, note: "", noteUpdatedAt: updatedAt }
        : item,
    );

    try {
      persistRecords(nextRecords);
      setDrafts((previous) => ({ ...previous, [record.id]: "" }));
      setCurrent((item) =>
        item?.id === record.id
          ? { ...item, note: "", noteUpdatedAt: updatedAt }
          : item,
      );
      showToast("随杯手记正文已经清空，酒签仍保留在档案中。");
    } catch {
      showToast("手记暂时没能删除，请检查浏览器存储权限。");
    }
  }
`;

if (!source.includes("function clearNote(record: TavernRecord)")) {
  const functionMarker = /\n\s{2}function removeRecord\(record: TavernRecord\) \{/;
  const match = source.match(functionMarker);
  if (!match || match.index === undefined) {
    throw new Error("Could not locate Tavern removeRecord function.");
  }
  source = `${source.slice(0, match.index)}${clearNoteFunction}${source.slice(match.index)}`;
}

const hasClearButton = /onClick=\{\(\) => clearNote\(record\)\}[\s\S]{0,180}?删除手记/.test(source);

if (!hasClearButton) {
  const removeButtonPattern = /([ \t]*)<button\b[\s\S]{0,260}?onClick=\{\(\) => removeRecord\(record\)\}[\s\S]{0,180}?>[\s\S]{0,100}?移除酒签[\s\S]{0,80}?<\/button>/;
  const match = source.match(removeButtonPattern);
  if (!match || match.index === undefined) {
    throw new Error("Could not locate Tavern remove record button.");
  }

  const indent = match[1] || "";
  const clearButton = `${indent}<button
${indent}  className="remove-button clear-note-button"
${indent}  type="button"
${indent}  onClick={() => clearNote(record)}
${indent}>
${indent}  删除手记
${indent}</button>
`;

  source = `${source.slice(0, match.index)}${clearButton}${source.slice(match.index)}`;
}

fs.writeFileSync(path, source);
console.log("Applied separate Tavern note and record deletion actions.");
