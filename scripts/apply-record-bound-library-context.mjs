import fs from "node:fs";

const journalPath = "app/JournalRoom.tsx";
const contextPath = "app/royal-library-context.ts";

let journal = fs.readFileSync(journalPath, "utf8").replace(/\r\n/g, "\n");
let context = fs.readFileSync(contextPath, "utf8").replace(/\r\n/g, "\n");

const journalMarker = "CRIMSON_RECORD_BOUND_LIBRARY_CONTEXT_V1";
if (!journal.includes(journalMarker)) {
  journal = journal.replace(
    'import { appendRoyalLibraryContext } from "./royal-library-context";',
    'import { readRoyalLibraryContext } from "./royal-library-context";',
  );

  const syncAnchor = '    const folderName = folders.find((item) => item.id === diary.folderId)?.name || "";';
  const syncReplacement = `${syncAnchor}\n    // ${journalMarker}\n    const royalLibraryContext = readRoyalLibraryContext({\n      sourceText: [diary.title, diary.content, folderName].filter(Boolean).join("\\n"),\n    });`;
  if (!journal.includes(syncAnchor)) throw new Error("Journal context sync anchor not found.");
  journal = journal.replace(syncAnchor, syncReplacement);

  const metadataAnchor = '              source: DIARY_KEY,\n';
  const metadataReplacement = `${metadataAnchor}              royalLibraryContext: {\n                schemaVersion: 1,\n                mode: "snapshot",\n                characters: royalLibraryContext.characters,\n                worldbooks: royalLibraryContext.worldbooks,\n                matchedKeywordWorldbookIds: royalLibraryContext.matchedKeywordWorldbookIds,\n                snapshot: royalLibraryContext.snapshot,\n                text: royalLibraryContext.text,\n              },\n`;
  if (!journal.includes(metadataAnchor)) throw new Error("Journal metadata anchor not found.");
  journal = journal.replace(metadataAnchor, metadataReplacement);

  journal = journal.replace(
    '        "结合当前聊天已经加载的角色卡、世界书和近期记忆，根据日记标题与正文写一封完整回信。",',
    '        "读取结果的 metadata.royalLibraryContext 中已包含本事件绑定的角色卡、世界书与版本快照。请严格依据这些设定，根据日记标题与正文写一封完整回信。",\n        "",\n        "【皇家图书馆上下文已随记录保存】",',
  );

  journal = journal.replace(
    '      await navigator.clipboard.writeText(appendRoyalLibraryContext(text));',
    '      await navigator.clipboard.writeText(text);',
  );
}

const skipMarker = 'const RECORD_BOUND_CONTEXT_MARKER = "【皇家图书馆上下文已随记录保存】";';
if (!context.includes(skipMarker)) {
  context = context.replace(
    'const CONTEXT_MARKER = "【皇家图书馆自动上下文】";',
    'const CONTEXT_MARKER = "【皇家图书馆自动上下文】";\n' + skipMarker,
  );

  context = context.replace(
    '  if (!taskText || taskText.includes(CONTEXT_MARKER)) return taskText;',
    '  if (!taskText || taskText.includes(CONTEXT_MARKER) || taskText.includes(RECORD_BOUND_CONTEXT_MARKER)) return taskText;',
  );
}

fs.writeFileSync(journalPath, journal);
fs.writeFileSync(contextPath, context);
console.log("Stored Royal Library context in journal record metadata and kept copied tasks concise.");
