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
/* Match the 32px writing rhythm without lifting rules through the glyphs. */
.journal-editor textarea {
  padding-top: 3px;
  line-height: 32px;
  background-position: 0 0;
  background-attachment: local;
}
.paper-night .journal-editor textarea {
  background-position: 0 0;
}
@media (max-width: 600px) {
  .journal-editor textarea {
    padding-top: 3px;
    line-height: 32px;
    background-position: 0 0;
  }
}
`;

fs.writeFileSync(path, source);
console.log("Aligned Journal editor rules below each text baseline.");
