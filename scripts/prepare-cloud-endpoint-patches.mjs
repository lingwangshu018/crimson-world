import fs from "node:fs";

const archivePath = new URL("./apply-unified-cloud-archive.mjs", import.meta.url);
let archive = fs.readFileSync(archivePath, "utf8");

const retiredHost = [
  "https://crimson-tavern",
  ".boarder-72pound",
  ".chatgpt.site/api/vault",
].join("");
const workerVault = "https://crimson-world.lingwangshu018.workers.dev/api/vault";

if (archive.includes(retiredHost)) {
  archive = archive.split(retiredHost).join(workerVault);
  fs.writeFileSync(archivePath, archive);
  console.log("Normalized unified cloud patch to the Worker vault endpoint.");
} else {
  console.log("Unified cloud patch endpoint is already current.");
}
