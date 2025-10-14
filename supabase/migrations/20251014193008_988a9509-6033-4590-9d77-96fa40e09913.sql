-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Game participants are viewable by everyone" ON public.game_participants;

-- Allow users to always see their own participation data
CREATE POLICY "Users can view their own participation"
  ON public.game_participants
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow viewing all participant data (including answers) only for completed games
CREATE POLICY "Anyone can view completed game results"
  ON public.game_participants
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.games
      WHERE games.id = game_participants.game_id
      AND games.status = 'completed'
    )
  );