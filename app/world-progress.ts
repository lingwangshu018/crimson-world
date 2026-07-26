import type { WorldMapNode, WorldUnlockMetric } from "./world-map-data";

export type WorldProgress = Record<WorldUnlockMetric, number>;

const STORAGE_KEYS = {
  cafeStories: "crimson-cafe.records.v1",
  diaries: "lu_shared_diary_v7",
  timeRecords: "crimson-time-wheel.history.v1",
  tavernStories: "crimson-tavern.history.v1",
} as const;

function readArrayLength(key: string) {
  try {
    const value = JSON.parse(window.localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value.length : 0;
  } catch {
    return 0;
  }
}

export function readWorldProgress(): WorldProgress {
  if (typeof window === "undefined") {
    return { cafeStories: 0, diaries: 0, timeRecords: 0, totalMemories: 0 };
  }

  const cafeStories = readArrayLength(STORAGE_KEYS.cafeStories);
  const diaries = readArrayLength(STORAGE_KEYS.diaries);
  const timeRecords = readArrayLength(STORAGE_KEYS.timeRecords);
  const tavernStories = readArrayLength(STORAGE_KEYS.tavernStories);

  return {
    cafeStories,
    diaries,
    timeRecords,
    totalMemories: cafeStories + diaries + timeRecords + tavernStories,
  };
}

export function isWorldNodeUnlocked(node: WorldMapNode, progress: WorldProgress) {
  if (node.kind === "room" || node.kind === "core") return true;
  if (!node.unlock) return true;
  return progress[node.unlock.metric] >= node.unlock.minimum;
}

export function worldUnlockProgress(node: WorldMapNode, progress: WorldProgress) {
  if (!node.unlock) return null;
  return {
    current: Math.min(progress[node.unlock.metric], node.unlock.minimum),
    target: node.unlock.minimum,
    label: node.unlock.label,
  };
}
