-- Fix search_path for generate_referral_code function
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := upper(substring(md5(random()::text || NEW.id::text) from 1 for 8));
  END IF;
  RETURN NEW;
END;
$$;