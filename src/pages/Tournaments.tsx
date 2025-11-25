import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, Clock, Coins } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Tournament {
  id: string;
  name: string;
  description: string;
  entry_fee: number;
  prize_pool: number;
  max_participants: number;
  start_time: string;
  end_time: string;
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  participant_count?: number;
  user_joined?: boolean;
}

export default function Tournaments() {
  const { user, profile } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTournaments();
  }, [user]);

  const fetchTournaments = async () => {
    try {
      const { data: tournamentsData, error } = await supabase
        .from('tournaments')
        .select('*')
        .order('start_time', { ascending: true });

      if (error) throw error;

      // Get participant counts
      const tournamentsWithCounts = await Promise.all(
        (tournamentsData || []).map(async (tournament) => {
          const { count } = await supabase
            .from('tournament_participants')
            .select('*', { count: 'exact', head: true })
            .eq('tournament_id', tournament.id);

          const { data: userParticipation } = await supabase
            .from('tournament_participants')
            .select('id')
            .eq('tournament_id', tournament.id)
            .eq('user_id', user?.id)
            .single();

          return {
            id: tournament.id,
            name: tournament.name,
            description: tournament.description,
            entry_fee: tournament.entry_fee,
            prize_pool: tournament.prize_pool,
            max_participants: tournament.max_participants,
            start_time: tournament.start_time,
            end_time: tournament.end_time,
            status: tournament.status as 'upcoming' | 'active' | 'completed' | 'cancelled',
            participant_count: count || 0,
            user_joined: !!userParticipation
          };
        })
      );

      setTournaments(tournamentsWithCounts);
    } catch (error) {
      console.error('Error fetching tournaments:', error);
    } finally {
      setLoading(false);
    }
  };

  const joinTournament = async (tournament: Tournament) => {
    if (!user || !profile) return;

    if (profile.credits < tournament.entry_fee) {
      toast.error('Insufficient credits');
      return;
    }

    try {
      // Deduct entry fee
      const { error: deductError } = await supabase.rpc('deduct_stake', {
        p_user_id: user.id,
        p_amount: tournament.entry_fee
      });

      if (deductError) throw deductError;

      // Join tournament
      const { error: joinError } = await supabase
        .from('tournament_participants')
        .insert({
          tournament_id: tournament.id,
          user_id: user.id
        });

      if (joinError) throw joinError;

      // Create transaction
      await supabase.from('transactions').insert({
        user_id: user.id,
        amount: -tournament.entry_fee,
        type: 'stake',
        description: `Tournament entry: ${tournament.name}`
      });

      toast.success(`Joined ${tournament.name}!`);
      fetchTournaments();
    } catch (error: any) {
      toast.error(error.message || 'Failed to join tournament');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      upcoming: "outline",
      active: "default",
      completed: "secondary",
      cancelled: "destructive"
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  if (loading) {
    return <div className="container mx-auto p-8">Loading tournaments...</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">Tournaments</h1>
        <p className="text-muted-foreground">
          Compete in tournaments to win big prizes and climb the leaderboards
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {tournaments.map((tournament) => (
          <Card key={tournament.id} className="flex flex-col">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle>{tournament.name}</CardTitle>
                {getStatusBadge(tournament.status)}
              </div>
              <CardDescription>{tournament.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-muted-foreground" />
                  <span>Entry: {tournament.entry_fee}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                  <span>Prize: {tournament.prize_pool}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {tournament.participant_count}/{tournament.max_participants || '∞'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{format(new Date(tournament.start_time), 'MMM dd')}</span>
                </div>
              </div>

              <div className="pt-4">
                {tournament.user_joined ? (
                  <Button className="w-full" disabled>
                    Joined
                  </Button>
                ) : tournament.status === 'upcoming' ? (
                  <Button
                    className="w-full"
                    onClick={() => joinTournament(tournament)}
                    disabled={
                      !profile ||
                      profile.credits < tournament.entry_fee ||
                      (tournament.max_participants &&
                        tournament.participant_count >= tournament.max_participants)
                    }
                  >
                    Join Tournament
                  </Button>
                ) : (
                  <Button className="w-full" disabled>
                    {tournament.status === 'active' ? 'In Progress' : 'Ended'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {tournaments.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No tournaments available at the moment. Check back soon!
          </CardContent>
        </Card>
      )}
    </div>
  );
}
