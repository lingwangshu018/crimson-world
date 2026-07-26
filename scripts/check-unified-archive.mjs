import fs from "node:fs";

const patch = fs.readFileSync(
  new URL("./apply-unified-cloud-archive.mjs", import.meta.url),
  "utf8",
);
const recordsRoute = fs.readFileSync(
  new URL("../app/api/records/route.ts", import.meta.url),
  "utf8",
);

const checks = [
  ["export includes tavern", patch.includes("tavern: { history:")],
  ["export includes journal", patch.includes("journal: { diaries:")],
  ["export includes time wheel", patch.includes("timeWheel: { history:")],
  ["export includes cafe records", patch.includes("cafe: { records:")],
  ["export includes cafe recipes", patch.includes("recipes: JSON.parse(read(CAFE_RECIPES_KEY)")],
  ["import restores tavern", patch.includes("write(HISTORY_KEY")],
  ["import restores journal", patch.includes("write(JOURNAL_KEY")],
  ["import restores time wheel", patch.includes("write(TIME_WHEEL_HISTORY_KEY")],
  ["import restores cafe records", patch.includes("write(CAFE_RECORDS_KEY")],
  ["import restores cafe recipes", patch.includes("write(CAFE_RECIPES_KEY")],
  ["collect all uses records API", patch.includes("getRecordsApiUrl(apiUrl)")],
  ["collect all restores tavern replies", patch.includes("const nextTavern = tavern.map")],
  ["collect all restores journal replies", patch.includes("const nextJournal = journal.map")],
  ["collect all restores time wheel replies", patch.includes("const nextTimeWheel = timeWheel.map")],
  ["collect all restores cafe replies", patch.includes("const nextCafe = cafe.map")],
  [
    "records API permits all 500 stored records",
    recordsRoute.includes("Math.min(MAX_RECORDS, Math.max(1, requestedLimit))"),
  ],
];

const failed = checks.filter(([, passed]) => !passed);
for (const [name, passed] of checks) {
  console.log(`${passed ? "PASS" : "FAIL"} ${name}`);
}
if (failed.length) process.exit(1);
