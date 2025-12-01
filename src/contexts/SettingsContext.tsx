import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AppSettings {
  // Game settings
  game_duration_seconds: number;
  minimum_stake: number;
  max_stake: number;
  
  // Free credits
  free_credits_amount: number;
  free_credits_interval_hours: number;
  
  // Token packages
  token_package_1_amount: number;
  token_package_1_price: number;
  token_package_2_amount: number;
  token_package_2_price: number;
  token_package_3_amount: number;
  token_package_3_price: number;
  token_package_4_amount: number;
  token_package_4_price: number;
  
  // Referral & Premium
  referral_bonus: number;
  premium_monthly_price: number;
  
  // Crypto wallets
  btc_wallet: string;
  eth_wallet: string;
  usdt_wallet: string;
  
  // System
  maintenance_mode: boolean;
}

interface SettingsContextType {
  settings: AppSettings;
  loading: boolean;
  refreshSettings: () => Promise<void>;
}

const defaultSettings: AppSettings = {
  game_duration_seconds: 30,
  minimum_stake: 50,
  max_stake: 10000,
  free_credits_amount: 250,
  free_credits_interval_hours: 24,
  token_package_1_amount: 100,
  token_package_1_price: 9.99,
  token_package_2_amount: 500,
  token_package_2_price: 39.99,
  token_package_3_amount: 1000,
  token_package_3_price: 69.99,
  token_package_4_amount: 5000,
  token_package_4_price: 249.99,
  referral_bonus: 250,
  premium_monthly_price: 99,
  btc_wallet: '',
  eth_wallet: '',
  usdt_wallet: '',
  maintenance_mode: false,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('key, value');

      if (error) throw error;

      if (data) {
        const settingsMap: Record<string, string> = {};
        data.forEach((s) => {
          settingsMap[s.key] = s.value;
        });

        setSettings({
          game_duration_seconds: parseInt(settingsMap.game_duration_seconds) || defaultSettings.game_duration_seconds,
          minimum_stake: parseInt(settingsMap.minimum_stake) || defaultSettings.minimum_stake,
          max_stake: parseInt(settingsMap.max_stake) || defaultSettings.max_stake,
          free_credits_amount: parseInt(settingsMap.free_credits_amount) || defaultSettings.free_credits_amount,
          free_credits_interval_hours: parseInt(settingsMap.free_credits_interval_hours) || defaultSettings.free_credits_interval_hours,
          token_package_1_amount: parseInt(settingsMap.token_package_1_amount) || defaultSettings.token_package_1_amount,
          token_package_1_price: parseFloat(settingsMap.token_package_1_price) || defaultSettings.token_package_1_price,
          token_package_2_amount: parseInt(settingsMap.token_package_2_amount) || defaultSettings.token_package_2_amount,
          token_package_2_price: parseFloat(settingsMap.token_package_2_price) || defaultSettings.token_package_2_price,
          token_package_3_amount: parseInt(settingsMap.token_package_3_amount) || defaultSettings.token_package_3_amount,
          token_package_3_price: parseFloat(settingsMap.token_package_3_price) || defaultSettings.token_package_3_price,
          token_package_4_amount: parseInt(settingsMap.token_package_4_amount) || defaultSettings.token_package_4_amount,
          token_package_4_price: parseFloat(settingsMap.token_package_4_price) || defaultSettings.token_package_4_price,
          referral_bonus: parseInt(settingsMap.referral_bonus) || defaultSettings.referral_bonus,
          premium_monthly_price: parseInt(settingsMap.premium_monthly_price) || defaultSettings.premium_monthly_price,
          btc_wallet: settingsMap.btc_wallet || defaultSettings.btc_wallet,
          eth_wallet: settingsMap.eth_wallet || defaultSettings.eth_wallet,
          usdt_wallet: settingsMap.usdt_wallet || defaultSettings.usdt_wallet,
          maintenance_mode: settingsMap.maintenance_mode === 'true',
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading, refreshSettings: fetchSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
