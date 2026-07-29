import fs from "node:fs";

const path = new URL("../public/time-wheel/index.html", import.meta.url);
let source = fs.readFileSync(path, "utf8");
const marker = "CRIMSON_TIME_WHEEL_HISTORY_FINAL_LAYOUT";

if (source.includes(marker)) {
  console.log("Time Wheel final history layout already applied.");
  process.exit(0);
}

const styles = `
/* ${marker} */
.history-card {
  position: relative !important;
  display: grid !important;
  grid-template-columns: 48px minmax(0, 1fr) 34px !important;
  align-items: start !important;
  gap: 12px !important;
  min-height: 206px !important;
  padding: 18px 18px 112px !important;
  overflow: hidden !important;
}
.history-card > .icon {
  grid-column: 1 !important;
  grid-row: 1 !important;
  width: 44px !important;
  height: 44px !important;
  margin: 0 !important;
}
.history-card > .info {
  grid-column: 2 !important;
  grid-row: 1 !important;
  min-width: 0 !important;
  padding: 1px 0 0 !important;
}
.history-card > .info .title {
  display: block !important;
  margin: 0 0 7px !important;
  color: #f8f1e8 !important;
  font-size: 16px !important;
  font-weight: 700 !important;
  line-height: 1.45 !important;
  white-space: normal !important;
  overflow: visible !important;
  text-overflow: clip !important;
}
.history-card > .info .topic {
  display: block !important;
  margin: 3px 0 0 !important;
  color: rgba(237,226,216,.64) !important;
  font-size: 12px !important;
  font-weight: 400 !important;
  line-height: 1.5 !important;
}
.history-card > .info .date {
  display: block !important;
  margin-top: 4px !important;
  color: rgba(237,226,216,.54) !important;
  font-size: 11px !important;
  line-height: 1.45 !important;
}
.history-card > .delete {
  grid-column: 3 !important;
  grid-row: 1 !important;
  align-self: start !important;
  justify-self: end !important;
  margin: 0 !important;
  padding: 4px 0 8px 8px !important;
  font-size: 18px !important;
}
.tm-history-tools {
  position: absolute !important;
  left: 18px !important;
  right: 18px !important;
  bottom: 15px !important;
  display: grid !important;
  grid-template-columns: minmax(0, 1fr) minmax(110px, .9fr) minmax(90px, .75fr) !important;
  align-items: end !important;
  gap: 8px !important;
  margin: 0 !important;
  padding: 0 !important;
}
.tm-history-meta {
  min-width: 0 !important;
  display: grid !important;
  gap: 4px !important;
  align-self: center !important;
}
.tm-history-id,
.tm-history-state {
  display: block !important;
  margin: 0 !important;
  overflow: hidden !important;
  color: #bba384 !important;
  font-size: 10px !important;
  line-height: 1.45 !important;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
}
.tm-history-tools button {
  width: 100% !important;
  min-width: 0 !important;
  min-height: 40px !important;
  margin: 0 !important;
  padding: 8px 10px !important;
  border-radius: 12px !important;
  font-size: 11px !important;
  line-height: 1.2 !important;
}
.tm-history-tools [data-locate] { display: none !important; }

@media (max-width: 480px) {
  .history-card {
    grid-template-columns: 46px minmax(0, 1fr) 30px !important;
    gap: 11px !important;
    min-height: 224px !important;
    padding: 17px 16px 126px !important;
  }
  .tm-history-tools {
    left: 16px !important;
    right: 16px !important;
    bottom: 14px !important;
    grid-template-columns: 1fr 1fr !important;
    align-items: stretch !important;
  }
  .tm-history-meta {
    grid-column: 1 / -1 !important;
    display: flex !important;
    flex-wrap: wrap !important;
    justify-content: space-between !important;
    gap: 4px 12px !important;
    padding: 0 2px 3px !important;
  }
  .tm-history-id,
  .tm-history-state {
    max-width: 100% !important;
    white-space: normal !important;
  }
}
`;

const cleanupScript = `
<script>
(() => {
  const cleanup = () => {
    document.querySelectorAll('.tm-history-tools [data-locate]').forEach(button => button.remove());
  };
  const observer = new MutationObserver(cleanup);
  const start = () => {
    cleanup();
    observer.observe(document.getElementById('app') || document.body, { childList: true, subtree: true });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
</script>
`;

if (!source.includes("</style>")) throw new Error("Time Wheel style anchor not found.");
if (!source.includes("</body>")) throw new Error("Time Wheel body anchor not found.");
source = source.replace("</style>", `${styles}\n</style>`);
source = source.replace("</body>", `${cleanupScript}\n</body>`);
fs.writeFileSync(path, source);
console.log("Applied final Time Wheel history card layout and removed locate buttons.");
