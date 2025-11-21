import { YouTubePlayer } from './YouTubePlayer';
import { SpotifyPlayer } from './SpotifyPlayer';
import { SoundCloudPlayer } from './SoundCloudPlayer';
import { AppleMusicPlayer } from './AppleMusicPlayer';

interface PlatformPlayerProps {
  platform: 'youtube' | 'spotify' | 'soundcloud' | 'apple' | 'direct';
  url: string;
  onReady?: () => void;
  onError?: (error: any) => void;
}

export const PlatformPlayer = ({ platform, url, onReady, onError }: PlatformPlayerProps) => {
  const extractYouTubeId = (url: string) => {
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
    return '';
  };

  switch (platform) {
    case 'youtube':
      const videoId = extractYouTubeId(url);
      return <YouTubePlayer videoId={videoId} onReady={onReady} onError={onError} />;
    
    case 'spotify':
      return <SpotifyPlayer uri={url} onReady={onReady} onError={onError} />;
    
    case 'soundcloud':
      return <SoundCloudPlayer url={url} onReady={onReady} onError={onError} />;
    
    case 'apple':
      return <AppleMusicPlayer url={url} onReady={onReady} onError={onError} />;
    
    case 'direct':
      return (
        <audio
          src={url}
          controls
          autoPlay
          className="w-full"
          onLoadedData={() => onReady?.()}
          onError={(e) => onError?.(e)}
        />
      );
    
    default:
      return <div className="text-muted-foreground">Unsupported platform</div>;
  }
};
