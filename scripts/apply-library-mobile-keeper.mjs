import fs from "node:fs";

const cssPath = "github-pages/library.css";
let css = fs.readFileSync(cssPath, "utf8").replace(/\r\n/g, "\n");

const marker = "/* CRIMSON_LIBRARY_MOBILE_KEEPER */";
if (css.includes(marker)) {
  console.log("Royal Library mobile keeper controls already applied.");
  process.exit(0);
}

css += `

${marker}
@media (max-width:760px) {
  .library-sidebar {
    padding-bottom: 16px;
  }

  .keeper-card {
    display: grid;
    grid-template-columns: 48px minmax(0, 1fr);
    gap: 10px 12px;
    width: 100%;
    margin: 12px 0 0;
    padding: 13px;
  }

  .keeper-mini {
    float: none;
    width: 48px;
    height: 48px;
    margin: 0;
    grid-row: 1 / span 2;
  }

  .keeper-card > div:not(.keeper-mini) {
    align-self: center;
    min-width: 0;
  }

  .keeper-card p {
    grid-column: 1 / -1;
    margin: 2px 0 0;
    font-size: 11px;
  }

  .keeper-card button {
    grid-column: 1 / -1;
    min-height: 42px;
    font-size: 14px;
  }

  .return-link {
    display: flex;
    position: sticky;
    bottom: 10px;
    z-index: 20;
    min-height: 44px;
    margin: 12px 0 0;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(214,178,118,.38);
    border-radius: 999px;
    color: var(--gold-bright);
    background: rgba(31,18,39,.94);
    box-shadow: 0 10px 28px rgba(0,0,0,.32);
    font-size: 14px;
    backdrop-filter: blur(12px);
  }

  .rabbit-stage {
    visibility: visible;
    opacity: 1;
  }
}
`;

fs.writeFileSync(cssPath, css);
console.log("Fixed Royal Library keeper card and return link on mobile.");
