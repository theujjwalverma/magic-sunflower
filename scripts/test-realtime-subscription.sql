-- Test script to insert a new feed question to test realtime subscription
-- Run this with the couple ID: a25e3b6c-bf28-480e-b4e6-7d62dc411887

INSERT INTO feed_questions (
  question, 
  created_by, 
  couple_id
) VALUES (
  '{"textContent":"Test realtime subscription from SQL script","embedUrls":[]}', 
  'test-user-id', 
  'a25e3b6c-bf28-480e-b4e6-7d62dc411887'
) RETURNING *;
