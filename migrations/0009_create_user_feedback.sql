-- Create user feedback table for bug reports and feature requests
CREATE TABLE IF NOT EXISTS user_feedback (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR,
  user_email TEXT,
  feedback_type TEXT NOT NULL DEFAULT 'bug',
  description TEXT NOT NULL,
  page_url TEXT NOT NULL,
  screenshot_url TEXT,
  device_info JSONB,
  status TEXT NOT NULL DEFAULT 'new',
  admin_notes TEXT,
  reviewed_by VARCHAR,
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create index for status filtering
CREATE INDEX IF NOT EXISTS user_feedback_status_idx ON user_feedback(status);
CREATE INDEX IF NOT EXISTS user_feedback_created_at_idx ON user_feedback(created_at DESC);
