import { useEffect, useState } from 'react';

interface SoundCloudPlayerProps {
  url: string;
  onReady?: () => void;
  onError?: (error: any) => void;
}

export const SoundCloudPlayer = ({ url, onReady, onError }: SoundCloudPlayerProps) => {
  const [embedUrl, setEmbedUrl] = useState<string>('');

  useEffect(() => {
    // Use SoundCloud oEmbed API to get embed URL
    const fetchEmbed = async () => {
      try {
        const response = await fetch(
          `https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(url)}&auto_play=true`
        );
        const data = await response.json();
        
        // Extract iframe src from HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = data.html;
        const iframe = tempDiv.querySelector('iframe');
        
        if (iframe) {
          setEmbedUrl(iframe.src);
          onReady?.();
        } else {
          onError?.('Failed to get SoundCloud embed URL');
        }
      } catch (error) {
        console.error('SoundCloud embed error:', error);
        onError?.(error);
      }
    };

    fetchEmbed();
  }, [url, onReady, onError]);

  if (!embedUrl) {
    return <div className="text-muted-foreground">Loading SoundCloud player...</div>;
  }

  return (
    <div className="w-full">
      <iframe
        width="100%"
        height="166"
        scrolling="no"
        frameBorder="no"
        allow="autoplay"
        src={embedUrl}
        className="rounded-lg"
      />
    </div>
  );
};
