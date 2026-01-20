-- Migration: Create metro_areas table for centralized city/location management

CREATE TABLE IF NOT EXISTS metro_areas (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR NOT NULL UNIQUE,
  value VARCHAR NOT NULL UNIQUE,
  label TEXT NOT NULL,
  state VARCHAR,
  country VARCHAR NOT NULL DEFAULT 'US',
  desi_population VARCHAR,
  has_vendor_coverage BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Seed default metro areas
INSERT INTO metro_areas (slug, value, label, state, country, desi_population, has_vendor_coverage, display_order) VALUES
  ('sf_bay_area', 'San Francisco Bay Area', 'San Francisco Bay Area', 'CA', 'US', 'high', true, 1),
  ('sacramento', 'Sacramento Metro', 'Sacramento Metro Area', 'CA', 'US', 'medium', true, 2),
  ('fresno', 'Fresno Metro', 'Fresno / Central Valley', 'CA', 'US', 'medium', true, 3),
  ('los_angeles', 'Los Angeles', 'Los Angeles Metro', 'CA', 'US', 'high', true, 4),
  ('nyc', 'New York City', 'New York City Metro', 'NY', 'US', 'high', true, 5),
  ('chicago', 'Chicago', 'Chicago Metro', 'IL', 'US', 'high', true, 6),
  ('houston', 'Houston', 'Houston Metro', 'TX', 'US', 'high', true, 7),
  ('dallas', 'Dallas-Fort Worth', 'Dallas-Fort Worth Metro', 'TX', 'US', 'high', true, 8),
  ('dc', 'Washington DC', 'Washington DC Metro', 'DC', 'US', 'high', true, 9),
  ('seattle', 'Seattle', 'Seattle Metro', 'WA', 'US', 'medium', true, 10),
  ('atlanta', 'Atlanta', 'Atlanta Metro', 'GA', 'US', 'medium', true, 11),
  ('philadelphia', 'Philadelphia', 'Philadelphia Metro', 'PA', 'US', 'medium', true, 12),
  ('boston', 'Boston', 'Boston Metro', 'MA', 'US', 'medium', true, 13),
  ('detroit', 'Detroit', 'Detroit Metro', 'MI', 'US', 'medium', true, 14),
  ('toronto', 'Toronto', 'Toronto (Canada)', NULL, 'CA', 'high', true, 15),
  ('vancouver', 'Vancouver', 'Vancouver (Canada)', NULL, 'CA', 'high', true, 16),
  ('other', 'Other', 'Other (Enter ZIP Code)', NULL, 'US', NULL, false, 99)
ON CONFLICT (slug) DO NOTHING;
