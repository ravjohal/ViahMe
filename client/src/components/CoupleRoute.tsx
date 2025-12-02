import { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldOff, Lock, Home } from "lucide-react";
import { Link } from "wouter";

interface CoupleRouteProps {
  children: ReactNode;
}

function AccessDenied() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <Card className="p-8 max-w-md text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <ShieldOff className="w-8 h-8 text-destructive" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Couples Only</h2>
        <p className="text-muted-foreground mb-6">
          This feature is only available to couples planning their wedding.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/dashboard">
            <Button data-testid="button-go-dashboard">
              <Home className="w-4 h-4 mr-2" />
              Dashboard
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
        <p className="text-muted-foreground">Verifying access...</p>
      </div>
    </div>
  );
}

export function CoupleRoute({ children }: CoupleRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingState />;
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  if (user.role === "vendor") {
    return <AccessDenied />;
  }

  return <>{children}</>;
}
