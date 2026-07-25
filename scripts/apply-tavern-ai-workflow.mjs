import fs from "node:fs";

const file = "app/page.tsx";
let source = fs.readFileSync(file, "utf8");
const marker = "tavern-ai-workflow-v1";

if (source.includes(marker)) {
  console.log("Tavern AI workflow already applied.");
  process.exit(0);
}

source = source.replace(
  '  const [pullingVaultNotes, setPullingVaultNotes] = useState(false);',
  '  const [pullingVaultNotes, setPullingVaultNotes] = useState(false);\n  const [pendingVaultNotes, setPendingVaultNotes] = useState(0); // tavern-ai-workflow-v1',
);

const oldSuccessToast = `      showToast(\n        result.truncated\n          ? \`已同步最近 \${result.recordCount || 0} 杯酒；更早档案仍保存在本机。\`\n          : \`已把 \${result.recordCount || 0} 杯酒同步给 AI 档案库。\`,\n      );`;

const newSuccessToast = `      const prompt = [\n        "请读取我的绯界酒馆档案，并继续完成随杯手记。",\n        "",\n        "【模块】绯界酒馆",\n        \`【读取钥匙】\${readKey}\`,\n        \`【回复钥匙】\${noteKey}\`,\n        "",\n        "请读取酒馆档案，结合当前聊天已经加载的角色卡、世界书与近期记忆，选择需要续写的已有酒签。",\n        "完成后，请使用回复钥匙把完整回复写回对应记录的 note 字段。",\n        "请不要修改酒单、删除记录或创建无关记录。",\n      ].join("\\n");\n      try {\n        await navigator.clipboard.writeText(prompt);\n        showToast("档案已准备好，发送指令已经复制。请粘贴给 AI。");\n      } catch {\n        window.prompt("复制下面的内容并发送给 AI：", prompt);\n      }`;

if (!source.includes(oldSuccessToast)) {
  throw new Error("Tavern sync success block not found");
}
source = source.replace(oldSuccessToast, newSuccessToast);

source = source.replace(
  `      if (!options?.silent) {\n        showToast(`,
  `      setPendingVaultNotes(0);\n      if (!options?.silent) {\n        showToast(`,
);

const insertBefore = "  const filteredRecords = useMemo(() => {";
const checker = `  async function checkVaultNotes() {\n    if (!VAULT_KEY_PATTERN.test(vaultOwnerKey) || !records.length) {\n      setPendingVaultNotes(0);\n      return;\n    }\n    try {\n      const response = await fetch(\`\${VAULT_API_URL}?limit=250\`, {\n        method: "GET",\n        headers: {\n          Authorization: \`Bearer \${vaultOwnerKey}\`,\n          Accept: "application/json",\n        },\n      });\n      const result = (await response.json()) as { access?: string; records?: unknown[] };\n      if (!response.ok || result.access !== "owner") return;\n      const localById = new Map(records.map((record) => [record.id, record]));\n      const count = (result.records || [])\n        .map(normalizeImportedRecord)\n        .filter((record): record is TavernRecord => Boolean(record))\n        .filter((record) => {\n          const local = localById.get(record.id);\n          return Boolean(\n            local &&\n              record.note !== local.note &&\n              new Date(record.noteUpdatedAt || 0).getTime() >\n                new Date(local.noteUpdatedAt || 0).getTime(),\n          );\n        }).length;\n      setPendingVaultNotes(count);\n    } catch {\n      // Quiet background check: manual collection remains available.\n    }\n  }\n\n  useEffect(() => {\n    if (!vaultOwnerKey || !records.length) return;\n    const timer = window.setTimeout(() => void checkVaultNotes(), 900);\n    return () => window.clearTimeout(timer);\n  }, [vaultOwnerKey, records.length]);\n\n`;

if (!source.includes(insertBefore)) throw new Error("Tavern records marker not found");
source = source.replace(insertBefore, checker + insertBefore);

const start = source.indexOf('            <div className="ai-vault">');
const end = source.indexOf('            <p className="local-note">', start);
if (start < 0 || end < 0) throw new Error("Tavern AI vault UI block not found");

const newUi = `            <div className="ai-vault">\n              <div className="ai-vault-heading">\n                <span>AI NIGHT NOTE</span>\n                <strong>{pendingVaultNotes ? \`新手记 · \${pendingVaultNotes}\` : "静候回信"}</strong>\n              </div>\n              <h3>把这一晚交给 AI 继续书写</h3>\n              <p>发送时会在后台准备档案与钥匙，并复制完整指令；钥匙不再显示，也无需手动管理。</p>\n              <div className="vault-actions">\n                <button\n                  className="vault-sync-button"\n                  type="button"\n                  onClick={() => void syncVault()}\n                  disabled={!records.length || syncingVault}\n                >\n                  <span>{syncingVault ? "准备中…" : "📨 发送给 AI"}</span>\n                  <small>自动准备档案并复制发送指令</small>\n                </button>\n                <button\n                  className={\`vault-pull-button \${pendingVaultNotes ? "has-new-note" : ""}\`}\n                  type="button"\n                  onClick={() => void pullVaultNotes()}\n                  disabled={!vaultOwnerKey || pullingVaultNotes}\n                >\n                  <span>{pullingVaultNotes ? "收取中…" : pendingVaultNotes ? \`📜 收取新手记（\${pendingVaultNotes}）\` : "📜 收取新手记"}</span>\n                  <small>{pendingVaultNotes ? "酒保发现了新的回信" : "检查并填回对应随杯手记"}</small>\n                </button>\n              </div>\n            </div>\n\n`;

source = source.slice(0, start) + newUi + source.slice(end);
source = source.replace(
  'AI 保存续写后，点击“收取 AI 手记”即可填回网站。本机档案仍是原始版本；更换设备或清理浏览器前，请先导出备份。',
  'AI 写回后，酒馆会自动检查是否有新手记；点击“收取新手记”即可填入对应酒签。更换设备或清理浏览器前，请先导出备份。',
);

fs.writeFileSync(file, source);
console.log("Applied simplified tavern AI workflow.");
