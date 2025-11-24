-- Add analytics and game statistics tables

-- Table to track detailed game analytics
CREATE TABLE IF NOT EXISTS public.game_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid REFERENCES games(id) ON DELETE CASCADE,
  song_id uuid REFERENCES songs(id),
  total_players integer DEFAULT 2,
  average_response_time integer,
  completion_rate decimal(5,2),
  created_at timestamptz DEFAULT now()
);

-- Table to store game replays (detailed game events)
CREATE TABLE IF NOT EXISTS public.game_replays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid REFERENCES games(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id),
  event_type text NOT NULL,
  event_data jsonb,
  timestamp timestamptz DEFAULT now()
);

-- Table for user statistics
CREATE TABLE IF NOT EXISTS public.user_statistics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) UNIQUE,
  total_games_played integer DEFAULT 0,
  total_wins integer DEFAULT 0,
  win_rate decimal(5,2) DEFAULT 0,
  average_response_time integer DEFAULT 0,
  fastest_correct_answer integer,
  current_win_streak integer DEFAULT 0,
  longest_win_streak integer DEFAULT 0,
  total_credits_earned integer DEFAULT 0,
  last_played_at timestamptz,
  updated_at timestamptz DEFAULT now()
);

-- Add song popularity tracking
ALTER TABLE songs ADD COLUMN IF NOT EXISTS times_played integer DEFAULT 0;
ALTER TABLE songs ADD COLUMN IF NOT EXISTS win_rate decimal(5,2) DEFAULT 0;

-- Enable RLS
ALTER TABLE game_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_replays ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_statistics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for game_analytics
CREATE POLICY "Anyone can view game analytics"
  ON game_analytics FOR SELECT
  USING (true);

CREATE POLICY "System can create analytics"
  ON game_analytics FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for game_replays
CREATE POLICY "Users can view their own game replays"
  ON game_replays FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM game_participants gp
    WHERE gp.game_id = game_replays.game_id AND gp.user_id = auth.uid()
  ));

CREATE POLICY "System can create replays"
  ON game_replays FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for user_statistics
CREATE POLICY "Anyone can view statistics"
  ON user_statistics FOR SELECT
  USING (true);

CREATE POLICY "System can manage statistics"
  ON user_statistics FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Function to update user statistics after game
CREATE OR REPLACE FUNCTION update_user_statistics(p_user_id uuid, p_won boolean, p_response_time integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO user_statistics (user_id, total_games_played, total_wins, average_response_time, fastest_correct_answer, current_win_streak, last_played_at)
  VALUES (p_user_id, 1, CASE WHEN p_won THEN 1 ELSE 0 END, p_response_time, p_response_time, CASE WHEN p_won THEN 1 ELSE 0 END, now())
  ON CONFLICT (user_id) DO UPDATE SET
    total_games_played = user_statistics.total_games_played + 1,
    total_wins = user_statistics.total_wins + CASE WHEN p_won THEN 1 ELSE 0 END,
    win_rate = ((user_statistics.total_wins + CASE WHEN p_won THEN 1 ELSE 0 END)::decimal / (user_statistics.total_games_played + 1)) * 100,
    average_response_time = ((user_statistics.average_response_time * user_statistics.total_games_played) + p_response_time) / (user_statistics.total_games_played + 1),
    fastest_correct_answer = CASE 
      WHEN p_won AND (user_statistics.fastest_correct_answer IS NULL OR p_response_time < user_statistics.fastest_correct_answer) 
      THEN p_response_time 
      ELSE user_statistics.fastest_correct_answer 
    END,
    current_win_streak = CASE WHEN p_won THEN user_statistics.current_win_streak + 1 ELSE 0 END,
    longest_win_streak = CASE 
      WHEN p_won AND (user_statistics.current_win_streak + 1) > user_statistics.longest_win_streak 
      THEN user_statistics.current_win_streak + 1 
      ELSE user_statistics.longest_win_streak 
    END,
    last_played_at = now(),
    updated_at = now();
END;
$$;

-- Function to update song statistics
CREATE OR REPLACE FUNCTION update_song_statistics(p_song_id uuid, p_was_correct boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_plays integer;
  v_current_wins integer;
BEGIN
  SELECT times_played INTO v_current_plays FROM songs WHERE id = p_song_id;
  
  v_current_wins := CASE WHEN p_was_correct THEN 1 ELSE 0 END;
  
  UPDATE songs SET
    times_played = times_played + 1,
    win_rate = ((win_rate * v_current_plays) + (v_current_wins * 100)) / (v_current_plays + 1)
  WHERE id = p_song_id;
END;
$$;

-- Enable realtime for analytics tables
ALTER PUBLICATION supabase_realtime ADD TABLE game_analytics;
ALTER PUBLICATION supabase_realtime ADD TABLE user_statistics;