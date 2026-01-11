-- Migration: Finalize UUID migration for ceremony_budget_categories
-- Make ceremonyTypeUuid the primary FK (NOT NULL) and deprecate ceremonyTypeId (nullable)

-- All 191 rows already have ceremony_type_uuid populated (verified via SQL query)
-- This migration enforces the UUID column as the canonical reference

-- Step 1: Make ceremony_type_uuid NOT NULL (it's now the primary FK)
ALTER TABLE ceremony_budget_categories ALTER COLUMN ceremony_type_uuid SET NOT NULL;

-- Step 2: Drop NOT NULL constraint from ceremony_type_id (deprecated slug column)
ALTER TABLE ceremony_budget_categories ALTER COLUMN ceremony_type_id DROP NOT NULL;
