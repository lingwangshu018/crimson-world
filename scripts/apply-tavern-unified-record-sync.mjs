import fs from "node:fs";

const path = new URL("../app/page.tsx", import.meta.url);
let source = fs.readFileSync(path, "utf8");

if (source.includes("CRIMSON_TAVERN_UNIFIED_RECORD_SYNC")) process.exit(0);

const anchor = `      const prompt = [\n        "请读取我的绯界记录，并继续完成这一事件。",`;
if (!source.includes(anchor)) {
  throw new Error("Tavern unified record prompt anchor not found");
}

const syncBlock = `      const unifiedResponse = await fetch("https://crimson-world.lingwangshu018.workers.dev/api/records", {
        method: "PUT",
        headers: {
          Authorization: \`Bearer \${ownerKey}\`,
          "X-Crimson-Key": ownerKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          readKey,
          replyKey: noteKey,
          records: [{
            id: selectedRecord.id,
            module: "tavern",
            title: selectedRecord.drinkName,
            summary: selectedRecord.bartenderLine || selectedRecord.items.map((item) => item.zh).join("、").slice(0, 240),
            content: [
              \`酒名：\${selectedRecord.drinkName}\`,
              \`酒保：\${selectedRecord.bartender}\`,
              \`客人：\${selectedRecord.guest}\`,
              \`酒保低语：\${selectedRecord.bartenderLine}\`,
              "",
              ...selectedRecord.items.map((item) => \`\${item.course}：\${item.zh}\${item.en ? \` / \${item.en}\` : ""}\${item.ja ? \` / \${item.ja}\` : ""}\`),
            ].join("\\n"),
            note: selectedRecord.note || "",
            createdAt: selectedRecord.createdAt,
            updatedAt: selectedRecord.noteUpdatedAt || selectedRecord.createdAt,
            noteUpdatedAt: selectedRecord.noteUpdatedAt,
            metadata: {
              moduleName: "绯夜酒馆",
              displayNumber: normalizedCode,
              kind: selectedRecord.kind,
            },
          }],
        }),
      });
      const unifiedResult = (await unifiedResponse.json().catch(() => ({}))) as {
        error?: string;
        syncedIds?: string[];
      };
      if (!unifiedResponse.ok || !unifiedResult.syncedIds?.includes(selectedRecord.id)) {
        throw new Error(
          unifiedResult.error || \`统一记录同步失败（HTTP \${unifiedResponse.status}）\`,
        );
      }
      // CRIMSON_TAVERN_UNIFIED_RECORD_SYNC

`;

source = source.replace(anchor, syncBlock + anchor);
fs.writeFileSync(path, source);
console.log("Applied Tavern unified-record sync before copying the AI task.");
