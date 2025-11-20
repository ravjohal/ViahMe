import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react";
import logoUrl from "@assets/viah-logo_1763669612969.png";

export default function VerifyEmail() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [token, setToken] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<
    "pending" | "success" | "error"
  >("pending");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get("token");
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setVerificationStatus("error");
    }
  }, []);

  const verifyMutation = useMutation({
    mutationFn: async (token: string) => {
      const response = await apiRequest("POST", "/api/auth/verify-email", { token });
      return await response.json();
    },
    onSuccess: () => {
      setVerificationStatus("success");
      toast({
        title: "Email verified!",
        description: "Your email has been successfully verified.",
      });
      setTimeout(() => {
        setLocation("/login");
      }, 3000);
    },
    onError: (error: any) => {
      setVerificationStatus("error");
      toast({
        variant: "destructive",
        title: "Verification failed",
        description: error.message || "Invalid or expired verification link",
      });
    },
  });

  const resendMutation = useMutation({
    mutationFn: async () => {
      // This would need the user's email - for now, show message
      throw new Error("Please log in and request a new verification email");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Cannot resend",
        description: error.message,
      });
    },
  });

  useEffect(() => {
    if (token && verificationStatus === "pending") {
      verifyMutation.mutate(token);
    }
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src={logoUrl}
            alt="Viah.me"
            className="h-20 mx-auto object-contain mb-4"
          />
        </div>

        {/* Verification Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-orange-100 p-8 text-center">
          {verificationStatus === "pending" && (
            <>
              <Loader2 className="h-16 w-16 text-orange-600 animate-spin mx-auto mb-4" />
              <h1 className="font-display text-3xl font-bold text-foreground mb-2">
                Verifying Your Email
              </h1>
              <p className="text-muted-foreground">
                Please wait while we verify your email address...
              </p>
            </>
          )}

          {verificationStatus === "success" && (
            <>
              <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h1 className="font-display text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
                Email Verified!
              </h1>
              <p className="text-muted-foreground mb-6">
                Your email has been successfully verified. Redirecting to login...
              </p>
              <Button
                onClick={() => setLocation("/login")}
                className="bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700 text-white rounded-full"
                data-testid="button-go-to-login"
              >
                Go to Login
              </Button>
            </>
          )}

          {verificationStatus === "error" && (
            <>
              <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
              <h1 className="font-display text-3xl font-bold text-foreground mb-2">
                Verification Failed
              </h1>
              <p className="text-muted-foreground mb-6">
                The verification link is invalid or has expired. Please request a new verification email.
              </p>
              <div className="space-y-3">
                <Button
                  onClick={() => setLocation("/login")}
                  className="w-full bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700 text-white rounded-full"
                  data-testid="button-back-to-login"
                >
                  Back to Login
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
