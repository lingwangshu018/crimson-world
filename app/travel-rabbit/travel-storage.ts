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

export function writeTravelRecords(records: TravelRecord[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records.slice(0, 500)));
}

export function saveTravelRecord(record: TravelRecord) {
  const records = readTravelRecords();
  writeTravelRecords([record, ...records.filter((item) => item.id !== record.id)]);
}

export function createTravelRecord(record: TravelRecord) {
  saveTravelRecord(record);
}

export function updateTravelRecord(
  recordId: string,
  updater: (record: TravelRecord) => TravelRecord,
): TravelRecord | null {
  const records = readTravelRecords();
  let updated: TravelRecord | null = null;
  const next = records.map((record) => {
    if (record.id !== recordId) return record;
    updated = updater(record);
    return updated;
  });
  if (updated) writeTravelRecords(next);
  return updated;
}

export function exportTravelRecords() {
  return JSON.stringify(readTravelRecords(), null, 2);
}

export function importTravelRecords(records: TravelRecord[]) {
  writeTravelRecords(records);
}
