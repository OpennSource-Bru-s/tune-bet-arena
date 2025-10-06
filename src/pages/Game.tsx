import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Timer, Users, Trophy } from 'lucide-react';

const Game = () => {
  const { gameId } = useParams();
  const { user, refreshProfile } = useAuth();
  const [game, setGame] = useState<any>(null);
  const [song, setSong] = useState<any>(null);
  const [answer, setAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState(30);
  const [hasAnswered, setHasAnswered] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!gameId) return;

    loadGame();

    const channel = supabase
      .channel(`game-${gameId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'games', filter: `id=eq.${gameId}` }, () => {
        loadGame();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId]);

  useEffect(() => {
    if (game?.status === 'in_progress' && timeLeft > 0 && !hasAnswered) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !hasAnswered) {
      submitAnswer();
    }
  }, [timeLeft, game, hasAnswered]);

  const loadGame = async () => {
    const { data: gameData } = await supabase
      .from('games')
      .select(`
        *,
        songs (*),
        game_participants (
          *,
          profiles (username)
        )
      `)
      .eq('id', gameId)
      .single();

    if (gameData) {
      setGame(gameData);
      if (gameData.songs) {
        setSong(gameData.songs);
      }

      if (gameData.game_participants?.length === 2 && gameData.status === 'waiting') {
        startGame(gameData);
      }

      if (gameData.status === 'completed') {
        handleGameEnd(gameData);
      }
    }
  };

  const startGame = async (gameData: any) => {
    const { data: randomSong } = await supabase
      .from('songs')
      .select('*')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (randomSong) {
      await supabase
        .from('games')
        .update({
          status: 'in_progress',
          song_id: randomSong.id,
          started_at: new Date().toISOString(),
        })
        .eq('id', gameData.id);
    }
  };

  const submitAnswer = async () => {
    if (hasAnswered) return;
    setHasAnswered(true);

    const participant = game.game_participants.find((p: any) => p.user_id === user?.id);
    const timeTaken = 30 - timeLeft;
    const isCorrect = answer.trim().toLowerCase() === song?.answer.toLowerCase();

    await supabase
      .from('game_participants')
      .update({
        answer_text: answer,
        answered_at: new Date().toISOString(),
        is_correct: isCorrect,
        time_taken: timeTaken,
      })
      .eq('id', participant.id);

    checkGameCompletion();
  };

  const checkGameCompletion = async () => {
    const { data: participants } = await supabase
      .from('game_participants')
      .select('*')
      .eq('game_id', gameId);

    const allAnswered = participants?.every(p => p.answered_at !== null);
    
    if (allAnswered && participants) {
      const correctAnswers = participants.filter(p => p.is_correct);
      
      let winnerId = null;
      if (correctAnswers.length === 1) {
        winnerId = correctAnswers[0].user_id;
      } else if (correctAnswers.length === 2) {
        winnerId = correctAnswers.reduce((fastest, current) =>
          current.time_taken < fastest.time_taken ? current : fastest
        ).user_id;
      }

      await supabase
        .from('games')
        .update({
          status: 'completed',
          winner_id: winnerId,
          completed_at: new Date().toISOString(),
        })
        .eq('id', gameId);

      if (winnerId) {
        const winAmount = game.stake_amount * 2;
        const { data: winner } = await supabase
          .from('profiles')
          .select('credits, total_wins, total_games')
          .eq('id', winnerId)
          .single();

        if (winner) {
          await supabase
            .from('profiles')
            .update({
              credits: winner.credits + winAmount,
              total_wins: winner.total_wins + 1,
              total_games: winner.total_games + 1,
            })
            .eq('id', winnerId);

          await supabase
            .from('transactions')
            .insert({
              user_id: winnerId,
              amount: winAmount,
              type: 'win',
              game_id: gameId,
              description: `Won ${winAmount} credits`,
            });
        }

        const loserId = participants.find(p => p.user_id !== winnerId)?.user_id;
        if (loserId) {
          const { data: loser } = await supabase
            .from('profiles')
            .select('total_games')
            .eq('id', loserId)
            .single();

          if (loser) {
            await supabase
              .from('profiles')
              .update({
                total_games: loser.total_games + 1,
              })
              .eq('id', loserId);
          }
        }
      }
    }
  };

  const handleGameEnd = async (gameData: any) => {
    await refreshProfile();
    
    const isWinner = gameData.winner_id === user?.id;
    toast({
      title: isWinner ? "Victory!" : "Game Over",
      description: isWinner 
        ? `You won ${gameData.stake_amount * 2} credits!` 
        : "Better luck next time!",
      variant: isWinner ? "default" : "destructive",
    });

    setTimeout(() => navigate('/'), 3000);
  };

  if (!game) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <p className="text-foreground">Loading game...</p>
      </div>
    );
  }

  if (game.status === 'waiting') {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-card border-primary/20 shadow-glow">
          <CardHeader>
            <CardTitle className="text-center">Waiting for Players</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <Users className="w-16 h-16 mx-auto text-primary" />
            <p className="text-muted-foreground">
              {game.game_participants?.length}/2 players joined
            </p>
            <p className="text-sm">Waiting for another player to join...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (game.status === 'completed') {
    const isWinner = game.winner_id === user?.id;
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-card border-primary/20 shadow-glow">
          <CardHeader>
            <CardTitle className="text-center">
              {isWinner ? '🎉 You Won!' : 'Game Over'}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <Trophy className={`w-24 h-24 mx-auto ${isWinner ? 'text-secondary' : 'text-muted-foreground'}`} />
            <p className="text-xl">
              {isWinner 
                ? `You won ${game.stake_amount * 2} credits!`
                : 'Better luck next time!'}
            </p>
            <p className="text-sm text-muted-foreground">
              Correct answer: <span className="text-foreground font-semibold">{song?.answer}</span>
            </p>
            <Button onClick={() => navigate('/')} className="bg-gradient-primary hover:opacity-90">
              Back to Lobby
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full bg-card border-primary/20 shadow-glow">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl">Guess the Lyrics!</CardTitle>
            <div className="flex items-center gap-2 text-accent">
              <Timer className="w-5 h-5" />
              <span className="text-2xl font-bold">{timeLeft}s</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Song: {song?.title} by {song?.artist}</p>
            <div className="p-6 bg-gradient-card border border-primary/20 rounded-lg">
              <p className="text-lg text-center italic">{song?.lyrics_snippet}</p>
            </div>
          </div>

          {!hasAnswered ? (
            <div className="space-y-4">
              <Input
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type the missing lyrics..."
                className="text-lg bg-input border-border"
                onKeyPress={(e) => e.key === 'Enter' && submitAnswer()}
                autoFocus
              />
              <Button 
                onClick={submitAnswer}
                className="w-full bg-gradient-primary hover:opacity-90"
              >
                Submit Answer
              </Button>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-lg text-muted-foreground">Answer submitted! Waiting for other player...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Game;
