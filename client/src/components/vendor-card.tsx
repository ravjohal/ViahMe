import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Star, MapPin, DollarSign, GitCompare, Check, UserPlus, Briefcase, Mail, Phone, Globe, Instagram, Heart, Send, CheckCircle } from "lucide-react";
import { Link } from "wouter";
import type { Vendor, Event } from "@shared/schema";

interface VendorCardProps {
  vendor: Vendor;
  onSelect?: (vendor: Vendor) => void;
  featured?: boolean;
  onAddToComparison?: (vendor: Vendor) => void;
  isInComparison?: boolean;
  isLoggedIn?: boolean;
  events?: Event[];
  onOfflineBook?: (vendorId: string, eventIds: string[], notes: string) => void;
  onRequestBooking?: (vendorId: string, eventIds: string[], notes: string) => void;
  isFavorited?: boolean;
  onToggleFavorite?: (vendorId: string) => void;
  isBookingPending?: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  makeup_artist: "Makeup Artist",
  dj: "DJ",
  dhol_player: "Dhol Player",
  turban_tier: "Turban Tier",
  mehndi_artist: "Mehndi Artist",
  photographer: "Photographer",
  videographer: "Videographer",
  caterer: "Caterer",
  banquet_hall: "Banquet Hall",
  gurdwara: "Gurdwara",
  temple: "Temple",
  decorator: "Decorator",
  florist: "Florist",
  horse_rental: "Horse Rental",
  sword_rental: "Sword Rental",
  tent_service: "Tent Service",
  limo_service: "Limo Service",
  mobile_food: "Mobile Food Vendor",
  baraat_band: "Baraat Band",
  pandit: "Pandit (Hindu Priest)",
  mandap_decorator: "Mandap Decorator",
  haldi_supplies: "Haldi Supplies",
  pooja_items: "Pooja Items",
  astrologer: "Vedic Astrologer",
  garland_maker: "Garland Maker",
};

export function VendorCard({
  vendor,
  onSelect,
  featured,
  onAddToComparison,
  isInComparison,
  isLoggedIn = true,
  events = [],
  onOfflineBook,
  onRequestBooking,
  isFavorited = false,
  onToggleFavorite,
  isBookingPending = false,
}: VendorCardProps) {
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [bookingNotes, setBookingNotes] = useState("");
  const [offlinePopoverOpen, setOfflinePopoverOpen] = useState(false);
  const [requestPopoverOpen, setRequestPopoverOpen] = useState(false);

  const rating = vendor.rating ? parseFloat(vendor.rating.toString()) : 0;
  const reviewCount = vendor.reviewCount || 0;
  
  const hasContactDetails = !!(
    vendor.email || 
    vendor.phone || 
    vendor.website || 
    vendor.instagram || 
    vendor.facebook || 
    vendor.twitter ||
    vendor.contact
  );

  const handleEventToggle = (eventId: string) => {
    setSelectedEvents(prev => 
      prev.includes(eventId) 
        ? prev.filter(id => id !== eventId)
        : [...prev, eventId]
    );
  };

  const handleOfflineBookSubmit = () => {
    if (selectedEvents.length > 0 && onOfflineBook) {
      onOfflineBook(vendor.id, selectedEvents, bookingNotes);
      setSelectedEvents([]);
      setBookingNotes("");
      setOfflinePopoverOpen(false);
    }
  };

  const handleRequestBookingSubmit = () => {
    if (selectedEvents.length > 0 && onRequestBooking) {
      onRequestBooking(vendor.id, selectedEvents, bookingNotes);
      setSelectedEvents([]);
      setBookingNotes("");
      setRequestPopoverOpen(false);
    }
  };

  return (
    <Card
      className="overflow-hidden hover-elevate transition-all group rounded-xl flex flex-col h-full"
      data-testid={`card-vendor-${vendor.id}`}
    >
      {/* Cover image - fixed height for all cards */}
      <div className="relative h-32 overflow-hidden flex-shrink-0">
        {vendor.coverImageUrl ? (
          <>
            <img 
              src={vendor.coverImageUrl} 
              alt={`${vendor.name} cover`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5" />
        )}
        {featured && (
          <div className="absolute top-2 left-2 bg-primary px-2 py-0.5 rounded-full shadow-md">
            <span className="text-xs font-semibold text-primary-foreground">RECOMMENDED</span>
          </div>
        )}
        {/* Rating badge on image */}
        {reviewCount > 0 && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/95 shadow-sm">
            <Star className="w-3 h-3 fill-primary text-primary" />
            <span className="font-mono font-semibold text-xs text-foreground" data-testid={`text-rating-${vendor.id}`}>
              {rating.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      {/* Content area - flex-grow to fill remaining space */}
      <div className="p-4 flex flex-col flex-grow">
        {/* Header with logo and name */}
        <div className="flex items-start gap-3 mb-3">
          {vendor.logoUrl && (
            <img 
              src={vendor.logoUrl} 
              alt={`${vendor.name} logo`}
              className="w-12 h-12 object-cover rounded-lg border-2 border-background shadow-sm flex-shrink-0 -mt-8 bg-background"
            />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base text-foreground mb-0.5 truncate group-hover:text-primary transition-colors">
              {vendor.name}
            </h3>
            <div className="flex flex-wrap gap-1">
              {(vendor.categories || []).slice(0, 2).map((cat, idx) => (
                <span key={idx} className="text-xs text-muted-foreground">
                  {CATEGORY_LABELS[cat] || cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  {idx < Math.min((vendor.categories?.length || 1), 2) - 1 && <span className="mx-1">·</span>}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Location and Price - always visible */}
        <div className="flex items-center gap-3 mb-3 text-xs">
          <div className="flex items-center gap-1 text-muted-foreground">
            <MapPin className="w-3 h-3" />
            <span className="truncate">{vendor.location}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <DollarSign className="w-3 h-3" />
            <span className="font-mono font-medium">{vendor.priceRange}</span>
          </div>
        </div>

        {/* Cultural Specialties - compact */}
        {vendor.culturalSpecialties && vendor.culturalSpecialties.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {vendor.culturalSpecialties.slice(0, 2).map((specialty: string) => (
              <Badge key={specialty} variant="secondary" className="text-xs px-1.5 py-0">
                {specialty}
              </Badge>
            ))}
            {vendor.culturalSpecialties.length > 2 && (
              <Badge variant="outline" className="text-xs px-1.5 py-0">
                +{vendor.culturalSpecialties.length - 2}
              </Badge>
            )}
          </div>
        )}

        {/* Review count */}
        <p className="text-xs text-muted-foreground mb-3" data-testid={reviewCount > 0 ? `text-review-count-${vendor.id}` : `text-no-reviews-${vendor.id}`}>
          {reviewCount > 0 ? `${reviewCount} ${reviewCount === 1 ? 'review' : 'reviews'}` : 'No reviews yet'}
        </p>

        {/* Spacer to push buttons to bottom */}
        <div className="flex-grow" />

        {/* Action Buttons - always at the bottom */}
        <div className="space-y-2 mt-auto">
          {/* LOGGED IN USER BEHAVIOR */}
          {isLoggedIn && (
            <>
              {/* Claimed vendor: Show Request Booking with popover */}
              {vendor.claimed ? (
                <Popover open={requestPopoverOpen} onOpenChange={setRequestPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      className="w-full"
                      size="sm"
                      onClick={(e) => e.stopPropagation()}
                      disabled={isBookingPending}
                      data-testid={`button-request-booking-${vendor.id}`}
                    >
                      <Send className="w-3.5 h-3.5 mr-1.5" />
                      Request Booking
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="start" onClick={(e) => e.stopPropagation()}>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-sm mb-1">Request Booking</h4>
                        <p className="text-xs text-muted-foreground">
                          Send a booking request to {vendor.name}. They will confirm your booking.
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Select Events</Label>
                        {events.length === 0 ? (
                          <p className="text-xs text-muted-foreground">No events created yet</p>
                        ) : (
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {events.map((event) => (
                              <div key={event.id} className="flex items-center gap-2">
                                <Checkbox
                                  id={`request-event-${event.id}`}
                                  checked={selectedEvents.includes(event.id)}
                                  onCheckedChange={() => handleEventToggle(event.id)}
                                  data-testid={`checkbox-request-event-${event.id}`}
                                />
                                <label
                                  htmlFor={`request-event-${event.id}`}
                                  className="text-sm cursor-pointer flex-1"
                                >
                                  {event.name}
                                </label>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Notes (optional)</Label>
                        <Textarea
                          placeholder="Any special requests or details..."
                          value={bookingNotes}
                          onChange={(e) => setBookingNotes(e.target.value)}
                          className="h-20 resize-none"
                          data-testid={`textarea-request-notes-${vendor.id}`}
                        />
                      </div>

                      <Button
                        className="w-full"
                        onClick={handleRequestBookingSubmit}
                        disabled={selectedEvents.length === 0 || isBookingPending}
                        data-testid={`button-submit-request-${vendor.id}`}
                      >
                        {isBookingPending ? "Sending..." : "Send Request"}
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              ) : (
                /* Unclaimed vendor: Show Mark as Booked (offline) with popover */
                <Popover open={offlinePopoverOpen} onOpenChange={setOfflinePopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      className="w-full"
                      size="sm"
                      onClick={(e) => e.stopPropagation()}
                      disabled={isBookingPending}
                      data-testid={`button-offline-booking-${vendor.id}`}
                    >
                      <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                      Mark as Booked
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="start" onClick={(e) => e.stopPropagation()}>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-sm mb-1">Mark as Booked</h4>
                        <p className="text-xs text-muted-foreground">
                          Already booked {vendor.name} outside the app? Track it here.
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Select Events</Label>
                        {events.length === 0 ? (
                          <p className="text-xs text-muted-foreground">No events created yet</p>
                        ) : (
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {events.map((event) => (
                              <div key={event.id} className="flex items-center gap-2">
                                <Checkbox
                                  id={`offline-event-${event.id}`}
                                  checked={selectedEvents.includes(event.id)}
                                  onCheckedChange={() => handleEventToggle(event.id)}
                                  data-testid={`checkbox-offline-event-${event.id}`}
                                />
                                <label
                                  htmlFor={`offline-event-${event.id}`}
                                  className="text-sm cursor-pointer flex-1"
                                >
                                  {event.name}
                                </label>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Notes (optional)</Label>
                        <Textarea
                          placeholder="Booking details, price agreed, etc..."
                          value={bookingNotes}
                          onChange={(e) => setBookingNotes(e.target.value)}
                          className="h-20 resize-none"
                          data-testid={`textarea-offline-notes-${vendor.id}`}
                        />
                      </div>

                      <Button
                        className="w-full"
                        onClick={handleOfflineBookSubmit}
                        disabled={selectedEvents.length === 0 || isBookingPending}
                        data-testid={`button-submit-offline-${vendor.id}`}
                      >
                        {isBookingPending ? "Saving..." : "Save Booking"}
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              )}

              {/* View Details button */}
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect?.(vendor);
                }}
                data-testid={`button-view-details-${vendor.id}`}
              >
                View Details
              </Button>

              {/* Bottom row with favorite and compare */}
              <div className="flex items-center justify-between pt-1">
                {/* Favorite button - always visible at bottom */}
                {onToggleFavorite && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(vendor.id);
                    }}
                    data-testid={`button-favorite-${vendor.id}`}
                  >
                    <Heart className={`w-4 h-4 mr-1.5 ${isFavorited ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
                    <span className="text-xs">{isFavorited ? 'Saved' : 'Save'}</span>
                  </Button>
                )}

                {/* Compare button */}
                {onAddToComparison && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToComparison(vendor);
                    }}
                    data-testid={`button-add-compare-${vendor.id}`}
                  >
                    {isInComparison ? (
                      <>
                        <Check className="w-3.5 h-3.5 mr-1" />
                        <span className="text-xs">Comparing</span>
                      </>
                    ) : (
                      <>
                        <GitCompare className="w-3.5 h-3.5 mr-1" />
                        <span className="text-xs">Compare</span>
                      </>
                    )}
                  </Button>
                )}
              </div>
            </>
          )}

          {/* NOT LOGGED IN USER BEHAVIOR */}
          {!isLoggedIn && (
            <>
              {/* Vendor IS claimed: Sign Up and Book */}
              {vendor.claimed && (
                <Link href="/onboarding" onClick={(e) => e.stopPropagation()}>
                  <Button
                    className="w-full"
                    size="sm"
                    data-testid={`button-signup-book-${vendor.id}`}
                  >
                    <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                    Sign Up and Book
                  </Button>
                </Link>
              )}

              {/* Vendor has contact info AND is not claimed: Sign Up and View Contact Details */}
              {hasContactDetails && !vendor.claimed && (
                <Link href="/onboarding" onClick={(e) => e.stopPropagation()}>
                  <Button
                    className="w-full"
                    size="sm"
                    data-testid={`button-signup-contact-${vendor.id}`}
                  >
                    <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                    Sign Up to View Contact
                  </Button>
                </Link>
              )}

              {/* Vendor is not claimed: Show Claim This Profile */}
              {!vendor.claimed && (
                <Link href={`/claim-your-business?vendor=${vendor.id}`} onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    data-testid={`button-claim-profile-${vendor.id}`}
                  >
                    <Briefcase className="w-3.5 h-3.5 mr-1.5" />
                    Claim This Profile
                  </Button>
                </Link>
              )}

              {/* Compare button for non-logged in users */}
              {onAddToComparison && (
                <div className="flex justify-end pt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToComparison(vendor);
                    }}
                    data-testid={`button-add-compare-${vendor.id}`}
                  >
                    {isInComparison ? (
                      <>
                        <Check className="w-3.5 h-3.5 mr-1" />
                        <span className="text-xs">Comparing</span>
                      </>
                    ) : (
                      <>
                        <GitCompare className="w-3.5 h-3.5 mr-1" />
                        <span className="text-xs">Compare</span>
                      </>
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
