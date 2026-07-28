import fs from "node:fs";

const componentPath = "github-pages/library.tsx";
const stylePath = "github-pages/library.css";
let source = fs.readFileSync(componentPath, "utf8").replace(/\r\n/g, "\n");
let styles = fs.readFileSync(stylePath, "utf8").replace(/\r\n/g, "\n");

source = source.replace(
  /\nfunction repoUrl\(path: string\) \{\n  return `https:\/\/github\.com\/lingwangshu018\/crimson-world\/blob\/main\/\$\{path\}`;\n\}\n/,
  "\n",
);

source = source.replace(
  /<a href=\{repoUrl\(selectedBook\.path\)\} target="_blank" rel="noreferrer">进入编纂<\/a>/g,
  "",
);

source = source.replace(
  /<a href=\{repoUrl\(readingBook\.path\)\} target="_blank" rel="noreferrer">进入编纂<\/a>/g,
  "",
);

source = source.replace(
  /<a className="draft-action" href="https:\/\/github\.com\/lingwangshu018\/crimson-world\/tree\/main\/docs\/world" target="_blank" rel="noreferrer">前往编纂室<\/a>/g,
  '<span className="draft-action is-disabled">等待馆藏开放</span>',
);

styles += `

/* CRIMSON_LIBRARY_PUBLIC_READER_ONLY */
.book-actions:has(> button:only-child){justify-content:center}
.library-reader>footer:has(> button:only-child){justify-content:center}
.draft-action.is-disabled{cursor:default;opacity:.62;pointer-events:none}
`;

fs.writeFileSync(componentPath, source);
fs.writeFileSync(stylePath, styles);
console.log("Removed Royal Library editing entrances from the public reader.");
