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
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [lastInviteResult, setLastInviteResult] = useState<InviteResponse | null>(null);
  
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");
  const [rolePermissions, setRolePermissions] = useState<Record<PermissionCategory, PermissionLevel>>(defaultPermissions());

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

  const { data: roles = [], isLoading: isLoadingRoles } = useQuery<WeddingRole[]>({
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
            {canManageCollaborators && (
              <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700" data-testid="button-invite-collaborator">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Invite Collaborator
                  </Button>
                </DialogTrigger>
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
          </div>

          <Tabs defaultValue="collaborators" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="collaborators" data-testid="tab-collaborators">
                <Users className="w-4 h-4 mr-2" />
                Team
              </TabsTrigger>
              <TabsTrigger value="roles" data-testid="tab-roles">
                <Shield className="w-4 h-4 mr-2" />
                Roles
              </TabsTrigger>
              <TabsTrigger value="activity" data-testid="tab-activity">
                <History className="w-4 h-4 mr-2" />
                Activity
              </TabsTrigger>
            </TabsList>

            <TabsContent value="collaborators" className="mt-6">
              {isLoadingCollaborators ? (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">Loading collaborators...</p>
                </Card>
              ) : collaborators.length === 0 ? (
                <Card className="p-8 text-center">
                  <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Collaborators Yet</h3>
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
                      Invite Your First Collaborator
                    </Button>
                  )}
                </Card>
              ) : (
                <div className="space-y-4">
                  {collaborators.map((collab) => (
                    <Card key={collab.id} className="p-4" data-testid={`card-collaborator-${collab.id}`}>
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-gradient-to-br from-orange-100 to-pink-100 text-orange-700">
                            {getInitials(collab.displayName, collab.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold truncate">
                              {collab.displayName || collab.email}
                            </h3>
                            {getStatusBadge(collab.status)}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="w-3 h-3" />
                            <span className="truncate">{collab.email}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {collab.role.displayName}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              Invited {new Date(collab.invitedAt).toLocaleDateString()}
                            </span>
                          </div>
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
                                  <AlertDialogTitle>Remove Collaborator</AlertDialogTitle>
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
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="roles" className="mt-6">
              {isLoadingRoles ? (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">Loading roles...</p>
                </Card>
              ) : roles.length === 0 ? (
                <Card className="p-8 text-center">
                  <Shield className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Roles Configured</h3>
                  <p className="text-muted-foreground mb-4">
                    Set up roles to define what collaborators can access and modify.
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
                <div className="space-y-4">
                  {canManageCollaborators && (
                    <div className="flex justify-end">
                      <Dialog open={isCreateRoleOpen} onOpenChange={setIsCreateRoleOpen}>
                        <DialogTrigger asChild>
                          <Button
                            className="bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700"
                            data-testid="button-create-custom-role"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Create Custom Role
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                          <form onSubmit={handleCreateRole}>
                            <DialogHeader>
                              <DialogTitle>Create Custom Role</DialogTitle>
                              <DialogDescription>
                                Define a custom role with specific permissions for each module.
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
                                <h4 className="font-semibold">Module Permissions</h4>
                                <p className="text-sm text-muted-foreground">
                                  Set access level for each module. "None" means no access, "View" allows read-only access, "Edit" allows full modification.
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
                                            None
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
                                            View
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
                                            Edit
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
                    </div>
                  )}
                  <div className="grid gap-4 md:grid-cols-2">
                    {roles.map((role) => (
                      <Card key={role.id} className={`p-4 ${role.isOwner ? 'border-primary' : ''}`} data-testid={`card-role-${role.id}`}>
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold flex items-center gap-2">
                              {role.displayName}
                              {role.isOwner && <Badge className="bg-primary">Owner</Badge>}
                              {role.isSystem && !role.isOwner && <Badge variant="secondary">System</Badge>}
                              {!role.isSystem && !role.isOwner && <Badge variant="outline">Custom</Badge>}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">{role.description}</p>
                          </div>
                        </div>
                        {role.isOwner ? (
                          <div className="text-xs text-muted-foreground">
                            <p className="font-medium">Full access to all features</p>
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground">
                            <p className="font-medium mb-1">Permissions configured</p>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

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
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm">
                              {item.action === "invited" && "New collaborator invited"}
                              {item.action === "accepted_invite" && "Invitation accepted"}
                              {item.action === "removed" && "Collaborator removed"}
                              {item.action === "role_created" && "New role created"}
                              {item.action === "invite_resent" && "Invitation resent"}
                              {!["invited", "accepted_invite", "removed", "role_created", "invite_resent"].includes(item.action) && item.action}
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
