-- Create profiles table if it doesn't exist
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

-- Add comments for documentation
COMMENT ON TABLE public.profiles IS 'User profile information';
COMMENT ON COLUMN public.profiles.id IS 'User ID from auth.users';
COMMENT ON COLUMN public.profiles.full_name IS 'User''s full name';
COMMENT ON COLUMN public.profiles.email IS 'User''s email address for partner lookup';
COMMENT ON COLUMN public.profiles.username IS 'Unique username for the user';
COMMENT ON COLUMN public.profiles.avatar_url IS 'URL to user''s avatar image';
COMMENT ON COLUMN public.profiles.website IS 'User''s website URL';
COMMENT ON COLUMN public.profiles.age IS 'User''s age in years';
COMMENT ON COLUMN public.profiles.relationship IS 'Relationship status: Complicated, long distance, Live-i, Engaged married';
COMMENT ON COLUMN public.profiles.location IS 'User''s current location';
COMMENT ON COLUMN public.profiles.updated_at IS 'Last updated timestamp';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_full_name ON public.profiles(full_name);
