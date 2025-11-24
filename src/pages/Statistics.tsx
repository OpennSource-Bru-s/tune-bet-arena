import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, TrendingUp, Clock, Trophy, Target, Zap } from 'lucide-react';

const Statistics = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [recentGames, setRecentGames] = useState<any[]>([]);
  const [topSongs, setTopSongs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load user statistics
      const { data: userStats } = await supabase
        .from('user_statistics')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setStats(userStats);

      // Load recent games
      const { data: games } = await supabase
        .from('game_participants')
        .select(`
          *,
          games (
            id,
            status,
            completed_at,
            songs (title, artist)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      setRecentGames(games || []);

      // Load most played songs
      const { data: songs } = await supabase
        .from('songs')
        .select('title, artist, times_played, win_rate')
        .order('times_played', { ascending: false })
        .limit(5);

      setTopSongs(songs || []);
    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-lg">Loading statistics...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/lobby')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Lobby
          </Button>
          <h1 className="text-3xl font-bold">Your Statistics</h1>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Games</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_games_played || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.win_rate?.toFixed(1) || 0}%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.average_response_time || 0}s</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Win Streak</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.current_win_streak || 0}</div>
              <p className="text-xs text-muted-foreground">
                Best: {stats?.longest_win_streak || 0}
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="recent" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="recent">Recent Games</TabsTrigger>
            <TabsTrigger value="songs">Popular Songs</TabsTrigger>
          </TabsList>

          <TabsContent value="recent" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Game History</CardTitle>
                <CardDescription>Your last 10 games</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentGames.map((game) => (
                    <div
                      key={game.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium">
                          {game.games?.songs?.title || 'Unknown Song'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {game.games?.songs?.artist || 'Unknown Artist'}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          {game.is_correct !== null && (
                            <div className={`font-medium ${game.is_correct ? 'text-green-500' : 'text-red-500'}`}>
                              {game.is_correct ? 'Correct' : 'Wrong'}
                            </div>
                          )}
                          {game.time_taken && (
                            <div className="text-sm text-muted-foreground">
                              {game.time_taken}s
                            </div>
                          )}
                        </div>
                        {game.is_correct && game.time_taken && game.time_taken <= 5 && (
                          <Target className="w-5 h-5 text-yellow-500" />
                        )}
                      </div>
                    </div>
                  ))}
                  {recentGames.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No games played yet
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="songs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Most Popular Songs</CardTitle>
                <CardDescription>Songs played most often</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topSongs.map((song, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{song.title}</p>
                        <p className="text-sm text-muted-foreground">{song.artist}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{song.times_played} plays</div>
                        <div className="text-sm text-muted-foreground">
                          {song.win_rate?.toFixed(1) || 0}% win rate
                        </div>
                      </div>
                    </div>
                  ))}
                  {topSongs.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No songs available
                    </p>
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

export default Statistics;
