-- Migration script to change from SERIAL to UUID for user IDs
-- Run this script after updating your schema file

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Note: This script is for legacy systems that had a separate users table.
-- In Supabase, user data is stored in auth.users table.
-- This script should be adapted to work with auth.users or may not be needed
-- if you're starting fresh with Supabase.

-- For modern Supabase setups, you should:
-- 1. Use auth.users for user authentication data
-- 2. Use public.profiles for additional user profile information
-- 3. Reference auth.users directly in foreign key relationships

-- The following steps are for reference only and may need to be adapted
-- for your specific Supabase setup:

-- Step 1: If you have a legacy users table, migrate data to auth.users
-- This would typically be done through Supabase's auth admin interface

-- Step 2: Update all foreign key constraints to reference auth.users
-- Example for couples table:
-- ALTER TABLE couples DROP CONSTRAINT IF EXISTS couples_partner1_id_fkey;
-- ALTER TABLE couples ADD CONSTRAINT couples_partner1_id_fkey 
--   FOREIGN KEY (partner1_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Repeat for all other tables that reference users...

-- Final verification query to check data integrity
-- You can run this after the migration to verify everything worked
SELECT 
    'auth.users' as table_name, 
    COUNT(*) as record_count 
FROM auth.users
UNION ALL
SELECT 
    'public.profiles' as table_name, 
    COUNT(*) as record_count 
FROM public.profiles
UNION ALL
SELECT 
    'couples' as table_name, 
    COUNT(*) as record_count 
FROM couples
UNION ALL
SELECT 
    'messages' as table_name, 
    COUNT(*) as record_count 
FROM messages
UNION ALL
SELECT 
    'feed_questions' as table_name, 
    COUNT(*) as record_count 
FROM feed_questions
UNION ALL
SELECT 
    'feed_replies' as table_name, 
    COUNT(*) as record_count 
FROM feed_replies
UNION ALL
SELECT 
    'shared_photos' as table_name, 
    COUNT(*) as record_count 
FROM shared_photos
UNION ALL
SELECT 
    'message_reactions' as table_name, 
    COUNT(*) as record_count 
FROM message_reactions;
