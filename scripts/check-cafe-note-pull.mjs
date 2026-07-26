import fs from "node:fs";

const source = fs.readFileSync(
  new URL("../app/CafeRoom.tsx", import.meta.url),
  "utf8",
);
const pullStart = source.indexOf("  async function pullNotes()");
const pullEnd = source.indexOf("  function updateNote", pullStart);
const pullBody = source.slice(pullStart, pullEnd);

const checks = [
  [
    "cafe pulls replies from the tool-readable records API",
    pullBody.includes("getRecordsApiUrl()"),
  ],
  [
    "cafe does not pull replies from the legacy vault API",
    !pullBody.includes("API_URL_KEY") && !pullBody.includes("DEFAULT_API_URL"),
  ],
  [
    "cafe still isolates replies by module",
    pullBody.includes('cloud?.module !== "cafe"'),
  ],
  [
    "cafe maps the returned note timestamp",
    pullBody.includes("cloud?.noteUpdatedAt"),
  ],
];

const failed = checks.filter(([, passed]) => !passed);
for (const [name, passed] of checks) {
  console.log(`${passed ? "PASS" : "FAIL"} ${name}`);
}
if (failed.length) process.exit(1);
