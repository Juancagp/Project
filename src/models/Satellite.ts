import { Coordinates, Organization } from "./types";

export interface Satellite {
  satellite_id: string;
  name: string;
  launchsite_origin: string; // station_id
  launch_date: string; // ISO Date
  position: Coordinates;
  altitude: number;
  mission: string;
  organization: Organization;
  type: "COM" | "SCI" | "NAV" | "SPY";
  orbital_period: number;
  lifespan: number;
  power: number; // radio cobertura en km
  status: "in-orbit" | "launched" | "lost";
}
