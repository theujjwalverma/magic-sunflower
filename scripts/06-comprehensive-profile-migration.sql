-- Comprehensive profiles table migration
-- This script creates the complete profiles structure and handles all necessary setup

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

-- Function to automatically create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, username, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update profile metadata when user is updated
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles 
  SET 
    full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', profiles.full_name),
    email = COALESCE(NEW.email, profiles.email),
    username = COALESCE(NEW.raw_user_meta_data->>'username', profiles.username),
    updated_at = NOW()
  WHERE profiles.id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update profile when user is updated
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_update();

-- Grant necessary permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles_id_seq TO authenticated;
GRANT ALL ON idx_profiles_email TO authenticated;
GRANT ALL ON idx_profiles_username TO authenticated;
GRANT ALL ON idx_profiles_full_name TO authenticated;

-- Display completion message
SELECT 'Profiles table setup completed successfully' as message;
