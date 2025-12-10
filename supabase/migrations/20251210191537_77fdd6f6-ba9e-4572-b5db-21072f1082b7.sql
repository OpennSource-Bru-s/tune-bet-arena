-- Fix: Remove the overly permissive profiles SELECT policy
-- The "Authenticated users can view public profile data" policy allows any authenticated user
-- to see ALL profile data, making the owner-only policy useless (policies OR together)

DROP POLICY IF EXISTS "Authenticated users can view public profile data" ON profiles;

-- Create a view for leaderboards/social features with only public fields
CREATE OR REPLACE VIEW public_profiles AS
SELECT 
  id, 
  username, 
  display_name, 
  avatar_url, 
  elo_rating, 
  total_wins, 
  total_games
FROM profiles;