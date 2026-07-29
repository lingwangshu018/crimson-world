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
  display: block !important;
  min-height: 0 !important;
  margin-bottom: 16px !important;
  padding: 0 !important;
  overflow: hidden !important;
  border-radius: 22px !important;
}
.history-card > .icon,
.history-card > .info,
.history-card > .delete,
.history-card > .tm-history-tools {
  display: none !important;
}
.tw-history-card-v3 {
  display: grid;
  gap: 15px;
  padding: 19px 18px 17px;
}
.tw-history-card-v3__top {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
  gap: 14px;
}
.tw-history-card-v3__heading {
  min-width: 0;
}
.tw-history-card-v3__eyebrow {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 7px 10px;
  margin-bottom: 9px;
}
.tw-history-card-v3__status {
  display: inline-flex;
  align-items: center;
  min-height: 25px;
  padding: 4px 9px;
  border: 1px solid rgba(216,189,130,.22);
  border-radius: 999px;
  color: #d8bd82;
  background: rgba(216,189,130,.07);
  font-size: 10px;
  line-height: 1;
}
.tw-history-card-v3__id {
  color: rgba(237,226,216,.45);
  font-size: 10px;
  letter-spacing: .08em;
}
.tw-history-card-v3__title {
  margin: 0;
  color: #f8f1e8;
  font-family: Georgia, "Songti SC", serif;
  font-size: 21px;
  font-weight: 700;
  line-height: 1.35;
  letter-spacing: .03em;
}
.tw-history-card-v3__topic {
  margin: 7px 0 0;
  color: rgba(237,226,216,.68);
  font-size: 13px;
  line-height: 1.55;
  word-break: break-word;
}
.tw-history-card-v3__date {
  margin: 6px 0 0;
  color: rgba(237,226,216,.42);
  font-size: 11px;
  line-height: 1.4;
}
.tw-history-card-v3__delete {
  display: grid;
  width: 36px;
  height: 36px;
  padding: 0;
  place-items: center;
  border: 1px solid rgba(231,161,170,.18);
  border-radius: 50%;
  color: #e7a1aa;
  background: rgba(231,161,170,.055);
  font-size: 16px;
}
.tw-history-card-v3__divider {
  height: 1px;
  background: linear-gradient(90deg, rgba(216,189,130,.22), rgba(216,189,130,.05));
}
.tw-history-card-v3__actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 9px;
}
.tw-history-card-v3__actions button {
  min-width: 0;
  min-height: 43px;
  margin: 0;
  padding: 9px 12px;
  border: 1px solid rgba(216,189,130,.2);
  border-radius: 13px;
  color: rgba(248,241,232,.82);
  background: rgba(255,255,255,.035);
  font-size: 12px;
  font-weight: 700;
}
.tw-history-card-v3__actions button:first-child {
  border-color: rgba(159,184,216,.34);
  color: #eef5ff;
  background: linear-gradient(135deg, rgba(91,119,154,.86), rgba(67,90,122,.88));
  box-shadow: 0 8px 20px rgba(38,57,82,.24);
}
@media (max-width: 430px) {
  .tw-history-card-v3 { padding: 17px 16px 15px; }
  .tw-history-card-v3__title { font-size: 19px; }
  .tw-history-card-v3__actions { grid-template-columns: 1fr 1fr; }
}
`;

const rebuildScript = `
<script>
(() => {
  const cleanText = value => String(value || "").replace(/\\s+/g, " ").trim();

  function proxyButton(sourceButton, label, className) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className || "";
    button.textContent = label;
    button.addEventListener("click", event => {
      event.stopPropagation();
      sourceButton?.click();
    });
    return button;
  }

  function rebuildCard(card) {
    const info = card.querySelector(":scope > .info");
    const titleElement = info?.querySelector(".title");
    const topicElement = info?.querySelector(".topic");
    const dateElement = info?.querySelector(".date");
    const tools = card.querySelector(":scope > .tm-history-tools");
    const sendButton = tools?.querySelector("[data-send]");
    const copyButton = tools?.querySelector("[data-copy]");
    const stateElement = tools?.querySelector(".tm-history-state");
    const idElement = tools?.querySelector(".tm-history-id");
    const deleteButton = card.querySelector(":scope > .delete");

    if (!info || !titleElement || !tools || !sendButton || !copyButton) return;

    let shell = card.querySelector(":scope > .tw-history-card-v3");
    if (shell) shell.remove();

    shell = document.createElement("div");
    shell.className = "tw-history-card-v3";

    const top = document.createElement("div");
    top.className = "tw-history-card-v3__top";

    const heading = document.createElement("div");
    heading.className = "tw-history-card-v3__heading";

    const eyebrow = document.createElement("div");
    eyebrow.className = "tw-history-card-v3__eyebrow";

    const status = document.createElement("span");
    status.className = "tw-history-card-v3__status";
    status.textContent = cleanText(stateElement?.textContent) || "○ 仅本地";

    const id = document.createElement("span");
    id.className = "tw-history-card-v3__id";
    id.textContent = cleanText(idElement?.textContent);

    const title = document.createElement("h3");
    title.className = "tw-history-card-v3__title";
    const fullTitle = cleanText(titleElement.textContent);
    const topicText = cleanText(topicElement?.textContent);
    title.textContent = topicText && fullTitle.endsWith(topicText)
      ? fullTitle.slice(0, -topicText.length).trim()
      : fullTitle;

    eyebrow.append(status, id);
    heading.append(eyebrow, title);

    if (topicText && topicText !== "无主题") {
      const topic = document.createElement("p");
      topic.className = "tw-history-card-v3__topic";
      topic.textContent = topicText;
      heading.appendChild(topic);
    }

    const dateText = cleanText(dateElement?.textContent);
    if (dateText) {
      const date = document.createElement("p");
      date.className = "tw-history-card-v3__date";
      date.textContent = dateText;
      heading.appendChild(date);
    }

    const deleteProxy = proxyButton(deleteButton, "⌫", "tw-history-card-v3__delete");
    deleteProxy.setAttribute("aria-label", "删除记录");
    top.append(heading, deleteProxy);

    const divider = document.createElement("div");
    divider.className = "tw-history-card-v3__divider";

    const actions = document.createElement("div");
    actions.className = "tw-history-card-v3__actions";
    actions.append(
      proxyButton(sendButton, "发送给 AI"),
      proxyButton(copyButton, "复制 ID"),
    );

    shell.append(top, divider, actions);
    shell.addEventListener("click", event => {
      if (event.target.closest("button")) return;
      card.click();
    });
    card.appendChild(shell);

    card.querySelectorAll("[data-locate]").forEach(button => button.remove());
  }

  function rebuildAll() {
    document.querySelectorAll(".history-card").forEach(rebuildCard);
  }

  let queued = false;
  const schedule = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      rebuildAll();
    });
  };

  const observer = new MutationObserver(schedule);
  const start = () => {
    rebuildAll();
    observer.observe(document.getElementById("app") || document.body, { childList: true, subtree: true, characterData: true });
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
</script>
`;

if (!source.includes("</style>")) throw new Error("Time Wheel style anchor not found.");
if (!source.includes("</body>")) throw new Error("Time Wheel body anchor not found.");
source = source.replace("</style>", `${styles}\n</style>`);
source = source.replace("</body>", `${rebuildScript}\n</body>`);
fs.writeFileSync(path, source);
console.log("Rebuilt Time Wheel history cards with a clean two-action layout.");
