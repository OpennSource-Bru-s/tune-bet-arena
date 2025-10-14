-- Fix user_roles table public exposure to prevent admin enumeration
DROP POLICY IF EXISTS "User roles are viewable by everyone" ON public.user_roles;

CREATE POLICY "Authenticated users can view roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() IS NOT NULL);