-- Migration: Finalize UUID columns across all tables
-- This migration makes UUID FK columns NOT NULL and slug columns nullable

-- ============================================================================
-- WEDDINGS TABLE
-- ============================================================================
-- Make traditionId (UUID FK) NOT NULL - all 81 rows already have values
ALTER TABLE weddings ALTER COLUMN tradition_id SET NOT NULL;
-- Keep tradition (slug) as NOT NULL for now since it's used extensively in app logic

-- ============================================================================
-- EVENTS TABLE
-- ============================================================================
-- Make ceremonyTypeUuid (UUID FK) NOT NULL - all 405 rows already have values
ALTER TABLE events ALTER COLUMN ceremony_type_uuid SET NOT NULL;
-- Make ceremonyTypeId (legacy slug) nullable
ALTER TABLE events ALTER COLUMN ceremony_type_id DROP NOT NULL;

-- ============================================================================
-- EXPENSES TABLE
-- ============================================================================
-- Make bucketCategoryId (UUID FK) NOT NULL - all 5 rows already have values
ALTER TABLE expenses ALTER COLUMN bucket_category_id SET NOT NULL;
-- Keep parentCategory as NOT NULL for now since it's used in queries

-- ============================================================================
-- BUDGET_ALLOCATIONS TABLE
-- ============================================================================
-- Make bucketCategoryId (UUID FK) NOT NULL - all 47 rows already have values
ALTER TABLE budget_allocations ALTER COLUMN bucket_category_id SET NOT NULL;
-- Keep bucket (slug) as NOT NULL for backward compatibility

-- ============================================================================
-- CEREMONY_TYPES TABLE (already has traditionId populated)
-- ============================================================================
-- Make traditionId (UUID FK) NOT NULL - all 51 rows already have values
ALTER TABLE ceremony_types ALTER COLUMN tradition_id SET NOT NULL;
-- Keep tradition (slug) as NOT NULL for backward compatibility
