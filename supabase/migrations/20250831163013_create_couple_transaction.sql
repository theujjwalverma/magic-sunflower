CREATE OR REPLACE FUNCTION create_couple_transaction(
  p_partner1_id UUID,
  p_partner2_id UUID,
  p_couple_username TEXT
) 
RETURNS SETOF couples
LANGUAGE plpgsql
AS $$
DECLARE
  new_couple couples;
BEGIN
  -- Validate input parameters
  IF p_partner1_id = p_partner2_id THEN
    RAISE EXCEPTION 'Cannot create couple with same partner IDs';
  END IF;

  -- Check username uniqueness
  IF EXISTS (SELECT 1 FROM couples WHERE couple_username = p_couple_username) THEN
    RAISE EXCEPTION 'Couple username already exists';
  END IF;

  -- Start transaction
  BEGIN
    -- Insert new couple
    INSERT INTO couples (couple_username, partner1_id, partner2_id)
    VALUES (p_couple_username, p_partner1_id, p_partner2_id)
    RETURNING * INTO new_couple;

    -- Update partner profiles
    UPDATE profiles SET couple_id = new_couple.id WHERE id = p_partner1_id;
    UPDATE profiles SET couple_id = new_couple.id WHERE id = p_partner2_id;

    RETURN NEXT new_couple;
    
    EXCEPTION
      WHEN others THEN
        RAISE;
  END;
  
  RETURN;
END;
$$;
