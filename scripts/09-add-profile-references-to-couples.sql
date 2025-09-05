-- Add direct profile references to couples table for better data consistency
ALTER TABLE couples ADD COLUMN IF NOT EXISTS partner1_profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE couples ADD COLUMN IF NOT EXISTS partner2_profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_couples_partner1_profile ON couples(partner1_profile_id);
CREATE INDEX IF NOT EXISTS idx_couples_partner2_profile ON couples(partner2_profile_id);

-- Add display preference option to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_preference TEXT DEFAULT 'full_name';
COMMENT ON COLUMN profiles.display_preference IS 'Display preference: full_name, username, full_name_username, or email';

-- Create function to sync couple profile references
CREATE OR REPLACE FUNCTION sync_couple_profiles()
RETURNS TRIGGER AS $$
BEGIN
    -- Update partner1 profile reference
    IF NEW.partner1_id IS NOT NULL THEN
        NEW.partner1_profile_id := (SELECT id FROM profiles WHERE id = NEW.partner1_id);
    END IF;
    
    -- Update partner2 profile reference  
    IF NEW.partner2_id IS NOT NULL THEN
        NEW.partner2_profile_id := (SELECT id FROM profiles WHERE id = NEW.partner2_id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic profile sync
DROP TRIGGER IF EXISTS update_couple_profiles ON couples;
CREATE TRIGGER update_couple_profiles
    BEFORE UPDATE ON couples
    FOR EACH ROW
    EXECUTE FUNCTION sync_couple_profiles();

-- Create function to update existing couples with profile references
CREATE OR REPLACE FUNCTION update_existing_couple_profiles()
RETURNS void AS $$
BEGIN
    -- Update existing couples that don't have profile references
    UPDATE couples 
    SET partner1_profile_id = p1.id,
        partner2_profile_id = p2.id
    FROM profiles p1, profiles p2
    WHERE couples.partner1_id = p1.id 
      AND couples.partner2_id = p2.id
      AND (couples.partner1_profile_id IS NULL OR couples.partner2_profile_id IS NULL);
END;
$$ LANGUAGE plpgsql;

-- Execute the function to update existing records
SELECT update_existing_couple_profiles();

-- Clean up the function
DROP FUNCTION update_existing_couple_profiles();

-- Add comments for documentation
COMMENT ON TABLE couples IS 'Couples table with direct profile references for better data consistency';
COMMENT ON COLUMN couples.partner1_profile_id IS 'Direct reference to partner1 profile record';
COMMENT ON COLUMN couples.partner2_profile_id IS 'Direct reference to partner2 profile record';
