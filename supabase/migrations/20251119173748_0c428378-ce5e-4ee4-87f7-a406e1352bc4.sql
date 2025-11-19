-- Add field to track last free credit claim
ALTER TABLE public.profiles 
ADD COLUMN last_free_credit_at TIMESTAMP WITH TIME ZONE;

-- Create function to claim free credits (once per day if at 0 credits)
CREATE OR REPLACE FUNCTION public.claim_free_credits()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_credits INT;
  v_last_claim TIMESTAMP WITH TIME ZONE;
  v_can_claim BOOLEAN;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Not authenticated');
  END IF;
  
  -- Get current credits and last claim time
  SELECT credits, last_free_credit_at 
  INTO v_credits, v_last_claim
  FROM profiles 
  WHERE id = v_user_id;
  
  -- Check if user has 0 credits
  IF v_credits > 0 THEN
    RETURN jsonb_build_object('success', false, 'message', 'You still have credits available');
  END IF;
  
  -- Check if 24 hours have passed since last claim
  v_can_claim := v_last_claim IS NULL OR (now() - v_last_claim) >= INTERVAL '24 hours';
  
  IF NOT v_can_claim THEN
    RETURN jsonb_build_object(
      'success', false, 
      'message', 'Free credits already claimed today. Try again tomorrow!',
      'next_claim_at', v_last_claim + INTERVAL '24 hours'
    );
  END IF;
  
  -- Award free credits
  UPDATE profiles 
  SET 
    credits = 250,
    last_free_credit_at = now()
  WHERE id = v_user_id;
  
  -- Create transaction record
  INSERT INTO transactions (user_id, amount, type, description)
  VALUES (v_user_id, 250, 'credit', 'Daily free credits');
  
  RETURN jsonb_build_object(
    'success', true, 
    'message', '250 free credits claimed!',
    'new_balance', 250
  );
END;
$$;