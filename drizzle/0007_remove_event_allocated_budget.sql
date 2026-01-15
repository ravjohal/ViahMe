-- Migration: Remove allocatedBudget from events table
-- This field is deprecated - ceremony budgets are now stored in budget_allocations table
-- Run date: 2026-01-15

-- Step 1: Backfill any existing event.allocatedBudget values into budget_allocations
-- Only insert if there's no existing ceremony-level allocation for this event
-- Uses dynamic lookup for bucket_category_id to be environment-independent
INSERT INTO budget_allocations (id, wedding_id, bucket, ceremony_id, allocated_amount, is_manual_override, created_at, bucket_category_id)
SELECT 
    gen_random_uuid(),
    e.wedding_id,
    'other',  -- Ceremony-level totals use 'other' bucket
    e.id,     -- ceremonyId = event id
    e.allocated_budget::text,
    true,     -- Mark as manual override since user set this
    NOW(),
    (SELECT id FROM budget_bucket_categories WHERE slug = 'other' LIMIT 1)
FROM events e
WHERE e.allocated_budget IS NOT NULL 
  AND e.allocated_budget > 0
  AND EXISTS (SELECT 1 FROM budget_bucket_categories WHERE slug = 'other')  -- Only run if other bucket exists
  AND NOT EXISTS (
    -- Only insert if no ceremony-level allocation already exists
    SELECT 1 FROM budget_allocations ba 
    WHERE ba.ceremony_id = e.id 
      AND ba.line_item_label IS NULL
  );

-- Step 2: Drop the column from events table
ALTER TABLE events DROP COLUMN IF EXISTS allocated_budget;
