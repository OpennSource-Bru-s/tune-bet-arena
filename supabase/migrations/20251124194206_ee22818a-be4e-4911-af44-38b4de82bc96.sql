-- Add ELO rating to profiles
ALTER TABLE profiles ADD COLUMN elo_rating INTEGER DEFAULT 1000;

-- Create friendships table
CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, friend_id)
);

ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own friendships"
  ON friendships FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can create friendship requests"
  ON friendships FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update friendship status"
  ON friendships FOR UPDATE
  USING (auth.uid() = friend_id);

-- Create achievements table
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  criteria JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Achievements are viewable by everyone"
  ON achievements FOR SELECT
  USING (true);

-- Create user_achievements table
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own achievements"
  ON user_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create user achievements"
  ON user_achievements FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Create daily_challenges table
CREATE TABLE daily_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_date DATE UNIQUE NOT NULL,
  description TEXT NOT NULL,
  criteria JSONB NOT NULL,
  bonus_credits INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE daily_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Daily challenges are viewable by everyone"
  ON daily_challenges FOR SELECT
  USING (true);

-- Create user_daily_challenges table
CREATE TABLE user_daily_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES daily_challenges(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, challenge_id)
);

ALTER TABLE user_daily_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own challenges"
  ON user_daily_challenges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own challenges"
  ON user_daily_challenges FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can create user challenges"
  ON user_daily_challenges FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Create messages table for in-game chat
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages from their games"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM game_participants
      WHERE game_participants.game_id = messages.game_id
      AND game_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages in their games"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM game_participants
      WHERE game_participants.game_id = messages.game_id
      AND game_participants.user_id = auth.uid()
    )
  );

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Create notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Insert initial achievements
INSERT INTO achievements (key, name, description, icon, criteria) VALUES
  ('first_win', 'First Victory', 'Win your first game', '🏆', '{"type": "wins", "count": 1}'),
  ('win_10', 'Winning Streak', 'Win 10 games', '🌟', '{"type": "wins", "count": 10}'),
  ('perfect_guess', 'Perfect Timing', 'Guess correctly under 5 seconds', '⚡', '{"type": "quick_win", "time": 5}'),
  ('lyrics_master', 'Lyrics Master', 'Win 50 games', '👑', '{"type": "wins", "count": 50}'),
  ('high_stakes', 'High Roller', 'Win a game with 500+ credits stake', '💎', '{"type": "high_stake_win", "amount": 500}');

-- Function to update ELO ratings
CREATE OR REPLACE FUNCTION update_elo_ratings(
  p_winner_id UUID,
  p_loser_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_winner_elo INT;
  v_loser_elo INT;
  v_k_factor INT := 32;
  v_expected_winner FLOAT;
  v_expected_loser FLOAT;
  v_new_winner_elo INT;
  v_new_loser_elo INT;
BEGIN
  -- Get current ELO ratings
  SELECT elo_rating INTO v_winner_elo FROM profiles WHERE id = p_winner_id;
  SELECT elo_rating INTO v_loser_elo FROM profiles WHERE id = p_loser_id;
  
  -- Calculate expected scores
  v_expected_winner := 1.0 / (1.0 + POWER(10, (v_loser_elo - v_winner_elo) / 400.0));
  v_expected_loser := 1.0 / (1.0 + POWER(10, (v_winner_elo - v_loser_elo) / 400.0));
  
  -- Calculate new ratings
  v_new_winner_elo := v_winner_elo + ROUND(v_k_factor * (1 - v_expected_winner));
  v_new_loser_elo := v_loser_elo + ROUND(v_k_factor * (0 - v_expected_loser));
  
  -- Update ratings
  UPDATE profiles SET elo_rating = v_new_winner_elo WHERE id = p_winner_id;
  UPDATE profiles SET elo_rating = v_new_loser_elo WHERE id = p_loser_id;
END;
$$;

-- Function to check and award achievements
CREATE OR REPLACE FUNCTION check_achievements(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wins INT;
BEGIN
  -- Get user stats
  SELECT total_wins INTO v_wins FROM profiles WHERE id = p_user_id;
  
  -- Check first win
  IF v_wins >= 1 AND NOT EXISTS (
    SELECT 1 FROM user_achievements ua
    JOIN achievements a ON a.id = ua.achievement_id
    WHERE ua.user_id = p_user_id AND a.key = 'first_win'
  ) THEN
    INSERT INTO user_achievements (user_id, achievement_id)
    SELECT p_user_id, id FROM achievements WHERE key = 'first_win';
    
    INSERT INTO notifications (user_id, type, title, message)
    VALUES (p_user_id, 'achievement', 'Achievement Unlocked!', 'First Victory - Win your first game 🏆');
  END IF;
  
  -- Check 10 wins
  IF v_wins >= 10 AND NOT EXISTS (
    SELECT 1 FROM user_achievements ua
    JOIN achievements a ON a.id = ua.achievement_id
    WHERE ua.user_id = p_user_id AND a.key = 'win_10'
  ) THEN
    INSERT INTO user_achievements (user_id, achievement_id)
    SELECT p_user_id, id FROM achievements WHERE key = 'win_10';
    
    INSERT INTO notifications (user_id, type, title, message)
    VALUES (p_user_id, 'achievement', 'Achievement Unlocked!', 'Winning Streak - Win 10 games 🌟');
  END IF;
  
  -- Check lyrics master (50 wins)
  IF v_wins >= 50 AND NOT EXISTS (
    SELECT 1 FROM user_achievements ua
    JOIN achievements a ON a.id = ua.achievement_id
    WHERE ua.user_id = p_user_id AND a.key = 'lyrics_master'
  ) THEN
    INSERT INTO user_achievements (user_id, achievement_id)
    SELECT p_user_id, id FROM achievements WHERE key = 'lyrics_master';
    
    INSERT INTO notifications (user_id, type, title, message)
    VALUES (p_user_id, 'achievement', 'Achievement Unlocked!', 'Lyrics Master - Win 50 games 👑');
  END IF;
END;
$$;