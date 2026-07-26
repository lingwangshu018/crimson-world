"use client";

import { useEffect, useMemo, useState } from "react";

type CupSize = "espresso" | "latte" | "grande" | "share-pot";
type CafeRecord = {
  id: string;
  module: "cafe";
  createdAt: string;
  kind: "menu" | "random" | "recipe" | "daily";
  title: string;
  category: string;
  flavour: string;
  cupSize: CupSize;
  premise: string;
  mustInclude: string;
  avoid: string;
  narrative: string;
  note: string;
  noteUpdatedAt: string | null;
  favorite: boolean;
};

type Recipe = {
  id: string;
  title: string;
  premise: string;
  mustInclude: string;
  avoid: string;
  flavour: string;
  cupSize: CupSize;
  narrative: string;
};

const RECORDS_KEY = "crimson-cafe.records.v1";
const RECIPES_KEY = "crimson-cafe.recipes.v1";
const OWNER_KEY = "crimson-tavern.vault-owner-key.v1";
const READ_KEY = "crimson-tavern.vault-read-key.v1";
const REPLY_KEY = "crimson-tavern.vault-note-key.v1";
const API_URL_KEY = "crimson-world.vault-api-url.v1";
const DEFAULT_API_URL = "https://crimson-tavern.boarder-72pound.chatgpt.site/api/vault";
const DEFAULT_RECORDS_API_URL =
  "https://crimson-world.lingwangshu018.workers.dev/api/records";
const KEY_PATTERN = /^ctv1_[A-Za-z0-9_-]{43}$/;

const cupLabels: Record<CupSize, { name: string; hint: string }> = {
  espresso: { name: "Espresso", hint: "鐭墖娈?路 绾?600 瀛? },
  latte: { name: "Latte", hint: "瀹屾暣鏁呬簨 路 绾?1200 瀛? },
  grande: { name: "Grande", hint: "鍏呭垎灞曞紑 路 绾?2500 瀛? },
  "share-pot": { name: "Share Pot", hint: "瓒呴暱绡?路 澶氬箷灞曞紑" },
};

const menu = [
  { title: "涓€璧锋崱鍒颁竴鍙尗", category: "鏃ュ父", flavour: "棣欒崏鎷块搧", premise: "涓や釜浜哄湪鍥炲璺笂鎹″埌涓€鍙尗锛屽苟涓€璧峰喅瀹氬浣曠収椤惧畠銆? },
  { title: "鍑屾櫒涓夌偣鐨勪究鍒╁簵", category: "闄即", flavour: "鐑彲鍙?, premise: "鐫′笉鐫€鐨勪袱涓汉鍦ㄥ噷鏅ㄥ幓浜嗕究鍒╁簵锛屽钩闈欑殑澶滈噷鍙戠敓浜嗕竴娈靛彧灞炰簬褰兼鐨勮皥璇濄€? },
  { title: "鍋滅數鐨勯偅涓櫄涓?, category: "鍚屽眳", flavour: "鐒︾硸鎽╁崱", premise: "瀹朵腑绐佺劧鍋滅數锛屼袱涓汉鍦ㄩ粦鏆椼€佺儧鍏夊拰杩囪繎鐨勮窛绂婚噷搴﹁繃婕暱涓€鏅氥€? },
  { title: "闆ㄥ悗鐨勫浘涔﹂", category: "鏍″洯", flavour: "鎶硅尪鎷块搧", premise: "闆ㄥ仠涔嬪悗锛屼袱涓汉琚暀鍦ㄥ畨闈欑殑鍥句功棣嗛噷锛屽師鏈病鏈夎鍑哄彛鐨勮瘽閫愭笎娴笂鏉ャ€? },
  { title: "閿欒繃鏈彮杞?, category: "鏃呰", flavour: "鍐扮編寮?, premise: "涓や釜浜哄湪闄岀敓鍩庡競閿欒繃鏈彮杞︼紝鍙兘涓€璧峰鎵句复鏃惰惤鑴氬銆? },
  { title: "鍒濋洩鏉ヤ俊", category: "鎭嬬埍", flavour: "鐧藉阀鎷块搧", premise: "鍒濋洩钀戒笅鏃讹紝涓€灏佽繜鍒扮殑淇℃敼鍙樹簡涓や釜浜哄師鏈钩闈欑殑涓€澶┿€? },
  { title: "鐏細璧版暎涔嬪悗", category: "鍙ら", flavour: "妗傝姳鎷块搧", premise: "鐏細浜烘疆涓剰澶栬蛋鏁ｏ紝鍐嶆鎵惧埌褰兼鏃讹紝鎯呯华宸茬粡涓庡嚭鍙戝墠涓嶅悓銆? },
  { title: "榄旀硶澶辩伒鐨勪竴澶?, category: "濂囧够", flavour: "姒涙灉鎽╁崱", premise: "鏌愪汉鐨勮兘鍔涚獊鐒跺け鐏碉紝鍙兘鏆傛椂渚濊禆鍙︿竴涓汉瀹屾垚骞虫棩鏈€鏅€氱殑浜嬫儏銆? },
];

const randomTitles = [
  "琚洶鍦ㄥ悓涓€閮ㄧ數姊噷",
  "閱掓潵鍚庝氦鎹簡韬綋",
  "鍏卞悓鐓ч【涓€鐩嗗揩鏋悗鐨勮姳",
  "鍦ㄦ棫鐩稿唽閲屽彂鐜伴檶鐢熷悎鐓?,
  "绾﹀畾鍙鐪熻瘽鐨勪竴澶?,
  "绐佺劧涓嬭捣澶ч洦鐨勬捣杈?,
  "鍦ㄥ帹鎴块噷鍋氬け璐ョ殑鐢滅偣",
  "璇叆鍙湪鍗堝钀ヤ笟鐨勮溅绔?,
];

function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `cafe-${crypto.randomUUID()}`;
  return `cafe-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createSharedVaultKey() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
  return `ctv1_${window.btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")}`;
}

function ensureSharedVaultKeys() {
  let ownerKey = localStorage.getItem(OWNER_KEY) || "";
  let readKey = localStorage.getItem(READ_KEY) || "";
  let replyKey = localStorage.getItem(REPLY_KEY) || "";

  if (!KEY_PATTERN.test(ownerKey)) ownerKey = createSharedVaultKey();
  if (!KEY_PATTERN.test(readKey) || readKey === ownerKey) {
    readKey = createSharedVaultKey();
  }
  if (!KEY_PATTERN.test(replyKey) || replyKey === ownerKey || replyKey === readKey) {
    replyKey = createSharedVaultKey();
  }

  localStorage.setItem(OWNER_KEY, ownerKey);
  localStorage.setItem(READ_KEY, readKey);
  localStorage.setItem(REPLY_KEY, replyKey);
  return { ownerKey, readKey, replyKey };
}

function getRecordsApiUrl() {
  const configured = localStorage.getItem(API_URL_KEY)?.trim();
  if (!configured) return DEFAULT_RECORDS_API_URL;
  try {
    const url = new URL(configured);
    if (url.pathname.endsWith("/api/records")) return url.toString();
    url.pathname = url.pathname.endsWith("/api/vault")
      ? url.pathname.replace(/\/api\/vault$/, "/api/records")
      : "/api/records";
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return DEFAULT_RECORDS_API_URL;
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function safeParse<T>(raw: string | null, fallback: T): T {
  try {
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function toVaultRecord(record: CafeRecord) {
  return {
    ...record,
    module: "cafe" as const,
  };
}

export default function CafeRoom() {
  const [records, setRecords] = useState<CafeRecord[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [title, setTitle] = useState("");
  const [premise, setPremise] = useState("");
  const [mustInclude, setMustInclude] = useState("");
  const [avoid, setAvoid] = useState("");
  const [flavour, setFlavour] = useState("娓╂煍 路 寰敎 路 娌绘剤");
  const [cupSize, setCupSize] = useState<CupSize>("latte");
  const [narrative, setNarrative] = useState("绗笁浜虹О鏈夐檺瑙嗚锛岄噸瑙嗗姩浣溿€佸璇濄€佸績鐞嗕笌鐜板疄浣欐尝");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [pulling, setPulling] = useState(false);

  useEffect(() => {
    setRecords(safeParse<CafeRecord[]>(localStorage.getItem(RECORDS_KEY), []));
    setRecipes(safeParse<Recipe[]>(localStorage.getItem(RECIPES_KEY), []));
  }, []);

  const today = useMemo(() => menu[new Date().getDate() % menu.length], []);
  const active = records.find((record) => record.id === activeId) || records[0] || null;

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast((current) => (current === message ? "" : current)), 2600);
  }

  function persist(next: CafeRecord[]) {
    setRecords(next);
    localStorage.setItem(RECORDS_KEY, JSON.stringify(next));
  }

  function createRecord(input: Partial<CafeRecord> & Pick<CafeRecord, "title" | "premise">) {
    const record: CafeRecord = {
      id: makeId(),
      module: "cafe",
      createdAt: new Date().toISOString(),
      kind: input.kind || "recipe",
      title: input.title.trim() || "鏈懡鍚嶅皬鍓у満",
      category: input.category || "绉佷汉閰嶆柟",
      flavour: input.flavour || flavour,
      cupSize: input.cupSize || cupSize,
      premise: input.premise.trim(),
      mustInclude: input.mustInclude ?? mustInclude,
      avoid: input.avoid ?? avoid,
      narrative: input.narrative || narrative,
      note: "",
      noteUpdatedAt: null,
      favorite: false,
    };
    persist([record, ...records].slice(0, 300));
    setActiveId(record.id);
    notify("鍜栧暋甯堝凡缁忔帴涓嬭鍗曪紝鍓у満鍗″凡鏀句笂鍚у彴銆?);
    return record;
  }

  function orderMenu(item: (typeof menu)[number], kind: CafeRecord["kind"] = "menu") {
    createRecord({ ...item, kind, mustInclude: "", avoid: "", narrative, cupSize });
  }

  function randomOrder() {
    const randomTitle = randomTitles[Math.floor(Math.random() * randomTitles.length)];
    createRecord({
      title: randomTitle,
      premise: `鍥寸粫鈥?{randomTitle}鈥濆睍寮€涓€绡囩鍚堢幇鏈変汉鐗╁叧绯讳笌涓栫晫璁惧畾鐨勫皬鍓у満銆俙,
      category: "闅忔満鍓у満",
      flavour: ["鐢滆€屽厠鍒?, "瀹夐潤娌绘剤", "杞诲井鎷夋壇", "闆ㄥ鏆ф槯", "杞绘澗娓╂殩"][Math.floor(Math.random() * 5)],
      kind: "random",
    });
  }

  function orderCustom() {
    if (!premise.trim() && !title.trim()) {
      notify("鍏堝憡璇夊挅鍟″笀浠婂ぉ鎯崇湅浠€涔堟晠浜嬨€?");
      return;
    }
    createRecord({ title: title || premise.slice(0, 24), premise: premise || title, kind: "recipe" });
  }

  function saveRecipe() {
    if (!title.trim() && !premise.trim()) {
      notify("閰嶆柟杩樻槸绌虹殑锛屽厛鍐欎竴鐐规晠浜嬭鎯冲惂銆?);
      return;
    }
    const recipe: Recipe = {
      id: makeId(), title: title || premise.slice(0, 24), premise: premise || title,
      mustInclude, avoid, flavour, cupSize, narrative,
    };
    const next = [recipe, ...recipes].slice(0, 100);
    setRecipes(next);
    localStorage.setItem(RECIPES_KEY, JSON.stringify(next));
    notify("绉佷汉閰嶆柟宸茬粡鏀惰繘閰嶆柟鏌溿€?");
  }

  function useRecipe(recipe: Recipe) {
    setTitle(recipe.title); setPremise(recipe.premise); setMustInclude(recipe.mustInclude);
    setAvoid(recipe.avoid); setFlavour(recipe.flavour); setCupSize(recipe.cupSize); setNarrative(recipe.narrative);
    document.querySelector("#cafe-workshop")?.scrollIntoView({ behavior: "smooth" });
  }

  async function syncCafeRecord(record: CafeRecord) {
    const keys = ensureSharedVaultKeys();
    const content = [
      `鏍囬锛?{record.title}`,
      `鏍稿績璁惧畾锛?{record.premise}`,
      `蹇呴』鍑虹幇锛?{record.mustInclude || "鏃犻澶栬姹?}`,
      `閬垮厤鍑虹幇锛?{record.avoid || "鏃犻澶栭檺鍒?}`,
      `鏁呬簨鍛抽亾锛?{record.flavour}`,
      `鏉瀷锛?{cupLabels[record.cupSize].name}锛?{cupLabels[record.cupSize].hint}锛塦,
      `鍙欎簨鍋忓ソ锛?{record.narrative}`,
    ].join("\n");

    const response = await fetch(getRecordsApiUrl(), {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${keys.ownerKey}`,
        "X-Crimson-Key": keys.ownerKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        readKey: keys.readKey,
        replyKey: keys.replyKey,
        records: [
          {
            id: record.id,
            module: "cafe",
            title: record.title,
            summary: record.premise.slice(0, 240),
            content,
            note: record.note || "",
            createdAt: record.createdAt,
            updatedAt: record.noteUpdatedAt || record.createdAt,
            noteUpdatedAt: record.noteUpdatedAt,
            metadata: {
              moduleName: "缁晫鍜栧暋棣?,
              category: record.category,
              flavour: record.flavour,
              cupSize: record.cupSize,
              narrative: record.narrative,
              source: RECORDS_KEY,
            },
          },
        ],
      }),
    });

    const data = (await response.json().catch(() => ({}))) as {
      error?: string;
      syncedIds?: string[];
    };
    if (!response.ok || !data.syncedIds?.includes(record.id)) {
      throw new Error(data.error || `鍚屾澶辫触锛圚TTP ${response.status}锛塦);
    }
    return keys;
  }

  async function sendToAI(record: CafeRecord) {
    setSyncing(true);
    let keys: ReturnType<typeof ensureSharedVaultKeys>;
    try {
      keys = await syncCafeRecord(record);
    } catch (error) {
      notify(
        error instanceof Error
          ? `鍓у満璁板綍娌℃湁鍚屾鎴愬姛锛?{error.message}`
          : "鍓у満璁板綍娌℃湁鍚屾鎴愬姛锛岃绋嶅悗閲嶈瘯銆?,
      );
      return;
    } finally {
      setSyncing(false);
    }
    const { readKey, replyKey } = keys;
    const text = `璇峰畬鎴愭垜鐨勭化鐣屽挅鍟￠灏忓墽鍦鸿鍗曘€俓n\n妯″潡锛氱化鐣屽挅鍟￠\n\n銆愯褰曠紪鍙枫€慭nCF-${String(records.findIndex((item) => item.id === record.id) + 1).padStart(4, "0")}\n\n銆愯褰旾D銆慭n${record.id}\n\n銆愯鍙栭挜鍖欍€慭n${readKey}\n\n銆愬洖澶嶉挜鍖欍€慭n${replyKey}\n\n銆愬唴閮ㄦ紨缁庡崗璁€慭n鍏堣鍙栧苟鐞嗚В褰撳墠浼氳瘽鎴栬繍琛岀幆澧冧腑宸茬粡鍔犺浇鐨勪笘鐣屼功銆佽鑹插崱銆佷汉鐗╄瀹氥€佸叧绯昏瀹氬強杩戞湡璁板繂銆備笘鐣屼功鍐冲畾鏃朵唬銆佸湴鐐广€佽鍒欎笌鑳屾櫙锛涜鑹插崱鍐冲畾鎬ф牸銆佽韩浠姐€佽瑷€涓庤涓洪€昏緫锛涜繎鏈熻蹇嗗喅瀹氬綋鍓嶅叧绯汇€佸凡鏈夌粡鍘嗕笌鍓ф儏杩涘害銆傝鍦ㄤ笉鐮村潖鍘熻瀹氱殑鍓嶆彁涓嬪畬鎴愭紨缁庯紝鐩存帴杈撳嚭姝ｆ枃锛屼笉灞曠ず鍒嗘瀽杩囩▼銆佹彁绀鸿瘝鎴栬瀹氭憳瑕併€俓n\n銆愭湰娆″墽鍦鸿鍗曘€慭n鏍囬锛?{record.title}\n鏍稿績璁惧畾锛?{record.premise}\n蹇呴』鍑虹幇锛?{record.mustInclude || "鏃犻澶栬姹?}\n閬垮厤鍑虹幇锛?{record.avoid || "鏃犻澶栭檺鍒?}\n鏁呬簨鍛抽亾锛?{record.flavour}\n鏉瀷锛?{cupLabels[record.cupSize].name}锛?{cupLabels[record.cupSize].hint}锛塡n鍙欎簨鍋忓ソ锛?{record.narrative}\n\n璇锋牴鎹笘鐣屼功銆佽鑹插崱鍙婅繎鏈熻蹇嗘紨缁庢湰娆″皬鍓у満锛岀洿鎺ヨ緭鍑哄畬鏁存鏂囥€俓n\n鑻ヨ鍙栭挜鍖欏拰鍥炲閽ュ寵鍙敤锛氳璇诲彇杩欎竴鏉¤褰曪紝骞跺湪瀹屾垚鍚庝娇鐢ㄥ洖澶嶉挜鍖欐妸瀹屾暣姝ｆ枃鍐欏洖鏈潯璁板綍鐨?note 瀛楁銆俓n鑻ラ挜鍖欐樉绀衡€滄湭閰嶇疆鈥濓細璇风洿鎺ユ牴鎹笂闈㈢殑瀹屾暣璁㈠崟婕旂粠骞跺湪褰撳墠鑱婂ぉ涓緭鍑烘鏂囥€俓n\n涓嶈淇敼鍘熻褰曪紝涓嶈鍒涘缓鏂拌褰曪紝涓嶈鍥炲鍏朵粬璁板綍锛屽彧澶勭悊杩欎竴鏉°€俙;
    try {
      await navigator.clipboard.writeText(text);
      notify("鍓у満浠诲姟鍗曞凡澶嶅埗锛岃鍙戦€佺粰 AI銆?");
    } catch {
      window.prompt("澶嶅埗杩欎唤鍜栧暋棣嗗墽鍦轰换鍔″崟锛?, text);
    }
  }

  async function syncCafe() {
    if (!records.length || syncing) { notify("鍓у満涔︽灦杩樻槸绌虹殑锛屽厛鐐逛竴鏉晠浜嬨€?"); return; }
    const owner = localStorage.getItem(OWNER_KEY) || "";
    const readKey = localStorage.getItem(READ_KEY) || "";
    const noteKey = localStorage.getItem(REPLY_KEY) || "";
    if (!owner || !readKey || !noteKey) { notify("璇峰厛鍦ㄧ化鐣屾帶鍒朵腑蹇冪敓鎴愪笁鎶婂叡浜挜鍖欍€?"); return; }
    setSyncing(true);
    try {
      const apiUrl = localStorage.getItem(API_URL_KEY) || DEFAULT_API_URL;
      const existingResponse = await fetch(`${apiUrl}?limit=500`, { headers: { Authorization: `Bearer ${owner}`, Accept: "application/json" } });
      const existing = existingResponse.ok ? await existingResponse.json() as { records?: unknown[] } : { records: [] };
      const otherRecords = (existing.records || []).filter((item) => {
        if (!item || typeof item !== "object") return true;
        const cloudRecord = item as { id?: string; module?: string };
        if (cloudRecord.module) return cloudRecord.module !== "cafe";
        return !String(cloudRecord.id || "").startsWith("cafe-");
      });
      const response = await fetch(apiUrl, {
        method: "PUT",
        headers: { Authorization: `Bearer ${owner}`, "Content-Type": "application/json" },
        body: JSON.stringify({ readKey, noteKey, records: [...otherRecords, ...records.map(toVaultRecord)] }),
      });
      if (!response.ok) throw new Error("鍚屾澶辫触");
      notify(`宸叉妸 ${records.length} 寮犲墽鍦哄崱鍚屾鍒扮化鐣屼簯绔€俙);
    } catch { notify("鍜栧暋棣嗘殏鏃舵病鑳借繛涓婁簯绔紝璇风◢鍚庡啀璇曘€?"); }
    finally { setSyncing(false); }
  }

  async function pullNotes() {
    if (pulling) return;
    const owner = localStorage.getItem(OWNER_KEY) || "";
    if (!owner) { notify("璇峰厛鍚屾涓€娆″挅鍟￠璁㈠崟锛屽啀鏀跺彇 AI 鏂版墜璁般€?"); return; }
    setPulling(true);
    try {
      const apiUrl = localStorage.getItem(API_URL_KEY) || DEFAULT_API_URL;
      const response = await fetch(`${apiUrl}?limit=500`, { headers: { Authorization: `Bearer ${owner}`, Accept: "application/json" } });
      const result = await response.json() as { records?: Array<Record<string, unknown>> };
      if (!response.ok) throw new Error("鏀跺彇澶辫触");
      const byId = new Map((result.records || []).map((item) => [String(item.id || ""), item]));
      let count = 0;
      const next = records.map((record) => {
        const cloud = byId.get(record.id);
        if (cloud?.module !== "cafe") return record;
        const cloudNote = typeof cloud.note === "string" ? cloud.note : "";
        const cloudTime = typeof cloud?.noteUpdatedAt === "string" ? cloud.noteUpdatedAt : null;
        if (cloudNote && cloudNote !== record.note && new Date(cloudTime || 0).getTime() >= new Date(record.noteUpdatedAt || 0).getTime()) {
          count += 1; return { ...record, note: cloudNote, noteUpdatedAt: cloudTime };
        }
        return record;
      });
      if (count) persist(next);
      notify(count ? `宸叉敹鍙?${count} 绡?AI 鏂版墜璁帮紝骞舵斁鍥炲搴斿墽鍦哄崱銆俙 : "娌℃湁鍙戠幇姣旀湰鏈烘洿鏂扮殑 AI 鎵嬭銆?");
    } catch { notify("鏂版墜璁版殏鏃舵病鏈夊彇鍥炴潵锛岃绋嶅悗鍐嶈瘯銆?"); }
    finally { setPulling(false); }
  }

  function updateNote(record: CafeRecord, note: string) {
    persist(records.map((item) => item.id === record.id ? { ...item, note, noteUpdatedAt: new Date().toISOString() } : item));
  }

  return (
    <section
      id="cafe"
      className="cafe-room"
      style={{
        backgroundImage:
          'linear-gradient(180deg, rgba(18,7,10,.12), rgba(18,7,10,.28)), url("images/crimson-cafe-background.webp")',
        backgroundPosition: "center top",
        backgroundSize: "cover",
        backgroundAttachment: "fixed",
      }}
    >
      <div className={`cafe-toast ${toast ? "show" : ""}`}>{toast}</div>
      <header className="cafe-hero">
        <div>
          <p>CRIMSON CAF脡 路 NOW SERVING STORIES</p>
          <h2>鐐逛竴鏉挅鍟★紝<br /><em>鐪嬩竴娈靛彧灞炰簬浣犱滑鐨勬晠浜嬨€?/em></h2>
          <span>鍜栧暋棣嗚礋璐ｆ棩甯搞€侀櫔浼翠笌灏忓墽鍦恒€備粖澶╂兂鍠濈偣浠€涔堬紵</span>
        </div>
        <div className="cafe-cup" aria-hidden="true"><i /><b>鈽?/b><small>CAF脡</small></div>
      </header>

      <div className="cafe-dashboard">
        <article className="cafe-daily">
          <p className="cafe-label">TODAY&apos;S RECOMMENDATION 路 浠婃棩鎺ㄨ崘</p>
          <h3>{today.title}</h3><span>{today.flavour} 路 {today.category}</span><p>{today.premise}</p>
          <button type="button" onClick={() => orderMenu(today, "daily")}>鐐逛粖鏃ユ帹鑽?/button>
        </article>
        <article className="cafe-random">
          <p className="cafe-label">BARISTA&apos;S CHOICE 路 闅忔満鍓у満</p>
          <h3>鎶婁粖澶╀氦缁欏挅鍟″笀</h3><p>涓嶇敤濉啓浠讳綍鍐呭锛岄殢鏈烘娊鍙栦竴浠藉彧婕斾竴娆＄殑鏁呬簨璁㈠崟銆?/p>
          <button type="button" onClick={randomOrder}>馃幉 闅忔満鐗硅皟</button>
        </article>
      </div>

      <div className="cafe-menu">
        {menu.map((item) => <button type="button" key={item.title} onClick={() => orderMenu(item)}><small>{item.category}</small><strong>{item.title}</strong><span>{item.flavour}</span></button>)}
      </div>

      <section id="cafe-workshop" className="cafe-workshop">
        <header><p className="cafe-label">STORY RECIPE 路 鍓у満宸ュ潑</p><h3>璋冧竴浠界浜烘晠浜嬮厤鏂?/h3></header>
        <div className="cafe-form">
          <label><span>浠婂ぉ鎯崇湅浠€涔?/span><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="渚嬪锛氬垵闆偅澶╋紝浠栫粓浜庢潵鎺ユ垜" /></label>
          <label className="wide"><span>鏍稿績璁惧畾</span><textarea value={premise} onChange={(e) => setPremise(e.target.value)} placeholder="鎯冲彂鐢熺殑浜嬫儏銆佹晠浜嬭捣鐐瑰拰涓昏鍐茬獊鈥︹€? /></label>
          <label><span>蹇呴』鍑虹幇</span><textarea value={mustInclude} onChange={(e) => setMustInclude(e.target.value)} placeholder="瀵圭櫧銆佸姩浣溿€佸満鏅垨鍏抽敭鎯呰妭" /></label>
          <label><span>涓嶈鍑虹幇</span><textarea value={avoid} onChange={(e) => setAvoid(e.target.value)} placeholder="涓嶅枩娆㈢殑妗ユ銆佽鑹叉垨璧板悜" /></label>
          <label><span>鏁呬簨鍛抽亾</span><input value={flavour} onChange={(e) => setFlavour(e.target.value)} /></label>
          <label><span>鍙欎簨鍋忓ソ</span><input value={narrative} onChange={(e) => setNarrative(e.target.value)} /></label>
        </div>
        <div className="cup-selector">{(Object.keys(cupLabels) as CupSize[]).map((size) => <button type="button" className={cupSize === size ? "active" : ""} key={size} onClick={() => setCupSize(size)}><strong>{cupLabels[size].name}</strong><small>{cupLabels[size].hint}</small></button>)}</div>
        <div className="cafe-form-actions"><button type="button" onClick={saveRecipe}>淇濆瓨閰嶆柟</button><button className="primary" type="button" onClick={orderCustom}>寮€濮嬫紨缁?/button></div>
      </section>

      {recipes.length ? <section className="recipe-shelf"><header><p className="cafe-label">PRIVATE RECIPES 路 绉佷汉閰嶆柟</p><h3>閰嶆柟鏌?/h3></header><div>{recipes.map((recipe) => <button type="button" key={recipe.id} onClick={() => useRecipe(recipe)}><strong>{recipe.title}</strong><span>{recipe.flavour} 路 {cupLabels[recipe.cupSize].name}</span></button>)}</div></section> : null}

      <section className="cafe-library">
        <header><div><p className="cafe-label">THE STORY SHELF 路 鍓у満涔︽灦</p><h3>姣忎竴鏉晠浜嬶紝閮界暀涓嬩竴寮犲墽鍦哄崱銆?/h3></div><div className="cafe-cloud-actions"><button type="button" onClick={syncCafe} disabled={syncing}>{syncing ? "鍚屾涓€? : "鍚屾鍓у満璁㈠崟"}</button><button type="button" onClick={pullNotes} disabled={pulling}>{pulling ? "鏀跺彇涓€? : "鏀跺彇鏂版墜璁?}</button></div></header>
        <div className="cafe-record-grid">
          <div className="cafe-record-list">{records.length ? records.map((record, index) => <button type="button" className={active?.id === record.id ? "active" : ""} key={record.id} onClick={() => setActiveId(record.id)}><small>CF-{String(index + 1).padStart(4, "0")} 路 {formatDate(record.createdAt)}</small><strong>{record.title}</strong><span>{record.flavour} 路 {cupLabels[record.cupSize].name}{record.note ? " 路 宸叉湁鎵嬭" : ""}</span></button>) : <div className="cafe-empty">杩樻病鏈夊墽鍦哄崱銆傚厛鐐逛竴鏉晠浜嬪惂銆?/div>}</div>
          <article className="cafe-record-detail">{active ? <><p className="cafe-label">CURRENT ORDER 路 褰撳墠璁㈠崟</p><h3>{active.title}</h3><span>{active.category} 路 {active.flavour} 路 {cupLabels[active.cupSize].name}</span><p>{active.premise}</p>{active.mustInclude ? <dl><dt>蹇呴』鍑虹幇</dt><dd>{active.mustInclude}</dd></dl> : null}{active.avoid ? <dl><dt>閬垮厤鍑虹幇</dt><dd>{active.avoid}</dd></dl> : null}<div className="cafe-ai-actions"><button type="button" onClick={() => sendToAI(active)}>鍙戦€佺粰 AI</button><button type="button" onClick={() => persist(records.map((item) => item.id === active.id ? { ...item, favorite: !item.favorite } : item))}>{active.favorite ? "鍙栨秷鏀惰棌" : "鏀惰棌鏁呬簨"}</button></div><label className="cafe-note"><span>STORY NOTE 路 鍓у満鎵嬭</span><textarea value={active.note} onChange={(e) => updateNote(active, e.target.value)} placeholder="AI 鐨勫畬鏁村皬鍓у満浼氭敹鍙栧埌杩欓噷锛屼篃鍙互鑷繁缂栬緫鈥︹€? /></label></> : <div className="cafe-empty">閫変腑涓€寮犲墽鍦哄崱鏌ョ湅璁㈠崟銆?/div>}</article>
        </div>
      </section>
    </section>
  );
}
