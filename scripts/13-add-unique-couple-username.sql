-- Add unique constraint to couple_username in couples table
ALTER TABLE couples
ADD CONSTRAINT unique_couple_username UNIQUE (couple_username);
