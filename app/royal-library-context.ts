export type RoyalLibraryPosition = "before" | "middle" | "after";

export type RoyalLibraryCharacter = {
  id: string;
  name: string;
  nickname?: string;
  profile: string;
  enabled: boolean;
};

export type RoyalLibraryWorldbook = {
  id: string;
  title: string;
  content: string;
  keywords?: string[];
  scope: "public" | "character";
  characterIds?: string[];
  position: RoyalLibraryPosition;
  order: number;
  enabled: boolean;
};

type RoyalLibraryData = {
  version: 1;
  characters?: RoyalLibraryCharacter[];
  worldbooks?: RoyalLibraryWorldbook[];
};

export type RoyalLibraryContext = {
  characters: RoyalLibraryCharacter[];
  worldbooks: RoyalLibraryWorldbook[];
  text: string;
};

const STORAGE_KEY = "crimson.royal-library.v1";
const CONTEXT_MARKER = "【皇家图书馆自动上下文】";

function readLibraryData(): RoyalLibraryData | null {
  if (typeof window === "undefined") return null;
  try {
    const value = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "null");
    return value?.version === 1 ? value : null;
  } catch {
    return null;
  }
}

function matchesKeywords(item: RoyalLibraryWorldbook, sourceText: string) {
  const keywords = (item.keywords || []).map((value) => value.trim()).filter(Boolean);
  if (!keywords.length) return true;
  const haystack = sourceText.toLocaleLowerCase("zh-CN");
  return keywords.some((keyword) => haystack.includes(keyword.toLocaleLowerCase("zh-CN")));
}

function worldbookSort(a: RoyalLibraryWorldbook, b: RoyalLibraryWorldbook) {
  const positionRank: Record<RoyalLibraryPosition, number> = { before: 0, middle: 1, after: 2 };
  return positionRank[a.position] - positionRank[b.position] || (a.order || 5) - (b.order || 5) || a.title.localeCompare(b.title, "zh-CN");
}

function formatWorldbookSection(title: string, entries: RoyalLibraryWorldbook[]) {
  if (!entries.length) return "";
  return [`### ${title}`, ...entries.map((item) => `#### ${item.title}\n${item.content.trim()}`)].join("\n\n");
}

export function readRoyalLibraryContext(sourceText = ""): RoyalLibraryContext {
  const data = readLibraryData();
  const characters = (data?.characters || []).filter((item) => item.enabled && item.name?.trim() && item.profile?.trim());
  const characterIds = new Set(characters.map((item) => item.id));
  const worldbooks = (data?.worldbooks || [])
    .filter((item) => item.enabled && item.title?.trim() && item.content?.trim())
    .filter((item) => item.scope === "public" || (item.characterIds || []).some((id) => characterIds.has(id)))
    .filter((item) => matchesKeywords(item, sourceText))
    .sort(worldbookSort);

  if (!characters.length && !worldbooks.length) {
    return { characters, worldbooks, text: "" };
  }

  const before = worldbooks.filter((item) => item.position === "before");
  const middle = worldbooks.filter((item) => item.position === "middle");
  const after = worldbooks.filter((item) => item.position === "after");
  const characterText = characters.length
    ? ["### 当前启用角色", ...characters.map((item) => `#### ${item.name}${item.nickname ? `（常用称呼：${item.nickname}）` : ""}\n${item.profile.trim()}`)].join("\n\n")
    : "";

  const sections = [
    CONTEXT_MARKER,
    "以下内容由绯界皇家图书馆自动注入。创作时必须遵守；发生冲突时，以更具体、更新的角色或世界书设定为准。不要在正文中复述本段说明。",
    formatWorldbookSection("前置世界书", before),
    characterText,
    formatWorldbookSection("关联世界书", middle),
    formatWorldbookSection("后置世界书", after),
  ].filter(Boolean);

  return { characters, worldbooks, text: sections.join("\n\n") };
}

export function appendRoyalLibraryContext(taskText: string) {
  if (!taskText || taskText.includes(CONTEXT_MARKER)) return taskText;
  const context = readRoyalLibraryContext(taskText).text;
  return context ? `${taskText.trimEnd()}\n\n${context}` : taskText;
}

function looksLikeCrimsonAiTask(text: string) {
  return text.includes("请读取我的绯界") || (text.includes("记录ID") && text.includes("读取钥匙"));
}

export function installRoyalLibraryClipboardBridge() {
  if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) return;
  const clipboard = navigator.clipboard as Clipboard & { __crimsonRoyalLibraryBridge?: boolean };
  if (clipboard.__crimsonRoyalLibraryBridge) return;

  const originalWriteText = clipboard.writeText.bind(clipboard);
  clipboard.writeText = (text: string) => originalWriteText(looksLikeCrimsonAiTask(text) ? appendRoyalLibraryContext(text) : text);
  clipboard.__crimsonRoyalLibraryBridge = true;
}
