import fs from "node:fs";

const path = new URL("../app/page.tsx", import.meta.url);
let source = fs.readFileSync(path, "utf8");

if (source.includes("tavern-background-art")) {
  console.log("Layered tavern artwork already applied.");
  process.exit(0);
}

const target = '<div className={`tavern-scene ${mixing ? "mixing" : ""}`}>';
const replacement = `${target}\n            <img
              className="tavern-background-art"
              src={\`${'${import.meta.env.BASE_URL}'}assets/tavern-bg.webp\`}
              alt=""
              aria-hidden="true"
            />
            <img
              className="tavern-bartender-art"
              src={\`${'${import.meta.env.BASE_URL}'}assets/bartender-bg.webp\`}
              alt=""
              aria-hidden="true"
            />`;

if (!source.includes(target)) {
  throw new Error("Tavern scene target not found.");
}

source = source.replace(target, replacement);
fs.writeFileSync(path, source);
console.log("Applied layered tavern background and bartender artwork.");
