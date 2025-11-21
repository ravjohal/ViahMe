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
  DialogFooter,
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
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Star, MapPin, DollarSign, Phone, Mail, Send, StarIcon, AlertCircle, ExternalLink, Calendar, CheckCircle2, XCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, startOfMonth, endOfMonth } from "date-fns";
import type { Vendor, Event, Review, VendorAvailability } from "@shared/schema";

interface VendorDetailModalProps {
  vendor: Vendor | null;
  events: Event[];
  open: boolean;
  onClose: () => void;
  onBookRequest: (vendorId: string, eventIds: string[], notes: string) => void;
  isAuthenticated?: boolean;
  onAuthRequired?: () => void;
}

const DEMO_WEDDING_ID = "wedding-1"; // TODO: Get from auth context

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
  onBookRequest,
  isAuthenticated = true,
  onAuthRequired,
}: VendorDetailModalProps) {
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Availability calendar state
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<'morning' | 'afternoon' | 'evening' | 'full_day'>('full_day');
  const [selectedEventForBooking, setSelectedEventForBooking] = useState<string>('');

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

  // Fetch Yelp reviews
  const { data: yelpData } = useQuery<{
    reviews: any[];
    total: number;
    source: string;
    available: boolean;
    message?: string;
  }>({
    queryKey: ["/api/reviews/yelp", vendor?.id],
    enabled: !!vendor?.id && open,
  });

  // Fetch Google reviews
  const { data: googleData } = useQuery<{
    reviews: any[];
    displayName?: string;
    rating?: number;
    userRatingCount?: number;
    source: string;
    available: boolean;
    message?: string;
  }>({
    queryKey: ["/api/reviews/google", vendor?.id],
    enabled: !!vendor?.id && open,
  });

  // Add review mutation - MUST also be called before any early returns
  const addReviewMutation = useMutation({
    mutationFn: async (data: ReviewFormValues) => {
      if (!vendor?.id) throw new Error("Vendor ID is required");
      return apiRequest("POST", "/api/reviews", {
        weddingId: DEMO_WEDDING_ID,
        vendorId: vendor.id,
        rating: data.rating,
        comment: data.comment?.trim() || null,
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
    enabled: !!vendor?.id && open,
  });

  // Check conflicts mutation
  const checkConflictsMutation = useMutation<
    { hasConflicts: boolean },
    Error,
    { vendorId: string; date: Date; timeSlot: string }
  >({
    mutationFn: async (data: { vendorId: string; date: Date; timeSlot: string }) => {
      const response = await apiRequest('POST', '/api/vendor-availability/check-conflicts', {
        vendorId: data.vendorId,
        date: data.date.toISOString(),
        timeSlot: data.timeSlot,
      });
      return await response.json();
    },
  });

  // Create availability/booking mutation
  const createBookingMutation = useMutation({
    mutationFn: async (data: {
      vendorId: string;
      date: Date;
      timeSlot: string;
      eventId?: string;
    }) => {
      return await apiRequest('POST', '/api/vendor-availability', {
        vendorId: data.vendorId,
        date: data.date.toISOString(),
        timeSlot: data.timeSlot,
        status: 'booked',
        eventId: data.eventId || null,
      });
    },
    onSuccess: (_data, variables) => {
      // Invalidate all availability queries for the booked vendor
      queryClient.invalidateQueries({ 
        queryKey: ['/api/vendor-availability/vendor', variables.vendorId, 'range'],
        exact: false
      });
      setBookingDialogOpen(false);
      setSelectedDate(undefined);
      toast({
        title: "Booking confirmed!",
        description: `${vendor?.name} has been booked for ${selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'the selected date'}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Booking failed",
        description: error.message || "Failed to create booking. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Early return AFTER all hooks are called
  if (!vendor) return null;

  const rating = vendor.rating ? parseFloat(vendor.rating.toString()) : 0;

  const onReviewSubmit = (data: ReviewFormValues) => {
    setReviewError(null);
    addReviewMutation.mutate(data);
  };

  const handleSubmit = () => {
    if (selectedEvents.length === 0) return;
    onBookRequest(vendor.id, selectedEvents, notes);
    setSelectedEvents([]);
    setNotes("");
    onClose();
  };

  const handleEventToggle = (eventId: string) => {
    setSelectedEvents(prev => 
      prev.includes(eventId)
        ? prev.filter(id => id !== eventId)
        : [...prev, eventId]
    );
  };

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

  const handleBookVendor = async () => {
    if (!vendor || !selectedDate) return;

    // Check for conflicts first
    const conflictCheck = await checkConflictsMutation.mutateAsync({
      vendorId: vendor.id,
      date: selectedDate,
      timeSlot: selectedTimeSlot,
    });

    if (conflictCheck.hasConflicts) {
      toast({
        title: "Time slot unavailable",
        description: "This vendor is already booked for the selected time slot.",
        variant: "destructive",
      });
      return;
    }

    // Create the booking
    createBookingMutation.mutate({
      vendorId: vendor.id,
      date: selectedDate,
      timeSlot: selectedTimeSlot,
      eventId: selectedEventForBooking || undefined,
    });
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="dialog-vendor-detail">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {vendor.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Badge variant="outline" className="mb-2">
                {vendor.category.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
              </Badge>
              {vendor.description && (
                <p className="text-muted-foreground mt-2">{vendor.description}</p>
              )}
            </div>
            {rating > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted">
                <Star className="w-5 h-5 fill-primary text-primary" />
                <span className="font-mono font-bold text-lg">{rating.toFixed(1)}</span>
                {vendor.reviewCount && vendor.reviewCount > 0 && (
                  <span className="text-sm text-muted-foreground">
                    ({vendor.reviewCount} {vendor.reviewCount === 1 ? "review" : "reviews"})
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">{vendor.location}</span>
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

          {vendor.contact && (
            <div className="p-4 rounded-lg bg-muted/50 border">
              <h3 className="font-semibold mb-3">Contact Information</h3>
              <div className="space-y-2">
                {vendor.contact.includes("@") ? (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{vendor.contact}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{vendor.contact}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <Separator />

          {/* Main Tabs: Reviews and Availability */}
          <Tabs defaultValue="reviews" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="reviews" data-testid="tab-reviews-section">
                <Star className="w-4 h-4 mr-2" />
                Reviews
              </TabsTrigger>
              <TabsTrigger value="availability" data-testid="tab-availability-section">
                <Calendar className="w-4 h-4 mr-2" />
                Availability & Booking
              </TabsTrigger>
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

            <Tabs defaultValue="viah" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="viah" data-testid="tab-viah-reviews">
                  Viah.me ({reviews.length})
                </TabsTrigger>
                <TabsTrigger value="yelp" data-testid="tab-yelp-reviews">
                  Yelp {yelpData?.available && `(${yelpData.reviews.length})`}
                </TabsTrigger>
                <TabsTrigger value="google" data-testid="tab-google-reviews">
                  Google {googleData?.available && `(${googleData.reviews.length})`}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="viah" className="mt-4">
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
                    <p className="font-medium mb-1">No Viah.me reviews yet</p>
                    <p className="text-sm">Be the first to share your experience!</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="yelp" className="mt-4">
                {yelpData?.available && yelpData.reviews.length > 0 ? (
                  <div className="rounded-lg border">
                    <ScrollArea className="h-[300px] p-4">
                      <div className="space-y-4 pr-4">
                        {yelpData.reviews.map((review: any, index: number) => (
                          <div 
                            key={review.id} 
                            className={`${index !== yelpData.reviews.length - 1 ? 'pb-4 border-b' : ''}`}
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
                                <span className="font-mono font-semibold text-sm">
                                  {review.rating}.0
                                </span>
                              </div>
                              <a 
                                href={review.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-primary hover:underline"
                              >
                                View on Yelp
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                            <p className="text-sm font-medium mb-1">{review.user?.name}</p>
                            <p className="text-sm leading-relaxed text-muted-foreground">
                              {review.text}
                            </p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground rounded-lg border bg-muted/20">
                    <StarIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium mb-1">
                      {yelpData?.message || "No Yelp reviews available"}
                    </p>
                    {!yelpData?.available && (
                      <p className="text-xs">Yelp integration not configured for this vendor</p>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="google" className="mt-4">
                {googleData?.available && googleData.reviews.length > 0 ? (
                  <div className="rounded-lg border">
                    <ScrollArea className="h-[300px] p-4">
                      <div className="space-y-4 pr-4">
                        {googleData.reviews.map((review: any, index: number) => (
                          <div 
                            key={index} 
                            className={`${index !== googleData.reviews.length - 1 ? 'pb-4 border-b' : ''}`}
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
                                <span className="font-mono font-semibold text-sm">
                                  {review.rating}.0
                                </span>
                              </div>
                              {review.authorAttribution?.uri && (
                                <a 
                                  href={review.authorAttribution.uri} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                                >
                                  View on Google
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                            <p className="text-sm font-medium mb-1">
                              {review.authorAttribution?.displayName || 'Anonymous'}
                            </p>
                            {review.text?.text && (
                              <p className="text-sm leading-relaxed text-muted-foreground">
                                {review.text.text}
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
                    <p className="font-medium mb-1">
                      {googleData?.message || "No Google reviews available"}
                    </p>
                    {!googleData?.available && (
                      <p className="text-xs">Google Places integration not configured for this vendor</p>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
            </TabsContent>

            <TabsContent value="availability" className="mt-6 space-y-4">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Check Availability</h3>
                  <p className="text-sm text-muted-foreground">
                    View real-time availability and book {vendor.name} for your wedding events.
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
                        Booking Information
                      </h4>
                      <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                        <li>Click any date to view time slots</li>
                        <li>Select your preferred time slot</li>
                        <li>Link the booking to your event</li>
                        <li>Instant conflict detection</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <Separator />

          <div className="pt-6">
            <h3 className="font-semibold text-lg mb-4">Request Booking</h3>
            {!isAuthenticated ? (
              <div className="p-6 rounded-lg border bg-muted/20 text-center space-y-4">
                <p className="text-base text-muted-foreground">
                  Create a free account to book vendors and start planning your dream wedding.
                </p>
                <Button
                  onClick={onAuthRequired}
                  className="bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700"
                  data-testid="button-signup-to-book"
                >
                  Sign Up to Book This Vendor
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label className="text-base mb-3 block">
                    Select Events ({selectedEvents.length} selected)
                  </Label>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto border rounded-lg p-3">
                    {events.length > 0 ? (
                      events.map((event) => (
                        <div 
                          key={event.id} 
                          className="flex items-center space-x-3 hover-elevate p-2 rounded-md"
                          data-testid={`event-checkbox-${event.id}`}
                        >
                          <Checkbox
                            id={`event-${event.id}`}
                            checked={selectedEvents.includes(event.id)}
                            onCheckedChange={() => handleEventToggle(event.id)}
                          />
                          <label
                            htmlFor={`event-${event.id}`}
                            className="flex-1 text-sm font-medium cursor-pointer"
                          >
                            {event.name} {event.date && `- ${new Date(event.date).toLocaleDateString()}`}
                          </label>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No events created yet. Add events to your wedding first.
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="booking-notes" className="text-base">
                    Message to Vendor (Optional)
                  </Label>
                  <Textarea
                    id="booking-notes"
                    placeholder="Tell the vendor about your specific needs, preferences, or questions..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    data-testid="textarea-booking-notes"
                    className="mt-2"
                  />
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={selectedEvents.length === 0}
                  className="w-full"
                  data-testid="button-submit-booking"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Booking Request for {selectedEvents.length} {selectedEvents.length === 1 ? 'Event' : 'Events'}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Booking Dialog */}
        <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
          <DialogContent data-testid="dialog-booking">
            <DialogHeader>
              <DialogTitle>Book {vendor.name}</DialogTitle>
              <DialogDescription>
                Confirm your booking for {selectedDate && format(selectedDate, 'MMMM d, yyyy')}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {checkConflictsMutation.data && (
                <div className={`p-4 rounded-lg flex items-center gap-2 ${
                  checkConflictsMutation.data.hasConflicts 
                    ? 'bg-destructive/10 text-destructive' 
                    : 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                }`}>
                  {checkConflictsMutation.data.hasConflicts ? (
                    <>
                      <XCircle className="h-5 w-5" />
                      <span className="text-sm font-medium">This time slot is unavailable</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="text-sm font-medium">This time slot is available!</span>
                    </>
                  )}
                </div>
              )}

              <div>
                <label className="text-sm font-medium mb-2 block">Time Slot</label>
                <Select value={selectedTimeSlot} onValueChange={(v: any) => setSelectedTimeSlot(v)}>
                  <SelectTrigger data-testid="select-timeslot">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Morning (8am - 12pm)</SelectItem>
                    <SelectItem value="afternoon">Afternoon (12pm - 5pm)</SelectItem>
                    <SelectItem value="evening">Evening (5pm - 11pm)</SelectItem>
                    <SelectItem value="full_day">Full Day</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Link to Event (Optional)</label>
                <Select value={selectedEventForBooking} onValueChange={setSelectedEventForBooking}>
                  <SelectTrigger data-testid="select-booking-event">
                    <SelectValue placeholder="Select an event" />
                  </SelectTrigger>
                  <SelectContent>
                    {events.map((event) => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.name} {event.date && `- ${new Date(event.date).toLocaleDateString()}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setBookingDialogOpen(false)}
                data-testid="button-cancel-booking"
              >
                Cancel
              </Button>
              <Button
                onClick={handleBookVendor}
                disabled={createBookingMutation.isPending}
                data-testid="button-confirm-booking"
              >
                {createBookingMutation.isPending ? 'Booking...' : 'Confirm Booking'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
    </>
  );
}
