import fs from "node:fs";

const path = new URL("../app/MixingRitual.tsx", import.meta.url);
let source = fs.readFileSync(path, "utf8");
if (source.includes("CRIMSON_TAVERN_OPENING_PREFERENCE")) process.exit(0);

function replace(before, after) {
  if (!source.includes(before)) {
    throw new Error(`Opening preference target not found: ${before.slice(0, 100)}`);
  }
  source = source.replace(before, after);
}

replace(
  'import "./mixing-ritual.css";',
  'import "./mixing-ritual.css";\nimport { OpeningPreferenceControl } from "./OpeningScene";\n\n// CRIMSON_TAVERN_OPENING_PREFERENCE',
);

const preferenceNote = '<p className="preferences-note">';
replace(
  preferenceNote,
  '<OpeningPreferenceControl />\n\n            <p className="preferences-note">',
);

fs.writeFileSync(path, source);
console.log("Applied opening preference control.");
