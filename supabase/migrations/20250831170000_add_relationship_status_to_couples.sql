-- Add relationship_status column to couples table
ALTER TABLE couples 
ADD COLUMN IF NOT EXISTS relationship_status VARCHAR(20) NOT NULL 
CHECK (relationship_status IN ('Talking', 'Complicated', 'Long Distance', 'Dating', 'Live in', 'Engaged', 'Married'));

-- Add comment to describe the column
COMMENT ON COLUMN couples.relationship_status IS 'Relationship status of the couple: Talking, Complicated, Long Distance, Dating, Live in, Engaged, Married';
