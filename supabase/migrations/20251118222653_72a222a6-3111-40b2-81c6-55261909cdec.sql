-- Add audio URL field to songs table for streaming
ALTER TABLE public.songs
ADD COLUMN audio_url TEXT;

-- Add comment for clarity
COMMENT ON COLUMN public.songs.audio_url IS 'URL to the full song audio file for streaming';

-- Create index for faster lookups of streamable songs
CREATE INDEX idx_songs_streamable ON public.songs(is_active) WHERE audio_url IS NOT NULL;