export interface CityVendorCost {
  category: string;
  label: string;
  lowRange: number;
  highRange: number;
  unit: 'per_event' | 'per_hour' | 'per_person' | 'per_day' | 'per_item';
  notes?: string;
}

export interface VendorCategoryFAQ {
  question: string;
  answer: string;
}

export interface VendorCategoryInfo {
  category: string;
  label: string;
  description: string;
  whatToLookFor: string[];
  redFlags: string[];
  faqs: VendorCategoryFAQ[];
  bookingTips: string[];
}

export const CITY_VENDOR_COSTS: Record<string, CityVendorCost[]> = {
  'San Francisco Bay Area': [
    { category: 'photographer', label: 'Photographer', lowRange: 4000, highRange: 12000, unit: 'per_event', notes: 'Multi-day packages range $8K-$20K' },
    { category: 'videographer', label: 'Videographer', lowRange: 3500, highRange: 10000, unit: 'per_event', notes: 'Highlight + full ceremony edits' },
    { category: 'caterer', label: 'Caterer', lowRange: 75, highRange: 175, unit: 'per_person', notes: 'Indian/Pakistani cuisine typically $90-150/person' },
    { category: 'halal_caterer', label: 'Halal Caterer', lowRange: 85, highRange: 180, unit: 'per_person', notes: 'Full service with setup and staff' },
    { category: 'dj', label: 'DJ', lowRange: 1500, highRange: 4000, unit: 'per_event', notes: 'Includes sound system and lighting' },
    { category: 'dhol_player', label: 'Dhol Player', lowRange: 400, highRange: 1200, unit: 'per_event', notes: 'Per dhol player, usually 2-4 needed for baraat' },
    { category: 'makeup_artist', label: 'Makeup Artist', lowRange: 300, highRange: 800, unit: 'per_event', notes: 'Bridal pricing; bridesmaids $100-200 each' },
    { category: 'mehndi_artist', label: 'Mehndi Artist', lowRange: 150, highRange: 400, unit: 'per_hour', notes: 'Bridal mehndi $300-800 flat rate' },
    { category: 'decorator', label: 'Decorator', lowRange: 5000, highRange: 25000, unit: 'per_event', notes: 'Full mandap/stage setup with florals' },
    { category: 'mandap_decorator', label: 'Mandap Decorator', lowRange: 3000, highRange: 15000, unit: 'per_event', notes: 'Traditional or modern designs' },
    { category: 'florist', label: 'Florist', lowRange: 2500, highRange: 10000, unit: 'per_event', notes: 'Centerpieces, bouquets, garlands' },
    { category: 'banquet_hall', label: 'Banquet Hall', lowRange: 8000, highRange: 35000, unit: 'per_event', notes: 'Venue rental only; catering often separate' },
    { category: 'gurdwara', label: 'Gurdwara', lowRange: 500, highRange: 2000, unit: 'per_event', notes: 'Donation-based; langar may be included' },
    { category: 'temple', label: 'Temple', lowRange: 1000, highRange: 5000, unit: 'per_event', notes: 'Includes priest services typically' },
    { category: 'horse_rental', label: 'Horse Rental', lowRange: 800, highRange: 2000, unit: 'per_event', notes: 'Includes handler and decorated horse' },
    { category: 'limo_service', label: 'Limo Service', lowRange: 400, highRange: 1200, unit: 'per_event', notes: 'For 4-6 hours' },
    { category: 'turban_tier', label: 'Turban Tier', lowRange: 50, highRange: 150, unit: 'per_item', notes: 'Per turban; group rates available' },
    { category: 'pandit', label: 'Pandit', lowRange: 500, highRange: 1500, unit: 'per_event', notes: 'Includes all ceremony materials' },
    { category: 'baraat_band', label: 'Baraat Band', lowRange: 1000, highRange: 3000, unit: 'per_event', notes: '4-8 piece band for procession' },
    { category: 'garland_maker', label: 'Garland Maker', lowRange: 100, highRange: 500, unit: 'per_item', notes: 'Jaimala sets start at $200' },
    { category: 'tent_service', label: 'Tent Service', lowRange: 3000, highRange: 15000, unit: 'per_event', notes: 'Outdoor venue coverage' },
    { category: 'mobile_food', label: 'Mobile Food', lowRange: 1500, highRange: 4000, unit: 'per_event', notes: 'Food truck for 100-200 guests' },
  ],
  'New York City': [
    { category: 'photographer', label: 'Photographer', lowRange: 5000, highRange: 15000, unit: 'per_event', notes: 'NYC premium pricing; multi-day $10K-$25K' },
    { category: 'videographer', label: 'Videographer', lowRange: 4000, highRange: 12000, unit: 'per_event', notes: 'Cinematic packages higher' },
    { category: 'caterer', label: 'Caterer', lowRange: 90, highRange: 200, unit: 'per_person', notes: 'Indian cuisine $100-180/person typical' },
    { category: 'halal_caterer', label: 'Halal Caterer', lowRange: 95, highRange: 200, unit: 'per_person', notes: 'Full service Pakistani/Indian halal' },
    { category: 'dj', label: 'DJ', lowRange: 2000, highRange: 5000, unit: 'per_event', notes: 'Premium venues may require approved vendors' },
    { category: 'dhol_player', label: 'Dhol Player', lowRange: 500, highRange: 1500, unit: 'per_event', notes: 'High demand; book 6+ months ahead' },
    { category: 'makeup_artist', label: 'Makeup Artist', lowRange: 400, highRange: 1000, unit: 'per_event', notes: 'Bridal packages with trials' },
    { category: 'mehndi_artist', label: 'Mehndi Artist', lowRange: 175, highRange: 450, unit: 'per_hour', notes: 'Premium artists $500-1000 for bridal' },
    { category: 'decorator', label: 'Decorator', lowRange: 6000, highRange: 35000, unit: 'per_event', notes: 'Elaborate setups in high demand' },
    { category: 'mandap_decorator', label: 'Mandap Decorator', lowRange: 4000, highRange: 20000, unit: 'per_event', notes: 'Custom mandap designs' },
    { category: 'florist', label: 'Florist', lowRange: 3000, highRange: 15000, unit: 'per_event', notes: 'Seasonal pricing varies significantly' },
    { category: 'banquet_hall', label: 'Banquet Hall', lowRange: 12000, highRange: 50000, unit: 'per_event', notes: 'Manhattan venues at premium' },
    { category: 'gurdwara', label: 'Gurdwara', lowRange: 500, highRange: 2500, unit: 'per_event', notes: 'Richmond Hill, Queens popular' },
    { category: 'temple', label: 'Temple', lowRange: 1200, highRange: 6000, unit: 'per_event', notes: 'BAPS, Flushing temples popular' },
    { category: 'horse_rental', label: 'Horse Rental', lowRange: 1000, highRange: 2500, unit: 'per_event', notes: 'Limited availability in Manhattan' },
    { category: 'limo_service', label: 'Limo Service', lowRange: 500, highRange: 1500, unit: 'per_event', notes: 'NYC traffic affects timing' },
    { category: 'turban_tier', label: 'Turban Tier', lowRange: 60, highRange: 175, unit: 'per_item', notes: 'Professional pagg service' },
    { category: 'pandit', label: 'Pandit', lowRange: 600, highRange: 2000, unit: 'per_event', notes: 'Experienced pandits in high demand' },
    { category: 'baraat_band', label: 'Baraat Band', lowRange: 1200, highRange: 4000, unit: 'per_event', notes: 'Full band with dancers available' },
    { category: 'garland_maker', label: 'Garland Maker', lowRange: 150, highRange: 600, unit: 'per_item', notes: 'Fresh flower garlands daily' },
    { category: 'tent_service', label: 'Tent Service', lowRange: 4000, highRange: 20000, unit: 'per_event', notes: 'Outdoor weddings in NJ/Long Island' },
    { category: 'mobile_food', label: 'Mobile Food', lowRange: 2000, highRange: 5000, unit: 'per_event', notes: 'Street food style catering' },
  ],
  'Los Angeles': [
    { category: 'photographer', label: 'Photographer', lowRange: 4500, highRange: 14000, unit: 'per_event', notes: 'Many film/media industry pros' },
    { category: 'videographer', label: 'Videographer', lowRange: 4000, highRange: 12000, unit: 'per_event', notes: 'Cinematic quality common' },
    { category: 'caterer', label: 'Caterer', lowRange: 80, highRange: 175, unit: 'per_person', notes: 'Large South Asian catering scene' },
    { category: 'halal_caterer', label: 'Halal Caterer', lowRange: 85, highRange: 180, unit: 'per_person', notes: 'Artesia area vendors popular' },
    { category: 'dj', label: 'DJ', lowRange: 1800, highRange: 4500, unit: 'per_event', notes: 'Bollywood/Bhangra specialists available' },
    { category: 'dhol_player', label: 'Dhol Player', lowRange: 450, highRange: 1300, unit: 'per_event', notes: 'Strong Punjabi community presence' },
    { category: 'makeup_artist', label: 'Makeup Artist', lowRange: 350, highRange: 900, unit: 'per_event', notes: 'Film industry trained artists' },
    { category: 'mehndi_artist', label: 'Mehndi Artist', lowRange: 150, highRange: 400, unit: 'per_hour', notes: 'Intricate bridal mehndi $350-900' },
    { category: 'decorator', label: 'Decorator', lowRange: 5500, highRange: 30000, unit: 'per_event', notes: 'Hollywood-quality productions' },
    { category: 'mandap_decorator', label: 'Mandap Decorator', lowRange: 3500, highRange: 18000, unit: 'per_event', notes: 'Elaborate custom designs' },
    { category: 'florist', label: 'Florist', lowRange: 2500, highRange: 12000, unit: 'per_event', notes: 'Year-round flower availability' },
    { category: 'banquet_hall', label: 'Banquet Hall', lowRange: 7000, highRange: 40000, unit: 'per_event', notes: 'Beach venues at premium' },
    { category: 'gurdwara', label: 'Gurdwara', lowRange: 400, highRange: 2000, unit: 'per_event', notes: 'Several in LA area' },
    { category: 'temple', label: 'Temple', lowRange: 1000, highRange: 5500, unit: 'per_event', notes: 'Malibu Hindu Temple popular' },
    { category: 'horse_rental', label: 'Horse Rental', lowRange: 900, highRange: 2200, unit: 'per_event', notes: 'Good availability' },
    { category: 'limo_service', label: 'Limo Service', lowRange: 450, highRange: 1300, unit: 'per_event', notes: 'Factor in LA traffic' },
    { category: 'turban_tier', label: 'Turban Tier', lowRange: 50, highRange: 150, unit: 'per_item', notes: 'Artesia area specialists' },
    { category: 'pandit', label: 'Pandit', lowRange: 500, highRange: 1800, unit: 'per_event', notes: 'Various tradition specialists' },
    { category: 'baraat_band', label: 'Baraat Band', lowRange: 1100, highRange: 3500, unit: 'per_event', notes: 'Full entertainment packages' },
    { category: 'garland_maker', label: 'Garland Maker', lowRange: 120, highRange: 550, unit: 'per_item', notes: 'Fresh flower specialists' },
    { category: 'tent_service', label: 'Tent Service', lowRange: 3500, highRange: 18000, unit: 'per_event', notes: 'Great weather = more outdoor events' },
    { category: 'mobile_food', label: 'Mobile Food', lowRange: 1800, highRange: 4500, unit: 'per_event', notes: 'Food truck culture strong' },
  ],
  'Chicago': [
    { category: 'photographer', label: 'Photographer', lowRange: 3500, highRange: 10000, unit: 'per_event', notes: 'More affordable than coasts' },
    { category: 'videographer', label: 'Videographer', lowRange: 3000, highRange: 8000, unit: 'per_event', notes: 'Good value packages' },
    { category: 'caterer', label: 'Caterer', lowRange: 65, highRange: 150, unit: 'per_person', notes: 'Devon Ave caterers popular' },
    { category: 'halal_caterer', label: 'Halal Caterer', lowRange: 70, highRange: 160, unit: 'per_person', notes: 'Strong halal scene in suburbs' },
    { category: 'dj', label: 'DJ', lowRange: 1200, highRange: 3500, unit: 'per_event', notes: 'Good variety of specialists' },
    { category: 'dhol_player', label: 'Dhol Player', lowRange: 350, highRange: 1000, unit: 'per_event', notes: 'Book early for summer dates' },
    { category: 'makeup_artist', label: 'Makeup Artist', lowRange: 250, highRange: 700, unit: 'per_event', notes: 'Competitive pricing' },
    { category: 'mehndi_artist', label: 'Mehndi Artist', lowRange: 125, highRange: 350, unit: 'per_hour', notes: 'Bridal mehndi $250-700' },
    { category: 'decorator', label: 'Decorator', lowRange: 4000, highRange: 20000, unit: 'per_event', notes: 'Full decor packages' },
    { category: 'mandap_decorator', label: 'Mandap Decorator', lowRange: 2500, highRange: 12000, unit: 'per_event', notes: 'Traditional and modern' },
    { category: 'florist', label: 'Florist', lowRange: 2000, highRange: 8000, unit: 'per_event', notes: 'Seasonal pricing applies' },
    { category: 'banquet_hall', label: 'Banquet Hall', lowRange: 6000, highRange: 30000, unit: 'per_event', notes: 'Schaumburg area popular' },
    { category: 'gurdwara', label: 'Gurdwara', lowRange: 400, highRange: 1500, unit: 'per_event', notes: 'Several in suburbs' },
    { category: 'temple', label: 'Temple', lowRange: 800, highRange: 4000, unit: 'per_event', notes: 'Hindu Temple of Greater Chicago' },
    { category: 'horse_rental', label: 'Horse Rental', lowRange: 700, highRange: 1800, unit: 'per_event', notes: 'Weather dependent in winter' },
    { category: 'limo_service', label: 'Limo Service', lowRange: 350, highRange: 1000, unit: 'per_event', notes: 'Good availability' },
    { category: 'turban_tier', label: 'Turban Tier', lowRange: 40, highRange: 125, unit: 'per_item', notes: 'Devon Ave area' },
    { category: 'pandit', label: 'Pandit', lowRange: 400, highRange: 1200, unit: 'per_event', notes: 'Good availability' },
    { category: 'baraat_band', label: 'Baraat Band', lowRange: 900, highRange: 2500, unit: 'per_event', notes: 'Weather consideration in winter' },
    { category: 'garland_maker', label: 'Garland Maker', lowRange: 80, highRange: 400, unit: 'per_item', notes: 'Fresh and artificial options' },
    { category: 'tent_service', label: 'Tent Service', lowRange: 2500, highRange: 12000, unit: 'per_event', notes: 'Summer months only typically' },
    { category: 'mobile_food', label: 'Mobile Food', lowRange: 1200, highRange: 3500, unit: 'per_event', notes: 'Growing food truck scene' },
  ],
  'Seattle': [
    { category: 'photographer', label: 'Photographer', lowRange: 4000, highRange: 11000, unit: 'per_event', notes: 'Smaller vendor pool; book early' },
    { category: 'videographer', label: 'Videographer', lowRange: 3500, highRange: 9000, unit: 'per_event', notes: 'Limited South Asian specialists' },
    { category: 'caterer', label: 'Caterer', lowRange: 70, highRange: 160, unit: 'per_person', notes: 'Fewer options; some travel from CA' },
    { category: 'halal_caterer', label: 'Halal Caterer', lowRange: 75, highRange: 170, unit: 'per_person', notes: 'Limited options locally' },
    { category: 'dj', label: 'DJ', lowRange: 1400, highRange: 3800, unit: 'per_event', notes: 'May need to import from CA' },
    { category: 'dhol_player', label: 'Dhol Player', lowRange: 400, highRange: 1100, unit: 'per_event', notes: 'Limited local availability' },
    { category: 'makeup_artist', label: 'Makeup Artist', lowRange: 300, highRange: 750, unit: 'per_event', notes: 'South Asian specialists limited' },
    { category: 'mehndi_artist', label: 'Mehndi Artist', lowRange: 140, highRange: 375, unit: 'per_hour', notes: 'Book well in advance' },
    { category: 'decorator', label: 'Decorator', lowRange: 4500, highRange: 22000, unit: 'per_event', notes: 'Some fly in from Bay Area' },
    { category: 'mandap_decorator', label: 'Mandap Decorator', lowRange: 3000, highRange: 14000, unit: 'per_event', notes: 'Custom work available' },
    { category: 'florist', label: 'Florist', lowRange: 2200, highRange: 9000, unit: 'per_event', notes: 'General florists work well' },
    { category: 'banquet_hall', label: 'Banquet Hall', lowRange: 6500, highRange: 32000, unit: 'per_event', notes: 'Bellevue area popular' },
    { category: 'gurdwara', label: 'Gurdwara', lowRange: 400, highRange: 1800, unit: 'per_event', notes: 'Kent Gurdwara well-known' },
    { category: 'temple', label: 'Temple', lowRange: 900, highRange: 4500, unit: 'per_event', notes: 'Hindu Temple of Seattle' },
    { category: 'horse_rental', label: 'Horse Rental', lowRange: 800, highRange: 2000, unit: 'per_event', notes: 'Weather dependent' },
    { category: 'limo_service', label: 'Limo Service', lowRange: 400, highRange: 1100, unit: 'per_event', notes: 'Good availability' },
    { category: 'turban_tier', label: 'Turban Tier', lowRange: 50, highRange: 140, unit: 'per_item', notes: 'Limited specialists' },
    { category: 'pandit', label: 'Pandit', lowRange: 450, highRange: 1400, unit: 'per_event', notes: 'Book early' },
    { category: 'baraat_band', label: 'Baraat Band', lowRange: 1000, highRange: 3000, unit: 'per_event', notes: 'May need to import' },
    { category: 'garland_maker', label: 'Garland Maker', lowRange: 100, highRange: 450, unit: 'per_item', notes: 'Fresh flower availability varies' },
    { category: 'tent_service', label: 'Tent Service', lowRange: 3000, highRange: 14000, unit: 'per_event', notes: 'Weather protection important' },
    { category: 'mobile_food', label: 'Mobile Food', lowRange: 1500, highRange: 4000, unit: 'per_event', notes: 'Food truck scene growing' },
  ],
  'Fresno': [
    { category: 'photographer', label: 'Photographer', lowRange: 2500, highRange: 7000, unit: 'per_event', notes: 'Central Valley pricing; more affordable' },
    { category: 'videographer', label: 'Videographer', lowRange: 2000, highRange: 6000, unit: 'per_event', notes: 'Good value; some travel from Bay Area' },
    { category: 'caterer', label: 'Caterer', lowRange: 55, highRange: 130, unit: 'per_person', notes: 'Growing South Asian food scene' },
    { category: 'halal_caterer', label: 'Halal Caterer', lowRange: 60, highRange: 140, unit: 'per_person', notes: 'Some vendors travel from Bay Area' },
    { category: 'dj', label: 'DJ', lowRange: 1000, highRange: 2800, unit: 'per_event', notes: 'May need to bring in specialists' },
    { category: 'dhol_player', label: 'Dhol Player', lowRange: 350, highRange: 900, unit: 'per_event', notes: 'Limited local; often travel from Bay' },
    { category: 'makeup_artist', label: 'Makeup Artist', lowRange: 200, highRange: 550, unit: 'per_event', notes: 'Competitive local pricing' },
    { category: 'mehndi_artist', label: 'Mehndi Artist', lowRange: 100, highRange: 300, unit: 'per_hour', notes: 'Bridal mehndi $250-600' },
    { category: 'decorator', label: 'Decorator', lowRange: 3500, highRange: 18000, unit: 'per_event', notes: 'Some travel from larger metros' },
    { category: 'mandap_decorator', label: 'Mandap Decorator', lowRange: 2500, highRange: 12000, unit: 'per_event', notes: 'Custom designs available' },
    { category: 'florist', label: 'Florist', lowRange: 1800, highRange: 7500, unit: 'per_event', notes: 'Good local availability' },
    { category: 'banquet_hall', label: 'Banquet Hall', lowRange: 4000, highRange: 20000, unit: 'per_event', notes: 'More affordable than coastal cities' },
    { category: 'gurdwara', label: 'Gurdwara', lowRange: 300, highRange: 1500, unit: 'per_event', notes: 'Fresno Sikh community growing' },
    { category: 'temple', label: 'Temple', lowRange: 600, highRange: 3500, unit: 'per_event', notes: 'Local Hindu temples available' },
    { category: 'horse_rental', label: 'Horse Rental', lowRange: 600, highRange: 1500, unit: 'per_event', notes: 'Good agricultural area availability' },
    { category: 'limo_service', label: 'Limo Service', lowRange: 300, highRange: 900, unit: 'per_event', notes: 'Less traffic than metros' },
    { category: 'turban_tier', label: 'Turban Tier', lowRange: 40, highRange: 120, unit: 'per_item', notes: 'May need Bay Area specialists' },
    { category: 'pandit', label: 'Pandit', lowRange: 400, highRange: 1200, unit: 'per_event', notes: 'Local priests available' },
    { category: 'baraat_band', label: 'Baraat Band', lowRange: 800, highRange: 2500, unit: 'per_event', notes: 'Often travel from larger cities' },
    { category: 'garland_maker', label: 'Garland Maker', lowRange: 80, highRange: 400, unit: 'per_item', notes: 'Fresh flowers readily available' },
    { category: 'tent_service', label: 'Tent Service', lowRange: 2500, highRange: 12000, unit: 'per_event', notes: 'Hot summers make cooling important' },
    { category: 'mobile_food', label: 'Mobile Food', lowRange: 1200, highRange: 3500, unit: 'per_event', notes: 'Growing food truck scene' },
  ],
  'Sacramento': [
    { category: 'photographer', label: 'Photographer', lowRange: 3000, highRange: 9000, unit: 'per_event', notes: 'Good mix of local and Bay Area talent' },
    { category: 'videographer', label: 'Videographer', lowRange: 2500, highRange: 7500, unit: 'per_event', notes: 'Capitol region pricing' },
    { category: 'caterer', label: 'Caterer', lowRange: 60, highRange: 145, unit: 'per_person', notes: 'Growing South Asian community' },
    { category: 'halal_caterer', label: 'Halal Caterer', lowRange: 65, highRange: 150, unit: 'per_person', notes: 'Good halal options locally' },
    { category: 'dj', label: 'DJ', lowRange: 1100, highRange: 3200, unit: 'per_event', notes: 'Some specialists from Bay Area' },
    { category: 'dhol_player', label: 'Dhol Player', lowRange: 350, highRange: 950, unit: 'per_event', notes: 'Book ahead; many from Bay Area' },
    { category: 'makeup_artist', label: 'Makeup Artist', lowRange: 250, highRange: 650, unit: 'per_event', notes: 'Good local talent' },
    { category: 'mehndi_artist', label: 'Mehndi Artist', lowRange: 120, highRange: 350, unit: 'per_hour', notes: 'Bridal mehndi $280-700' },
    { category: 'decorator', label: 'Decorator', lowRange: 4000, highRange: 20000, unit: 'per_event', notes: 'Mix of local and Bay Area vendors' },
    { category: 'mandap_decorator', label: 'Mandap Decorator', lowRange: 2800, highRange: 13000, unit: 'per_event', notes: 'Good selection available' },
    { category: 'florist', label: 'Florist', lowRange: 2000, highRange: 8500, unit: 'per_event', notes: 'Year-round availability' },
    { category: 'banquet_hall', label: 'Banquet Hall', lowRange: 5000, highRange: 25000, unit: 'per_event', notes: 'More affordable than Bay Area' },
    { category: 'gurdwara', label: 'Gurdwara', lowRange: 400, highRange: 1800, unit: 'per_event', notes: 'Yuba City area has strong Sikh presence' },
    { category: 'temple', label: 'Temple', lowRange: 800, highRange: 4000, unit: 'per_event', notes: 'Local Hindu temples serve region' },
    { category: 'horse_rental', label: 'Horse Rental', lowRange: 700, highRange: 1800, unit: 'per_event', notes: 'Good agricultural region access' },
    { category: 'limo_service', label: 'Limo Service', lowRange: 350, highRange: 1000, unit: 'per_event', notes: 'Less traffic than coastal metros' },
    { category: 'turban_tier', label: 'Turban Tier', lowRange: 45, highRange: 130, unit: 'per_item', notes: 'Yuba City area specialists' },
    { category: 'pandit', label: 'Pandit', lowRange: 450, highRange: 1300, unit: 'per_event', notes: 'Good local availability' },
    { category: 'baraat_band', label: 'Baraat Band', lowRange: 900, highRange: 2800, unit: 'per_event', notes: 'Strong local Punjabi community' },
    { category: 'garland_maker', label: 'Garland Maker', lowRange: 90, highRange: 450, unit: 'per_item', notes: 'Fresh flowers readily available' },
    { category: 'tent_service', label: 'Tent Service', lowRange: 2800, highRange: 13000, unit: 'per_event', notes: 'Hot summers; cooling helpful' },
    { category: 'mobile_food', label: 'Mobile Food', lowRange: 1400, highRange: 3800, unit: 'per_event', notes: 'Good food truck scene' },
  ],
  'Vancouver': [
    { category: 'photographer', label: 'Photographer', lowRange: 3500, highRange: 10000, unit: 'per_event', notes: 'CAD pricing; strong South Asian wedding market' },
    { category: 'videographer', label: 'Videographer', lowRange: 3000, highRange: 8500, unit: 'per_event', notes: 'CAD; cinematic packages popular' },
    { category: 'caterer', label: 'Caterer', lowRange: 65, highRange: 150, unit: 'per_person', notes: 'CAD; excellent Punjabi cuisine options' },
    { category: 'halal_caterer', label: 'Halal Caterer', lowRange: 70, highRange: 160, unit: 'per_person', notes: 'CAD; strong halal catering scene' },
    { category: 'dj', label: 'DJ', lowRange: 1200, highRange: 3500, unit: 'per_event', notes: 'CAD; great Bollywood/Bhangra DJs locally' },
    { category: 'dhol_player', label: 'Dhol Player', lowRange: 400, highRange: 1000, unit: 'per_event', notes: 'CAD; excellent local availability in Surrey' },
    { category: 'makeup_artist', label: 'Makeup Artist', lowRange: 300, highRange: 700, unit: 'per_event', notes: 'CAD; many South Asian specialists' },
    { category: 'mehndi_artist', label: 'Mehndi Artist', lowRange: 125, highRange: 350, unit: 'per_hour', notes: 'CAD; bridal mehndi $300-700' },
    { category: 'decorator', label: 'Decorator', lowRange: 4500, highRange: 22000, unit: 'per_event', notes: 'CAD; Surrey area has many specialists' },
    { category: 'mandap_decorator', label: 'Mandap Decorator', lowRange: 3000, highRange: 14000, unit: 'per_event', notes: 'CAD; custom traditional and modern designs' },
    { category: 'florist', label: 'Florist', lowRange: 2200, highRange: 9000, unit: 'per_event', notes: 'CAD; fresh flower availability excellent' },
    { category: 'banquet_hall', label: 'Banquet Hall', lowRange: 6000, highRange: 30000, unit: 'per_event', notes: 'CAD; many South Asian-friendly venues' },
    { category: 'gurdwara', label: 'Gurdwara', lowRange: 500, highRange: 2000, unit: 'per_event', notes: 'CAD; largest Sikh population outside India' },
    { category: 'temple', label: 'Temple', lowRange: 800, highRange: 4000, unit: 'per_event', notes: 'CAD; Ross Street Temple well-known' },
    { category: 'horse_rental', label: 'Horse Rental', lowRange: 800, highRange: 1800, unit: 'per_event', notes: 'CAD; good availability in Fraser Valley' },
    { category: 'limo_service', label: 'Limo Service', lowRange: 400, highRange: 1100, unit: 'per_event', notes: 'CAD; many luxury options' },
    { category: 'turban_tier', label: 'Turban Tier', lowRange: 50, highRange: 140, unit: 'per_item', notes: 'CAD; Surrey has excellent pagg services' },
    { category: 'pandit', label: 'Pandit', lowRange: 400, highRange: 1200, unit: 'per_event', notes: 'CAD; good priest availability' },
    { category: 'granthi', label: 'Granthi', lowRange: 300, highRange: 800, unit: 'per_event', notes: 'CAD; Gurdwara-based or independent' },
    { category: 'baraat_band', label: 'Baraat Band', lowRange: 900, highRange: 2800, unit: 'per_event', notes: 'CAD; strong Punjabi music community' },
    { category: 'garland_maker', label: 'Garland Maker', lowRange: 100, highRange: 450, unit: 'per_item', notes: 'CAD; fresh jaimala specialists' },
    { category: 'tent_service', label: 'Tent Service', lowRange: 3000, highRange: 14000, unit: 'per_event', notes: 'CAD; rain protection important in Vancouver' },
    { category: 'mobile_food', label: 'Mobile Food', lowRange: 1400, highRange: 4000, unit: 'per_event', notes: 'CAD; growing food truck options' },
  ],
  'Toronto': [
    { category: 'photographer', label: 'Photographer', lowRange: 4000, highRange: 12000, unit: 'per_event', notes: 'CAD; largest South Asian wedding market in Canada' },
    { category: 'videographer', label: 'Videographer', lowRange: 3500, highRange: 10000, unit: 'per_event', notes: 'CAD; cinematic specialists abundant' },
    { category: 'caterer', label: 'Caterer', lowRange: 75, highRange: 170, unit: 'per_person', notes: 'CAD; excellent variety of regional cuisines' },
    { category: 'halal_caterer', label: 'Halal Caterer', lowRange: 80, highRange: 180, unit: 'per_person', notes: 'CAD; strong Pakistani/Indian halal options' },
    { category: 'dj', label: 'DJ', lowRange: 1500, highRange: 4000, unit: 'per_event', notes: 'CAD; top-tier Bollywood/Bhangra DJs' },
    { category: 'dhol_player', label: 'Dhol Player', lowRange: 450, highRange: 1200, unit: 'per_event', notes: 'CAD; excellent availability in Brampton/Mississauga' },
    { category: 'makeup_artist', label: 'Makeup Artist', lowRange: 350, highRange: 850, unit: 'per_event', notes: 'CAD; many celebrity artists locally' },
    { category: 'mehndi_artist', label: 'Mehndi Artist', lowRange: 150, highRange: 400, unit: 'per_hour', notes: 'CAD; bridal mehndi $350-850' },
    { category: 'decorator', label: 'Decorator', lowRange: 5500, highRange: 28000, unit: 'per_event', notes: 'CAD; elaborate setups common' },
    { category: 'mandap_decorator', label: 'Mandap Decorator', lowRange: 3500, highRange: 18000, unit: 'per_event', notes: 'CAD; custom luxury designs' },
    { category: 'florist', label: 'Florist', lowRange: 2500, highRange: 11000, unit: 'per_event', notes: 'CAD; premium arrangements available' },
    { category: 'banquet_hall', label: 'Banquet Hall', lowRange: 8000, highRange: 40000, unit: 'per_event', notes: 'CAD; many large-capacity venues' },
    { category: 'gurdwara', label: 'Gurdwara', lowRange: 500, highRange: 2500, unit: 'per_event', notes: 'CAD; Malton and Brampton areas popular' },
    { category: 'temple', label: 'Temple', lowRange: 1000, highRange: 5000, unit: 'per_event', notes: 'CAD; BAPS and other major temples' },
    { category: 'mosque', label: 'Mosque/Masjid', lowRange: 500, highRange: 2000, unit: 'per_event', notes: 'CAD; many options for Nikah ceremonies' },
    { category: 'horse_rental', label: 'Horse Rental', lowRange: 900, highRange: 2200, unit: 'per_event', notes: 'CAD; good availability' },
    { category: 'limo_service', label: 'Limo Service', lowRange: 450, highRange: 1300, unit: 'per_event', notes: 'CAD; luxury fleet options' },
    { category: 'turban_tier', label: 'Turban Tier', lowRange: 55, highRange: 160, unit: 'per_item', notes: 'CAD; Brampton area specialists' },
    { category: 'pandit', label: 'Pandit', lowRange: 500, highRange: 1500, unit: 'per_event', notes: 'CAD; various tradition specialists' },
    { category: 'granthi', label: 'Granthi', lowRange: 350, highRange: 900, unit: 'per_event', notes: 'CAD; Gurdwara-based or independent' },
    { category: 'imam', label: 'Imam', lowRange: 300, highRange: 800, unit: 'per_event', notes: 'CAD; for Nikah ceremonies' },
    { category: 'baraat_band', label: 'Baraat Band', lowRange: 1000, highRange: 3500, unit: 'per_event', notes: 'CAD; vibrant music scene' },
    { category: 'garland_maker', label: 'Garland Maker', lowRange: 120, highRange: 500, unit: 'per_item', notes: 'CAD; fresh flowers readily available' },
    { category: 'tent_service', label: 'Tent Service', lowRange: 3500, highRange: 16000, unit: 'per_event', notes: 'CAD; summer outdoor events popular' },
    { category: 'mobile_food', label: 'Mobile Food', lowRange: 1600, highRange: 4500, unit: 'per_event', notes: 'CAD; diverse food truck options' },
  ],
};

export const VENDOR_CATEGORY_INFO: Record<string, VendorCategoryInfo> = {
  photographer: {
    category: 'photographer',
    label: 'Photographer',
    description: 'Wedding photographers capture your most precious moments across all ceremonies and celebrations.',
    whatToLookFor: [
      'Experience with South Asian weddings and multi-day events',
      'Portfolio showing similar wedding traditions to yours',
      'Familiarity with key ceremonies (Anand Karaj, Pheras, Nikah, etc.)',
      'Second shooter for larger events',
      'Quick turnaround for engagement/save-the-date images',
    ],
    redFlags: [
      'No experience with Indian/South Asian weddings',
      'Unwilling to share a full wedding gallery (not just highlights)',
      'No contract or unclear pricing for multi-day coverage',
      'Poor reviews about meeting deadlines',
    ],
    bookingTips: [
      'Book 9-12 months in advance for peak wedding season',
      'Ask about multi-day package discounts',
      'Request to see a full wedding album, not just highlight reels',
      'Confirm they understand your ceremony timeline',
    ],
    faqs: [
      { question: 'How many hours of coverage do I need?', answer: 'For a single day with ceremony and reception, plan for 8-10 hours. Multi-day weddings typically need 20-40 hours total coverage across all events (Mehndi, Sangeet, Wedding, Reception).' },
      { question: 'Should I hire one photographer or two?', answer: 'For weddings over 150 guests, strongly consider two photographers. This ensures coverage of both sides during baraat, simultaneous getting-ready shots, and better reception coverage.' },
      { question: 'When will I get my photos?', answer: 'Highlight previews usually come within 1-2 weeks. Full edited galleries typically take 6-12 weeks. Rush delivery is often available for an additional fee.' },
      { question: 'Do photographers travel?', answer: 'Most photographers charge a travel fee (typically $500-1500+ for flights, hotels, and transportation). Some include one local wedding in their base price.' },
    ],
  },
  videographer: {
    category: 'videographer',
    label: 'Videographer',
    description: 'Wedding videographers create cinematic films of your wedding day to relive for years to come.',
    whatToLookFor: [
      'Cinematic style that matches your vision',
      'Experience capturing South Asian ceremonies',
      'High-quality audio equipment for vows and speeches',
      'Drone footage options for outdoor venues',
      'Same-day edit capabilities for reception viewing',
    ],
    redFlags: [
      'No sample South Asian wedding films',
      'Poor audio quality in sample videos',
      'Overly long delivery times (6+ months)',
      'No backup equipment policy',
    ],
    bookingTips: [
      'Watch 2-3 full wedding films, not just trailers',
      'Ask about audio recording for ceremonies with live music',
      'Confirm raw footage availability and storage terms',
      'Discuss same-day edit options for receptions',
    ],
    faqs: [
      { question: 'What deliverables should I expect?', answer: 'Standard packages include a 3-5 minute highlight film and a 20-45 minute feature film. Some include ceremony and reception in full length.' },
      { question: 'Is drone footage worth it?', answer: 'For outdoor venues with scenic surroundings, drone footage adds beautiful establishing shots. Check venue restrictions first as some locations prohibit drones.' },
      { question: 'Can I have a same-day edit?', answer: 'Many videographers offer 2-3 minute same-day edits to play during the reception. This usually requires an additional shooter and costs $500-1500 extra.' },
      { question: 'How long until I receive my wedding film?', answer: 'Expect 3-6 months for full delivery. Highlight reels often come within 4-8 weeks. Rush options may be available.' },
    ],
  },
  caterer: {
    category: 'caterer',
    label: 'Caterer',
    description: 'Caterers provide food service for your wedding events, from intimate gatherings to large receptions.',
    whatToLookFor: [
      'Experience with your specific regional cuisine (Punjabi, Gujarati, South Indian, etc.)',
      'Ability to handle large guest counts efficiently',
      'Professional service staff and presentation',
      'Flexibility for dietary restrictions (vegetarian, Jain, allergies)',
      'Experience with multi-course Indian meal service',
    ],
    redFlags: [
      'No tasting offered before booking',
      'Unclear pricing on service staff and rentals',
      'Poor reviews about food running out',
      'Inflexible menus with no customization',
    ],
    bookingTips: [
      'Always schedule a tasting before signing',
      'Get itemized quotes including service staff, rentals, taxes',
      'Ask about their per-guest count policy and overage charges',
      'Confirm timeline for late-night snacks if having a long reception',
    ],
    faqs: [
      { question: 'How much food per person should I plan?', answer: 'For buffet style, plan 1.5 lbs of food per guest. Indian weddings often serve more courses, so work with your caterer on appropriate quantities. Always have 10-15% buffer.' },
      { question: 'Should I do buffet or plated service?', answer: 'Buffets are traditional for South Asian weddings and allow guests to choose portions. Plated service is more formal but costs 20-40% more and requires precise guest counts.' },
      { question: 'What about vegetarian/Jain guests?', answer: 'Most Indian caterers are experienced with vegetarian cuisine. Communicate Jain requirements (no onion/garlic, no root vegetables) early as these need special preparation.' },
      { question: 'How early should I book a caterer?', answer: 'Book 6-9 months ahead for popular caterers, especially for peak season weekends. Finalize your menu and counts 2-3 weeks before the event.' },
    ],
  },
  dj: {
    category: 'dj',
    label: 'DJ',
    description: 'DJs provide music entertainment, sound systems, and often MC services for your wedding events.',
    whatToLookFor: [
      'Extensive Bollywood and Bhangra music library',
      'Experience MCing South Asian wedding events',
      'Quality sound and lighting equipment',
      'Ability to read the crowd and adjust energy',
      'Collaboration with live musicians if needed',
    ],
    redFlags: [
      'Limited South Asian music knowledge',
      'No professional equipment (using laptop speakers)',
      'Unwilling to take song requests',
      'Poor reviews about volume control or timing',
    ],
    bookingTips: [
      'Ask for references from recent South Asian weddings',
      'Discuss your music preferences and must-play/do-not-play lists',
      'Confirm they can coordinate with dhol players or live band',
      'Test their MC skills with ceremony pronunciation',
    ],
    faqs: [
      { question: 'What equipment is included?', answer: 'Standard packages include speakers, subwoofers, wireless microphones, basic lighting, and a mixing setup. Premium packages add intelligent lighting, uplighting, and dance floor effects.' },
      { question: 'Should my DJ also MC?', answer: 'Most South Asian wedding DJs also MC. Ensure they can pronounce names correctly and understand ceremony flow. Some couples hire a separate MC for more personalized hosting.' },
      { question: 'How do I share my music preferences?', answer: 'Create a must-play list (10-15 songs), a do-not-play list, and a general style guide (70% Bollywood, 30% Western, etc.). Good DJs will work with you on the flow.' },
      { question: 'Do I need a separate sound system for ceremony?', answer: 'If your ceremony is in a different location, you may need a separate sound setup. Some DJs offer ceremony packages with wireless mics for priests and families.' },
    ],
  },
  dhol_player: {
    category: 'dhol_player',
    label: 'Dhol Player',
    description: 'Dhol players provide traditional Punjabi drums for baraat processions and celebrations.',
    whatToLookFor: [
      'High energy performance style',
      'Experience with different ceremony types',
      'Availability of multiple dholis for larger baraats',
      'Quality instruments with good sound',
      'Professional attire appropriate for your wedding',
    ],
    redFlags: [
      'Unable to provide video samples',
      'Unclear about number of players included',
      'No experience with your tradition',
      'Poor stamina for extended processions',
    ],
    bookingTips: [
      'Book 4-6 months ahead for peak season',
      'Discuss the baraat route length and timeline',
      'Confirm how many dhol players you need (2-4 for 200+ guests)',
      'Ask about coordination with DJ or band',
    ],
    faqs: [
      { question: 'How many dhol players do I need?', answer: 'For intimate baraats (under 100 guests), 1-2 dholis work well. For larger processions (200+), 3-4 dholis create the full celebratory atmosphere.' },
      { question: 'How long is a typical baraat?', answer: 'Most baraats run 30-45 minutes. Ensure your dhol players can maintain high energy throughout. Some also perform during milni and reception dances.' },
      { question: 'Can dhol players coordinate with a DJ?', answer: 'Yes! Experienced dhol players regularly coordinate with DJs for seamless transitions. They can also play alongside recorded music at sangeet or reception.' },
      { question: 'What should dhol players wear?', answer: 'Most wear traditional kurta pajama or matching outfits. Discuss color coordination with your wedding theme—many can wear colors to match.' },
    ],
  },
  makeup_artist: {
    category: 'makeup_artist',
    label: 'Makeup Artist',
    description: 'Makeup artists provide beauty services for brides and bridal parties across all wedding events.',
    whatToLookFor: [
      'Portfolio with South Asian brides in your skin tone range',
      'Experience with heavy/traditional bridal looks and natural looks',
      'Ability to make makeup last through long ceremonies',
      'Hair styling capabilities or hair stylist partnership',
      'Airbrush makeup option for photography',
    ],
    redFlags: [
      'Limited portfolio of South Asian brides',
      'No trial session offered',
      'Using non-professional or expired products',
      'Rushing through appointments',
    ],
    bookingTips: [
      'Schedule a trial 2-3 months before wedding',
      'Bring photos of looks you love and don\'t love',
      'Discuss each event\'s look (different for mehndi vs wedding)',
      'Confirm travel arrangements for getting-ready location',
    ],
    faqs: [
      { question: 'Should I get a trial?', answer: 'Absolutely. Trials are essential to test products on your skin, perfect your look, and build rapport with your artist. Most artists charge $150-300 for trials.' },
      { question: 'How many touch-up sessions do I need?', answer: 'For multi-day weddings, most brides book separate appointments for each major event. Your artist should be available for touch-ups before key moments like first dance or ceremony.' },
      { question: 'What about my bridal party?', answer: 'Many makeup artists offer bridal party pricing ($100-200 per person). Book early as they\'ll need a timeline to complete everyone before photos.' },
      { question: 'Should I use airbrush or traditional makeup?', answer: 'Airbrush lasts longer and photographs beautifully but costs more. Traditional allows more buildable coverage. Many artists combine both techniques.' },
    ],
  },
  mehndi_artist: {
    category: 'mehndi_artist',
    label: 'Mehndi Artist',
    description: 'Mehndi artists apply intricate henna designs for mehndi ceremonies and bridal preparation.',
    whatToLookFor: [
      'Portfolio showing intricate bridal mehndi',
      'Style alignment (traditional, modern, Arabic, etc.)',
      'Speed for guest mehndi at large events',
      'Natural henna products (chemical-free)',
      'Experience with your tradition\'s patterns',
    ],
    redFlags: [
      'Using "black henna" (contains harmful chemicals)',
      'No portfolio of recent bridal work',
      'Rushing through complex designs',
      'Unclear pricing structure',
    ],
    bookingTips: [
      'Book 3-6 months ahead for popular artists',
      'Schedule bridal mehndi to allow 24-48 hours for darkening before wedding',
      'Plan timing for guest mehndi (5-15 min per guest)',
      'Ask about natural henna paste and aftercare instructions',
    ],
    faqs: [
      { question: 'How long does bridal mehndi take?', answer: 'Intricate bridal mehndi (both hands and feet) takes 4-6 hours. Plan accordingly and have comfortable seating. Some brides split over two sessions.' },
      { question: 'When should I schedule my mehndi?', answer: 'Apply bridal mehndi 1-2 days before your wedding for the darkest stain. The color develops over 24-48 hours after paste removal.' },
      { question: 'How many artists for guest mehndi?', answer: 'Each artist can do about 4-6 guests per hour for simple designs. For 100 guests wanting mehndi, plan for 3-4 artists over 4-5 hours.' },
      { question: 'What about mehndi allergies?', answer: 'Natural henna rarely causes reactions. Avoid "black henna" which contains PPD (harmful chemical). Do a patch test 24 hours before if concerned.' },
    ],
  },
  decorator: {
    category: 'decorator',
    label: 'Decorator',
    description: 'Decorators transform venues with florals, lighting, draping, and thematic elements for all events.',
    whatToLookFor: [
      'Experience with South Asian wedding aesthetics',
      'Portfolio showing mandap/stage designs',
      'In-house inventory vs. rental partnerships',
      'Ability to work with your venue restrictions',
      'Design consultation included in package',
    ],
    redFlags: [
      'No South Asian wedding experience',
      'Unclear breakdown of what\'s included',
      'Poor reviews about setup timing',
      'Unwilling to do venue walkthrough',
    ],
    bookingTips: [
      'Book 6-9 months ahead for custom designs',
      'Do venue walkthrough with decorator',
      'Get itemized quote separating rentals, labor, florals',
      'Confirm setup and breakdown timeline with venue',
    ],
    faqs: [
      { question: 'What\'s included in decoration packages?', answer: 'Packages vary widely. Common inclusions: mandap/stage, centerpieces, entrance decor, and aisle decoration. Confirm what\'s rental vs. purchase, and whether fresh florals are included.' },
      { question: 'Should I hire separate florist and decorator?', answer: 'Many decorators include florals in their packages. If you want elaborate fresh flower work, consider a specialist florist who coordinates with your decorator.' },
      { question: 'How does pricing work?', answer: 'Most decorators offer tiered packages ($5K, $10K, $20K+). Custom designs are quoted after consultation. Get itemized pricing to understand where money goes.' },
      { question: 'What about outdoor weddings?', answer: 'Outdoor decor requires weather considerations—weights for drapes, weather-resistant materials. Discuss backup plans and any additional costs.' },
    ],
  },
  banquet_hall: {
    category: 'banquet_hall',
    label: 'Banquet Hall',
    description: 'Banquet halls provide event space for wedding ceremonies, receptions, and related celebrations.',
    whatToLookFor: [
      'Experience hosting South Asian weddings',
      'Adequate space for your guest count + dancing',
      'Flexible catering policies (outside caterers allowed)',
      'Good acoustics for music and speeches',
      'Sufficient parking or valet options',
    ],
    redFlags: [
      'Strict end times with no flexibility',
      'Hidden fees (cake cutting, corkage, etc.)',
      'Mandatory vendor lists that limit your choices',
      'Poor reviews about noise complaints',
    ],
    bookingTips: [
      'Book 9-12 months ahead for peak dates',
      'Ask about decor restrictions and setup time',
      'Understand all fees: catering minimums, overtime, service charges',
      'Visit during another event to see flow',
    ],
    faqs: [
      { question: 'What capacity should I look for?', answer: 'Plan for your guest count + 20% for dancing space. For 200 guests with dinner and dancing, look for spaces that fit 250-300.' },
      { question: 'Can I bring my own caterer?', answer: 'Many banquet halls have preferred caterers or in-house catering. Outside caterers may be allowed with a buyout fee. This significantly affects your budget.' },
      { question: 'What about ceremony and reception in same venue?', answer: 'Dual-use spaces need flip time between ceremony and reception. Plan 1-2 hours for setup changes. Some venues have separate ceremony and reception spaces.' },
      { question: 'What\'s typically included in venue rental?', answer: 'Standard inclusions: tables, chairs, linens, and basic sound. Confirm whether setup/breakdown, parking attendants, and security are included.' },
    ],
  },
  gurdwara: {
    category: 'gurdwara',
    label: 'Gurdwara',
    description: 'Gurdwaras are Sikh temples where Anand Karaj (Sikh wedding ceremony) takes place.',
    whatToLookFor: [
      'Availability on your preferred date',
      'Capacity for your guest count',
      'Langar (community kitchen) availability',
      'Parking and accessibility',
      'Photography/videography policies',
    ],
    redFlags: [
      'Unclear donation expectations',
      'Conflicts with other scheduled events',
      'No clear communication channels',
      'Restrictions that conflict with your plans',
    ],
    bookingTips: [
      'Contact 9-12 months ahead for popular dates',
      'Understand donation-based vs. booking fee model',
      'Confirm all ceremonies (milni, Anand Karaj) can happen there',
      'Ask about restrictions on photography during ceremony',
    ],
    faqs: [
      { question: 'How early can I book?', answer: 'Most Gurdwaras allow bookings 6-12 months ahead. Popular dates (long weekends, auspicious dates) fill quickly. Contact the secretary or management committee early.' },
      { question: 'What is the typical donation?', answer: 'Donations vary by Gurdwara and services used. Ranges from $500-$2500. This often includes use of hall, langar facilities, and Granthi services. Ask for clarity.' },
      { question: 'What about langar (community meal)?', answer: 'Many Gurdwaras allow use of langar hall for post-ceremony meal. You can contribute to langar ingredients or have your caterer prepare food in their kitchen if allowed.' },
      { question: 'Are outside photographers allowed during ceremony?', answer: 'Policies vary. Some allow photography with restrictions (no flash, designated areas). Others prefer their own documentation. Ask specifically about videography too.' },
    ],
  },
  temple: {
    category: 'temple',
    label: 'Temple',
    description: 'Hindu temples provide sacred spaces for traditional Hindu wedding ceremonies.',
    whatToLookFor: [
      'Temple priest available for your ceremony type',
      'Adequate mandap/ceremony space',
      'Hall availability for milni or small reception',
      'Flexibility with your ceremony preferences',
      'Clear communication about traditions required',
    ],
    redFlags: [
      'Inflexible ceremony requirements you\'re uncomfortable with',
      'Poor communication or organization',
      'No clear booking process',
      'Hidden requirements or fees',
    ],
    bookingTips: [
      'Consult with temple priest about ceremony customization',
      'Confirm auspicious timing (muhurtham) with temple astrologer if desired',
      'Understand what\'s included in temple vs. your own vendor needs',
      'Visit temple to understand space and logistics',
    ],
    faqs: [
      { question: 'Do temple priests perform the entire ceremony?', answer: 'Temple priests typically perform traditional ceremonies. Discuss any customizations (family involvement, shortened ceremony) in advance.' },
      { question: 'Can I use my own pandit instead of temple priest?', answer: 'Some temples allow this; others require their priests. Ask early if you have a family pandit you want to involve.' },
      { question: 'What about post-ceremony reception?', answer: 'Many temples have adjacent halls for small receptions or lunch. For larger celebrations, most couples use separate venue for reception.' },
      { question: 'Are there any attire requirements?', answer: 'Most temples have dress codes for ceremony—traditional attire expected. Some require head covering. Ask about specific requirements.' },
    ],
  },
  turban_tier: {
    category: 'turban_tier',
    label: 'Turban Tier',
    description: 'Turban tiers (pagg services) provide professional turban tying for grooms, groomsmen, and guests.',
    whatToLookFor: [
      'Experience with various turban styles',
      'Ability to handle multiple turbans efficiently',
      'Quality turbans available for purchase/rental',
      'Flexibility with colors and styles',
      'On-site availability at venue',
    ],
    redFlags: [
      'Limited style options',
      'Unable to handle your guest count',
      'No portfolio or references',
      'Unclear pricing for groups',
    ],
    bookingTips: [
      'Book 2-3 months ahead',
      'Confirm groom turban style well in advance (trial recommended)',
      'Estimate how many guests/groomsmen need tying',
      'Coordinate colors with your wedding outfits',
    ],
    faqs: [
      { question: 'How early should groom arrive for turban?', answer: 'Plan 30-45 minutes for groom\'s turban, especially if it\'s an elaborate style or first time. Groomsmen need 10-15 minutes each.' },
      { question: 'Should I buy or rent turbans?', answer: 'Groom typically purchases (keepsake). Groomsmen turbans can be rented or bought. Rental runs $20-40 per turban; purchase $50-150.' },
      { question: 'What turban styles are available?', answer: 'Common styles include Pochvi, Patiala Shahi, Amritsar, and modern fusion styles. Your tier can suggest what works best with your sehra and outfit.' },
      { question: 'Can turbans be pre-tied?', answer: 'Some styles can be pre-tied and slipped on, but traditional tying looks better and fits perfectly. Pre-tied works for rushed timelines.' },
    ],
  },
  pandit: {
    category: 'pandit',
    label: 'Pandit',
    description: 'Pandits (Hindu priests) perform traditional wedding ceremonies and religious rituals.',
    whatToLookFor: [
      'Experience with your specific tradition/region',
      'Communication style you\'re comfortable with',
      'Flexibility on ceremony length and customization',
      'Good pronunciation and explanation of rituals',
      'Professional demeanor and punctuality',
    ],
    redFlags: [
      'Inflexible about ceremony modifications',
      'Poor communication or missed appointments',
      'Discomfort with photography/videography',
      'Unclear about what ceremony includes',
    ],
    bookingTips: [
      'Meet in person or video call before booking',
      'Discuss ceremony length expectations (typically 45-90 min)',
      'Ask about family participation opportunities',
      'Confirm all materials and requirements needed',
    ],
    faqs: [
      { question: 'How long is a typical Hindu wedding ceremony?', answer: 'Traditional ceremonies run 90 minutes to 2+ hours. Many couples work with pandits to shorten to 45-60 minutes while keeping key rituals.' },
      { question: 'Can the ceremony be explained in English?', answer: 'Most modern pandits explain each ritual in English for guests. Discuss this preference upfront—it helps non-Hindu guests feel included.' },
      { question: 'What items do I need to provide?', answer: 'Pandits typically provide a list: flowers, rice, ghee, coconut, etc. Some pandits bring samagri (materials); others require you to purchase.' },
      { question: 'Can I customize the ceremony?', answer: 'Many pandits accommodate requests—shorter ceremony, specific mantras, family blessings. Discuss your vision early to ensure compatibility.' },
    ],
  },
  florist: {
    category: 'florist',
    label: 'Florist',
    description: 'Florists create bridal bouquets, centerpieces, garlands, and floral decorations for all events.',
    whatToLookFor: [
      'Experience with South Asian wedding florals (garlands, sehra, etc.)',
      'Quality of fresh flowers and arrangements',
      'Ability to work with your decorator/venue',
      'Seasonal flower knowledge and alternatives',
      'Reliable delivery and setup',
    ],
    redFlags: [
      'No experience with jaimala/garlands',
      'Unwilling to provide references',
      'Poor reviews about flower freshness',
      'No consultation process',
    ],
    bookingTips: [
      'Book 4-6 months ahead for custom work',
      'Schedule a consultation to see their work and discuss your vision',
      'Be flexible on specific flowers (seasonal availability varies)',
      'Get itemized pricing for each arrangement',
    ],
    faqs: [
      { question: 'What special florals do South Asian weddings need?', answer: 'Key items: jaimala (ceremonial garlands), sehra (groom\'s head decoration), bridal bouquet, boutonnières, and centerpieces. Some traditions also use flower petals for aisle and mandap.' },
      { question: 'Fresh flowers vs. artificial?', answer: 'Fresh flowers are preferred for ceremony and personal flowers. Artificial/silk works for some décor elements that need to last multiple events or outdoor heat.' },
      { question: 'How far in advance do I order?', answer: 'Book your florist 4-6 months ahead. Finalize specific flower choices and counts 4-6 weeks before wedding based on seasonal availability.' },
      { question: 'What affects floral pricing?', answer: 'Factors include: flower types (roses cheaper than peonies), season, quantity, arrangement complexity, and delivery/setup needs. Labor is often 30-40% of total.' },
    ],
  },
  horse_rental: {
    category: 'horse_rental',
    label: 'Horse Rental',
    description: 'Horse rentals provide decorated horses for groom\'s baraat procession.',
    whatToLookFor: [
      'Well-trained, calm horses suited for crowds',
      'Experience with South Asian wedding baraats',
      'Beautiful horse decoration and handler attire',
      'Insurance and safety measures',
      'Backup plan if horse is unavailable',
    ],
    redFlags: [
      'Horse seems nervous or poorly trained',
      'No insurance documentation',
      'Poor decoration quality',
      'Unable to handle venue logistics',
    ],
    bookingTips: [
      'Book 3-6 months ahead',
      'Confirm venue allows horses (some don\'t)',
      'Plan route and duration with handler',
      'Have backup plan (vintage car) in case of issues',
    ],
    faqs: [
      { question: 'What if my venue doesn\'t allow horses?', answer: 'Some venues have restrictions. Alternatives include decorated vintage cars, motorcycles, or walking baraats with extra dhol energy.' },
      { question: 'Is horse riding safe?', answer: 'Wedding horses are specially trained for crowds and noise. You\'ll have a handler walking alongside. Those uncomfortable riding can have someone lead the horse while walking.' },
      { question: 'What\'s included in the rental?', answer: 'Typically: decorated horse, handler, decorations, and set time (usually 1-2 hours). Confirm what decorations they provide vs. what you need to supply.' },
      { question: 'What about weather considerations?', answer: 'Horses can typically work in light rain. Extreme heat or cold may require adjustments. Discuss contingency plans with your vendor.' },
    ],
  },
  limo_service: {
    category: 'limo_service',
    label: 'Limo Service',
    description: 'Limousine services provide luxury transportation for wedding parties and guests.',
    whatToLookFor: [
      'Fleet variety matching your style preferences',
      'Reliable, professional drivers',
      'Experience with wedding logistics',
      'Flexibility with multi-stop routes',
      'Clean, well-maintained vehicles',
    ],
    redFlags: [
      'Poor vehicle condition',
      'Unreliable timing history',
      'Hidden fees or unclear pricing',
      'No backup vehicle policy',
    ],
    bookingTips: [
      'Book 2-4 months ahead',
      'View vehicles in person before booking',
      'Create detailed timeline with addresses',
      'Ask about overtime rates and policies',
    ],
    faqs: [
      { question: 'What size limo do I need?', answer: 'Consider your bridal party size. Standard stretch fits 8-10. SUV limos fit 12-18. Party buses fit 20-40. For just bride/groom, classic cars or town cars work beautifully.' },
      { question: 'How many hours should I book?', answer: 'Typical wedding bookings run 4-6 hours covering getting ready, ceremony transport, photos, and reception arrival. Factor in traffic for your city.' },
      { question: 'What about guest transportation?', answer: 'For destination ceremonies or venues without parking, consider shuttle service for guests. This usually requires separate booking from bridal party limo.' },
      { question: 'Are decorations included?', answer: 'Basic "Just Married" signs are often included. Discuss any specific decor (flowers, ribbons) with your vendor—some charge extra.' },
    ],
  },
  baraat_band: {
    category: 'baraat_band',
    label: 'Baraat Band',
    description: 'Baraat bands provide live music entertainment for groom\'s wedding procession.',
    whatToLookFor: [
      'High energy, crowd-engaging performance style',
      'Professional musicians and instruments',
      'Appropriate attire for your wedding theme',
      'Ability to coordinate with dhol and DJ',
      'Good reviews about punctuality',
    ],
    redFlags: [
      'No video samples of performances',
      'Inflexible repertoire',
      'Poor quality instruments',
      'No experience with South Asian weddings',
    ],
    bookingTips: [
      'Book 4-6 months ahead for peak season',
      'Confirm band size and instrument mix',
      'Discuss coordination with dhol players',
      'Plan route and duration together',
    ],
    faqs: [
      { question: 'What instruments are in a baraat band?', answer: 'Traditional bands include brass instruments (trumpet, tuba), drums, and sometimes clarinet. Band size ranges from 4-8 musicians plus dancers.' },
      { question: 'Do bands include dancers?', answer: 'Many baraat band packages include 2-4 dancers who lead the procession. These add significant energy but cost extra. Ask about all-inclusive pricing.' },
      { question: 'Can they play during other events?', answer: 'Some bands also perform at sangeet or reception cocktail hour. Discuss your full event schedule to see if a multi-event package works.' },
      { question: 'How loud is a live band?', answer: 'Live bands are meant to be loud and celebratory. For venues with noise restrictions, discuss options with your band and venue coordinator.' },
    ],
  },
  garland_maker: {
    category: 'garland_maker',
    label: 'Garland Maker',
    description: 'Garland makers create ceremonial flower garlands (jaimala, varmala) for wedding rituals.',
    whatToLookFor: [
      'Fresh, high-quality flowers',
      'Experience with traditional jaimala designs',
      'Ability to match your color scheme',
      'Reliable delivery timing',
      'Proper storage for freshness',
    ],
    redFlags: [
      'Using old or wilting flowers',
      'No samples or portfolio',
      'No refrigerated storage',
      'Poor delivery reliability',
    ],
    bookingTips: [
      'Book 2-4 weeks ahead',
      'Order a sample in advance if possible',
      'Confirm delivery time (should arrive 1-2 hours before ceremony)',
      'Arrange for refrigerated storage at venue',
    ],
    faqs: [
      { question: 'What flowers are traditional for jaimala?', answer: 'Roses, marigolds, jasmine, orchids, and tuberose are popular. Color choice often matches bride/groom outfits. Ask about seasonal availability.' },
      { question: 'How long do garlands last?', answer: 'Fresh garlands last 4-8 hours at room temperature, longer if refrigerated. Schedule delivery close to ceremony time.' },
      { question: 'Do I need garlands for anything besides jaimala?', answer: 'You might want welcome garlands for guests of honor, garlands for milni ritual (greeting families), and sehra for groom. Discuss all needs.' },
      { question: 'Fresh vs. artificial garlands?', answer: 'Fresh flowers are traditional and recommended for ceremony. Artificial garlands work for photos taken in advance or in extreme heat.' },
    ],
  },
};

export function getCityCostForCategory(city: string, category: string): CityVendorCost | null {
  const normalizedCity = normalizeToKnownCity(city);
  const costs = CITY_VENDOR_COSTS[normalizedCity];
  if (!costs) return null;
  return costs.find(c => c.category === category) || null;
}

export function getCityCosts(city: string): CityVendorCost[] {
  const normalizedCity = normalizeToKnownCity(city);
  return CITY_VENDOR_COSTS[normalizedCity] || [];
}

export function getVendorCategoryInfo(category: string): VendorCategoryInfo | null {
  return VENDOR_CATEGORY_INFO[category] || null;
}

export function normalizeToKnownCity(location: string): string {
  if (!location) return 'San Francisco Bay Area';
  const loc = location.toLowerCase();
  if (loc.includes('bay area') || loc.includes('san francisco') || loc.includes('san jose') || loc.includes('oakland') || loc.includes('fremont')) {
    return 'San Francisco Bay Area';
  }
  // Sacramento Metro area includes Sacramento, Elk Grove, Roseville, Folsom, Rancho Cordova, etc.
  if (loc.includes('sacramento') || loc.includes('elk grove') || loc.includes('roseville') || loc.includes('folsom') || loc.includes('rancho cordova') || loc.includes('davis') || loc.includes('woodland')) {
    return 'Sacramento Metro';
  }
  if (loc.includes('new york') || loc.includes('nyc') || loc.includes('manhattan') || loc.includes('brooklyn') || loc.includes('queens')) {
    return 'New York City';
  }
  if (loc.includes('los angeles') || loc.includes('la') || loc.includes('socal') || loc.includes('orange county') || loc.includes('artesia')) {
    return 'Los Angeles';
  }
  if (loc.includes('chicago') || loc.includes('schaumburg')) return 'Chicago';
  if (loc.includes('seattle') || loc.includes('bellevue')) return 'Seattle';
  // Canadian cities
  if (loc.includes('vancouver') || loc.includes('surrey') || loc.includes('burnaby') || loc.includes('richmond') || loc.includes('coquitlam') || loc.includes('langley') || loc.includes('abbotsford') || loc.includes('bc') || loc.includes('british columbia')) return 'Vancouver';
  if (loc.includes('toronto') || loc.includes('mississauga') || loc.includes('brampton') || loc.includes('markham') || loc.includes('scarborough') || loc.includes('vaughan') || loc.includes('gta') || loc.includes('ontario')) return 'Toronto';
  return 'San Francisco Bay Area';
}

export function formatCostRange(cost: CityVendorCost): string {
  const low = cost.lowRange.toLocaleString();
  const high = cost.highRange.toLocaleString();
  
  switch (cost.unit) {
    case 'per_person':
      return `$${low} - $${high} per guest`;
    case 'per_hour':
      return `$${low} - $${high} per hour`;
    case 'per_day':
      return `$${low} - $${high} per day`;
    case 'per_item':
      return `$${low} - $${high} per item`;
    default:
      return `$${low} - $${high}`;
  }
}

export const KNOWN_CITIES = [
  'San Francisco Bay Area',
  'Sacramento Metro',
  'New York City', 
  'Los Angeles',
  'Chicago',
  'Seattle',
  'Vancouver',
  'Toronto',
] as const;
