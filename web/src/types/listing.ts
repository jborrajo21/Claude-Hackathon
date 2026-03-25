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
  images: string[];
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

export type ApplicationStatus =
  | "saved"
  | "contacted"
  | "viewing_booked"
  | "applied"
  | "accepted"
  | "rejected";

export interface LikedListing {
  listing: Listing;
  note?: string;
  likedAt: string;
  status: ApplicationStatus;
  userPhotos: string[];
}
