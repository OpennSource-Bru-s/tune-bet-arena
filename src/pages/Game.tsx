import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Timer, Users, Trophy } from 'lucide-react';
import GameChat from '@/components/GameChat';
import { useGameAnalytics } from '@/hooks/useGameAnalytics';

const Game = () => {
  const { gameId } = useParams();
  const { user, refreshProfile } = useAuth();
  const { settings } = useSettings();
  const [game, setGame] = useState<any>(null);
  const [song, setSong] = useState<any>(null);
  const [answer, setAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState(settings.game_duration_seconds);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const navigate = useNavigate();
  const { toast } = useToast();
  const { trackGameEvent, updateGameAnalytics, updateUserStats } = useGameAnalytics();

  // Update timer when settings load
  useEffect(() => {
    if (!hasAnswered && game?.status !== 'in_progress') {
      setTimeLeft(settings.game_duration_seconds);
    }
  }, [settings.game_duration_seconds]);

  useEffect(() => {
    if (!gameId) return;

    loadGame();

    const channel = supabase
      .channel(`game-${gameId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'games', filter: `id=eq.${gameId}` }, () => {
        loadGame();
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsReconnecting(false);
          reconnectAttempts.current = 0;
        } else if (status === 'CHANNEL_ERROR') {
          handleReconnect();
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId]);

  const handleReconnect = async () => {
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      toast({
        title: 'Connection Lost',
        description: 'Unable to reconnect. Please refresh the page.',
        variant: 'destructive',
      });
      return;
    }

    setIsReconnecting(true);
    reconnectAttempts.current += 1;

    setTimeout(() => {
      loadGame();
    }, 2000 * reconnectAttempts.current);
  };

  useEffect(() => {
    if (game?.status === 'in_progress' && timeLeft > 0 && !hasAnswered) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !hasAnswered) {
      submitAnswer();
    }
  }, [timeLeft, game, hasAnswered]);

  const loadGame = async () => {
    try {
      if (user && gameId) {
        await trackGameEvent(gameId, user.id, 'page_load', { timestamp: new Date().toISOString() });
      }

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
    } catch (error) {
      console.error('Error loading game:', error);
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

    await trackGameEvent(gameId!, user!.id, 'answer_submitted', {
      answer: answer,
      is_correct: isCorrect,
      time_taken: timeTaken,
    });

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

      // Update analytics before completing game
      if (song) {
        await updateGameAnalytics(gameId!, song.id, participants);
      }

      // Update user statistics
      for (const participant of participants) {
        if (participant.time_taken) {
          await updateUserStats(
            participant.user_id,
            participant.user_id === winnerId,
            participant.time_taken
          );
        }
      }

      // Use secure server-side function for credit distribution and game completion
      const { error: completionError } = await supabase.rpc('complete_game', {
        p_game_id: gameId,
        p_winner_id: winnerId
      });

      if (completionError) {
        console.error('Error completing game:', completionError);
        toast({
          title: "Error",
          description: "Failed to complete the game. Please contact support.",
          variant: "destructive"
        });
        return;
      }
    }
  };

  const handleGameEnd = async (gameData: any) => {
    await refreshProfile();
    
    const isWinner = gameData.winner_id === user?.id;
    const totalPot = gameData.stake_amount * 2;
    const rakeAmount = Math.floor(totalPot * (settings.game_rake_percentage / 100));
    const winnerPayout = totalPot - rakeAmount;
    
    toast({
      title: isWinner ? "Victory!" : "Game Over",
      description: isWinner 
        ? `You won ${winnerPayout} credits! (${settings.game_rake_percentage}% platform fee applied)` 
        : "Better luck next time!",
      variant: isWinner ? "default" : "destructive",
    });

    setTimeout(() => navigate('/'), 3000);
  };

  if (!game) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <p className="text-foreground">
          {isReconnecting ? 'Reconnecting...' : 'Loading game...'}
        </p>
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
    const totalPot = game.stake_amount * 2;
    const rakeAmount = Math.floor(totalPot * (settings.game_rake_percentage / 100));
    const winnerPayout = totalPot - rakeAmount;
    
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
                ? `You won ${winnerPayout} credits!`
                : 'Better luck next time!'}
            </p>
            {isWinner && (
              <p className="text-xs text-muted-foreground">
                ({settings.game_rake_percentage}% platform fee: {rakeAmount} credits)
              </p>
            )}
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

  const totalPot = game.stake_amount * 2;
  const rakeAmount = Math.floor(totalPot * (settings.game_rake_percentage / 100));
  const potentialWinnings = totalPot - rakeAmount;

  return (
    <div className="min-h-screen bg-gradient-hero p-4">
      <div className="max-w-6xl mx-auto grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="bg-card border-primary/20 shadow-glow">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-2xl">Guess the Lyrics!</CardTitle>
                <div className="flex items-center gap-4">
                  <div className="text-xs text-muted-foreground text-right">
                    <span className="block">Win: {potentialWinnings} credits</span>
                    <span className="block">({settings.game_rake_percentage}% fee)</span>
                  </div>
                  <div className="flex items-center gap-2 text-accent">
                    <Timer className="w-5 h-5" />
                    <span className="text-2xl font-bold">{timeLeft}s</span>
                  </div>
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
                    onKeyDown={(e) => e.key === 'Enter' && submitAnswer()}
                    placeholder="Type the next line of the lyrics..."
                    className="text-lg bg-background/50 border-primary/20"
                  />
                  <Button 
                    onClick={submitAnswer} 
                    className="w-full bg-gradient-primary hover:opacity-90"
                  >
                    Submit Answer
                  </Button>
                </div>
              ) : (
                <div className="text-center p-6 bg-secondary/20 rounded-lg">
                  <p className="text-lg">Waiting for opponent to answer...</p>
                  <div className="mt-4 flex justify-center items-center gap-2">
                    <Users className="w-5 h-5" />
                    <span className="text-sm text-muted-foreground">
                      {game?.game_participants?.length || 0} players in game
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-1">
          <GameChat gameId={gameId!} />
        </div>
      </div>
    </div>
  );
};

export default Game;
