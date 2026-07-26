import fs from "node:fs";

const source = fs.readFileSync(new URL("../app/CafeRoom.tsx", import.meta.url), "utf8");
const sendStart = source.indexOf("  async function sendToAI(record: CafeRecord)");
const sendEnd = source.indexOf("  async function syncCafe()", sendStart);
const sendBody = source.slice(sendStart, sendEnd);

const checks = [
  ["cafe has a records API synchronizer", source.includes("async function syncCafeRecord(record: CafeRecord)")],
  ["records API payload identifies cafe module", source.includes('module: "cafe"')],
  ["records API response verifies synced ID", source.includes("data.syncedIds?.includes(record.id)")],
  ["send waits for record synchronization", sendBody.includes("await syncCafeRecord(record)")],
  ["task is copied only after synchronization", sendBody.indexOf("await syncCafeRecord(record)") >= 0 && sendBody.indexOf("await syncCafeRecord(record)") < sendBody.indexOf("navigator.clipboard.writeText(text)")],
];

const failed = checks.filter(([, passed]) => !passed);
for (const [name, passed] of checks) console.log(`${passed ? "PASS" : "FAIL"} ${name}`);
if (failed.length) process.exit(1);
