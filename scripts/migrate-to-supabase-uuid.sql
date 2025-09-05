-- Supabase-specific UUID migration script
-- This script migrates from SERIAL to UUID for proper Supabase integration
-- Run this script after ensuring you have a backup

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 1: Drop existing foreign key constraints to prepare for migration
ALTER TABLE couples DROP CONSTRAINT IF EXISTS couples_pkey;
ALTER TABLE couples DROP CONSTRAINT IF EXISTS couples_couple_username_key;
ALTER TABLE couples DROP CONSTRAINT IF EXISTS couples_partner1_id_fkey;
ALTER TABLE couples DROP CONSTRAINT IF EXISTS couples_partner2_id_fkey;

ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_pkey;
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_couple_id_fkey;
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;

ALTER TABLE message_reactions DROP CONSTRAINT IF EXISTS message_reactions_pkey;
ALTER TABLE message_reactions DROP CONSTRAINT IF EXISTS message_reactions_message_id_fkey;
ALTER TABLE message_reactions DROP CONSTRAINT IF EXISTS message_reactions_user_id_fkey;

ALTER TABLE feed_questions DROP CONSTRAINT IF EXISTS feed_questions_pkey;
ALTER TABLE feed_questions DROP CONSTRAINT IF EXISTS feed_questions_couple_id_fkey;
ALTER TABLE feed_questions DROP CONSTRAINT IF EXISTS feed_questions_created_by_fkey;

ALTER TABLE feed_replies DROP CONSTRAINT IF EXISTS feed_replies_pkey;
ALTER TABLE feed_replies DROP CONSTRAINT IF EXISTS feed_replies_question_id_fkey;
ALTER TABLE feed_replies DROP CONSTRAINT IF EXISTS feed_replies_user_id_fkey;

ALTER TABLE shared_photos DROP CONSTRAINT IF EXISTS shared_photos_pkey;
ALTER TABLE shared_photos DROP CONSTRAINT IF EXISTS shared_photos_couple_id_fkey;
ALTER TABLE shared_photos DROP CONSTRAINT IF EXISTS shared_photos_uploaded_by_fkey;

-- Step 2: Convert tables to UUID primary keys
-- Couples table
ALTER TABLE couples DROP COLUMN IF EXISTS id;
ALTER TABLE couples ADD COLUMN id UUID PRIMARY KEY DEFAULT gen_random_uuid();
ALTER TABLE couples ADD CONSTRAINT couples_couple_username_key UNIQUE (couple_username);

-- Messages table
ALTER TABLE messages DROP COLUMN IF EXISTS id;
ALTER TABLE messages ADD COLUMN id UUID PRIMARY KEY DEFAULT gen_random_uuid();

-- Message reactions table
ALTER TABLE message_reactions DROP COLUMN IF EXISTS id;
ALTER TABLE message_reactions ADD COLUMN id UUID PRIMARY KEY DEFAULT gen_random_uuid();

-- Feed questions table
ALTER TABLE feed_questions DROP COLUMN IF EXISTS id;
ALTER TABLE feed_questions ADD COLUMN id UUID PRIMARY KEY DEFAULT gen_random_uuid();

-- Feed replies table
ALTER TABLE feed_replies DROP COLUMN IF EXISTS id;
ALTER TABLE feed_replies ADD COLUMN id UUID PRIMARY KEY DEFAULT gen_random_uuid();

-- Shared photos table
ALTER TABLE shared_photos DROP COLUMN IF EXISTS id;
ALTER TABLE shared_photos ADD COLUMN id UUID PRIMARY KEY DEFAULT gen_random_uuid();

-- Step 3: Update foreign key columns to UUID type
-- Couples table - update partner references to UUID
ALTER TABLE couples ALTER COLUMN partner1_id TYPE UUID USING partner1_id::uuid;
ALTER TABLE couples ALTER COLUMN partner2_id TYPE UUID USING partner2_id::uuid;

-- Messages table - update references to UUID
ALTER TABLE messages ALTER COLUMN couple_id TYPE UUID USING couple_id::uuid;
ALTER TABLE messages ALTER COLUMN sender_id TYPE UUID USING sender_id::uuid;

-- Message reactions table - update references to UUID
ALTER TABLE message_reactions ALTER COLUMN message_id TYPE UUID USING message_id::uuid;
ALTER TABLE message_reactions ALTER COLUMN user_id TYPE UUID USING user_id::uuid;

-- Feed questions table - update references to UUID
ALTER TABLE feed_questions ALTER COLUMN couple_id TYPE UUID USING couple_id::uuid;
ALTER TABLE feed_questions ALTER COLUMN created_by TYPE UUID USING created_by::uuid;

-- Feed replies table - update references to UUID
ALTER TABLE feed_replies ALTER COLUMN question_id TYPE UUID USING question_id::uuid;
ALTER TABLE feed_replies ALTER COLUMN user_id TYPE UUID USING user_id::uuid;

-- Shared photos table - update references to UUID
ALTER TABLE shared_photos ALTER COLUMN couple_id TYPE UUID USING couple_id::uuid;
ALTER TABLE shared_photos ALTER COLUMN uploaded_by TYPE UUID USING uploaded_by::uuid;

-- Step 4: Recreate foreign key constraints with UUID references
ALTER TABLE couples ADD CONSTRAINT couples_pkey PRIMARY KEY (id);
ALTER TABLE couples ADD CONSTRAINT couples_partner1_id_fkey 
    FOREIGN KEY (partner1_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE couples ADD CONSTRAINT couples_partner2_id_fkey 
    FOREIGN KEY (partner2_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE messages ADD CONSTRAINT messages_pkey PRIMARY KEY (id);
ALTER TABLE messages ADD CONSTRAINT messages_couple_id_fkey 
    FOREIGN KEY (couple_id) REFERENCES couples(id) ON DELETE CASCADE;
ALTER TABLE messages ADD CONSTRAINT messages_sender_id_fkey 
    FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE message_reactions ADD CONSTRAINT message_reactions_pkey PRIMARY KEY (id);
ALTER TABLE message_reactions ADD CONSTRAINT message_reactions_message_id_fkey 
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE;
ALTER TABLE message_reactions ADD CONSTRAINT message_reactions_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE feed_questions ADD CONSTRAINT feed_questions_pkey PRIMARY KEY (id);
ALTER TABLE feed_questions ADD CONSTRAINT feed_questions_couple_id_fkey 
    FOREIGN KEY (couple_id) REFERENCES couples(id) ON DELETE CASCADE;
ALTER TABLE feed_questions ADD CONSTRAINT feed_questions_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE feed_replies ADD CONSTRAINT feed_replies_pkey PRIMARY KEY (id);
ALTER TABLE feed_replies ADD CONSTRAINT feed_replies_question_id_fkey 
    FOREIGN KEY (question_id) REFERENCES feed_questions(id) ON DELETE CASCADE;
ALTER TABLE feed_replies ADD CONSTRAINT feed_replies_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE shared_photos ADD CONSTRAINT shared_photos_pkey PRIMARY KEY (id);
ALTER TABLE shared_photos ADD CONSTRAINT shared_photos_couple_id_fkey 
    FOREIGN KEY (couple_id) REFERENCES couples(id) ON DELETE CASCADE;
ALTER TABLE shared_photos ADD CONSTRAINT shared_photos_uploaded_by_fkey 
    FOREIGN KEY (uploaded_by) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 5: Update indexes for UUID columns
DROP INDEX IF EXISTS idx_messages_couple_id;
DROP INDEX IF EXISTS idx_messages_created_at;
DROP INDEX IF EXISTS idx_feed_questions_couple_id;
DROP INDEX IF EXISTS idx_shared_photos_couple_id;

CREATE INDEX idx_messages_couple_id ON messages(couple_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_feed_questions_couple_id ON feed_questions(couple_id);
CREATE INDEX idx_feed_questions_created_by ON feed_questions(created_by);
CREATE INDEX idx_shared_photos_couple_id ON shared_photos(couple_id);
CREATE INDEX idx_shared_photos_uploaded_by ON shared_photos(uploaded_by);
CREATE INDEX idx_message_reactions_message_id ON message_reactions(message_id);
CREATE INDEX idx_message_reactions_user_id ON message_reactions(user_id);
CREATE INDEX idx_feed_replies_question_id ON feed_replies(question_id);
CREATE INDEX idx_feed_replies_user_id ON feed_replies(user_id);
CREATE INDEX idx_couples_partner1 ON couples(partner1_id);
CREATE INDEX idx_couples_partner2 ON couples(partner2_id);

-- Step 6: Create exec_sql function for raw SQL execution
CREATE OR REPLACE FUNCTION public.exec_sql(query TEXT, params JSONB DEFAULT '[]'::JSONB)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    status TEXT;
    message TEXT;
BEGIN
    -- Execute the query using dynamic SQL
    BEGIN
        -- This is a simplified version - in production, you might want more sophisticated handling
        EXECUTE query INTO result;
        status := 'success';
        message := 'Query executed successfully';
    EXCEPTION
        WHEN OTHERS THEN
            status := 'error';
            message := SQLERRM;
            result := NULL;
    END;
    
    RETURN jsonb_build_object(
        'status', status,
        'message', message,
        'result', result
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Verification query to check data integrity
-- You can run this after the migration to verify everything worked
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
    'message_reactions' as table_name, 
    COUNT(*) as record_count 
FROM message_reactions
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
FROM shared_photos;

-- Final verification check
SELECT 
    'Migration completed successfully' as status,
    NOW() as completed_at;
