import { createContext, useContext, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./use-auth";
import type { Wedding } from "@shared/schema";
import { PERMISSION_CATEGORIES, type PermissionCategory } from "@shared/schema";

type PermissionLevel = "view" | "edit" | "manage" | "none";

interface PermissionsContextType {
  isOwner: boolean;
  permissions: Record<string, PermissionLevel>;
  hasPermission: (category: PermissionCategory, requiredLevel?: PermissionLevel) => boolean;
  canView: (category: PermissionCategory) => boolean;
  canEdit: (category: PermissionCategory) => boolean;
  canManage: (category: PermissionCategory) => boolean;
  isLoading: boolean;
  weddingId: string | null;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const { data: weddings = [], isLoading: isLoadingWeddings } = useQuery<Wedding[]>({
    queryKey: ["/api/weddings"],
    enabled: !!user,
  });

  const wedding = weddings[0];
  const weddingId = wedding?.id ?? null;

  const { data: myPermissions, isLoading: isLoadingPermissions } = useQuery<{
    isOwner: boolean;
    permissions: Record<string, string>;
  }>({
    queryKey: ["/api/weddings", weddingId, "my-permissions"],
    enabled: !!weddingId,
  });

  const isOwner = myPermissions?.isOwner ?? false;
  const permissions = (myPermissions?.permissions ?? {}) as Record<string, PermissionLevel>;

  const hasPermission = (category: PermissionCategory, requiredLevel: PermissionLevel = "view"): boolean => {
    if (isOwner) return true;
    
    const userLevel = permissions[category];
    if (!userLevel || userLevel === "none") return false;
    
    const levelHierarchy: PermissionLevel[] = ["view", "edit", "manage"];
    const userLevelIndex = levelHierarchy.indexOf(userLevel);
    const requiredLevelIndex = levelHierarchy.indexOf(requiredLevel);
    
    return userLevelIndex >= requiredLevelIndex;
  };

  const canView = (category: PermissionCategory): boolean => hasPermission(category, "view");
  const canEdit = (category: PermissionCategory): boolean => hasPermission(category, "edit");
  const canManage = (category: PermissionCategory): boolean => hasPermission(category, "manage");

  return (
    <PermissionsContext.Provider
      value={{
        isOwner,
        permissions,
        hasPermission,
        canView,
        canEdit,
        canManage,
        isLoading: isLoadingWeddings || isLoadingPermissions,
        weddingId,
      }}
    >
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error("usePermissions must be used within a PermissionsProvider");
  }
  return context;
}
