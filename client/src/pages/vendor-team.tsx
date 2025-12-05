import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { VendorHeader } from "@/components/vendor-header";
import type { Vendor, VendorTeammate, VendorTeammateInvitation } from "@shared/schema";
import { VENDOR_TEAMMATE_PERMISSIONS } from "@shared/schema";
import {
  Users,
  UserPlus,
  Mail,
  Trash2,
  Edit,
  Clock,
  CheckCircle,
  XCircle,
  Shield,
} from "lucide-react";

const PERMISSION_LABELS: Record<string, { label: string; description: string }> = {
  bookings: { label: "Bookings", description: "View and manage booking requests" },
  contracts: { label: "Contracts", description: "View and manage contracts" },
  packages: { label: "Packages", description: "View and manage service packages" },
  calendar: { label: "Calendar", description: "View and manage availability" },
  analytics: { label: "Analytics", description: "View reports and analytics" },
  messages: { label: "Messages", description: "View and send messages" },
  profile: { label: "Profile", description: "Edit vendor profile information" },
  team_manage: { label: "Team Management", description: "Invite and manage team members" },
};

export default function VendorTeam() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedTeammate, setSelectedTeammate] = useState<VendorTeammate | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const { data: vendors, isLoading: vendorsLoading } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
    enabled: !!user,
  });

  const currentVendor = vendors?.find(v => v.userId === user?.id);

  const { data: teammates, isLoading: teammatesLoading } = useQuery<VendorTeammate[]>({
    queryKey: ["/api/vendor-teammates", { vendorId: currentVendor?.id }],
    enabled: !!currentVendor,
  });

  const { data: pendingInvitations, isLoading: invitationsLoading } = useQuery<VendorTeammateInvitation[]>({
    queryKey: ["/api/vendor-teammates/invitations", { vendorId: currentVendor?.id }],
    enabled: !!currentVendor,
  });

  const inviteMutation = useMutation({
    mutationFn: async (data: { email: string; displayName?: string; permissions: string[] }) => {
      return apiRequest("/api/vendor-teammates/invitations", {
        method: "POST",
        body: JSON.stringify({
          vendorId: currentVendor?.id,
          email: data.email,
          displayName: data.displayName,
          permissions: data.permissions,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendor-teammates/invitations", { vendorId: currentVendor?.id }] });
      setShowInviteDialog(false);
      setInviteEmail("");
      setInviteName("");
      setSelectedPermissions([]);
      toast({
        title: "Invitation sent",
        description: "An invitation email has been sent to the teammate.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send invitation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updatePermissionsMutation = useMutation({
    mutationFn: async ({ id, permissions }: { id: string; permissions: string[] }) => {
      return apiRequest(`/api/vendor-teammates/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ permissions }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendor-teammates", { vendorId: currentVendor?.id }] });
      setShowEditDialog(false);
      setSelectedTeammate(null);
      toast({
        title: "Permissions updated",
        description: "Teammate permissions have been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update permissions",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const revokeTeammateMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/vendor-teammates/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendor-teammates", { vendorId: currentVendor?.id }] });
      toast({
        title: "Teammate removed",
        description: "The teammate has been removed from your team.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to remove teammate",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const revokeInvitationMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/vendor-teammates/invitations/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendor-teammates/invitations", { vendorId: currentVendor?.id }] });
      toast({
        title: "Invitation cancelled",
        description: "The invitation has been cancelled.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to cancel invitation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const togglePermission = (permission: string) => {
    setSelectedPermissions(prev => 
      prev.includes(permission) 
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  const handleInvite = () => {
    if (!inviteEmail || selectedPermissions.length === 0) {
      toast({
        title: "Missing information",
        description: "Please enter an email and select at least one permission.",
        variant: "destructive",
      });
      return;
    }
    inviteMutation.mutate({
      email: inviteEmail,
      displayName: inviteName || undefined,
      permissions: selectedPermissions,
    });
  };

  const handleEditTeammate = (teammate: VendorTeammate) => {
    setSelectedTeammate(teammate);
    setSelectedPermissions(teammate.permissions as string[]);
    setShowEditDialog(true);
  };

  const handleUpdatePermissions = () => {
    if (!selectedTeammate || selectedPermissions.length === 0) return;
    updatePermissionsMutation.mutate({
      id: selectedTeammate.id,
      permissions: selectedPermissions,
    });
  };

  const isLoading = vendorsLoading || teammatesLoading || invitationsLoading;

  if (vendorsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-background dark:via-background dark:to-background">
        <VendorHeader />
        <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
      </div>
    );
  }

  if (!currentVendor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-background dark:via-background dark:to-background">
        <VendorHeader />
        <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No vendor profile found. Please set up your vendor profile first.</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-background dark:via-background dark:to-background">
      <VendorHeader />
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground" data-testid="text-page-title">Team Management</h1>
            <p className="text-muted-foreground mt-1">Invite teammates and manage their access to your vendor account</p>
          </div>
          <Button onClick={() => setShowInviteDialog(true)} data-testid="button-invite-teammate">
            <UserPlus className="w-4 h-4 mr-2" />
            Invite Teammate
          </Button>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Active Teammates ({teammates?.length || 0})
              </CardTitle>
              <CardDescription>
                People who have access to manage your vendor account
              </CardDescription>
            </CardHeader>
            <CardContent>
              {teammatesLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : teammates && teammates.length > 0 ? (
                <div className="space-y-4">
                  {teammates.map((teammate) => (
                    <div 
                      key={teammate.id} 
                      className="flex items-center justify-between p-4 border rounded-lg"
                      data-testid={`teammate-card-${teammate.id}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-primary font-medium">
                            {teammate.displayName?.[0]?.toUpperCase() || teammate.email[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium" data-testid={`text-teammate-name-${teammate.id}`}>
                            {teammate.displayName || teammate.email}
                          </p>
                          <p className="text-sm text-muted-foreground">{teammate.email}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {(teammate.permissions as string[]).map((perm) => (
                              <Badge key={perm} variant="secondary" className="text-xs">
                                {PERMISSION_LABELS[perm]?.label || perm}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditTeammate(teammate)}
                          data-testid={`button-edit-teammate-${teammate.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm("Are you sure you want to remove this teammate?")) {
                              revokeTeammateMutation.mutate(teammate.id);
                            }
                          }}
                          data-testid={`button-remove-teammate-${teammate.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No teammates yet. Invite someone to help manage your vendor account.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Pending Invitations ({pendingInvitations?.length || 0})
              </CardTitle>
              <CardDescription>
                Invitations waiting to be accepted
              </CardDescription>
            </CardHeader>
            <CardContent>
              {invitationsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : pendingInvitations && pendingInvitations.length > 0 ? (
                <div className="space-y-4">
                  {pendingInvitations.map((invitation) => (
                    <div 
                      key={invitation.id} 
                      className="flex items-center justify-between p-4 border rounded-lg border-dashed"
                      data-testid={`invitation-card-${invitation.id}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          <Clock className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium" data-testid={`text-invitation-email-${invitation.id}`}>
                            {invitation.email}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Invited on {new Date(invitation.invitedAt).toLocaleDateString()}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {(invitation.permissions as string[]).map((perm) => (
                              <Badge key={perm} variant="outline" className="text-xs">
                                {PERMISSION_LABELS[perm]?.label || perm}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm("Are you sure you want to cancel this invitation?")) {
                            revokeInvitationMutation.mutate(invitation.id);
                          }
                        }}
                        data-testid={`button-cancel-invitation-${invitation.id}`}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No pending invitations.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Available Permissions
              </CardTitle>
              <CardDescription>
                Permissions you can grant to teammates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {Object.entries(PERMISSION_LABELS).map(([key, { label, description }]) => (
                  <div key={key} className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{label}</p>
                      <p className="text-sm text-muted-foreground">{description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Invite Teammate</DialogTitle>
              <DialogDescription>
                Send an invitation to add a new teammate to your vendor account.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="teammate@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  data-testid="input-invite-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name (optional)</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  data-testid="input-invite-name"
                />
              </div>
              <div className="space-y-2">
                <Label>Permissions</Label>
                <div className="grid gap-2 max-h-64 overflow-y-auto">
                  {Object.entries(PERMISSION_LABELS).map(([key, { label, description }]) => (
                    <div key={key} className="flex items-center space-x-3 p-2 rounded hover-elevate">
                      <Checkbox
                        id={`perm-${key}`}
                        checked={selectedPermissions.includes(key)}
                        onCheckedChange={() => togglePermission(key)}
                        data-testid={`checkbox-permission-${key}`}
                      />
                      <div className="flex-1">
                        <label
                          htmlFor={`perm-${key}`}
                          className="text-sm font-medium leading-none cursor-pointer"
                        >
                          {label}
                        </label>
                        <p className="text-xs text-muted-foreground">{description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleInvite} 
                disabled={inviteMutation.isPending}
                data-testid="button-send-invitation"
              >
                {inviteMutation.isPending ? "Sending..." : "Send Invitation"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Permissions</DialogTitle>
              <DialogDescription>
                Update permissions for {selectedTeammate?.displayName || selectedTeammate?.email}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Permissions</Label>
                <div className="grid gap-2 max-h-64 overflow-y-auto">
                  {Object.entries(PERMISSION_LABELS).map(([key, { label, description }]) => (
                    <div key={key} className="flex items-center space-x-3 p-2 rounded hover-elevate">
                      <Checkbox
                        id={`edit-perm-${key}`}
                        checked={selectedPermissions.includes(key)}
                        onCheckedChange={() => togglePermission(key)}
                        data-testid={`checkbox-edit-permission-${key}`}
                      />
                      <div className="flex-1">
                        <label
                          htmlFor={`edit-perm-${key}`}
                          className="text-sm font-medium leading-none cursor-pointer"
                        >
                          {label}
                        </label>
                        <p className="text-xs text-muted-foreground">{description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleUpdatePermissions} 
                disabled={updatePermissionsMutation.isPending}
                data-testid="button-save-permissions"
              >
                {updatePermissionsMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
