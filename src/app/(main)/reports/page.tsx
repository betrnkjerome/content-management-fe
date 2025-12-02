"use client";

import { useState, useMemo } from "react";
import { mockReports } from "@/data/mock-content";
import { ContentReport, ReportStatus, ReportReason } from "@/types/content";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Flag,
  MoreHorizontal,
  History,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Ban,
  MessageSquare,
  Image,
  FileText,
  Star,
  Eye,
  Calendar,
  User,
} from "lucide-react";

const CURRENT_MODERATOR = "Admin User";

const reasonLabels: Record<ReportReason, string> = {
  spam: "Spam",
  harassment: "Harassment",
  hate_speech: "Hate Speech",
  inappropriate: "Inappropriate",
  misinformation: "Misinformation",
  copyright: "Copyright",
  other: "Other",
};

const reasonColors: Record<ReportReason, string> = {
  spam: "bg-yellow-100 text-yellow-800",
  harassment: "bg-red-100 text-red-800",
  hate_speech: "bg-red-100 text-red-800",
  inappropriate: "bg-orange-100 text-orange-800",
  misinformation: "bg-purple-100 text-purple-800",
  copyright: "bg-blue-100 text-blue-800",
  other: "bg-gray-100 text-gray-800",
};

const statusConfig: Record<ReportStatus, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  resolved: { label: "Resolved", color: "bg-green-100 text-green-800" },
  dismissed: { label: "Dismissed", color: "bg-gray-100 text-gray-800" },
};

const contentTypeIcons = {
  profile_picture: Image,
  review: Star,
  comment: MessageSquare,
  post: FileText,
};

interface ReportActivityLog {
  id: string;
  moderatorName: string;
  action: "resolved" | "dismissed";
  reportId: string;
  reporterName: string;
  targetUserName: string;
  reason: ReportReason;
  resolution?: "content_removed" | "warning_issued" | "no_action";
  timestamp: Date;
}

type ResolutionAction = "content_removed" | "warning_issued" | "no_action";

const resolutionLabels: Record<ResolutionAction, string> = {
  content_removed: "Remove Content",
  warning_issued: "Issue Warning",
  no_action: "Dismiss Report",
};

export default function ReportsPage() {
  const [reports, setReports] = useState<ContentReport[]>(mockReports);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterReason, setFilterReason] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [activityLogs, setActivityLogs] = useState<ReportActivityLog[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    report: ContentReport | null;
    resolution: ResolutionAction | null;
  }>({ open: false, report: null, resolution: null });
  const [viewDialog, setViewDialog] = useState<{
    open: boolean;
    report: ContentReport | null;
  }>({ open: false, report: null });

  // Count how many users reported each content
  const reportCountByContent = useMemo(() => {
    const counts: Record<string, number> = {};
    reports.forEach((report) => {
      counts[report.contentId] = (counts[report.contentId] || 0) + 1;
    });
    return counts;
  }, [reports]);

  // Get all reporters for a specific content
  const getReportersForContent = (contentId: string) => {
    return reports
      .filter((r) => r.contentId === contentId)
      .map((r) => ({
        name: r.reporterName,
        email: r.reporterEmail,
        reason: r.reason,
        date: r.reportedAt,
      }));
  };

  // Helper function to get priority based on flag count
  const getPriority = (contentId: string): "high" | "medium" | "low" => {
    const count = reportCountByContent[contentId] || 1;
    if (count >= 3) return "high";
    if (count >= 2) return "medium";
    return "low";
  };

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      if (filterStatus !== "all" && report.status !== filterStatus)
        return false;
      if (filterReason !== "all" && report.reason !== filterReason)
        return false;
      if (filterPriority !== "all") {
        const priority = getPriority(report.contentId);
        if (priority !== filterPriority) return false;
      }
      return true;
    });
  }, [
    reports,
    filterStatus,
    filterReason,
    filterPriority,
    reportCountByContent,
  ]);

  const pendingCount = reports.filter((r) => r.status === "pending").length;

  const openConfirmDialog = (
    report: ContentReport,
    resolution: ResolutionAction
  ) => {
    setConfirmDialog({ open: true, report, resolution });
  };

  const openViewDialog = (report: ContentReport) => {
    setViewDialog({ open: true, report });
  };

  const confirmResolution = () => {
    if (!confirmDialog.report || !confirmDialog.resolution) return;

    const report = confirmDialog.report;
    const resolution = confirmDialog.resolution;
    const newStatus: ReportStatus =
      resolution === "no_action" ? "dismissed" : "resolved";

    setReports((prev) =>
      prev.map((r) =>
        r.id === report.id
          ? {
              ...r,
              status: newStatus,
              resolvedAt: new Date(),
              resolvedBy: CURRENT_MODERATOR,
              resolution: resolution,
            }
          : r
      )
    );

    setActivityLogs((prev) => [
      {
        id: crypto.randomUUID(),
        moderatorName: CURRENT_MODERATOR,
        action: newStatus === "dismissed" ? "dismissed" : "resolved",
        reportId: report.id,
        reporterName: report.reporterName,
        targetUserName: report.targetUserName,
        reason: report.reason,
        resolution: resolution,
        timestamp: new Date(),
      },
      ...prev,
    ]);

    setConfirmDialog({ open: false, report: null, resolution: null });
  };

  const cancelConfirm = () => {
    setConfirmDialog({ open: false, report: null, resolution: null });
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Reported Content</h1>
        <p className="text-muted-foreground">
          User-submitted reports requiring review
        </p>
      </div>

      <Tabs defaultValue="reports" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <Flag className="h-4 w-4" />
            Reports
            {pendingCount > 0 && (
              <Badge variant="destructive" className="ml-1">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Activity Log
            {activityLogs.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activityLogs.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reports">
          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="flex items-center gap-4 py-4">
              <span className="text-sm font-medium">Filters:</span>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="dismissed">Dismissed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterReason} onValueChange={setFilterReason}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Reasons</SelectItem>
                  <SelectItem value="spam">Spam</SelectItem>
                  <SelectItem value="harassment">Harassment</SelectItem>
                  <SelectItem value="hate_speech">Hate Speech</SelectItem>
                  <SelectItem value="inappropriate">Inappropriate</SelectItem>
                  <SelectItem value="misinformation">Misinformation</SelectItem>
                  <SelectItem value="copyright">Copyright</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="high">
                    <span className="flex items-center gap-2">
                      <Flag className="h-3 w-3 text-red-500" />
                      High (3+)
                    </span>
                  </SelectItem>
                  <SelectItem value="medium">
                    <span className="flex items-center gap-2">
                      <Flag className="h-3 w-3 text-orange-500" />
                      Medium (2)
                    </span>
                  </SelectItem>
                  <SelectItem value="low">
                    <span className="flex items-center gap-2">
                      <Flag className="h-3 w-3 text-yellow-500" />
                      Low (1)
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Reports Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Flags</TableHead>
                    <TableHead>Reporter</TableHead>
                    <TableHead>Reported User</TableHead>
                    <TableHead>Content</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Reported</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.map((report) => {
                    const ContentIcon = contentTypeIcons[report.contentType];
                    const status = statusConfig[report.status];
                    const flagCount =
                      reportCountByContent[report.contentId] || 1;
                    return (
                      <TableRow key={report.id}>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Flag
                              className={`h-4 w-4 ${
                                flagCount >= 3
                                  ? "text-red-500"
                                  : flagCount >= 2
                                  ? "text-orange-500"
                                  : "text-yellow-500"
                              }`}
                            />
                            <span
                              className={`text-sm font-medium ${
                                flagCount >= 3
                                  ? "text-red-600"
                                  : flagCount >= 2
                                  ? "text-orange-600"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {flagCount}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {report.reporterName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">
                                {report.reporterName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {report.reporterEmail}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium text-sm">
                            {report.targetUserName}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <ContentIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm truncate max-w-[200px]">
                              {report.contentPreview}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={reasonColors[report.reason]}>
                            {reasonLabels[report.reason]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {report.reportedAt.toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge className={status.color}>{status.label}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {report.status === "pending" ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => openViewDialog(report)}
                                >
                                  <Eye className="mr-2 h-4 w-4" /> View Content
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() =>
                                    openConfirmDialog(report, "content_removed")
                                  }
                                  className="text-red-600"
                                >
                                  <Ban className="mr-2 h-4 w-4" /> Remove
                                  Content
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    openConfirmDialog(report, "warning_issued")
                                  }
                                >
                                  <AlertTriangle className="mr-2 h-4 w-4" />{" "}
                                  Issue Warning
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() =>
                                    openConfirmDialog(report, "no_action")
                                  }
                                >
                                  <XCircle className="mr-2 h-4 w-4" /> Dismiss
                                  Report
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              {report.resolvedBy}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <ActivityLogTab
            activityLogs={activityLogs}
            reasonColors={reasonColors}
            reasonLabels={reasonLabels}
          />
        </TabsContent>
      </Tabs>

      {/* Confirmation Modal */}
      <AlertDialog
        open={confirmDialog.open}
        onOpenChange={(open) => !open && cancelConfirm()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.resolution &&
                resolutionLabels[confirmDialog.resolution]}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.resolution === "content_removed" && (
                <span className="text-red-600">
                  This will remove the reported content and notify the user.
                </span>
              )}
              {confirmDialog.resolution === "warning_issued" && (
                <span>
                  This will issue a warning to{" "}
                  {confirmDialog.report?.targetUserName}.
                </span>
              )}
              {confirmDialog.resolution === "no_action" && (
                <span>
                  This will dismiss the report without taking action on the
                  content.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmResolution}
              className={
                confirmDialog.resolution === "content_removed"
                  ? "bg-red-600 hover:bg-red-700"
                  : ""
              }
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Content Dialog */}
      <Dialog
        open={viewDialog.open}
        onOpenChange={(open) =>
          !open && setViewDialog({ open: false, report: null })
        }
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Reported Content Details
            </DialogTitle>
            <DialogDescription>
              Review the reported content and report information
            </DialogDescription>
          </DialogHeader>
          {viewDialog.report && (
            <div className="space-y-6">
              {/* Content Preview */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground">
                  Content
                </h4>
                <div className="bg-muted p-4 rounded-lg">
                  {viewDialog.report.contentThumbnail ? (
                    <div className="space-y-3">
                      <img
                        src={viewDialog.report.contentThumbnail}
                        alt="Content"
                        className="max-h-48 rounded-md object-cover"
                      />
                      <p className="text-sm">
                        {viewDialog.report.contentPreview}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">
                      {viewDialog.report.contentPreview}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {(() => {
                    const ContentIcon =
                      contentTypeIcons[viewDialog.report.contentType];
                    return (
                      <>
                        <ContentIcon className="h-3 w-3" />
                        <span className="capitalize">
                          {viewDialog.report.contentType.replace("_", " ")}
                        </span>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Report Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground">
                    Reported User
                  </h4>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {viewDialog.report.targetUserName}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground">
                    Report Reason
                  </h4>
                  <Badge className={reasonColors[viewDialog.report.reason]}>
                    {reasonLabels[viewDialog.report.reason]}
                  </Badge>
                </div>
                <div className="space-y-2 col-span-2">
                  <h4 className="font-medium text-sm text-muted-foreground">
                    Reported By (
                    {getReportersForContent(viewDialog.report.contentId).length}{" "}
                    user
                    {getReportersForContent(viewDialog.report.contentId)
                      .length > 1
                      ? "s"
                      : ""}
                    )
                  </h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {getReportersForContent(viewDialog.report.contentId).map(
                      (reporter, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-muted/50 p-2 rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-sm">
                              {reporter.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {reporter.email}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge
                              className={`${
                                reasonColors[reporter.reason]
                              } text-xs`}
                            >
                              {reasonLabels[reporter.reason]}
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              {reporter.date.toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
                <div className="space-y-2 col-span-2">
                  <h4 className="font-medium text-sm text-muted-foreground">
                    First Reported
                  </h4>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {viewDialog.report.reportedAt.toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Report Description */}
              {viewDialog.report.description && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground">
                    Report Description
                  </h4>
                  <p className="text-sm bg-muted p-3 rounded-lg">
                    {viewDialog.report.description}
                  </p>
                </div>
              )}

              {/* Flags Count */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground">
                  Total Reports on This Content
                </h4>
                <div className="flex items-center gap-2">
                  <Flag
                    className={`h-4 w-4 ${
                      (reportCountByContent[viewDialog.report.contentId] ||
                        1) >= 3
                        ? "text-red-500"
                        : (reportCountByContent[viewDialog.report.contentId] ||
                            1) >= 2
                        ? "text-orange-500"
                        : "text-yellow-500"
                    }`}
                  />
                  <span className="font-medium">
                    {reportCountByContent[viewDialog.report.contentId] || 1}{" "}
                    user(s) reported this content
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ActivityLogTab({
  activityLogs,
  reasonColors,
  reasonLabels,
}: {
  activityLogs: ReportActivityLog[];
  reasonColors: Record<ReportReason, string>;
  reasonLabels: Record<ReportReason, string>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Activity Log
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activityLogs.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No activity yet. Report resolutions will appear here.
          </p>
        ) : (
          <div className="space-y-4">
            {activityLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-4 p-4 rounded-lg border bg-muted/30"
              >
                <div
                  className={`p-2 rounded-full ${
                    log.action === "dismissed"
                      ? "bg-gray-100 text-gray-600"
                      : log.resolution === "content_removed"
                      ? "bg-red-100 text-red-600"
                      : "bg-green-100 text-green-600"
                  }`}
                >
                  {log.action === "dismissed" ? (
                    <XCircle className="h-4 w-4" />
                  ) : log.resolution === "content_removed" ? (
                    <Ban className="h-4 w-4" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1">
                  <p>
                    <span className="font-medium">{log.moderatorName}</span>{" "}
                    {log.action === "dismissed"
                      ? "dismissed report on"
                      : log.resolution === "content_removed"
                      ? "removed content from"
                      : "issued warning to"}{" "}
                    <span className="font-medium">{log.targetUserName}</span>
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={reasonColors[log.reason]}>
                      {reasonLabels[log.reason]}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      reported by {log.reporterName}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {log.timestamp.toLocaleString()}
                  </p>
                </div>
                <Badge
                  variant={
                    log.action === "dismissed" ? "secondary" : "destructive"
                  }
                >
                  {log.action === "dismissed"
                    ? "Dismissed"
                    : log.resolution === "content_removed"
                    ? "Content Removed"
                    : "Warning Issued"}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
