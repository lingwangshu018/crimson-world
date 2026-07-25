import fs from "node:fs";

const path = new URL("../app/JournalRoom.tsx", import.meta.url);
const source = fs.readFileSync(path, "utf8");

const unifiedSyncMarkers = [
  'const RECORDS_API_URL =',
  'async function syncDiaryRecord(',
  'module: "journal"',
  'crimson_read_record',
  'crimson_write_reply',
];

if (unifiedSyncMarkers.every((marker) => source.includes(marker))) {
  console.log("Journal already uses the Crimson unified record workflow; legacy mailbox patch skipped.");
  process.exit(0);
}

if (source.includes("CRIMSON_JOURNAL_AI_MAILBOX")) {
  console.log("Legacy Crimson Journal mailbox patch is already present; skipped.");
  process.exit(0);
}

throw new Error(
  "JournalRoom.tsx contains neither the unified record workflow nor the legacy mailbox marker. " +
    "Refusing to apply the obsolete text-replacement patch; update JournalRoom.tsx directly instead.",
);
