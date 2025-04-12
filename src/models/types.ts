export interface Coordinates {
    lat: number;
    long: number;
  }
  
  export interface Country {
    country_code: string; // largo 2
    name: string;
  }
  
  export interface Organization {
    name: string;
    country: Country;
  }
  