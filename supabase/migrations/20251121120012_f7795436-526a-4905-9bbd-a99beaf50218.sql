-- Add platform and original_url columns to songs table
ALTER TABLE songs 
ADD COLUMN IF NOT EXISTS platform TEXT CHECK (platform IN ('youtube', 'spotify', 'soundcloud', 'apple', 'direct')),
ADD COLUMN IF NOT EXISTS original_url TEXT;

-- Add comment to explain the fields
COMMENT ON COLUMN songs.platform IS 'Music platform: youtube, spotify, soundcloud, apple, or direct for direct audio URLs';
COMMENT ON COLUMN songs.original_url IS 'Original URL from the music platform (for embed players)';