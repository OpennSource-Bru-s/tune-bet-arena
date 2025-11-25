export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          created_at: string | null
          criteria: Json
          description: string
          icon: string
          id: string
          key: string
          name: string
        }
        Insert: {
          created_at?: string | null
          criteria: Json
          description: string
          icon: string
          id?: string
          key: string
          name: string
        }
        Update: {
          created_at?: string | null
          criteria?: Json
          description?: string
          icon?: string
          id?: string
          key?: string
          name?: string
        }
        Relationships: []
      }
      cosmetic_items: {
        Row: {
          animation_data: Json | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_available: boolean | null
          name: string
          price_credits: number
          price_premium: boolean | null
          rarity: Database["public"]["Enums"]["item_rarity"]
          type: Database["public"]["Enums"]["cosmetic_type"]
        }
        Insert: {
          animation_data?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          name: string
          price_credits: number
          price_premium?: boolean | null
          rarity?: Database["public"]["Enums"]["item_rarity"]
          type: Database["public"]["Enums"]["cosmetic_type"]
        }
        Update: {
          animation_data?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          name?: string
          price_credits?: number
          price_premium?: boolean | null
          rarity?: Database["public"]["Enums"]["item_rarity"]
          type?: Database["public"]["Enums"]["cosmetic_type"]
        }
        Relationships: []
      }
      daily_challenges: {
        Row: {
          bonus_credits: number
          challenge_date: string
          created_at: string | null
          criteria: Json
          description: string
          id: string
        }
        Insert: {
          bonus_credits?: number
          challenge_date: string
          created_at?: string | null
          criteria: Json
          description: string
          id?: string
        }
        Update: {
          bonus_credits?: number
          challenge_date?: string
          created_at?: string | null
          criteria?: Json
          description?: string
          id?: string
        }
        Relationships: []
      }
      friendships: {
        Row: {
          created_at: string | null
          friend_id: string
          id: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          friend_id: string
          id?: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          friend_id?: string
          id?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "friendships_friend_id_fkey"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      game_analytics: {
        Row: {
          average_response_time: number | null
          completion_rate: number | null
          created_at: string | null
          game_id: string | null
          id: string
          song_id: string | null
          total_players: number | null
        }
        Insert: {
          average_response_time?: number | null
          completion_rate?: number | null
          created_at?: string | null
          game_id?: string | null
          id?: string
          song_id?: string | null
          total_players?: number | null
        }
        Update: {
          average_response_time?: number | null
          completion_rate?: number | null
          created_at?: string | null
          game_id?: string | null
          id?: string
          song_id?: string | null
          total_players?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "game_analytics_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_analytics_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      game_participants: {
        Row: {
          answer_text: string | null
          answered_at: string | null
          created_at: string
          game_id: string
          id: string
          is_correct: boolean | null
          time_taken: number | null
          user_id: string
        }
        Insert: {
          answer_text?: string | null
          answered_at?: string | null
          created_at?: string
          game_id: string
          id?: string
          is_correct?: boolean | null
          time_taken?: number | null
          user_id: string
        }
        Update: {
          answer_text?: string | null
          answered_at?: string | null
          created_at?: string
          game_id?: string
          id?: string
          is_correct?: boolean | null
          time_taken?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_participants_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      game_replays: {
        Row: {
          event_data: Json | null
          event_type: string
          game_id: string | null
          id: string
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          event_data?: Json | null
          event_type: string
          game_id?: string | null
          id?: string
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          event_data?: Json | null
          event_type?: string
          game_id?: string | null
          id?: string
          timestamp?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_replays_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_replays_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          song_id: string | null
          stake_amount: number
          started_at: string | null
          status: Database["public"]["Enums"]["game_status"]
          winner_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          song_id?: string | null
          stake_amount: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["game_status"]
          winner_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          song_id?: string | null
          stake_amount?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["game_status"]
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "games_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          created_at: string | null
          game_id: string | null
          id: string
          message: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          game_id?: string | null
          id?: string
          message: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          game_id?: string | null
          id?: string
          message?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          link: string | null
          message: string
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          link?: string | null
          message: string
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          link?: string | null
          message?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          credits: number
          display_name: string | null
          elo_rating: number | null
          equipped_animation: string | null
          equipped_avatar: string | null
          equipped_frame: string | null
          id: string
          is_premium: boolean | null
          last_free_credit_at: string | null
          premium_expires_at: string | null
          referral_code: string | null
          referred_by: string | null
          total_games: number
          total_wins: number
          updated_at: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          credits?: number
          display_name?: string | null
          elo_rating?: number | null
          equipped_animation?: string | null
          equipped_avatar?: string | null
          equipped_frame?: string | null
          id: string
          is_premium?: boolean | null
          last_free_credit_at?: string | null
          premium_expires_at?: string | null
          referral_code?: string | null
          referred_by?: string | null
          total_games?: number
          total_wins?: number
          updated_at?: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          credits?: number
          display_name?: string | null
          elo_rating?: number | null
          equipped_animation?: string | null
          equipped_avatar?: string | null
          equipped_frame?: string | null
          id?: string
          is_premium?: boolean | null
          last_free_credit_at?: string | null
          premium_expires_at?: string | null
          referral_code?: string | null
          referred_by?: string | null
          total_games?: number
          total_wins?: number
          updated_at?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_equipped_animation_fkey"
            columns: ["equipped_animation"]
            isOneToOne: false
            referencedRelation: "cosmetic_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_equipped_avatar_fkey"
            columns: ["equipped_avatar"]
            isOneToOne: false
            referencedRelation: "cosmetic_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_equipped_frame_fkey"
            columns: ["equipped_frame"]
            isOneToOne: false
            referencedRelation: "cosmetic_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          created_at: string | null
          id: string
          referred_id: string
          referrer_id: string
          reward_claimed: boolean | null
          reward_credits: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          referred_id: string
          referrer_id: string
          reward_claimed?: boolean | null
          reward_credits?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          referred_id?: string
          referrer_id?: string
          reward_claimed?: boolean | null
          reward_credits?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      season_passes: {
        Row: {
          created_at: string | null
          description: string | null
          end_date: string
          id: string
          is_active: boolean | null
          max_level: number | null
          name: string
          price_credits: number
          rewards: Json
          season_number: number
          start_date: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_date: string
          id?: string
          is_active?: boolean | null
          max_level?: number | null
          name: string
          price_credits: number
          rewards: Json
          season_number: number
          start_date: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_date?: string
          id?: string
          is_active?: boolean | null
          max_level?: number | null
          name?: string
          price_credits?: number
          rewards?: Json
          season_number?: number
          start_date?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      songs: {
        Row: {
          answer: string
          artist: string
          audio_url: string | null
          created_at: string
          difficulty: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          is_sponsored: boolean | null
          lyrics_snippet: string
          original_url: string | null
          platform: string | null
          sponsor_logo_url: string | null
          sponsor_metadata: Json | null
          sponsor_name: string | null
          times_played: number | null
          title: string
          win_rate: number | null
        }
        Insert: {
          answer: string
          artist: string
          audio_url?: string | null
          created_at?: string
          difficulty?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_sponsored?: boolean | null
          lyrics_snippet: string
          original_url?: string | null
          platform?: string | null
          sponsor_logo_url?: string | null
          sponsor_metadata?: Json | null
          sponsor_name?: string | null
          times_played?: number | null
          title: string
          win_rate?: number | null
        }
        Update: {
          answer?: string
          artist?: string
          audio_url?: string | null
          created_at?: string
          difficulty?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_sponsored?: boolean | null
          lyrics_snippet?: string
          original_url?: string | null
          platform?: string | null
          sponsor_logo_url?: string | null
          sponsor_metadata?: Json | null
          sponsor_name?: string | null
          times_played?: number | null
          title?: string
          win_rate?: number | null
        }
        Relationships: []
      }
      tournament_participants: {
        Row: {
          id: string
          joined_at: string | null
          prize_won: number | null
          rank: number | null
          score: number | null
          tournament_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string | null
          prize_won?: number | null
          rank?: number | null
          score?: number | null
          tournament_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string | null
          prize_won?: number | null
          rank?: number | null
          score?: number | null
          tournament_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_participants_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          created_at: string | null
          description: string | null
          end_time: string
          entry_fee: number
          id: string
          max_participants: number | null
          name: string
          prize_pool: number
          rules: Json | null
          start_time: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_time: string
          entry_fee: number
          id?: string
          max_participants?: number | null
          name: string
          prize_pool: number
          rules?: Json | null
          start_time: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_time?: string
          entry_fee?: number
          id?: string
          max_participants?: number | null
          name?: string
          prize_pool?: number
          rules?: Json | null
          start_time?: string
          status?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          game_id: string | null
          id: string
          stripe_payment_id: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          game_id?: string | null
          id?: string
          stripe_payment_id?: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          game_id?: string | null
          id?: string
          stripe_payment_id?: string | null
          type?: Database["public"]["Enums"]["transaction_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_cosmetics: {
        Row: {
          acquired_at: string | null
          cosmetic_id: string
          id: string
          user_id: string
        }
        Insert: {
          acquired_at?: string | null
          cosmetic_id: string
          id?: string
          user_id: string
        }
        Update: {
          acquired_at?: string | null
          cosmetic_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_cosmetics_cosmetic_id_fkey"
            columns: ["cosmetic_id"]
            isOneToOne: false
            referencedRelation: "cosmetic_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_cosmetics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_daily_challenges: {
        Row: {
          challenge_id: string
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_daily_challenges_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "daily_challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_daily_challenges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_season_progress: {
        Row: {
          created_at: string | null
          current_level: number | null
          id: string
          is_premium: boolean | null
          purchased_at: string | null
          season_id: string
          user_id: string
          xp_earned: number | null
        }
        Insert: {
          created_at?: string | null
          current_level?: number | null
          id?: string
          is_premium?: boolean | null
          purchased_at?: string | null
          season_id: string
          user_id: string
          xp_earned?: number | null
        }
        Update: {
          created_at?: string | null
          current_level?: number | null
          id?: string
          is_premium?: boolean | null
          purchased_at?: string | null
          season_id?: string
          user_id?: string
          xp_earned?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_season_progress_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "season_passes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_season_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_statistics: {
        Row: {
          average_response_time: number | null
          current_win_streak: number | null
          fastest_correct_answer: number | null
          id: string
          last_played_at: string | null
          longest_win_streak: number | null
          total_credits_earned: number | null
          total_games_played: number | null
          total_wins: number | null
          updated_at: string | null
          user_id: string | null
          win_rate: number | null
        }
        Insert: {
          average_response_time?: number | null
          current_win_streak?: number | null
          fastest_correct_answer?: number | null
          id?: string
          last_played_at?: string | null
          longest_win_streak?: number | null
          total_credits_earned?: number | null
          total_games_played?: number | null
          total_wins?: number | null
          updated_at?: string | null
          user_id?: string | null
          win_rate?: number | null
        }
        Update: {
          average_response_time?: number | null
          current_win_streak?: number | null
          fastest_correct_answer?: number | null
          id?: string
          last_played_at?: string | null
          longest_win_streak?: number | null
          total_credits_earned?: number | null
          total_games_played?: number | null
          total_wins?: number | null
          updated_at?: string | null
          user_id?: string | null
          win_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_statistics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_achievements: { Args: { p_user_id: string }; Returns: undefined }
      claim_free_credits: { Args: never; Returns: Json }
      complete_game: {
        Args: { p_game_id: string; p_winner_id: string }
        Returns: undefined
      }
      deduct_stake: {
        Args: { p_amount: number; p_user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      process_referral_reward: {
        Args: { p_referred_id: string; p_referrer_id: string }
        Returns: undefined
      }
      update_elo_ratings: {
        Args: { p_loser_id: string; p_winner_id: string }
        Returns: undefined
      }
      update_song_statistics: {
        Args: { p_song_id: string; p_was_correct: boolean }
        Returns: undefined
      }
      update_user_statistics: {
        Args: { p_response_time: number; p_user_id: string; p_won: boolean }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "player"
      cosmetic_type: "avatar" | "profile_frame" | "victory_animation"
      game_status: "waiting" | "in_progress" | "completed" | "cancelled"
      item_rarity: "common" | "rare" | "epic" | "legendary"
      transaction_type: "purchase" | "stake" | "win" | "free_credits"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "player"],
      cosmetic_type: ["avatar", "profile_frame", "victory_animation"],
      game_status: ["waiting", "in_progress", "completed", "cancelled"],
      item_rarity: ["common", "rare", "epic", "legendary"],
      transaction_type: ["purchase", "stake", "win", "free_credits"],
    },
  },
} as const
