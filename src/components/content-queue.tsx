"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { ContentItem, ContentType, ContentStatus } from "@/types/content";
import { mockWebsites } from "@/data/mock-content";
import { useContentStore } from "@/hooks/use-content-store";
import { ContentDetailDialog } from "@/components/content-detail-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  MoreHorizontal,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ImageIcon,
  Star,
  ClipboardList,
  Globe,
} from "lucide-react";

// Activity log interface
interface ContentActivityLog {
  id: string;
  moderatorName: string;
  action: "approved" | "taken_down";
  contentId: string;
  contentType: ContentType;
  userName: string;
  reason?: string;
  timestamp: Date;
}

// Mock current moderator (in real app, this would come from auth context)
const CURRENT_MODERATOR = "Admin User";

const typeIcons = {
  profile_picture: ImageIcon,
  review: Star,
};

const statusConfig = {
  pending: {
    label: "For Review",
    color: "bg-yellow-100 text-yellow-800",
    icon: AlertTriangle,
  },
  approved: {
    label: "Approved",
    color: "bg-green-100 text-green-800",
    icon: CheckCircle,
  },
  taken_down: {
    label: "Taken Down",
    color: "bg-red-100 text-red-800",
    icon: XCircle,
  },
};

export function ContentQueue() {
  const searchParams = useSearchParams();
  const {
    approveContent,
    takeDownContent,
    getFilteredContent,
    getContentById,
  } = useContentStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<ContentType | "all">(
    (searchParams.get("type") as ContentType) || "all"
  );
  const [statusFilter, setStatusFilter] = useState<ContentStatus | "all">(
    (searchParams.get("status") as ContentStatus) || "all"
  );
  const [websiteFilter, setWebsiteFilter] = useState<string>("all");
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(
    null
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activityLogs, setActivityLogs] = useState<ContentActivityLog[]>([
    // Dummy activity logs for testing
    {
      id: "log_1",
      moderatorName: "Admin User",
      action: "approved",
      contentId: "4",
      contentType: "profile_picture",
      userName: "Emily Davis",
      timestamp: new Date("2024-12-01T11:30:00"),
    },
    {
      id: "log_2",
      moderatorName: "Admin User",
      action: "taken_down",
      contentId: "7",
      contentType: "review",
      userName: "David Lee",
      reason: "Spam",
      timestamp: new Date("2024-11-30T14:30:00"),
    },
    {
      id: "log_3",
      moderatorName: "Jane Moderator",
      action: "approved",
      contentId: "6",
      contentType: "review",
      userName: "Jessica Brown",
      timestamp: new Date("2024-11-30T17:00:00"),
    },
    {
      id: "log_4",
      moderatorName: "John Moderator",
      action: "taken_down",
      contentId: "3",
      contentType: "profile_picture",
      userName: "Mike Wilson",
      reason: "Nudity",
      timestamp: new Date("2024-11-29T10:15:00"),
    },
    {
      id: "log_5",
      moderatorName: "Admin User",
      action: "approved",
      contentId: "1",
      contentType: "profile_picture",
      userName: "John Smith",
      timestamp: new Date("2024-11-29T09:00:00"),
    },
  ]);

  // Activity log filters
  const [activitySearchQuery, setActivitySearchQuery] = useState("");
  const [activityActionFilter, setActivityActionFilter] = useState<
    "all" | "approved" | "taken_down"
  >("all");
  const [activityTypeFilter, setActivityTypeFilter] = useState<
    ContentType | "all"
  >("all");

  const filteredContent = useMemo(() => {
    let content = getFilteredContent({
      type: typeFilter === "all" ? undefined : typeFilter,
      status: statusFilter === "all" ? undefined : statusFilter,
      search: searchQuery || undefined,
    });

    // Filter by website
    if (websiteFilter !== "all") {
      content = content.filter((item) => item.websiteId === websiteFilter);
    }

    return content;
  }, [
    getFilteredContent,
    typeFilter,
    statusFilter,
    searchQuery,
    websiteFilter,
  ]);

  // Helper to get website name by ID
  const getWebsiteName = (websiteId: string) => {
    const website = mockWebsites.find((w) => w.id === websiteId);
    return website?.name || "Unknown";
  };

  // Filtered activity logs
  const filteredActivityLogs = useMemo(() => {
    return activityLogs.filter((log) => {
      // Filter by action
      if (
        activityActionFilter !== "all" &&
        log.action !== activityActionFilter
      ) {
        return false;
      }
      // Filter by content type
      if (
        activityTypeFilter !== "all" &&
        log.contentType !== activityTypeFilter
      ) {
        return false;
      }
      // Filter by search query
      if (activitySearchQuery) {
        const searchLower = activitySearchQuery.toLowerCase();
        return (
          log.userName.toLowerCase().includes(searchLower) ||
          log.moderatorName.toLowerCase().includes(searchLower) ||
          log.reason?.toLowerCase().includes(searchLower)
        );
      }
      return true;
    });
  }, [
    activityLogs,
    activityActionFilter,
    activityTypeFilter,
    activitySearchQuery,
  ]);

  const handleViewContent = (item: ContentItem) => {
    setSelectedContent(item);
    setDialogOpen(true);
  };

  const handleViewActivityContent = (contentId: string) => {
    const content = getContentById(contentId);
    if (content) {
      setSelectedContent(content);
      setDialogOpen(true);
    }
  };

  const handleQuickApprove = (item: ContentItem) => {
    approveContent(item.id);
    // Add activity log
    const newLog: ContentActivityLog = {
      id: crypto.randomUUID(),
      moderatorName: CURRENT_MODERATOR,
      action: "approved",
      contentId: item.id,
      contentType: item.type,
      userName: item.userName,
      timestamp: new Date(),
    };
    setActivityLogs((prev) => [newLog, ...prev]);
  };

  const handleApproveWithLog = (id: string, item: ContentItem) => {
    approveContent(id);
    const newLog: ContentActivityLog = {
      id: crypto.randomUUID(),
      moderatorName: CURRENT_MODERATOR,
      action: "approved",
      contentId: item.id,
      contentType: item.type,
      userName: item.userName,
      timestamp: new Date(),
    };
    setActivityLogs((prev) => [newLog, ...prev]);
  };

  const handleTakeDownWithLog = (
    id: string,
    reason: string,
    item: ContentItem
  ) => {
    takeDownContent(id, reason);
    const newLog: ContentActivityLog = {
      id: crypto.randomUUID(),
      moderatorName: CURRENT_MODERATOR,
      action: "taken_down",
      contentId: item.id,
      contentType: item.type,
      userName: item.userName,
      reason,
      timestamp: new Date(),
    };
    setActivityLogs((prev) => [newLog, ...prev]);
  };

  return (
    <>
      <Tabs defaultValue="queue" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="queue" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Content Queue
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Activity Log
            {activityLogs.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activityLogs.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="queue">
          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by user or content..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select
                  value={typeFilter}
                  onValueChange={(v) => setTypeFilter(v as ContentType | "all")}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Content Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="profile_picture">
                      Profile Pictures
                    </SelectItem>
                    <SelectItem value="review">Reviews</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={statusFilter}
                  onValueChange={(v) =>
                    setStatusFilter(v as ContentStatus | "all")
                  }
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">For Review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="taken_down">Taken Down</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={websiteFilter} onValueChange={setWebsiteFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Website" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Websites</SelectItem>
                    {mockWebsites.map((website) => (
                      <SelectItem key={website.id} value={website.id}>
                        {website.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Content Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Preview</TableHead>
                    <TableHead>Website</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContent.map((item) => {
                    const TypeIcon = typeIcons[item.type];
                    const status = statusConfig[item.status];
                    const isImage = item.type === "profile_picture";

                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={
                                  item.type === "profile_picture"
                                    ? item.thumbnail
                                    : undefined
                                }
                              />
                              <AvatarFallback>
                                {item.userName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{item.userName}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.userEmail}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <TypeIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="capitalize">
                              {item.type.replace("_", " ")}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {isImage ? (
                            <div className="relative h-10 w-10 overflow-hidden rounded border">
                              <Image
                                src={item.thumbnail || item.content}
                                alt=""
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                          ) : (
                            <p className="max-w-[200px] truncate text-sm text-muted-foreground">
                              {item.content}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {getWebsiteName(item.websiteId)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={status.color}>{status.label}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleViewContent(item)}
                              >
                                <Eye className="mr-2 h-4 w-4" /> View Details
                              </DropdownMenuItem>
                              {item.status !== "approved" && (
                                <DropdownMenuItem
                                  onClick={() => handleQuickApprove(item)}
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />{" "}
                                  Approve
                                </DropdownMenuItem>
                              )}
                              {item.status !== "taken_down" && (
                                <DropdownMenuItem
                                  onClick={() => handleViewContent(item)}
                                  className="text-destructive"
                                >
                                  <XCircle className="mr-2 h-4 w-4" /> Take Down
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredContent.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="h-24 text-center text-muted-foreground"
                      >
                        No content found matching your filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          {/* Activity Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by user or moderator..."
                    value={activitySearchQuery}
                    onChange={(e) => setActivitySearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select
                  value={activityActionFilter}
                  onValueChange={(v) =>
                    setActivityActionFilter(
                      v as "all" | "approved" | "taken_down"
                    )
                  }
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="taken_down">Taken Down</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={activityTypeFilter}
                  onValueChange={(v) =>
                    setActivityTypeFilter(v as ContentType | "all")
                  }
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="profile_picture">
                      Profile Pictures
                    </SelectItem>
                    <SelectItem value="review">Reviews</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Activity Log
                {filteredActivityLogs.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {filteredActivityLogs.length}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredActivityLogs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {activityLogs.length === 0
                    ? "No activity yet. Actions taken on content will appear here."
                    : "No activity logs match your filters."}
                </p>
              ) : (
                <div className="space-y-4">
                  {filteredActivityLogs.map((log) => (
                    <div
                      key={log.id}
                      onClick={() => handleViewActivityContent(log.contentId)}
                      className="flex items-start gap-4 p-4 rounded-lg border bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <div
                        className={`p-2 rounded-full ${
                          log.action === "approved"
                            ? "bg-green-100 text-green-600"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {log.action === "approved" ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p>
                          <span className="font-medium">
                            {log.moderatorName}
                          </span>{" "}
                          <span
                            className={
                              log.action === "approved"
                                ? "text-green-600"
                                : "text-red-600"
                            }
                          >
                            {log.action === "approved"
                              ? "approved"
                              : "took down"}
                          </span>{" "}
                          <span className="capitalize">
                            {log.contentType.replace("_", " ")}
                          </span>{" "}
                          by <span className="font-medium">{log.userName}</span>
                        </p>
                        {log.reason && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Reason: {log.reason}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {log.timestamp.toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            log.action === "approved"
                              ? "default"
                              : "destructive"
                          }
                        >
                          {log.action === "approved"
                            ? "Approved"
                            : "Taken Down"}
                        </Badge>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ContentDetailDialog
        content={selectedContent}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onApprove={(id) => {
          if (selectedContent) {
            handleApproveWithLog(id, selectedContent);
          }
        }}
        onTakeDown={(id, reason) => {
          if (selectedContent) {
            handleTakeDownWithLog(id, reason, selectedContent);
          }
        }}
      />
    </>
  );
}
