import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Trophy, Music, Target, Award, ArrowLeft } from 'lucide-react';

type Song = {
  id: string;
  title: string;
  artist: string;
  difficulty: string;
  gameCount?: number;
};

type Player = {
  id: string;
  display_name: string | null;
  username: string;
  total_wins: number;
  total_games: number;
  credits: number;
};

type Category = {
  name: string;
  difficulty: string;
  count: number;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [trendingSongs, setTrendingSongs] = useState<Song[]>([]);
  const [topPlayers, setTopPlayers] = useState<Player[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Fetch trending songs
      const { data: songs } = await supabase
        .from('songs')
        .select('*')
        .eq('is_active', true)
        .limit(6);

      if (songs) {
        setTrendingSongs(songs);
        
        // Calculate categories from songs
        const difficultyMap = songs.reduce((acc, song) => {
          const diff = song.difficulty || 'medium';
          acc[diff] = (acc[diff] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const cats: Category[] = Object.entries(difficultyMap).map(([difficulty, count]) => ({
          name: difficulty.charAt(0).toUpperCase() + difficulty.slice(1),
          difficulty,
          count,
        }));
        setCategories(cats);
      }

      // Fetch top players
      const { data: players } = await supabase
        .from('profiles')
        .select('*')
        .order('total_wins', { ascending: false })
        .limit(10);

      if (players) {
        setTopPlayers(players);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'hard':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Discover</h1>
            <p className="text-muted-foreground mt-1">Explore trending content and top players</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/lobby')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Lobby
          </Button>
        </div>

        {/* Trending Songs */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Music className="h-5 w-5 text-primary" />
              <CardTitle>Trending Songs</CardTitle>
            </div>
            <CardDescription>Popular tracks in the game</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {trendingSongs.map((song) => (
                  <Card key={song.id} className="hover:border-primary/50 transition-colors cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 flex-1 min-w-0">
                          <h3 className="font-semibold truncate">{song.title}</h3>
                          <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
                        </div>
                        <Badge variant="outline" className={getDifficultyColor(song.difficulty)}>
                          {song.difficulty}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Players & Categories Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Players */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                <CardTitle>Leaderboard</CardTitle>
              </div>
              <CardDescription>Top players by wins</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {topPlayers.map((player, index) => (
                    <div
                      key={player.id}
                      className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                        index === 0 ? 'bg-yellow-500 text-yellow-950' :
                        index === 1 ? 'bg-gray-400 text-gray-950' :
                        index === 2 ? 'bg-orange-600 text-orange-950' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{player.display_name || player.username}</p>
                        <p className="text-sm text-muted-foreground">
                          {player.total_wins} wins • {player.total_games} games
                        </p>
                      </div>
                      <Badge variant="secondary">{player.credits} credits</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Categories */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                <CardTitle>Categories</CardTitle>
              </div>
              <CardDescription>Song difficulty levels</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-20" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {categories.map((category) => (
                    <Card key={category.difficulty} className="hover:border-primary/50 transition-colors cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{category.name}</h3>
                            <p className="text-sm text-muted-foreground">{category.count} songs available</p>
                          </div>
                          <Badge variant="outline" className={getDifficultyColor(category.difficulty)}>
                            {category.difficulty}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Challenges */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              <CardTitle>Challenges</CardTitle>
            </div>
            <CardDescription>Special achievements and milestones</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-2 border-primary/20 hover:border-primary/50 transition-colors cursor-pointer">
                <CardContent className="p-6 text-center">
                  <Trophy className="h-8 w-8 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold mb-1">Win Streak</h3>
                  <p className="text-sm text-muted-foreground">Win 5 games in a row</p>
                  <Badge variant="outline" className="mt-3">In Progress</Badge>
                </CardContent>
              </Card>
              <Card className="border-2 border-primary/20 hover:border-primary/50 transition-colors cursor-pointer">
                <CardContent className="p-6 text-center">
                  <Music className="h-8 w-8 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold mb-1">Music Master</h3>
                  <p className="text-sm text-muted-foreground">Win on all difficulty levels</p>
                  <Badge variant="outline" className="mt-3">Locked</Badge>
                </CardContent>
              </Card>
              <Card className="border-2 border-primary/20 hover:border-primary/50 transition-colors cursor-pointer">
                <CardContent className="p-6 text-center">
                  <Target className="h-8 w-8 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold mb-1">Speed Demon</h3>
                  <p className="text-sm text-muted-foreground">Answer in under 3 seconds</p>
                  <Badge variant="outline" className="mt-3">Locked</Badge>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
