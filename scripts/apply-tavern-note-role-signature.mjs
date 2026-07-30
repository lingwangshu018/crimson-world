import fs from "node:fs";

const path = "app/page.tsx";
let source = fs.readFileSync(path, "utf8").replace(/\r\n/g, "\n");

const marker = "CRIMSON_TAVERN_NOTE_ROLE_SIGNATURE_V1";
if (!source.includes(marker)) {
  const metadataAnchor = '              kind: selectedRecord.kind,\n';
  if (!source.includes(metadataAnchor)) {
    throw new Error("Tavern participant metadata anchor not found.");
  }
  source = source.replace(
    metadataAnchor,
    `${metadataAnchor}              bartenderName: selectedRecord.bartender,\n              guestName: selectedRecord.guest,\n              signatureFallback: selectedRecord.bartender,\n              // ${marker}\n`,
  );

  const formatAnchor = '        "【随杯手记固定格式】",';
  if (!source.includes(formatAnchor)) {
    throw new Error("Tavern fixed-format prompt anchor not found.");
  }
  source = source.replace(
    formatAnchor,
    `        "【本杯人物姓名】",\n        \`酒保：\${selectedRecord.bartender}\`,\n        \`客人：\${selectedRecord.guest}\`,\n        "",\n        "正文中必须使用以上姓名，不得擅自改名、使用默认占位称呼，或把酒保与客人的身份写反。",\n        "随杯手记的叙述者与末尾署名，优先使用 metadata.royalLibraryContext.characters 中与本杯情境相符的已启用角色：严格遵循其人设、称呼和语言习惯，并以该角色姓名落款。",\n        \`若读取结果中没有可用角色卡，或无法确定哪位角色负责书写，则由本杯酒保“\${selectedRecord.bartender}”书写并落款；不得自行使用夜阑或其他默认名字。\`,\n        \`本杯客人固定为“\${selectedRecord.guest}”，正文中的称呼、对白与互动必须与此一致。\`,\n        "",\n${formatAnchor}`,
  );

  source = source.replace(
    '        "· {酒馆署名} ·",',
    '        "· {书写角色姓名；无可用角色卡时填写本杯酒保姓名} ·",',
  );

  const rulesAnchor = '        "• 后记控制在一至三段，更像酒保留下的余韵，不得解释或总结剧情。",';
  if (!source.includes(rulesAnchor)) {
    throw new Error("Tavern format rules anchor not found.");
  }
  source = source.replace(
    rulesAnchor,
    `${rulesAnchor}\n        "• 后记与署名必须保持同一书写者视角：有可用角色卡时由角色书写并以角色姓名落款；没有可用角色卡时由本杯酒保书写并以本杯酒保姓名落款。",\n        "• 客人姓名必须使用记录中的本杯客人姓名；酒保姓名必须使用记录中的本杯酒保姓名，二者都不可沿用旧记录或默认值。",`,
  );

  fs.writeFileSync(path, source);
}

console.log("Bound Tavern note narrator, signature, bartender, and guest names to each record.");
