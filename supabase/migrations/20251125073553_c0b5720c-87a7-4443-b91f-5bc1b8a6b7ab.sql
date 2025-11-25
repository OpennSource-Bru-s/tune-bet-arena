-- Create enum for cosmetic types
CREATE TYPE cosmetic_type AS ENUM ('avatar', 'profile_frame', 'victory_animation');

-- Create enum for rarity
CREATE TYPE item_rarity AS ENUM ('common', 'rare', 'epic', 'legendary');

-- Cosmetic items in the store
CREATE TABLE cosmetic_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type cosmetic_type NOT NULL,
  rarity item_rarity NOT NULL DEFAULT 'common',
  price_credits INTEGER NOT NULL,
  price_premium BOOLEAN DEFAULT false,
  image_url TEXT,
  animation_data JSONB,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User's owned cosmetics
CREATE TABLE user_cosmetics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  cosmetic_id UUID NOT NULL REFERENCES cosmetic_items(id) ON DELETE CASCADE,
  acquired_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, cosmetic_id)
);

-- Add equipped cosmetics to profiles
ALTER TABLE profiles 
ADD COLUMN equipped_avatar UUID REFERENCES cosmetic_items(id),
ADD COLUMN equipped_frame UUID REFERENCES cosmetic_items(id),
ADD COLUMN equipped_animation UUID REFERENCES cosmetic_items(id),
ADD COLUMN is_premium BOOLEAN DEFAULT false,
ADD COLUMN premium_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN referral_code TEXT UNIQUE,
ADD COLUMN referred_by UUID REFERENCES profiles(id);

-- Season passes
CREATE TABLE season_passes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  price_credits INTEGER NOT NULL,
  max_level INTEGER DEFAULT 50,
  rewards JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User season pass progress
CREATE TABLE user_season_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  season_id UUID NOT NULL REFERENCES season_passes(id) ON DELETE CASCADE,
  current_level INTEGER DEFAULT 1,
  xp_earned INTEGER DEFAULT 0,
  is_premium BOOLEAN DEFAULT false,
  purchased_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, season_id)
);

-- Tournaments
CREATE TABLE tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  entry_fee INTEGER NOT NULL,
  prize_pool INTEGER NOT NULL,
  max_participants INTEGER,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed', 'cancelled')),
  rules JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tournament participants
CREATE TABLE tournament_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score INTEGER DEFAULT 0,
  rank INTEGER,
  prize_won INTEGER DEFAULT 0,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(tournament_id, user_id)
);

-- Sponsored songs/events
ALTER TABLE songs
ADD COLUMN is_sponsored BOOLEAN DEFAULT false,
ADD COLUMN sponsor_name TEXT,
ADD COLUMN sponsor_logo_url TEXT,
ADD COLUMN sponsor_metadata JSONB;

-- Referral tracking
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reward_credits INTEGER DEFAULT 250,
  reward_claimed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE cosmetic_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_cosmetics ENABLE ROW LEVEL SECURITY;
ALTER TABLE season_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_season_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cosmetic_items
CREATE POLICY "Cosmetic items are viewable by everyone"
ON cosmetic_items FOR SELECT
USING (true);

CREATE POLICY "Only admins can manage cosmetic items"
ON cosmetic_items FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for user_cosmetics
CREATE POLICY "Users can view their own cosmetics"
ON user_cosmetics FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cosmetics"
ON user_cosmetics FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for season_passes
CREATE POLICY "Season passes are viewable by everyone"
ON season_passes FOR SELECT
USING (true);

CREATE POLICY "Only admins can manage season passes"
ON season_passes FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for user_season_progress
CREATE POLICY "Users can view their own season progress"
ON user_season_progress FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own season progress"
ON user_season_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own season progress"
ON user_season_progress FOR UPDATE
USING (auth.uid() = user_id);

-- RLS Policies for tournaments
CREATE POLICY "Tournaments are viewable by everyone"
ON tournaments FOR SELECT
USING (true);

CREATE POLICY "Only admins can manage tournaments"
ON tournaments FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for tournament_participants
CREATE POLICY "Participants are viewable by everyone"
ON tournament_participants FOR SELECT
USING (true);

CREATE POLICY "Users can join tournaments"
ON tournament_participants FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Only admins can update participant scores"
ON tournament_participants FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for referrals
CREATE POLICY "Users can view their own referrals"
ON referrals FOR SELECT
USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "System can create referrals"
ON referrals FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own referral claims"
ON referrals FOR UPDATE
USING (auth.uid() = referrer_id);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := upper(substring(md5(random()::text || NEW.id::text) from 1 for 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_referral_code_trigger
BEFORE INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION generate_referral_code();

-- Function to process referral rewards
CREATE OR REPLACE FUNCTION process_referral_reward(p_referrer_id UUID, p_referred_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Award credits to referrer
  UPDATE profiles 
  SET credits = credits + 250
  WHERE id = p_referrer_id;
  
  -- Mark referral as claimed
  UPDATE referrals
  SET reward_claimed = true
  WHERE referrer_id = p_referrer_id AND referred_id = p_referred_id;
  
  -- Create transaction record
  INSERT INTO transactions (user_id, amount, type, description)
  VALUES (p_referrer_id, 250, 'free_credits', 'Referral bonus');
END;
$$;

-- Insert some initial cosmetic items
INSERT INTO cosmetic_items (name, description, type, rarity, price_credits, image_url) VALUES
('Gold Crown Avatar', 'Show off your victory with a golden crown', 'avatar', 'legendary', 5000, '👑'),
('Diamond Frame', 'A sparkling diamond profile frame', 'profile_frame', 'epic', 3000, '💎'),
('Confetti Blast', 'Celebrate wins with confetti!', 'victory_animation', 'rare', 1500, '🎉'),
('Music Note Avatar', 'Classic music lover avatar', 'avatar', 'common', 500, '🎵'),
('Neon Frame', 'Glowing neon profile frame', 'profile_frame', 'rare', 2000, '⚡'),
('Fireworks', 'Epic fireworks victory animation', 'victory_animation', 'epic', 2500, '🎆');