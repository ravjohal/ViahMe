import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  Search,
  Calendar,
  MapPin,
  Heart,
  Mail,
  Shield,
  UserCircle,
  Eye,
  CheckCircle,
  XCircle,
} from "lucide-react";
import type { User, Wedding } from "@shared/schema";

interface UserWithWedding {
  user: User;
  wedding: Wedding | null;
}

const ROLE_COLORS: Record<string, string> = {
  couple: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400",
  vendor: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  admin: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
};

function formatDate(date: Date | string | null): string {
  if (!date) return "Not set";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function AdminUsers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<UserWithWedding | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const { data: usersWithWeddings = [], isLoading, isError, error } = useQuery<UserWithWedding[]>({
    queryKey: ["/api/admin/users"],
  });

  const filteredUsers = usersWithWeddings.filter((item) => {
    const matchesSearch =
      searchQuery === "" ||
      item.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.wedding?.partner1Name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.wedding?.partner2Name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.wedding?.location?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === "all" || item.user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const stats = {
    total: usersWithWeddings.length,
    couples: usersWithWeddings.filter((u) => u.user.role === "couple").length,
    vendors: usersWithWeddings.filter((u) => u.user.role === "vendor").length,
    withWeddings: usersWithWeddings.filter((u) => u.wedding !== null).length,
    verified: usersWithWeddings.filter((u) => u.user.emailVerified).length,
  };

  const handleViewUser = (item: UserWithWedding) => {
    setSelectedUser(item);
    setDetailDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Skeleton className="h-8 w-64 mb-6" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive mb-2">
              <XCircle className="h-5 w-5" />
              <h2 className="font-semibold">Access Denied</h2>
            </div>
            <p className="text-muted-foreground">
              {(error as Error)?.message || "You don't have permission to view this page. Site admin access is required."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          User Management
        </h1>
        <p className="text-muted-foreground">
          View all users and their associated wedding details
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-5 mb-6">
        <Card data-testid="card-stat-total">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold" data-testid="text-stat-total">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total Users</p>
          </CardContent>
        </Card>
        <Card data-testid="card-stat-couples">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-pink-600" data-testid="text-stat-couples">{stats.couples}</div>
            <p className="text-xs text-muted-foreground">Couples</p>
          </CardContent>
        </Card>
        <Card data-testid="card-stat-vendors">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-600" data-testid="text-stat-vendors">{stats.vendors}</div>
            <p className="text-xs text-muted-foreground">Vendors</p>
          </CardContent>
        </Card>
        <Card data-testid="card-stat-weddings">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600" data-testid="text-stat-weddings">{stats.withWeddings}</div>
            <p className="text-xs text-muted-foreground">With Weddings</p>
          </CardContent>
        </Card>
        <Card data-testid="card-stat-verified">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-amber-600" data-testid="text-stat-verified">{stats.verified}</div>
            <p className="text-xs text-muted-foreground">Verified</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            {filteredUsers.length} of {usersWithWeddings.length} users shown
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email, name, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-users"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]" data-testid="select-role-filter">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" data-testid="select-item-all">All Roles</SelectItem>
                <SelectItem value="couple" data-testid="select-item-couple">Couples</SelectItem>
                <SelectItem value="vendor" data-testid="select-item-vendor">Vendors</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead>Wedding</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((item) => (
                    <TableRow key={item.user.id} data-testid={`row-user-${item.user.id}`}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate max-w-[200px]">{item.user.email}</span>
                          {item.user.isSiteAdmin && (
                            <Shield className="h-4 w-4 text-purple-600" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={ROLE_COLORS[item.user.role] || ""}>
                          {item.user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.user.emailVerified ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell>
                        {item.wedding ? (
                          <div className="flex items-center gap-1 text-sm">
                            <Heart className="h-3 w-3 text-pink-500" />
                            <span className="truncate max-w-[150px]">
                              {item.wedding.partner1Name && item.wedding.partner2Name
                                ? `${item.wedding.partner1Name} & ${item.wedding.partner2Name}`
                                : item.wedding.tradition || "Wedding"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.wedding?.location ? (
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span className="truncate max-w-[100px]">{item.wedding.location}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(item.user.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewUser(item)}
                          data-testid={`button-view-user-${item.user.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedUser && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <UserCircle className="h-5 w-5" />
                  User Details
                </DialogTitle>
                <DialogDescription>
                  Viewing details for {selectedUser.user.email}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Account Information</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="font-medium">{selectedUser.user.email}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Role</p>
                      <Badge className={ROLE_COLORS[selectedUser.user.role] || ""}>
                        {selectedUser.user.role}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Email Verified</p>
                      <p className="font-medium flex items-center gap-1">
                        {selectedUser.user.emailVerified ? (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            Yes
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 text-muted-foreground" />
                            No
                          </>
                        )}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Site Admin</p>
                      <p className="font-medium flex items-center gap-1">
                        {selectedUser.user.isSiteAdmin ? (
                          <>
                            <Shield className="h-4 w-4 text-purple-600" />
                            Yes
                          </>
                        ) : (
                          "No"
                        )}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Created</p>
                      <p className="font-medium">{formatDate(selectedUser.user.createdAt)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Last Login</p>
                      <p className="font-medium">{formatDate(selectedUser.user.lastLoginAt)}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Wedding Information</h3>
                  {selectedUser.wedding ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Partner 1</p>
                        <p className="font-medium">{selectedUser.wedding.partner1Name || "Not set"}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Partner 2</p>
                        <p className="font-medium">{selectedUser.wedding.partner2Name || "Not set"}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Tradition</p>
                        <p className="font-medium capitalize">{selectedUser.wedding.tradition}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Sub-Tradition</p>
                        <p className="font-medium capitalize">{selectedUser.wedding.subTradition || "None"}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Wedding Date</p>
                        <p className="font-medium flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {formatDate(selectedUser.wedding.weddingDate)}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Location</p>
                        <p className="font-medium flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          {selectedUser.wedding.location}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Role</p>
                        <p className="font-medium capitalize">{selectedUser.wedding.role}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Expected Guests</p>
                        <p className="font-medium">{selectedUser.wedding.expectedGuests || "Not set"}</p>
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <p className="text-xs text-muted-foreground">Wedding ID</p>
                        <p className="font-mono text-xs">{selectedUser.wedding.id}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No wedding created for this user</p>
                  )}
                </div>

                <Separator />

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">User ID</p>
                  <p className="font-mono text-xs">{selectedUser.user.id}</p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
