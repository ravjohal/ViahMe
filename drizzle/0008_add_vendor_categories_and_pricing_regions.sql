-- Create vendor_categories table for database-driven vendor category management
CREATE TABLE IF NOT EXISTS "vendor_categories" (
  "id" VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  "slug" VARCHAR NOT NULL UNIQUE,
  "display_name" TEXT NOT NULL,
  "description" TEXT,
  "icon_name" TEXT,
  "budget_bucket_slug" VARCHAR,
  "tradition_affinity" TEXT[],
  "display_order" INTEGER DEFAULT 0,
  "is_active" BOOLEAN DEFAULT TRUE,
  "is_system_category" BOOLEAN DEFAULT TRUE,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create pricing_regions table for database-driven city/region pricing multipliers
CREATE TABLE IF NOT EXISTS "pricing_regions" (
  "id" VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  "slug" VARCHAR NOT NULL UNIQUE,
  "display_name" TEXT NOT NULL,
  "description" TEXT,
  "multiplier" DECIMAL(4, 2) NOT NULL DEFAULT 1.00,
  "state" VARCHAR,
  "country" VARCHAR DEFAULT 'US',
  "display_order" INTEGER DEFAULT 0,
  "is_active" BOOLEAN DEFAULT TRUE,
  "is_system_region" BOOLEAN DEFAULT TRUE,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Seed vendor categories
INSERT INTO "vendor_categories" ("slug", "display_name", "description", "icon_name", "budget_bucket_slug", "tradition_affinity", "display_order") VALUES
('makeup_artist', 'Makeup Artist', 'Bridal and wedding party makeup services', 'sparkles', 'attire', '{}', 1),
('dj', 'DJ', 'Music and sound for reception and events', 'music', 'entertainment', '{}', 2),
('dhol_player', 'Dhol Player', 'Traditional dhol drumming for baraat and celebrations', 'drum', 'entertainment', '{"sikh","hindu","punjabi"}', 3),
('turban_tier', 'Turban Tier', 'Professional turban tying for groom and family', 'crown', 'attire', '{"sikh","hindu","punjabi"}', 4),
('mehndi_artist', 'Mehndi Artist', 'Henna application for bride and guests', 'hand', 'attire', '{"sikh","hindu","muslim","gujarati"}', 5),
('photographer', 'Photographer', 'Wedding photography and albums', 'camera', 'photography', '{}', 6),
('videographer', 'Videographer', 'Wedding videography and cinematography', 'video', 'photography', '{}', 7),
('caterer', 'Caterer', 'Full-service catering for all events', 'utensils', 'catering', '{}', 8),
('banquet_hall', 'Banquet Hall', 'Wedding venue and reception hall', 'building-2', 'venue', '{}', 9),
('gurdwara', 'Gurdwara', 'Sikh temple for Anand Karaj ceremony', 'building', 'venue', '{"sikh"}', 10),
('temple', 'Temple', 'Hindu temple for wedding ceremony', 'building', 'venue', '{"hindu","gujarati","south_indian"}', 11),
('decorator', 'Decorator', 'Event decoration and styling', 'palette', 'decoration', '{}', 12),
('florist', 'Florist', 'Floral arrangements and bouquets', 'flower-2', 'decoration', '{}', 13),
('horse_rental', 'Horse Rental', 'Baraat horse for groom''s entrance', 'horse', 'transportation', '{"hindu","sikh","punjabi"}', 14),
('sword_rental', 'Sword Rental', 'Ceremonial kirpan for Sikh weddings', 'sword', 'religious', '{"sikh"}', 15),
('tent_service', 'Tent Service', 'Outdoor tent and canopy rentals', 'tent', 'venue', '{}', 16),
('limo_service', 'Limo Service', 'Luxury transportation for wedding party', 'car', 'transportation', '{}', 17),
('mobile_food', 'Mobile Food', 'Food trucks and mobile catering', 'truck', 'catering', '{}', 18),
('baraat_band', 'Baraat Band', 'Traditional brass band for baraat procession', 'music-2', 'entertainment', '{"hindu","sikh","punjabi"}', 19),
('pandit', 'Pandit', 'Hindu priest for wedding ceremonies', 'book-open', 'religious', '{"hindu","gujarati","south_indian"}', 20),
('mandap_decorator', 'Mandap Decorator', 'Specialized wedding mandap design and setup', 'layout', 'decoration', '{"hindu","gujarati","south_indian"}', 21),
('haldi_supplies', 'Haldi Supplies', 'Haldi ceremony supplies and decorations', 'droplet', 'religious', '{"hindu","gujarati"}', 22),
('pooja_items', 'Pooja Items', 'Religious items for Hindu ceremonies', 'flame', 'religious', '{"hindu","gujarati","south_indian"}', 23),
('astrologer', 'Astrologer', 'Wedding muhurat and astrological services', 'star', 'religious', '{"hindu","gujarati","south_indian"}', 24),
('garland_maker', 'Garland Maker', 'Fresh flower garlands for ceremonies', 'circle', 'decoration', '{"hindu","south_indian","gujarati"}', 25),
('qazi', 'Qazi', 'Islamic marriage officiant', 'book-open', 'religious', '{"muslim"}', 26),
('imam', 'Imam', 'Islamic religious leader for nikah ceremony', 'book-open', 'religious', '{"muslim"}', 27),
('nikah_decorator', 'Nikah Decorator', 'Specialized nikah ceremony decoration', 'palette', 'decoration', '{"muslim"}', 28),
('halal_caterer', 'Halal Caterer', 'Halal-certified catering services', 'utensils', 'catering', '{"muslim"}', 29),
('quran_reciter', 'Quran Reciter', 'Professional Quran recitation for ceremonies', 'book', 'religious', '{"muslim"}', 30),
('garba_instructor', 'Garba Instructor', 'Garba and dandiya dance choreography', 'users', 'entertainment', '{"gujarati"}', 31),
('dandiya_equipment', 'Dandiya Equipment', 'Dandiya sticks and garba supplies', 'zap', 'entertainment', '{"gujarati"}', 32),
('rangoli_artist', 'Rangoli Artist', 'Traditional rangoli floor art', 'palette', 'decoration', '{"hindu","gujarati"}', 33),
('nadaswaram_player', 'Nadaswaram Player', 'Traditional South Indian wind instrument', 'music', 'entertainment', '{"south_indian"}', 34),
('silk_saree_rental', 'Silk Saree Rental', 'Kanjivaram and silk saree rentals', 'shirt', 'attire', '{"south_indian"}', 35),
('kolam_artist', 'Kolam Artist', 'Traditional South Indian kolam floor art', 'grid-3x3', 'decoration', '{"south_indian"}', 36)
ON CONFLICT ("slug") DO NOTHING;

-- Seed pricing regions
INSERT INTO "pricing_regions" ("slug", "display_name", "description", "multiplier", "state", "display_order") VALUES
('bay_area', 'Bay Area', 'San Francisco Bay Area including San Jose, Oakland, Fremont', 1.50, 'CA', 1),
('nyc', 'New York City', 'NYC metro area including Long Island, Jersey City', 1.40, 'NY', 2),
('la', 'Los Angeles', 'Greater LA area including Artesia, Cerritos, Orange County', 1.30, 'CA', 3),
('chicago', 'Chicago', 'Chicago metro area including Schaumburg, Naperville', 1.20, 'IL', 4),
('seattle', 'Seattle', 'Seattle metro area including Bellevue, Redmond', 1.10, 'WA', 5),
('sacramento', 'Sacramento', 'Sacramento and Central Valley area', 1.00, 'CA', 6),
('houston', 'Houston', 'Houston metro area with large South Asian community', 1.05, 'TX', 7),
('dallas', 'Dallas', 'Dallas-Fort Worth metro area', 1.05, 'TX', 8),
('atlanta', 'Atlanta', 'Atlanta metro area', 1.00, 'GA', 9),
('dc', 'Washington DC', 'DC metro area including Northern Virginia, Maryland', 1.25, 'DC', 10),
('boston', 'Boston', 'Boston metro area', 1.20, 'MA', 11),
('other', 'Other', 'Other US regions', 1.00, '', 99)
ON CONFLICT ("slug") DO NOTHING;
