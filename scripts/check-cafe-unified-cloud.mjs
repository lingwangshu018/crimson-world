import fs from "node:fs";

const cafe = fs.readFileSync(new URL("../app/CafeRoom.tsx", import.meta.url), "utf8");
const unifiedArchive = fs.readFileSync(new URL("./apply-unified-cloud-archive.mjs", import.meta.url), "utf8");
const controlCenter = fs.readFileSync(new URL("./apply-cloud-control-center-upgrade.mjs", import.meta.url), "utf8");

const checks = [
  ["control center registers cafe storage", unifiedArchive.includes('const CAFE_RECORDS_KEY = "crimson-cafe.records.v1"')],
  ["cloud restore separates cafe records", unifiedArchive.includes("write(CAFE_RECORDS_KEY, JSON.stringify(cloudCafeRecords))")],
  ["full backup includes cafe records", unifiedArchive.includes('cafe: { records: JSON.parse(read(CAFE_RECORDS_KEY) || "[]") }')],
  ["full import restores cafe records", controlCenter.includes("payload.cafe?.records")],
  ["reply collection updates cafe notes", unifiedArchive.includes("const nextCafe = cafe.map")],
  ["cafe task obtains shared keys", cafe.includes("ensureSharedVaultKeys()")],
  ["cafe prompt includes shared read key", cafe.includes("${readKey}")],
  ["cafe prompt includes shared reply key", cafe.includes("${replyKey}")],
];

const failed = checks.filter(([, passed]) => !passed);
for (const [name, passed] of checks) console.log(`${passed ? "PASS" : "FAIL"} ${name}`);
if (failed.length) process.exit(1);
