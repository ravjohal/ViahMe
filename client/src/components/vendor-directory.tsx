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
import { Search, Filter, SlidersHorizontal } from "lucide-react";
import type { Vendor } from "@shared/schema";
import { VendorCard } from "./vendor-card";

interface VendorDirectoryProps {
  vendors: Vendor[];
  onSelectVendor?: (vendor: Vendor) => void;
  tradition?: string;
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
];

const PRICE_RANGES = [
  { value: "all", label: "All Prices" },
  { value: "$", label: "$ - Budget Friendly" },
  { value: "$$", label: "$$ - Moderate" },
  { value: "$$$", label: "$$$ - Premium" },
  { value: "$$$$", label: "$$$$ - Luxury" },
];

export function VendorDirectory({ vendors, onSelectVendor, tradition }: VendorDirectoryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const filteredVendors = vendors.filter((vendor) => {
    const matchesSearch =
      vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === "all" || vendor.category === categoryFilter;
    const matchesPrice = priceFilter === "all" || vendor.priceRange === priceFilter;

    const matchesTradition =
      !tradition ||
      !vendor.culturalSpecialties ||
      vendor.culturalSpecialties.includes(tradition);

    return matchesSearch && matchesCategory && matchesPrice && matchesTradition;
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
      <div>
        <h2 className="font-display text-3xl font-bold text-foreground mb-2">
          Vendor Directory
        </h2>
        <p className="text-muted-foreground">
          Discover culturally-specialized service providers for your celebration
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

          <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${showFilters ? "block" : "hidden md:grid"}`}>
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
          </div>

          {(categoryFilter !== "all" || priceFilter !== "all" || searchTerm) && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {categoryFilter !== "all" && (
                <Badge
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => setCategoryFilter("all")}
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
                >
                  {priceFilter}
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
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
