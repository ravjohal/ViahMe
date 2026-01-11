-- Migration 0005: Rename UUID columns to xxx_id naming convention
-- This migration drops deprecated slug columns and renames UUID columns

-- Step 1: Drop legacy slug columns (deprecated, all data migrated to UUID columns)
ALTER TABLE events DROP COLUMN IF EXISTS ceremony_type_id;
ALTER TABLE ceremony_budget_categories DROP COLUMN IF EXISTS ceremony_type_id;

-- Step 2: Rename UUID columns to standard xxx_id naming
ALTER TABLE events RENAME COLUMN ceremony_type_uuid TO ceremony_type_id;
ALTER TABLE ceremony_budget_categories RENAME COLUMN ceremony_type_uuid TO ceremony_type_id;

-- Step 3: Verify the changes
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'events' AND column_name LIKE '%ceremony%';
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'ceremony_budget_categories' AND column_name LIKE '%ceremony%';
