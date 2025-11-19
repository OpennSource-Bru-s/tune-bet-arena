import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MusicMetadata {
  platform: 'youtube' | 'spotify' | 'soundcloud' | 'apple';
  title: string;
  artist: string;
  icon: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      throw new Error('URL is required');
    }

    console.log('Extracting metadata from URL:', url);

    let metadata: MusicMetadata | null = null;

    // YouTube
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      metadata = await extractYouTubeMetadata(url);
    }
    // Spotify
    else if (url.includes('spotify.com')) {
      metadata = await extractSpotifyMetadata(url);
    }
    // SoundCloud
    else if (url.includes('soundcloud.com')) {
      metadata = await extractSoundCloudMetadata(url);
    }
    // Apple Music
    else if (url.includes('music.apple.com')) {
      metadata = await extractAppleMusicMetadata(url);
    }
    else {
      throw new Error('Unsupported platform. Please use YouTube, Spotify, SoundCloud, or Apple Music links.');
    }

    return new Response(
      JSON.stringify({ success: true, metadata }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error extracting metadata:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to extract metadata' 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function extractYouTubeMetadata(url: string): Promise<MusicMetadata> {
  try {
    const videoId = extractYouTubeVideoId(url);
    if (!videoId) throw new Error('Invalid YouTube URL');

    const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
    const data = await response.json();

    // Extract artist from title (common format: "Artist - Song" or "Song - Artist")
    const title = data.title || '';
    let songTitle = title;
    let artist = data.author_name || 'Unknown Artist';

    if (title.includes(' - ')) {
      const parts = title.split(' - ');
      songTitle = parts[1] || parts[0];
      artist = parts[0];
    }

    return {
      platform: 'youtube',
      title: songTitle.trim(),
      artist: artist.trim(),
      icon: '🎥'
    };
  } catch (error) {
    console.error('YouTube extraction error:', error);
    throw new Error('Failed to extract YouTube metadata');
  }
}

async function extractSpotifyMetadata(url: string): Promise<MusicMetadata> {
  try {
    const response = await fetch(url);
    const html = await response.text();

    // Extract title from meta tags
    const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/);
    const descMatch = html.match(/<meta property="og:description" content="([^"]+)"/);

    let title = 'Unknown Song';
    let artist = 'Unknown Artist';

    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1];
    }

    if (descMatch && descMatch[1]) {
      // Spotify description often contains artist info
      const desc = descMatch[1];
      const artistMatch = desc.match(/^([^·]+)/);
      if (artistMatch) {
        artist = artistMatch[1].trim();
      }
    }

    return {
      platform: 'spotify',
      title: title.trim(),
      artist: artist.trim(),
      icon: '🎵'
    };
  } catch (error) {
    console.error('Spotify extraction error:', error);
    throw new Error('Failed to extract Spotify metadata');
  }
}

async function extractSoundCloudMetadata(url: string): Promise<MusicMetadata> {
  try {
    const response = await fetch(url);
    const html = await response.text();

    // Extract from meta tags
    const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/);
    const descMatch = html.match(/<meta property="og:description" content="([^"]+)"/);

    let title = 'Unknown Song';
    let artist = 'Unknown Artist';

    if (titleMatch && titleMatch[1]) {
      const fullTitle = titleMatch[1];
      // SoundCloud format: "Title by Artist"
      if (fullTitle.includes(' by ')) {
        const parts = fullTitle.split(' by ');
        title = parts[0].trim();
        artist = parts[1].trim();
      } else {
        title = fullTitle;
      }
    }

    return {
      platform: 'soundcloud',
      title: title.trim(),
      artist: artist.trim(),
      icon: '☁️'
    };
  } catch (error) {
    console.error('SoundCloud extraction error:', error);
    throw new Error('Failed to extract SoundCloud metadata');
  }
}

async function extractAppleMusicMetadata(url: string): Promise<MusicMetadata> {
  try {
    const response = await fetch(url);
    const html = await response.text();

    // Extract from meta tags
    const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/);
    const artistMatch = html.match(/<meta property="music:musician" content="([^"]+)"/);

    let title = 'Unknown Song';
    let artist = 'Unknown Artist';

    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1];
    }

    if (artistMatch && artistMatch[1]) {
      artist = artistMatch[1];
    } else {
      // Fallback: extract from description
      const descMatch = html.match(/<meta name="description" content="[^"]*?by ([^"·]+)/);
      if (descMatch && descMatch[1]) {
        artist = descMatch[1].trim();
      }
    }

    return {
      platform: 'apple',
      title: title.trim(),
      artist: artist.trim(),
      icon: '🍎'
    };
  } catch (error) {
    console.error('Apple Music extraction error:', error);
    throw new Error('Failed to extract Apple Music metadata');
  }
}

function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}
