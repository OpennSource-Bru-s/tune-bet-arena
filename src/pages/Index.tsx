import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Zap, Music, Trophy, Coins } from 'lucide-react';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (user) {
        navigate('/lobby');
      }
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero">
        <p className="text-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center space-y-8">
          <div className="inline-block p-4 bg-gradient-primary rounded-3xl shadow-glow">
            <Zap className="w-16 h-16 text-white" />
          </div>
          
          <h1 className="text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Lyric Battle
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Challenge players in intense 30-second lyrics guessing battles. 
            Stake your credits, prove your music knowledge, and win big!
          </p>

          <div className="flex justify-center gap-4 pt-8">
            <Button 
              onClick={() => navigate('/auth')}
              size="lg"
              className="bg-gradient-primary hover:opacity-90 text-lg px-8"
            >
              Get Started
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-6 pt-16 max-w-4xl mx-auto">
            <div className="bg-gradient-card border border-primary/20 rounded-xl p-6 space-y-3">
              <Music className="w-12 h-12 text-primary mx-auto" />
              <h3 className="text-xl font-semibold">Quick Battles</h3>
              <p className="text-muted-foreground text-sm">
                30-second rounds to test your lyrics knowledge
              </p>
            </div>

            <div className="bg-gradient-card border border-primary/20 rounded-xl p-6 space-y-3">
              <Coins className="w-12 h-12 text-secondary mx-auto" />
              <h3 className="text-xl font-semibold">Stake & Win</h3>
              <p className="text-muted-foreground text-sm">
                Bet credits and win double if you're faster and correct
              </p>
            </div>

            <div className="bg-gradient-card border border-primary/20 rounded-xl p-6 space-y-3">
              <Trophy className="w-12 h-12 text-accent mx-auto" />
              <h3 className="text-xl font-semibold">Compete</h3>
              <p className="text-muted-foreground text-sm">
                Climb the leaderboard and become a lyric champion
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
