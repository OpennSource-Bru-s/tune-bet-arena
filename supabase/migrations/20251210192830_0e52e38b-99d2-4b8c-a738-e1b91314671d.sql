-- Drop the overly permissive policy that allows anyone to view statistics
DROP POLICY IF EXISTS "Anyone can view statistics" ON user_statistics;

-- Create policy for users to view their own detailed statistics
CREATE POLICY "Users can view own statistics"
  ON user_statistics FOR SELECT
  USING (auth.uid() = user_id);

-- Keep the system management policy but make it more restrictive
DROP POLICY IF EXISTS "System can manage statistics" ON user_statistics;

-- System can insert/update statistics (for game completion hooks)
CREATE POLICY "System can insert statistics"
  ON user_statistics FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "System can update own statistics"
  ON user_statistics FOR UPDATE
  USING (auth.uid() = user_id);