export type TravelStep =
  | "open_door"
  | "look_around"
  | "encounter"
  | "bring_back_memory"
  | "send_postcard";

export type TravelRecord = {
  id: string;
  createdAt: string;
  continent: string;
  country?: string;
  city: string;
  location: string;
  encounter: string[];
  discoveries: string[];
  food: string[];
  souvenirs: string[];
  memory: string;
  note?: string;
};
