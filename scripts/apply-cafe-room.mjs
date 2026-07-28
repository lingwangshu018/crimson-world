import fs from "node:fs";

const pagePath = new URL("../app/page.tsx", import.meta.url);
const cssPath = new URL("../app/globals.css", import.meta.url);
const cafeThemePath = new URL("../app/cafe-tavern.css", import.meta.url);
let page = fs.readFileSync(pagePath, "utf8");
let css = fs.readFileSync(cssPath, "utf8");

// The café is a first-class Crimson World room rendered by WorldRoomOutlet.
// Remove the legacy implementation that embedded it directly inside the Tavern page.
page = page
  .replace('import CafeRoom from "./CafeRoom";\n', "")
  .replace('import CafeRoom from "./CafeRoom";\r\n', "")
  .replace(/\s*<CafeRoom\s*\/>\s*(?=<section id="archive" className="archive-section">)/g, "\n\n      ")
  .replace(
    /\s*<a className="archive-link" href="#cafe">咖啡馆<\/a>\s*(?=<a className="archive-link" href="#archive">)/g,
    "\n          ",
  );

const marker = "/* CRIMSON CAFE ROOM */";
if (!css.includes(marker)) {
  css += `\n\n${marker}\n.cafe-room{position:relative;min-height:100vh;padding:4.5rem clamp(1rem,4vw,4rem);background:#12070b;color:#ead7bf;overflow:hidden}.cafe-room:before{content:"";position:absolute;inset:0;background:linear-gradient(115deg,rgba(12,4,7,.16),transparent 44%);pointer-events:none}.cafe-toast{position:fixed;left:50%;bottom:2rem;z-index:90;transform:translate(-50%,1rem);opacity:0;padding:.85rem 1.25rem;border-radius:999px;background:#3e2b23;color:#fff;box-shadow:0 14px 40px rgba(35,22,15,.24);transition:.25s}.cafe-toast.show{opacity:1;transform:translate(-50%,0)}\n`;
}

const tavernMarker = "/* CAFE TAVERN ARCHIVE V2 */";
if (!css.includes(tavernMarker) && fs.existsSync(cafeThemePath)) {
  css += `\n\n${tavernMarker}\n${fs.readFileSync(cafeThemePath, "utf8")}\n`;
}

fs.writeFileSync(pagePath, page);
fs.writeFileSync(cssPath, css);
console.log("Removed legacy Tavern-embedded cafe and included the Tavern-style cafe archive theme.");
