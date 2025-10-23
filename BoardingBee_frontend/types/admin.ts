export type ListingStatus = "Pending" | "Approved" | "Expired" | "Rejected";

export interface Listing {
  id: number;
  title: string;
  location: string;
  price: number;
  description?: string;
  isAvailable: boolean;
  status: ListingStatus;
  createdAt: string;
  lastUpdated: string;
  expiresAt: string;
  ownerId?: number | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  amenitiesCsv?: string | null;
  imagesCsv?: string | null;
}

export interface ListingDetail {
  id: string | number;
  title: string;
  description?: string | null;
  location?: string | null;
  price?: number | null;
  availability?: string | null;
  status?: string | null;
  amenities?: string[];
  images?: string[];
  contactPhone?: string | null;
  contactEmail?: string | null;
  createdAt?: string | null;
  lastUpdated?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  ownerName?: string | null;
  ownerAvatar?: string | null;
  ownerJoinedDate?: string | null;
  ownerRating?: number | null;
  ownerTotalReviews?: number | null;
}

export interface AdminPendingResponse {
  total: number;
  items: Listing[];
}

export interface Kpis {
  totalUsers: number;
  totalListings: number;
  newListings30: number;
  reviews30: number;
  inquiries30: number;
}

export type ActivityKind =
  | "UserLogin" | "ListingCreate" | "ListingUpdate" | "ListingRenew"
  | "ListingApprove" | "ListingReject" | "ReviewCreate" | "InquiryCreate";

export interface ActivityLog {
  id: number;
  at: string;
  kind: ActivityKind;
  actorUserId?: number | null;
  actorEmail?: string | null;
  actorUsername?: string | null;
  listingId?: number | null;
  listingTitle?: string | null;
  reviewId?: number | null;
  inquiryId?: number | null;
  meta?: string | null;
}

export interface ActivitySeriesPoint {
  d: string;
  kind: ActivityKind;
  count: number;
}

export type NotificationStatus = "Pending" | "Sent" | "Failed";

export interface AdminNotification {
  id: number;
  userId: number;
  type: string;
  subject: string;
  body: string;
  status: NotificationStatus;
  createdAt: string;
  sentAt?: string | null;
  linkUrl?: string | null;
  listingId?: number | null;
}
