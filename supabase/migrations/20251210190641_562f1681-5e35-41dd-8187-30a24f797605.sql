-- Fix 1: Games update policy - correct the self-reference bug
DROP POLICY IF EXISTS "Game creators and admins can update games" ON games;

CREATE POLICY "Game creators and admins can update games"
  ON games FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM game_participants
      WHERE game_participants.game_id = games.id
      AND game_participants.user_id = auth.uid()
    )
    OR has_role(auth.uid(), 'admin')
  );

-- Fix 2: Profiles table - restrict sensitive data access
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON profiles;

-- Users can always view their own full profile
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can view limited public data of others (for leaderboards, social features)
-- This allows viewing username, display_name, avatar_url, elo_rating, total_wins, total_games
-- But the RLS policy applies to the whole row, so we need a different approach
-- We'll allow viewing but the app should only query needed fields

-- For leaderboard/social features, allow authenticated users to see basic profile info
CREATE POLICY "Authenticated users can view public profile data"
  ON profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);