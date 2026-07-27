import type { TravelRecord } from "./travel-types";

const samplePlaces = [
  {
    continent: "晨曦大陆",
    city: "曦庭城",
    location: "晨光湖",
    encounter: ["腓腓"],
    discoveries: ["千年古树", "湖心小岛"],
    food: ["晨光花蜜蛋糕"],
    souvenirs: ["古树书签"],
  },
];

function randomItem<T>(items: readonly T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

export function startTravel(): TravelRecord {
  const place = randomItem(samplePlaces);

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
    memory: "小兔带着好奇出发，在远方留下了一段新的记忆。",
  };
}

export const createTravelRecord = startTravel;
