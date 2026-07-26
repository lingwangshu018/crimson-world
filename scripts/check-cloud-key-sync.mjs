import fs from "node:fs";

const archive = fs.readFileSync(new URL("./apply-unified-cloud-archive.mjs", import.meta.url), "utf8");
const keyCenter = fs.readFileSync(new URL("./apply-cloud-key-center.mjs", import.meta.url), "utf8");
const timeWheel = fs.readFileSync(new URL("./apply-time-wheel-room.mjs", import.meta.url), "utf8");

const checks = [
  ["key regeneration marks pending sync", keyCenter.includes("KEYS_DIRTY_KEY") && keyCenter.includes('write(KEYS_DIRTY_KEY, "1")')],
  ["archive displays pending key state", archive.includes("keySyncPending")],
  ["full sync updates records API", archive.includes('method: "PUT"') && archive.includes("recordsApiUrl") && archive.includes("unifiedRecords")],
  ["pending key state clears only after sync", archive.includes('write(KEYS_DIRTY_KEY, "0")')],
  ["time wheel patch recognizes room outlet", timeWheel.includes("WorldRoomOutlet.tsx") && timeWheel.includes("TimeWheelRoom")],
];

let failed = 0;
for (const [label, passed] of checks) {
  if (passed) console.log(`PASS ${label}`);
  else {
    failed += 1;
    console.error(`FAIL ${label}`);
  }
}
if (failed) process.exit(1);
