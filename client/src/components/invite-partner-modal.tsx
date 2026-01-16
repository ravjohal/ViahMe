import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Heart,
  Mail,
  Shield,
  CheckCircle,
  Copy,
  Send,
  ChevronDown,
  ChevronUp,
  Users,
  ExternalLink,
} from "lucide-react";
import { useLocation } from "wouter";
import { PERMISSION_CATEGORIES, type PermissionCategory } from "@shared/schema";
import type { WeddingRole, RolePermission } from "@shared/schema";

type PermissionLevel = "none" | "view" | "edit" | "manage";

interface InviteResponse {
  id: string;
  email: string;
  inviteToken: string;
  inviteUrl: string;
  weddingTitle: string;
}

interface InvitePartnerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  weddingId: string;
  partnerName?: string;
}

const defaultFullAccess = (): Record<PermissionCategory, PermissionLevel> => {
  const perms: Partial<Record<PermissionCategory, PermissionLevel>> = {};
  Object.keys(PERMISSION_CATEGORIES).forEach((key) => {
    const category = PERMISSION_CATEGORIES[key as PermissionCategory];
    const maxLevel = category.permissions[category.permissions.length - 1];
    perms[key as PermissionCategory] = maxLevel as PermissionLevel;
  });
  return perms as Record<PermissionCategory, PermissionLevel>;
};

export function InvitePartnerModal({
  open,
  onOpenChange,
  weddingId,
  partnerName,
}: InvitePartnerModalProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [showPermissions, setShowPermissions] = useState(false);
  const [permissions, setPermissions] = useState<Record<PermissionCategory, PermissionLevel>>(defaultFullAccess());
  const [inviteResult, setInviteResult] = useState<InviteResponse | null>(null);

  const { data: roles = [] } = useQuery<(WeddingRole & { permissions?: RolePermission[] })[]>({
    queryKey: ["/api/weddings", weddingId, "roles"],
    enabled: !!weddingId,
  });

  const partnerRole = roles.find(r => r.name === "partner" || r.displayName === "Partner");

  // Preload existing permissions when partner role exists
  useEffect(() => {
    if (partnerRole?.permissions && partnerRole.permissions.length > 0) {
      const existingPerms = { ...defaultFullAccess() };
      Object.keys(existingPerms).forEach((key) => {
        existingPerms[key as PermissionCategory] = "none";
      });
      partnerRole.permissions.forEach((p) => {
        if (p.category in existingPerms) {
          existingPerms[p.category as PermissionCategory] = p.level as PermissionLevel;
        }
      });
      setPermissions(existingPerms);
    }
  }, [partnerRole]);

  const createPartnerRoleMutation = useMutation({
    mutationFn: async () => {
      // Create role with permissions in one atomic request
      const permissionsArray = Object.entries(permissions)
        .filter(([_, level]) => level !== "none")
        .map(([category, level]) => ({ category, level }));
      
      const roleRes = await apiRequest("POST", `/api/weddings/${weddingId}/roles`, {
        name: "partner",
        displayName: "Partner",
        description: "Your partner with full access to plan the wedding together",
        isSystem: true,
        permissions: permissionsArray,
      });
      
      // Read the response text first to debug
      const responseText = await roleRes.text();
      
      if (!roleRes.ok) {
        let errorMessage = "Failed to create partner role";
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          console.error("[createPartnerRole] Non-JSON error response:", responseText.substring(0, 200));
        }
        throw new Error(errorMessage);
      }
      
      try {
        return JSON.parse(responseText);
      } catch (e) {
        console.error("[createPartnerRole] Failed to parse response:", responseText.substring(0, 200));
        throw new Error("Invalid response from server");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weddings", weddingId, "roles"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create partner role",
        variant: "destructive",
      });
    },
  });

  const updateRolePermissionsMutation = useMutation({
    mutationFn: async (roleId: string) => {
      // Use PATCH with permissions array for atomic update
      const permissionsArray = Object.entries(permissions)
        .filter(([_, level]) => level !== "none")
        .map(([category, level]) => ({ category, level }));
      
      const res = await apiRequest("PATCH", `/api/roles/${roleId}`, {
        permissions: permissionsArray,
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Failed to update permissions" }));
        throw new Error(errorData.error || "Failed to update permissions");
      }
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weddings", weddingId, "roles"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update permissions",
        variant: "destructive",
      });
    },
  });

  const inviteMutation = useMutation({
    mutationFn: async (data: { email: string; roleId: string }) => {
      const res = await apiRequest("POST", `/api/weddings/${weddingId}/collaborators`, {
        email: data.email,
        name: partnerName || "Partner",
        roleId: data.roleId,
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Failed to send invitation" }));
        throw new Error(errorData.error || "Failed to send invitation");
      }
      
      return res.json() as Promise<InviteResponse>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/weddings", weddingId, "collaborators"] });
      setInviteResult(data);
      toast({
        title: "Invitation Sent!",
        description: `An invite has been sent to ${data.email}`,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[InvitePartnerModal] handleSubmit called");
    
    if (!email.trim()) {
      console.log("[InvitePartnerModal] No email provided");
      toast({
        title: "Email Required",
        description: "Please enter your partner's email address.",
        variant: "destructive",
      });
      return;
    }

    try {
      let roleId = partnerRole?.id;
      
      if (!roleId) {
        const newRole = await createPartnerRoleMutation.mutateAsync();
        if (!newRole || !newRole.id) {
          throw new Error("Role created but no ID returned");
        }
        roleId = newRole.id;
      } else {
        await updateRolePermissionsMutation.mutateAsync(roleId);
      }

      if (!roleId) {
        throw new Error("No role ID available to send invitation");
      }

      await inviteMutation.mutateAsync({ email: email.trim(), roleId });
    } catch (error: any) {
      console.error("[InvitePartnerModal] Error:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to send invitation. Please try again.",
        variant: "destructive",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/weddings", weddingId, "roles"] });
    }
  };

  const copyInviteLink = async () => {
    if (inviteResult?.inviteUrl) {
      const fullUrl = `${window.location.origin}${inviteResult.inviteUrl}`;
      await navigator.clipboard.writeText(fullUrl);
      toast({
        title: "Link Copied",
        description: "Invitation link copied to clipboard.",
      });
    }
  };

  const handleClose = () => {
    setEmail("");
    setInviteResult(null);
    setShowPermissions(false);
    // Don't reset permissions on close - preserve user's selections
    // Permissions will be reset via useEffect when partnerRole changes or when modal opens fresh
    onOpenChange(false);
  };

  const updatePermission = (category: PermissionCategory, enabled: boolean) => {
    const categoryConfig = PERMISSION_CATEGORIES[category];
    const maxLevel = categoryConfig.permissions[categoryConfig.permissions.length - 1];
    setPermissions(prev => ({
      ...prev,
      [category]: enabled ? maxLevel : "none",
    }));
  };

  const allPermissionsEnabled = Object.values(permissions).every(level => level !== "none");

  if (inviteResult) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md p-0 gap-0">
          <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle>Invitation Sent!</DialogTitle>
                <DialogDescription>Your partner has been invited</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="p-6 space-y-4">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                We've sent an invitation to:
              </p>
              <p className="font-semibold text-lg">{inviteResult.email}</p>
            </div>
            
            <Separator />
            
            <div className="rounded-lg border bg-blue-50 dark:bg-blue-950/30 p-3 space-y-1">
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Track invitation status
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                You can view and manage all pending invitations on the Teams page under "Invited People".
              </p>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                Or share this link directly
              </Label>
              <div className="flex gap-2">
                <Input
                  value={`${window.location.origin}${inviteResult.inviteUrl}`}
                  readOnly
                  className="text-sm font-mono"
                  data-testid="input-invite-link"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyInviteLink}
                  data-testid="button-copy-invite-link"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
          
          <DialogFooter className="px-6 py-4 border-t bg-muted/30 flex-col gap-2">
            <Button
              variant="outline"
              onClick={() => {
                handleClose();
                setLocation("/team#invited");
              }}
              className="w-full"
              data-testid="button-view-on-teams"
            >
              <Users className="w-4 h-4 mr-2" />
              View on Teams Page
              <ExternalLink className="w-3 h-3 ml-2" />
            </Button>
            <Button onClick={handleClose} className="w-full" data-testid="button-done">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle>Invite Your Partner</DialogTitle>
              <DialogDescription>
                Plan your wedding together
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="partner-email" className="text-xs uppercase tracking-wide text-muted-foreground">
                Partner's Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="partner-email"
                  type="email"
                  placeholder="partner@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  data-testid="input-partner-email"
                />
              </div>
            </div>
            
            <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-pink-600" />
                  <span className="font-medium">Partner Role</span>
                </div>
                <Badge variant="secondary" className="bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300">
                  Full Access
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Your partner will have full access to plan the wedding with you.
              </p>
              
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowPermissions(!showPermissions)}
                className="w-full justify-between text-muted-foreground hover:text-foreground"
                data-testid="button-customize-access"
              >
                <span>Customize access levels</span>
                {showPermissions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>
            
            {showPermissions && (
              <ScrollArea className="h-64 rounded-lg border p-4">
                <div className="space-y-4">
                  {Object.entries(PERMISSION_CATEGORIES).map(([key, config]) => (
                    <div key={key} className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="font-medium">{config.label}</Label>
                        <p className="text-xs text-muted-foreground">{config.description}</p>
                      </div>
                      <Switch
                        checked={permissions[key as PermissionCategory] !== "none"}
                        onCheckedChange={(checked) => updatePermission(key as PermissionCategory, checked)}
                        data-testid={`switch-permission-${key}`}
                      />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
          
          <DialogFooter className="px-6 py-4 border-t bg-muted/30">
            <Button
              type="submit"
              disabled={inviteMutation.isPending || createPartnerRoleMutation.isPending || updateRolePermissionsMutation.isPending}
              className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
              data-testid="button-send-partner-invite"
            >
              <Send className="w-4 h-4 mr-2" />
              {inviteMutation.isPending || createPartnerRoleMutation.isPending || updateRolePermissionsMutation.isPending
                ? "Sending..."
                : "Send Invitation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
