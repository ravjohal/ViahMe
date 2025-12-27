import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Heart,
  Users,
  CheckCircle2,
  AlertCircle,
  Send,
  ArrowLeft,
  Calendar,
  User,
  Mail,
  Phone,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { format } from "date-fns";

type CollectorLinkInfo = {
  id: string;
  name: string;
  side: string;
  createdByName?: string;
  weddingInfo?: {
    partner1Name: string;
    partner2Name: string;
    weddingDate?: string;
  };
};

const submissionSchema = z.object({
  submitterName: z.string().min(1, "Your name is required"),
  submitterRelation: z.string().min(1, "Your relationship is required"),
  guestName: z.string().min(1, "Guest name is required"),
  guestEmail: z.string().email("Valid email required").optional().or(z.literal("")),
  guestPhone: z.string().optional().or(z.literal("")),
  relationshipTier: z.string().optional(),
  notes: z.string().optional().or(z.literal("")),
});

type SubmissionFormData = z.infer<typeof submissionSchema>;

export default function GuestCollector() {
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [anotherGuest, setAnotherGuest] = useState(false);

  const { data: linkInfo, isLoading, error } = useQuery<CollectorLinkInfo>({
    queryKey: ["/api/collector", token],
    enabled: !!token,
    retry: false,
  });

  const form = useForm<SubmissionFormData>({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      submitterName: "",
      submitterRelation: "",
      guestName: "",
      guestEmail: "",
      guestPhone: "",
      relationshipTier: "friend",
      notes: "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: SubmissionFormData) => {
      return apiRequest("POST", `/api/collector/${token}/submit`, data);
    },
    onSuccess: () => {
      setSubmitted(true);
      toast({ 
        title: "Guest submitted!", 
        description: "Thank you for helping with the guest list." 
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to submit guest", 
        variant: "destructive" 
      });
    },
  });

  const onSubmit = (data: SubmissionFormData) => {
    submitMutation.mutate(data);
  };

  const handleAddAnother = () => {
    form.reset({
      submitterName: form.getValues("submitterName"),
      submitterRelation: form.getValues("submitterRelation"),
      guestName: "",
      guestEmail: "",
      guestPhone: "",
      relationshipTier: "friend",
      notes: "",
    });
    setSubmitted(false);
    setAnotherGuest(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Skeleton className="h-8 w-48 mx-auto mb-2" />
            <Skeleton className="h-4 w-64 mx-auto" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !linkInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <CardTitle className="text-xl">Link Not Available</CardTitle>
            <CardDescription className="text-base">
              This guest submission link is no longer active, has expired, or doesn't exist.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Please contact the couple for a new link if you'd like to suggest guests.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <CardTitle className="text-2xl" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              Thank You!
            </CardTitle>
            <CardDescription className="text-base">
              Your guest suggestion has been submitted successfully.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {linkInfo.weddingInfo?.partner1Name} & {linkInfo.weddingInfo?.partner2Name} will review your suggestion 
              and include them in their guest list planning.
            </p>
            <div className="pt-4">
              <Button 
                onClick={handleAddAnother}
                className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
                data-testid="button-add-another-guest"
              >
                <Users className="w-4 h-4 mr-2" />
                Suggest Another Guest
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 py-8 px-4 safe-area-inset-bottom">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-lg">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h1 
            className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent"
            style={{ fontFamily: 'Cormorant Garamond, serif' }}
          >
            {linkInfo.weddingInfo?.partner1Name} & {linkInfo.weddingInfo?.partner2Name}
          </h1>
          {linkInfo.weddingInfo?.weddingDate && (
            <p className="text-muted-foreground flex items-center justify-center gap-2 mt-2">
              <Calendar className="w-4 h-4" />
              {format(new Date(linkInfo.weddingInfo.weddingDate), "MMMM d, yyyy")}
            </p>
          )}
        </div>

        <Card className="border-pink-100 dark:border-pink-900/20 shadow-xl">
          <CardHeader className="text-center bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/20 dark:to-rose-950/20 rounded-t-lg">
            <CardTitle className="text-xl flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-pink-500" />
              Suggest a Guest
            </CardTitle>
            <CardDescription>
              {linkInfo.createdByName ? (
                <span>{linkInfo.createdByName} invited you to suggest guests for the {linkInfo.side}'s side</span>
              ) : (
                <span>Help build the guest list for the {linkInfo.side}'s side</span>
              )}
            </CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-5 pt-6">
                {!anotherGuest && (
                  <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                    <h3 className="font-medium text-sm text-muted-foreground">About You</h3>
                    <FormField
                      control={form.control}
                      name="submitterName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Your Name</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input 
                                {...field} 
                                placeholder="Enter your name" 
                                className="pl-10"
                                data-testid="input-submitter-name"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="submitterRelation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Your Relationship to the Couple</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger data-testid="select-submitter-relation">
                                <SelectValue placeholder="Select relationship" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="parent">Parent</SelectItem>
                                <SelectItem value="sibling">Sibling</SelectItem>
                                <SelectItem value="grandparent">Grandparent</SelectItem>
                                <SelectItem value="aunt_uncle">Aunt/Uncle</SelectItem>
                                <SelectItem value="cousin">Cousin</SelectItem>
                                <SelectItem value="friend">Friend of Family</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <div className="space-y-4">
                  <h3 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Guest Information
                  </h3>
                  <FormField
                    control={form.control}
                    name="guestName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Guest Name *</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Full name of the guest"
                            data-testid="input-guest-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="guestEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email (optional)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input 
                                {...field} 
                                type="email"
                                placeholder="guest@email.com" 
                                className="pl-10"
                                data-testid="input-guest-email"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="guestPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone (optional)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input 
                                {...field} 
                                type="tel"
                                placeholder="Phone number" 
                                className="pl-10"
                                data-testid="input-guest-phone"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="relationshipTier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Guest's Relationship to Family</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger data-testid="select-relationship-tier">
                              <SelectValue placeholder="Select relationship type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="immediate_family">Immediate Family</SelectItem>
                              <SelectItem value="extended_family">Extended Family</SelectItem>
                              <SelectItem value="friend">Close Friend</SelectItem>
                              <SelectItem value="parents_friend">Parent's Friend</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormDescription className="text-xs">
                          This helps the couple prioritize their guest list
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Notes (optional)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                            <Textarea 
                              {...field} 
                              placeholder="Any additional context about this guest..."
                              className="pl-10 min-h-[80px] resize-none"
                              data-testid="input-guest-notes"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex-col gap-3 pt-0">
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
                  disabled={submitMutation.isPending}
                  data-testid="button-submit-guest"
                >
                  {submitMutation.isPending ? (
                    <>
                      <span className="animate-spin mr-2">
                        <Send className="w-4 h-4" />
                      </span>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Guest Suggestion
                    </>
                  )}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  The couple will review your suggestion and may reach out if they have questions.
                </p>
              </CardFooter>
            </form>
          </Form>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Powered by Viah.me - South Asian Wedding Planning
        </p>
      </div>
    </div>
  );
}
