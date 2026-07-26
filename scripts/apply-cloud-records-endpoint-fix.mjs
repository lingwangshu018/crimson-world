import fs from "node:fs";

const path = new URL("../app/CloudCellar.tsx", import.meta.url);
let source = fs.readFileSync(path, "utf8");

const marker = "CRIMSON_CLOUD_RECORDS_ENDPOINT_FIX";
if (source.includes(marker)) process.exit(0);

const before = `      const url = new URL(configured);
    if (!url.pathname.endsWith("/api/records")) {`;

const after = `      const url = new URL(configured);
    // CRIMSON_CLOUD_RECORDS_ENDPOINT_FIX
    // The legacy vault host has no unified records endpoint. Route only that
    // historical default to the Crimson World worker; custom providers keep
    // using their own /api/records endpoint.
    if (url.hostname === "crimson-tavern.boarder-72pound.chatgpt.site") {
      return "https://crimson-world.lingwangshu018.workers.dev/api/records";
    }
    if (!url.pathname.endsWith("/api/records")) {`;

if (!source.includes(before)) {
  throw new Error("Cloud records endpoint patch target not found");
}

source = source.replace(before, after);
fs.writeFileSync(path, source);
console.log("Fixed legacy full-sync records endpoint routing.");
