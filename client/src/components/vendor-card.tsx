import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Star, MapPin, DollarSign, GitCompare, Check, UserPlus, Briefcase, Mail, Phone, Globe, Heart, Send, CheckCircle } from "lucide-react";
import { SiInstagram, SiFacebook, SiX } from "react-icons/si";
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
  onOfflineBook?: (vendorId: string, eventIds: string[], notes: string, agreedPrice?: string) => void;
  onRequestBooking?: (vendorId: string, eventIds: string[], notes: string) => void;
  isFavorited?: boolean;
  onToggleFavorite?: (vendorId: string) => void;
  isBookingPending?: boolean;
  bookedEventIds?: string[];
  onViewBookings?: (vendorId: string) => void;
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
  bookedEventIds = [],
  onViewBookings,
}: VendorCardProps) {
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [bookingNotes, setBookingNotes] = useState("");
  const [agreedPrice, setAgreedPrice] = useState("");
  const [offlinePopoverOpen, setOfflinePopoverOpen] = useState(false);
  const [requestPopoverOpen, setRequestPopoverOpen] = useState(false);
  
  const hasBookedEvents = bookedEventIds.length > 0;
  const unbookedEvents = events.filter(e => !bookedEventIds.includes(e.id));

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
      onOfflineBook(vendor.id, selectedEvents, bookingNotes, agreedPrice || undefined);
      setSelectedEvents([]);
      setBookingNotes("");
      setAgreedPrice("");
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

        {/* Contact Info - only for logged in users, show all fields for consistent sizing */}
        {isLoggedIn && (
          <div className="space-y-1.5 mb-3 text-xs border-t pt-3" data-testid={`contact-section-${vendor.id}`}>
            <div className="flex items-center gap-2">
              <Phone className="w-3 h-3 text-muted-foreground flex-shrink-0" />
              {vendor.phone ? (
                <a 
                  href={`tel:${vendor.phone}`} 
                  className="text-foreground hover:text-primary truncate"
                  onClick={(e) => e.stopPropagation()}
                  data-testid={`link-phone-${vendor.id}`}
                >
                  {vendor.phone}
                </a>
              ) : (
                <span className="text-muted-foreground italic">Not provided</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-3 h-3 text-muted-foreground flex-shrink-0" />
              {vendor.email ? (
                <a 
                  href={`mailto:${vendor.email}`} 
                  className="text-foreground hover:text-primary truncate"
                  onClick={(e) => e.stopPropagation()}
                  data-testid={`link-email-${vendor.id}`}
                >
                  {vendor.email}
                </a>
              ) : (
                <span className="text-muted-foreground italic">Not provided</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-3 h-3 text-muted-foreground flex-shrink-0" />
              {vendor.website ? (
                <a 
                  href={vendor.website.startsWith('http') ? vendor.website : `https://${vendor.website}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-foreground hover:text-primary truncate"
                  onClick={(e) => e.stopPropagation()}
                  data-testid={`link-website-${vendor.id}`}
                >
                  {vendor.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                </a>
              ) : (
                <span className="text-muted-foreground italic">Not provided</span>
              )}
            </div>
            <div className="flex items-center gap-3 pt-1">
              <div className="flex items-center gap-1.5">
                <SiInstagram className="w-3 h-3 text-muted-foreground" />
                {vendor.instagram ? (
                  <a 
                    href={`https://instagram.com/${vendor.instagram.replace('@', '')}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-foreground hover:text-primary"
                    onClick={(e) => e.stopPropagation()}
                    data-testid={`link-instagram-${vendor.id}`}
                  >
                    @{vendor.instagram.replace('@', '')}
                  </a>
                ) : (
                  <span className="text-muted-foreground italic">-</span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <SiFacebook className="w-3 h-3 text-muted-foreground" />
                {vendor.facebook ? (
                  <a 
                    href={vendor.facebook.startsWith('http') ? vendor.facebook : `https://facebook.com/${vendor.facebook}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-foreground hover:text-primary truncate max-w-[60px]"
                    onClick={(e) => e.stopPropagation()}
                    data-testid={`link-facebook-${vendor.id}`}
                  >
                    FB
                  </a>
                ) : (
                  <span className="text-muted-foreground italic">-</span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <SiX className="w-3 h-3 text-muted-foreground" />
                {vendor.twitter ? (
                  <a 
                    href={`https://x.com/${vendor.twitter.replace('@', '')}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-foreground hover:text-primary"
                    onClick={(e) => e.stopPropagation()}
                    data-testid={`link-twitter-${vendor.id}`}
                  >
                    @{vendor.twitter.replace('@', '')}
                  </a>
                ) : (
                  <span className="text-muted-foreground italic">-</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Spacer to push buttons to bottom */}
        <div className="flex-grow" />

        {/* Action Buttons - always at the bottom */}
        <div className="space-y-2 mt-auto">
          {/* LOGGED IN USER BEHAVIOR */}
          {isLoggedIn && (
            <>
              {/* Show booked events indicator if vendor has bookings - clickable to view bookings */}
              {hasBookedEvents && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewBookings?.(vendor.id);
                  }}
                  className="w-full py-1.5 px-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md flex items-center gap-2 hover:bg-green-100 dark:hover:bg-green-900 transition-colors cursor-pointer"
                  data-testid={`button-view-bookings-${vendor.id}`}
                >
                  <CheckCircle className="w-3.5 h-3.5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <span className="text-xs font-medium text-green-700 dark:text-green-300">
                    Booked for {bookedEventIds.length} event{bookedEventIds.length > 1 ? 's' : ''} — View
                  </span>
                </button>
              )}

              {/* Claimed vendor: Show Request Booking with popover */}
              {vendor.claimed ? (
                <Popover open={requestPopoverOpen} onOpenChange={setRequestPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      className="w-full"
                      size="sm"
                      variant={hasBookedEvents ? "outline" : "default"}
                      onClick={(e) => e.stopPropagation()}
                      disabled={isBookingPending || unbookedEvents.length === 0}
                      data-testid={`button-request-booking-${vendor.id}`}
                    >
                      <Send className="w-3.5 h-3.5 mr-1.5" />
                      {hasBookedEvents ? "Book More Events" : "Request Booking"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="start" onClick={(e) => e.stopPropagation()}>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-sm mb-1">
                          {hasBookedEvents ? "Book Additional Events" : "Request Booking"}
                        </h4>
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
                            {events.map((event) => {
                              const isAlreadyBooked = bookedEventIds.includes(event.id);
                              return (
                                <div key={event.id} className="flex items-center gap-2">
                                  <Checkbox
                                    id={`request-event-${event.id}`}
                                    checked={isAlreadyBooked || selectedEvents.includes(event.id)}
                                    onCheckedChange={() => !isAlreadyBooked && handleEventToggle(event.id)}
                                    disabled={isAlreadyBooked}
                                    data-testid={`checkbox-request-event-${event.id}`}
                                  />
                                  <label
                                    htmlFor={`request-event-${event.id}`}
                                    className={`text-sm flex-1 ${isAlreadyBooked ? 'text-muted-foreground' : 'cursor-pointer'}`}
                                  >
                                    {event.name}
                                    {isAlreadyBooked && (
                                      <span className="ml-1.5 text-xs text-green-600 dark:text-green-400">(booked)</span>
                                    )}
                                  </label>
                                </div>
                              );
                            })}
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
                      variant={hasBookedEvents ? "outline" : "default"}
                      onClick={(e) => e.stopPropagation()}
                      disabled={isBookingPending || unbookedEvents.length === 0}
                      data-testid={`button-offline-booking-${vendor.id}`}
                    >
                      <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                      {hasBookedEvents ? "Book More Events" : "Mark as Booked"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="start" onClick={(e) => e.stopPropagation()}>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-sm mb-1">
                          {hasBookedEvents ? "Book Additional Events" : "Mark as Booked"}
                        </h4>
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
                            {events.map((event) => {
                              const isAlreadyBooked = bookedEventIds.includes(event.id);
                              return (
                                <div key={event.id} className="flex items-center gap-2">
                                  <Checkbox
                                    id={`offline-event-${event.id}`}
                                    checked={isAlreadyBooked || selectedEvents.includes(event.id)}
                                    onCheckedChange={() => !isAlreadyBooked && handleEventToggle(event.id)}
                                    disabled={isAlreadyBooked}
                                    data-testid={`checkbox-offline-event-${event.id}`}
                                  />
                                  <label
                                    htmlFor={`offline-event-${event.id}`}
                                    className={`text-sm flex-1 ${isAlreadyBooked ? 'text-muted-foreground' : 'cursor-pointer'}`}
                                  >
                                    {event.name}
                                    {isAlreadyBooked && (
                                      <span className="ml-1.5 text-xs text-green-600 dark:text-green-400">(booked)</span>
                                    )}
                                  </label>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Agreed Price</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                          <Input
                            type="number"
                            placeholder="0.00"
                            value={agreedPrice}
                            onChange={(e) => setAgreedPrice(e.target.value)}
                            className="pl-7"
                            data-testid={`input-agreed-price-${vendor.id}`}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          This will be used to track your budget and spending.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Notes (optional)</Label>
                        <Textarea
                          placeholder="Any additional booking details..."
                          value={bookingNotes}
                          onChange={(e) => setBookingNotes(e.target.value)}
                          className="h-16 resize-none"
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
