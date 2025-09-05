-- Add display_preference column to profiles table if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_preference TEXT DEFAULT 'full_name';

-- Add comment for documentation
COMMENT ON COLUMN profiles.display_preference IS 'Display preference: full_name, username, full_name_username, or email';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_display_preference ON profiles(display_preference);

-- Display completion message
SELECT 'Added display_preference column to profiles table successfully' as message;
