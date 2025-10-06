-- Create enum for game status
CREATE TYPE game_status AS ENUM ('waiting', 'in_progress', 'completed', 'cancelled');

-- Create enum for transaction types
CREATE TYPE transaction_type AS ENUM ('purchase', 'stake', 'win', 'free_credits');

-- Create enum for user roles
CREATE TYPE app_role AS ENUM ('admin', 'player');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  credits INTEGER NOT NULL DEFAULT 250,
  total_wins INTEGER NOT NULL DEFAULT 0,
  total_games INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Create songs table
CREATE TABLE public.songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  lyrics_snippet TEXT NOT NULL,
  answer TEXT NOT NULL,
  difficulty TEXT DEFAULT 'medium',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create games table
CREATE TABLE public.games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status game_status NOT NULL DEFAULT 'waiting',
  stake_amount INTEGER NOT NULL,
  song_id UUID REFERENCES public.songs(id),
  winner_id UUID REFERENCES public.profiles(id),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create game_participants table
CREATE TABLE public.game_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  answer_text TEXT,
  answered_at TIMESTAMPTZ,
  is_correct BOOLEAN,
  time_taken INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(game_id, user_id)
);

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL,
  type transaction_type NOT NULL,
  game_id UUID REFERENCES public.games(id),
  stripe_payment_id TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create settings table for admin configuration
CREATE TABLE public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default settings
INSERT INTO public.settings (key, value, description) VALUES
  ('free_credits_amount', '250', 'Amount of free credits to give'),
  ('free_credits_interval_hours', '24', 'Hours between free credit grants'),
  ('game_duration_seconds', '30', 'Duration of each game in seconds'),
  ('minimum_stake', '10', 'Minimum stake amount for games');

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Security definer function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS Policies for profiles
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "User roles are viewable by everyone"
  ON public.user_roles FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for songs
CREATE POLICY "Songs are viewable by everyone"
  ON public.songs FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage songs"
  ON public.songs FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for games
CREATE POLICY "Games are viewable by everyone"
  ON public.games FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create games"
  ON public.games FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Game creators and admins can update games"
  ON public.games FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.game_participants
      WHERE game_id = id AND user_id = auth.uid()
    ) OR public.has_role(auth.uid(), 'admin')
  );

-- RLS Policies for game_participants
CREATE POLICY "Game participants are viewable by everyone"
  ON public.game_participants FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can join games"
  ON public.game_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own participation"
  ON public.game_participants FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for transactions
CREATE POLICY "Users can view their own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can create transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for settings
CREATE POLICY "Settings are viewable by everyone"
  ON public.settings FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage settings"
  ON public.settings FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  
  -- Give new users the player role by default
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'player');
  
  RETURN new;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();