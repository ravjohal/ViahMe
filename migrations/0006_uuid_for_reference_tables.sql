-- Migration 0006: Convert wedding_traditions and budget_bucket_categories from slug-as-ID to UUID
-- Executed: January 2026
-- This migration updates the id columns to use proper UUIDs while preserving the slug in the slug column

-- Step 1: Add temporary columns to store new UUIDs
ALTER TABLE wedding_traditions ADD COLUMN IF NOT EXISTS new_uuid VARCHAR;
ALTER TABLE budget_bucket_categories ADD COLUMN IF NOT EXISTS new_uuid VARCHAR;

-- Step 2: Generate UUIDs for all existing rows
UPDATE wedding_traditions SET new_uuid = gen_random_uuid()::text WHERE new_uuid IS NULL;
UPDATE budget_bucket_categories SET new_uuid = gen_random_uuid()::text WHERE new_uuid IS NULL;

-- Step 3: Drop FK constraint on wedding_sub_traditions to allow updates
ALTER TABLE wedding_sub_traditions DROP CONSTRAINT IF EXISTS wedding_sub_traditions_tradition_id_fkey;

-- Step 4: Update FK references in all child tables
UPDATE wedding_sub_traditions wst SET tradition_id = wt.new_uuid FROM wedding_traditions wt WHERE wst.tradition_id = wt.id;
UPDATE ceremony_types ct SET tradition_id = wt.new_uuid FROM wedding_traditions wt WHERE ct.tradition_id = wt.id;
UPDATE weddings w SET tradition_id = wt.new_uuid FROM wedding_traditions wt WHERE w.tradition_id = wt.id;
UPDATE expenses e SET bucket_category_id = bbc.new_uuid FROM budget_bucket_categories bbc WHERE e.bucket_category_id = bbc.id;
UPDATE budget_allocations ba SET bucket_category_id = bbc.new_uuid FROM budget_bucket_categories bbc WHERE ba.bucket_category_id = bbc.id;
UPDATE ceremony_budget_categories cbc SET budget_bucket_id = bbc.new_uuid FROM budget_bucket_categories bbc WHERE cbc.budget_bucket_id = bbc.id;
UPDATE event_cost_items eci SET budget_bucket_category_id = bbc.new_uuid FROM budget_bucket_categories bbc WHERE eci.budget_bucket_category_id = bbc.id;

-- Step 5: Now update the primary key id columns
UPDATE wedding_traditions SET id = new_uuid;
UPDATE budget_bucket_categories SET id = new_uuid;

-- Step 6: Drop temporary columns
ALTER TABLE wedding_traditions DROP COLUMN new_uuid;
ALTER TABLE budget_bucket_categories DROP COLUMN new_uuid;

-- Step 7: Re-add FK constraint
ALTER TABLE wedding_sub_traditions ADD CONSTRAINT wedding_sub_traditions_tradition_id_fkey 
FOREIGN KEY (tradition_id) REFERENCES wedding_traditions(id);

-- Step 8: Set default UUID generation for new rows
ALTER TABLE wedding_traditions ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE budget_bucket_categories ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
