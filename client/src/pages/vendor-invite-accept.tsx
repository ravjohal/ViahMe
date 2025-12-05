import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, CheckCircle, XCircle, UserPlus } from "lucide-react";
import viahLogo from "@assets/viah-logo_1763669612969.png";

export default function VendorInviteAccept() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [token, setToken] = useState<string | null>(null);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get("token");
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setError("Invalid invitation link");
    }
  }, []);

  const acceptMutation = useMutation({
    mutationFn: async (data: { token: string; password?: string; name?: string }) => {
      return apiRequest("/api/vendor-teammates/accept", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (response: any) => {
      toast({
        title: "Invitation accepted!",
        description: "You're now part of the vendor team.",
      });
      setLocation("/vendor-dashboard");
    },
    onError: (error: any) => {
      if (error.needsPassword) {
        setNeedsPassword(true);
        setEmail(error.email || "");
      } else {
        setError(error.message || "Failed to accept invitation");
      }
    },
  });

  const handleAccept = () => {
    if (!token) return;

    if (needsPassword) {
      if (password !== confirmPassword) {
        toast({
          title: "Passwords don't match",
          description: "Please make sure your passwords match.",
          variant: "destructive",
        });
        return;
      }
      if (password.length < 6) {
        toast({
          title: "Password too short",
          description: "Password must be at least 6 characters.",
          variant: "destructive",
        });
        return;
      }
      acceptMutation.mutate({ token, password, name: name || undefined });
    } else {
      acceptMutation.mutate({ token });
    }
  };

  useEffect(() => {
    if (token && !needsPassword && !error) {
      acceptMutation.mutate({ token });
    }
  }, [token]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-background dark:via-background dark:to-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <img src={viahLogo} alt="Viah.me" className="h-16 mx-auto mb-4" />
            <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <CardTitle>Invalid Invitation</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => setLocation("/auth")} variant="outline">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (needsPassword) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-background dark:via-background dark:to-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <img src={viahLogo} alt="Viah.me" className="h-16 mx-auto mb-4" />
            <UserPlus className="w-16 h-16 text-primary mx-auto mb-4" />
            <CardTitle>Create Your Account</CardTitle>
            <CardDescription>
              Set up your account to join the vendor team
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                disabled
                className="bg-muted"
                data-testid="input-accept-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Your Name (optional)</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                data-testid="input-accept-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-testid="input-accept-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                data-testid="input-accept-confirm-password"
              />
            </div>
            <Button
              className="w-full"
              onClick={handleAccept}
              disabled={acceptMutation.isPending}
              data-testid="button-create-account"
            >
              {acceptMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Create Account & Join Team"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-background dark:via-background dark:to-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <img src={viahLogo} alt="Viah.me" className="h-16 mx-auto mb-4" />
          <Loader2 className="w-16 h-16 text-primary mx-auto mb-4 animate-spin" />
          <CardTitle>Accepting Invitation...</CardTitle>
          <CardDescription>
            Please wait while we set up your account
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
