-- Fix profiles table schema - ensure all required columns exist
-- This script will add missing columns and ensure proper constraints

-- First, check if profiles table exists and add missing columns
DO $$
BEGIN
    -- Check if profiles table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        -- Add email column if it doesn't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'email') THEN
            ALTER TABLE public.profiles ADD COLUMN email TEXT;
            RAISE NOTICE 'Added email column to profiles table';
        END IF;
        
        -- Add username column if it doesn't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'username') THEN
            ALTER TABLE public.profiles ADD COLUMN username TEXT;
            RAISE NOTICE 'Added username column to profiles table';
        END IF;
        
        -- Add avatar_url column if it doesn't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'avatar_url') THEN
            ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
            RAISE NOTICE 'Added avatar_url column to profiles table';
        END IF;
        
        -- Add website column if it doesn't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'website') THEN
            ALTER TABLE public.profiles ADD COLUMN website TEXT;
            RAISE NOTICE 'Added website column to profiles table';
        END IF;
        
        -- Add updated_at column if it doesn't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'updated_at') THEN
            ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
            RAISE NOTICE 'Added updated_at column to profiles table';
        END IF;
        
        -- Add unique constraint to email if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_email_key') THEN
            ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_key UNIQUE (email);
            RAISE NOTICE 'Added unique constraint to email column';
        END IF;
        
        -- Add unique constraint to username if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_username_key') THEN
            ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_key UNIQUE (username);
            RAISE NOTICE 'Added unique constraint to username column';
        END IF;
        
        -- Create indexes if they don't exist
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_profiles_email') THEN
            CREATE INDEX idx_profiles_email ON public.profiles(email);
            RAISE NOTICE 'Created index on email column';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_profiles_username') THEN
            CREATE INDEX idx_profiles_username ON public.profiles(username);
            RAISE NOTICE 'Created index on username column';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_profiles_full_name') THEN
            CREATE INDEX idx_profiles_full_name ON public.profiles(full_name);
            RAISE NOTICE 'Created index on full_name column';
        END IF;
        
    ELSE
        -- Create profiles table if it doesn't exist
        CREATE TABLE public.profiles (
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
        
        -- Create indexes
        CREATE INDEX idx_profiles_email ON public.profiles(email);
        CREATE INDEX idx_profiles_username ON public.profiles(username);
        CREATE INDEX idx_profiles_full_name ON public.profiles(full_name);
        
        RAISE NOTICE 'Created profiles table with all required columns';
    END IF;
    
    -- Add comments for documentation
    EXECUTE 'COMMENT ON TABLE public.profiles IS ''User profile information''';
    EXECUTE 'COMMENT ON COLUMN public.profiles.id IS ''User ID from auth.users''';
    EXECUTE 'COMMENT ON COLUMN public.profiles.full_name IS ''User''s full name''';
    EXECUTE 'COMMENT ON COLUMN public.profiles.email IS ''User''s email address for partner lookup''';
    EXECUTE 'COMMENT ON COLUMN public.profiles.username IS ''Unique username for the user''';
    EXECUTE 'COMMENT ON COLUMN public.profiles.avatar_url IS ''URL to user''s avatar image''';
    EXECUTE 'COMMENT ON COLUMN public.profiles.website IS ''User''s website URL''';
    EXECUTE 'COMMENT ON COLUMN public.profiles.age IS ''User''s age in years''';
    EXECUTE 'COMMENT ON COLUMN public.profiles.relationship IS ''Relationship status: Complicated, long distance, Live-i, Engaged married''';
    EXECUTE 'COMMENT ON COLUMN public.profiles.location IS ''User''s current location''';
    EXECUTE 'COMMENT ON COLUMN public.profiles.updated_at IS ''Last updated timestamp''';
    
    RAISE NOTICE 'Profiles table schema is now properly configured';
END $$;

-- Grant necessary permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles_id_seq TO authenticated;

-- Display completion message
SELECT 'Profiles table schema fix completed successfully' as message;
