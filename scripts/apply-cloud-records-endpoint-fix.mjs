import fs from "node:fs";

const path = new URL("../app/CloudCellar.tsx", import.meta.url);
let source = fs.readFileSync(path, "utf8");

const marker = "CRIMSON_CLOUD_RECORDS_ENDPOINT_FIX";
if (source.includes(marker)) process.exit(0);

const pattern = /(\s*)const url = new URL\(configured\);\n\1if \(!url\.pathname\.endsWith\("\/api\/records"\)\) \{/;
const match = source.match(pattern);

if (!match) {
  throw new Error("Cloud records endpoint patch target not found");
}

const indent = match[1];
const replacement = `${indent}const url = new URL(configured);
${indent}// CRIMSON_CLOUD_RECORDS_ENDPOINT_FIX
${indent}// The legacy vault host has no unified records endpoint. Route only that
${indent}// historical default to the Crimson World worker; custom providers keep
${indent}// using their own /api/records endpoint.
${indent}if (url.hostname === "crimson-tavern.boarder-72pound.chatgpt.site") {
${indent}  return "https://crimson-world.lingwangshu018.workers.dev/api/records";
${indent}}
${indent}if (!url.pathname.endsWith("/api/records")) {`;

source = source.replace(pattern, replacement);
fs.writeFileSync(path, source);
console.log("Fixed legacy full-sync records endpoint routing.");
