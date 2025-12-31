import { useState, useMemo, useEffect } from "react";
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
import { Search, Filter, SlidersHorizontal, GitCompare, X, Info, MapPin, Plus, Globe, Mail, Phone, CheckCircle2 } from "lucide-react";
import { SiInstagram } from "react-icons/si";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { Vendor, Wedding, Event } from "@shared/schema";
import { VendorCard } from "./vendor-card";
import { VendorCategoryGuide } from "./vendor-category-guide";

interface VendorDirectoryProps {
  vendors: Vendor[];
  onSelectVendor?: (vendor: Vendor) => void;
  tradition?: string;
  wedding?: Wedding | null;
  onAddToComparison?: (vendor: Vendor) => void;
  comparisonVendors?: Vendor[];
  onOpenComparison?: () => void;
  isLoggedIn?: boolean;
  onSubmitVendor?: () => void;
  events?: Event[];
  onOfflineBook?: (vendorId: string, eventIds: string[], notes: string, agreedPrice?: string) => void;
  onRequestBooking?: (vendorId: string, eventIds: string[], notes: string) => void;
  favoritedVendorIds?: string[];
  onToggleFavorite?: (vendorId: string) => void;
  isBookingPending?: boolean;
  vendorBookedEventIds?: Record<string, string[]>;
  onViewBookings?: (vendorId: string) => void;
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
  isLoggedIn = true,
  onSubmitVendor,
  events = [],
  onOfflineBook,
  onRequestBooking,
  favoritedVendorIds = [],
  onToggleFavorite,
  isBookingPending = false,
  vendorBookedEventIds = {},
  onViewBookings,
}: VendorDirectoryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  
  // Contact/availability filters
  const [filterHasContact, setFilterHasContact] = useState(false);
  const [filterBookable, setFilterBookable] = useState(false);
  const [filterHasInstagram, setFilterHasInstagram] = useState(false);
  const [filterHasWebsite, setFilterHasWebsite] = useState(false);
  const [filterHasEmail, setFilterHasEmail] = useState(false);
  const [showCategoryGuide, setShowCategoryGuide] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const VENDORS_PER_PAGE = 12;

  // Calculate available cities first
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

  // Check if wedding location exists in available vendor cities
  const weddingCityInVendorList = useMemo(() => {
    if (!wedding?.location) return null;
    const normalizedWeddingLocation = normalizeCity(wedding.location);
    return availableCities.find(c => 
      c.value !== "all" && 
      (c.value === wedding.location || normalizeCity(c.value) === normalizedWeddingLocation)
    )?.value || null;
  }, [wedding?.location, availableCities]);

  // Initialize city filter - only auto-set if wedding location has vendors
  const [cityFilter, setCityFilter] = useState("all");
  const [hasAutoFiltered, setHasAutoFiltered] = useState(false);
  
  // Auto-set city filter when wedding location changes
  // Reset to "all" if wedding location has no vendors available or is cleared
  useEffect(() => {
    if (weddingCityInVendorList) {
      setCityFilter(weddingCityInVendorList);
      setHasAutoFiltered(true);
    } else if (hasAutoFiltered) {
      // Previously auto-filtered but now location is cleared or unsupported - reset to all
      setCityFilter("all");
      setHasAutoFiltered(false);
    }
  }, [weddingCityInVendorList, hasAutoFiltered]);

  useEffect(() => {
    setShowCategoryGuide(true);
  }, [categoryFilter]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, priceFilter, cityFilter, filterHasContact, filterBookable, filterHasInstagram, filterHasWebsite, filterHasEmail]);

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
    
    // Contact/availability filters
    const hasAnyContact = !!(vendor.phone || vendor.email || vendor.website || vendor.instagram || vendor.facebook || vendor.twitter);
    const matchesHasContact = !filterHasContact || hasAnyContact;
    const matchesBookable = !filterBookable || vendor.claimed === true;
    const matchesHasInstagram = !filterHasInstagram || !!vendor.instagram;
    const matchesHasWebsite = !filterHasWebsite || !!vendor.website;
    const matchesHasEmail = !filterHasEmail || !!vendor.email;

    return matchesSearch && matchesCat && matchesPrice && matchesCity && 
           matchesHasContact && matchesBookable && matchesHasInstagram && matchesHasWebsite && matchesHasEmail;
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

  // Pagination logic
  const totalPages = Math.ceil(regularVendors.length / VENDORS_PER_PAGE);
  const startIndex = (currentPage - 1) * VENDORS_PER_PAGE;
  const endIndex = startIndex + VENDORS_PER_PAGE;
  const paginatedVendors = regularVendors.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 bg-clip-text text-transparent mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            Vendor Directory
          </h1>
          <p className="text-lg font-semibold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            Discover culturally-specialized service providers
          </p>
        </div>
        {isLoggedIn && onSubmitVendor && (
          <Button
            variant="outline"
            onClick={onSubmitVendor}
            className="whitespace-nowrap"
            data-testid="button-submit-vendor"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add a Vendor
          </Button>
        )}
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

          {/* Contact & availability filters */}
          <div className={`flex flex-wrap gap-4 pt-2 ${showFilters ? "flex" : "hidden md:flex"}`}>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="filter-has-contact" 
                checked={filterHasContact}
                onCheckedChange={(checked) => setFilterHasContact(checked === true)}
                data-testid="checkbox-filter-has-contact"
              />
              <Label htmlFor="filter-has-contact" className="text-sm cursor-pointer flex items-center gap-1">
                <Phone className="w-3 h-3" />
                Has Contact Info
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="filter-bookable" 
                checked={filterBookable}
                onCheckedChange={(checked) => setFilterBookable(checked === true)}
                data-testid="checkbox-filter-bookable"
              />
              <Label htmlFor="filter-bookable" className="text-sm cursor-pointer flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Bookable in App
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="filter-has-instagram" 
                checked={filterHasInstagram}
                onCheckedChange={(checked) => setFilterHasInstagram(checked === true)}
                data-testid="checkbox-filter-has-instagram"
              />
              <Label htmlFor="filter-has-instagram" className="text-sm cursor-pointer flex items-center gap-1">
                <SiInstagram className="w-3 h-3" />
                Has Instagram
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="filter-has-website" 
                checked={filterHasWebsite}
                onCheckedChange={(checked) => setFilterHasWebsite(checked === true)}
                data-testid="checkbox-filter-has-website"
              />
              <Label htmlFor="filter-has-website" className="text-sm cursor-pointer flex items-center gap-1">
                <Globe className="w-3 h-3" />
                Has Website
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="filter-has-email" 
                checked={filterHasEmail}
                onCheckedChange={(checked) => setFilterHasEmail(checked === true)}
                data-testid="checkbox-filter-has-email"
              />
              <Label htmlFor="filter-has-email" className="text-sm cursor-pointer flex items-center gap-1">
                <Mail className="w-3 h-3" />
                Has Email
              </Label>
            </div>
          </div>

          {(categoryFilter !== "all" || priceFilter !== "all" || cityFilter !== "all" || searchTerm || filterHasContact || filterBookable || filterHasInstagram || filterHasWebsite || filterHasEmail) && (
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
                  className="cursor-pointer gap-1"
                  onClick={() => setCityFilter("all")}
                  data-testid="badge-city-filter"
                >
                  <MapPin className="w-3 h-3" />
                  {availableCities.find((c) => c.value === cityFilter)?.label}
                  {weddingCityInVendorList === cityFilter && (
                    <span className="text-xs opacity-70">(Your area)</span>
                  )}
                  <span className="ml-1">×</span>
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
              {filterHasContact && (
                <Badge
                  variant="secondary"
                  className="cursor-pointer gap-1"
                  onClick={() => setFilterHasContact(false)}
                  data-testid="badge-filter-has-contact"
                >
                  <Phone className="w-3 h-3" />
                  Has Contact
                  <span className="ml-1">×</span>
                </Badge>
              )}
              {filterBookable && (
                <Badge
                  variant="secondary"
                  className="cursor-pointer gap-1"
                  onClick={() => setFilterBookable(false)}
                  data-testid="badge-filter-bookable"
                >
                  <CheckCircle2 className="w-3 h-3" />
                  Bookable
                  <span className="ml-1">×</span>
                </Badge>
              )}
              {filterHasInstagram && (
                <Badge
                  variant="secondary"
                  className="cursor-pointer gap-1"
                  onClick={() => setFilterHasInstagram(false)}
                  data-testid="badge-filter-has-instagram"
                >
                  <SiInstagram className="w-3 h-3" />
                  Instagram
                  <span className="ml-1">×</span>
                </Badge>
              )}
              {filterHasWebsite && (
                <Badge
                  variant="secondary"
                  className="cursor-pointer gap-1"
                  onClick={() => setFilterHasWebsite(false)}
                  data-testid="badge-filter-has-website"
                >
                  <Globe className="w-3 h-3" />
                  Website
                  <span className="ml-1">×</span>
                </Badge>
              )}
              {filterHasEmail && (
                <Badge
                  variant="secondary"
                  className="cursor-pointer gap-1"
                  onClick={() => setFilterHasEmail(false)}
                  data-testid="badge-filter-has-email"
                >
                  <Mail className="w-3 h-3" />
                  Email
                  <span className="ml-1">×</span>
                </Badge>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-sm text-muted-foreground" data-testid="text-vendor-count">
              Showing <span className="font-semibold text-foreground">{filteredVendors.length}</span> of {vendors.length} vendors
            </span>
            {(searchTerm || categoryFilter !== "all" || priceFilter !== "all" || cityFilter !== "all" || filterHasContact || filterBookable || filterHasInstagram || filterHasWebsite || filterHasEmail) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setCategoryFilter("all");
                  setPriceFilter("all");
                  setCityFilter("all");
                  setFilterHasContact(false);
                  setFilterBookable(false);
                  setFilterHasInstagram(false);
                  setFilterHasWebsite(false);
                  setFilterHasEmail(false);
                }}
                data-testid="button-clear-all-filters"
              >
                Clear all filters
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Category Guide - shows when a specific category is selected */}
      {categoryFilter !== "all" && showCategoryGuide && (
        <VendorCategoryGuide
          category={categoryFilter}
          categoryLabel={VENDOR_CATEGORIES.find(c => c.value === categoryFilter)?.label || categoryFilter}
          userCity={wedding?.location ?? (cityFilter !== "all" ? cityFilter : "San Francisco Bay Area")}
          onClose={() => setShowCategoryGuide(false)}
        />
      )}

      {/* Show guide toggle button when category is selected but guide is hidden */}
      {categoryFilter !== "all" && !showCategoryGuide && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowCategoryGuide(true)}
          className="gap-2"
          data-testid="button-show-guide"
        >
          <Info className="w-4 h-4" />
          Show {VENDOR_CATEGORIES.find(c => c.value === categoryFilter)?.label} Guide & Pricing
        </Button>
      )}

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
                isLoggedIn={isLoggedIn}
                events={events}
                onOfflineBook={onOfflineBook}
                onRequestBooking={onRequestBooking}
                isFavorited={favoritedVendorIds.includes(vendor.id)}
                onToggleFavorite={onToggleFavorite}
                isBookingPending={isBookingPending}
                bookedEventIds={vendorBookedEventIds[vendor.id] || []}
                onViewBookings={onViewBookings}
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
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedVendors.map((vendor) => (
                <VendorCard
                  key={vendor.id}
                  vendor={vendor}
                  onSelect={onSelectVendor}
                  onAddToComparison={onAddToComparison}
                  isInComparison={comparisonVendors.some(v => v.id === vendor.id)}
                  isLoggedIn={isLoggedIn}
                  events={events}
                  onOfflineBook={onOfflineBook}
                  onRequestBooking={onRequestBooking}
                  isFavorited={favoritedVendorIds.includes(vendor.id)}
                  onToggleFavorite={onToggleFavorite}
                  isBookingPending={isBookingPending}
                  bookedEventIds={vendorBookedEventIds[vendor.id] || []}
                  onViewBookings={onViewBookings}
                />
              ))}
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  data-testid="button-page-first"
                >
                  First
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  data-testid="button-page-prev"
                >
                  Previous
                </Button>
                
                <div className="flex items-center gap-1 px-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-9"
                        data-testid={`button-page-${pageNum}`}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  data-testid="button-page-next"
                >
                  Next
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  data-testid="button-page-last"
                >
                  Last
                </Button>
                
                <span className="text-sm text-muted-foreground ml-4">
                  Showing {startIndex + 1}-{Math.min(endIndex, regularVendors.length)} of {regularVendors.length}
                </span>
              </div>
            )}
          </>
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
