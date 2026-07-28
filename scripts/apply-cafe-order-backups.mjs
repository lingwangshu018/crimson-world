import fs from "node:fs";

const path = new URL("../app/CafeRoom.tsx", import.meta.url);
let source = fs.readFileSync(path, "utf8");

const hasIntegratedBackups =
  source.includes("function exportRecords()") &&
  source.includes("function importRecords(file: File)") &&
  source.includes("const importRef = useRef<HTMLInputElement>(null)");

if (source.includes("CRIMSON_CAFE_ORDER_BACKUPS") || hasIntegratedBackups) {
  console.log("Cafe order backup tools already integrated in the current CafeRoom.");
  process.exit(0);
}

function replace(before, after) {
  if (!source.includes(before)) throw new Error(`Cafe backup target not found: ${before.slice(0, 90)}`);
  source = source.replace(before, after);
}

replace(
  'import { useEffect, useMemo, useState } from "react";',
  'import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";',
);

replace(
  'const RECORDS_KEY = "crimson-cafe.records.v1";',
  `type CafeBackup = {
  format: "crimson-cafe-orders";
  version: 1;
  exportedAt: string;
  records: CafeRecord[];
  recipes: Recipe[];
};

const RECORDS_KEY = "crimson-cafe.records.v1";`,
);

replace(
  "function toVaultRecord(record: CafeRecord) {",
  `function isCupSize(value: unknown): value is CupSize {
  return value === "espresso" || value === "latte" || value === "grande" || value === "share-pot";
}

function normalizeCafeRecord(value: unknown): CafeRecord | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Partial<CafeRecord>;
  if (!item.id || !item.title || !item.premise || !isCupSize(item.cupSize)) return null;
  return {
    id: String(item.id),
    module: "cafe",
    createdAt: typeof item.createdAt === "string" ? item.createdAt : new Date().toISOString(),
    kind: item.kind === "menu" || item.kind === "random" || item.kind === "daily" ? item.kind : "recipe",
    title: String(item.title),
    category: String(item.category || "私人配方"),
    flavour: String(item.flavour || "温柔 · 微甜 · 治愈"),
    cupSize: item.cupSize,
    premise: String(item.premise),
    mustInclude: String(item.mustInclude || ""),
    avoid: String(item.avoid || ""),
    narrative: String(item.narrative || "第三人称有限视角"),
    note: String(item.note || ""),
    noteUpdatedAt: typeof item.noteUpdatedAt === "string" ? item.noteUpdatedAt : null,
    favorite: item.favorite === true,
  };
}

function normalizeRecipe(value: unknown): Recipe | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Partial<Recipe>;
  if (!item.id || !item.title || !item.premise || !isCupSize(item.cupSize)) return null;
  return {
    id: String(item.id),
    title: String(item.title),
    premise: String(item.premise),
    mustInclude: String(item.mustInclude || ""),
    avoid: String(item.avoid || ""),
    flavour: String(item.flavour || "温柔 · 微甜 · 治愈"),
    cupSize: item.cupSize,
    narrative: String(item.narrative || "第三人称有限视角"),
  };
}

// CRIMSON_CAFE_ORDER_BACKUPS
function toVaultRecord(record: CafeRecord) {`,
);

replace(
  "  const [pulling, setPulling] = useState(false);",
  '  const [pulling, setPulling] = useState(false);\n  const importInputRef = useRef<HTMLInputElement>(null);',
);

replace(
  "  async function syncCafeRecord(record: CafeRecord) {",
  `  function exportAllOrders() {
    const backup: CafeBackup = {
      format: "crimson-cafe-orders",
      version: 1,
      exportedAt: new Date().toISOString(),
      records,
      recipes,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = \`crimson-cafe-orders-\${new Date().toISOString().slice(0, 10)}.json\`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    notify(\`已导出 \${records.length} 张剧场订单和 \${recipes.length} 份私人配方。\`);
  }

  async function importAllOrders(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as unknown;
      const backup = parsed && typeof parsed === "object" ? parsed as Partial<CafeBackup> : null;
      const rawRecords = Array.isArray(parsed) ? parsed : Array.isArray(backup?.records) ? backup.records : [];
      const rawRecipes = Array.isArray(backup?.recipes) ? backup.recipes : [];
      const importedRecords = rawRecords.map(normalizeCafeRecord).filter((item): item is CafeRecord => Boolean(item));
      const importedRecipes = rawRecipes.map(normalizeRecipe).filter((item): item is Recipe => Boolean(item));
      if (!importedRecords.length && !importedRecipes.length) {
        throw new Error("没有找到可导入的咖啡馆订单或配方");
      }

      const recordMap = new Map(records.map((item) => [item.id, item]));
      importedRecords.forEach((item) => recordMap.set(item.id, item));
      const recipeMap = new Map(recipes.map((item) => [item.id, item]));
      importedRecipes.forEach((item) => recipeMap.set(item.id, item));
      const nextRecords = [...recordMap.values()]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 300);
      const nextRecipes = [...recipeMap.values()].slice(0, 100);

      persist(nextRecords);
      setRecipes(nextRecipes);
      localStorage.setItem(RECIPES_KEY, JSON.stringify(nextRecipes));
      if (importedRecords[0]) setActiveId(importedRecords[0].id);
      notify(\`已导入 \${importedRecords.length} 张剧场订单和 \${importedRecipes.length} 份私人配方。\`);
    } catch (error) {
      notify(error instanceof Error ? \`导入失败：\${error.message}\` : "导入失败，请检查备份文件。");
    } finally {
      event.target.value = "";
    }
  }

  async function syncCafeRecord(record: CafeRecord) {`,
);

replace(
  '<button type="button" onClick={pullNotes} disabled={pulling}>{pulling ? "收取中…" : "收取新手记"}</button></div></header>',
  '<button type="button" onClick={pullNotes} disabled={pulling}>{pulling ? "收取中…" : "收取新手记"}</button><button type="button" onClick={exportAllOrders}>导出全部订单</button><button type="button" onClick={() => importInputRef.current?.click()}>导入全部订单</button><input ref={importInputRef} type="file" accept="application/json,.json" hidden onChange={importAllOrders} /></div></header>',
);

fs.writeFileSync(path, source);
console.log("Applied Cafe order import and export tools.");
