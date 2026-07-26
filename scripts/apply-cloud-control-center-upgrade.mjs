import fs from "node:fs";

const componentPath = new URL("../app/CloudCellar.tsx", import.meta.url);
const stylePath = new URL("../app/cloud-cellar.css", import.meta.url);
let source = fs.readFileSync(componentPath, "utf8");
let styles = fs.readFileSync(stylePath, "utf8");

if (source.includes("CRIMSON_CLOUD_CONTROL_CENTER_V2")) process.exit(0);

function replace(before, after) {
  if (!source.includes(before)) {
    throw new Error(`Cloud control center upgrade target not found: ${before.slice(0, 120)}`);
  }
  source = source.replace(before, after);
}

replace(
  'const EDGE_GAP = 14;',
  `const EDGE_GAP = 14;

// CRIMSON_CLOUD_CONTROL_CENTER_V2
function mergeRecordsById(current: CloudRecord[], incoming: CloudRecord[]) {
  const merged = new Map(current.map((item) => [String(item.id ?? ""), item]));
  incoming.forEach((item) => {
    if (item && item.id != null) merged.set(String(item.id), item);
  });
  return Array.from(merged.values());
}

function validApiUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.hostname === "localhost";
  } catch {
    return false;
  }
}`,
);

replace(
  '      const timeWheelHistory = JSON.parse(read(TIME_WHEEL_HISTORY_KEY) || "[]") as CloudRecord[];\n      const timeWheelModules = JSON.parse(read(TIME_WHEEL_MODULES_KEY) || "[]") as CloudRecord[];\n      const response = await fetch(apiUrl, {',
  `      const timeWheelHistory = JSON.parse(read(TIME_WHEEL_HISTORY_KEY) || "[]") as CloudRecord[];
      const timeWheelModules = JSON.parse(read(TIME_WHEEL_MODULES_KEY) || "[]") as CloudRecord[];
      const journalCloudRecords = journal.map((item) => ({
        id: String(item.id),
        createdAt: new Date(Number(item.createdAt || Date.now())).toISOString(),
        kind: "house",
        drinkName: String(item.title || "鏈懡鍚嶇殑蹇冧簨"),
        bartender: "鏃ヨ鏈?,
        guest: "鍥炰俊浜?,
        bartenderLine: String(item.content || ""),
        items: [{ id: "diary", course: "鏃ヨ姝ｆ枃", dimension: "淇′欢", zh: String(item.title || "鏃ヨ"), en: "", ja: "" }],
        note: String(item.reply || ""),
        noteUpdatedAt: item.replyAt ? new Date(Number(item.replyAt)).toISOString() : null,
        journal: { folderId: item.folderId || "", paper: item.paper || "default" },
      }));
      const timeWheelCloudRecords = timeWheelHistory.map((item) => ({
        id: String(item.id),
        createdAt: new Date(Number(item.created_at || Date.now())).toISOString(),
        kind: "house",
        drinkName: String(item.module_name || "鏃跺厜涔嬭疆璁板綍"),
        bartender: "鏃跺厜涔嬭疆",
        guest: String(item.topic || "鏃犱富棰?),
        bartenderLine: String(item.content || ""),
        items: [{ id: "time-wheel", course: "杩愯璁板綍", dimension: "鏃跺厜涔嬭疆", zh: String(item.module_name || "鏃跺厜璁板綍"), en: "", ja: "" }],
        note: String(item.ai_reply || ""),
        noteUpdatedAt: item.ai_reply_at ? new Date(Number(item.ai_reply_at)).toISOString() : null,
        timeWheel: { topic: item.topic || "", sourceId: item.id },
      }));
      const combinedRecords = [...records, ...journalCloudRecords, ...timeWheelCloudRecords];
      const endpoint = apiUrl.trim() || DEFAULT_API_URL;
      if (!validApiUrl(endpoint)) throw new Error("缁熶竴妗ｆ API 鍦板潃鏍煎紡涓嶆纭?);
      const response = await fetch(endpoint, {`,
);

replace(
  '        body: JSON.stringify({ readKey, noteKey, settings: { guest, bartender, journal, journalFolders, timeWheelHistory, timeWheelModules, archiveVersion: 3 }, records }),',
  '        body: JSON.stringify({ readKey, noteKey, settings: { guest, bartender, journal, journalFolders, timeWheelHistory, timeWheelModules, archiveVersion: 4 }, records: combinedRecords }),',
);

replace(
  '      write(API_URL_KEY, apiUrl);',
  '      write(API_URL_KEY, endpoint);\n      setApiUrl(endpoint);',
);

replace(
  '      const records = Array.isArray(result.records) ? result.records : [];\n      const first = records[0] as { guest?: unknown; bartender?: unknown } | undefined;',
  `      const records = Array.isArray(result.records) ? result.records : [];
      const tavernRecords = records.filter((item) => {
        const record = item as Record<string, unknown>;
        return !record.journal && !record.timeWheel && record.module !== "cafe" && !String(record.id || "").startsWith("cafe-");
      });
      const first = tavernRecords[0] as { guest?: unknown; bartender?: unknown } | undefined;`,
);

replace(
  '      write(HISTORY_KEY, JSON.stringify(records));',
  '      write(HISTORY_KEY, JSON.stringify(tavernRecords));',
);

replace(
  '      setMessage(`鍏ㄩ儴妗ｆ宸茬粡鍥炴潵锛?{records.length} 鏉厭銆?{cloudJournal.length} 绡囨棩璁般€?{cloudTimeWheelHistory.length} 鏉℃椂鍏夎褰曘€俙);',
  '      setRecordCount(tavernRecords.length);\n      setMessage(`鍏ㄩ儴妗ｆ宸茬粡鍥炴潵锛?{tavernRecords.length} 鏉厭銆?{cloudJournal.length} 绡囨棩璁般€?{cloudTimeWheelHistory.length} 鏉℃椂鍏夎褰曘€俙);',
);

replace(
  '        if (payload.type !== "crimson-world-full-backup") throw new Error("杩欎笉鏄化鐣屽畬鏁村浠芥枃浠?);\n        write(HISTORY_KEY, JSON.stringify(payload.tavern?.history || []));\n        write(SETTINGS_KEY, JSON.stringify(payload.tavern?.settings || {}));\n        write(JOURNAL_KEY, JSON.stringify(payload.journal?.diaries || []));\n        write(JOURNAL_FOLDER_KEY, JSON.stringify(payload.journal?.folders || []));\n        write(TIME_WHEEL_HISTORY_KEY, JSON.stringify(payload.timeWheel?.history || []));\n        write(TIME_WHEEL_MODULES_KEY, JSON.stringify(payload.timeWheel?.modules || []));',
  `        if (payload.type !== "crimson-world-full-backup") throw new Error("杩欎笉鏄化鐣屽畬鏁村浠芥枃浠?);
        const replaceAll = window.confirm([
          "璇烽€夋嫨瀵煎叆鏂瑰紡锛?,
          "",
          "纭畾锛氳鐩栧綋鍓嶅叏閮ㄦ暟鎹?,
          "鍙栨秷锛氫笌褰撳墠鏁版嵁鍚堝苟",
        ].join("\\n"));
        const incomingTavern = Array.isArray(payload.tavern?.history) ? payload.tavern.history : [];
        const incomingJournal = Array.isArray(payload.journal?.diaries) ? payload.journal.diaries : [];
        const incomingFolders = Array.isArray(payload.journal?.folders) ? payload.journal.folders : [];
        const incomingTimeHistory = Array.isArray(payload.timeWheel?.history) ? payload.timeWheel.history : [];
        const incomingTimeModules = Array.isArray(payload.timeWheel?.modules) ? payload.timeWheel.modules : [];
        const incomingCafe = Array.isArray(payload.cafe?.records) ? payload.cafe.records : [];
        write(HISTORY_KEY, JSON.stringify(replaceAll ? incomingTavern : mergeRecordsById(JSON.parse(read(HISTORY_KEY) || "[]"), incomingTavern)));
        write(SETTINGS_KEY, JSON.stringify({ ...JSON.parse(read(SETTINGS_KEY) || "{}"), ...(payload.tavern?.settings || {}) }));
        write(JOURNAL_KEY, JSON.stringify(replaceAll ? incomingJournal : mergeRecordsById(JSON.parse(read(JOURNAL_KEY) || "[]"), incomingJournal)));
        write(JOURNAL_FOLDER_KEY, JSON.stringify(replaceAll ? incomingFolders : mergeRecordsById(JSON.parse(read(JOURNAL_FOLDER_KEY) || "[]"), incomingFolders)));
        write(TIME_WHEEL_HISTORY_KEY, JSON.stringify(replaceAll ? incomingTimeHistory : mergeRecordsById(JSON.parse(read(TIME_WHEEL_HISTORY_KEY) || "[]"), incomingTimeHistory)));
        write(TIME_WHEEL_MODULES_KEY, JSON.stringify(replaceAll ? incomingTimeModules : mergeRecordsById(JSON.parse(read(TIME_WHEEL_MODULES_KEY) || "[]"), incomingTimeModules)));
        write(CAFE_RECORDS_KEY, JSON.stringify(replaceAll ? incomingCafe : mergeRecordsById(JSON.parse(read(CAFE_RECORDS_KEY) || "[]"), incomingCafe)));`,
);

replace(
  '<div><p>CRIMSON TAVERN ARCHIVE</p><h2>閰掗妗ｆ</h2></div>',
  '<div><p>CRIMSON WORLD CONTROL CENTER</p><h2>缁晫鎺у埗涓績</h2></div>',
);

replace(
  'aria-label="閰掗妗ｆ"',
  'aria-label="缁晫鎺у埗涓績"',
);

replace(
  '<section><h3>馃摝 鍏ㄩ儴椤圭洰</h3><div className="cellar-actions-grid">',
  '<section className="control-center-section"><h3>馃摝 鏁版嵁涓庡洖淇?/h3><p className="cellar-intro">鏈湴澶囦唤涓嶅寘鍚换浣曢挜鍖欙紱鍏ㄩ儴鍚屾浼氭妸涓変釜椤圭洰鍐欏叆鍚屼竴浠戒簯妗ｆ銆?/p><div className="cellar-actions-grid">',
);

replace(
  '<label>缁熶竴妗ｆ API<input value={apiUrl} onChange={(event) => setApiUrl(event.target.value)} onBlur={() => write(API_URL_KEY, apiUrl || DEFAULT_API_URL)} /></label><div className="patron-key"><code>{mask(ownerKey)}</code>{ownerKey ? <button type="button" onClick={copyKey}>澶嶅埗涓婚挜鍖?/button> : null}</div><small>閰掗銆佹棩璁板拰鏃跺厜涔嬭疆浼氬叡鍚屼娇鐢ㄨ繖閲岀殑 API銆佷富閽ュ寵銆佽鍙栭挜鍖欏拰鍥炲閽ュ寵銆?/small>',
  `<label>缁熶竴妗ｆ API<input value={apiUrl} onChange={(event) => setApiUrl(event.target.value)} onBlur={() => { const next = apiUrl.trim() || DEFAULT_API_URL; if (validApiUrl(next)) { write(API_URL_KEY, next); setApiUrl(next); } else { setMessage("API 鍦板潃鏍煎紡涓嶆纭紝宸叉仮澶嶉粯璁ゅ湴鍧€銆?); setApiUrl(DEFAULT_API_URL); write(API_URL_KEY, DEFAULT_API_URL); } }} /></label>
                <div className="advanced-key-list">
                  <div><span>涓婚挜鍖?/span><code>{mask(ownerKey)}</code>{ownerKey ? <button type="button" onClick={copyKey}>澶嶅埗</button> : null}</div>
                  <div><span>璇诲彇閽ュ寵</span><code>{mask(read(READ_KEY))}</code><button type="button" onClick={() => navigator.clipboard.writeText(read(READ_KEY))}>澶嶅埗</button></div>
                  <div><span>鍥炲閽ュ寵</span><code>{mask(read(NOTE_KEY))}</code><button type="button" onClick={() => navigator.clipboard.writeText(read(NOTE_KEY))}>澶嶅埗</button></div>
                </div><small>閰掗銆佹棩璁板拰鏃跺厜涔嬭疆鍏卞悓浣跨敤杩欎竴濂?API 涓庨挜鍖欍€備富閽ュ寵鍙仮澶嶅叏閮ㄦ暟鎹紝璇峰嬁鍏紑銆?/small>`,
);

if (!styles.includes("CRIMSON_CLOUD_CONTROL_CENTER_V2")) {
  styles += `

/* CRIMSON_CLOUD_CONTROL_CENTER_V2 */
.cellar-actions-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.cellar-actions-grid .cellar-secondary{margin-top:0;min-height:46px}.control-center-section{border-top:1px solid rgba(211,163,96,.12)}.cellar-advanced-toggle{width:100%;padding:10px 0;border:0;background:none;color:#e7cfb0;text-align:left;font-weight:750;cursor:pointer}.cellar-advanced{display:grid;gap:12px;padding-top:8px}.cellar-advanced label{display:grid;gap:7px;color:#a9927e;font-size:12px}.advanced-key-list{display:grid;gap:7px}.advanced-key-list>div{display:grid;grid-template-columns:72px minmax(0,1fr) auto;align-items:center;gap:8px;padding:9px 10px;border:1px solid rgba(211,163,96,.12);border-radius:11px;background:rgba(0,0,0,.2)}.advanced-key-list span{color:#9f8875;font-size:11px}.advanced-key-list code{min-width:0;overflow:hidden;text-overflow:ellipsis;color:#dfc29e;font-size:11px}.advanced-key-list button{border:0;background:none;color:#d8a56f;cursor:pointer}.archive-summary div{position:relative;overflow:hidden}.archive-summary div:after{content:"";position:absolute;right:-15px;bottom:-20px;width:52px;height:52px;border-radius:50%;background:rgba(211,163,96,.035)}
@media(max-width:420px){.cellar-actions-grid{grid-template-columns:1fr}.advanced-key-list>div{grid-template-columns:64px minmax(0,1fr) auto}}
`;
}

fs.writeFileSync(componentPath, source);
fs.writeFileSync(stylePath, styles);
console.log("Applied Crimson Cloud Control Center v2 upgrade.");

