import fs from "node:fs";

function replaceRequired(source, search, replacement, label) {
  if (!source.includes(search)) throw new Error(`${label} anchor not found.`);
  return source.replace(search, replacement);
}

function addReactContextImport(source) {
  if (source.includes('from "./royal-library-context"')) return source;
  const reactImport = source.match(/import .*? from "react";\n/);
  if (!reactImport) throw new Error("React import anchor not found.");
  return source.replace(
    reactImport[0],
    `${reactImport[0]}import { readRoyalLibraryContext } from "./royal-library-context";\n`,
  );
}

// Cafe
{
  const path = "app/CafeRoom.tsx";
  let source = fs.readFileSync(path, "utf8").replace(/\r\n/g, "\n");
  const marker = "CRIMSON_CAFE_RECORD_BOUND_CONTEXT_V1";
  if (!source.includes(marker)) {
    source = addReactContextImport(source);
    const anchor = "    const response = await fetch(getRecordsApiUrl(), {";
    const replacement = `    // ${marker}\n    const royalLibraryContext = readRoyalLibraryContext({ sourceText: content });\n${anchor}`;
    source = replaceRequired(source, anchor, replacement, "Cafe context");
    source = replaceRequired(
      source,
      'metadata: { moduleName: "绯界咖啡馆", category: record.category, flavour: record.flavour, cupSize: record.cupSize, source: RECORDS_KEY },',
      'metadata: { moduleName: "绯界咖啡馆", category: record.category, flavour: record.flavour, cupSize: record.cupSize, source: RECORDS_KEY, royalLibraryContext: { schemaVersion: 1, mode: "snapshot", characters: royalLibraryContext.characters, worldbooks: royalLibraryContext.worldbooks, matchedKeywordWorldbookIds: royalLibraryContext.matchedKeywordWorldbookIds, snapshot: royalLibraryContext.snapshot, text: royalLibraryContext.text } },',
      "Cafe metadata",
    );
    source = replaceRequired(
      source,
      "请先调用 crimson_read_record 精确读取这一条订单。结合当前会话中的世界书、角色卡和近期记忆完成完整小剧场。完成后调用 crimson_write_reply",
      "请先调用 crimson_read_record 精确读取这一条订单。读取结果的 metadata.royalLibraryContext 已包含本订单绑定的角色卡、世界书与版本快照，请严格依据这些设定完成完整小剧场。完成后调用 crimson_write_reply",
      "Cafe prompt",
    );
    fs.writeFileSync(path, source);
  }
}

// Travel Rabbit: the active character is the traveler, not the rabbit mascot.
{
  const path = "app/TravelRabbitRoom.tsx";
  let source = fs.readFileSync(path, "utf8").replace(/\r\n/g, "\n");
  const marker = "CRIMSON_TRAVEL_RECORD_BOUND_CONTEXT_V1";
  if (!source.includes(marker)) {
    source = addReactContextImport(source);
    const anchor = "    const now = new Date().toISOString();";
    const replacement = `${anchor}\n    // ${marker}\n    const travelSource = recordContent(current);\n    const royalLibraryContext = readRoyalLibraryContext({ sourceText: travelSource });`;
    source = replaceRequired(source, anchor, replacement, "Travel context");
    source = replaceRequired(
      source,
      '              source: "crimson-world.travel-rabbit.records.v1",\n',
      '              source: "crimson-world.travel-rabbit.records.v1",\n              travelerRole: "active-character",\n              royalLibraryContext: {\n                schemaVersion: 1,\n                mode: "snapshot",\n                characters: royalLibraryContext.characters,\n                worldbooks: royalLibraryContext.worldbooks,\n                matchedKeywordWorldbookIds: royalLibraryContext.matchedKeywordWorldbookIds,\n                snapshot: royalLibraryContext.snapshot,\n                text: royalLibraryContext.text,\n              },\n',
      "Travel metadata",
    );
    source = replaceRequired(
      source,
      '        "结合当前聊天已经加载的角色卡、世界书和近期记忆，把这次旅行写成一封完整的旅行信。信中应自然写到目的地、地点、遇见、发现、品尝与带回的纪念品，并保持绯界设定一致。",',
      '        "读取结果的 metadata.royalLibraryContext 已包含本次旅行绑定的角色卡、世界书与版本快照。旅行者是当前启用的 {{char}}，不是兔兔吉祥物；请以 {{char}} 的身份与口吻，写一封从旅途中寄给 {{user}} 的完整旅行信。信中自然写到目的地、地点、遇见、发现、品尝与带回的纪念品，并严格保持角色与世界设定一致。",',
      "Travel prompt",
    );
    fs.writeFileSync(path, source);
  }
}

// Tavern
{
  const path = "app/page.tsx";
  let source = fs.readFileSync(path, "utf8").replace(/\r\n/g, "\n");
  const marker = "CRIMSON_TAVERN_RECORD_BOUND_CONTEXT_V1";
  if (!source.includes(marker)) {
    source = addReactContextImport(source);
    const anchor = '      const unifiedResponse = await fetch("https://crimson-world.lingwangshu018.workers.dev/api/records", {';
    const replacement = `      // ${marker}\n      const tavernContextSource = [selectedRecord.drinkName, selectedRecord.bartender, selectedRecord.guest, selectedRecord.bartenderLine, ...selectedRecord.items.map((item) => item.zh)].join("\\n");\n      const royalLibraryContext = readRoyalLibraryContext({ sourceText: tavernContextSource });\n${anchor}`;
    source = replaceRequired(source, anchor, replacement, "Tavern context");
    source = replaceRequired(
      source,
      '              kind: selectedRecord.kind,\n',
      '              kind: selectedRecord.kind,\n              royalLibraryContext: {\n                schemaVersion: 1,\n                mode: "snapshot",\n                characters: royalLibraryContext.characters,\n                worldbooks: royalLibraryContext.worldbooks,\n                matchedKeywordWorldbookIds: royalLibraryContext.matchedKeywordWorldbookIds,\n                snapshot: royalLibraryContext.snapshot,\n                text: royalLibraryContext.text,\n              },\n',
      "Tavern metadata",
    );
    source = source.replace(
      /结合当前聊天已经加载的角色卡、世界书和近期记忆[^"\n]*/g,
      "读取结果的 metadata.royalLibraryContext 已包含本杯酒绑定的角色卡、世界书与版本快照，请严格依据这些设定",
    );
    fs.writeFileSync(path, source);
  }
}

// Time Wheel runs inside a same-origin iframe, so it reads the shared Royal Library localStorage directly.
{
  const path = "public/time-wheel/index.html";
  let source = fs.readFileSync(path, "utf8").replace(/\r\n/g, "\n");
  const marker = "CRIMSON_TIME_WHEEL_RECORD_BOUND_CONTEXT_V1";
  if (!source.includes(marker)) {
    const functionAnchor = "  function timeWheelRecord(item) {";
    const helper = `  // ${marker}\n  function readTimeWheelLibraryContext(sourceText) {\n    try {\n      const data = JSON.parse(localStorage.getItem("crimson.royal-library.v1") || "null");\n      const characters = (data && data.version === 1 ? data.characters || [] : []).filter(item => item.enabled && item.id && item.name && item.profile);\n      const characterIds = new Set(characters.map(item => item.id));\n      const haystack = String(sourceText || "").toLocaleLowerCase("zh-CN");\n      const worldbooks = (data && data.version === 1 ? data.worldbooks || [] : []).filter(item => {\n        if (!item.enabled || !item.id || !item.title || !item.content) return false;\n        if (!(item.scope === "public" || (item.characterIds || []).some(id => characterIds.has(id)))) return false;\n        const keywords = (item.keywords || []).map(value => String(value).trim().toLocaleLowerCase("zh-CN")).filter(Boolean);\n        return !keywords.length || keywords.some(keyword => haystack.includes(keyword));\n      });\n      return {\n        schemaVersion: 1,\n        mode: "snapshot",\n        characters,\n        worldbooks,\n        matchedKeywordWorldbookIds: worldbooks.filter(item => (item.keywords || []).length).map(item => item.id),\n        snapshot: {\n          schemaVersion: 1,\n          createdAt: new Date().toISOString(),\n          characterIds: characters.map(item => item.id),\n          characterVersions: Object.fromEntries(characters.map(item => [item.id, item.updatedAt || "unknown"])),\n          worldbookIds: worldbooks.map(item => item.id),\n          worldbookVersions: Object.fromEntries(worldbooks.map(item => [item.id, item.updatedAt || "unknown"])),\n        },\n      };\n    } catch {\n      return { schemaVersion: 1, mode: "snapshot", characters: [], worldbooks: [], matchedKeywordWorldbookIds: [], snapshot: { schemaVersion: 1, createdAt: new Date().toISOString(), characterIds: [], characterVersions: {}, worldbookIds: [], worldbookVersions: {} } };\n    }\n  }\n\n${functionAnchor}`;
    source = replaceRequired(source, functionAnchor, helper, "Time Wheel helper");
    source = replaceRequired(
      source,
      '        source: HISTORY_KEY,\n',
      '        source: HISTORY_KEY,\n        royalLibraryContext: readTimeWheelLibraryContext([item.topic, item.module_name, item.content].filter(Boolean).join("\\n")),\n',
      "Time Wheel metadata",
    );
    source = source.replace(
      '        "结合当前聊天已经加载的角色卡、世界书和近期记忆，继续完成这一事件。",',
      '        "读取结果的 metadata.royalLibraryContext 已包含本次事件绑定的角色卡、世界书与版本快照，请严格依据这些设定继续完成这一事件。",',
    );
    fs.writeFileSync(path, source);
  }
}

console.log("Bound Royal Library context to Tavern, Cafe, Time Wheel, and Travel Rabbit records.");
