import fs from "node:fs";

const path = new URL("../app/journal-room.css", import.meta.url);
let source = fs.readFileSync(path, "utf8");
const marker = "CRIMSON_JOURNAL_LINE_ALIGNMENT";

if (source.includes(marker)) {
  console.log("Journal writing lines are already aligned.");
  process.exit(0);
}

source += `

/* ${marker} */
/* Match the paper rhythm while keeping glyphs visibly above each rule. */
.journal-editor textarea {
  padding-top: 3px;
  line-height: 32px;
  background-position: 0 0;
  background-attachment: local;
}
.paper-night .journal-editor textarea {
  background-position: 0 0;
}

/* Reading view: lift only the text, leaving the ruled-paper background fixed. */
.journal-read-content {
  position: relative;
  top: -4px;
}

/* AI reply text uses the same baseline correction without moving its card. */
.journal-read-sheet aside p {
  position: relative;
  top: -4px;
}

@media (max-width: 600px) {
  .journal-editor textarea {
    padding-top: 3px;
    line-height: 32px;
    background-position: 0 0;
  }
  .journal-read-content,
  .journal-read-sheet aside p {
    top: -4px;
  }
}
`;

fs.writeFileSync(path, source);
console.log("Lifted Journal reading and reply text above ruled paper lines.");
