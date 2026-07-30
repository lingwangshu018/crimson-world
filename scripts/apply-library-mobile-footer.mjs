import fs from "node:fs";

const componentPath = "github-pages/library.tsx";
const stylePath = "github-pages/library.css";

let source = fs.readFileSync(componentPath, "utf8").replace(/\r\n/g, "\n");
let styles = fs.readFileSync(stylePath, "utf8").replace(/\r\n/g, "\n");

const sidebarBlock = `        <div className="keeper-card">
          <div className="keeper-mini">🐰</div>
          <div><b>兔兔馆长</b><small>Royal Librarian</small></div>
          <p>馆藏整理度：{Math.round((books.filter((book) => book.status === "馆藏").length / books.length) * 100)}%</p>
          <button onClick={() => setRabbitLine("我在呢！有什么书想找，都可以告诉兔兔馆长。")}>与兔兔说话</button>
        </div>

        <a className="return-link" href="./">← 返回绯界</a>
`;

if (source.includes(sidebarBlock)) {
  source = source.replace(sidebarBlock, "");
}

const desktopControls = `          <div>
            {/* CRIMSON_LIBRARY_STUDIO_ENTRY */}
            <a href="./library-studio.html">进入编纂室</a>
            <a href="./">返回绯界</a>
            <a href="https://github.com/lingwangshu018/crimson-world/tree/main/docs/world" target="_blank" rel="noreferrer">馆藏源文件</a>
            <a href="https://github.com/lingwangshu018/crimson-world" target="_blank" rel="noreferrer">编纂仓库</a>
          </div>`;

if (!source.includes("CRIMSON_LIBRARY_STUDIO_ENTRY")) {
  const topbarPattern = /(\s*<header className="library-topbar">\s*<p>[^]*?<\/p>)(?:\s*<div>[^]*?<\/div>)?/;
  if (!topbarPattern.test(source)) throw new Error("Royal Library desktop topbar not found.");
  source = source.replace(topbarPattern, `$1\n${desktopControls}`);
}

const footerAnchor = `        <footer>© 2026 Crimson World · 初代世界编纂者：小宝 · 共同编纂者：律</footer>`;
const mobileFooter = `        <section className="library-mobile-footer">
          <div className="keeper-card">
            <div className="keeper-mini">🐰</div>
            <div><b>兔兔馆长</b><small>Royal Librarian</small></div>
            <p>馆藏整理度：{Math.round((books.filter((book) => book.status === "馆藏").length / books.length) * 100)}%</p>
            <button onClick={() => setRabbitLine("我在呢！有什么书想找，都可以告诉兔兔馆长。")}>与兔兔说话</button>
          </div>
          <a className="return-link" href="./library-studio.html">✦ 进入编纂室</a>
          <a className="return-link" href="./">← 返回绯界</a>
        </section>

${footerAnchor}`;

if (!source.includes('className="library-mobile-footer"')) {
  if (!source.includes(footerAnchor)) throw new Error("Library footer anchor not found.");
  source = source.replace(footerAnchor, mobileFooter);
}

const marker = "/* library-mobile-footer */";
if (!styles.includes(marker)) {
  styles += `\n\n${marker}\n.library-mobile-footer {\n  display: none;\n}\n\n@media (max-width: 760px) {\n  .library-mobile-footer {\n    display: grid;\n    gap: 14px;\n    margin: 18px 0 8px;\n    padding: 18px 16px;\n    border: 1px solid rgba(214, 178, 118, .28);\n    border-radius: 18px;\n    background: linear-gradient(180deg, rgba(42, 25, 49, .96), rgba(20, 12, 25, .98));\n    box-shadow: 0 16px 34px rgba(0, 0, 0, .28);\n  }\n\n  .library-mobile-footer .keeper-card {\n    display: block;\n    margin: 0;\n  }\n\n  .library-mobile-footer .return-link {\n    display: block;\n    margin: 0;\n    padding: 12px 16px;\n    border: 1px solid rgba(214, 178, 118, .38);\n    border-radius: 999px;\n    color: var(--gold-bright);\n    text-align: center;\n    background: rgba(76, 49, 91, .72);\n    box-shadow: inset 0 1px 0 rgba(255, 255, 255, .06);\n  }\n}\n`;
}

fs.writeFileSync(componentPath, source);
fs.writeFileSync(stylePath, styles);
console.log("Kept Royal Library controls available on desktop and mobile.");
