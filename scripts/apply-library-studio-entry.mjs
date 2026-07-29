import fs from "node:fs";

const path = "github-pages/library.tsx";
let source = fs.readFileSync(path, "utf8").replace(/\r\n/g, "\n");
const marker = "CRIMSON_LIBRARY_STUDIO_ENTRY";

if (source.includes(marker)) {
  console.log("Royal Library studio entry already integrated.");
  process.exit(0);
}

const target = `<div>\n            <a href="https://github.com/lingwangshu018/crimson-world/tree/main/docs/world" target="_blank" rel="noreferrer">馆藏源文件</a>`;
const replacement = `<div>\n            {/* ${marker} */}\n            <a href="./library-studio.html">进入编纂室</a>\n            <a href="https://github.com/lingwangshu018/crimson-world/tree/main/docs/world" target="_blank" rel="noreferrer">馆藏源文件</a>`;

if (!source.includes(target)) {
  throw new Error("Royal Library topbar target not found.");
}

source = source.replace(target, replacement);
fs.writeFileSync(path, source);
console.log("Linked Royal Library studio from the library topbar.");
