import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, MapPin, DollarSign, GitCompare, Check, UserPlus, Briefcase, Mail, Phone, Globe, Instagram } from "lucide-react";
import { Link } from "wouter";
import type { Vendor } from "@shared/schema";

interface VendorCardProps {
  vendor: Vendor;
  onSelect?: (vendor: Vendor) => void;
  featured?: boolean;
  onAddToComparison?: (vendor: Vendor) => void;
  isInComparison?: boolean;
  isLoggedIn?: boolean;
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
}: VendorCardProps) {
  const rating = vendor.rating ? parseFloat(vendor.rating.toString()) : 0;
  const reviewCount = vendor.reviewCount || 0;
  
  // Check if vendor has any contact details in the database
  const hasContactDetails = !!(
    vendor.email || 
    vendor.phone || 
    vendor.website || 
    vendor.instagram || 
    vendor.facebook || 
    vendor.twitter ||
    vendor.contact
  );

  return (
    <Card
      className="overflow-hidden hover-elevate transition-all group rounded-xl"
      data-testid={`card-vendor-${vendor.id}`}
    >
      {/* Cover image with gradient overlay */}
      {vendor.coverImageUrl ? (
        <div className="relative h-36 overflow-hidden">
          <img 
            src={vendor.coverImageUrl} 
            alt={`${vendor.name} cover`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          {featured && (
            <div className="absolute top-3 left-3 bg-primary px-3 py-1 rounded-full shadow-md">
              <span className="text-xs font-semibold text-primary-foreground">RECOMMENDED</span>
            </div>
          )}
          {/* Rating badge on image */}
          {reviewCount > 0 && (
            <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/95 shadow-sm">
              <Star className="w-3.5 h-3.5 fill-primary text-primary" />
              <span className="font-mono font-semibold text-sm text-foreground" data-testid={`text-rating-${vendor.id}`}>
                {rating.toFixed(1)}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="relative h-24 bg-gradient-to-br from-primary/10 to-primary/5">
          {featured && (
            <div className="absolute top-3 left-3 bg-primary px-3 py-1 rounded-full shadow-md">
              <span className="text-xs font-semibold text-primary-foreground">RECOMMENDED</span>
            </div>
          )}
        </div>
      )}

      <div className="p-5">
        {/* Header with logo and name */}
        <div className="flex items-start gap-3 mb-4">
          {vendor.logoUrl && (
            <img 
              src={vendor.logoUrl} 
              alt={`${vendor.name} logo`}
              className="w-14 h-14 object-cover rounded-lg border-2 border-background shadow-sm flex-shrink-0 -mt-8 bg-background"
            />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-foreground mb-1 truncate group-hover:text-primary transition-colors">
              {vendor.name}
            </h3>
            <div className="flex flex-wrap gap-1">
              {(vendor.categories || []).slice(0, 2).map((cat, idx) => (
                <span key={idx} className="text-sm text-muted-foreground">
                  {CATEGORY_LABELS[cat] || cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  {idx < Math.min((vendor.categories?.length || 1), 2) - 1 && <span className="mx-1">·</span>}
                </span>
              ))}
              {(vendor.categories?.length || 0) > 2 && (
                <span className="text-sm text-muted-foreground">+{(vendor.categories?.length || 0) - 2}</span>
              )}
            </div>
          </div>
          
          {/* Rating for cards without cover image */}
          {!vendor.coverImageUrl && reviewCount > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted">
              <Star className="w-3.5 h-3.5 fill-primary text-primary" />
              <span className="font-mono font-semibold text-sm" data-testid={`text-rating-${vendor.id}`}>
                {rating.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {/* Description */}
        {vendor.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {vendor.description}
          </p>
        )}

        {/* Location and Price - always visible as general info */}
        <div className="flex items-center gap-4 mb-4 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>{vendor.location}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <DollarSign className="w-4 h-4" />
            <span className="font-mono font-medium">{vendor.priceRange}</span>
          </div>
        </div>

        {/* Contact Details - only for logged-in users viewing unclaimed vendors */}
        {isLoggedIn && !vendor.claimed && hasContactDetails && (
          <div className="mb-4 p-3 bg-muted/50 rounded-lg space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Contact Info</p>
            <div className="grid grid-cols-1 gap-2 text-sm">
              {vendor.email && (
                <div className="flex items-center gap-2 text-foreground">
                  <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="truncate">{vendor.email}</span>
                </div>
              )}
              {vendor.phone && (
                <div className="flex items-center gap-2 text-foreground">
                  <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>{vendor.phone}</span>
                </div>
              )}
              {vendor.website && (
                <div className="flex items-center gap-2 text-foreground">
                  <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                  <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="truncate text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
                    {vendor.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
              {vendor.instagram && (
                <div className="flex items-center gap-2 text-foreground">
                  <Instagram className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="truncate">@{vendor.instagram.replace('@', '')}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Cultural Specialties */}
        {vendor.culturalSpecialties && vendor.culturalSpecialties.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {vendor.culturalSpecialties.slice(0, 3).map((specialty: string) => (
              <Badge key={specialty} variant="secondary" className="text-xs px-2 py-0.5">
                {specialty}
              </Badge>
            ))}
            {vendor.culturalSpecialties.length > 3 && (
              <Badge variant="outline" className="text-xs px-2 py-0.5">
                +{vendor.culturalSpecialties.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Review count text */}
        {reviewCount > 0 ? (
          <p className="text-xs text-muted-foreground mb-4" data-testid={`text-review-count-${vendor.id}`}>
            {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground mb-4" data-testid={`text-no-reviews-${vendor.id}`}>
            No reviews yet
          </p>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          {/* LOGGED IN USER BEHAVIOR */}
          {isLoggedIn && (
            <>
              {/* Claimed vendor: Show Request Booking */}
              {vendor.claimed && (
                <Button
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect?.(vendor);
                  }}
                  data-testid={`button-request-booking-${vendor.id}`}
                >
                  Request Booking
                </Button>
              )}
              {/* Unclaimed vendor with no contact: only compare available (handled below) */}
            </>
          )}

          {/* NOT LOGGED IN USER BEHAVIOR */}
          {!isLoggedIn && (
            <>
              {/* Vendor has contact info AND is not claimed: Sign Up and View Contact Details */}
              {hasContactDetails && !vendor.claimed && (
                <Link href="/onboarding" onClick={(e) => e.stopPropagation()}>
                  <Button
                    className="w-full"
                    data-testid={`button-signup-contact-${vendor.id}`}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Sign Up and View Contact Details
                  </Button>
                </Link>
              )}

              {/* Vendor is not claimed: Show Claim This Profile */}
              {!vendor.claimed && (
                <Link href={`/claim-your-business?vendor=${vendor.id}`} onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="outline"
                    className="w-full"
                    data-testid={`button-claim-profile-${vendor.id}`}
                  >
                    <Briefcase className="w-4 h-4 mr-2" />
                    Claim This Vendor Profile
                  </Button>
                </Link>
              )}
            </>
          )}

          {/* Compare button - smaller, compact style for all users */}
          {onAddToComparison && (
            <div className="flex justify-end pt-1">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs px-3 h-8"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToComparison(vendor);
                }}
                data-testid={`button-add-compare-${vendor.id}`}
              >
                {isInComparison ? (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1.5" />
                    In Compare
                  </>
                ) : (
                  <>
                    <GitCompare className="w-3.5 h-3.5 mr-1.5" />
                    Compare
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
