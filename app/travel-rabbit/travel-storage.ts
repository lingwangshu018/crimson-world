import type { TravelRecord } from "./travel-types";

const STORAGE_KEY = "crimson-world.travel-rabbit.records.v1";

export function readTravelRecords(): TravelRecord[] {
  if (typeof window === "undefined") return [];

  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value ? (JSON.parse(value) as TravelRecord[]) : [];
  } catch {
    return [];
  }
}

export function saveTravelRecord(record: TravelRecord) {
  if (typeof window === "undefined") return;

  const records = readTravelRecords();
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify([record, ...records]),
  );
}

export function createTravelRecord(record: TravelRecord) {
  saveTravelRecord(record);
}

export function exportTravelRecords() {
  return JSON.stringify(readTravelRecords(), null, 2);
}
