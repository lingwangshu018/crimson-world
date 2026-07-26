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
/* Keep every text baseline sitting directly on the ruled paper line. */
.journal-editor textarea {
  line-height: 32px;
  background-position: 0 -8px;
  background-attachment: local;
}
.paper-night .journal-editor textarea {
  background-position: 0 -8px;
}
@media (max-width: 600px) {
  .journal-editor textarea {
    padding-top: 3px;
    line-height: 32px;
    background-position: 0 -8px;
  }
}
`;

fs.writeFileSync(path, source);
console.log("Aligned Journal editor text baselines with ruled paper lines.");
