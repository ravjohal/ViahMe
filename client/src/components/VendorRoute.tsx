import { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldOff, Lock, Home } from "lucide-react";
import { Link } from "wouter";

interface VendorRouteProps {
  children: ReactNode;
}

function AccessDenied() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <Card className="p-8 max-w-md text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <ShieldOff className="w-8 h-8 text-destructive" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Vendor Access Required</h2>
        <p className="text-muted-foreground mb-6">
          This page is only accessible to registered vendors.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/vendor-login">
            <Button data-testid="button-vendor-login">
              Vendor Login
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" data-testid="button-go-home">
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <Lock className="w-8 h-8 mx-auto mb-4 text-muted-foreground animate-pulse" />
        <p className="text-muted-foreground">Verifying vendor access...</p>
      </div>
    </div>
  );
}

export function VendorRoute({ children }: VendorRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingState />;
  }

  if (!user) {
    return <Redirect to="/vendor-login" />;
  }

  if (user.role !== "vendor") {
    return <AccessDenied />;
  }

  return <>{children}</>;
}
