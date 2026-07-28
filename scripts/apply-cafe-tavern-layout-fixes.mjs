import fs from "node:fs";

const path = "app/CafeRoom.tsx";
let source = fs.readFileSync(path, "utf8");

source = source.replace(
  'button onClick={clearNote} className="danger"',
  'button onClick={() => clearNote(record)} className="danger"',
);

fs.writeFileSync(path, source);
console.log("Applied Cafe Tavern layout interaction fixes.");
