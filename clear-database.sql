-- Clear all feedback data from the database
-- This removes all votes and comments but keeps the table structure

-- Delete all feedback records
DELETE FROM feedback;

-- Reset any auto-increment sequences (if you have any)
-- ALTER SEQUENCE feedback_id_seq RESTART WITH 1;

-- Verify the table is empty
SELECT COUNT(*) as remaining_records FROM feedback; 