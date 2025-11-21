import { useState } from "react";
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
import type { Vendor } from "@shared/schema";
import { VendorCard } from "./vendor-card";

interface VendorDirectoryProps {
  vendors: Vendor[];
  onSelectVendor?: (vendor: Vendor) => void;
  tradition?: string;
  onAddToComparison?: (vendor: Vendor) => void;
  comparisonVendors?: Vendor[];
  onOpenComparison?: () => void;
}

const VENDOR_CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "makeup_artist", label: "Makeup Artists" },
  { value: "dj", label: "DJs" },
  { value: "dhol_player", label: "Dhol Players" },
  { value: "turban_tier", label: "Turban Tiers" },
  { value: "mehndi_artist", label: "Mehndi Artists" },
  { value: "photographer", label: "Photographers" },
  { value: "videographer", label: "Videographers" },
  { value: "caterer", label: "Caterers" },
  { value: "banquet_hall", label: "Banquet Halls" },
  { value: "gurdwara", label: "Gurdwaras" },
  { value: "temple", label: "Temples" },
  { value: "decorator", label: "Decorators" },
  { value: "florist", label: "Florists" },
  { value: "horse_rental", label: "Horse Rentals" },
  { value: "sword_rental", label: "Sword Rentals" },
  { value: "tent_service", label: "Tent Services" },
  { value: "limo_service", label: "Limo Services" },
  { value: "mobile_food", label: "Mobile Food Vendors" },
  { value: "baraat_band", label: "Baraat Bands" },
  // Hindu-specific vendors
  { value: "pandit", label: "Pandits (Hindu Priests)" },
  { value: "mandap_decorator", label: "Mandap Decorators" },
  { value: "haldi_supplies", label: "Haldi Supplies" },
  { value: "pooja_items", label: "Pooja Items" },
  { value: "astrologer", label: "Vedic Astrologers" },
  { value: "garland_maker", label: "Garland Makers" },
];

const PRICE_RANGES = [
  { value: "all", label: "All Prices" },
  { value: "$", label: "$ - Budget Friendly" },
  { value: "$$", label: "$$ - Moderate" },
  { value: "$$$", label: "$$$ - Premium" },
  { value: "$$$$", label: "$$$$ - Luxury" },
];

const CITIES = [
  { value: "all", label: "All Cities" },
  { value: "San Francisco Bay Area", label: "San Francisco Bay Area" },
  { value: "New York City", label: "New York City" },
  { value: "Los Angeles", label: "Los Angeles" },
  { value: "Chicago", label: "Chicago" },
  { value: "Seattle", label: "Seattle" },
];

export function VendorDirectory({
  vendors,
  onSelectVendor,
  tradition,
  onAddToComparison,
  comparisonVendors = [],
  onOpenComparison,
}: VendorDirectoryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const filteredVendors = vendors.filter((vendor) => {
    const matchesSearch =
      vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === "all" || vendor.category === categoryFilter;
    const matchesPrice = priceFilter === "all" || vendor.priceRange === priceFilter;
    const matchesCity = cityFilter === "all" || vendor.city === cityFilter;

    const matchesTradition =
      !tradition ||
      !vendor.culturalSpecialties ||
      vendor.culturalSpecialties.includes(tradition);

    return matchesSearch && matchesCategory && matchesPrice && matchesCity && matchesTradition;
  });

  // Sort to show featured vendors first
  const sortedVendors = [...filteredVendors].sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return 0;
  });

  const featuredVendors = sortedVendors.filter((v) => v.featured).slice(0, 3);
  const regularVendors = sortedVendors.filter((v) => !v.featured);

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 bg-clip-text text-transparent mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
          Vendor Directory ✨
        </h1>
        <p className="text-lg font-semibold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
          Discover culturally-specialized service providers 🎊
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
                {CITIES.map((city) => (
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
                  {CITIES.find((c) => c.value === cityFilter)?.label}
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
        </div>
      </Card>

      {featuredVendors.length > 0 && (
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
            {featuredVendors.map((vendor) => (
              <VendorCard
                key={vendor.id}
                vendor={vendor}
                onSelect={onSelectVendor}
                featured
                onAddToComparison={onAddToComparison}
                isInComparison={comparisonVendors.some(v => v.id === vendor.id)}
              />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {featuredVendors.length > 0 && (
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
