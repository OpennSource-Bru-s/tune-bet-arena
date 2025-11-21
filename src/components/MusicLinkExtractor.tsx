import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Music2 } from 'lucide-react';

interface MusicMetadata {
  platform: 'youtube' | 'spotify' | 'soundcloud' | 'apple';
  title: string;
  artist: string;
  icon: string;
}

interface MusicLinkExtractorProps {
  onMetadataExtracted: (metadata: { 
    title: string; 
    artist: string;
    platform: string;
    originalUrl: string;
    icon: string;
  }) => void;
}

const platformIcons = {
  youtube: '🎥',
  spotify: '🎵',
  soundcloud: '☁️',
  apple: '🍎'
};

export const MusicLinkExtractor = ({ onMetadataExtracted }: MusicLinkExtractorProps) => {
  const [link, setLink] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [metadata, setMetadata] = useState<MusicMetadata | null>(null);
  const { toast } = useToast();

  const extractMetadata = async () => {
    if (!link.trim()) {
      toast({
        title: "Error",
        description: "Please enter a music link",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('extract-music-metadata', {
        body: { url: link }
      });

      if (error) throw error;

      if (data.success && data.metadata) {
        setMetadata(data.metadata);
        onMetadataExtracted({
          title: data.metadata.title,
          artist: data.metadata.artist,
          platform: data.metadata.platform,
          originalUrl: link,
          icon: platformIcons[data.metadata.platform as keyof typeof platformIcons]
        });
        toast({
          title: "Success",
          description: "Metadata extracted successfully",
        });
      } else {
        throw new Error(data.error || 'Failed to extract metadata');
      }
    } catch (error) {
      console.error('Metadata extraction error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to extract metadata",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="music-link">Music Link (YouTube, Spotify, SoundCloud, Apple Music)</Label>
        <div className="flex gap-2">
          <Input
            id="music-link"
            type="url"
            placeholder="Paste link here..."
            value={link}
            onChange={(e) => setLink(e.target.value)}
            disabled={isLoading}
          />
          <Button 
            onClick={extractMetadata} 
            disabled={isLoading || !link.trim()}
            className="min-w-[100px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Extracting
              </>
            ) : (
              'Extract'
            )}
          </Button>
        </div>
      </div>

      {metadata && (
        <Card className="bg-gradient-card border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="text-4xl">
                {platformIcons[metadata.platform]}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-lg">{metadata.title}</div>
                <div className="text-muted-foreground">{metadata.artist}</div>
              </div>
              <Music2 className="w-6 h-6 text-primary/60" />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
