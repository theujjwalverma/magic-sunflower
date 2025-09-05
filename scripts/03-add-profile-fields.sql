-- Add new columns to profiles table for extended profile information
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS age INTEGER,
ADD COLUMN IF NOT EXISTS relationship TEXT,
ADD COLUMN IF NOT EXISTS location TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.full_name IS 'User''s full name';
COMMENT ON COLUMN public.profiles.age IS 'User''s age in years';
COMMENT ON COLUMN public.profiles.relationship IS 'Relationship status: Complicated, long distance, Live-i, Engaged married';
COMMENT ON COLUMN public.profiles.location IS 'User''s current location';
