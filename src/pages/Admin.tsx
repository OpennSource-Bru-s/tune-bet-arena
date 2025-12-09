import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Music, Settings as SettingsIcon, Trash2, Coins, Wallet, Shield, Hexagon, Gift, Crown, Trophy } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MusicLinkExtractor } from '@/components/MusicLinkExtractor';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const Admin = () => {
  const { isAdmin } = useAuth();
  const [songs, setSongs] = useState<any[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [cosmetics, setCosmetics] = useState<any[]>([]);
  const [seasonPasses, setSeasonPasses] = useState<any[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [newSong, setNewSong] = useState({
    title: '',
    artist: '',
    lyrics_snippet: '',
    answer: '',
    difficulty: 'medium',
    platform: '',
    original_url: '',
    icon: '',
  });
  const [newCosmetic, setNewCosmetic] = useState({
    name: '',
    description: '',
    type: 'avatar',
    rarity: 'common',
    price_credits: 100,
    image_url: '',
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }
    loadAll();
  }, [isAdmin]);

  const loadAll = () => {
    loadSongs();
    loadSettings();
    loadCosmetics();
    loadSeasonPasses();
    loadTournaments();
  };

  const loadSongs = async () => {
    const { data } = await supabase.from('songs').select('*').order('created_at', { ascending: false });
    if (data) setSongs(data);
  };

  const loadSettings = async () => {
    const { data } = await supabase.from('settings').select('*').order('key');
    if (data) {
      const settingsMap: Record<string, string> = {};
      data.forEach((s) => { settingsMap[s.key] = s.value; });
      setSettings(settingsMap);
    }
  };

  const loadCosmetics = async () => {
    const { data } = await supabase.from('cosmetic_items').select('*').order('created_at', { ascending: false });
    if (data) setCosmetics(data);
  };

  const loadSeasonPasses = async () => {
    const { data } = await supabase.from('season_passes').select('*').order('season_number', { ascending: false });
    if (data) setSeasonPasses(data);
  };

  const loadTournaments = async () => {
    const { data } = await supabase.from('tournaments').select('*').order('start_time', { ascending: false });
    if (data) setTournaments(data);
  };

  const addSong = async () => {
    if (!newSong.title || !newSong.artist || !newSong.lyrics_snippet || !newSong.answer) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from('songs').insert(newSong);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Song added successfully" });
      setNewSong({ title: '', artist: '', lyrics_snippet: '', answer: '', difficulty: 'medium', platform: '', original_url: '', icon: '' });
      loadSongs();
    }
  };

  const deleteSong = async (id: string) => {
    const { error } = await supabase.from('songs').delete().eq('id', id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Song deleted" });
      loadSongs();
    }
  };

  const updateSetting = async (key: string, value: string) => {
    const { error } = await supabase.from('settings').update({ value }).eq('key', key);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setSettings({ ...settings, [key]: value });
      toast({ title: "Success", description: "Setting updated" });
    }
  };

  const addCosmetic = async () => {
    if (!newCosmetic.name) {
      toast({ title: "Error", description: "Please fill in name", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from('cosmetic_items').insert({
      name: newCosmetic.name,
      description: newCosmetic.description || null,
      type: newCosmetic.type as 'avatar' | 'profile_frame' | 'victory_animation',
      rarity: newCosmetic.rarity as 'common' | 'rare' | 'epic' | 'legendary',
      price_credits: newCosmetic.price_credits,
      image_url: newCosmetic.image_url || null,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "NFT added successfully" });
      setNewCosmetic({ name: '', description: '', type: 'avatar', rarity: 'common', price_credits: 100, image_url: '' });
      loadCosmetics();
    }
  };

  const deleteCosmetic = async (id: string) => {
    const { error } = await supabase.from('cosmetic_items').delete().eq('id', id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "NFT deleted" });
      loadCosmetics();
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-gradient-hero p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Admin Portal
          </h1>
        </div>

        <Tabs defaultValue="settings" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-card">
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="songs">Songs</TabsTrigger>
            <TabsTrigger value="nfts">NFTs</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="space-y-4">
            {/* Game Settings */}
            <Card className="bg-card border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SettingsIcon className="w-5 h-5" />
                  Game Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Game Duration (seconds)</Label>
                  <Input
                    type="number"
                    value={settings.game_duration_seconds || '30'}
                    onChange={(e) => updateSetting('game_duration_seconds', e.target.value)}
                    className="bg-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Minimum Stake</Label>
                  <Input
                    type="number"
                    value={settings.minimum_stake || '50'}
                    onChange={(e) => updateSetting('minimum_stake', e.target.value)}
                    className="bg-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Maximum Stake</Label>
                  <Input
                    type="number"
                    value={settings.max_stake || '10000'}
                    onChange={(e) => updateSetting('max_stake', e.target.value)}
                    className="bg-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Maintenance Mode</Label>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={settings.maintenance_mode === 'true'}
                      onCheckedChange={(checked) => updateSetting('maintenance_mode', checked.toString())}
                    />
                    <span className="text-sm text-muted-foreground">
                      {settings.maintenance_mode === 'true' ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Free Tokens Settings */}
            <Card className="bg-card border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="w-5 h-5" />
                  Free Tokens
                </CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Free Tokens Amount</Label>
                  <Input
                    type="number"
                    value={settings.free_credits_amount || '250'}
                    onChange={(e) => updateSetting('free_credits_amount', e.target.value)}
                    className="bg-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cooldown (hours)</Label>
                  <Input
                    type="number"
                    value={settings.free_credits_interval_hours || '24'}
                    onChange={(e) => updateSetting('free_credits_interval_hours', e.target.value)}
                    className="bg-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Referral Bonus</Label>
                  <Input
                    type="number"
                    value={settings.referral_bonus || '250'}
                    onChange={(e) => updateSetting('referral_bonus', e.target.value)}
                    className="bg-input"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Token Packages */}
            <Card className="bg-card border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="w-5 h-5" />
                  Token Packages (Store)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="grid grid-cols-2 gap-4 p-3 bg-background/50 rounded-lg">
                    <div className="space-y-2">
                      <Label>Package {i} - Tokens</Label>
                      <Input
                        type="number"
                        value={settings[`token_package_${i}_amount`] || ''}
                        onChange={(e) => updateSetting(`token_package_${i}_amount`, e.target.value)}
                        className="bg-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Package {i} - Price (ZAR)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={settings[`token_package_${i}_price`] || ''}
                        onChange={(e) => updateSetting(`token_package_${i}_price`, e.target.value)}
                        className="bg-input"
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Crypto Wallets */}
            <Card className="bg-card border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="w-5 h-5" />
                  Crypto Wallets
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Bitcoin (BTC) Wallet</Label>
                  <Input
                    value={settings.btc_wallet || ''}
                    onChange={(e) => updateSetting('btc_wallet', e.target.value)}
                    className="bg-input font-mono text-sm"
                    placeholder="Bitcoin address"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ethereum (ETH) Wallet</Label>
                  <Input
                    value={settings.eth_wallet || ''}
                    onChange={(e) => updateSetting('eth_wallet', e.target.value)}
                    className="bg-input font-mono text-sm"
                    placeholder="Ethereum address"
                  />
                </div>
                <div className="space-y-2">
                  <Label>USDT (TRC20) Wallet</Label>
                  <Input
                    value={settings.usdt_wallet || ''}
                    onChange={(e) => updateSetting('usdt_wallet', e.target.value)}
                    className="bg-input font-mono text-sm"
                    placeholder="USDT TRC20 address"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Premium Settings */}
            <Card className="bg-card border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="w-5 h-5" />
                  Premium Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Monthly Price (ZAR)</Label>
                  <Input
                    type="number"
                    value={settings.premium_monthly_price || '99'}
                    onChange={(e) => updateSetting('premium_monthly_price', e.target.value)}
                    className="bg-input"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Withdrawal Settings */}
            <Card className="bg-card border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="w-5 h-5" />
                  Withdrawal Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Minimum Withdrawal (ZAR)</Label>
                  <Input
                    type="number"
                    value={settings.min_withdrawal || '50'}
                    onChange={(e) => updateSetting('min_withdrawal', e.target.value)}
                    className="bg-input"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="songs" className="space-y-4">
            <Card className="bg-card border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Music className="w-5 h-5" />
                  Add New Song
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <MusicLinkExtractor 
                  onMetadataExtracted={(metadata) => {
                    setNewSong({ 
                      ...newSong, 
                      title: metadata.title, 
                      artist: metadata.artist,
                      platform: metadata.platform,
                      original_url: metadata.originalUrl,
                      icon: metadata.icon
                    });
                  }}
                />
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input value={newSong.title} onChange={(e) => setNewSong({ ...newSong, title: e.target.value })} className="bg-input" />
                  </div>
                  <div className="space-y-2">
                    <Label>Artist</Label>
                    <Input value={newSong.artist} onChange={(e) => setNewSong({ ...newSong, artist: e.target.value })} className="bg-input" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Lyrics Snippet (with blank)</Label>
                  <Textarea value={newSong.lyrics_snippet} onChange={(e) => setNewSong({ ...newSong, lyrics_snippet: e.target.value })} className="bg-input" rows={3} />
                </div>
                <div className="space-y-2">
                  <Label>Correct Answer</Label>
                  <Input value={newSong.answer} onChange={(e) => setNewSong({ ...newSong, answer: e.target.value })} className="bg-input" />
                </div>
                <Button onClick={addSong} className="bg-gradient-primary">Add Song</Button>
              </CardContent>
            </Card>

            <Card className="bg-card border-primary/20">
              <CardHeader>
                <CardTitle>Songs ({songs.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {songs.map((song) => (
                    <div key={song.id} className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                      <div>
                        <p className="font-semibold">{song.title} - {song.artist}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1">{song.lyrics_snippet}</p>
                      </div>
                      <Button variant="destructive" size="icon" onClick={() => deleteSong(song.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="nfts" className="space-y-4">
            <Card className="bg-card border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hexagon className="w-5 h-5" />
                  Add New NFT
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input value={newCosmetic.name} onChange={(e) => setNewCosmetic({ ...newCosmetic, name: e.target.value })} className="bg-input" />
                  </div>
                  <div className="space-y-2">
                    <Label>Emoji/Icon</Label>
                    <Input value={newCosmetic.image_url} onChange={(e) => setNewCosmetic({ ...newCosmetic, image_url: e.target.value })} className="bg-input" placeholder="🎨" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={newCosmetic.description} onChange={(e) => setNewCosmetic({ ...newCosmetic, description: e.target.value })} className="bg-input" />
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={newCosmetic.type} onValueChange={(v) => setNewCosmetic({ ...newCosmetic, type: v })}>
                      <SelectTrigger className="bg-input"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="avatar">Avatar</SelectItem>
                        <SelectItem value="profile_frame">Profile Frame</SelectItem>
                        <SelectItem value="victory_animation">Victory Animation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Rarity</Label>
                    <Select value={newCosmetic.rarity} onValueChange={(v) => setNewCosmetic({ ...newCosmetic, rarity: v })}>
                      <SelectTrigger className="bg-input"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="common">Common</SelectItem>
                        <SelectItem value="rare">Rare</SelectItem>
                        <SelectItem value="epic">Epic</SelectItem>
                        <SelectItem value="legendary">Legendary</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Price (Tokens)</Label>
                    <Input type="number" value={newCosmetic.price_credits} onChange={(e) => setNewCosmetic({ ...newCosmetic, price_credits: parseInt(e.target.value) || 0 })} className="bg-input" />
                  </div>
                </div>
                <Button onClick={addCosmetic} className="bg-gradient-primary">Add NFT</Button>
              </CardContent>
            </Card>

            <Card className="bg-card border-primary/20">
              <CardHeader>
                <CardTitle>NFTs ({cosmetics.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                  {cosmetics.map((c) => (
                    <div key={c.id} className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{c.image_url || '🎨'}</span>
                        <div>
                          <p className="font-semibold">{c.name}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">{c.rarity}</Badge>
                            <span className="text-xs text-muted-foreground">{c.price_credits} tokens</span>
                          </div>
                        </div>
                      </div>
                      <Button variant="destructive" size="icon" onClick={() => deleteCosmetic(c.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events" className="space-y-4">
            <Card className="bg-card border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Tournaments ({tournaments.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {tournaments.map((t) => (
                    <div key={t.id} className="p-3 bg-background/50 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">{t.name}</p>
                          <p className="text-sm text-muted-foreground">{t.description}</p>
                        </div>
                        <Badge>{t.status}</Badge>
                      </div>
                      <div className="mt-2 flex gap-4 text-sm text-muted-foreground">
                        <span>Entry: {t.entry_fee} tokens</span>
                        <span>Prize: {t.prize_pool} tokens</span>
                      </div>
                    </div>
                  ))}
                  {tournaments.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No tournaments yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Season Passes ({seasonPasses.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {seasonPasses.map((sp) => (
                    <div key={sp.id} className="p-3 bg-background/50 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">Season {sp.season_number}: {sp.name}</p>
                          <p className="text-sm text-muted-foreground">{sp.description}</p>
                        </div>
                        <Badge variant={sp.is_active ? 'default' : 'secondary'}>
                          {sp.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground">
                        Price: {sp.price_credits} tokens • Max Level: {sp.max_level}
                      </div>
                    </div>
                  ))}
                  {seasonPasses.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No season passes yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
