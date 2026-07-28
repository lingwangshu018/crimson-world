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
  const marker = "\n  function removeRecord(record: TavernRecord) {";
  if (!source.includes(marker)) {
    throw new Error("Could not locate Tavern removeRecord function.");
  }
  source = source.replace(marker, `${clearNoteFunction}${marker}`);
}

if (!source.includes(">\n                                  删除手记\n                                </button>")) {
  const marker = `                                <button
                                  className="remove-button"
                                  type="button"
                                  onClick={() => removeRecord(record)}
                                >
                                  移除酒签
                                </button>`;
  if (!source.includes(marker)) {
    throw new Error("Could not locate Tavern remove record button.");
  }

  const replacement = `                                <button
                                  className="remove-button clear-note-button"
                                  type="button"
                                  onClick={() => clearNote(record)}
                                >
                                  删除手记
                                </button>
${marker}`;
  source = source.replace(marker, replacement);
}

fs.writeFileSync(path, source);
console.log("Applied separate Tavern note and record deletion actions.");
