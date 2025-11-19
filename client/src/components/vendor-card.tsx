import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, MapPin, DollarSign } from "lucide-react";
import type { Vendor } from "@shared/schema";

interface VendorCardProps {
  vendor: Vendor;
  onSelect?: (vendor: Vendor) => void;
  featured?: boolean;
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
};

export function VendorCard({ vendor, onSelect, featured }: VendorCardProps) {
  const rating = vendor.rating ? parseFloat(vendor.rating.toString()) : 0;

  return (
    <Card
      className="overflow-hidden hover-elevate transition-all cursor-pointer group"
      onClick={() => onSelect?.(vendor)}
      data-testid={`card-vendor-${vendor.id}`}
    >
      {featured && (
        <div className="bg-primary px-4 py-2 text-center">
          <span className="text-xs font-semibold text-primary-foreground">
            ⭐ RECOMMENDED
          </span>
        </div>
      )}

      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-foreground mb-1 group-hover:text-primary transition-colors">
              {vendor.name}
            </h3>
            <p className="text-sm text-muted-foreground">
              {CATEGORY_LABELS[vendor.category] || vendor.category}
            </p>
          </div>
          {rating > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted">
              <Star className="w-4 h-4 fill-primary text-primary" />
              <span className="font-mono font-semibold text-sm">{rating.toFixed(1)}</span>
            </div>
          )}
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

        <Button
          className="w-full"
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.(vendor);
          }}
          data-testid={`button-book-vendor-${vendor.id}`}
        >
          View Details & Book
        </Button>
      </div>
    </Card>
  );
}
