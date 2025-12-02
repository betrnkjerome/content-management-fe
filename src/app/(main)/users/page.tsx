"use client";

import { useState, useMemo } from "react";
import { mockModeratorUsers, mockWebsites } from "@/data/mock-content";
import { ModeratorUser, UserRole } from "@/types/content";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Users,
  MoreHorizontal,
  Shield,
  Eye,
  Edit,
  UserX,
  UserCheck,
  Clock,
  Activity,
  CheckCircle,
  Plus,
  Mail,
  Link,
} from "lucide-react";

const roleLabels: Record<UserRole, string> = {
  admin: "Admin",
  moderator: "Moderator",
};

const roleColors: Record<UserRole, string> = {
  admin: "bg-purple-100 text-purple-800",
  moderator: "bg-green-100 text-green-800",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  active: "bg-green-100 text-green-800",
  inactive: "bg-gray-100 text-gray-800",
};

interface ActivityLog {
  id: string;
  adminName: string;
  action: string;
  targetUserName: string;
  details: string;
  timestamp: Date;
}

export default function UsersPage() {
  const [users, setUsers] = useState<ModeratorUser[]>(mockModeratorUsers);
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterWebsite, setFilterWebsite] = useState<string>("all");
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    user: ModeratorUser | null;
  }>({ open: false, user: null });
  const [editedRole, setEditedRole] = useState<UserRole>("moderator");
  const [editedWebsites, setEditedWebsites] = useState<string[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    user: ModeratorUser | null;
    action: "activate" | "deactivate" | null;
  }>({ open: false, user: null, action: null });
  const [createDialog, setCreateDialog] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "moderator" as UserRole,
    websites: [] as string[],
  });

  // For demo purposes, assume current user is admin (can create users)
  const currentUserRole: UserRole = "admin";

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      if (filterRole !== "all" && user.role !== filterRole) return false;
      if (filterStatus !== "all" && user.status !== filterStatus) return false;
      if (filterWebsite !== "all") {
        // Admin has access to all websites
        if (user.role === "admin") return true;
        if (!user.assignedWebsites?.includes(filterWebsite)) return false;
      }
      return true;
    });
  }, [users, filterRole, filterStatus, filterWebsite]);

  const openEditDialog = (user: ModeratorUser) => {
    setEditedRole(user.role);
    setEditedWebsites(user.assignedWebsites || []);
    setEditDialog({ open: true, user });
  };

  const toggleEditWebsite = (websiteId: string) => {
    setEditedWebsites((prev) =>
      prev.includes(websiteId)
        ? prev.filter((id) => id !== websiteId)
        : [...prev, websiteId]
    );
  };

  const openCreateDialog = () => {
    setNewUser({ name: "", email: "", role: "moderator", websites: [] });
    setCreateDialog(true);
  };

  // Generate invite token (email_timestamp encoded in base64)
  const generateInviteToken = (email: string) => {
    return btoa(`${email}_${Date.now()}`);
  };

  const toggleWebsite = (websiteId: string) => {
    setNewUser((prev) => ({
      ...prev,
      websites: prev.websites.includes(websiteId)
        ? prev.websites.filter((id) => id !== websiteId)
        : [...prev.websites, websiteId],
    }));
  };

  const getWebsiteNames = (websiteIds: string[]) => {
    return websiteIds
      .map((id) => mockWebsites.find((w) => w.id === id)?.name)
      .filter(Boolean);
  };

  const createUser = () => {
    // Admin doesn't need websites, moderator does
    if (!newUser.name || !newUser.email) return;
    if (newUser.role === "moderator" && newUser.websites.length === 0) return;

    const inviteToken = generateInviteToken(newUser.email);
    const user: ModeratorUser = {
      id: `mod_${Date.now()}`,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      status: "pending",
      lastActive: new Date(),
      createdAt: new Date(),
      actionsCount: 0,
      inviteToken,
      inviteSentAt: new Date(),
      assignedWebsites: newUser.role === "admin" ? [] : newUser.websites,
    };

    setUsers((prev) => [...prev, user]);

    const detailsMessage =
      newUser.role === "admin"
        ? `Created new ${
            roleLabels[user.role]
          } account (access to all websites)`
        : `Created new ${roleLabels[user.role]} account for ${getWebsiteNames(
            user.assignedWebsites
          ).join(", ")}`;

    setActivityLogs((prev) => [
      {
        id: `log_${Date.now()}`,
        adminName: "Admin User",
        action: "Created User",
        targetUserName: user.name,
        details: detailsMessage,
        timestamp: new Date(),
      },
      ...prev,
    ]);

    setCreateDialog(false);
    setNewUser({ name: "", email: "", role: "moderator", websites: [] });
  };

  const saveUserChanges = () => {
    if (!editDialog.user) return;
    const oldRole = editDialog.user.role;
    const newRole = editedRole;
    const oldWebsites = editDialog.user.assignedWebsites || [];
    const newWebsites = newRole === "admin" ? [] : editedWebsites;

    setUsers((prev) =>
      prev.map((u) =>
        u.id === editDialog.user!.id
          ? { ...u, role: editedRole, assignedWebsites: newWebsites }
          : u
      )
    );

    // Build activity log details
    const changes: string[] = [];
    if (oldRole !== newRole) {
      changes.push(
        `role from ${roleLabels[oldRole]} to ${roleLabels[newRole]}`
      );
    }
    if (newRole === "moderator") {
      const addedWebsites = newWebsites.filter((w) => !oldWebsites.includes(w));
      const removedWebsites = oldWebsites.filter(
        (w) => !newWebsites.includes(w)
      );
      if (addedWebsites.length > 0) {
        changes.push(
          `added websites: ${getWebsiteNames(addedWebsites).join(", ")}`
        );
      }
      if (removedWebsites.length > 0) {
        changes.push(
          `removed websites: ${getWebsiteNames(removedWebsites).join(", ")}`
        );
      }
    }

    if (changes.length > 0) {
      setActivityLogs((prev) => [
        {
          id: `log_${Date.now()}`,
          adminName: "Admin User",
          action: "Updated User",
          targetUserName: editDialog.user!.name,
          details: `Changed ${changes.join("; ")}`,
          timestamp: new Date(),
        },
        ...prev,
      ]);
    }

    setEditDialog({ open: false, user: null });
  };

  const openConfirmDialog = (
    user: ModeratorUser,
    action: "activate" | "deactivate"
  ) => {
    setConfirmDialog({ open: true, user, action });
  };

  const confirmAction = () => {
    if (!confirmDialog.user || !confirmDialog.action) return;
    const newStatus =
      confirmDialog.action === "activate" ? "active" : "inactive";

    setUsers((prev) =>
      prev.map((u) =>
        u.id === confirmDialog.user!.id ? { ...u, status: newStatus } : u
      )
    );

    const actionLabels = {
      activate: "Activated User",
      deactivate: "Deactivated User",
    };

    setActivityLogs((prev) => [
      {
        id: `log_${Date.now()}`,
        adminName: "Admin User",
        action: actionLabels[confirmDialog.action!],
        targetUserName: confirmDialog.user!.name,
        details: `Status changed to ${newStatus}`,
        timestamp: new Date(),
      },
      ...prev,
    ]);

    setConfirmDialog({ open: false, user: null, action: null });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            Manage moderator accounts and roles
          </p>
        </div>
        {currentUserRole === "admin" && (
          <Button
            onClick={openCreateDialog}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create User
          </Button>
        )}
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
            <Badge variant="secondary" className="ml-1">
              {users.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Activity Log
            {activityLogs.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activityLogs.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Filters:</span>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterWebsite} onValueChange={setFilterWebsite}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Websites" />
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

          {/* Users Table */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Websites</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead>Actions</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback>
                            {user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={roleColors[user.role]}>
                        {roleLabels[user.role]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {user.assignedWebsites?.slice(0, 2).map((websiteId) => {
                          const website = mockWebsites.find(
                            (w) => w.id === websiteId
                          );
                          return website ? (
                            <Badge
                              key={websiteId}
                              variant="outline"
                              className="text-xs"
                            >
                              {website.name}
                            </Badge>
                          ) : null;
                        })}
                        {(user.assignedWebsites?.length || 0) > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{user.assignedWebsites.length - 2}
                          </Badge>
                        )}
                        {!user.assignedWebsites?.length &&
                          user.role === "admin" && (
                            <Badge variant="secondary" className="text-xs">
                              All Websites
                            </Badge>
                          )}
                        {!user.assignedWebsites?.length &&
                          user.role !== "admin" && (
                            <span className="text-muted-foreground text-sm">
                              None
                            </span>
                          )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[user.status]}>
                        {user.status.charAt(0).toUpperCase() +
                          user.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {user.lastActive.toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">
                        {user.actionsCount.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => openEditDialog(user)}
                          >
                            <Edit className="mr-2 h-4 w-4" /> Edit Role
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {user.status === "pending" && (
                            <>
                              <DropdownMenuItem
                                onClick={() => {
                                  const link = `${window.location.origin}/auth/set-password?token=${user.inviteToken}`;
                                  navigator.clipboard.writeText(link);
                                  alert("Invitation link copied to clipboard!");
                                }}
                              >
                                <Link className="mr-2 h-4 w-4" /> Copy Invite
                                Link
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  // Simulate resending invitation
                                  setUsers((prev) =>
                                    prev.map((u) =>
                                      u.id === user.id
                                        ? {
                                            ...u,
                                            inviteToken: generateInviteToken(
                                              u.email
                                            ),
                                            inviteSentAt: new Date(),
                                          }
                                        : u
                                    )
                                  );
                                  setActivityLogs((prev) => [
                                    {
                                      id: `log_${Date.now()}`,
                                      adminName: "Admin User",
                                      action: "resent_invitation",
                                      targetUserName: user.name,
                                      details: `Resent invitation to ${user.email}`,
                                      timestamp: new Date(),
                                    },
                                    ...prev,
                                  ]);
                                  alert(`Invitation resent to ${user.email}!`);
                                }}
                              >
                                <Mail className="mr-2 h-4 w-4" /> Resend
                                Invitation
                              </DropdownMenuItem>
                            </>
                          )}
                          {user.status === "active" && (
                            <>
                              <DropdownMenuItem
                                onClick={() =>
                                  openConfirmDialog(user, "deactivate")
                                }
                              >
                                <UserX className="mr-2 h-4 w-4" /> Deactivate
                              </DropdownMenuItem>
                            </>
                          )}
                          {user.status === "inactive" && (
                            <DropdownMenuItem
                              onClick={() =>
                                openConfirmDialog(user, "activate")
                              }
                            >
                              <UserCheck className="mr-2 h-4 w-4" /> Activate
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Activity Log Tab */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                User Management Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activityLogs.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No activity logged yet. Actions will appear here.
                </p>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {activityLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-4 p-4 border rounded-lg"
                    >
                      <div
                        className={`rounded-full p-2 ${
                          log.action.includes("Deactivate")
                            ? "bg-gray-100"
                            : "bg-green-100"
                        }`}
                      >
                        {log.action.includes("Deactivate") ? (
                          <UserX className="h-4 w-4 text-gray-600" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">
                          {log.adminName}{" "}
                          <span className="font-normal text-muted-foreground">
                            {log.action.toLowerCase()}
                          </span>{" "}
                          {log.targetUserName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {log.details}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {log.timestamp.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Role & Permissions Dialog */}
      <Dialog
        open={editDialog.open}
        onOpenChange={(open) =>
          !open && setEditDialog({ open: false, user: null })
        }
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Role & Permissions</DialogTitle>
            <DialogDescription>
              Update role and permissions for {editDialog.user?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Role Selection */}
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={editedRole}
                onValueChange={(v) => setEditedRole(v as UserRole)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {editedRole === "admin"
                  ? "Admin has access to all websites and can create new users."
                  : "Moderator can only access assigned websites."}
              </p>
            </div>
            {/* Website Selection - only for moderators */}
            {editedRole === "moderator" && (
              <div className="space-y-2">
                <Label>Assigned Websites</Label>
                <div className="rounded-md border p-3 space-y-2 max-h-[150px] overflow-y-auto">
                  {mockWebsites.map((website) => (
                    <div
                      key={website.id}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={`edit-${website.id}`}
                        checked={editedWebsites.includes(website.id)}
                        onCheckedChange={() => toggleEditWebsite(website.id)}
                      />
                      <Label
                        htmlFor={`edit-${website.id}`}
                        className="flex-1 cursor-pointer text-sm font-normal"
                      >
                        {website.name}
                        <span className="ml-2 text-muted-foreground text-xs">
                          {website.url}
                        </span>
                      </Label>
                    </div>
                  ))}
                </div>
                {editedWebsites.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {editedWebsites.length} website(s) selected
                  </p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialog({ open: false, user: null })}
            >
              Cancel
            </Button>
            <Button
              onClick={saveUserChanges}
              disabled={
                editedRole === "moderator" && editedWebsites.length === 0
              }
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Action Dialog */}
      <AlertDialog
        open={confirmDialog.open}
        onOpenChange={(open) =>
          !open && setConfirmDialog({ open: false, user: null, action: null })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.action === "activate"
                ? "Activate User"
                : "Deactivate User"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.action === "activate" ? (
                <>
                  Activate <strong>{confirmDialog.user?.name}</strong>? They
                  will regain access based on their assigned permissions.
                </>
              ) : (
                <>
                  Deactivate <strong>{confirmDialog.user?.name}</strong>? They
                  will temporarily lose access to the dashboard.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAction}>
              {confirmDialog.action === "activate" ? "Activate" : "Deactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create User Dialog */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new moderator to the system
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Enter full name"
                value={newUser.name}
                onChange={(e) =>
                  setNewUser((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
                value={newUser.email}
                onChange={(e) =>
                  setNewUser((prev) => ({ ...prev, email: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={newUser.role}
                onValueChange={(v) =>
                  setNewUser((prev) => ({ ...prev, role: v as UserRole }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {newUser.role === "admin"
                  ? "Admin has access to all websites and can create new users."
                  : "Moderator can only access assigned websites."}
              </p>
            </div>
            {newUser.role === "moderator" && (
              <div className="space-y-2">
                <Label>Assigned Websites</Label>
                <div className="rounded-md border p-3 space-y-2 max-h-[150px] overflow-y-auto">
                  {mockWebsites.map((website) => (
                    <div
                      key={website.id}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={website.id}
                        checked={newUser.websites.includes(website.id)}
                        onCheckedChange={() => toggleWebsite(website.id)}
                      />
                      <Label
                        htmlFor={website.id}
                        className="flex-1 cursor-pointer text-sm font-normal"
                      >
                        {website.name}
                        <span className="ml-2 text-muted-foreground text-xs">
                          {website.url}
                        </span>
                      </Label>
                    </div>
                  ))}
                </div>
                {newUser.websites.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {newUser.websites.length} website(s) selected
                  </p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={createUser}
              disabled={
                !newUser.name ||
                !newUser.email ||
                (newUser.role === "moderator" && newUser.websites.length === 0)
              }
            >
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
