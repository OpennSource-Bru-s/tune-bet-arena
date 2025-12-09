-- Update the complete_game function to apply house rake
CREATE OR REPLACE FUNCTION public.complete_game(p_game_id uuid, p_winner_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_stake INT;
  v_loser_id UUID;
  v_game_status game_status;
  v_rake_percentage DECIMAL;
  v_total_pot INT;
  v_rake_amount INT;
  v_winner_payout INT;
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
  
  -- Get rake percentage from settings (default 5%)
  SELECT COALESCE(value::DECIMAL, 5) INTO v_rake_percentage
  FROM settings 
  WHERE key = 'game_rake_percentage';
  
  IF v_rake_percentage IS NULL THEN
    v_rake_percentage := 5;
  END IF;
  
  -- Calculate payouts
  v_total_pot := v_stake * 2;
  v_rake_amount := FLOOR(v_total_pot * (v_rake_percentage / 100));
  v_winner_payout := v_total_pot - v_rake_amount;
  
  -- Atomic credit award and stats update for winner
  UPDATE profiles SET 
    credits = credits + v_winner_payout,
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
    
  -- Create transaction record for winner (showing net amount after rake)
  INSERT INTO transactions (user_id, amount, type, game_id, description)
  VALUES (p_winner_id, v_winner_payout, 'win', p_game_id, 
    'Game winnings (after ' || v_rake_percentage || '% platform fee)');
  
  -- Create transaction record for platform rake
  INSERT INTO transactions (user_id, amount, type, game_id, description)
  VALUES (p_winner_id, v_rake_amount, 'stake', p_game_id, 
    'Platform fee (' || v_rake_percentage || '%)');
END;
$function$;