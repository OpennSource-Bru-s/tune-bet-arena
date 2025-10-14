-- Add constraint to prevent negative credits
ALTER TABLE profiles 
ADD CONSTRAINT credits_non_negative 
CHECK (credits >= 0);

-- Create atomic deduct function that checks and deducts credits in one operation
CREATE OR REPLACE FUNCTION public.deduct_stake(p_user_id UUID, p_amount INT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Atomically update credits only if user has enough
  -- Returns true if successful, false if insufficient credits
  UPDATE profiles 
  SET credits = credits - p_amount
  WHERE id = p_user_id AND credits >= p_amount;
  
  RETURN FOUND;
END;
$$;