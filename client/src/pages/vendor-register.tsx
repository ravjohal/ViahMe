import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { Briefcase, Mail } from "lucide-react";
import logoUrl from "@assets/viah-logo_1763669612969.png";

const registerSchema = z
  .object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    businessName: z.string().min(2, "Business name is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function VendorRegister() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      businessName: "",
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormData) => {
      const response = await apiRequest("POST", "/api/auth/register", {
        email: data.email,
        password: data.password,
        role: "vendor",
        businessName: data.businessName,
      });
      return await response.json();
    },
    onSuccess: (data: any) => {
      setRegisteredEmail(data.user.email);
      setRegistrationComplete(true);
      toast({
        title: "Registration successful!",
        description: "Please check your email to verify your account.",
      });
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Registration failed";
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: errorMessage,
      });
    },
  });

  const onSubmit = (data: RegisterFormData) => {
    registerMutation.mutate(data);
  };

  if (registrationComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" data-testid="link-logo-home">
              <img
                src={logoUrl}
                alt="Viah.me"
                className="h-20 mx-auto object-contain mb-4 cursor-pointer hover:opacity-80 transition-opacity"
              />
            </Link>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-purple-100 p-8 text-center">
            <Mail className="h-16 w-16 text-purple-600 mx-auto mb-4" />
            <h1 className="font-display text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              Check Your Email
            </h1>
            <p className="text-muted-foreground mb-6">
              We've sent a verification link to{" "}
              <strong className="text-foreground">{registeredEmail}</strong>.
              Please verify your email to complete your vendor registration.
            </p>
            <Link href="/vendor-login">
              <Button
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-full"
                data-testid="button-go-to-vendor-login"
              >
                Go to Vendor Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 flex items-center justify-center p-4">
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
          <div className="flex items-center justify-center gap-2 mb-2">
            <Briefcase className="h-8 w-8 text-purple-600" />
            <h1 className="font-display text-4xl font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent">
              Vendor Registration
            </h1>
          </div>
          <p className="text-muted-foreground mt-2">
            Join Viah.me and connect with couples
          </p>
        </div>

        {/* Registration Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-purple-100 p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="businessName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground font-medium">
                      Business Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Your Business Name"
                        disabled={registerMutation.isPending}
                        className="h-12 rounded-lg border-2 focus-visible:ring-purple-500"
                        data-testid="input-business-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                        placeholder="you@yourbusiness.com"
                        disabled={registerMutation.isPending}
                        className="h-12 rounded-lg border-2 focus-visible:ring-purple-500"
                        data-testid="input-vendor-email"
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      We'll send a verification email to this address
                    </FormDescription>
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
                        placeholder="Create a password (min 8 characters)"
                        disabled={registerMutation.isPending}
                        className="h-12 rounded-lg border-2 focus-visible:ring-purple-500"
                        data-testid="input-vendor-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground font-medium">
                      Confirm Password
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="Confirm your password"
                        disabled={registerMutation.isPending}
                        className="h-12 rounded-lg border-2 focus-visible:ring-purple-500"
                        data-testid="input-vendor-confirm-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={registerMutation.isPending}
                className="w-full h-12 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold text-lg shadow-lg"
                data-testid="button-vendor-register"
              >
                {registerMutation.isPending ? "Creating Account..." : "Create Vendor Account"}
              </Button>
            </form>
          </Form>

          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
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

        {/* Couple Registration Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Planning a wedding?{" "}
            <Link
              href="/onboarding"
              className="text-orange-600 font-semibold hover:text-orange-700 hover:underline"
              data-testid="link-couple-onboarding"
            >
              Start Planning
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
