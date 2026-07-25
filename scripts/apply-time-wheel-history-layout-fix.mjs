import fs from "node:fs";

const path = new URL("../public/time-wheel/index.html", import.meta.url);
let source = fs.readFileSync(path, "utf8");

if (source.includes("CRIMSON_TIME_WHEEL_HISTORY_LAYOUT_FIX")) process.exit(0);

const styles = `
/* CRIMSON_TIME_WHEEL_HISTORY_LAYOUT_FIX */
.history-card {
  align-items: flex-start !important;
  padding-bottom: 82px !important;
}
.history-card > .icon,
.history-card > .delete {
  flex: 0 0 auto;
}
.history-card > .info {
  min-width: 0;
  padding-top: 2px;
}
.tm-history-tools {
  left: 16px !important;
  right: 16px !important;
  bottom: 12px !important;
}
@media (max-width: 480px) {
  .history-card {
    padding-bottom: 132px !important;
  }
  .tm-history-tools {
    left: 16px !important;
    right: 16px !important;
    bottom: 12px !important;
    grid-template-columns: 1fr 1fr !important;
  }
  .tm-history-meta {
    grid-column: 1 / -1;
    padding-bottom: 4px;
  }
  .tm-history-id,
  .tm-history-state {
    display: block;
    line-height: 1.45;
  }
}
`;

if (!source.includes("</style>")) throw new Error("Time Wheel style anchor not found.");
source = source.replace("</style>", `${styles}\n</style>`);
fs.writeFileSync(path, source);
console.log("Fixed Time Wheel mobile history date and ID layout.");
