import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, Star } from "lucide-react";
import {
  VENUE_CLASSES,
  VENUE_CLASS_LABELS,
  VENDOR_TIERS,
  VENDOR_TIER_LABELS,
  GUEST_BRACKETS,
  GUEST_BRACKET_LABELS,
  type VenueClass,
  type VendorTier,
  type GuestBracket,
  VENUE_CLASS_MULTIPLIERS,
  VENDOR_TIER_MULTIPLIERS,
} from "@shared/pricing";

interface PricingAdjusterProps {
  venueClass: VenueClass;
  vendorTier: VendorTier;
  guestBracket?: GuestBracket;
  onVenueClassChange: (value: VenueClass) => void;
  onVendorTierChange: (value: VendorTier) => void;
  onGuestBracketChange?: (value: GuestBracket) => void;
  showGuestBracket?: boolean;
  compact?: boolean;
}

function formatMultiplier(multiplier: number): string {
  if (multiplier === 1.0) return "Base price";
  const percent = Math.round((1 - multiplier) * 100);
  return percent > 0 ? `${percent}% savings` : `${Math.abs(percent)}% premium`;
}

export function PricingAdjuster({
  venueClass,
  vendorTier,
  guestBracket,
  onVenueClassChange,
  onVendorTierChange,
  onGuestBracketChange,
  showGuestBracket = false,
  compact = false,
}: PricingAdjusterProps) {
  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Select value={venueClass} onValueChange={onVenueClassChange}>
          <SelectTrigger className="w-[160px] h-8" data-testid="select-venue-class">
            <Building2 className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {VENUE_CLASSES.map((vc) => (
              <SelectItem key={vc} value={vc}>
                {VENUE_CLASS_LABELS[vc]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={vendorTier} onValueChange={onVendorTierChange}>
          <SelectTrigger className="w-[140px] h-8" data-testid="select-vendor-tier">
            <Star className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {VENDOR_TIERS.map((vt) => (
              <SelectItem key={vt} value={vt}>
                {VENDOR_TIER_LABELS[vt]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {showGuestBracket && onGuestBracketChange && guestBracket && (
          <Select value={guestBracket} onValueChange={onGuestBracketChange}>
            <SelectTrigger className="w-[140px] h-8" data-testid="select-guest-bracket">
              <Users className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GUEST_BRACKETS.map((gb) => (
                <SelectItem key={gb} value={gb}>
                  {GUEST_BRACKET_LABELS[gb]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <Building2 className="w-4 h-4 text-muted-foreground" />
            Venue Type
          </Label>
          <Select value={venueClass} onValueChange={onVenueClassChange}>
            <SelectTrigger data-testid="select-venue-class">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VENUE_CLASSES.map((vc) => (
                <SelectItem key={vc} value={vc}>
                  <div className="flex items-center justify-between gap-2 w-full">
                    <span>{VENUE_CLASS_LABELS[vc]}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge variant="outline" className="text-xs">
            {formatMultiplier(VENUE_CLASS_MULTIPLIERS[venueClass])}
          </Badge>
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <Star className="w-4 h-4 text-muted-foreground" />
            Vendor Tier
          </Label>
          <Select value={vendorTier} onValueChange={onVendorTierChange}>
            <SelectTrigger data-testid="select-vendor-tier">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VENDOR_TIERS.map((vt) => (
                <SelectItem key={vt} value={vt}>
                  <div className="flex items-center justify-between gap-2 w-full">
                    <span>{VENDOR_TIER_LABELS[vt]}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge variant="outline" className="text-xs">
            {formatMultiplier(VENDOR_TIER_MULTIPLIERS[vendorTier])}
          </Badge>
        </div>
      </div>

      {showGuestBracket && onGuestBracketChange && guestBracket && (
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <Users className="w-4 h-4 text-muted-foreground" />
            Guest Count Range
          </Label>
          <Select value={guestBracket} onValueChange={onGuestBracketChange}>
            <SelectTrigger data-testid="select-guest-bracket">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GUEST_BRACKETS.map((gb) => (
                <SelectItem key={gb} value={gb}>
                  {GUEST_BRACKET_LABELS[gb]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
