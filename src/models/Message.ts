export interface Message {
    station_id: string;
    name: string;
    level: "info" | "warn";
    date: string; // ISO Date
    content: string;
  }
  