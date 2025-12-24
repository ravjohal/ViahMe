import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, SlidersHorizontal, GitCompare, X } from "lucide-react";
import type { Vendor, Wedding } from "@shared/schema";
import { VendorCard } from "./vendor-card";

interface VendorDirectoryProps {
  vendors: Vendor[];
  onSelectVendor?: (vendor: Vendor) => void;
  tradition?: string;
  wedding?: Wedding | null;
  onAddToComparison?: (vendor: Vendor) => void;
  comparisonVendors?: Vendor[];
  onOpenComparison?: () => void;
}

// Map budget amounts to price range tiers
function getBudgetTier(totalBudget: string | null | undefined): string[] {
  if (!totalBudget) return ['$', '$$', '$$$', '$$$$']; // No budget = all tiers match
  const budget = parseFloat(totalBudget);
  if (budget < 30000) return ['$', '$$'];
  if (budget < 75000) return ['$$', '$$$'];
  if (budget < 150000) return ['$$$', '$$$$'];
  return ['$$$$'];
}

// Map wedding location to vendor city format
function normalizeCity(location: string | undefined): string {
  if (!location) return '';
  const loc = location.toLowerCase();
  if (loc.includes('bay area') || loc.includes('san francisco') || loc.includes('san jose') || loc.includes('oakland')) {
    return 'San Francisco Bay Area';
  }
  if (loc.includes('new york') || loc.includes('nyc') || loc.includes('manhattan')) {
    return 'New York City';
  }
  if (loc.includes('los angeles') || loc.includes('la') || loc.includes('socal')) {
    return 'Los Angeles';
  }
  if (loc.includes('chicago')) return 'Chicago';
  if (loc.includes('seattle')) return 'Seattle';
  return location;
}

// Calculate recommendation score for a vendor based on wedding preferences
function calculateRecommendationScore(
  vendor: Vendor, 
  wedding: Wedding | null | undefined
): number {
  let score = 0;
  
  // Base score for published vendors
  if (vendor.isPublished) score += 10;
  
  // Featured bonus (manual curation)
  if (vendor.featured) score += 15;
  
  // Rating score (0-25 points based on rating)
  const rating = vendor.rating ? parseFloat(vendor.rating.toString()) : 0;
  score += rating * 5; // 5.0 rating = 25 points
  
  // Review count bonus (social proof)
  const reviewCount = vendor.reviewCount || 0;
  if (reviewCount >= 100) score += 10;
  else if (reviewCount >= 50) score += 7;
  else if (reviewCount >= 20) score += 4;
  else if (reviewCount >= 5) score += 2;
  
  if (!wedding) return score;
  
  // City match bonus (strongest signal)
  const coupleCity = normalizeCity(wedding.location);
  if (coupleCity && vendor.city === coupleCity) {
    score += 20;
  } else if (vendor.city === 'San Francisco Bay Area' || vendor.city === 'Los Angeles') {
    // Major metro areas get a small bonus even if not exact match
    score += 5;
  }
  
  // Budget tier match bonus
  const budgetTiers = getBudgetTier(wedding.totalBudget);
  if (vendor.priceRange && budgetTiers.includes(vendor.priceRange)) {
    score += 15;
  }
  
  // Tradition match bonus
  const tradition = wedding.tradition?.toLowerCase();
  if (tradition && vendor.culturalSpecialties?.length) {
    if (vendor.culturalSpecialties.some(s => s.toLowerCase() === tradition)) {
      score += 20;
    }
    // Partial match for related traditions
    if (tradition === 'sikh' && vendor.culturalSpecialties.includes('punjabi')) {
      score += 10;
    }
    if (tradition === 'hindu' && vendor.culturalSpecialties.some(s => 
      ['south_indian', 'gujarati', 'north_indian'].includes(s)
    )) {
      score += 8;
    }
  }
  
  // Preferred wedding traditions match
  if (tradition && vendor.preferredWeddingTraditions?.length) {
    if (vendor.preferredWeddingTraditions.includes(tradition)) {
      score += 10;
    }
  }
  
  return score;
}

const VENDOR_CATEGORIES = [
  { value: "all", label: "All Categories", aliases: [] },
  { value: "makeup_artist", label: "Makeup Artists", aliases: ["Makeup Artist", "Makeup"] },
  { value: "dj", label: "DJs", aliases: ["DJ & Music", "DJ", "Entertainment"] },
  { value: "dhol_player", label: "Dhol Players", aliases: ["Dhol", "Live Musicians"] },
  { value: "turban_tier", label: "Turban Tiers", aliases: ["Turban"] },
  { value: "mehndi_artist", label: "Mehndi Artists", aliases: ["Mehndi Artist", "Mehndi"] },
  { value: "photographer", label: "Photographers", aliases: ["Photography", "Photo"] },
  { value: "videographer", label: "Videographers", aliases: ["Videography", "Video"] },
  { value: "caterer", label: "Caterers", aliases: ["Catering", "Food"] },
  { value: "banquet_hall", label: "Banquet Halls", aliases: ["Venues", "Venue", "Banquet"] },
  { value: "gurdwara", label: "Gurdwaras", aliases: ["Gurdwara"] },
  { value: "temple", label: "Temples", aliases: ["Temple"] },
  { value: "decorator", label: "Decorators", aliases: ["Decor & Rentals", "Decor", "Decoration"] },
  { value: "florist", label: "Florists", aliases: ["Florist", "Flowers"] },
  { value: "horse_rental", label: "Horse Rentals", aliases: ["Horse"] },
  { value: "sword_rental", label: "Sword Rentals", aliases: ["Sword"] },
  { value: "tent_service", label: "Tent Services", aliases: ["Tent"] },
  { value: "limo_service", label: "Limo Services", aliases: ["Limo", "Transportation"] },
  { value: "mobile_food", label: "Mobile Food Vendors", aliases: ["Food Truck", "Mobile Food"] },
  { value: "baraat_band", label: "Baraat Bands", aliases: ["Baraat", "Band"] },
  { value: "pandit", label: "Pandits (Hindu Priests)", aliases: ["Pandit", "Priest & Officiant", "Priest"] },
  { value: "mandap_decorator", label: "Mandap Decorators", aliases: ["Mandap"] },
  { value: "haldi_supplies", label: "Haldi Supplies", aliases: ["Haldi"] },
  { value: "pooja_items", label: "Pooja Items", aliases: ["Pooja"] },
  { value: "astrologer", label: "Vedic Astrologers", aliases: ["Astrologer"] },
  { value: "garland_maker", label: "Garland Makers", aliases: ["Garland"] },
  { value: "event_planner", label: "Event Planners", aliases: ["Event Planning", "Planner", "Coordinator"] },
];

function matchesCategory(vendor: Vendor, categoryFilter: string): boolean {
  if (categoryFilter === "all") return true;
  
  const category = VENDOR_CATEGORIES.find(c => c.value === categoryFilter);
  if (!category) return false;
  
  const vendorCategories = vendor.categories || [];
  
  if (vendorCategories.includes(categoryFilter)) return true;
  
  for (const alias of category.aliases) {
    if (vendorCategories.some(vc => vc.toLowerCase() === alias.toLowerCase())) return true;
  }
  
  return false;
}

const PRICE_RANGES = [
  { value: "all", label: "All Prices" },
  { value: "$", label: "$ - Budget Friendly" },
  { value: "$$", label: "$$ - Moderate" },
  { value: "$$$", label: "$$$ - Premium" },
  { value: "$$$$", label: "$$$$ - Luxury" },
];

export function VendorDirectory({
  vendors,
  onSelectVendor,
  tradition,
  wedding,
  onAddToComparison,
  comparisonVendors = [],
  onOpenComparison,
}: VendorDirectoryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const availableCities = useMemo(() => {
    const citySet = new Set<string>();
    vendors.forEach(vendor => {
      if (vendor.city) {
        citySet.add(vendor.city);
      }
    });
    const cities = Array.from(citySet).sort();
    return [
      { value: "all", label: "All Cities" },
      ...cities.map(city => ({ value: city, label: city }))
    ];
  }, [vendors]);

  const filteredVendors = vendors.filter((vendor) => {
    // Get human-readable category label for search
    const primaryCategory = vendor.categories?.[0];
    const categoryDef = VENDOR_CATEGORIES.find(cat => 
      cat.value === primaryCategory || 
      cat.aliases.some(a => a.toLowerCase() === primaryCategory?.toLowerCase())
    );
    const categoryLabel = categoryDef?.label || primaryCategory || '';
    
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      vendor.name.toLowerCase().includes(searchLower) ||
      vendor.description?.toLowerCase().includes(searchLower) ||
      categoryLabel.toLowerCase().includes(searchLower) ||
      vendor.categories?.some(c => c.toLowerCase().includes(searchLower));

    const matchesCat = matchesCategory(vendor, categoryFilter);
    const matchesPrice = priceFilter === "all" || vendor.priceRange === priceFilter;
    const matchesCity = cityFilter === "all" || vendor.city === cityFilter;

    return matchesSearch && matchesCat && matchesPrice && matchesCity;
  });

  // Calculate recommendation scores and sort by score (highest first)
  const vendorsWithScores = useMemo(() => {
    return filteredVendors.map(vendor => ({
      vendor,
      score: calculateRecommendationScore(vendor, wedding)
    }));
  }, [filteredVendors, wedding]);

  const sortedVendors = useMemo(() => {
    return [...vendorsWithScores]
      .sort((a, b) => b.score - a.score)
      .map(v => v.vendor);
  }, [vendorsWithScores]);

  // Top recommended vendors (score >= 50, max 6)
  const recommendedVendors = useMemo(() => {
    return vendorsWithScores
      .filter(v => v.score >= 50)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map(v => v.vendor);
  }, [vendorsWithScores]);

  const regularVendors = sortedVendors.filter(v => !recommendedVendors.includes(v));

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 bg-clip-text text-transparent mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
          Vendor Directory
        </h1>
        <p className="text-lg font-semibold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
          Discover culturally-specialized service providers
        </p>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search vendors by name or service..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12"
                data-testid="input-search-vendors"
              />
            </div>

            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden"
              data-testid="button-toggle-filters"
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>

          <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${showFilters ? "block" : "hidden md:grid"}`}>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger data-testid="select-category-filter" className="h-12">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                {VENDOR_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={priceFilter} onValueChange={setPriceFilter}>
              <SelectTrigger data-testid="select-price-filter" className="h-12">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by price" />
              </SelectTrigger>
              <SelectContent>
                {PRICE_RANGES.map((price) => (
                  <SelectItem key={price.value} value={price.value}>
                    {price.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger data-testid="select-city-filter" className="h-12">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by city" />
              </SelectTrigger>
              <SelectContent>
                {availableCities.map((city) => (
                  <SelectItem key={city.value} value={city.value}>
                    {city.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(categoryFilter !== "all" || priceFilter !== "all" || cityFilter !== "all" || searchTerm) && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {categoryFilter !== "all" && (
                <Badge
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => setCategoryFilter("all")}
                  data-testid="badge-category-filter"
                >
                  {VENDOR_CATEGORIES.find((c) => c.value === categoryFilter)?.label}
                  <span className="ml-2">×</span>
                </Badge>
              )}
              {priceFilter !== "all" && (
                <Badge
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => setPriceFilter("all")}
                  data-testid="badge-price-filter"
                >
                  {priceFilter}
                  <span className="ml-2">×</span>
                </Badge>
              )}
              {cityFilter !== "all" && (
                <Badge
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => setCityFilter("all")}
                  data-testid="badge-city-filter"
                >
                  {availableCities.find((c) => c.value === cityFilter)?.label}
                  <span className="ml-2">×</span>
                </Badge>
              )}
              {searchTerm && (
                <Badge
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => setSearchTerm("")}
                >
                  Search: {searchTerm}
                  <span className="ml-2">×</span>
                </Badge>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-sm text-muted-foreground" data-testid="text-vendor-count">
              Showing <span className="font-semibold text-foreground">{filteredVendors.length}</span> of {vendors.length} vendors
            </span>
            {filteredVendors.length !== vendors.length && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setCategoryFilter("all");
                  setPriceFilter("all");
                  setCityFilter("all");
                }}
                data-testid="button-clear-all-filters"
              >
                Clear all filters
              </Button>
            )}
          </div>
        </div>
      </Card>

      {recommendedVendors.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-xl font-semibold text-foreground">
              Recommended for You
            </h3>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              Based on your preferences
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendedVendors.map((vendor) => (
              <VendorCard
                key={vendor.id}
                vendor={vendor}
                onSelect={onSelectVendor}
                featured={vendor.featured ?? undefined}
                onAddToComparison={onAddToComparison}
                isInComparison={comparisonVendors.some(v => v.id === vendor.id)}
              />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {recommendedVendors.length > 0 && (
          <h3 className="font-display text-xl font-semibold text-foreground">
            All Vendors
          </h3>
        )}
        {regularVendors.length === 0 ? (
          <Card className="p-12 text-center">
            <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold text-lg mb-2">No Vendors Found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search or filters
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setCategoryFilter("all");
                setPriceFilter("all");
              }}
              data-testid="button-clear-filters"
            >
              Clear All Filters
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regularVendors.map((vendor) => (
              <VendorCard
                key={vendor.id}
                vendor={vendor}
                onSelect={onSelectVendor}
                onAddToComparison={onAddToComparison}
                isInComparison={comparisonVendors.some(v => v.id === vendor.id)}
              />
            ))}
          </div>
        )}
      </div>

      {comparisonVendors.length > 0 && (
        <Card className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 shadow-lg border-2 border-primary/20">
          <div className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <GitCompare className="w-5 h-5 text-primary" />
                <span className="font-semibold">
                  {comparisonVendors.length} vendor{comparisonVendors.length > 1 ? 's' : ''} selected
                </span>
              </div>

              <div className="flex items-center gap-2">
                {comparisonVendors.map((vendor) => (
                  <Badge key={vendor.id} variant="secondary" className="text-xs">
                    {vendor.name}
                    <X
                      className="w-3 h-3 ml-1 cursor-pointer"
                      onClick={() => onAddToComparison?.(vendor)}
                    />
                  </Badge>
                ))}
              </div>

              <Button
                onClick={onOpenComparison}
                disabled={comparisonVendors.length < 2}
                data-testid="button-open-comparison"
              >
                Compare {comparisonVendors.length > 1 ? `(${comparisonVendors.length})` : ''}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
