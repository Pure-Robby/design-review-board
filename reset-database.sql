-- Completely reset the feedback table
-- This drops the table and recreates it from scratch

-- Drop the existing table
DROP TABLE IF EXISTS feedback;

-- Recreate the table with the original structure
CREATE TABLE feedback (
  id BIGSERIAL PRIMARY KEY,
  design_id TEXT NOT NULL,
  vote_type TEXT CHECK (vote_type IN ('like', 'dislike')),
  comment_text TEXT,
  username TEXT,
  user_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_feedback_design_id ON feedback(design_id);
CREATE INDEX idx_feedback_user_id ON feedback(user_id);
CREATE INDEX idx_feedback_created_at ON feedback(created_at);

-- Verify the table is recreated
SELECT COUNT(*) as record_count FROM feedback; 