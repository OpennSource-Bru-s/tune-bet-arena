import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Music, Settings as SettingsIcon, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MusicLinkExtractor } from '@/components/MusicLinkExtractor';

const Admin = () => {
  const { isAdmin } = useAuth();
  const [songs, setSongs] = useState<any[]>([]);
  const [settings, setSettings] = useState<any[]>([]);
  const [newSong, setNewSong] = useState({
    title: '',
    artist: '',
    lyrics_snippet: '',
    answer: '',
    difficulty: 'medium',
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }
    loadSongs();
    loadSettings();
  }, [isAdmin]);

  const loadSongs = async () => {
    const { data } = await supabase
      .from('songs')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setSongs(data);
  };

  const loadSettings = async () => {
    const { data } = await supabase
      .from('settings')
      .select('*')
      .order('key');
    if (data) setSettings(data);
  };

  const addSong = async () => {
    if (!newSong.title || !newSong.artist || !newSong.lyrics_snippet || !newSong.answer) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from('songs')
      .insert(newSong);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Song added successfully",
      });
      setNewSong({
        title: '',
        artist: '',
        lyrics_snippet: '',
        answer: '',
        difficulty: 'medium',
      });
      loadSongs();
    }
  };

  const deleteSong = async (id: string) => {
    const { error } = await supabase
      .from('songs')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Song deleted successfully",
      });
      loadSongs();
    }
  };

  const updateSetting = async (key: string, value: string) => {
    const { error } = await supabase
      .from('settings')
      .update({ value })
      .eq('key', key);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Setting updated successfully",
      });
      loadSettings();
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-hero p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Admin Panel
          </h1>
        </div>

        <Tabs defaultValue="songs" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-card">
            <TabsTrigger value="songs">Song Management</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="songs" className="space-y-4">
            <Card className="bg-card border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Music className="w-5 h-5" />
                  Add New Song
                </CardTitle>
                <CardDescription>Add songs for the lyrics guessing game</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <MusicLinkExtractor 
                  onMetadataExtracted={(metadata) => {
                    setNewSong({ 
                      ...newSong, 
                      title: metadata.title, 
                      artist: metadata.artist 
                    });
                  }}
                />
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={newSong.title}
                      onChange={(e) => setNewSong({ ...newSong, title: e.target.value })}
                      placeholder="Song title"
                      className="bg-input border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Artist</Label>
                    <Input
                      value={newSong.artist}
                      onChange={(e) => setNewSong({ ...newSong, artist: e.target.value })}
                      placeholder="Artist name"
                      className="bg-input border-border"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Lyrics Snippet (with blank)</Label>
                  <Textarea
                    value={newSong.lyrics_snippet}
                    onChange={(e) => setNewSong({ ...newSong, lyrics_snippet: e.target.value })}
                    placeholder="Example: 'I'm walking on _____, oh yeah'"
                    className="bg-input border-border"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Correct Answer</Label>
                  <Input
                    value={newSong.answer}
                    onChange={(e) => setNewSong({ ...newSong, answer: e.target.value })}
                    placeholder="sunshine"
                    className="bg-input border-border"
                  />
                </div>
                <Button onClick={addSong} className="bg-gradient-primary hover:opacity-90">
                  Add Song
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-card border-primary/20">
              <CardHeader>
                <CardTitle>Existing Songs ({songs.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {songs.map((song) => (
                    <div
                      key={song.id}
                      className="flex items-center justify-between p-4 bg-gradient-card border border-primary/20 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-semibold">{song.title} - {song.artist}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1">{song.lyrics_snippet}</p>
                      </div>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => deleteSong(song.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card className="bg-card border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SettingsIcon className="w-5 h-5" />
                  Game Settings
                </CardTitle>
                <CardDescription>Configure game parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {settings.map((setting) => (
                  <div key={setting.key} className="space-y-2">
                    <Label>{setting.description}</Label>
                    <div className="flex gap-2">
                      <Input
                        defaultValue={setting.value}
                        type="number"
                        className="bg-input border-border"
                        onBlur={(e) => updateSetting(setting.key, e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
