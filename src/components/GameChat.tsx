import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send } from "lucide-react";

interface Message {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
  profiles: {
    username: string;
    display_name: string | null;
  };
}

interface GameChatProps {
  gameId: string;
}

const GameChat = ({ gameId }: GameChatProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
    
    const channel = supabase
      .channel(`game-chat-${gameId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `game_id=eq.${gameId}`
      }, (payload) => {
        loadMessages(); // Reload to get profile data
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select(`
        id,
        user_id,
        message,
        created_at,
        profiles(username, display_name)
      `)
      .eq('game_id', gameId)
      .order('created_at', { ascending: true });

    if (data) setMessages(data as any);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    const { error } = await supabase
      .from('messages')
      .insert({
        game_id: gameId,
        user_id: user.id,
        message: newMessage.trim()
      });

    if (!error) {
      setNewMessage("");
    }
  };

  const scrollToBottom = () => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <Card className="h-[400px] flex flex-col">
      <CardHeader>
        <CardTitle>Game Chat</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-4 space-y-4">
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-3">
            {messages.map((msg) => (
              <div 
                key={msg.id}
                className={`flex flex-col ${msg.user_id === user?.id ? 'items-end' : 'items-start'}`}
              >
                <p className="text-xs text-muted-foreground mb-1">
                  {msg.profiles.display_name || msg.profiles.username}
                </p>
                <div 
                  className={`px-3 py-2 rounded-lg max-w-[80%] ${
                    msg.user_id === user?.id 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-secondary'
                  }`}
                >
                  <p className="text-sm">{msg.message}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(msg.created_at).toLocaleTimeString()}
                </p>
              </div>
            ))}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>
        
        <div className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          />
          <Button onClick={sendMessage} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default GameChat;
