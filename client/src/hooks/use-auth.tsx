import { createContext, useContext, ReactNode } from "react";
import { useQuery, useMutation, type UseQueryResult } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";

type User = {
  id: string; // UUID string from varchar column
  email: string;
  role: "couple" | "vendor";
  emailVerified: boolean;
  isSiteAdmin?: boolean;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => void;
  refetchUser: UseQueryResult<{ user: User | null } | null, Error>["refetch"];
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode}) {
  const [, setLocation] = useLocation();

  const {
    data: authResponse,
    isLoading,
    refetch: refetchUser,
  } = useQuery<{ user: User | null } | null>({
    queryKey: ["/api/auth/me"],
    retry: false,
    staleTime: 0, // Always fetch fresh user data
  });

  // Extract user from response (backend returns { user: {...} } or { user: null })
  const user = authResponse?.user ?? null;

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.clear();
      setLocation("/login");
    },
  });

  const logout = () => {
    logoutMutation.mutate();
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        logout,
        refetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
