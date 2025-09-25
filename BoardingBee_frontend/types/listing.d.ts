export interface Listing {
  id: string;
  title: string;
  description: string;
  location: string;
  price: number;
  availability: string;
  status: string;
  amenities?: string[];
  images?: string[];
  contactPhone?: string;
  contactEmail?: string;
  ownerId?: string;
  owner?: {
    name: string;
    avatar?: string;
    rating?: number;
    totalReviews?: number;
    joinedDate?: string;
  };
  createdAt?: string;
  lastUpdated?: string;
  expiresAt?: string;
}
