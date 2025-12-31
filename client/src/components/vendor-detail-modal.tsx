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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Star, MapPin, DollarSign, Phone, Mail, Send, StarIcon, AlertCircle, ExternalLink, Calendar, CheckCircle2, XCircle, Building2, ShieldCheck, FileText, Sparkles, Globe, User } from "lucide-react";
import { SiInstagram, SiFacebook, SiX } from "react-icons/si";
import { Input } from "@/components/ui/input";
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
  onBookRequest: (vendorId: string, eventIds: string[], notes: string) => void;
  onOfflineBooking?: (vendorId: string, eventIds: string[], notes: string, agreedPrice?: string) => void;
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
  onBookRequest,
  onOfflineBooking,
  isAuthenticated = true,
  onAuthRequired,
  weddingId,
  coupleName,
  weddingDate,
  tradition,
  city,
}: VendorDetailModalProps) {
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [agreedPrice, setAgreedPrice] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [offlineBookingMode, setOfflineBookingMode] = useState(false);
  
  // AI suggestion state
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [aiSuggestionsLoading, setAiSuggestionsLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Availability calendar state
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<'morning' | 'afternoon' | 'evening' | 'full_day'>('full_day');
  const [selectedEventForBooking, setSelectedEventForBooking] = useState<string>('');
  const [calendarBookingNotes, setCalendarBookingNotes] = useState<string>('');
  
  // Quote request state
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);
  const [quoteEventId, setQuoteEventId] = useState<string>('');
  const [quoteBudgetRange, setQuoteBudgetRange] = useState<string>('');
  const [quoteNotes, setQuoteNotes] = useState<string>('');
  const [quoteConfirmStep, setQuoteConfirmStep] = useState<boolean>(false);
  const [bookingConfirmDialogOpen, setBookingConfirmDialogOpen] = useState<boolean>(false);

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

  // Create booking request mutation - creates actual Booking record for vendor approval
  const createBookingMutation = useMutation({
    mutationFn: async (data: {
      vendorId: string;
      date: Date;
      timeSlot: string;
      eventId?: string;
      coupleNotes?: string;
    }) => {
      if (!weddingId) throw new Error("Wedding ID is required to create a booking");
      
      // Create a Booking record with pending status (requires vendor confirmation)
      const bookingResponse = await apiRequest('POST', '/api/bookings', {
        weddingId: weddingId,
        vendorId: data.vendorId,
        eventId: data.eventId || null,
        requestedDate: data.date.toISOString(),
        timeSlot: data.timeSlot,
        status: 'pending',
        coupleNotes: data.coupleNotes || null,
      });
      
      // Also create a vendor availability entry to block the slot as "pending"
      await apiRequest('POST', '/api/vendor-availability', {
        vendorId: data.vendorId,
        date: data.date.toISOString(),
        timeSlot: data.timeSlot,
        status: 'pending',
        weddingId: weddingId,
        eventId: data.eventId || null,
      });
      
      return bookingResponse;
    },
    onSuccess: (_data, variables) => {
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ 
        queryKey: ['/api/vendor-availability/vendor', variables.vendorId, 'range'],
        exact: false
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      setBookingDialogOpen(false);
      setSelectedDate(undefined);
      setCalendarBookingNotes('');
      toast({
        title: "Booking request sent!",
        description: `Your booking request for ${selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'the selected date'} has been sent to the vendor. They will confirm or suggest alternative dates.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Request failed",
        description: error.message || "Failed to send booking request. Please try again.",
        variant: "destructive",
      });
    },
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

  // AI suggestion handler for booking messages
  const handleGetAiSuggestions = async () => {
    if (!vendor) return;
    
    setAiSuggestionsLoading(true);
    setAiSuggestions([]);
    
    try {
      const selectedEventNames = events
        .filter(e => selectedEvents.includes(e.id))
        .map(e => e.name)
        .join(", ");
      
      const response = await apiRequest("POST", "/api/ai/couple-message-suggestions", {
        vendorName: vendor.name,
        vendorCategory: vendor.categories?.[0] || 'vendor',
        coupleName: coupleName || "Couple",
        eventName: selectedEventNames || undefined,
        eventDate: weddingDate,
        tradition,
        city,
        existingNotes: notes || undefined,
      });
      
      const data = await response.json();
      if (data.suggestions && Array.isArray(data.suggestions)) {
        setAiSuggestions(data.suggestions);
      }
    } catch (error) {
      toast({ title: "Failed to get AI suggestions", variant: "destructive" });
    } finally {
      setAiSuggestionsLoading(false);
    }
  };

  const handleUseAiSuggestion = (suggestion: string) => {
    setNotes(suggestion);
    setAiSuggestions([]);
    toast({ title: "AI suggestion applied to your message" });
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

  const handleBookVendor = async () => {
    if (!vendor || !selectedDate) return;
    
    if (!weddingId) {
      toast({
        title: "Authentication required",
        description: "Please sign in to request a booking.",
        variant: "destructive",
      });
      return;
    }

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

    // Create the booking request (vendor will need to confirm)
    createBookingMutation.mutate({
      vendorId: vendor.id,
      date: selectedDate,
      timeSlot: selectedTimeSlot,
      eventId: selectedEventForBooking || undefined,
      coupleNotes: calendarBookingNotes || undefined,
    });
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

          {/* Booking section - different for claimed vs unclaimed vendors */}
          <>
          <Separator />

          <div className="pt-6">
            {/* For UNCLAIMED vendors - show only offline booking option */}
            {!vendor.claimed && isAuthenticated && onOfflineBooking && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">Mark as Booked</h3>
                </div>
                <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 mb-4">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    This vendor hasn't claimed their profile yet, so you can't request a booking through the app. 
                    If you've already contacted and booked them directly, you can mark them as booked to track them in your wedding plan.
                  </p>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-base mb-3 block">
                      Which events did you book them for? ({selectedEvents.length} selected)
                    </Label>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto border rounded-lg p-3">
                      {events.length > 0 ? (
                        events.map((event) => (
                          <div 
                            key={event.id} 
                            className="flex items-center space-x-3 hover-elevate p-2 rounded-md"
                            data-testid={`unclaimed-offline-event-${event.id}`}
                          >
                            <Checkbox
                              id={`unclaimed-offline-event-${event.id}`}
                              checked={selectedEvents.includes(event.id)}
                              onCheckedChange={() => handleEventToggle(event.id)}
                            />
                            <label
                              htmlFor={`unclaimed-offline-event-${event.id}`}
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
                    <Label htmlFor="unclaimed-offline-notes" className="text-base mb-2 block">
                      Notes (Optional)
                    </Label>
                    <Textarea
                      id="unclaimed-offline-notes"
                      placeholder="Add any notes about the booking (contact info, etc.)..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      data-testid="textarea-unclaimed-offline-notes"
                    />
                  </div>

                  <div>
                    <Label htmlFor="unclaimed-agreed-price" className="text-base mb-2 block">
                      Agreed Price (Optional)
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="unclaimed-agreed-price"
                        type="text"
                        inputMode="decimal"
                        placeholder="0.00"
                        value={agreedPrice}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9.]/g, '');
                          setAgreedPrice(value);
                        }}
                        className="pl-8"
                        data-testid="input-unclaimed-agreed-price"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Track the price you agreed on for budget tracking
                    </p>
                  </div>

                  <Button
                    onClick={() => {
                      if (vendor && selectedEvents.length > 0) {
                        onOfflineBooking(vendor.id, selectedEvents, notes, agreedPrice || undefined);
                        setSelectedEvents([]);
                        setNotes("");
                        setAgreedPrice("");
                        onClose();
                      }
                    }}
                    disabled={selectedEvents.length === 0}
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                    data-testid="button-confirm-unclaimed-offline-booking"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Mark as Booked for {selectedEvents.length} {selectedEvents.length === 1 ? 'Event' : 'Events'}
                  </Button>
                </div>
              </>
            )}

            {/* For CLAIMED vendors - show both options with toggle */}
            {vendor.claimed && (
            <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">
                {offlineBookingMode ? "Mark as Booked Offline" : "Request Booking"}
              </h3>
              {isAuthenticated && onOfflineBooking && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setOfflineBookingMode(!offlineBookingMode);
                    setSelectedEvents([]);
                    setNotes("");
                  }}
                  className="text-xs"
                  data-testid="button-toggle-offline-booking"
                >
                  {offlineBookingMode ? "Request Booking Instead" : "Already Booked Offline?"}
                </Button>
              )}
            </div>
            
            {offlineBookingMode && isAuthenticated && onOfflineBooking ? (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
                  <p className="text-sm text-emerald-800 dark:text-emerald-200">
                    Use this if you've already booked this vendor outside the app. This will add them to your vendor list and associate them with your selected events.
                  </p>
                </div>
                
                <div>
                  <Label className="text-base mb-3 block">
                    Which events did you book them for? ({selectedEvents.length} selected)
                  </Label>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto border rounded-lg p-3">
                    {events.length > 0 ? (
                      events.map((event) => (
                        <div 
                          key={event.id} 
                          className="flex items-center space-x-3 hover-elevate p-2 rounded-md"
                          data-testid={`offline-event-checkbox-${event.id}`}
                        >
                          <Checkbox
                            id={`offline-event-${event.id}`}
                            checked={selectedEvents.includes(event.id)}
                            onCheckedChange={() => handleEventToggle(event.id)}
                          />
                          <label
                            htmlFor={`offline-event-${event.id}`}
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
                  <Label htmlFor="offline-notes" className="text-base mb-2 block">
                    Notes (Optional)
                  </Label>
                  <Textarea
                    id="offline-notes"
                    placeholder="Add any notes about the booking (contact info, etc.)..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    data-testid="textarea-offline-notes"
                  />
                </div>

                <div>
                  <Label htmlFor="offline-agreed-price" className="text-base mb-2 block">
                    Agreed Price (Optional)
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="offline-agreed-price"
                      type="text"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={agreedPrice}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9.]/g, '');
                        setAgreedPrice(value);
                      }}
                      className="pl-8"
                      data-testid="input-offline-agreed-price"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Track the price you agreed on for budget tracking
                  </p>
                </div>

                <Button
                  onClick={() => {
                    if (vendor && selectedEvents.length > 0) {
                      onOfflineBooking(vendor.id, selectedEvents, notes, agreedPrice || undefined);
                      setSelectedEvents([]);
                      setNotes("");
                      setAgreedPrice("");
                      setOfflineBookingMode(false);
                      onClose();
                    }
                  }}
                  disabled={selectedEvents.length === 0}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  data-testid="button-confirm-offline-booking"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Mark as Booked for {selectedEvents.length} {selectedEvents.length === 1 ? 'Event' : 'Events'}
                </Button>
              </div>
            ) : !isAuthenticated ? (
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
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="booking-notes" className="text-base">
                      Message to Vendor (Optional)
                    </Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGetAiSuggestions}
                      disabled={aiSuggestionsLoading}
                      data-testid="button-ai-suggest-booking"
                    >
                      <Sparkles className="h-3 w-3 mr-1" />
                      {aiSuggestionsLoading ? "Generating..." : "AI Suggest"}
                    </Button>
                  </div>
                  
                  {aiSuggestions.length > 0 && (
                    <div className="mb-3 space-y-2">
                      <Label className="text-xs text-muted-foreground">AI Suggestions - Click to use</Label>
                      {aiSuggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          className="p-3 bg-primary/5 border border-primary/20 rounded-lg cursor-pointer hover-elevate"
                          onClick={() => handleUseAiSuggestion(suggestion)}
                          data-testid={`button-use-ai-suggestion-${index}`}
                        >
                          <p className="text-sm line-clamp-3">{suggestion}</p>
                          <div className="flex items-center gap-1 mt-2 text-xs text-primary">
                            <Sparkles className="h-3 w-3" />
                            Click to use this suggestion
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <Textarea
                    id="booking-notes"
                    placeholder="Tell the vendor about your specific needs, preferences, or questions..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    data-testid="textarea-booking-notes"
                  />
                </div>

                <Button
                  onClick={() => setBookingConfirmDialogOpen(true)}
                  disabled={selectedEvents.length === 0}
                  className="w-full"
                  data-testid="button-review-booking"
                >
                  Review & Send Request for {selectedEvents.length} {selectedEvents.length === 1 ? 'Event' : 'Events'}
                </Button>
              </div>
            )}
            </>
            )}
          </div>
          </>
          
        </div>

        {/* Booking Request Dialog */}
        <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
          <DialogContent data-testid="dialog-booking">
            <DialogHeader>
              <DialogTitle>Request Booking with {vendor.name}</DialogTitle>
              <DialogDescription>
                Send a booking request for {selectedDate && format(selectedDate, 'MMMM d, yyyy')}. 
                The vendor will confirm or suggest alternative dates.
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
                      <span className="text-sm font-medium">This time slot may be unavailable</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="text-sm font-medium">This time slot appears available!</span>
                    </>
                  )}
                </div>
              )}

              <div>
                <label className="text-sm font-medium mb-2 block">Preferred Time Slot</label>
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

              <div>
                <label className="text-sm font-medium mb-2 block">Message to Vendor (Optional)</label>
                <Textarea
                  placeholder="Tell the vendor about your specific needs, event details, or any questions..."
                  value={calendarBookingNotes}
                  onChange={(e) => setCalendarBookingNotes(e.target.value)}
                  rows={3}
                  data-testid="textarea-calendar-booking-notes"
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setBookingDialogOpen(false);
                  setCalendarBookingNotes('');
                }}
                data-testid="button-cancel-booking"
              >
                Cancel
              </Button>
              <Button
                onClick={handleBookVendor}
                disabled={createBookingMutation.isPending || !weddingId}
                data-testid="button-confirm-booking"
              >
                <Send className="w-4 h-4 mr-2" />
                {createBookingMutation.isPending ? 'Sending...' : 'Send Booking Request'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Booking Confirmation Dialog */}
        <Dialog open={bookingConfirmDialogOpen} onOpenChange={setBookingConfirmDialogOpen}>
          <DialogContent className="max-w-md max-h-[85vh] flex flex-col p-0" data-testid="dialog-booking-confirmation">
            <DialogHeader className="shrink-0 px-6 pt-6 pb-4 border-b">
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Confirm Booking Request
              </DialogTitle>
              <DialogDescription>
                Please review the information that will be sent to {vendor.name}.
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-4">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <Mail className="w-4 h-4 text-primary" />
                    The following will be sent to the vendor:
                  </h4>
                  
                  <div className="space-y-3 text-sm">
                    <div className="text-muted-foreground font-medium">
                      {selectedEvents.length} {selectedEvents.length === 1 ? 'Event' : 'Events'} Selected:
                    </div>
                    
                    {selectedEvents.map((eventId, index) => {
                      const event = events.find(e => e.id === eventId);
                      if (!event) return null;
                      return (
                        <div 
                          key={eventId} 
                          className="p-3 rounded-lg bg-background border space-y-2"
                          data-testid={`event-summary-${eventId}`}
                        >
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs px-2 py-0">
                              Event {index + 1}
                            </Badge>
                            <span className="font-semibold">{event.name}</span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs pl-1">
                            {event.date && (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-muted-foreground" />
                                <span className="text-muted-foreground">Date:</span>
                                <span className="font-medium">{format(new Date(event.date), 'MMM d, yyyy')}</span>
                              </div>
                            )}
                            {event.time && (
                              <div className="flex items-center gap-1">
                                <span className="text-muted-foreground">Time:</span>
                                <span className="font-medium">{event.time}</span>
                              </div>
                            )}
                            {event.location && (
                              <div className="flex items-center gap-1 col-span-2">
                                <MapPin className="w-3 h-3 text-muted-foreground" />
                                <span className="text-muted-foreground">Location:</span>
                                <span className="font-medium">{event.location}</span>
                              </div>
                            )}
                            {event.guestCount && (
                              <div className="flex items-center gap-1">
                                <span className="text-muted-foreground">Guests:</span>
                                <span className="font-medium">{event.guestCount}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    
                    <Separator className="my-2" />
                    
                    <div>
                      <span className="text-muted-foreground">Your Message:</span>
                      <p className="font-medium mt-1 p-2 rounded bg-muted/50">{notes || 'No message added'}</p>
                    </div>
                  </div>
                </div>
                
                <p className="text-xs text-muted-foreground text-center">
                  Your contact email will also be shared so the vendor can respond.
                </p>
              </div>
            </div>

            <DialogFooter className="shrink-0 gap-2 px-6 py-4 border-t">
              <Button
                variant="outline"
                onClick={() => setBookingConfirmDialogOpen(false)}
                data-testid="button-back-booking"
              >
                Back to Edit
              </Button>
              <Button
                onClick={() => {
                  handleSubmit();
                  setBookingConfirmDialogOpen(false);
                }}
                data-testid="button-confirm-send-booking"
              >
                <Send className="w-4 h-4 mr-2" />
                Confirm & Send
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
