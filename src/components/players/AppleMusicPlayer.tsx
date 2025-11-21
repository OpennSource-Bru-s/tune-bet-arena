import { useEffect } from 'react';

interface AppleMusicPlayerProps {
  url: string;
  onReady?: () => void;
  onError?: (error: any) => void;
}

export const AppleMusicPlayer = ({ url, onReady, onError }: AppleMusicPlayerProps) => {
  useEffect(() => {
    onReady?.();
  }, [onReady]);

  // Extract Apple Music ID from URL
  const getAppleMusicId = () => {
    const match = url.match(/\/album\/[^/]+\/(\d+)\?i=(\d+)/);
    if (match) {
      return { albumId: match[1], trackId: match[2] };
    }
    return null;
  };

  const ids = getAppleMusicId();

  if (!ids) {
    return (
      <div className="text-muted-foreground">
        Invalid Apple Music URL format
      </div>
    );
  }

  return (
    <div className="w-full">
      <iframe
        allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write"
        frameBorder="0"
        height="175"
        style={{
          width: '100%',
          maxWidth: '660px',
          overflow: 'hidden',
          borderRadius: '10px',
        }}
        sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"
        src={`https://embed.music.apple.com/us/album/${ids.albumId}?i=${ids.trackId}`}
      />
    </div>
  );
};
