import fs from "node:fs";

const path = new URL("../public/time-wheel/index.html", import.meta.url);
let source = fs.readFileSync(path, "utf8");

if (source.includes("CRIMSON_TIME_WHEEL_HISTORY_LAYOUT_FIX")) process.exit(0);

const styles = `
/* CRIMSON_TIME_WHEEL_HISTORY_LAYOUT_FIX */
.history-card {
  position: relative !important;
  display: grid !important;
  grid-template-columns: 46px minmax(0, 1fr) auto !important;
  align-items: start !important;
  column-gap: 12px !important;
  min-height: 168px !important;
  padding: 18px 18px 94px !important;
}
.history-card > .icon,
.history-card > .delete {
  flex: none !important;
  margin: 0 !important;
}
.history-card > .info {
  min-width: 0 !important;
  padding: 2px 4px 0 0 !important;
}
.history-card > .info .title {
  display: flex !important;
  flex-wrap: wrap !important;
  align-items: baseline !important;
  gap: 4px 8px !important;
  margin: 0 0 6px !important;
  line-height: 1.4 !important;
  white-space: normal !important;
  overflow: visible !important;
}
.history-card > .info .topic {
  margin: 0 !important;
  color: rgba(237, 226, 216, .62) !important;
  font-size: 12px !important;
  font-weight: 400 !important;
}
.history-card > .info .date {
  line-height: 1.45 !important;
}
.history-card > .delete {
  align-self: start !important;
  padding: 4px 0 4px 10px !important;
}
.tm-history-tools {
  position: absolute !important;
  left: 18px !important;
  right: 18px !important;
  bottom: 14px !important;
  display: grid !important;
  grid-template-columns: minmax(0, 1fr) minmax(108px, .9fr) minmax(84px, .7fr) !important;
  align-items: end !important;
  gap: 8px !important;
}
.tm-history-meta {
  min-width: 0 !important;
  display: grid !important;
  gap: 4px !important;
}
.tm-history-id,
.tm-history-state {
  display: block !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
  line-height: 1.4 !important;
}
.tm-history-tools button {
  width: 100% !important;
  min-height: 38px !important;
  padding: 7px 10px !important;
}
.tm-history-tools [data-locate] {
  display: none !important;
}

@media (max-width: 480px) {
  .history-card {
    grid-template-columns: 44px minmax(0, 1fr) auto !important;
    min-height: 194px !important;
    padding: 17px 16px 118px !important;
  }
  .tm-history-tools {
    left: 16px !important;
    right: 16px !important;
    bottom: 13px !important;
    grid-template-columns: 1fr 1fr !important;
    align-items: stretch !important;
  }
  .tm-history-meta {
    grid-column: 1 / -1 !important;
    padding: 0 2px 3px !important;
  }
  .tm-history-id,
  .tm-history-state {
    white-space: normal !important;
  }
}
`;

if (!source.includes("</style>")) throw new Error("Time Wheel style anchor not found.");
source = source.replace("</style>", `${styles}\n</style>`);
fs.writeFileSync(path, source);
console.log("Tidied Time Wheel history cards and removed the locate action.");
