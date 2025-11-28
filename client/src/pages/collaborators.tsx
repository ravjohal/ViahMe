import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Users,
  UserPlus,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Trash2,
  Shield,
  History,
  Copy,
  Plus,
  Eye,
  Pencil,
  Ban,
} from "lucide-react";
import type {
  Wedding,
  WeddingRole,
  WeddingCollaborator,
  CollaboratorActivityLog,
  RolePermission,
} from "@shared/schema";
import { PERMISSION_CATEGORIES, type PermissionCategory } from "@shared/schema";

type PermissionLevel = "none" | "view" | "edit";

interface RolePermissionConfig {
  category: PermissionCategory;
  level: PermissionLevel;
}

interface CollaboratorWithDetails extends WeddingCollaborator {
  role: WeddingRole;
  permissions: RolePermission[];
}

interface InviteResponse extends WeddingCollaborator {
  inviteToken: string;
  inviteUrl: string;
  weddingTitle: string;
}

const defaultPermissions = (): Record<PermissionCategory, PermissionLevel> => {
  const perms: Partial<Record<PermissionCategory, PermissionLevel>> = {};
  Object.keys(PERMISSION_CATEGORIES).forEach((key) => {
    perms[key as PermissionCategory] = "none";
  });
  return perms as Record<PermissionCategory, PermissionLevel>;
};

export default function Collaborators() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("roles");
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [lastInviteResult, setLastInviteResult] = useState<InviteResponse | null>(null);
  
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");
  const [rolePermissions, setRolePermissions] = useState<Record<PermissionCategory, PermissionLevel>>(defaultPermissions());

  // Edit role state
  const [isEditRoleOpen, setIsEditRoleOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<(WeddingRole & { permissions?: RolePermission[] }) | null>(null);
  const [editRolePermissions, setEditRolePermissions] = useState<Record<PermissionCategory, PermissionLevel>>(defaultPermissions());

  const { data: weddings = [] } = useQuery<Wedding[]>({
    queryKey: ["/api/weddings"],
    enabled: !!user,
  });

  const wedding = weddings[0];
  const weddingId = wedding?.id;

  const { data: collaborators = [], isLoading: isLoadingCollaborators } = useQuery<CollaboratorWithDetails[]>({
    queryKey: ["/api/weddings", weddingId, "collaborators"],
    enabled: !!weddingId,
  });

  type RoleWithPermissions = WeddingRole & { permissions?: RolePermission[] };
  
  const { data: roles = [], isLoading: isLoadingRoles } = useQuery<RoleWithPermissions[]>({
    queryKey: ["/api/weddings", weddingId, "roles"],
    enabled: !!weddingId,
  });

  const { data: activity = [] } = useQuery<CollaboratorActivityLog[]>({
    queryKey: ["/api/weddings", weddingId, "collaborator-activity"],
    enabled: !!weddingId,
  });

  const { data: myPermissions } = useQuery<{ isOwner: boolean; permissions: Record<string, string> }>({
    queryKey: ["/api/weddings", weddingId, "my-permissions"],
    enabled: !!weddingId,
  });

  const initializeRolesMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/weddings/${weddingId}/initialize-roles`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weddings", weddingId, "roles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/weddings", weddingId, "collaborator-activity"] });
      toast({
        title: "Roles Initialized",
        description: "Default roles have been set up for your wedding.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const inviteMutation = useMutation({
    mutationFn: async (data: { email: string; name: string; roleId: string }) => {
      const res = await apiRequest("POST", `/api/weddings/${weddingId}/collaborators`, data);
      return res.json() as Promise<InviteResponse>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/weddings", weddingId, "collaborators"] });
      queryClient.invalidateQueries({ queryKey: ["/api/weddings", weddingId, "collaborator-activity"] });
      setLastInviteResult(data);
      toast({
        title: "Invitation Sent",
        description: `Invited ${data.email} to collaborate on your wedding.`,
      });
      setInviteEmail("");
      setInviteName("");
      setSelectedRoleId("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resendInviteMutation = useMutation({
    mutationFn: async (collaboratorId: string) => {
      const res = await apiRequest("POST", `/api/collaborators/${collaboratorId}/resend-invite`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weddings", weddingId, "collaborator-activity"] });
      toast({
        title: "Invitation Resent",
        description: "A new invitation link has been sent.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const removeCollaboratorMutation = useMutation({
    mutationFn: async (collaboratorId: string) => {
      await apiRequest("DELETE", `/api/collaborators/${collaboratorId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weddings", weddingId, "collaborators"] });
      queryClient.invalidateQueries({ queryKey: ["/api/weddings", weddingId, "collaborator-activity"] });
      toast({
        title: "Collaborator Removed",
        description: "The collaborator has been removed from your wedding.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async (data: { collaboratorId: string; roleId: string }) => {
      const res = await apiRequest("PATCH", `/api/collaborators/${data.collaboratorId}`, { roleId: data.roleId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weddings", weddingId, "collaborators"] });
      queryClient.invalidateQueries({ queryKey: ["/api/weddings", weddingId, "collaborator-activity"] });
      toast({
        title: "Role Updated",
        description: "Team member role has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createCustomRoleMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; permissions: Record<PermissionCategory, PermissionLevel> }) => {
      const res = await apiRequest("POST", `/api/weddings/${weddingId}/roles`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weddings", weddingId, "roles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/weddings", weddingId, "collaborator-activity"] });
      setIsCreateRoleOpen(false);
      setNewRoleName("");
      setNewRoleDescription("");
      setRolePermissions(defaultPermissions());
      toast({
        title: "Role Created",
        description: "Your custom role has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName) {
      toast({
        title: "Error",
        description: "Please enter a role name",
        variant: "destructive",
      });
      return;
    }
    createCustomRoleMutation.mutate({
      name: newRoleName,
      description: newRoleDescription,
      permissions: rolePermissions,
    });
  };

  const updatePermission = (category: PermissionCategory, level: PermissionLevel) => {
    setRolePermissions((prev) => ({
      ...prev,
      [category]: level,
    }));
  };

  // Edit role mutation
  const editRoleMutation = useMutation({
    mutationFn: async (data: { roleId: string; permissions: Array<{ category: string; level: string }> }) => {
      const res = await apiRequest("PATCH", `/api/roles/${data.roleId}`, { permissions: data.permissions });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weddings", weddingId, "roles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/weddings", weddingId, "collaborators"] });
      setIsEditRoleOpen(false);
      setEditingRole(null);
      toast({
        title: "Role Updated",
        description: "Role permissions have been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const openEditRole = (role: WeddingRole & { permissions?: RolePermission[] }) => {
    setEditingRole(role);
    // Initialize permissions from the role's current permissions
    const perms = defaultPermissions();
    if (role.permissions) {
      role.permissions.forEach((perm) => {
        if (perm.category in PERMISSION_CATEGORIES) {
          perms[perm.category as PermissionCategory] = perm.level as PermissionLevel;
        }
      });
    }
    setEditRolePermissions(perms);
    setIsEditRoleOpen(true);
  };

  const updateEditPermission = (category: PermissionCategory, level: PermissionLevel) => {
    setEditRolePermissions((prev) => ({
      ...prev,
      [category]: level,
    }));
  };

  const handleEditRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRole) return;
    
    // Convert permissions to array format, filtering out "none"
    const permissionsArray = Object.entries(editRolePermissions)
      .filter(([_, level]) => level !== "none")
      .map(([category, level]) => ({ category, level }));
    
    editRoleMutation.mutate({
      roleId: editingRole.id,
      permissions: permissionsArray,
    });
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !selectedRoleId) {
      toast({
        title: "Missing Information",
        description: "Please enter an email and select a role.",
        variant: "destructive",
      });
      return;
    }
    inviteMutation.mutate({ email: inviteEmail, name: inviteName, roleId: selectedRoleId });
  };

  const copyInviteLink = async () => {
    if (lastInviteResult?.inviteUrl) {
      const fullUrl = `${window.location.origin}${lastInviteResult.inviteUrl}`;
      await navigator.clipboard.writeText(fullUrl);
      toast({
        title: "Link Copied",
        description: "Invitation link copied to clipboard.",
      });
    }
  };

  const canManageCollaborators = myPermissions?.isOwner || myPermissions?.permissions?.collaborators === "manage";

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "accepted":
        return <Badge variant="outline" className="text-green-600 border-green-600"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
      case "revoked":
        return <Badge variant="outline" className="text-red-600 border-red-600"><XCircle className="w-3 h-3 mr-1" />Revoked</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    }
    return email[0].toUpperCase();
  };

  const assignableRoles = roles.filter(r => !r.isOwner);

  if (!user || !wedding) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Please log in to manage collaborators.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-6 py-8 max-w-6xl">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                Team & Collaborators
              </h1>
              <p className="text-muted-foreground">
                Invite family members, wedding planners, and helpers to collaborate on your wedding
              </p>
            </div>
          </div>

          {/* Invite Dialog moved to Step 2 */}
          {canManageCollaborators && (
            <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
              <DialogTrigger asChild style={{ display: 'none' }} />
              <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Invite a Collaborator</DialogTitle>
                    <DialogDescription>
                      Send an invitation to join your wedding planning team.
                    </DialogDescription>
                  </DialogHeader>
                  {lastInviteResult ? (
                    <div className="space-y-4 py-4">
                      <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                        <div>
                          <p className="font-medium">Invitation Created</p>
                          <p className="text-sm text-muted-foreground">Share this link with {lastInviteResult.email}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Input
                          readOnly
                          value={`${window.location.origin}${lastInviteResult.inviteUrl}`}
                          className="flex-1 text-sm"
                          data-testid="input-invite-link"
                        />
                        <Button variant="outline" size="icon" onClick={copyInviteLink} data-testid="button-copy-link">
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setLastInviteResult(null);
                            setIsInviteOpen(false);
                          }}
                          data-testid="button-close-invite"
                        >
                          Done
                        </Button>
                        <Button
                          onClick={() => setLastInviteResult(null)}
                          data-testid="button-invite-another"
                        >
                          Invite Another
                        </Button>
                      </DialogFooter>
                    </div>
                  ) : (
                    <form onSubmit={handleInvite}>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="collaborator@example.com"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            required
                            data-testid="input-invite-email"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="name">Name (Optional)</Label>
                          <Input
                            id="name"
                            placeholder="Their name"
                            value={inviteName}
                            onChange={(e) => setInviteName(e.target.value)}
                            data-testid="input-invite-name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="role">Role</Label>
                          {assignableRoles.length === 0 ? (
                            <div className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
                              <p>No roles available. Initialize default roles first.</p>
                              <Button
                                type="button"
                                variant="ghost"
                                className="p-0 h-auto text-primary hover:text-primary/80"
                                onClick={() => initializeRolesMutation.mutate()}
                                disabled={initializeRolesMutation.isPending}
                              >
                                {initializeRolesMutation.isPending ? "Initializing..." : "Initialize Roles"}
                              </Button>
                            </div>
                          ) : (
                            <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                              <SelectTrigger data-testid="select-invite-role">
                                <SelectValue placeholder="Select a role" />
                              </SelectTrigger>
                              <SelectContent>
                                {assignableRoles.map((role) => (
                                  <SelectItem key={role.id} value={role.id}>
                                    <div className="flex flex-col">
                                      <span>{role.displayName}</span>
                                      {role.description && (
                                        <span className="text-xs text-muted-foreground">{role.description}</span>
                                      )}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsInviteOpen(false)}
                          data-testid="button-cancel-invite"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={inviteMutation.isPending || assignableRoles.length === 0}
                          data-testid="button-send-invite"
                        >
                          {inviteMutation.isPending ? "Sending..." : "Send Invitation"}
                        </Button>
                      </DialogFooter>
                    </form>
                  )}
                </DialogContent>
            </Dialog>
          )}

          {/* Getting Started Guide - Clickable Steps */}
          <div className="grid md:grid-cols-4 gap-4 cursor-pointer">
            <Card 
              className={`p-6 transition-all hover-elevate ${activeTab === "roles" ? "bg-gradient-to-br from-orange-100 to-pink-100 dark:from-orange-900/40 dark:to-pink-900/40 border-orange-400 dark:border-orange-600" : "bg-gradient-to-br from-orange-50 to-pink-50 dark:from-orange-950/30 dark:to-pink-950/30 border-orange-200 dark:border-orange-800"}`}
              onClick={() => setActiveTab("roles")}
              data-testid="step-card-1"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-orange-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">1</div>
                  <span className="font-semibold">Create Job Titles</span>
                </div>
                <p className="text-sm text-muted-foreground ml-10">
                  Set up the different roles (Wedding Planner, Coordinator, etc.) with their permissions.
                </p>
              </div>
            </Card>

            <Card 
              className={`p-6 transition-all hover-elevate ${activeTab === "invite" ? "bg-gradient-to-br from-orange-100 to-pink-100 dark:from-orange-900/40 dark:to-pink-900/40 border-orange-400 dark:border-orange-600" : "bg-gradient-to-br from-orange-50 to-pink-50 dark:from-orange-950/30 dark:to-pink-950/30 border-orange-200 dark:border-orange-800"}`}
              onClick={() => setActiveTab("invite")}
              data-testid="step-card-2"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-orange-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">2</div>
                  <span className="font-semibold">Invite People</span>
                </div>
                <p className="text-sm text-muted-foreground ml-10">
                  Send invitations to family, friends, and vendors. Assign each person a job title.
                </p>
              </div>
            </Card>

            <Card 
              className={`p-6 transition-all hover-elevate ${activeTab === "manage" ? "bg-gradient-to-br from-orange-100 to-pink-100 dark:from-orange-900/40 dark:to-pink-900/40 border-orange-400 dark:border-orange-600" : "bg-gradient-to-br from-orange-50 to-pink-50 dark:from-orange-950/30 dark:to-pink-950/30 border-orange-200 dark:border-orange-800"}`}
              onClick={() => setActiveTab("manage")}
              data-testid="step-card-3"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-orange-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">3</div>
                  <span className="font-semibold">Manage</span>
                </div>
                <p className="text-sm text-muted-foreground ml-10">
                  Assign roles to team members and control what each role can do.
                </p>
              </div>
            </Card>

            <Card 
              className={`p-6 transition-all hover-elevate ${activeTab === "activity" ? "bg-gradient-to-br from-orange-100 to-pink-100 dark:from-orange-900/40 dark:to-pink-900/40 border-orange-400 dark:border-orange-600" : "bg-gradient-to-br from-orange-50 to-pink-50 dark:from-orange-950/30 dark:to-pink-950/30 border-orange-200 dark:border-orange-800"}`}
              onClick={() => setActiveTab("activity")}
              data-testid="step-card-4"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-orange-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">4</div>
                  <span className="font-semibold">Track Activity</span>
                </div>
                <p className="text-sm text-muted-foreground ml-10">
                  See all actions and changes made by your team members.
                </p>
              </div>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Tab 1: Create Job Roles */}
            <TabsContent value="roles" className="mt-6">
              <div className="space-y-8">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold">Create Job Titles
                      </h2>
                      <p className="text-base text-muted-foreground mt-2">
                        Set up job titles (Wedding Planner, Coordinator, etc.) and define what each role can see and do in different sections.
                      </p>
                    </div>
                    {canManageCollaborators && (
                      <Dialog open={isCreateRoleOpen} onOpenChange={setIsCreateRoleOpen}>
                        <DialogTrigger asChild>
                          <Button
                            className="bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700 text-base"
                            data-testid="button-create-custom-role"
                          >
                            <Plus className="w-5 h-5 mr-2" />
                            Create a Custom Job Title
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                          <form onSubmit={handleCreateRole}>
                            <DialogHeader>
                              <DialogTitle className="text-2xl">Create a New Job Title</DialogTitle>
                              <DialogDescription className="text-base">
                                Give it a name and choose what they can see and do in each section of the app.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-6 py-4">
                              <div className="space-y-2">
                                <Label htmlFor="role-name">Role Name</Label>
                                <Input
                                  id="role-name"
                                  placeholder="e.g., Wedding Coordinator, Day-of Helper"
                                  value={newRoleName}
                                  onChange={(e) => setNewRoleName(e.target.value)}
                                  data-testid="input-role-name"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="role-description">Description (optional)</Label>
                                <Input
                                  id="role-description"
                                  placeholder="What is this role responsible for?"
                                  value={newRoleDescription}
                                  onChange={(e) => setNewRoleDescription(e.target.value)}
                                  data-testid="input-role-description"
                                />
                              </div>
                              <Separator />
                              <div className="space-y-4">
                                <h4 className="font-bold text-lg">What can they see and do?</h4>
                                <p className="text-base text-muted-foreground">
                                  For each section, choose: <strong>Can't see</strong> (blocked), <strong>Can see</strong> (view only), or <strong>Can make changes</strong> (full control).
                                </p>
                                <div className="space-y-3">
                                  {Object.entries(PERMISSION_CATEGORIES).map(([key, config]) => {
                                    const category = key as PermissionCategory;
                                    const currentLevel = rolePermissions[category];
                                    return (
                                      <div
                                        key={category}
                                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                                        data-testid={`permission-row-${category}`}
                                      >
                                        <div className="flex-1">
                                          <p className="font-medium text-sm">{config.label}</p>
                                          <p className="text-xs text-muted-foreground">{config.description}</p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <Button
                                            type="button"
                                            size="sm"
                                            variant={currentLevel === "none" ? "default" : "outline"}
                                            className={`w-16 ${currentLevel === "none" ? "bg-destructive/80 hover:bg-destructive" : ""}`}
                                            onClick={() => updatePermission(category, "none")}
                                            data-testid={`button-permission-${category}-none`}
                                          >
                                            <Ban className="w-3 h-3 mr-1" />
                                            Can't See
                                          </Button>
                                          <Button
                                            type="button"
                                            size="sm"
                                            variant={currentLevel === "view" ? "default" : "outline"}
                                            className={currentLevel === "view" ? "bg-blue-600 hover:bg-blue-700" : ""}
                                            onClick={() => updatePermission(category, "view")}
                                            data-testid={`button-permission-${category}-view`}
                                          >
                                            <Eye className="w-3 h-3 mr-1" />
                                            Can See
                                          </Button>
                                          <Button
                                            type="button"
                                            size="sm"
                                            variant={currentLevel === "edit" ? "default" : "outline"}
                                            className={currentLevel === "edit" ? "bg-green-600 hover:bg-green-700" : ""}
                                            onClick={() => updatePermission(category, "edit")}
                                            data-testid={`button-permission-${category}-edit`}
                                          >
                                            <Pencil className="w-3 h-3 mr-1" />
                                            Can Change
                                          </Button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsCreateRoleOpen(false)}
                                data-testid="button-cancel-role"
                              >
                                Cancel
                              </Button>
                              <Button
                                type="submit"
                                disabled={createCustomRoleMutation.isPending || !newRoleName}
                                className="bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700"
                                data-testid="button-save-role"
                              >
                                {createCustomRoleMutation.isPending ? "Creating..." : "Create Role"}
                              </Button>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>

                  {isLoadingRoles ? (
                    <Card className="p-8 text-center">
                      <p className="text-muted-foreground">Loading roles...</p>
                    </Card>
                  ) : roles.length === 0 ? (
                    <Card className="p-8 text-center">
                      <Shield className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Roles Configured</h3>
                      <p className="text-muted-foreground mb-4">
                        Set up roles to define what team members can access and modify.
                      </p>
                      {canManageCollaborators && (
                        <Button
                          onClick={() => initializeRolesMutation.mutate()}
                          disabled={initializeRolesMutation.isPending}
                          className="bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700"
                          data-testid="button-initialize-roles"
                        >
                          {initializeRolesMutation.isPending ? "Setting Up..." : "Set Up Default Roles"}
                        </Button>
                      )}
                    </Card>
                  ) : (
                    <>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {roles.map((role) => (
                        <Card key={role.id} className={`p-4 ${role.isOwner ? 'border-primary' : ''}`} data-testid={`card-role-${role.id}`}>
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-semibold flex items-center gap-2 text-sm">
                                  {role.displayName}
                                  {role.isOwner && <Badge className="bg-primary text-xs">Owner</Badge>}
                                  {role.isSystem && !role.isOwner && <Badge variant="secondary" className="text-xs">System</Badge>}
                                  {!role.isSystem && !role.isOwner && <Badge variant="outline" className="text-xs">Custom</Badge>}
                                </h3>
                                {role.description && (
                                  <p className="text-xs text-muted-foreground mt-1">{role.description}</p>
                                )}
                              </div>
                              {!role.isOwner && canManageCollaborators && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditRole(role)}
                                  data-testid={`button-edit-role-${role.id}`}
                                >
                                  <Pencil className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                            {role.isOwner ? (
                              <div className="text-xs bg-primary/10 text-primary p-2 rounded">
                                <p className="font-medium">Full access to all sections</p>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <p className="text-xs font-medium text-muted-foreground">Access:</p>
                                <div className="space-y-1">
                                  {role.permissions && role.permissions.length > 0 ? (
                                    role.permissions.map((perm) => {
                                      const category = PERMISSION_CATEGORIES[perm.category as PermissionCategory];
                                      const levelColor = perm.level === "manage" ? "text-orange-600" : perm.level === "edit" ? "text-green-600" : perm.level === "view" ? "text-blue-600" : "text-muted-foreground";
                                      const levelLabel = perm.level === "manage" ? "Manage" : perm.level === "edit" ? "Edit" : perm.level === "view" ? "View" : "None";
                                      return perm.level !== "none" ? (
                                        <div key={perm.id} className="text-xs">
                                          <span className="text-muted-foreground">{category?.label}:</span>
                                          <span className={`font-medium ml-1 ${levelColor}`}>{levelLabel}</span>
                                        </div>
                                      ) : null;
                                    })
                                  ) : (
                                    <p className="text-xs text-muted-foreground italic">No permissions configured</p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>

                    {/* Edit Role Dialog */}
                    <Dialog open={isEditRoleOpen} onOpenChange={setIsEditRoleOpen}>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <form onSubmit={handleEditRole}>
                          <DialogHeader>
                            <DialogTitle className="text-2xl">Edit Job Title: {editingRole?.displayName}</DialogTitle>
                            <DialogDescription className="text-base">
                              Change what they can see and do in each section.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-6 py-4">
                            <div className="space-y-4">
                              <h4 className="font-bold text-lg">What can they see and do?</h4>
                              <p className="text-base text-muted-foreground">
                                For each section, choose: <strong>Can't see</strong> (blocked), <strong>Can see</strong> (view only), or <strong>Can make changes</strong> (full control).
                              </p>
                              <div className="space-y-3">
                                {Object.entries(PERMISSION_CATEGORIES).map(([key, config]) => {
                                  const category = key as PermissionCategory;
                                  const currentLevel = editRolePermissions[category];
                                  return (
                                    <div
                                      key={category}
                                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                                      data-testid={`edit-permission-row-${category}`}
                                    >
                                      <div className="flex-1">
                                        <p className="font-medium text-sm">{config.label}</p>
                                        <p className="text-xs text-muted-foreground">{config.description}</p>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant={currentLevel === "none" ? "default" : "outline"}
                                          className={`px-4 ${currentLevel === "none" ? "bg-red-600 hover:bg-red-700" : ""}`}
                                          onClick={() => updateEditPermission(category, "none")}
                                          data-testid={`edit-permission-${category}-none`}
                                        >
                                          <Ban className="w-4 h-4 mr-2" />
                                          Can't See
                                        </Button>
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant={currentLevel === "view" ? "default" : "outline"}
                                          className={currentLevel === "view" ? "bg-blue-600 hover:bg-blue-700" : ""}
                                          onClick={() => updateEditPermission(category, "view")}
                                          data-testid={`edit-permission-${category}-view`}
                                        >
                                          <Eye className="w-4 h-4 mr-2" />
                                          Can See
                                        </Button>
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant={currentLevel === "edit" ? "default" : "outline"}
                                          className={currentLevel === "edit" ? "bg-green-600 hover:bg-green-700" : ""}
                                          onClick={() => updateEditPermission(category, "edit")}
                                          data-testid={`edit-permission-${category}-edit`}
                                        >
                                          <Pencil className="w-4 h-4 mr-2" />
                                          Can Change
                                        </Button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setIsEditRoleOpen(false)}
                              data-testid="button-cancel-edit-role"
                            >
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              disabled={editRoleMutation.isPending}
                              className="bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700"
                              data-testid="button-save-edit-role"
                            >
                              {editRoleMutation.isPending ? "Saving..." : "Save Changes"}
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                    </>
                  )}
                </div>

              </div>
            </TabsContent>

            {/* Tab 2: Invite Collaborators */}
            <TabsContent value="invite" className="mt-6">
              <div className="space-y-8">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold">Invite Collaborators</h2>
                      <p className="text-base text-muted-foreground mt-2">
                        Send invitations to family, friends, and vendors to join your team.
                      </p>
                    </div>
                    {canManageCollaborators && (
                      <Button onClick={() => setIsInviteOpen(true)} className="bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700" data-testid="button-invite-collaborator">
                        <UserPlus className="w-4 h-4 mr-2" />
                        Invite Collaborator
                      </Button>
                    )}
                  </div>

                  {/* Show Pending Invitations */}
                  {isLoadingCollaborators ? (
                    <Card className="p-8 text-center">
                      <p className="text-muted-foreground">Loading invitations...</p>
                    </Card>
                  ) : (
                    <>
                      {collaborators.filter(c => c.status === "pending").length === 0 ? (
                        <Card className="p-8 text-center">
                          <Mail className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                          <h3 className="text-lg font-semibold mb-2">No Pending Invitations</h3>
                          <p className="text-muted-foreground">
                            You haven't sent any invitations yet. Click the button above to invite your first team member!
                          </p>
                        </Card>
                      ) : (
                        <div className="space-y-4">
                          <h3 className="font-semibold text-lg flex items-center gap-2">
                            <Clock className="w-5 h-5 text-orange-600" />
                            Pending Invitations ({collaborators.filter(c => c.status === "pending").length})
                          </h3>
                          {collaborators.filter(c => c.status === "pending").map((collab) => (
                            <Card key={collab.id} className="p-4" data-testid={`card-pending-invite-${collab.id}`}>
                              <div className="space-y-4">
                                <div className="flex items-start gap-4">
                                  <Avatar className="h-12 w-12">
                                    <AvatarFallback className="bg-gradient-to-br from-orange-100 to-pink-100 text-orange-700">
                                      {getInitials(collab.displayName, collab.email)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h3 className="font-semibold truncate">
                                        {collab.displayName || collab.email}
                                      </h3>
                                      <Badge variant="outline" className="bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800 text-xs">
                                        <Clock className="w-3 h-3 mr-1" />
                                        Awaiting Response
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <Mail className="w-3 h-3" />
                                      <span className="truncate">{collab.email}</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground block mt-1">
                                      Role: {collab.role?.displayName || "Not Assigned"}
                                    </span>
                                    <span className="text-xs text-muted-foreground block">
                                      Invited {new Date(collab.invitedAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                  {canManageCollaborators && (
                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => resendInviteMutation.mutate(collab.id)}
                                        disabled={resendInviteMutation.isPending}
                                        data-testid={`button-resend-pending-${collab.id}`}
                                      >
                                        <RefreshCw className="w-3 h-3 mr-1" />
                                        Resend
                                      </Button>
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-destructive hover:text-destructive"
                                            data-testid={`button-remove-pending-${collab.id}`}
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>Cancel Invitation</AlertDialogTitle>
                                            <AlertDialogDescription>
                                              Are you sure you want to cancel the invitation to {collab.displayName || collab.email}?
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>Keep Invitation</AlertDialogCancel>
                                            <AlertDialogAction
                                              onClick={() => removeCollaboratorMutation.mutate(collab.id)}
                                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                            >
                                              Cancel Invitation
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  {/* Show Accepted Invitations */}
                  {isLoadingCollaborators ? null : (
                    <>
                      {collaborators.filter(c => c.status === "accepted").length > 0 && (
                        <div className="space-y-4 mt-8 pt-8 border-t">
                          <h3 className="font-semibold text-lg flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            Active Team Members ({collaborators.filter(c => c.status === "accepted").length})
                          </h3>
                          {collaborators.filter(c => c.status === "accepted").map((collab) => (
                            <Card key={collab.id} className="p-4" data-testid={`card-accepted-invite-${collab.id}`}>
                              <div className="space-y-4">
                                <div className="flex items-start gap-4">
                                  <Avatar className="h-12 w-12">
                                    <AvatarFallback className="bg-gradient-to-br from-green-100 to-emerald-100 text-green-700">
                                      {getInitials(collab.displayName, collab.email)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h3 className="font-semibold truncate">
                                        {collab.displayName || collab.email}
                                      </h3>
                                      <Badge variant="outline" className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 text-xs">
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                        Active
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <Mail className="w-3 h-3" />
                                      <span className="truncate">{collab.email}</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground block mt-1">
                                      Role: {collab.role?.displayName || "Not Assigned"}
                                    </span>
                                    <span className="text-xs text-muted-foreground block">
                                      Joined {new Date(collab.invitedAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                  {canManageCollaborators && (
                                    <div className="flex items-center gap-2">
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-destructive hover:text-destructive"
                                            data-testid={`button-remove-accepted-${collab.id}`}
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
                                            <AlertDialogDescription>
                                              Are you sure you want to remove {collab.displayName || collab.email} from your wedding team? They will no longer have access.
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>Keep Member</AlertDialogCancel>
                                            <AlertDialogAction
                                              onClick={() => removeCollaboratorMutation.mutate(collab.id)}
                                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                            >
                                              Remove
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>

              </div>
            </TabsContent>

            {/* Tab 3: Manage Permissions */}
            <TabsContent value="manage" className="mt-6">
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Manage Permissions</h2>
                  <p className="text-base text-muted-foreground mb-6">
                    Edit job titles to control what each role can see and do. View accepted invitations and manage your team members.
                  </p>
                  {isLoadingCollaborators ? (
                    <Card className="p-8 text-center">
                      <p className="text-muted-foreground">Loading team members...</p>
                    </Card>
                  ) : collaborators.length === 0 ? (
                    <Card className="p-8 text-center">
                      <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Team Members Yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Invite family members, planners, or helpers to join your wedding planning team.
                      </p>
                      {canManageCollaborators && (
                        <Button
                          onClick={() => setIsInviteOpen(true)}
                          className="bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700"
                          data-testid="button-invite-first"
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          Invite Your First Team Member
                        </Button>
                      )}
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {collaborators.map((collab) => (
                        <Card key={collab.id} className="p-4" data-testid={`card-collaborator-${collab.id}`}>
                          <div className="space-y-4">
                            <div className="flex items-start gap-4">
                              <Avatar className="h-12 w-12">
                                <AvatarFallback className="bg-gradient-to-br from-orange-100 to-pink-100 text-orange-700">
                                  {getInitials(collab.displayName, collab.email)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold truncate">
                                    {collab.displayName || collab.email}
                                  </h3>
                                  {getStatusBadge(collab.status)}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Mail className="w-3 h-3" />
                                  <span className="truncate">{collab.email}</span>
                                </div>
                                <span className="text-xs text-muted-foreground block mt-1">
                                  Invited {new Date(collab.invitedAt).toLocaleDateString()}
                                </span>
                              </div>
                              {canManageCollaborators && (
                                <div className="flex items-center gap-2">
                                  {collab.status === "pending" && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => resendInviteMutation.mutate(collab.id)}
                                      disabled={resendInviteMutation.isPending}
                                      data-testid={`button-resend-${collab.id}`}
                                    >
                                      <RefreshCw className="w-3 h-3 mr-1" />
                                      Resend
                                    </Button>
                                  )}
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-destructive hover:text-destructive"
                                        data-testid={`button-remove-${collab.id}`}
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to remove {collab.displayName || collab.email} from your wedding team?
                                          They will lose all access to your wedding planning.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => removeCollaboratorMutation.mutate(collab.id)}
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                          Remove
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              )}
                            </div>

                            {/* Role and Access Section */}
                            <div className="border-t pt-3 space-y-3">
                              <div className="flex items-center justify-between">
                                <label className="text-sm font-medium">Role</label>
                                {canManageCollaborators ? (
                                  <Select 
                                    value={collab.role.id}
                                    onValueChange={(newRoleId) => updateRoleMutation.mutate({ collaboratorId: collab.id, roleId: newRoleId })}
                                    disabled={updateRoleMutation.isPending}
                                  >
                                    <SelectTrigger className="w-40" data-testid={`select-role-${collab.id}`}>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {assignableRoles.map((role) => (
                                        <SelectItem key={role.id} value={role.id}>
                                          {role.displayName}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <Badge variant="secondary" className="text-xs">
                                    {collab.role.displayName}
                                  </Badge>
                                )}
                              </div>

                              {/* Access Display */}
                              <div className="bg-muted/50 rounded-lg p-3">
                                <p className="text-xs font-medium mb-2 text-muted-foreground">Access to:</p>
                                <div className="space-y-1">
                                  {collab.permissions && collab.permissions.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                      {collab.permissions.map((perm) => {
                                        const category = PERMISSION_CATEGORIES[perm.category as PermissionCategory];
                                        const levelColor = perm.level === "manage" ? "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-200" : perm.level === "edit" ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-200" : perm.level === "view" ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-200" : "hidden";
                                        return perm.level !== "none" ? (
                                          <Badge key={perm.id} variant="outline" className={`text-xs py-0.5 ${levelColor}`}>
                                            {category?.label}
                                          </Badge>
                                        ) : null;
                                      })}
                                    </div>
                                  ) : (
                                    <p className="text-xs text-muted-foreground italic">No permissions configured for this role</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>


            {/* Tab 4: Activity */}
            <TabsContent value="activity" className="mt-6">
              <Card className="p-4">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <History className="w-4 h-4" />
                  Recent Activity
                </h3>
                <Separator className="mb-4" />
                {activity.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No activity recorded yet.
                  </p>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {activity.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                          data-testid={`activity-${item.id}`}
                        >
                          <div className="p-1.5 rounded-full bg-background">
                            {item.action === "invited" && <UserPlus className="w-3 h-3 text-blue-500" />}
                            {item.action === "accepted_invite" && <CheckCircle className="w-3 h-3 text-green-500" />}
                            {item.action === "removed" && <XCircle className="w-3 h-3 text-red-500" />}
                            {item.action === "role_created" && <Shield className="w-3 h-3 text-purple-500" />}
                            {item.action === "invite_resent" && <RefreshCw className="w-3 h-3 text-yellow-500" />}
                            {item.action === "suggestion_approved" && <CheckCircle className="w-3 h-3 text-green-600" />}
                            {item.action === "guest_restored" && <RefreshCw className="w-3 h-3 text-blue-600" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm">
                              {item.action === "invited" && (
                                <>
                                  Invited <span className="font-medium">{(item.details as any)?.email || "collaborator"}</span>
                                  {(item.details as any)?.roleName && (
                                    <> as <span className="font-medium">{(item.details as any).roleName}</span></>
                                  )}
                                </>
                              )}
                              {item.action === "accepted_invite" && (
                                <>
                                  <span className="font-medium">{(item.details as any)?.email || "Collaborator"}</span> accepted invitation
                                </>
                              )}
                              {item.action === "removed" && (
                                <>
                                  Removed <span className="font-medium">{(item.details as any)?.email || "collaborator"}</span>
                                </>
                              )}
                              {item.action === "role_created" && (
                                <>
                                  Created role <span className="font-medium">"{(item.details as any)?.roleName || "Custom Role"}"</span>
                                </>
                              )}
                              {item.action === "invite_resent" && (
                                <>
                                  Resent invitation to <span className="font-medium">{(item.details as any)?.email || "collaborator"}</span>
                                </>
                              )}
                              {item.action === "suggestion_approved" && (
                                <>
                                  Approved suggestion for <span className="font-medium">{(item.details as any)?.guestName || "guest"}</span>
                                  {(item.details as any)?.events && (
                                    <> at <span className="font-medium">{Array.isArray((item.details as any).events) ? (item.details as any).events.join(", ") : (item.details as any).events}</span></>
                                  )}
                                </>
                              )}
                              {item.action === "guest_restored" && (
                                <>
                                  Restored <span className="font-medium">{(item.details as any)?.guestName || "guest"}</span> to guest list
                                  {(item.details as any)?.events && (
                                    <> for <span className="font-medium">{Array.isArray((item.details as any).events) ? (item.details as any).events.join(", ") : (item.details as any).events}</span></>
                                  )}
                                </>
                              )}
                              {!["invited", "accepted_invite", "removed", "role_created", "invite_resent", "suggestion_approved", "guest_restored"].includes(item.action) && (
                                <span className="capitalize">{item.action.replace(/_/g, " ")}</span>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(item.performedAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
