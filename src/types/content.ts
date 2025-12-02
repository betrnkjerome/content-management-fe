export type ContentType = "profile_picture" | "review";

export type ContentStatus = "pending" | "approved" | "taken_down";

export type MediaType = "image" | "video";

export interface MediaAttachment {
  id: string;
  type: MediaType;
  url: string;
  thumbnail?: string; // For video thumbnails
}

export interface ContentItem {
  id: string;
  type: ContentType;
  userId: string;
  userName: string;
  userEmail: string;
  content: string; // URL for images, text for reviews/comments
  thumbnail?: string; // For image content
  title?: string; // For posts
  rating?: number; // For reviews (1-5)
  media?: MediaAttachment[]; // Media attachments for reviews
  createdAt: Date;
  status: ContentStatus;
  moderatedAt?: Date;
  moderatedBy?: string;
  reason?: string; // Reason for takedown
  flagCount: number; // Number of times flagged by users
  reportReasons?: string[]; // Reasons from user reports
  websiteId: string; // Website this content belongs to
}

export interface ModerationStats {
  totalPending: number;
  totalApproved: number;
  totalTakenDown: number;
  todayModerated: number;
  flaggedContent: number;
}

export interface ModerationAction {
  id: string;
  contentId: string;
  action: "approved" | "taken_down";
  reason?: string;
  moderatorId: string;
  timestamp: Date;
}

export type PenaltyStatus =
  | "none"
  | "warned"
  | "restricted"
  | "suspended"
  | "banned";

export interface Violator {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  avatarUrl?: string;
  totalViolations: number;
  takenDownContent: number;
  lastViolationDate: Date;
  accountCreatedAt: Date;
  penaltyStatus: PenaltyStatus;
  violationHistory: {
    date: Date;
    contentType: ContentType;
    reason: string;
  }[];
}

export type ReportStatus = "pending" | "resolved" | "dismissed";

export type ReportReason =
  | "spam"
  | "harassment"
  | "hate_speech"
  | "inappropriate"
  | "misinformation"
  | "copyright"
  | "other";

export interface ContentReport {
  id: string;
  contentId: string;
  contentType: ContentType;
  contentPreview: string;
  contentThumbnail?: string;
  reporterId: string;
  reporterName: string;
  reporterEmail: string;
  targetUserId: string;
  targetUserName: string;
  reason: ReportReason;
  description?: string;
  reportedAt: Date;
  status: ReportStatus;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolution?: "content_removed" | "warning_issued" | "no_action";
}

// User Management Types
export type UserRole = "admin" | "moderator";

export type UserStatus = "pending" | "active" | "inactive" | "suspended";

export interface Website {
  id: string;
  name: string;
  url: string;
}

export interface ModeratorUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: UserRole;
  status: UserStatus;
  lastActive: Date;
  createdAt: Date;
  actionsCount: number;
  inviteToken?: string; // Token for setting password
  inviteSentAt?: Date; // When invitation was sent
  assignedWebsites: string[]; // Array of website IDs
}
