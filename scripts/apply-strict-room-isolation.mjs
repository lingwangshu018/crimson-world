import fs from "node:fs";

const path = new URL("../app/world-nav.css", import.meta.url);
let css = fs.readFileSync(path, "utf8");
const marker = "/* CRIMSON_STRICT_ROOM_ISOLATION */";

if (css.includes(marker)) {
  console.log("Strict room isolation already applied.");
  process.exit(0);
}

css += `

${marker}
/* Rooms are siblings inside .site-shell. Never render Tavern and another room together. */
.site-shell[data-active-room]:not([data-active-room="tavern"]) > :not(.world-trigger):not(.world-backdrop):not(.world-drawer):not(.world-map-shell):not(.world-active-room) {
  display: none !important;
}

.site-shell[data-active-room="tavern"] > .world-active-room {
  display: none !important;
}

.site-shell[data-active-room]:not([data-active-room="tavern"]) > .world-active-room {
  display: block !important;
  min-height: 100dvh;
  width: 100%;
}

.site-shell[data-active-room]:not([data-active-room="tavern"]) {
  min-height: 100dvh;
}
`;

fs.writeFileSync(path, css);
console.log("Applied strict isolation between Tavern and independent world rooms.");
