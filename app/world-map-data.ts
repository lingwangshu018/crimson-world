import type { RoomId } from "./room-registry";

export type WorldNodeKind = "core" | "room" | "portal" | "mystery";
export type WorldUnlockMetric = "cafeStories" | "diaries" | "timeRecords" | "totalMemories";

export type WorldUnlockRule = {
  metric: WorldUnlockMetric;
  minimum: number;
  label: string;
};

export type WorldMapNode = {
  id: string;
  kind: WorldNodeKind;
  roomId?: RoomId;
  name: string;
  english: string;
  subtitle: string;
  description: string;
  icon: string;
  position: { x: number; y: number };
  unlock?: WorldUnlockRule;
};

export const worldMapNodes: readonly WorldMapNode[] = [
  {
    id: "wheel",
    kind: "room",
    roomId: "wheel",
    name: "时光之轮",
    english: "THE WHEEL OF TIME",
    subtitle: "过去与未来在此交汇",
    description: "沿时间回望故事、选择与留下的痕迹。",
    icon: "轮",
    position: { x: 50, y: 15 },
  },
  {
    id: "journal",
    kind: "room",
    roomId: "journal",
    name: "日记本",
    english: "PRIVATE JOURNAL",
    subtitle: "每一页心事都有归处",
    description: "收藏日记、回信，以及尚未说完的心事。",
    icon: "书",
    position: { x: 22, y: 46 },
  },
  {
    id: "library",
    kind: "portal",
    name: "皇家图书馆",
    english: "ROYAL LIBRARY",
    subtitle: "兔兔馆长正在书架间等你",
    description: "翻阅世界书，进入编纂室，为绯界续写新的历史。",
    icon: "📚",
    position: { x: 18, y: 20 },
  },
  {
    id: "core",
    kind: "core",
    name: "绯界核心",
    english: "CRIMSON HEART",
    subtitle: "所有故事的交汇点",
    description: "从这里选择方向，走向绯界里亮着灯的房间。",
    icon: "✦",
    position: { x: 50, y: 47 },
  },
  {
    id: "tavern",
    kind: "room",
    roomId: "tavern",
    name: "绯夜酒馆",
    english: "THE CRIMSON TAVERN",
    subtitle: "夜色入杯，故事未眠",
    description: "今夜点单、调酒档案与随杯手记。",
    icon: "杯",
    position: { x: 78, y: 43 },
  },
  {
    id: "cafe",
    kind: "room",
    roomId: "cafe",
    name: "绯昼咖啡馆",
    english: "THE CRIMSON CAFE",
    subtitle: "点一杯只属于你们的故事",
    description: "咖啡、陪伴、私人配方与小剧场。",
    icon: "啡",
    position: { x: 72, y: 72 },
  },
  {
    id: "study",
    kind: "room",
    roomId: "study",
    name: "自习室",
    english: "THE STUDY ROOMS",
    subtitle: "为专注留一盏灯",
    description: "在静谧与柔软之间，选择今晚的书桌。",
    icon: "习",
    position: { x: 31, y: 74 },
  },
  {
    id: "unknown",
    kind: "mystery",
    name: "未知领域",
    english: "THE UNCHARTED",
    subtitle: "雾中似乎有新的灯火",
    description: "当绯界积累足够多的故事，这片区域会逐渐显形。",
    icon: "？",
    position: { x: 91, y: 86 },
    unlock: {
      metric: "totalMemories",
      minimum: 20,
      label: "留下 20 条故事或记忆后显形",
    },
  },
];
