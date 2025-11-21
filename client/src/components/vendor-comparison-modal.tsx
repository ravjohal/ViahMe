import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { X, Star, MapPin, DollarSign, Phone, Mail, Globe, Check, Minus } from "lucide-react";
import type { Vendor } from "@shared/schema";

interface VendorComparisonModalProps {
  vendors: Vendor[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRemoveVendor: (vendorId: string) => void;
  onClearAll: () => void;
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
  pandit: "Pandit",
  mandap_decorator: "Mandap Decorator",
  haldi_supplies: "Haldi Supplies",
  pooja_items: "Pooja Items",
  astrologer: "Vedic Astrologer",
  garland_maker: "Garland Maker",
};

export function VendorComparisonModal({
  vendors,
  open,
  onOpenChange,
  onRemoveVendor,
  onClearAll,
}: VendorComparisonModalProps) {

  const comparisonRows = [
    {
      label: "Vendor Name",
      getValue: (vendor: Vendor) => vendor.name,
    },
    {
      label: "Category",
      getValue: (vendor: Vendor) => CATEGORY_LABELS[vendor.category] || vendor.category,
    },
    {
      label: "Price Range",
      getValue: (vendor: Vendor) => vendor.priceRange,
      renderValue: (value: string) => (
        <span className="font-mono font-semibold text-lg">{value}</span>
      ),
    },
    {
      label: "Rating",
      getValue: (vendor: Vendor) => vendor.rating ? parseFloat(vendor.rating.toString()).toFixed(1) : "N/A",
      renderValue: (value: string, vendor: Vendor) => {
        if (value === "N/A") {
          return <span className="text-muted-foreground">No ratings yet</span>;
        }
        const reviewCount = vendor.reviewCount || 0;
        return (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted">
              <Star className="w-4 h-4 fill-primary text-primary" />
              <span className="font-mono font-semibold">{value}</span>
            </div>
            {reviewCount > 0 && (
              <span className="text-xs text-muted-foreground">
                ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
              </span>
            )}
          </div>
        );
      },
    },
    {
      label: "Location",
      getValue: (vendor: Vendor) => vendor.location,
      renderValue: (value: string) => (
        <div className="flex items-center gap-1 text-sm">
          <MapPin className="w-4 h-4 text-muted-foreground" />
          <span>{value}</span>
        </div>
      ),
    },
    {
      label: "City",
      getValue: (vendor: Vendor) => vendor.city,
    },
    {
      label: "Cultural Specialties",
      getValue: (vendor: Vendor) => vendor.culturalSpecialties?.join(", ") || "None specified",
      renderValue: (value: string, vendor: Vendor) => {
        if (!vendor.culturalSpecialties || vendor.culturalSpecialties.length === 0) {
          return <span className="text-muted-foreground">None specified</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {vendor.culturalSpecialties.map((specialty: string) => (
              <Badge key={specialty} variant="outline" className="text-xs">
                {specialty}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      label: "Contact",
      getValue: (vendor: Vendor) => vendor.phone || vendor.email || "Not provided",
      renderValue: (value: string, vendor: Vendor) => (
        <div className="space-y-1">
          {vendor.phone && (
            <div className="flex items-center gap-1 text-sm">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span>{vendor.phone}</span>
            </div>
          )}
          {vendor.email && (
            <div className="flex items-center gap-1 text-sm">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className="truncate">{vendor.email}</span>
            </div>
          )}
          {vendor.website && (
            <div className="flex items-center gap-1 text-sm">
              <Globe className="w-4 h-4 text-muted-foreground" />
              <a
                href={vendor.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline truncate"
              >
                Website
              </a>
            </div>
          )}
          {!vendor.phone && !vendor.email && !vendor.website && (
            <span className="text-muted-foreground text-sm">Not provided</span>
          )}
        </div>
      ),
    },
    {
      label: "Description",
      getValue: (vendor: Vendor) => vendor.description || "No description available",
      renderValue: (value: string) => (
        <p className="text-sm text-muted-foreground line-clamp-3">{value}</p>
      ),
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-semibold">
              Compare Vendors ({vendors.length})
            </DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={onClearAll}
              data-testid="button-clear-comparison"
            >
              Clear All
            </Button>
          </div>
          <DialogDescription>
            View key details side-by-side to make an informed decision about which vendors best fit your wedding needs
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="sticky left-0 z-10 bg-background p-4 text-left font-semibold w-48">
                  Feature
                </th>
                {vendors.map((vendor) => (
                  <th key={vendor.id} className="p-4 min-w-[250px]">
                    <Card className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-lg">{vendor.name}</h3>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveVendor(vendor.id);
                          }}
                          className="shrink-0"
                          data-testid={`button-remove-comparison-${vendor.id}`}
                          aria-label={`Remove ${vendor.name} from comparison`}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {CATEGORY_LABELS[vendor.category] || vendor.category}
                      </p>
                    </Card>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="border-b hover-elevate"
                  data-testid={`row-comparison-${row.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <td className="sticky left-0 z-10 bg-background p-4 font-medium">
                    {row.label}
                  </td>
                  {vendors.map((vendor) => (
                    <td key={vendor.id} className="p-4 align-top">
                      {row.renderValue
                        ? row.renderValue(row.getValue(vendor), vendor)
                        : row.getValue(vendor)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Separator className="my-4" />

        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            Compare up to 4 vendors side-by-side to make the best choice
          </p>
          <Button onClick={() => onOpenChange(false)} data-testid="button-close-comparison">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
