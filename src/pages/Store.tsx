import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Coins } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

type PaymentMethod = 'yoco' | 'crypto';

type CryptoOption = {
  name: string;
  symbol: string;
  walletAddress: string;
};

const cryptoOptions: CryptoOption[] = [
  { name: 'Bitcoin', symbol: 'BTC', walletAddress: '1KEyEudQkABGBzJmpdNtdMVEuJrDjEsjGx' },
  { name: 'Ethereum', symbol: 'ETH', walletAddress: '0xd009C5a32d79e455E1D10a9ED1AB2043467d84BA' },
  { name: 'USDT (TRC20)', symbol: 'USDT', walletAddress: 'TUvAoEswzR3s4FaTPzxHKomQGEQHBHESmA' },
];

const creditPackages = [
  { amount: 100, price: 9.99, id: 'pkg_100credits', yocoLink: 'https://pay.yoco.com/r/mRAe8r' },
  { amount: 500, price: 39.99, id: 'pkg_500credits', popular: true, yocoLink: 'https://pay.yoco.com/r/mRAe8r' },
  { amount: 1000, price: 69.99, id: 'pkg_1000credits', yocoLink: 'https://pay.yoco.com/r/mRAe8r' },
  { amount: 5000, price: 249.99, id: 'pkg_5000credits', yocoLink: 'https://pay.yoco.com/r/mRAe8r' },
];

export default function Store() {
  const { user, profile, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'credits' | 'cosmetics' | 'season'>('credits');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('yoco');
  const [showCryptoDialog, setShowCryptoDialog] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<typeof creditPackages[0] | null>(null);
  const [cosmetics, setCosmetics] = useState<any[]>([]);
  const [ownedCosmetics, setOwnedCosmetics] = useState<Set<string>>(new Set());
  const [seasonPasses, setSeasonPasses] = useState<any[]>([]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const cancelled = urlParams.get('cancelled');
    const failed = urlParams.get('failed');

    if (success) {
      const credits = urlParams.get('credits');
      toast.success(`Payment successful! ${credits} credits added to your account.`);
      window.history.replaceState({}, '', '/store');
      refreshProfile();
    } else if (cancelled) {
      toast.error('Payment was cancelled.');
      window.history.replaceState({}, '', '/store');
    } else if (failed) {
      toast.error('Payment failed. Please try again.');
      window.history.replaceState({}, '', '/store');
    }
  }, [refreshProfile]);

  useEffect(() => {
    fetchCosmetics();
    fetchSeasonPasses();
  }, [user]);

  const fetchCosmetics = async () => {
    const { data, error } = await supabase
      .from('cosmetic_items')
      .select('*')
      .eq('is_available', true)
      .order('price_credits', { ascending: true });

    if (!error && data) {
      setCosmetics(data);
    }

    if (user) {
      const { data: owned } = await supabase
        .from('user_cosmetics')
        .select('cosmetic_id')
        .eq('user_id', user.id);

      if (owned) {
        setOwnedCosmetics(new Set(owned.map(o => o.cosmetic_id)));
      }
    }
  };

  const fetchSeasonPasses = async () => {
    const { data, error } = await supabase
      .from('season_passes')
      .select('*')
      .eq('is_active', true)
      .order('season_number', { ascending: false });

    if (!error && data) {
      setSeasonPasses(data);
    }
  };

  const handlePurchase = (pkg: typeof creditPackages[0]) => {
    if (paymentMethod === 'crypto') {
      setSelectedPackage(pkg);
      setShowCryptoDialog(true);
      return;
    }

    if (!pkg.yocoLink) {
      toast.error('Payment link not configured');
      return;
    }

    window.location.href = pkg.yocoLink;
  };

  const handleCryptoSelect = (crypto: CryptoOption) => {
    navigator.clipboard.writeText(crypto.walletAddress);
    toast.success(`${crypto.name} address copied to clipboard`);
    setShowCryptoDialog(false);
  };

  const purchaseCosmetic = async (cosmetic: any) => {
    if (!user || !profile) return;

    if (profile.credits < cosmetic.price_credits) {
      toast.error('Insufficient credits');
      return;
    }

    try {
      const { error: deductError } = await supabase.rpc('deduct_stake', {
        p_user_id: user.id,
        p_amount: cosmetic.price_credits
      });

      if (deductError) throw deductError;

      const { error: purchaseError } = await supabase
        .from('user_cosmetics')
        .insert({
          user_id: user.id,
          cosmetic_id: cosmetic.id
        });

      if (purchaseError) throw purchaseError;

      await supabase.from('transactions').insert({
        user_id: user.id,
        amount: -cosmetic.price_credits,
        type: 'purchase',
        description: `Purchased ${cosmetic.name}`
      });

      toast.success(`Purchased ${cosmetic.name}!`);
      refreshProfile();
      fetchCosmetics();
    } catch (error: any) {
      toast.error(error.message || 'Purchase failed');
    }
  };

  const purchaseSeasonPass = async (seasonPass: any) => {
    if (!user || !profile) return;

    if (profile.credits < seasonPass.price_credits) {
      toast.error('Insufficient credits');
      return;
    }

    try {
      const { error: deductError } = await supabase.rpc('deduct_stake', {
        p_user_id: user.id,
        p_amount: seasonPass.price_credits
      });

      if (deductError) throw deductError;

      const { error: purchaseError } = await supabase
        .from('user_season_progress')
        .insert({
          user_id: user.id,
          season_id: seasonPass.id,
          is_premium: true,
          purchased_at: new Date().toISOString()
        });

      if (purchaseError) throw purchaseError;

      await supabase.from('transactions').insert({
        user_id: user.id,
        amount: -seasonPass.price_credits,
        type: 'purchase',
        description: `Season Pass: ${seasonPass.name}`
      });

      toast.success(`Purchased ${seasonPass.name}!`);
      refreshProfile();
      fetchSeasonPasses();
    } catch (error: any) {
      toast.error(error.message || 'Purchase failed');
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">Store</h1>
          <p className="text-muted-foreground">
            Purchase credits, cosmetics, and season passes
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <Coins className="h-5 w-5 text-primary" />
            <span className="text-2xl font-bold">{profile?.credits || 0} Credits</span>
          </div>
        </div>

        <div className="flex justify-center gap-2">
          <Button
            variant={activeTab === 'credits' ? 'default' : 'outline'}
            onClick={() => setActiveTab('credits')}
          >
            Credits
          </Button>
          <Button
            variant={activeTab === 'cosmetics' ? 'default' : 'outline'}
            onClick={() => setActiveTab('cosmetics')}
          >
            Cosmetics
          </Button>
          <Button
            variant={activeTab === 'season' ? 'default' : 'outline'}
            onClick={() => setActiveTab('season')}
          >
            Season Pass
          </Button>
        </div>

        {activeTab === 'credits' && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Select Payment Method</CardTitle>
              </CardHeader>
              <CardContent className="flex gap-4">
                <Button
                  variant={paymentMethod === 'yoco' ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod('yoco')}
                  className="flex-1"
                >
                  Yoco Payment
                </Button>
                <Button
                  variant={paymentMethod === 'crypto' ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod('crypto')}
                  className="flex-1"
                >
                  Crypto
                </Button>
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {creditPackages.map((pkg) => (
                <Card key={pkg.id} className={pkg.popular ? 'border-primary' : ''}>
                  {pkg.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge>Most Popular</Badge>
                    </div>
                  )}
                  <CardHeader className="text-center">
                    <CardTitle className="text-2xl">{pkg.amount} Credits</CardTitle>
                    <CardDescription className="text-xl font-bold">R{pkg.price}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={() => handlePurchase(pkg)} className="w-full">
                      Purchase
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>How Credits Work</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h3 className="font-semibold mb-2">Using Credits</h3>
                    <p className="text-sm text-muted-foreground">
                      Credits are used to enter games and compete for prizes. Each game has a stake amount
                      that both players contribute. The winner takes all!
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Free Credits</h3>
                    <p className="text-sm text-muted-foreground">
                      All players start with free credits and can claim more daily when their balance
                      reaches zero. Premium features and higher stakes require purchased credits.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {activeTab === 'cosmetics' && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {cosmetics.map((cosmetic) => (
              <Card key={cosmetic.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{cosmetic.name}</CardTitle>
                    <span className="text-3xl">{cosmetic.image_url}</span>
                  </div>
                  <CardDescription>{cosmetic.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Badge variant={cosmetic.rarity === 'legendary' ? 'default' : 'secondary'}>
                      {cosmetic.rarity}
                    </Badge>
                    <span className="font-bold">{cosmetic.price_credits} Credits</span>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => purchaseCosmetic(cosmetic)}
                    disabled={ownedCosmetics.has(cosmetic.id) || !profile || profile.credits < cosmetic.price_credits}
                  >
                    {ownedCosmetics.has(cosmetic.id) ? 'Owned' : 'Purchase'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'season' && (
          <div className="grid gap-6">
            {seasonPasses.map((pass) => (
              <Card key={pass.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Season {pass.season_number}: {pass.name}</CardTitle>
                      <CardDescription>{pass.description}</CardDescription>
                    </div>
                    <Badge>Level {pass.max_level}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(pass.start_date), 'MMM dd')} - {format(new Date(pass.end_date), 'MMM dd, yyyy')}
                    </span>
                    <span className="font-bold text-lg">{pass.price_credits} Credits</span>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => purchaseSeasonPass(pass)}
                    disabled={!profile || profile.credits < pass.price_credits}
                  >
                    Purchase Season Pass
                  </Button>
                </CardContent>
              </Card>
            ))}
            {seasonPasses.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  No active season passes at the moment
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      <Dialog open={showCryptoDialog} onOpenChange={setShowCryptoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Cryptocurrency</DialogTitle>
            <DialogDescription>
              Choose your preferred cryptocurrency to purchase {selectedPackage?.amount} credits for R{selectedPackage?.price}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 mt-4">
            {cryptoOptions.map((crypto) => (
              <Button
                key={crypto.symbol}
                variant="outline"
                onClick={() => handleCryptoSelect(crypto)}
                className="h-auto py-4 flex flex-col items-center gap-2"
              >
                <span className="text-lg font-bold">{crypto.symbol}</span>
                <span className="text-xs text-muted-foreground">{crypto.name}</span>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
