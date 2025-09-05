-- Add email column to profiles table for partner lookup
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Add unique constraint to email column
ALTER TABLE public.profiles 
ADD CONSTRAINT unique_email UNIQUE (email);

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.email IS 'User''s email address for partner lookup';
