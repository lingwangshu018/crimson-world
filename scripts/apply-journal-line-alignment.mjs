import fs from "node:fs";

const componentPath = new URL("../app/JournalRoom.tsx", import.meta.url);
const stylePath = new URL("../app/journal-room.css", import.meta.url);
let component = fs.readFileSync(componentPath, "utf8");
let styles = fs.readFileSync(stylePath, "utf8");

const wrapperMarker = "CRIMSON_JOURNAL_READ_TEXT_WRAPPER";
const styleMarker = "CRIMSON_JOURNAL_TEXT_BASELINE_V2";
const styleBlock = `/* ${styleMarker} */
/* Keep the ruled-paper background fixed; move only the rendered glyphs. */
.journal-read-content {
  position: relative;
  top: auto !important;
}
.journal-read-text {
  position: relative;
  transform: translateY(-15px);
  white-space: pre-wrap;
  line-height: inherit;
}

/* Preserve the editor rhythm without shifting its paper rules. */
.journal-editor textarea {
  padding-top: 3px;
  line-height: 32px;
  background-position: 0 0;
  background-attachment: local;
}
.paper-night .journal-editor textarea {
  background-position: 0 0;
}

/* Reply prose also moves independently from any ruled background. */
.journal-read-sheet aside p {
  position: relative;
  top: auto !important;
  transform: translateY(-10px);
}

@media (max-width: 600px) {
  .journal-read-text {
    transform: translateY(-15px);
  }
  .journal-read-sheet aside p {
    transform: translateY(-10px);
  }
}`;

if (!component.includes(wrapperMarker)) {
  const anchor = '<div className="journal-read-content">{current.content}</div>';
  if (!component.includes(anchor)) {
    throw new Error("Journal read-content anchor not found");
  }

  component = component.replace(
    anchor,
    `<div className="journal-read-content"><div className="journal-read-text">{current.content}</div></div>{/* ${wrapperMarker} */}`,
  );
}

const existingStyleBlock = new RegExp(
  `/\\* ${styleMarker} \\*/[\\s\\S]*?(?=\\n/\\* [A-Z0-9_]+ \\*/|$)`,
);

if (existingStyleBlock.test(styles)) {
  styles = styles.replace(existingStyleBlock, styleBlock);
} else {
  styles += `\n\n${styleBlock}\n`;
}

fs.writeFileSync(componentPath, component);
fs.writeFileSync(stylePath, styles);
console.log("Forced Journal reading text to the corrected ruled-line baseline.");