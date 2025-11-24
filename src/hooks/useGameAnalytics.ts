import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useGameAnalytics = () => {
  const trackGameEvent = async (
    gameId: string,
    userId: string,
    eventType: string,
    eventData?: any
  ) => {
    try {
      await supabase.from('game_replays').insert({
        game_id: gameId,
        user_id: userId,
        event_type: eventType,
        event_data: eventData,
      });
    } catch (error) {
      console.error('Error tracking game event:', error);
    }
  };

  const updateGameAnalytics = async (
    gameId: string,
    songId: string,
    participants: any[]
  ) => {
    try {
      const responseTimes = participants
        .filter(p => p.time_taken)
        .map(p => p.time_taken);
      
      const avgResponseTime = responseTimes.length > 0
        ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
        : null;

      const completionRate = (participants.filter(p => p.is_correct !== null).length / participants.length) * 100;

      await supabase.from('game_analytics').insert({
        game_id: gameId,
        song_id: songId,
        total_players: participants.length,
        average_response_time: avgResponseTime,
        completion_rate: completionRate,
      });

      // Update song statistics
      const correctAnswers = participants.filter(p => p.is_correct);
      if (correctAnswers.length > 0) {
        await supabase.rpc('update_song_statistics', {
          p_song_id: songId,
          p_was_correct: true,
        });
      }
    } catch (error) {
      console.error('Error updating game analytics:', error);
    }
  };

  const updateUserStats = async (
    userId: string,
    won: boolean,
    responseTime: number
  ) => {
    try {
      await supabase.rpc('update_user_statistics', {
        p_user_id: userId,
        p_won: won,
        p_response_time: responseTime,
      });
    } catch (error) {
      console.error('Error updating user stats:', error);
    }
  };

  return {
    trackGameEvent,
    updateGameAnalytics,
    updateUserStats,
  };
};
