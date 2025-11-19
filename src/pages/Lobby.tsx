import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Coins, Trophy, User, LogOut, Settings, ShoppingCart, Shield, Compass, Mic2, Menu } from 'lucide-react';

const Lobby = () => {
  const { user, profile, isAdmin, signOut, refreshProfile } = useAuth();
  const [stakeAmount, setStakeAmount] = useState(50);
  const [activeGames, setActiveGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadActiveGames();
    
    const channel = supabase
      .channel('games-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'games' }, () => {
        loadActiveGames();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadActiveGames = async () => {
    const { data } = await supabase
      .from('games')
      .select(`
        *,
        game_participants (
          user_id,
          profiles (username)
        )
      `)
      .in('status', ['waiting', 'in_progress'])
      .order('created_at', { ascending: false });
    
    if (data) {
      setActiveGames(data);
    }
  };

  const createGame = async () => {
    if (!profile || !user) return;

    setLoading(true);
    try {
      // Atomically deduct credits before creating game
      const { data: deducted, error: deductError } = await supabase.rpc('deduct_stake', {
        p_user_id: user.id,
        p_amount: stakeAmount
      });

      if (deductError) throw deductError;

      if (!deducted) {
        toast({
          title: "Insufficient credits",
          description: "You don't have enough credits for this stake.",
          variant: "destructive",
        });
        return;
      }

      // Credits deducted successfully, now create game
      const { data: game, error } = await supabase
        .from('games')
        .insert({
          stake_amount: stakeAmount,
          status: 'waiting',
        })
        .select()
        .single();

      if (error) throw error;

      await supabase
        .from('game_participants')
        .insert({
          game_id: game.id,
          user_id: user.id,
        });

      await refreshProfile();
      
      navigate(`/game/${game.id}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const joinGame = async (gameId: string, stakeAmount: number) => {
    if (!profile || !user) return;

    try {
      // Atomically deduct credits before joining game
      const { data: deducted, error: deductError } = await supabase.rpc('deduct_stake', {
        p_user_id: user.id,
        p_amount: stakeAmount
      });

      if (deductError) throw deductError;

      if (!deducted) {
        toast({
          title: "Insufficient credits",
          description: "You don't have enough credits to join this game.",
          variant: "destructive",
        });
        return;
      }

      // Credits deducted successfully, now join game
      await supabase
        .from('game_participants')
        .insert({
          game_id: gameId,
          user_id: user.id,
        });

      await refreshProfile();
      navigate(`/game/${gameId}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleClaimFreeCredits = async () => {
    try {
      const { data, error } = await supabase.rpc('claim_free_credits');
      
      if (error) throw error;
      
      const result = data as { success: boolean; message: string; new_balance?: number; next_claim_at?: string };
      
      if (result.success) {
        toast({
          title: "Success!",
          description: result.message,
        });
        await refreshProfile();
      } else {
        toast({
          title: "Unable to Claim",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to claim free credits",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          {/* Mobile Menu */}
          <div className="flex items-center gap-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] bg-card border-primary/20">
                <SheetHeader>
                  <SheetTitle className="text-left">Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-3 mt-6">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/dashboard')}
                    className="justify-start"
                  >
                    <Compass className="w-4 h-4 mr-2" />
                    Discover
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/streaming')}
                    className="justify-start"
                  >
                    <Mic2 className="w-4 h-4 mr-2" />
                    Artists
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/store')}
                    className="justify-start"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Store
                  </Button>
                  {isAdmin && (
                    <Button 
                      variant="outline" 
                      onClick={() => navigate('/admin')}
                      className="justify-start"
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Admin Portal
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    onClick={signOut}
                    className="justify-start"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
            
            <h1 className="text-2xl md:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Lyric Battle
            </h1>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex gap-2">
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              <Compass className="w-4 h-4 mr-2" />
              Discover
            </Button>
            <Button variant="outline" onClick={() => navigate('/streaming')}>
              <Mic2 className="w-4 h-4 mr-2" />
              Artists
            </Button>
            <Button variant="outline" onClick={() => navigate('/store')}>
              <ShoppingCart className="w-4 h-4 mr-2" />
              Store
            </Button>
            {isAdmin && (
              <Button variant="outline" onClick={() => navigate('/admin')}>
                <Shield className="w-4 h-4 mr-2" />
                Admin Portal
              </Button>
            )}
            <Button variant="outline" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Card className="bg-gradient-card border-primary/20">
            <CardHeader className="flex flex-row items-center space-y-0 space-x-3 pb-2">
              <Coins className="w-8 h-8 text-primary" />
              <div>
                <CardDescription>Your Credits</CardDescription>
                <CardTitle className="text-3xl">{profile?.credits || 0}</CardTitle>
              </div>
            </CardHeader>
            {profile?.credits === 0 && (
              <CardContent className="pt-0">
                <Button 
                  onClick={handleClaimFreeCredits}
                  className="w-full bg-gradient-primary hover:opacity-90"
                  size="sm"
                >
                  <Coins className="w-4 h-4 mr-2" />
                  Claim 250 Free Credits
                </Button>
              </CardContent>
            )}
          </Card>

          <Card className="bg-gradient-card border-primary/20">
            <CardHeader className="flex flex-row items-center space-y-0 space-x-3 pb-2">
              <Trophy className="w-8 h-8 text-secondary" />
              <div>
                <CardDescription>Total Wins</CardDescription>
                <CardTitle className="text-3xl">{profile?.total_wins || 0}</CardTitle>
              </div>
            </CardHeader>
          </Card>

          <Card className="bg-gradient-card border-primary/20">
            <CardHeader className="flex flex-row items-center space-y-0 space-x-3 pb-2">
              <User className="w-8 h-8 text-accent" />
              <div>
                <CardDescription>Games Played</CardDescription>
                <CardTitle className="text-3xl">{profile?.total_games || 0}</CardTitle>
              </div>
            </CardHeader>
          </Card>
        </div>

        <Card className="bg-card border-primary/20 shadow-card">
          <CardHeader>
            <CardTitle>Create New Game</CardTitle>
            <CardDescription>Set your stake and challenge players</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="stake">Stake Amount</Label>
              <Input
                id="stake"
                type="number"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(Number(e.target.value))}
                min={10}
                max={profile?.credits || 0}
                className="bg-input border-border"
              />
            </div>
            <Button 
              onClick={createGame} 
              disabled={loading}
              className="w-full bg-gradient-primary hover:opacity-90"
            >
              {loading ? 'Creating...' : `Create Game (${stakeAmount} Credits)`}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card border-primary/20 shadow-card">
          <CardHeader>
            <CardTitle>Available Games</CardTitle>
            <CardDescription>Join an existing game or wait for players</CardDescription>
          </CardHeader>
          <CardContent>
            {activeGames.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No active games. Be the first to create one!</p>
            ) : (
              <div className="space-y-2">
                {activeGames.map((game) => (
                  <div
                    key={game.id}
                    className="flex items-center justify-between p-4 bg-gradient-card border border-primary/20 rounded-lg"
                  >
                    <div>
                      <p className="font-semibold">Stake: {game.stake_amount} credits</p>
                      <p className="text-sm text-muted-foreground">
                        {game.game_participants?.length || 0}/2 players
                      </p>
                    </div>
                    {game.game_participants?.some((p: any) => p.user_id === user?.id) ? (
                      <Button
                        onClick={() => navigate(`/game/${game.id}`)}
                        variant="outline"
                      >
                        View Game
                      </Button>
                    ) : (
                      <Button
                        onClick={() => joinGame(game.id, game.stake_amount)}
                        disabled={game.game_participants?.length >= 2}
                        className="bg-gradient-primary hover:opacity-90"
                      >
                        Join Game
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Lobby;
