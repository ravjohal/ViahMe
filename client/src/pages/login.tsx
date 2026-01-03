import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import logoUrl from "@assets/viah-logo_1763669612969.png";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { refetchUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return await response.json();
    },
    onSuccess: async (data: any) => {
      // Refetch user to update auth context
      await refetchUser();

      toast({
        title: "Welcome back!",
        description: `Logged in as ${data.user.email}`,
      });

      // Redirect based on role
      if (data.user.role === "vendor") {
        setLocation("/vendor-dashboard");
      } else {
        setLocation("/dashboard");
      }
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Invalid email or password";
      toast({
        variant: "destructive",
        title: "Login failed",
        description: errorMessage,
      });
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  const onSubmit = (data: LoginFormData) => {
    setIsLoading(true);
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" data-testid="link-logo-home">
            <img
              src={logoUrl}
              alt="Viah.me"
              className="h-20 mx-auto object-contain mb-4 cursor-pointer hover:opacity-80 transition-opacity"
            />
          </Link>
          <h1 className="font-display text-4xl font-bold bg-gradient-to-r from-orange-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
            Welcome Back
          </h1>
          <p className="text-muted-foreground mt-2">
            Sign in to manage your wedding
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-orange-100 p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground font-medium">
                      Email Address
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="you@example.com"
                        disabled={isLoading}
                        className="h-12 rounded-lg border-2 focus-visible:ring-orange-500"
                        data-testid="input-email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground font-medium">
                      Password
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="Enter your password"
                        disabled={isLoading}
                        className="h-12 rounded-lg border-2 focus-visible:ring-orange-500"
                        data-testid="input-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center justify-between">
                <Link
                  href="/forgot-password"
                  className="text-sm text-orange-600 hover:text-orange-700 hover:underline"
                  data-testid="link-forgot-password"
                >
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 rounded-full bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700 text-white font-semibold text-lg shadow-lg"
                data-testid="button-login"
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </Form>

          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link
                href="/onboarding"
                className="text-orange-600 font-semibold hover:text-orange-700 hover:underline"
                data-testid="link-start-planning"
              >
                Start Planning Your Wedding
              </Link>
            </p>
          </div>
        </div>

        {/* Vendor Login Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Are you a vendor?{" "}
            <Link
              href="/vendor-login"
              className="text-purple-600 font-semibold hover:text-purple-700 hover:underline"
              data-testid="link-vendor-login"
            >
              Vendor Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
