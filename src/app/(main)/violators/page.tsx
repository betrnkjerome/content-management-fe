"use client";

import { useState } from "react";
import { mockViolators } from "@/data/mock-content";
import { PenaltyStatus, Violator } from "@/types/content";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  AlertTriangle,
  Ban,
  Clock,
  History,
  MoreHorizontal,
  ShieldAlert,
  ShieldOff,
  UserX,
  Users,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface ActivityLog {
  id: string;
  moderatorName: string;
  action: string;
  targetUserName: string;
  previousStatus: PenaltyStatus;
  newStatus: PenaltyStatus;
  timestamp: Date;
}

const penaltyConfig: Record<
  PenaltyStatus,
  { label: string; color: string; icon: React.ElementType }
> = {
  none: {
    label: "No Penalty",
    color: "bg-gray-100 text-gray-800",
    icon: Clock,
  },
  warned: {
    label: "Warned",
    color: "bg-yellow-100 text-yellow-800",
    icon: AlertTriangle,
  },
  restricted: {
    label: "Restricted",
    color: "bg-orange-100 text-orange-800",
    icon: ShieldAlert,
  },
  suspended: {
    label: "Suspended",
    color: "bg-red-100 text-red-800",
    icon: ShieldOff,
  },
  banned: { label: "Banned", color: "bg-red-200 text-red-900", icon: Ban },
};

const actionLabels: Record<PenaltyStatus, string> = {
  none: "Remove Penalty",
  warned: "Issue Warning",
  restricted: "Restrict Account",
  suspended: "Suspend Account",
  banned: "Ban User",
};

// Mock current moderator - in real app this would come from auth
const CURRENT_MODERATOR = "Admin User";

export default function ViolatorsPage() {
  const [violators, setViolators] = useState<Violator[]>(mockViolators);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    violator: Violator | null;
    newStatus: PenaltyStatus | null;
  }>({ open: false, violator: null, newStatus: null });

  const filteredViolators = violators
    .filter((v) => filterStatus === "all" || v.penaltyStatus === filterStatus)
    .sort((a, b) => b.totalViolations - a.totalViolations);

  const openConfirmDialog = (violator: Violator, newStatus: PenaltyStatus) => {
    setConfirmDialog({ open: true, violator, newStatus });
  };

  const confirmPenalty = () => {
    if (confirmDialog.violator && confirmDialog.newStatus) {
      const previousStatus = confirmDialog.violator.penaltyStatus;
      const newStatus = confirmDialog.newStatus;

      // Update violator status
      setViolators((prev) =>
        prev.map((v) =>
          v.id === confirmDialog.violator!.id
            ? { ...v, penaltyStatus: newStatus }
            : v
        )
      );

      // Add activity log
      const newLog: ActivityLog = {
        id: crypto.randomUUID(),
        moderatorName: CURRENT_MODERATOR,
        action: actionLabels[newStatus],
        targetUserName: confirmDialog.violator.userName,
        previousStatus,
        newStatus,
        timestamp: new Date(),
      };
      setActivityLogs((prev) => [newLog, ...prev]);
    }
    setConfirmDialog({ open: false, violator: null, newStatus: null });
  };

  const cancelConfirm = () => {
    setConfirmDialog({ open: false, violator: null, newStatus: null });
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Repeat Violators</h1>
        <p className="text-muted-foreground">
          Users with multiple content violations - manage penalties
        </p>
      </div>

      <Tabs defaultValue="violators" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="violators" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Violators
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

        <TabsContent value="violators">
          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="flex items-center gap-4 py-4">
              <span className="text-sm font-medium">Filter by status:</span>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="none">No Penalty</SelectItem>
                  <SelectItem value="warned">Warned</SelectItem>
                  <SelectItem value="restricted">Restricted</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="banned">Banned</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Violators Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Violations</TableHead>
                    <TableHead>Taken Down</TableHead>
                    <TableHead>Last Violation</TableHead>
                    <TableHead>Account Age</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredViolators.map((violator) => {
                    const status = penaltyConfig[violator.penaltyStatus];
                    const StatusIcon = status.icon;
                    const accountAge = Math.floor(
                      (Date.now() - violator.accountCreatedAt.getTime()) /
                        (1000 * 60 * 60 * 24)
                    );

                    return (
                      <TableRow key={violator.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={violator.avatarUrl} />
                              <AvatarFallback>
                                {violator.userName.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{violator.userName}</p>
                              <p className="text-sm text-muted-foreground">
                                {violator.userEmail}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="destructive" className="gap-1">
                            <UserX className="h-3 w-3" />
                            {violator.totalViolations}
                          </Badge>
                        </TableCell>
                        <TableCell>{violator.takenDownContent}</TableCell>
                        <TableCell>
                          {new Date(
                            violator.lastViolationDate
                          ).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{accountAge} days</TableCell>
                        <TableCell>
                          <Badge className={`gap-1 ${status.color}`}>
                            <StatusIcon className="h-3 w-3" />
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  openConfirmDialog(violator, "warned")
                                }
                              >
                                <AlertTriangle className="mr-2 h-4 w-4" /> Issue
                                Warning
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  openConfirmDialog(violator, "restricted")
                                }
                              >
                                <ShieldAlert className="mr-2 h-4 w-4" />{" "}
                                Restrict Account
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  openConfirmDialog(violator, "suspended")
                                }
                              >
                                <ShieldOff className="mr-2 h-4 w-4" /> Suspend
                                Account
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() =>
                                  openConfirmDialog(violator, "banned")
                                }
                                className="text-red-600"
                              >
                                <Ban className="mr-2 h-4 w-4" /> Ban User
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() =>
                                  openConfirmDialog(violator, "none")
                                }
                              >
                                <Clock className="mr-2 h-4 w-4" /> Remove
                                Penalty
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
                  No activity yet. Actions taken on violators will appear here.
                </p>
              ) : (
                <div className="space-y-4">
                  {activityLogs.map((log) => {
                    const prevConfig = penaltyConfig[log.previousStatus];
                    const newConfig = penaltyConfig[log.newStatus];
                    const isEscalation =
                      ["warned", "restricted", "suspended", "banned"].indexOf(
                        log.newStatus
                      ) >
                      ["warned", "restricted", "suspended", "banned"].indexOf(
                        log.previousStatus
                      );
                    return (
                      <div
                        key={log.id}
                        className="flex items-start gap-4 p-4 rounded-lg border bg-muted/30"
                      >
                        <div
                          className={`p-2 rounded-full ${
                            log.newStatus === "none"
                              ? "bg-green-100 text-green-600"
                              : isEscalation
                              ? "bg-red-100 text-red-600"
                              : "bg-yellow-100 text-yellow-600"
                          }`}
                        >
                          {log.newStatus === "none" ? (
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
                            changed{" "}
                            <span className="font-medium">
                              {log.targetUserName}
                            </span>{" "}
                            status
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={`${prevConfig.color} text-xs`}>
                              {prevConfig.label}
                            </Badge>
                            <span className="text-muted-foreground">→</span>
                            <Badge className={`${newConfig.color} text-xs`}>
                              {newConfig.label}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            {log.timestamp.toLocaleString()}
                          </p>
                        </div>
                        <Badge
                          variant={
                            log.newStatus === "none" ? "default" : "destructive"
                          }
                        >
                          {actionLabels[log.newStatus]}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Confirmation Modal */}
      <AlertDialog
        open={confirmDialog.open}
        onOpenChange={(open) => !open && cancelConfirm()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Action</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.violator && confirmDialog.newStatus && (
                <>
                  Are you sure you want to{" "}
                  <strong>
                    {actionLabels[confirmDialog.newStatus].toLowerCase()}
                  </strong>{" "}
                  for <strong>{confirmDialog.violator.userName}</strong>?
                  {confirmDialog.newStatus === "banned" && (
                    <span className="mt-2 block text-red-600">
                      This will permanently ban the user from the platform.
                    </span>
                  )}
                  {confirmDialog.newStatus === "suspended" && (
                    <span className="mt-2 block text-orange-600">
                      The user will not be able to access their account until
                      the suspension is lifted.
                    </span>
                  )}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelConfirm}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmPenalty}
              className={
                confirmDialog.newStatus === "banned"
                  ? "bg-red-600 hover:bg-red-700"
                  : ""
              }
            >
              {confirmDialog.newStatus && actionLabels[confirmDialog.newStatus]}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
