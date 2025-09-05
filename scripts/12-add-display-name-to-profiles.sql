-- Add display_name column if not exists
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Backfill display_name from full_name
UPDATE profiles 
SET display_name = full_name 
WHERE display_name IS NULL;

-- Create index on display_name
CREATE INDEX IF NOT EXISTS profiles_display_name_idx ON profiles (display_name);
