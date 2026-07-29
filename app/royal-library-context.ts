export type RoyalLibraryPosition = "before" | "middle" | "after";

export type RoyalLibraryCharacter = {
  id: string;
  name: string;
  nickname?: string;
  profile: string;
  enabled: boolean;
  updatedAt?: string;
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
  updatedAt?: string;
};

type RoyalLibraryData = {
  version: 1;
  characters?: RoyalLibraryCharacter[];
  worldbooks?: RoyalLibraryWorldbook[];
};

export type RoyalLibraryContextOptions = {
  sourceText?: string;
  characterIds?: string[];
  characterNames?: string[];
  includeAllEnabledCharacters?: boolean;
  maxCharacters?: number;
};

export type RoyalLibraryContextSnapshot = {
  schemaVersion: 1;
  createdAt: string;
  characterIds: string[];
  characterVersions: Record<string, string>;
  worldbookIds: string[];
  worldbookVersions: Record<string, string>;
};

export type RoyalLibraryContext = {
  characters: RoyalLibraryCharacter[];
  worldbooks: RoyalLibraryWorldbook[];
  matchedKeywordWorldbookIds: string[];
  snapshot: RoyalLibraryContextSnapshot;
  text: string;
};

const STORAGE_KEY = "crimson.royal-library.v1";
const CONTEXT_MARKER = "【皇家图书馆自动上下文】";
const DEFAULT_MAX_CHARACTERS = 24_000;
const POSITION_RANK: Record<RoyalLibraryPosition, number> = {
  before: 0,
  middle: 1,
  after: 2,
};

function readLibraryData(): RoyalLibraryData | null {
  if (typeof window === "undefined") return null;
  try {
    const value = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "null");
    return value?.version === 1 ? value : null;
  } catch {
    return null;
  }
}

function normalize(value: string) {
  return value.trim().toLocaleLowerCase("zh-CN");
}

function cleanKeywords(item: RoyalLibraryWorldbook) {
  return (item.keywords || []).map(normalize).filter(Boolean);
}

function matchesKeywords(item: RoyalLibraryWorldbook, sourceText: string) {
  const keywords = cleanKeywords(item);
  if (!keywords.length) return true;
  const haystack = normalize(sourceText);
  return keywords.some((keyword) => haystack.includes(keyword));
}

function worldbookSort(a: RoyalLibraryWorldbook, b: RoyalLibraryWorldbook) {
  return (
    POSITION_RANK[a.position] - POSITION_RANK[b.position] ||
    Math.min(10, Math.max(1, a.order || 5)) - Math.min(10, Math.max(1, b.order || 5)) ||
    a.title.localeCompare(b.title, "zh-CN")
  );
}

function selectCharacters(data: RoyalLibraryData | null, options: RoyalLibraryContextOptions) {
  const enabled = (data?.characters || []).filter(
    (item) => item.enabled && item.id && item.name?.trim() && item.profile?.trim(),
  );
  if (options.includeAllEnabledCharacters !== false && !options.characterIds?.length && !options.characterNames?.length) {
    return enabled;
  }

  const ids = new Set(options.characterIds || []);
  const names = new Set((options.characterNames || []).map(normalize));
  return enabled.filter(
    (item) => ids.has(item.id) || names.has(normalize(item.name)) || Boolean(item.nickname && names.has(normalize(item.nickname))),
  );
}

function formatWorldbookSection(title: string, entries: RoyalLibraryWorldbook[]) {
  if (!entries.length) return "";
  return [
    `### ${title}`,
    ...entries.map((item) => `#### ${item.title}\n${item.content.trim()}`),
  ].join("\n\n");
}

function makeSnapshot(characters: RoyalLibraryCharacter[], worldbooks: RoyalLibraryWorldbook[]): RoyalLibraryContextSnapshot {
  return {
    schemaVersion: 1,
    createdAt: new Date().toISOString(),
    characterIds: characters.map((item) => item.id),
    characterVersions: Object.fromEntries(characters.map((item) => [item.id, item.updatedAt || "unknown"])),
    worldbookIds: worldbooks.map((item) => item.id),
    worldbookVersions: Object.fromEntries(worldbooks.map((item) => [item.id, item.updatedAt || "unknown"])),
  };
}

function limitContextText(text: string, maxCharacters: number) {
  if (text.length <= maxCharacters) return text;
  const suffix = "\n\n【上下文已按长度上限截断】";
  return `${text.slice(0, Math.max(0, maxCharacters - suffix.length)).trimEnd()}${suffix}`;
}

export function readRoyalLibraryContext(options: RoyalLibraryContextOptions | string = {}): RoyalLibraryContext {
  const normalizedOptions: RoyalLibraryContextOptions =
    typeof options === "string" ? { sourceText: options } : options;
  const sourceText = normalizedOptions.sourceText || "";
  const data = readLibraryData();
  const characters = selectCharacters(data, normalizedOptions);
  const characterIds = new Set(characters.map((item) => item.id));
  const enabledWorldbooks = (data?.worldbooks || []).filter(
    (item) => item.enabled && item.id && item.title?.trim() && item.content?.trim(),
  );
  const matchedKeywordWorldbookIds: string[] = [];
  const worldbooks = enabledWorldbooks
    .filter((item) => item.scope === "public" || (item.characterIds || []).some((id) => characterIds.has(id)))
    .filter((item) => {
      const matched = matchesKeywords(item, sourceText);
      if (matched && cleanKeywords(item).length) matchedKeywordWorldbookIds.push(item.id);
      return matched;
    })
    .sort(worldbookSort);
  const snapshot = makeSnapshot(characters, worldbooks);

  if (!characters.length && !worldbooks.length) {
    return { characters, worldbooks, matchedKeywordWorldbookIds, snapshot, text: "" };
  }

  const before = worldbooks.filter((item) => item.position === "before");
  const middle = worldbooks.filter((item) => item.position === "middle");
  const after = worldbooks.filter((item) => item.position === "after");
  const characterText = characters.length
    ? [
        "### 当前角色卡",
        ...characters.map(
          (item) => `#### ${item.name}${item.nickname ? `（常用称呼：${item.nickname}）` : ""}\n${item.profile.trim()}`,
        ),
      ].join("\n\n")
    : "";
  const sections = [
    CONTEXT_MARKER,
    "以下设定由绯界皇家图书馆自动选择并注入。请严格遵守，不要在最终正文中复述本段说明。发生冲突时，角色专属设定优先于公共设定，更具体的设定优先于宽泛设定。",
    formatWorldbookSection("前置世界书", before),
    characterText,
    formatWorldbookSection("关联世界书", middle),
    formatWorldbookSection("后置世界书", after),
  ].filter(Boolean);
  const maxCharacters = Math.max(2_000, normalizedOptions.maxCharacters || DEFAULT_MAX_CHARACTERS);
  const text = limitContextText(sections.join("\n\n"), maxCharacters);

  return { characters, worldbooks, matchedKeywordWorldbookIds, snapshot, text };
}

export function appendRoyalLibraryContext(taskText: string, options: Omit<RoyalLibraryContextOptions, "sourceText"> = {}) {
  if (!taskText || taskText.includes(CONTEXT_MARKER)) return taskText;
  const context = readRoyalLibraryContext({ ...options, sourceText: taskText }).text;
  return context ? `${taskText.trimEnd()}\n\n${context}` : taskText;
}

export function createRoyalLibrarySnapshot(options: RoyalLibraryContextOptions | string = {}) {
  return readRoyalLibraryContext(options).snapshot;
}

function looksLikeCrimsonAiTask(text: string) {
  return (
    text.includes("请读取我的绯界") ||
    (text.includes("记录ID") && (text.includes("读取钥匙") || text.includes("回复钥匙"))) ||
    (text.includes("发送给 AI") && text.includes("绯界"))
  );
}

export function installRoyalLibraryClipboardBridge() {
  if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) return;
  const clipboard = navigator.clipboard as Clipboard & { __crimsonRoyalLibraryBridge?: boolean };
  if (clipboard.__crimsonRoyalLibraryBridge) return;

  const originalWriteText = clipboard.writeText.bind(clipboard);
  clipboard.writeText = (text: string) =>
    originalWriteText(looksLikeCrimsonAiTask(text) ? appendRoyalLibraryContext(text) : text);
  clipboard.__crimsonRoyalLibraryBridge = true;
}
