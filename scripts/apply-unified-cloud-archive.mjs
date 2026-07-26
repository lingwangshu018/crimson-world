import fs from "node:fs";

const path = new URL("../app/CloudCellar.tsx", import.meta.url);
let source = fs.readFileSync(path, "utf8");
if (source.includes("CRIMSON_UNIFIED_CLOUD_ARCHIVE")) process.exit(0);

function replace(before, after) {
  if (!source.includes(before)) throw new Error(`Unified cloud patch target not found: ${before.slice(0, 120)}`);
  source = source.replace(before, after);
}

replace(
  'const API_URL = "https://crimson-tavern.boarder-72pound.chatgpt.site/api/vault";',
  `const DEFAULT_API_URL = "https://crimson-tavern.boarder-72pound.chatgpt.site/api/vault";
const API_URL_KEY = "crimson-world.vault-api-url.v1";
const TIME_WHEEL_HISTORY_KEY = "public_tm_history_v2";
const TIME_WHEEL_MODULES_KEY = "public_tm_modules_v2";
const CAFE_RECORDS_KEY = "crimson-cafe.records.v1";

// CRIMSON_UNIFIED_CLOUD_ARCHIVE`,
);

replace(
  '  const [recordCount, setRecordCount] = useState(0);',
  `  const [recordCount, setRecordCount] = useState(0);
  const [timeWheelCount, setTimeWheelCount] = useState(0);
  const [cafeCount, setCafeCount] = useState(0);
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL);
  const [advancedOpen, setAdvancedOpen] = useState(false);`,
);

replace(
  '    setGuestName(read(GUEST_NAME_KEY) || "瀹汉");',
  `    setGuestName(read(GUEST_NAME_KEY) || "瀹汉");
    setApiUrl(read(API_URL_KEY) || DEFAULT_API_URL);`,
);

replace(
  '      setRecordCount(Array.isArray(history) ? history.length : 0);\n    } catch {}',
  `      setRecordCount(Array.isArray(history) ? history.length : 0);
    } catch {}
    try {
      const timeWheel = JSON.parse(read(TIME_WHEEL_HISTORY_KEY) || "[]");
      setTimeWheelCount(Array.isArray(timeWheel) ? timeWheel.length : 0);
    } catch {}
    try {
      const cafe = JSON.parse(read(CAFE_RECORDS_KEY) || "[]");
      setCafeCount(Array.isArray(cafe) ? cafe.length : 0);
    } catch {}`,
);

replace(
  '      const response = await fetch(API_URL, {',
  `      const timeWheelHistory = JSON.parse(read(TIME_WHEEL_HISTORY_KEY) || "[]") as CloudRecord[];
      const timeWheelModules = JSON.parse(read(TIME_WHEEL_MODULES_KEY) || "[]") as CloudRecord[];
      const cafeRecords = JSON.parse(read(CAFE_RECORDS_KEY) || "[]") as CloudRecord[];
      records.push(...cafeRecords.map((item) => ({ ...item, module: "cafe" })));
      const response = await fetch(apiUrl, {`,
);

replace(
  '        body: JSON.stringify({ readKey, noteKey, settings: { guest, bartender, journal, journalFolders, archiveVersion: 2 }, records }),',
  '        body: JSON.stringify({ readKey, noteKey, settings: { guest, bartender, journal, journalFolders, timeWheelHistory, timeWheelModules, archiveVersion: 3 }, records }),',
);

replace(
  '      setJournalCount(journal.length);\n      setMessage(`浠婃櫄鐨勬晠浜嬩笌鏃ヨ閮芥敹濂戒簡锛?{result.recordCount ?? records.length} 鏉厭锛?{journal.length} 绡囨棩璁般€俙);',
  '      setJournalCount(journal.length);\n      setTimeWheelCount(timeWheelHistory.length);\n      setCafeCount(cafeRecords.length);\n      write(API_URL_KEY, apiUrl);\n      setMessage(`鍏ㄩ儴椤圭洰宸茬粡鍚屾锛?{result.recordCount ?? records.length} 鏉′簯璁板綍锛?{journal.length} 绡囨棩璁帮紝${timeWheelHistory.length} 鏉℃椂鍏夎褰曪紝${cafeRecords.length} 绡囧挅鍟￠鍓у満銆俙);',
);

replace(
  '      const response = await fetch(`${API_URL}?limit=250`, { headers: { Authorization: `Bearer ${key}`, Accept: "application/json" } });',
  '      const response = await fetch(`${apiUrl}?limit=500`, { headers: { Authorization: `Bearer ${key}`, Accept: "application/json" } });',
);

replace(
  '      const cloudJournalFolders = Array.isArray(result.settings?.journalFolders) ? result.settings.journalFolders : [];',
  `      const cloudJournalFolders = Array.isArray(result.settings?.journalFolders) ? result.settings.journalFolders : [];
      const cloudTimeWheelHistory = Array.isArray(result.settings?.timeWheelHistory) ? result.settings.timeWheelHistory : [];
      const cloudTimeWheelModules = Array.isArray(result.settings?.timeWheelModules) ? result.settings.timeWheelModules : [];`,
);

replace(
  '      write(JOURNAL_FOLDER_KEY, JSON.stringify(cloudJournalFolders));',
  `      write(JOURNAL_FOLDER_KEY, JSON.stringify(cloudJournalFolders));
      write(TIME_WHEEL_HISTORY_KEY, JSON.stringify(cloudTimeWheelHistory));
      write(TIME_WHEEL_MODULES_KEY, JSON.stringify(cloudTimeWheelModules));
      const cloudCafeRecords = records.filter((item) => {
        const record = item as Record<string, unknown>;
        return record.module === "cafe" || String(record.id || "").startsWith("cafe-");
      });
      write(CAFE_RECORDS_KEY, JSON.stringify(cloudCafeRecords));
      write(API_URL_KEY, apiUrl);`,
);

replace(
  '      setJournalCount(cloudJournal.length);\n      setMessage(`鈥︹€﹀師鏉ユ槸浣犮€?{records.length} 鏉厭涓?${cloudJournal.length} 绡囨棩璁伴兘鍥炴潵浜嗐€俙);',
  '      setJournalCount(cloudJournal.length);\n      setTimeWheelCount(cloudTimeWheelHistory.length);\n      setCafeCount(cloudCafeRecords.length);\n      setMessage(`鍏ㄩ儴妗ｆ宸茬粡鍥炴潵锛?{records.length} 鏉′簯璁板綍銆?{cloudJournal.length} 绡囨棩璁般€?{cloudTimeWheelHistory.length} 鏉℃椂鍏夎褰曘€?{cloudCafeRecords.length} 绡囧挅鍟￠鍓у満銆俙);',
);

replace(
  '  async function copyKey() {',
  `  function exportAll() {
    const payload = {
      type: "crimson-world-full-backup",
      version: 1,
      exportedAt: new Date().toISOString(),
      tavern: { history: JSON.parse(read(HISTORY_KEY) || "[]"), settings: JSON.parse(read(SETTINGS_KEY) || "{}") },
      journal: { diaries: JSON.parse(read(JOURNAL_KEY) || "[]"), folders: JSON.parse(read(JOURNAL_FOLDER_KEY) || "[]") },
      timeWheel: { history: JSON.parse(read(TIME_WHEEL_HISTORY_KEY) || "[]"), modules: JSON.parse(read(TIME_WHEEL_MODULES_KEY) || "[]") },
      cafe: { records: JSON.parse(read(CAFE_RECORDS_KEY) || "[]") },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = \`crimson-world-backup-${'${new Date().toISOString().slice(0,10)}'}.json\`;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage("缁晫鍏ㄩ儴椤圭洰宸茬粡瀵煎嚭銆傪煋?);
  }

  function importAll() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const payload = JSON.parse(await file.text()) as Record<string, any>;
        if (payload.type !== "crimson-world-full-backup") throw new Error("杩欎笉鏄化鐣屽畬鏁村浠芥枃浠?);
        write(HISTORY_KEY, JSON.stringify(payload.tavern?.history || []));
        write(SETTINGS_KEY, JSON.stringify(payload.tavern?.settings || {}));
        write(JOURNAL_KEY, JSON.stringify(payload.journal?.diaries || []));
        write(JOURNAL_FOLDER_KEY, JSON.stringify(payload.journal?.folders || []));
        write(TIME_WHEEL_HISTORY_KEY, JSON.stringify(payload.timeWheel?.history || []));
        write(TIME_WHEEL_MODULES_KEY, JSON.stringify(payload.timeWheel?.modules || []));
        write(CAFE_RECORDS_KEY, JSON.stringify(payload.cafe?.records || []));
        setMessage("鍏ㄩ儴椤圭洰宸插鍏ワ紝椤甸潰鍗冲皢鍒锋柊銆傗湪");
        window.setTimeout(() => window.location.reload(), 900);
      } catch (error) { setMessage(error instanceof Error ? error.message : "瀵煎叆澶辫触"); }
    };
    input.click();
  }

  async function pullAllReplies() {
    const key = ownerKey || read(OWNER_KEY);
    if (!KEY_PATTERN.test(key)) return setMessage("璇峰厛瀹屾垚涓€娆″叏閮ㄥ悓姝ャ€?);
    setMessage("姝ｅ湪鏀跺彇鎵€鏈夐」鐩殑 AI 鍥炲鈥︹€?);
    try {
      const response = await fetch(\`${'${apiUrl}'}?limit=500\`, { headers: { Authorization: \`Bearer ${'${key}'}\`, Accept: "application/json" } });
      const result = await response.json() as { error?: string; records?: Array<Record<string, any>> };
      if (!response.ok) throw new Error(result.error || "鏀跺彇澶辫触");
      const cloud = new Map((result.records || []).map((item) => [String(item.id), item]));
      const journal = JSON.parse(read(JOURNAL_KEY) || "[]") as Array<Record<string, any>>;
      const timeWheel = JSON.parse(read(TIME_WHEEL_HISTORY_KEY) || "[]") as Array<Record<string, any>>;
      const cafe = JSON.parse(read(CAFE_RECORDS_KEY) || "[]") as Array<Record<string, any>>;
      let count = 0;
      const nextJournal = journal.map((item) => { const remote = cloud.get(String(item.id)); if (remote?.note && remote.note !== item.reply) { count += 1; return { ...item, reply: remote.note, replyAt: remote.noteUpdatedAt ? new Date(remote.noteUpdatedAt).getTime() : Date.now() }; } return item; });
      const nextTimeWheel = timeWheel.map((item) => { const remote = cloud.get(String(item.id)); if (remote?.note && remote.note !== item.ai_reply) { count += 1; return { ...item, ai_reply: remote.note, ai_reply_at: remote.noteUpdatedAt ? new Date(remote.noteUpdatedAt).getTime() : Date.now() }; } return item; });
      const nextCafe = cafe.map((item) => { const remote = cloud.get(String(item.id)); if (remote?.module === "cafe" && remote.note && remote.note !== item.note) { count += 1; return { ...item, note: remote.note, noteUpdatedAt: remote.noteUpdatedAt || new Date().toISOString() }; } return item; });
      write(JOURNAL_KEY, JSON.stringify(nextJournal));
      write(TIME_WHEEL_HISTORY_KEY, JSON.stringify(nextTimeWheel));
      write(CAFE_RECORDS_KEY, JSON.stringify(nextCafe));
      setMessage(count ? \`宸叉敹鍙?${'${count}'} 鏉℃柊鍥炲銆傪煉孿` : "鏆傛椂娌℃湁鏂扮殑 AI 鍥炲銆?);
    } catch (error) { setMessage(error instanceof Error ? error.message : "鏀跺彇澶辫触"); }
  }

  async function copyKey() {`,
);

replace(
  '<div><span>鏃ヨ钘忛〉</span><strong>{journalCount} 绡?/strong></div>\n              <div><span>浜戠鐘舵€?/span>',
  '<div><span>鏃ヨ钘忛〉</span><strong>{journalCount} 绡?/strong></div>\n              <div><span>鏃跺厜璁板綍</span><strong>{timeWheelCount} 鏉?/strong></div>\n              <div><span>鍜栧暋棣嗗墽鍦?/span><strong>{cafeCount} 绡?/strong></div>\n              <div><span>浜戠鐘舵€?/span>',
);

replace(
  '<p className="cellar-intro">閰掗浼氭浛浣犱繚瀛橀厭绛俱€侀殢鏉墜璁般€佹棩璁版鏂囥€佹棩璁板洖淇°€佸垎绫讳笌瀹汉绉板懠銆?/p>',
  '<p className="cellar-intro">缁熶竴淇濆瓨閰掗璁板綍銆佹棩璁般€佹椂鍏変箣杞ā鍧椾笌杩愯鍘嗗彶锛屽苟璁╁悓涓€濂?API 鍜岄挜鍖欒疮閫氭墍鏈夐」鐩€?/p>',
);

replace(
  '{busy === "save" ? "姝ｅ湪灏佸瓨璐︾翱鈥︹€? : ownerKey ? "鏇存柊浜戠妗ｆ" : "浜ょ粰閰掗淇濈"}',
  '{busy === "save" ? "姝ｅ湪鍚屾鍏ㄩ儴椤圭洰鈥︹€? : ownerKey ? "馃攧 鍏ㄩ儴鍚屾" : "鈽?寤虹珛缁晫浜戞。妗?}',
);

replace(
  '            {ownerKey ? <section className="key-section">',
  `            <section><h3>馃摝 鍏ㄩ儴椤圭洰</h3><div className="cellar-actions-grid"><button className="cellar-secondary" type="button" onClick={exportAll}>鈬?瀵煎嚭鍏ㄩ儴</button><button className="cellar-secondary" type="button" onClick={importAll}>鈬?瀵煎叆鍏ㄩ儴</button><button className="cellar-secondary" type="button" disabled={Boolean(busy)} onClick={pullAllReplies}>馃摜 鏀跺彇鍏ㄩ儴 AI 鍥炲</button></div></section>
            <section className="key-section"><button className="cellar-advanced-toggle" type="button" onClick={() => setAdvancedOpen((value) => !value)}>鈿?楂樼骇 路 API 涓庨挜鍖?{advancedOpen ? "鈱? : "鈱?}</button>{advancedOpen ? <div className="cellar-advanced"><label>缁熶竴妗ｆ API<input value={apiUrl} onChange={(event) => setApiUrl(event.target.value)} onBlur={() => write(API_URL_KEY, apiUrl || DEFAULT_API_URL)} /></label><div className="patron-key"><code>{mask(ownerKey)}</code>{ownerKey ? <button type="button" onClick={copyKey}>澶嶅埗涓婚挜鍖?/button> : null}</div><small>閰掗銆佹棩璁板拰鏃跺厜涔嬭疆浼氬叡鍚屼娇鐢ㄨ繖閲岀殑 API銆佷富閽ュ寵銆佽鍙栭挜鍖欏拰鍥炲閽ュ寵銆?/small></div> : null}</section>
            {ownerKey ? <section className="key-section">`,
);

fs.writeFileSync(path, source);
console.log("Applied unified cloud archive across tavern, journal and time wheel.");

