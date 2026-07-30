import fs from "node:fs";

const path = "app/royal-library-context.ts";
let source = fs.readFileSync(path, "utf8").replace(/\r\n/g, "\n");

const start = source.indexOf("export function installRoyalLibraryClipboardBridge()");
if (start < 0) throw new Error("Royal Library clipboard bridge function not found.");

const replacement = `export function installRoyalLibraryClipboardBridge() {
  // Royal Library context is now stored with records and read through crimson_read_record.
  // Keep copied AI task text concise and never append character/worldbook bodies here.
}`;

const functionPattern = /export function installRoyalLibraryClipboardBridge\(\) \{[\s\S]*?\n\}/;
if (!functionPattern.test(source)) throw new Error("Royal Library clipboard bridge body not found.");
source = source.replace(functionPattern, replacement);

fs.writeFileSync(path, source);
console.log("Disabled Royal Library clipboard text injection.");
