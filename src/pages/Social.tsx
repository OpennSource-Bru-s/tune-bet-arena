import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Trophy, Users, Target, Bell, ArrowLeft, UserPlus, Check, X } from "lucide-react";

interface Friend {
  id: string;
  friend_id: string;
  status: string;
  friend: {
    username: string;
    display_name: string;
    elo_rating: number;
    total_wins: number;
  };
}

interface Achievement {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlocked_at?: string;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  created_at: string;
}

const Social = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<Friend[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [searchUsername, setSearchUsername] = useState("");
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    
    loadFriends();
    loadAchievements();
    loadNotifications();
    loadLeaderboard();
    
    // Subscribe to notifications
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        setNotifications(prev => [payload.new as Notification, ...prev]);
        toast.success(payload.new.title, { description: payload.new.message });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, navigate]);

  const loadFriends = async () => {
    const { data, error } = await supabase
      .from('friendships')
      .select(`
        id,
        friend_id,
        status,
        friend:profiles!friendships_friend_id_fkey(username, display_name, elo_rating, total_wins)
      `)
      .eq('user_id', user!.id)
      .eq('status', 'accepted');

    if (!error && data) setFriends(data);

    const { data: requests } = await supabase
      .from('friendships')
      .select(`
        id,
        user_id,
        status,
        friend:profiles!friendships_user_id_fkey(username, display_name, elo_rating, total_wins)
      `)
      .eq('friend_id', user!.id)
      .eq('status', 'pending');

    if (requests) setFriendRequests(requests as any);
  };

  const loadAchievements = async () => {
    const { data: allAchievements } = await supabase
      .from('achievements')
      .select('*');

    const { data: userAchievements } = await supabase
      .from('user_achievements')
      .select('achievement_id, unlocked_at')
      .eq('user_id', user!.id);

    if (allAchievements) {
      const achievementsWithStatus = allAchievements.map(achievement => ({
        ...achievement,
        unlocked: userAchievements?.some(ua => ua.achievement_id === achievement.id) || false,
        unlocked_at: userAchievements?.find(ua => ua.achievement_id === achievement.id)?.unlocked_at
      }));
      setAchievements(achievementsWithStatus);
    }
  };

  const loadNotifications = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (data) setNotifications(data);
  };

  const loadLeaderboard = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('username, display_name, elo_rating, total_wins, total_games')
      .order('elo_rating', { ascending: false })
      .limit(10);

    if (data) setLeaderboard(data);
  };

  const sendFriendRequest = async () => {
    if (!searchUsername.trim()) return;

    const { data: targetUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', searchUsername.trim())
      .single();

    if (!targetUser) {
      toast.error("User not found");
      return;
    }

    if (targetUser.id === user!.id) {
      toast.error("You can't add yourself");
      return;
    }

    const { error } = await supabase
      .from('friendships')
      .insert({ user_id: user!.id, friend_id: targetUser.id });

    if (error) {
      toast.error("Failed to send friend request");
    } else {
      toast.success("Friend request sent!");
      setSearchUsername("");
      
      await supabase.from('notifications').insert({
        user_id: targetUser.id,
        type: 'friend_request',
        title: 'New Friend Request',
        message: `${user?.user_metadata?.username || 'Someone'} sent you a friend request!`
      });
    }
  };

  const handleFriendRequest = async (friendshipId: string, accept: boolean) => {
    const { error } = await supabase
      .from('friendships')
      .update({ status: accept ? 'accepted' : 'rejected' })
      .eq('id', friendshipId);

    if (!error) {
      toast.success(accept ? "Friend request accepted!" : "Friend request rejected");
      loadFriends();
    }
  };

  const markAsRead = async (notificationId: string) => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);
    
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 p-4">
      <div className="max-w-6xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/lobby")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Lobby
        </Button>

        <Tabs defaultValue="friends" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="friends">
              <Users className="mr-2 h-4 w-4" />
              Friends
            </TabsTrigger>
            <TabsTrigger value="achievements">
              <Trophy className="mr-2 h-4 w-4" />
              Achievements
            </TabsTrigger>
            <TabsTrigger value="leaderboard">
              <Target className="mr-2 h-4 w-4" />
              Leaderboard
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="mr-2 h-4 w-4" />
              Notifications
              {notifications.filter(n => !n.read).length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {notifications.filter(n => !n.read).length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="friends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Add Friends</CardTitle>
                <CardDescription>Search for players by username</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter username"
                    value={searchUsername}
                    onChange={(e) => setSearchUsername(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendFriendRequest()}
                  />
                  <Button onClick={sendFriendRequest}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add
                  </Button>
                </div>
              </CardContent>
            </Card>

            {friendRequests.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Friend Requests</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {friendRequests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                      <div>
                        <p className="font-medium">{request.friend.display_name || request.friend.username}</p>
                        <p className="text-sm text-muted-foreground">ELO: {request.friend.elo_rating}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleFriendRequest(request.id, true)}>
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleFriendRequest(request.id, false)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Your Friends ({friends.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {friends.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No friends yet. Add some!</p>
                ) : (
                  friends.map((friend) => (
                    <div key={friend.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                      <div>
                        <p className="font-medium">{friend.friend.display_name || friend.friend.username}</p>
                        <p className="text-sm text-muted-foreground">
                          ELO: {friend.friend.elo_rating} • Wins: {friend.friend.total_wins}
                        </p>
                      </div>
                      <Button size="sm">Challenge</Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {achievements.map((achievement) => (
                <Card key={achievement.id} className={achievement.unlocked ? 'border-primary' : 'opacity-60'}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-3xl">{achievement.icon}</span>
                      {achievement.name}
                      {achievement.unlocked && <Badge variant="default">Unlocked</Badge>}
                    </CardTitle>
                    <CardDescription>{achievement.description}</CardDescription>
                  </CardHeader>
                  {achievement.unlocked && achievement.unlocked_at && (
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Unlocked: {new Date(achievement.unlocked_at).toLocaleDateString()}
                      </p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="leaderboard">
            <Card>
              <CardHeader>
                <CardTitle>Top Players</CardTitle>
                <CardDescription>Ranked by ELO rating</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {leaderboard.map((player, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold">#{index + 1}</span>
                        <div>
                          <p className="font-medium">{player.display_name || player.username}</p>
                          <p className="text-sm text-muted-foreground">
                            {player.total_wins} wins / {player.total_games} games
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-lg">
                        {player.elo_rating} ELO
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-2">
            {notifications.length === 0 ? (
              <Card>
                <CardContent className="py-8">
                  <p className="text-center text-muted-foreground">No notifications</p>
                </CardContent>
              </Card>
            ) : (
              notifications.map((notification) => (
                <Card 
                  key={notification.id} 
                  className={notification.read ? 'opacity-60' : ''}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {notification.title}
                      {!notification.read && <Badge>New</Badge>}
                    </CardTitle>
                    <CardDescription>{notification.message}</CardDescription>
                    <p className="text-xs text-muted-foreground">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </CardHeader>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Social;
