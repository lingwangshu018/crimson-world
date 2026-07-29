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
  grid-template-columns: 48px minmax(0, 1fr) 32px !important;
  grid-template-areas:
    "icon info delete"
    "meta meta meta"
    "actions actions actions" !important;
  align-items: start !important;
  gap: 12px !important;
  min-height: 0 !important;
  padding: 18px !important;
  overflow: hidden !important;
}
.history-card > .icon {
  grid-area: icon !important;
  width: 44px !important;
  height: 44px !important;
  margin: 0 !important;
}
.history-card > .info {
  grid-area: info !important;
  min-width: 0 !important;
  padding: 0 !important;
}
.history-card > .info .title {
  display: block !important;
  margin: 0 0 5px !important;
  color: #f8f1e8 !important;
  font-size: 17px !important;
  font-weight: 700 !important;
  line-height: 1.35 !important;
  white-space: normal !important;
  overflow: visible !important;
  text-overflow: clip !important;
}
.history-card > .info .topic {
  display: block !important;
  margin: 2px 0 0 !important;
  color: rgba(237,226,216,.62) !important;
  font-size: 12px !important;
  font-weight: 400 !important;
  line-height: 1.5 !important;
}
.history-card > .info .date {
  display: block !important;
  margin-top: 3px !important;
  color: rgba(237,226,216,.48) !important;
  font-size: 11px !important;
  line-height: 1.4 !important;
}
.history-card > .delete {
  grid-area: delete !important;
  align-self: start !important;
  justify-self: end !important;
  margin: 0 !important;
  padding: 2px 0 8px 8px !important;
  font-size: 18px !important;
}
.tm-history-tools {
  position: static !important;
  grid-area: actions !important;
  display: grid !important;
  grid-template-columns: 1fr 1fr !important;
  gap: 10px !important;
  width: 100% !important;
  margin: 0 !important;
  padding: 0 !important;
}
.tm-history-meta {
  grid-area: meta !important;
  display: flex !important;
  flex-wrap: wrap !important;
  align-items: center !important;
  justify-content: space-between !important;
  gap: 6px 12px !important;
  min-width: 0 !important;
  margin: 2px 0 0 !important;
  padding: 10px 0 0 !important;
  border-top: 1px solid rgba(216,189,130,.13) !important;
}
.tm-history-id,
.tm-history-state {
  display: block !important;
  margin: 0 !important;
  color: #bba384 !important;
  font-size: 10px !important;
  line-height: 1.4 !important;
  white-space: normal !important;
}
.tm-history-state.replied { color: #f1d9a6 !important; }
.tm-history-state.synced { color: #9fc8a8 !important; }
.tm-history-tools button {
  width: 100% !important;
  min-width: 0 !important;
  min-height: 42px !important;
  margin: 0 !important;
  padding: 9px 12px !important;
  border-radius: 13px !important;
  font-size: 12px !important;
  line-height: 1.2 !important;
}
.tm-history-tools [data-locate] { display: none !important; }

@media (max-width: 480px) {
  .history-card {
    grid-template-columns: 46px minmax(0, 1fr) 30px !important;
    gap: 11px !important;
    padding: 16px !important;
  }
  .history-card > .info .title { font-size: 16px !important; }
  .tm-history-meta { padding-top: 9px !important; }
  .tm-history-tools { gap: 8px !important; }
  .tm-history-tools button { min-height: 40px !important; font-size: 11px !important; }
}
`;

const cleanupScript = `
<script>
(() => {
  const cleanCard = card => {
    card.querySelectorAll('.tm-history-tools [data-locate]').forEach(button => button.remove());
    const tools = card.querySelector('.tm-history-tools');
    const meta = tools && tools.querySelector('.tm-history-meta');
    if (tools && meta && meta.parentElement === tools) card.insertBefore(meta, tools);
  };
  const cleanup = () => document.querySelectorAll('.history-card').forEach(cleanCard);
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
console.log("Rebuilt Time Wheel history cards with clean mobile layout.");