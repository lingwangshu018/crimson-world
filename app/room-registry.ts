export type RoomStatus = "ready" | "planned";
export type RoomRenderer = "native" | "cafe" | "journal" | "wheel" | "study" | "travel-rabbit" | "preview";
export type RoomTheme = "tavern" | "daylight" | "paper" | "bronze" | "library" | "travel";

type RoomCapabilities = {
  memory: boolean;
  cloud: boolean;
  timeline: boolean;
};

type RoomMapPosition = {
  x: number;
  y: number;
};

export const roomRegistry = [
  {
    id: "tavern",
    icon: "杯",
    name: "绯夜酒馆",
    english: "THE CRIMSON TAVERN",
    description: "今夜点单、调酒档案与随杯手记",
    status: "ready",
    renderer: "native",
    theme: "tavern",
    map: { x: 50, y: 42 },
    capabilities: { memory: true, cloud: true, timeline: true },
  },
  {
    id: "cafe",
    icon: "啡",
    name: "绯昼咖啡馆",
    english: "THE CRIMSON CAFE",
    description: "点一杯咖啡，看一段只属于你们的故事",
    status: "ready",
    renderer: "cafe",
    theme: "daylight",
    map: { x: 72, y: 66 },
    capabilities: { memory: true, cloud: true, timeline: false },
  },
  {
    id: "journal",
    icon: "书",
    name: "日记本",
    english: "PRIVATE JOURNAL",
    description: "这里收藏着每一天，也收藏未曾说完的心事",
    status: "ready",
    renderer: "journal",
    theme: "paper",
    map: { x: 28, y: 62 },
    capabilities: { memory: true, cloud: true, timeline: true },
  },
  {
    id: "travel-rabbit",
    icon: "🐰",
    name: "旅行小兔",
    english: "THE TRAVEL RABBIT",
    description: "带着好奇出发，把远方的故事带回来",
    status: "ready",
    renderer: "travel-rabbit",
    theme: "travel",
    map: { x: 88, y: 68 },
    capabilities: { memory: true, cloud: true, timeline: true },
  },
  {
    id: "wheel",
    icon: "轮",
    name: "时光之轮",
    english: "THE WHEEL OF TIME",
    description: "沿时间回望故事、选择与留下的痕迹",
    status: "ready",
    renderer: "wheel",
    theme: "bronze",
    map: { x: 50, y: 16 },
    capabilities: { memory: true, cloud: true, timeline: true },
  },
  {
    id: "study",
    icon: "习",
    name: "自习室",
    english: "THE STUDY ROOMS",
    description: "在静谧与柔软之间，选择今晚的书桌",
    status: "ready",
    renderer: "study",
    theme: "library",
    map: { x: 52, y: 82 },
    capabilities: { memory: false, cloud: true, timeline: true },
  },
] as const satisfies readonly {
  id: string;
  icon: string;
  name: string;
  english: string;
  description: string;
  status: RoomStatus;
  renderer: RoomRenderer;
  theme: RoomTheme;
  map: RoomMapPosition;
  capabilities: RoomCapabilities;
}[];

export type RoomDefinition = (typeof roomRegistry)[number];
export type RoomId = RoomDefinition["id"];

export function getRoom(id: RoomId): RoomDefinition {
  return roomRegistry.find((room) => room.id === id) ?? roomRegistry[0];
}

export function getVisibleRooms(): readonly RoomDefinition[] {
  return roomRegistry;
}
