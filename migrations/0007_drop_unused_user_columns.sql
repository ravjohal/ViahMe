-- Migration: Drop unused username and password columns from users table
-- These fields were never used; authentication uses email + passwordHash

ALTER TABLE users DROP COLUMN IF EXISTS username;
ALTER TABLE users DROP COLUMN IF EXISTS password;
