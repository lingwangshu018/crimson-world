import { readRoyalLibraryContext } from "./royal-library-context";

export type RoyalLibraryTask = {
  characterId?: string;
  keywords?: string[];
  extra?: string;
};

/**
 * 所有互动模块统一调用入口。
 * 后续酒馆、日记、时光之轮、咖啡馆等模块接入这里。
 */
export function buildRoyalLibraryPrompt(task: RoyalLibraryTask = {}) {
  const context = readRoyalLibraryContext({
    characterId: task.characterId,
    keywords: task.keywords || [],
  });

  return [
    "请先参考以下皇家图书馆资料：",
    context,
    task.extra || "",
  ].filter(Boolean).join("\n\n");
}
