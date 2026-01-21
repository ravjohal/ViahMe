import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Star, MapPin, DollarSign, Phone, Mail, StarIcon, AlertCircle, ExternalLink, Calendar, Building2, ShieldCheck, Globe, User } from "lucide-react";
import { SiInstagram, SiFacebook, SiX } from "react-icons/si";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { format, startOfMonth, endOfMonth } from "date-fns";
import type { Vendor, Event, Review, VendorAvailability } from "@shared/schema";

interface VendorDetailModalProps {
  vendor: Vendor | null;
  events: Event[];
  open: boolean;
  onClose: () => void;
  isAuthenticated?: boolean;
  onAuthRequired?: () => void;
  weddingId?: string;
  coupleName?: string;
  weddingDate?: string;
  tradition?: string;
  city?: string;
}

const reviewFormSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

type ReviewFormValues = z.infer<typeof reviewFormSchema>;

export function VendorDetailModal({
  vendor,
  events,
  open,
  onClose,
  isAuthenticated = true,
  onAuthRequired,
  weddingId,
  coupleName,
  weddingDate,
  tradition,
  city,
}: VendorDetailModalProps) {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Availability calendar state
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  
  // Quote request state
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);
  const [quoteEventId, setQuoteEventId] = useState<string>('');
  const [quoteBudgetRange, setQuoteBudgetRange] = useState<string>('');
  const [quoteNotes, setQuoteNotes] = useState<string>('');
  const [quoteConfirmStep, setQuoteConfirmStep] = useState<boolean>(false);

  const reviewForm = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewFormSchema),
    mode: "onChange",
    defaultValues: {
      rating: 5,
      comment: "",
    },
  });

  // Fetch reviews for this vendor - MUST be called before any early returns
  const { data: reviews = [] } = useQuery<Review[]>({
    queryKey: ["/api/reviews/vendor", vendor?.id],
    enabled: !!vendor?.id && open,
  });


  // Add review mutation - MUST also be called before any early returns
  const addReviewMutation = useMutation({
    mutationFn: async (data: ReviewFormValues) => {
      if (!vendor?.id) throw new Error("Vendor ID is required");
      if (!weddingId) throw new Error("Wedding ID is required to submit a review");
      return apiRequest("POST", "/api/reviews", {
        weddingId: weddingId,
        vendorId: vendor.id,
        rating: data.rating,
        comment: data.comment?.trim() || null,
        createdById: user?.id,
        createdByName: user?.email || 'Family Member',
      });
    },
    onSuccess: () => {
      if (!vendor?.id) return;
      queryClient.invalidateQueries({ queryKey: ["/api/reviews/vendor", vendor.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
      reviewForm.reset();
      setShowReviewForm(false);
      setReviewError(null);
      toast({
        title: "Review Submitted",
        description: "Thank you for your feedback!",
      });
    },
    onError: (error: Error) => {
      const errorMessage = error.message.includes("duplicate")
        ? "You have already reviewed this vendor."
        : error.message.includes("not found")
        ? "Vendor not found. Please refresh and try again."
        : "Failed to submit review. Please try again.";
      
      setReviewError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Fetch availability for selected vendor in current month
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  const { data: availability } = useQuery<VendorAvailability[]>({
    queryKey: ['/api/vendor-availability/vendor', vendor?.id, 'range', monthStart.toISOString(), monthEnd.toISOString()],
    queryFn: async () => {
      if (!vendor?.id) return [];
      const response = await fetch(
        `/api/vendor-availability/vendor/${vendor.id}/range?startDate=${monthStart.toISOString()}&endDate=${monthEnd.toISOString()}`
      );
      if (!response.ok) throw new Error('Failed to fetch availability');
      return response.json();
    },
    enabled: !!vendor?.id && open && vendor?.calendarShared === true,
  });

  // Claim profile mutation - MUST be called before any early returns
  const claimRequestMutation = useMutation({
    mutationFn: async (vendorId: string) => {
      const response = await apiRequest('POST', `/api/vendors/${vendorId}/request-claim`, {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Claim request sent",
        description: "The business owner will receive a notification to claim this profile.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Request failed",
        description: error.message || "Unable to send claim request. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Quote request mutation - MUST be called before any early returns
  const quoteRequestMutation = useMutation({
    mutationFn: async (data: {
      vendorId: string;
      eventId: string;
      eventName: string;
      eventDate?: string;
      eventLocation?: string;
      guestCount?: number;
      budgetRange?: string;
      additionalNotes?: string;
    }) => {
      if (!weddingId) throw new Error("Wedding ID is required");
      const response = await apiRequest('POST', `/api/vendors/${data.vendorId}/quote-request`, {
        weddingId,
        eventId: data.eventId,
        eventName: data.eventName,
        eventDate: data.eventDate,
        eventLocation: data.eventLocation,
        guestCount: data.guestCount,
        budgetRange: data.budgetRange,
        additionalNotes: data.additionalNotes,
      });
      return response.json();
    },
    onSuccess: () => {
      setQuoteDialogOpen(false);
      setQuoteEventId('');
      setQuoteBudgetRange('');
      setQuoteNotes('');
      setQuoteConfirmStep(false);
      toast({
        title: "Quote request sent!",
        description: "The vendor will receive your request and contact you with pricing details.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Request failed",
        description: error.message || "Unable to send quote request. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Early return AFTER all hooks are called
  if (!vendor) return null;

  // Compute rating from in-platform reviews
  const computedRating = reviews.length > 0 
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
    : 0;

  const onReviewSubmit = (data: ReviewFormValues) => {
    setReviewError(null);
    addReviewMutation.mutate(data);
  };

  // Quote request handler
  const handleQuoteRequest = () => {
    const selectedEvent = events.find(e => e.id === quoteEventId);
    if (!selectedEvent || !vendor) return;

    quoteRequestMutation.mutate({
      vendorId: vendor.id,
      eventId: selectedEvent.id,
      eventName: selectedEvent.name,
      eventDate: selectedEvent.date ? format(new Date(selectedEvent.date), 'MMMM d, yyyy') : undefined,
      eventLocation: selectedEvent.location || undefined,
      guestCount: selectedEvent.guestCount || undefined,
      budgetRange: quoteBudgetRange || undefined,
      additionalNotes: quoteNotes || undefined,
    });
  };

  // Get selected event for quote display
  const selectedQuoteEvent = events.find(e => e.id === quoteEventId);

  // Availability calendar helper functions
  const getAvailabilityStatus = (date: Date): 'available' | 'partial' | 'booked' | null => {
    if (!availability || !vendor) return null;

    const dateStr = format(date, 'yyyy-MM-dd');
    const dayAvailability = availability.filter(
      (a) => format(new Date(a.date), 'yyyy-MM-dd') === dateStr
    );

    if (dayAvailability.length === 0) return 'available';

    const bookedSlots = dayAvailability.filter((a) => a.status === 'booked');
    if (bookedSlots.some((a) => a.timeSlot === 'full_day')) return 'booked';
    if (bookedSlots.length >= 3) return 'booked';
    if (bookedSlots.length > 0) return 'partial';

    return 'available';
  };

  const modifiers = {
    available: (date: Date) => getAvailabilityStatus(date) === 'available',
    partial: (date: Date) => getAvailabilityStatus(date) === 'partial',
    booked: (date: Date) => getAvailabilityStatus(date) === 'booked',
  };

  const modifiersStyles = {
    available: {
      backgroundColor: 'hsl(var(--success) / 0.2)',
      color: 'hsl(var(--success-foreground))',
    },
    partial: {
      backgroundColor: 'hsl(var(--warning) / 0.2)',
      color: 'hsl(var(--warning-foreground))',
    },
    booked: {
      backgroundColor: 'hsl(var(--destructive) / 0.2)',
      color: 'hsl(var(--destructive-foreground))',
    },
  };

  // Check if this is an unclaimed ghost profile
  const isGhostProfile = vendor.claimed === false && vendor.source === 'google_places';

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="dialog-vendor-detail">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-primary/20">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {vendor.name.split(' ').map(word => word[0]).join('').slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span>{vendor.name}</span>
            {vendor.claimed && (
              <Badge variant="outline" className="text-xs bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400">
                <ShieldCheck className="w-3 h-3 mr-1" />
                Verified
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {isGhostProfile && (
          <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20">
            <Building2 className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <AlertDescription className="text-orange-800 dark:text-orange-200">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">Unclaimed Business Profile</p>
                  <p className="text-sm mt-1 text-orange-700 dark:text-orange-300">
                    This profile was created from public business listings. The owner can claim it to update their information and respond to inquiries.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0 border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-300 dark:hover:bg-orange-900/40"
                  onClick={() => claimRequestMutation.mutate(vendor.id)}
                  disabled={claimRequestMutation.isPending}
                  data-testid="button-claim-profile"
                >
                  {claimRequestMutation.isPending ? "Notifying..." : "Is this your business?"}
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-6 mt-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap gap-2 mb-2">
                {(vendor.categories || []).map((cat, idx) => (
                  <Badge key={idx} variant="outline">
                    {cat.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </Badge>
                ))}
              </div>
              {vendor.description && (
                <p className="text-muted-foreground mt-2">{vendor.description}</p>
              )}
            </div>
            {reviews.length > 0 ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted">
                <Star className="w-5 h-5 fill-primary text-primary" />
                <span className="font-mono font-bold text-lg">{computedRating.toFixed(1)}</span>
                <span className="text-sm text-muted-foreground">
                  ({reviews.length} {reviews.length === 1 ? "review" : "reviews"})
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-dashed border-muted-foreground/30">
                <Star className="w-5 h-5 text-muted-foreground/50" />
                <span className="text-sm text-muted-foreground">No reviews yet</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="font-medium" data-testid="text-vendor-areas">
                {vendor.areasServed && vendor.areasServed.length > 0 
                  ? vendor.areasServed.join(', ')
                  : vendor.location || vendor.city || 'Location not specified'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <span className="font-mono font-semibold">{vendor.priceRange}</span>
            </div>
          </div>

          {vendor.culturalSpecialties && vendor.culturalSpecialties.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Cultural Specialties</h3>
              <div className="flex flex-wrap gap-2">
                {vendor.culturalSpecialties.map((specialty: string) => (
                  <Badge key={specialty} variant="secondary">
                    {specialty}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {(vendor.phone || vendor.email || vendor.contact || vendor.website || vendor.instagram || vendor.facebook || vendor.twitter) && (
            <div className="p-4 rounded-lg bg-muted/50 border">
              <h3 className="font-semibold mb-3">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {vendor.phone && (
                  <a href={`tel:${vendor.phone}`} className="flex items-center gap-2 text-sm hover:text-primary transition-colors" data-testid="link-vendor-phone">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{vendor.phone}</span>
                  </a>
                )}
                {vendor.email && (
                  <a href={`mailto:${vendor.email}`} className="flex items-center gap-2 text-sm hover:text-primary transition-colors" data-testid="link-vendor-email">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{vendor.email}</span>
                  </a>
                )}
                {vendor.website && (
                  <a href={vendor.website.startsWith('http') ? vendor.website : `https://${vendor.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm hover:text-primary transition-colors" data-testid="link-vendor-website">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <span>Website</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {vendor.instagram && (
                  <a href={`https://instagram.com/${vendor.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm hover:text-primary transition-colors" data-testid="link-vendor-instagram">
                    <SiInstagram className="w-4 h-4 text-muted-foreground" />
                    <span>@{vendor.instagram.replace('@', '')}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {vendor.facebook && (
                  <a href={vendor.facebook.startsWith('http') ? vendor.facebook : `https://facebook.com/${vendor.facebook}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm hover:text-primary transition-colors" data-testid="link-vendor-facebook">
                    <SiFacebook className="w-4 h-4 text-muted-foreground" />
                    <span>Facebook</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {vendor.twitter && (
                  <a href={`https://x.com/${vendor.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm hover:text-primary transition-colors" data-testid="link-vendor-twitter">
                    <SiX className="w-4 h-4 text-muted-foreground" />
                    <span>@{vendor.twitter.replace('@', '')}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {!vendor.phone && !vendor.email && vendor.contact && (
                  vendor.contact.includes("@") ? (
                    <a href={`mailto:${vendor.contact}`} className="flex items-center gap-2 text-sm hover:text-primary transition-colors">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span>{vendor.contact}</span>
                    </a>
                  ) : (
                    <a href={`tel:${vendor.contact}`} className="flex items-center gap-2 text-sm hover:text-primary transition-colors">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{vendor.contact}</span>
                    </a>
                  )
                )}
              </div>
            </div>
          )}

          <Separator />

          {/* Main Tabs: Reviews and Availability (Availability only for claimed vendors) */}
          <Tabs defaultValue="reviews" className="w-full">
            <TabsList className={`grid w-full ${vendor.claimed ? 'grid-cols-2' : 'grid-cols-1'}`}>
              <TabsTrigger value="reviews" data-testid="tab-reviews-section">
                <Star className="w-4 h-4 mr-2" />
                Reviews
              </TabsTrigger>
              {vendor.claimed && (
                <TabsTrigger value="availability" data-testid="tab-availability-section">
                  <Calendar className="w-4 h-4 mr-2" />
                  Availability & Booking
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="reviews" className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Reviews</h3>
                {!showReviewForm && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowReviewForm(true)}
                    data-testid="button-write-review"
                  >
                    Write a Review
                  </Button>
                )}
              </div>

              {showReviewForm && (
              <div className="p-4 rounded-lg border bg-muted/30 space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Your Review</Label>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setShowReviewForm(false);
                      setReviewError(null);
                      reviewForm.reset();
                    }}
                    disabled={addReviewMutation.isPending}
                  >
                    Cancel
                  </Button>
                </div>

                {reviewError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{reviewError}</AlertDescription>
                  </Alert>
                )}
                
                <Form {...reviewForm}>
                  <form onSubmit={reviewForm.handleSubmit(onReviewSubmit)} className="space-y-4">
                    <FormField
                      control={reviewForm.control}
                      name="rating"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rating *</FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-2 mt-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => field.onChange(star)}
                                  className="transition-transform hover:scale-110"
                                  data-testid={`button-rating-${star}`}
                                  disabled={addReviewMutation.isPending}
                                >
                                  <Star
                                    className={`w-8 h-8 ${
                                      star <= field.value
                                        ? "fill-primary text-primary"
                                        : "text-muted-foreground"
                                    }`}
                                  />
                                </button>
                              ))}
                              <span className="ml-2 font-semibold">{field.value}/5</span>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={reviewForm.control}
                      name="comment"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Comment (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Share your experience with this vendor..."
                              {...field}
                              rows={3}
                              maxLength={1000}
                              data-testid="textarea-review-comment"
                              disabled={addReviewMutation.isPending}
                            />
                          </FormControl>
                          <FormMessage />
                          {field.value && (
                            <p className="text-xs text-muted-foreground">
                              {field.value.length}/1000 characters
                            </p>
                          )}
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      disabled={addReviewMutation.isPending || !reviewForm.formState.isValid}
                      className="w-full"
                      data-testid="button-submit-review"
                    >
                      {addReviewMutation.isPending ? "Submitting..." : "Submit Review"}
                    </Button>
                  </form>
                </Form>
              </div>
            )}

            {/* Reviews from Viah.me only */}
              {reviews.length > 0 ? (
                <div className="rounded-lg border">
                  <ScrollArea className="h-[300px] p-4">
                    <div className="space-y-4 pr-4">
                      {reviews.map((review, index) => (
                        <div 
                          key={review.id} 
                          className={`${index !== reviews.length - 1 ? 'pb-4 border-b' : ''}`}
                          data-testid={`review-${review.id}`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`w-4 h-4 ${
                                      star <= review.rating
                                        ? "fill-primary text-primary"
                                        : "text-muted-foreground"
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="font-mono font-semibold text-sm" data-testid={`text-review-rating-${review.id}`}>
                                {review.rating}.0
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(review.createdAt).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </span>
                          </div>
                          {review.createdByName && (
                            <div className="flex items-center gap-1.5 mb-2 text-xs text-muted-foreground">
                              <User className="w-3 h-3" />
                              <span data-testid={`text-review-author-${review.id}`}>
                                Reviewed by {review.createdByName.includes('@') 
                                  ? review.createdByName.split('@')[0] 
                                  : review.createdByName}
                              </span>
                            </div>
                          )}
                          {review.comment && (
                            <p className="text-sm leading-relaxed" data-testid={`text-review-comment-${review.id}`}>
                              {review.comment}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground rounded-lg border bg-muted/20">
                  <StarIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium mb-1">No reviews yet</p>
                  <p className="text-sm">Be the first to share your experience!</p>
                </div>
              )}
            </TabsContent>

            {vendor.claimed && (
            <TabsContent value="availability" className="mt-6 space-y-4">
              {vendor.calendarShared ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Check Availability</h3>
                    <p className="text-sm text-muted-foreground">
                      View real-time availability and request a booking for your wedding events.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <CalendarComponent
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => {
                          if (date) {
                            setSelectedDate(date);
                            setBookingDialogOpen(true);
                          }
                        }}
                        month={currentMonth}
                        onMonthChange={setCurrentMonth}
                        modifiers={modifiers}
                        modifiersStyles={modifiersStyles}
                        disabled={(date) => date < new Date()}
                        className="rounded-lg border p-3"
                        data-testid="calendar-vendor-availability"
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="p-4 rounded-lg border space-y-3">
                        <h4 className="font-semibold text-sm">Legend</h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(var(--success) / 0.2)' }}></div>
                            <span className="text-sm">Available</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(var(--warning) / 0.2)' }}></div>
                            <span className="text-sm">Partially Available</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(var(--destructive) / 0.2)' }}></div>
                            <span className="text-sm">Fully Booked</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 rounded-lg border bg-muted/30 space-y-2">
                        <h4 className="font-semibold text-sm flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          How Booking Works
                        </h4>
                        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                          <li>Click any date to select your preferred time</li>
                          <li>Your request will be sent to the vendor</li>
                          <li>The vendor will confirm or suggest alternatives</li>
                          <li>Once confirmed, create a contract to finalize</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 space-y-4">
                  <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <Calendar className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">Calendar Not Available</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      This vendor hasn't shared their availability calendar yet. 
                      You can still send a booking request using the form below, and they'll respond with available dates.
                    </p>
                  </div>
                </div>
              )}
            </TabsContent>
            )}
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
