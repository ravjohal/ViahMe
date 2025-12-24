import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, MapPin, DollarSign, GitCompare, Check, UserPlus, Briefcase } from "lucide-react";
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

  return (
    <Card
      className="overflow-hidden hover-elevate transition-all cursor-pointer group"
      onClick={() => onSelect?.(vendor)}
      data-testid={`card-vendor-${vendor.id}`}
    >
      {/* Cover image or featured banner */}
      {vendor.coverImageUrl ? (
        <div className="relative h-32 overflow-hidden">
          <img 
            src={vendor.coverImageUrl} 
            alt={`${vendor.name} cover`}
            className="w-full h-full object-cover"
          />
          {featured && (
            <div className="absolute top-2 left-2 bg-primary px-3 py-1 rounded-md">
              <span className="text-xs font-semibold text-primary-foreground">RECOMMENDED</span>
            </div>
          )}
        </div>
      ) : featured ? (
        <div className="bg-primary px-4 py-2 text-center">
          <span className="text-xs font-semibold text-primary-foreground">RECOMMENDED</span>
        </div>
      ) : null}

      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 flex-1">
            {vendor.logoUrl && (
              <img 
                src={vendor.logoUrl} 
                alt={`${vendor.name} logo`}
                className="w-12 h-12 object-cover rounded-lg border flex-shrink-0"
              />
            )}
            <div>
              <h3 className="font-semibold text-lg text-foreground mb-1 group-hover:text-primary transition-colors">
                {vendor.name}
              </h3>
              <div className="flex flex-wrap gap-1">
                {(vendor.categories || []).map((cat, idx) => (
                  <span key={idx} className="text-sm text-muted-foreground">
                    {CATEGORY_LABELS[cat] || cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    {idx < (vendor.categories?.length || 1) - 1 && <span className="mx-1">·</span>}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            {reviewCount > 0 ? (
              <>
                <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted">
                  <Star className="w-4 h-4 fill-primary text-primary" />
                  <span className="font-mono font-semibold text-sm" data-testid={`text-rating-${vendor.id}`}>
                    {rating.toFixed(1)}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground" data-testid={`text-review-count-${vendor.id}`}>
                  {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
                </span>
              </>
            ) : (
              <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted/50 border border-dashed border-muted-foreground/30">
                <Star className="w-4 h-4 text-muted-foreground/50" />
                <span className="text-xs text-muted-foreground" data-testid={`text-no-reviews-${vendor.id}`}>
                  No reviews yet
                </span>
              </div>
            )}
          </div>
        </div>

        {vendor.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {vendor.description}
          </p>
        )}

        <div className="flex items-center gap-4 mb-4 text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>{vendor.location}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <DollarSign className="w-4 h-4" />
            <span className="font-mono font-semibold">{vendor.priceRange}</span>
          </div>
        </div>

        {vendor.culturalSpecialties && vendor.culturalSpecialties.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {vendor.culturalSpecialties.map((specialty: string) => (
              <Badge key={specialty} variant="outline" className="text-xs">
                {specialty}
              </Badge>
            ))}
          </div>
        )}

        <div className="space-y-2">
          <Button
            className="w-full"
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.(vendor);
            }}
            data-testid={`button-book-vendor-${vendor.id}`}
          >
            View Details
          </Button>

          {/* Show Sign Up to Book for logged-out users viewing claimed vendors */}
          {!isLoggedIn && vendor.claimed && (
            <Link href="/onboarding" onClick={(e) => e.stopPropagation()}>
              <Button
                variant="secondary"
                className="w-full"
                data-testid={`button-signup-book-${vendor.id}`}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Sign Up to Book
              </Button>
            </Link>
          )}

          {/* Show Claim Profile for logged-out users viewing unclaimed vendors */}
          {!isLoggedIn && !vendor.claimed && (
            <Link href={`/claim-your-business?vendor=${vendor.id}`} onClick={(e) => e.stopPropagation()}>
              <Button
                variant="outline"
                className="w-full"
                data-testid={`button-claim-profile-${vendor.id}`}
              >
                <Briefcase className="w-4 h-4 mr-2" />
                Claim This Profile
              </Button>
            </Link>
          )}

          {onAddToComparison && (
            <Button
              variant={isInComparison ? "secondary" : "outline"}
              className="w-full"
              onClick={(e) => {
                e.stopPropagation();
                onAddToComparison(vendor);
              }}
              data-testid={`button-add-compare-${vendor.id}`}
            >
              {isInComparison ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Added to Compare
                </>
              ) : (
                <>
                  <GitCompare className="w-4 h-4 mr-2" />
                  Add to Compare
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
