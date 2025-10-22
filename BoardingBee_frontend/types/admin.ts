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
  listingId?: number | null;
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
