export interface TransportTime {
  mode: "tube" | "bus" | "bike" | "walk";
  duration: string;
  station?: string;
}

export interface Listing {
  id: string;
  title: string;
  price: number;
  location: string;
  bedrooms: number;
  bathrooms: number;
  type: "flat" | "shared" | "studio" | "hall";
  image: string;
  description: string;
  university: string;
  transport: TransportTime[];
  amenities: string[];
  available: string;
  landlordName: string;
  landlordEmail: string;
  landlordPhone: string;
}

export interface SwipeResult {
  listing: Listing;
  direction: "left" | "right";
  note?: string;
}
