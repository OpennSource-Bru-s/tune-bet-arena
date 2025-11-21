import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Play, Pause, SkipForward, SkipBack } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import MusicPlayer from "@/components/MusicPlayer";

interface Song {
  id: string;
  title: string;
  artist: string;
  audio_url: string | null;
  difficulty: string;
  platform?: 'youtube' | 'spotify' | 'soundcloud' | 'apple' | 'direct';
  original_url?: string | null;
  icon?: string | null;
}

const Streaming = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStreamableSongs();
  }, []);

  const loadStreamableSongs = async () => {
    try {
      const { data, error } = await supabase
        .from("songs")
        .select("id, title, artist, audio_url, difficulty, platform, original_url, icon")
        .eq("is_active", true)
        .order("title");

      if (error) throw error;
      
      // Filter songs that have either audio_url or (platform + original_url)
      const streamableSongs = (data || []).filter(
        song => song.audio_url || (song.platform && song.original_url)
      ) as Song[];
      
      setSongs(streamableSongs);
    } catch (error: any) {
      toast({
        title: "Error loading songs",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const playSong = (song: Song) => {
    setCurrentSong(song);
  };

  const playNext = () => {
    if (!currentSong || songs.length === 0) return;
    const currentIndex = songs.findIndex((s) => s.id === currentSong.id);
    const nextIndex = (currentIndex + 1) % songs.length;
    setCurrentSong(songs[nextIndex]);
  };

  const playPrevious = () => {
    if (!currentSong || songs.length === 0) return;
    const currentIndex = songs.findIndex((s) => s.id === currentSong.id);
    const prevIndex = currentIndex === 0 ? songs.length - 1 : currentIndex - 1;
    setCurrentSong(songs[prevIndex]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 pb-32">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Music Streaming</h1>
          <p className="text-muted-foreground">Stream full songs from our collection</p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading songs...</p>
          </div>
        ) : songs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No streamable songs available yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {songs.map((song) => (
              <Card
                key={song.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  currentSong?.id === song.id ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => playSong(song)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {song.icon && <span className="text-2xl">{song.icon}</span>}
                      {song.title}
                    </div>
                    {currentSong?.id === song.id && (
                      <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    )}
                  </CardTitle>
                  <CardDescription>{song.artist}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground capitalize">
                      {song.difficulty || "medium"}
                    </span>
                    <Button
                      size="sm"
                      variant={currentSong?.id === song.id ? "default" : "secondary"}
                      onClick={(e) => {
                        e.stopPropagation();
                        playSong(song);
                      }}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {currentSong && (
        <MusicPlayer
          song={currentSong}
          onNext={playNext}
          onPrevious={playPrevious}
          onClose={() => setCurrentSong(null)}
        />
      )}
    </div>
  );
};

export default Streaming;
