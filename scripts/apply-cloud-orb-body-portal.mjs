import fs from "node:fs";

const path = new URL("../app/CloudCellar.tsx", import.meta.url);
let source = fs.readFileSync(path, "utf8");
const marker = "CRIMSON_CLOUD_BODY_PORTAL";

if (source.includes(marker)) {
  console.log("Cloud archive orb already renders in the document top layer.");
  process.exit(0);
}

const reactImport = 'import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";';
const returnAnchor = "  if (!position) return null;\n\n  return (";
const closePattern = /    <\/>\r?\n  \);\r?\n}\s*$/;

if (!source.includes(reactImport)) {
  throw new Error("CloudCellar React import anchor was not found.");
}
if (!source.includes(returnAnchor)) {
  throw new Error("CloudCellar render anchor was not found.");
}
if (!closePattern.test(source)) {
  throw new Error("CloudCellar closing render anchor was not found.");
}

source = source.replace(
  reactImport,
  `${reactImport}\nimport { createPortal } from "react-dom";\n// ${marker}`,
);
source = source.replace(returnAnchor, "  if (!position) return null;\n\n  return createPortal(");
source = source.replace(closePattern, "    </>,\n    document.body,\n  );\n}\n");

fs.writeFileSync(path, source);
console.log("Mounted the cloud archive orb in the document body above every room.");
