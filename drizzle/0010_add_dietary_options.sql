-- Migration: Add dietary_options table
-- This migrates the hardcoded DIETARY_OPTIONS array to a database table

CREATE TABLE IF NOT EXISTS "dietary_options" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "slug" text NOT NULL UNIQUE,
  "display_name" text NOT NULL,
  "description" text,
  "icon_name" text,
  "tradition_affinity" text[] NOT NULL DEFAULT ARRAY[]::text[],
  "display_order" integer NOT NULL DEFAULT 0,
  "is_active" boolean NOT NULL DEFAULT true,
  "is_system_option" boolean NOT NULL DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

-- Seed initial dietary options (matching DIETARY_OPTIONS in schema.ts)
INSERT INTO "dietary_options" ("slug", "display_name", "description", "icon_name", "tradition_affinity", "display_order", "is_active", "is_system_option") VALUES
  ('none', 'No dietary restrictions', 'Standard menu is fine', 'utensils', ARRAY[]::text[], 1, true, true),
  ('strict_vegetarian', 'Strict Vegetarian', 'No meat, fish, or eggs', 'leaf', ARRAY['hindu', 'jain', 'gujarati']::text[], 2, true, true),
  ('jain', 'Jain', 'No root vegetables, no eggs', 'sparkles', ARRAY['jain', 'gujarati']::text[], 3, true, true),
  ('swaminarayan', 'Swaminarayan', 'Strictly vegetarian, no onion/garlic', 'sparkles', ARRAY['hindu', 'gujarati']::text[], 4, true, true),
  ('eggless', 'Eggless Vegetarian', 'Vegetarian, no eggs', 'egg-off', ARRAY['hindu']::text[], 5, true, true),
  ('halal', 'Halal', 'Halal meat only', 'check-circle', ARRAY['muslim']::text[], 6, true, true),
  ('kosher', 'Kosher', 'Kosher dietary laws', 'star', ARRAY[]::text[], 7, true, true),
  ('vegan', 'Vegan', 'No animal products', 'vegan', ARRAY[]::text[], 8, true, true),
  ('gluten_free', 'Gluten-Free', 'No gluten-containing foods', 'wheat-off', ARRAY[]::text[], 9, true, true),
  ('lactose_intolerant', 'Lactose Intolerant', 'No dairy products', 'milk-off', ARRAY[]::text[], 10, true, true),
  ('nut_allergy', 'Nut Allergy', 'No nuts or nut products', 'alert-triangle', ARRAY[]::text[], 11, true, true),
  ('other', 'Other', 'Other restrictions, please specify in notes', 'more-horizontal', ARRAY[]::text[], 12, true, true)
ON CONFLICT (slug) DO NOTHING;
