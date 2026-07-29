import fs from "node:fs";

const path = "github-pages/library.tsx";
let source = fs.readFileSync(path, "utf8").replace(/\r\n/g, "\n");
const marker = "CRIMSON_LIBRARY_STUDIO_ENTRY";

if (source.includes(marker)) {
  console.log("Royal Library studio entry already integrated.");
  process.exit(0);
}

const topbarPattern = /(<header className="library-topbar">[\s\S]*?<div>)([\s\S]*?)(<\/div>[\s\S]*?<\/header>)/;

if (topbarPattern.test(source)) {
  source = source.replace(
    topbarPattern,
    `$1\n            {/* ${marker} */}\n            <a href="./library-studio.html">进入编纂室</a>$2$3`,
  );
  fs.writeFileSync(path, source);
  console.log("Linked Royal Library studio from the library topbar.");
  process.exit(0);
}

const returnLink = `<a className="return-link" href="./">← 返回绯界</a>`;
if (source.includes(returnLink)) {
  source = source.replace(
    returnLink,
    `<>\n          {/* ${marker} */}\n          <a className="return-link" href="./library-studio.html">✦ 进入编纂室</a>\n          ${returnLink}\n        </>`,
  );
  fs.writeFileSync(path, source);
  console.log("Linked Royal Library studio from the library sidebar.");
  process.exit(0);
}

console.warn("Royal Library entry target was not found; standalone studio page remains available.");
