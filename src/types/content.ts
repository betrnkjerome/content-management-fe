export type ContentType = "profile_picture" | "review" | "comment" | "post";

export type ContentStatus = "pending" | "approved" | "taken_down";

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
  createdAt: Date;
  status: ContentStatus;
  moderatedAt?: Date;
  moderatedBy?: string;
  reason?: string; // Reason for takedown
  flagCount: number; // Number of times flagged by users
  reportReasons?: string[]; // Reasons from user reports
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
