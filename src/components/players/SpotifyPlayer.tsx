import { useEffect } from 'react';

interface SpotifyPlayerProps {
  uri: string;
  onReady?: () => void;
  onError?: (error: any) => void;
}

export const SpotifyPlayer = ({ uri, onReady, onError }: SpotifyPlayerProps) => {
  useEffect(() => {
    onReady?.();
  }, [onReady]);

  // Extract Spotify ID from URL or URI
  const getSpotifyId = () => {
    if (uri.includes('spotify.com')) {
      const match = uri.match(/track\/([a-zA-Z0-9]+)/);
      return match ? match[1] : '';
    }
    return uri.replace('spotify:track:', '');
  };

  const spotifyId = getSpotifyId();

  return (
    <div className="w-full">
      <iframe
        src={`https://open.spotify.com/embed/track/${spotifyId}?utm_source=generator`}
        width="100%"
        height="152"
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        className="rounded-lg"
      />
    </div>
  );
};
