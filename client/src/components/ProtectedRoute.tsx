import { ReactNode } from "react";
import { usePermissions } from "@/hooks/use-permissions";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldOff, Lock, Home } from "lucide-react";
import { Link } from "wouter";
import type { PermissionCategory } from "@shared/schema";

type PermissionLevel = "view" | "edit" | "manage";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermission?: PermissionCategory;
  requiredLevel?: PermissionLevel;
  fallback?: ReactNode;
}

function AccessDenied({ message }: { message?: string }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <Card className="p-8 max-w-md text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <ShieldOff className="w-8 h-8 text-destructive" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
        <p className="text-muted-foreground mb-6">
          {message || "You don't have permission to access this section."}
        </p>
        <Link href="/">
          <Button variant="outline" data-testid="button-go-home">
            <Home className="w-4 h-4 mr-2" />
            Return to Dashboard
          </Button>
        </Link>
      </Card>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <Lock className="w-8 h-8 mx-auto mb-4 text-muted-foreground animate-pulse" />
        <p className="text-muted-foreground">Checking permissions...</p>
      </div>
    </div>
  );
}

export function ProtectedRoute({
  children,
  requiredPermission,
  requiredLevel = "view",
  fallback,
}: ProtectedRouteProps) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { hasPermission, isOwner, isLoading: isPermissionsLoading } = usePermissions();

  if (isAuthLoading) {
    return <LoadingState />;
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  if (!requiredPermission) {
    return <>{children}</>;
  }

  if (isPermissionsLoading) {
    return <LoadingState />;
  }

  if (isOwner) {
    return <>{children}</>;
  }

  if (!hasPermission(requiredPermission, requiredLevel)) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return <AccessDenied />;
  }

  return <>{children}</>;
}

export function RequirePermission({
  children,
  permission,
  level = "view",
  fallback = null,
}: {
  children: ReactNode;
  permission: PermissionCategory;
  level?: PermissionLevel;
  fallback?: ReactNode;
}) {
  const { hasPermission, isOwner, isLoading } = usePermissions();

  if (isLoading) {
    return null;
  }

  if (isOwner || hasPermission(permission, level)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

export function RequireEdit({
  children,
  permission,
  fallback = null,
}: {
  children: ReactNode;
  permission: PermissionCategory;
  fallback?: ReactNode;
}) {
  return (
    <RequirePermission permission={permission} level="edit" fallback={fallback}>
      {children}
    </RequirePermission>
  );
}

export function RequireView({
  children,
  permission,
  fallback = null,
}: {
  children: ReactNode;
  permission: PermissionCategory;
  fallback?: ReactNode;
}) {
  return (
    <RequirePermission permission={permission} level="view" fallback={fallback}>
      {children}
    </RequirePermission>
  );
}
