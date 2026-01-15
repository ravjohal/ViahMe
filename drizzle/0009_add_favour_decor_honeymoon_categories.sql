-- Migration 0009: Add favour_categories, decor_categories, decor_item_templates, and honeymoon_budget_categories tables
-- These tables migrate hardcoded constants to database-driven reference data

-- ============================================================================
-- FAVOUR CATEGORIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS favour_categories (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  icon_name TEXT,
  tradition_affinity TEXT[] NOT NULL DEFAULT '{}',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_system_category BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Seed favour categories
INSERT INTO favour_categories (slug, display_name, description, icon_name, tradition_affinity, display_order, is_active, is_system_category)
VALUES
  ('mithai', 'Mithai (Sweets)', 'Traditional South Asian sweets and desserts', 'candy', ARRAY['sikh', 'hindu', 'punjabi', 'gujarati'], 1, true, true),
  ('dry_fruits', 'Dry Fruits', 'Almonds, cashews, pistachios and other dried fruits', 'apple', ARRAY['sikh', 'hindu', 'muslim', 'punjabi'], 2, true, true),
  ('clothing', 'Clothing/Accessories', 'Suits, saris, shawls, and other garments', 'shirt', ARRAY[]::TEXT[], 3, true, true),
  ('jewelry', 'Jewelry', 'Gold, silver, and other precious jewelry gifts', 'gem', ARRAY[]::TEXT[], 4, true, true),
  ('home_decor', 'Home Decor', 'Decorative items for the home', 'home', ARRAY[]::TEXT[], 5, true, true),
  ('cosmetics', 'Cosmetics/Beauty', 'Makeup, skincare, and beauty products', 'sparkles', ARRAY[]::TEXT[], 6, true, true),
  ('gift_cards', 'Gift Cards', 'Store and restaurant gift cards', 'credit-card', ARRAY[]::TEXT[], 7, true, true),
  ('cash_envelope', 'Cash Envelopes', 'Traditional shagun/cash gifts in decorative envelopes', 'wallet', ARRAY['sikh', 'hindu', 'punjabi'], 8, true, true),
  ('religious_items', 'Religious Items', 'Prayer items, religious books, and spiritual gifts', 'book-open', ARRAY['sikh', 'hindu', 'muslim'], 9, true, true),
  ('personalized', 'Personalized Gifts', 'Custom engraved or personalized items', 'gift', ARRAY[]::TEXT[], 10, true, true),
  ('other', 'Other', 'Other gift types', 'package', ARRAY[]::TEXT[], 11, true, true)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- DECOR CATEGORIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS decor_categories (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  icon_name TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_system_category BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Seed decor categories
INSERT INTO decor_categories (slug, display_name, description, icon_name, display_order, is_active, is_system_category)
VALUES
  ('general_decor', 'General Decor', 'General wedding decoration items', 'palette', 1, true, true),
  ('florist_list', 'Florist List', 'Floral arrangements and flower-related items', 'flower', 2, true, true)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- DECOR ITEM TEMPLATES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS decor_item_templates (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id VARCHAR NOT NULL,
  item_name TEXT NOT NULL,
  description TEXT,
  default_sourcing TEXT DEFAULT 'hire',
  tradition_affinity TEXT[] NOT NULL DEFAULT '{}',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_system_item BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS decor_item_templates_category_idx ON decor_item_templates (category_id);

-- Seed decor item templates (using subqueries to get category_id)
INSERT INTO decor_item_templates (category_id, item_name, description, default_sourcing, tradition_affinity, display_order, is_active, is_system_item)
SELECT 
  (SELECT id FROM decor_categories WHERE slug = 'general_decor'),
  'Aisle runner',
  'Decorative runner for ceremony aisle',
  'hire',
  ARRAY[]::TEXT[],
  1,
  true,
  true
WHERE EXISTS (SELECT 1 FROM decor_categories WHERE slug = 'general_decor');

INSERT INTO decor_item_templates (category_id, item_name, description, default_sourcing, tradition_affinity, display_order, is_active, is_system_item)
SELECT 
  (SELECT id FROM decor_categories WHERE slug = 'general_decor'),
  'Postbox for cards',
  'Decorative postbox for guest cards',
  'diy',
  ARRAY[]::TEXT[],
  2,
  true,
  true
WHERE EXISTS (SELECT 1 FROM decor_categories WHERE slug = 'general_decor');

INSERT INTO decor_item_templates (category_id, item_name, description, default_sourcing, tradition_affinity, display_order, is_active, is_system_item)
SELECT 
  (SELECT id FROM decor_categories WHERE slug = 'general_decor'),
  'Chair sashes',
  'Decorative chair covers or sashes',
  'hire',
  ARRAY[]::TEXT[],
  3,
  true,
  true
WHERE EXISTS (SELECT 1 FROM decor_categories WHERE slug = 'general_decor');

INSERT INTO decor_item_templates (category_id, item_name, description, default_sourcing, tradition_affinity, display_order, is_active, is_system_item)
SELECT 
  (SELECT id FROM decor_categories WHERE slug = 'general_decor'),
  'Welcome sign',
  'Welcome sign for venue entrance',
  'diy',
  ARRAY[]::TEXT[],
  4,
  true,
  true
WHERE EXISTS (SELECT 1 FROM decor_categories WHERE slug = 'general_decor');

INSERT INTO decor_item_templates (category_id, item_name, description, default_sourcing, tradition_affinity, display_order, is_active, is_system_item)
SELECT 
  (SELECT id FROM decor_categories WHERE slug = 'general_decor'),
  'Table numbers',
  'Numbered signs for reception tables',
  'diy',
  ARRAY[]::TEXT[],
  5,
  true,
  true
WHERE EXISTS (SELECT 1 FROM decor_categories WHERE slug = 'general_decor');

INSERT INTO decor_item_templates (category_id, item_name, description, default_sourcing, tradition_affinity, display_order, is_active, is_system_item)
SELECT 
  (SELECT id FROM decor_categories WHERE slug = 'general_decor'),
  'Centerpieces',
  'Table centerpieces for reception',
  'hire',
  ARRAY[]::TEXT[],
  6,
  true,
  true
WHERE EXISTS (SELECT 1 FROM decor_categories WHERE slug = 'general_decor');

INSERT INTO decor_item_templates (category_id, item_name, description, default_sourcing, tradition_affinity, display_order, is_active, is_system_item)
SELECT 
  (SELECT id FROM decor_categories WHERE slug = 'general_decor'),
  'Fairy lights',
  'String lights for ambient lighting',
  'amazon',
  ARRAY[]::TEXT[],
  7,
  true,
  true
WHERE EXISTS (SELECT 1 FROM decor_categories WHERE slug = 'general_decor');

INSERT INTO decor_item_templates (category_id, item_name, description, default_sourcing, tradition_affinity, display_order, is_active, is_system_item)
SELECT 
  (SELECT id FROM decor_categories WHERE slug = 'general_decor'),
  'Photo backdrop',
  'Backdrop for photo booth or couple photos',
  'hire',
  ARRAY[]::TEXT[],
  8,
  true,
  true
WHERE EXISTS (SELECT 1 FROM decor_categories WHERE slug = 'general_decor');

INSERT INTO decor_item_templates (category_id, item_name, description, default_sourcing, tradition_affinity, display_order, is_active, is_system_item)
SELECT 
  (SELECT id FROM decor_categories WHERE slug = 'general_decor'),
  'Guest book',
  'Book for guest signatures and messages',
  'etsy',
  ARRAY[]::TEXT[],
  9,
  true,
  true
WHERE EXISTS (SELECT 1 FROM decor_categories WHERE slug = 'general_decor');

INSERT INTO decor_item_templates (category_id, item_name, description, default_sourcing, tradition_affinity, display_order, is_active, is_system_item)
SELECT 
  (SELECT id FROM decor_categories WHERE slug = 'general_decor'),
  'Candles',
  'Decorative candles for ambiance',
  'local_store',
  ARRAY[]::TEXT[],
  10,
  true,
  true
WHERE EXISTS (SELECT 1 FROM decor_categories WHERE slug = 'general_decor');

INSERT INTO decor_item_templates (category_id, item_name, description, default_sourcing, tradition_affinity, display_order, is_active, is_system_item)
SELECT 
  (SELECT id FROM decor_categories WHERE slug = 'general_decor'),
  'Mandap draping',
  'Draping fabric for mandap decoration',
  'vendor',
  ARRAY['sikh', 'hindu', 'punjabi']::TEXT[],
  11,
  true,
  true
WHERE EXISTS (SELECT 1 FROM decor_categories WHERE slug = 'general_decor');

INSERT INTO decor_item_templates (category_id, item_name, description, default_sourcing, tradition_affinity, display_order, is_active, is_system_item)
SELECT 
  (SELECT id FROM decor_categories WHERE slug = 'general_decor'),
  'Jago sticks',
  'Decorated sticks for Jaggo ceremony',
  'etsy',
  ARRAY['sikh', 'punjabi']::TEXT[],
  12,
  true,
  true
WHERE EXISTS (SELECT 1 FROM decor_categories WHERE slug = 'general_decor');

-- Florist list items
INSERT INTO decor_item_templates (category_id, item_name, description, default_sourcing, tradition_affinity, display_order, is_active, is_system_item)
SELECT 
  (SELECT id FROM decor_categories WHERE slug = 'florist_list'),
  'Palki Sahib flowers',
  'Floral decoration for Palki Sahib',
  'vendor',
  ARRAY['sikh']::TEXT[],
  1,
  true,
  true
WHERE EXISTS (SELECT 1 FROM decor_categories WHERE slug = 'florist_list');

INSERT INTO decor_item_templates (category_id, item_name, description, default_sourcing, tradition_affinity, display_order, is_active, is_system_item)
SELECT 
  (SELECT id FROM decor_categories WHERE slug = 'florist_list'),
  'Rumalla Sahib sets',
  'Floral Rumalla Sahib decoration',
  'vendor',
  ARRAY['sikh']::TEXT[],
  2,
  true,
  true
WHERE EXISTS (SELECT 1 FROM decor_categories WHERE slug = 'florist_list');

INSERT INTO decor_item_templates (category_id, item_name, description, default_sourcing, tradition_affinity, display_order, is_active, is_system_item)
SELECT 
  (SELECT id FROM decor_categories WHERE slug = 'florist_list'),
  'Bridal bouquet',
  'Flower bouquet for the bride',
  'vendor',
  ARRAY[]::TEXT[],
  3,
  true,
  true
WHERE EXISTS (SELECT 1 FROM decor_categories WHERE slug = 'florist_list');

INSERT INTO decor_item_templates (category_id, item_name, description, default_sourcing, tradition_affinity, display_order, is_active, is_system_item)
SELECT 
  (SELECT id FROM decor_categories WHERE slug = 'florist_list'),
  'Groom''s boutonniere',
  'Flower pin for the groom',
  'vendor',
  ARRAY[]::TEXT[],
  4,
  true,
  true
WHERE EXISTS (SELECT 1 FROM decor_categories WHERE slug = 'florist_list');

INSERT INTO decor_item_templates (category_id, item_name, description, default_sourcing, tradition_affinity, display_order, is_active, is_system_item)
SELECT 
  (SELECT id FROM decor_categories WHERE slug = 'florist_list'),
  'Mandap garlands',
  'Garlands for mandap decoration',
  'vendor',
  ARRAY['sikh', 'hindu', 'punjabi']::TEXT[],
  5,
  true,
  true
WHERE EXISTS (SELECT 1 FROM decor_categories WHERE slug = 'florist_list');

INSERT INTO decor_item_templates (category_id, item_name, description, default_sourcing, tradition_affinity, display_order, is_active, is_system_item)
SELECT 
  (SELECT id FROM decor_categories WHERE slug = 'florist_list'),
  'Table centerpiece flowers',
  'Floral arrangements for tables',
  'vendor',
  ARRAY[]::TEXT[],
  6,
  true,
  true
WHERE EXISTS (SELECT 1 FROM decor_categories WHERE slug = 'florist_list');

INSERT INTO decor_item_templates (category_id, item_name, description, default_sourcing, tradition_affinity, display_order, is_active, is_system_item)
SELECT 
  (SELECT id FROM decor_categories WHERE slug = 'florist_list'),
  'Flower girl petals',
  'Rose petals for flower girl',
  'vendor',
  ARRAY[]::TEXT[],
  7,
  true,
  true
WHERE EXISTS (SELECT 1 FROM decor_categories WHERE slug = 'florist_list');

INSERT INTO decor_item_templates (category_id, item_name, description, default_sourcing, tradition_affinity, display_order, is_active, is_system_item)
SELECT 
  (SELECT id FROM decor_categories WHERE slug = 'florist_list'),
  'Ceremony arch flowers',
  'Floral decoration for ceremony arch',
  'vendor',
  ARRAY[]::TEXT[],
  8,
  true,
  true
WHERE EXISTS (SELECT 1 FROM decor_categories WHERE slug = 'florist_list');

INSERT INTO decor_item_templates (category_id, item_name, description, default_sourcing, tradition_affinity, display_order, is_active, is_system_item)
SELECT 
  (SELECT id FROM decor_categories WHERE slug = 'florist_list'),
  'Hair flowers',
  'Fresh flowers for bridal hair',
  'vendor',
  ARRAY[]::TEXT[],
  9,
  true,
  true
WHERE EXISTS (SELECT 1 FROM decor_categories WHERE slug = 'florist_list');

INSERT INTO decor_item_templates (category_id, item_name, description, default_sourcing, tradition_affinity, display_order, is_active, is_system_item)
SELECT 
  (SELECT id FROM decor_categories WHERE slug = 'florist_list'),
  'Sehra flowers (groom)',
  'Floral veil for groom',
  'vendor',
  ARRAY['sikh', 'hindu', 'punjabi']::TEXT[],
  10,
  true,
  true
WHERE EXISTS (SELECT 1 FROM decor_categories WHERE slug = 'florist_list');

INSERT INTO decor_item_templates (category_id, item_name, description, default_sourcing, tradition_affinity, display_order, is_active, is_system_item)
SELECT 
  (SELECT id FROM decor_categories WHERE slug = 'florist_list'),
  'Varmala/Jai Mala',
  'Exchange garlands for bride and groom',
  'vendor',
  ARRAY['sikh', 'hindu', 'punjabi']::TEXT[],
  11,
  true,
  true
WHERE EXISTS (SELECT 1 FROM decor_categories WHERE slug = 'florist_list');

INSERT INTO decor_item_templates (category_id, item_name, description, default_sourcing, tradition_affinity, display_order, is_active, is_system_item)
SELECT 
  (SELECT id FROM decor_categories WHERE slug = 'florist_list'),
  'Doli flowers',
  'Floral decoration for bride''s departure',
  'vendor',
  ARRAY['sikh', 'punjabi']::TEXT[],
  12,
  true,
  true
WHERE EXISTS (SELECT 1 FROM decor_categories WHERE slug = 'florist_list');

-- ============================================================================
-- HONEYMOON BUDGET CATEGORIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS honeymoon_budget_categories (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  icon_name TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_system_category BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Seed honeymoon budget categories
INSERT INTO honeymoon_budget_categories (slug, display_name, description, icon_name, display_order, is_active, is_system_category)
VALUES
  ('flights', 'Flights', 'Airline tickets and flight-related expenses', 'plane', 1, true, true),
  ('accommodation', 'Accommodation', 'Hotels, resorts, and lodging', 'hotel', 2, true, true),
  ('activities', 'Activities & Excursions', 'Tours, attractions, and activities', 'compass', 3, true, true),
  ('food', 'Food & Dining', 'Restaurants, meals, and dining experiences', 'utensils', 4, true, true),
  ('transportation', 'Local Transportation', 'Taxis, car rentals, and local transport', 'car', 5, true, true),
  ('shopping', 'Shopping & Souvenirs', 'Gifts, souvenirs, and shopping', 'shopping-bag', 6, true, true),
  ('insurance', 'Travel Insurance', 'Travel and health insurance', 'shield', 7, true, true),
  ('other', 'Other', 'Miscellaneous honeymoon expenses', 'more-horizontal', 8, true, true)
ON CONFLICT (slug) DO NOTHING;
