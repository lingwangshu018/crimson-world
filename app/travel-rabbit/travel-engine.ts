import type { TravelRecord } from "./travel-types";

/**
 * 旅行小兔的第一层旅行池。
 * 后续会替换为读取 docs/world 自动生成。
 */
const travelPool = [
  {
    continent: "晨曦大陆",
    city: "曦庭城",
    location: "晨光湖",
    encounter: ["腓腓"],
    discoveries: ["千年古树", "湖心小岛"],
    food: ["晨光花蜜蛋糕"],
    souvenirs: ["古树书签"],
  },
  {
    continent: "晨曦大陆",
    city: "曦庭城",
    location: "旧城花街",
    encounter: ["会唱歌的花灵"],
    discoveries: ["百年藤蔓钟", "旧日旅人的留言牌"],
    food: ["晨露果酿"],
    souvenirs: ["花街明信片"],
  },
];

function randomItem<T>(items: readonly T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

export function startTravel(): TravelRecord {
  const place = randomItem(travelPool);

  return {
    id: `TR-${Date.now()}`,
    createdAt: new Date().toISOString(),
    continent: place.continent,
    city: place.city,
    location: place.location,
    encounter: place.encounter,
    discoveries: place.discoveries,
    food: place.food,
    souvenirs: place.souvenirs,
    memory: "小兔推开旅行之门，观察远方的风景，并把新的记忆带回绯界。",
    note: "open_door → look_around → encounter → bring_back_memory",
  };
}

export const createTravelRecord = startTravel;
