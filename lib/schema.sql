-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table for user information
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    email TEXT UNIQUE,
    username TEXT UNIQUE,
    avatar_url TEXT,
    website TEXT,
    age INTEGER,
    relationship TEXT,
    location TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Couples table - now references auth.users directly with UUID
CREATE TABLE IF NOT EXISTS couples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_username VARCHAR(100) UNIQUE NOT NULL,
    partner1_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    partner2_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID REFERENCES couples(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text',
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Message reactions table
CREATE TABLE IF NOT EXISTS message_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    emoji VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Feed questions table
CREATE TABLE IF NOT EXISTS feed_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID REFERENCES couples(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Feed replies table
CREATE TABLE IF NOT EXISTS feed_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID REFERENCES feed_questions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    reply TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Feed reactions table
CREATE TABLE IF NOT EXISTS feed_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID REFERENCES feed_questions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    emoji VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RLS Policies for feed_reactions
ALTER TABLE feed_reactions ENABLE ROW LEVEL SECURITY;

-- Users can read reactions on posts in their couple
CREATE POLICY "Users can read reactions in their couple" ON feed_reactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM feed_questions fq
            JOIN couples c ON fq.couple_id = c.id
            WHERE fq.id = feed_reactions.question_id
            AND (c.partner1_id = auth.uid() OR c.partner2_id = auth.uid())
        )
    );

-- Users can insert reactions on posts in their couple
CREATE POLICY "Users can insert reactions in their couple" ON feed_reactions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM feed_questions fq
            JOIN couples c ON fq.couple_id = c.id
            WHERE fq.id = feed_reactions.question_id
            AND (c.partner1_id = auth.uid() OR c.partner2_id = auth.uid())
        )
        AND auth.uid() = user_id
    );

-- Users can delete their own reactions
CREATE POLICY "Users can delete their own reactions" ON feed_reactions
    FOR DELETE USING (auth.uid() = user_id);

-- Shared photos table
CREATE TABLE IF NOT EXISTS shared_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID REFERENCES couples(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    caption TEXT,
    is_highlighted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_full_name ON public.profiles(full_name);
CREATE INDEX IF NOT EXISTS idx_couples_partner1 ON couples(partner1_id);
CREATE INDEX IF NOT EXISTS idx_couples_partner2 ON couples(partner2_id);
CREATE INDEX IF NOT EXISTS idx_messages_couple ON messages(couple_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_feed_questions_couple ON feed_questions(couple_id);
CREATE INDEX IF NOT EXISTS idx_shared_photos_couple ON shared_photos(couple_id);
