import fs from "node:fs";

const path = "github-pages/library.tsx";
let source = fs.readFileSync(path, "utf8").replace(/\r\n/g, "\n");
if (source.includes("CRIMSON_LIBRARY_WISH_POOL")) process.exit(0);

function replace(before, after) {
  if (!source.includes(before)) throw new Error(`Wish pool target not found: ${before.slice(0, 100)}`);
  source = source.replace(before, after);
}

replace(
  'import "./library.css";',
  'import "./library.css";\nimport "./wish-pool.css";\nimport { WishPool } from "./WishPool";\n\n// CRIMSON_LIBRARY_WISH_POOL',
);

const wishSection = '  { id: "wishes", name: "许愿池", en: "WISHING POOL", icon: "✧", description: "把问题、愿望和世界提案投进池中，让编纂者与旅人们一起看见。" },';
if (!source.includes(wishSection)) {
  const charactersSection = '  { id: "characters", name: "人物档案", en: "CHARACTERS", icon: "♙", description: "保存人物身份、经历、关系与传闻。" },';
  replace(charactersSection, `${charactersSection}\n${wishSection}`);
}

replace(
  '          <div className="library-grid">',
  '          {active === "wishes" ? <WishPool /> : (\n          <div className="library-grid">',
);

replace(
  '          </div>\n        </section>\n\n        <footer>',
  '          </div>\n          )}\n        </section>\n\n        <footer>',
);

fs.writeFileSync(path, source);
console.log("Wired official Wish Pool into the Royal Library.");
