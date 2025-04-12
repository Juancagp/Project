import { Coordinates, Country } from "./types";

export interface Launchsite {
  station_id: string;
  name: string;
  country: Country;
  location: Coordinates;
  date: string; // ISO Date
  content: string;
}
