import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Star, MapPin, DollarSign, Phone, Mail, Send, StarIcon } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Vendor, Event, Review } from "@shared/schema";

interface VendorDetailModalProps {
  vendor: Vendor | null;
  events: Event[];
  open: boolean;
  onClose: () => void;
  onBookRequest: (vendorId: string, eventId: string, notes: string, estimatedCost: string) => void;
}

const DEMO_WEDDING_ID = "wedding-1"; // TODO: Get from auth context

export function VendorDetailModal({
  vendor,
  events,
  open,
  onClose,
  onBookRequest,
}: VendorDetailModalProps) {
  const [selectedEvent, setSelectedEvent] = useState("");
  const [notes, setNotes] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);
  const { toast } = useToast();

  if (!vendor) return null;

  const rating = vendor.rating ? parseFloat(vendor.rating.toString()) : 0;

  // Fetch reviews for this vendor
  const { data: reviews = [] } = useQuery<Review[]>({
    queryKey: ["/api/reviews/vendor", vendor.id],
    enabled: !!vendor.id && open,
  });

  // Add review mutation
  const addReviewMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/reviews", {
        weddingId: DEMO_WEDDING_ID,
        vendorId: vendor.id,
        rating: reviewRating,
        comment: reviewComment.trim() || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reviews/vendor", vendor.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
      setReviewComment("");
      setReviewRating(5);
      setShowReviewForm(false);
      toast({
        title: "Review Submitted",
        description: "Thank you for your feedback!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit review. You may have already reviewed this vendor.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!selectedEvent) return;
    onBookRequest(vendor.id, selectedEvent, notes, estimatedCost);
    setSelectedEvent("");
    setNotes("");
    setEstimatedCost("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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

          {/* Reviews Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">
                Reviews ({reviews.length})
              </h3>
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
                    onClick={() => setShowReviewForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
                
                <div>
                  <Label>Rating</Label>
                  <div className="flex items-center gap-2 mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="transition-transform hover:scale-110"
                        data-testid={`button-rating-${star}`}
                      >
                        <Star
                          className={`w-8 h-8 ${
                            star <= reviewRating
                              ? "fill-primary text-primary"
                              : "text-muted-foreground"
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 font-semibold">{reviewRating}/5</span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="review-comment">Comment (Optional)</Label>
                  <Textarea
                    id="review-comment"
                    placeholder="Share your experience with this vendor..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    rows={3}
                    data-testid="textarea-review-comment"
                    className="mt-2"
                  />
                </div>

                <Button
                  onClick={() => addReviewMutation.mutate()}
                  disabled={addReviewMutation.isPending}
                  className="w-full"
                  data-testid="button-submit-review"
                >
                  {addReviewMutation.isPending ? "Submitting..." : "Submit Review"}
                </Button>
              </div>
            )}

            {reviews.length > 0 ? (
              <ScrollArea className="h-[300px] rounded-lg border p-4">
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="pb-4 border-b last:border-b-0" data-testid={`review-${review.id}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="flex">
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
                          <span className="font-semibold" data-testid={`text-review-rating-${review.id}`}>
                            {review.rating}/5
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-muted-foreground" data-testid={`text-review-comment-${review.id}`}>
                          {review.comment}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <StarIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No reviews yet. Be the first to review!</p>
              </div>
            )}
          </div>

          <Separator />

          <div className="pt-6">
            <h3 className="font-semibold text-lg mb-4">Request Booking</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="event-select" className="text-base">
                  Select Event
                </Label>
                <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                  <SelectTrigger id="event-select" data-testid="select-event-booking" className="mt-2">
                    <SelectValue placeholder="Choose an event..." />
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
                <Label htmlFor="estimated-cost" className="text-base">
                  Estimated Cost (Optional)
                </Label>
                <Input
                  id="estimated-cost"
                  type="number"
                  placeholder="Enter estimated cost..."
                  value={estimatedCost}
                  onChange={(e) => setEstimatedCost(e.target.value)}
                  data-testid="input-estimated-cost"
                  className="mt-2"
                />
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
                disabled={!selectedEvent}
                className="w-full"
                data-testid="button-submit-booking"
              >
                <Send className="w-4 h-4 mr-2" />
                Send Booking Request
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
