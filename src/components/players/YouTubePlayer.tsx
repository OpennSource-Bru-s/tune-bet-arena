import { useEffect, useRef } from 'react';

interface YouTubePlayerProps {
  videoId: string;
  onReady?: () => void;
  onError?: (error: any) => void;
}

export const YouTubePlayer = ({ videoId, onReady, onError }: YouTubePlayerProps) => {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load YouTube IFrame API
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      (window as any).onYouTubeIframeAPIReady = initPlayer;
    } else {
      initPlayer();
    }

    function initPlayer() {
      if (!containerRef.current) return;

      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId: videoId,
        playerVars: {
          autoplay: 1,
          controls: 1,
          modestbranding: 1,
        },
        events: {
          onReady: (event: any) => {
            console.log('YouTube player ready');
            onReady?.();
          },
          onError: (event: any) => {
            console.error('YouTube player error:', event);
            onError?.(event);
          },
        },
      });
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [videoId, onReady, onError]);

  return (
    <div className="w-full aspect-video">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
};

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}
