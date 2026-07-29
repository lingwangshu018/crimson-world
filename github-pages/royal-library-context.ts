export type RoyalLibraryContextOptions = {
  characterId?: string;
  keywords?: string[];
};

type Character = {
  id: string;
  name: string;
  nickname?: string;
  profile: string;
  enabled: boolean;
};

type Worldbook = {
  id: string;
  title: string;
  content: string;
  keywords: string[];
  scope: "public" | "character";
  characterIds: string[];
  position: "before" | "middle" | "after";
  order: number;
  enabled: boolean;
};

type LibraryData = {
  version: number;
  characters: Character[];
  worldbooks: Worldbook[];
};

const STORAGE_KEY = "crimson.royal-library.v1";

export function loadRoyalLibrary(): LibraryData {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (value?.version === 1) return value;
  } catch {}

  return { version: 1, characters: [], worldbooks: [] };
}

export function readRoyalLibraryContext(options: RoyalLibraryContextOptions = {}) {
  const library = loadRoyalLibrary();
  const character = library.characters.find(
    (item) => item.id === options.characterId && item.enabled,
  );

  const words = options.keywords || [];

  const books = library.worldbooks
    .filter((book) => {
      if (!book.enabled) return false;
      if (book.scope === "character" && !book.characterIds.includes(options.characterId || "")) {
        return false;
      }
      if (!book.keywords.length || !words.length) return true;
      return book.keywords.some((keyword) => words.includes(keyword));
    })
    .sort((a, b) => {
      const position = { before: 0, middle: 1, after: 2 };
      return position[a.position] - position[b.position] || a.order - b.order;
    });

  return [
    character ? `【角色】\n${character.name}\n${character.profile}` : "",
    ...books.map((book) => `【${book.title}】\n${book.content}`),
  ]
    .filter(Boolean)
    .join("\n\n");
}
