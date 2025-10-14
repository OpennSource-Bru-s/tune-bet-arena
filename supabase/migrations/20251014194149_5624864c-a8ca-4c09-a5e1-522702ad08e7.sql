-- Fix profiles table public exposure
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Create secure game completion function to prevent credit manipulation
CREATE OR REPLACE FUNCTION public.complete_game(p_game_id UUID, p_winner_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stake INT;
  v_loser_id UUID;
  v_game_status game_status;
BEGIN
  -- Get stake and validate game state
  SELECT stake_amount, status INTO v_stake, v_game_status
  FROM games 
  WHERE id = p_game_id;
  
  IF v_stake IS NULL THEN
    RAISE EXCEPTION 'Game not found';
  END IF;
  
  IF v_game_status != 'in_progress' THEN
    RAISE EXCEPTION 'Game is not in progress';
  END IF;
  
  -- Verify winner is a participant
  IF NOT EXISTS (
    SELECT 1 FROM game_participants 
    WHERE game_id = p_game_id AND user_id = p_winner_id
  ) THEN
    RAISE EXCEPTION 'Winner is not a game participant';
  END IF;
  
  -- Get loser ID
  SELECT user_id INTO v_loser_id
  FROM game_participants 
  WHERE game_id = p_game_id AND user_id != p_winner_id
  LIMIT 1;
  
  -- Atomic credit award and stats update for winner
  UPDATE profiles SET 
    credits = credits + (v_stake * 2),
    total_wins = total_wins + 1,
    total_games = total_games + 1
  WHERE id = p_winner_id;
  
  -- Update loser stats
  IF v_loser_id IS NOT NULL THEN
    UPDATE profiles SET total_games = total_games + 1 
    WHERE id = v_loser_id;
  END IF;
  
  -- Mark game complete
  UPDATE games SET 
    status = 'completed',
    winner_id = p_winner_id,
    completed_at = now()
  WHERE id = p_game_id;
    
  -- Create transaction record for winner
  INSERT INTO transactions (user_id, amount, type, game_id, description)
  VALUES (p_winner_id, v_stake * 2, 'win', p_game_id, 'Game winnings');
END;
$$;