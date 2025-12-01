import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Coins, Hexagon, Sparkles } from "lucide-react";
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

const tokenPackages = [
  { amount: 100, price: 9.99, id: 'pkg_100tokens', yocoLink: 'https://pay.yoco.com/r/mRAe8r' },
  { amount: 500, price: 39.99, id: 'pkg_500tokens', popular: true, yocoLink: 'https://pay.yoco.com/r/mRAe8r' },
  { amount: 1000, price: 69.99, id: 'pkg_1000tokens', yocoLink: 'https://pay.yoco.com/r/mRAe8r' },
  { amount: 5000, price: 249.99, id: 'pkg_5000tokens', yocoLink: 'https://pay.yoco.com/r/mRAe8r' },
];

export default function Store() {
  const { user, profile, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'tokens' | 'nfts' | 'season'>('tokens');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('yoco');
  const [showCryptoDialog, setShowCryptoDialog] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<typeof tokenPackages[0] | null>(null);
  const [nfts, setNfts] = useState<any[]>([]);
  const [ownedNfts, setOwnedNfts] = useState<Set<string>>(new Set());
  const [seasonPasses, setSeasonPasses] = useState<any[]>([]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const cancelled = urlParams.get('cancelled');
    const failed = urlParams.get('failed');

    if (success) {
      const tokens = urlParams.get('credits');
      toast.success(`Payment successful! ${tokens} tokens added to your wallet.`);
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
    fetchNfts();
    fetchSeasonPasses();
  }, [user]);

  const fetchNfts = async () => {
    const { data, error } = await supabase
      .from('cosmetic_items')
      .select('*')
      .eq('is_available', true)
      .order('price_credits', { ascending: true });

    if (!error && data) {
      setNfts(data);
    }

    if (user) {
      const { data: owned } = await supabase
        .from('user_cosmetics')
        .select('cosmetic_id')
        .eq('user_id', user.id);

      if (owned) {
        setOwnedNfts(new Set(owned.map(o => o.cosmetic_id)));
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

  const handlePurchase = (pkg: typeof tokenPackages[0]) => {
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

  const purchaseNft = async (nft: any) => {
    if (!user || !profile) return;

    if (profile.credits < nft.price_credits) {
      toast.error('Insufficient tokens');
      return;
    }

    try {
      const { error: deductError } = await supabase.rpc('deduct_stake', {
        p_user_id: user.id,
        p_amount: nft.price_credits
      });

      if (deductError) throw deductError;

      const { error: purchaseError } = await supabase
        .from('user_cosmetics')
        .insert({
          user_id: user.id,
          cosmetic_id: nft.id
        });

      if (purchaseError) throw purchaseError;

      await supabase.from('transactions').insert({
        user_id: user.id,
        amount: -nft.price_credits,
        type: 'purchase',
        description: `Minted NFT: ${nft.name}`
      });

      toast.success(`NFT "${nft.name}" minted to your wallet!`);
      refreshProfile();
      fetchNfts();
    } catch (error: any) {
      toast.error(error.message || 'Minting failed');
    }
  };

  const purchaseSeasonPass = async (seasonPass: any) => {
    if (!user || !profile) return;

    if (profile.credits < seasonPass.price_credits) {
      toast.error('Insufficient tokens');
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

      toast.success(`Season Pass "${seasonPass.name}" activated!`);
      refreshProfile();
      fetchSeasonPasses();
    } catch (error: any) {
      toast.error(error.message || 'Purchase failed');
    }
  };

  const getRarityGradient = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'from-amber-500/20 to-orange-500/20 border-amber-500/50';
      case 'epic': return 'from-purple-500/20 to-pink-500/20 border-purple-500/50';
      case 'rare': return 'from-blue-500/20 to-cyan-500/20 border-blue-500/50';
      default: return 'from-gray-500/20 to-slate-500/20 border-gray-500/50';
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
            Marketplace
          </h1>
          <p className="text-muted-foreground">
            Buy tokens, mint NFTs, and unlock season passes
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <Coins className="h-5 w-5 text-primary" />
            <span className="text-2xl font-bold">{profile?.credits || 0} Tokens</span>
          </div>
        </div>

        <div className="flex justify-center gap-2">
          <Button
            variant={activeTab === 'tokens' ? 'default' : 'outline'}
            onClick={() => setActiveTab('tokens')}
            className="gap-2"
          >
            <Coins className="h-4 w-4" />
            Tokens
          </Button>
          <Button
            variant={activeTab === 'nfts' ? 'default' : 'outline'}
            onClick={() => setActiveTab('nfts')}
            className="gap-2"
          >
            <Hexagon className="h-4 w-4" />
            NFTs
          </Button>
          <Button
            variant={activeTab === 'season' ? 'default' : 'outline'}
            onClick={() => setActiveTab('season')}
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Season Pass
          </Button>
        </div>

        {activeTab === 'tokens' && (
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
                  Card Payment
                </Button>
                <Button
                  variant={paymentMethod === 'crypto' ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod('crypto')}
                  className="flex-1"
                >
                  Cryptocurrency
                </Button>
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {tokenPackages.map((pkg) => (
                <Card key={pkg.id} className={`relative ${pkg.popular ? 'border-primary ring-2 ring-primary/20' : ''}`}>
                  {pkg.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary">Best Value</Badge>
                    </div>
                  )}
                  <CardHeader className="text-center">
                    <div className="mx-auto mb-2 h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                      <Coins className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">{pkg.amount} Tokens</CardTitle>
                    <CardDescription className="text-xl font-bold text-foreground">R{pkg.price}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={() => handlePurchase(pkg)} className="w-full">
                      Buy Tokens
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="bg-gradient-to-br from-primary/5 to-purple-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-primary" />
                  How Tokens Work
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h3 className="font-semibold mb-2">Using Tokens</h3>
                    <p className="text-sm text-muted-foreground">
                      Tokens are your in-game cryptocurrency. Use them to enter battles, stake against opponents,
                      and mint exclusive NFTs. Winners take the pot!
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Free Tokens</h3>
                    <p className="text-sm text-muted-foreground">
                      New players receive free tokens to start. Claim daily tokens when your balance hits zero.
                      Premium features require purchased tokens.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {activeTab === 'nfts' && (
          <>
            <div className="text-center mb-6">
              <p className="text-muted-foreground">
                Mint unique NFTs to customize your profile and show off your style
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {nfts.map((nft) => (
                <Card 
                  key={nft.id} 
                  className={`relative overflow-hidden bg-gradient-to-br ${getRarityGradient(nft.rarity)}`}
                >
                  <div className="absolute top-2 right-2">
                    <Badge variant={nft.rarity === 'legendary' ? 'default' : 'secondary'} className="uppercase text-xs">
                      {nft.rarity}
                    </Badge>
                  </div>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="h-16 w-16 rounded-lg bg-background/50 flex items-center justify-center text-4xl">
                        {nft.image_url || <Hexagon className="h-8 w-8 text-muted-foreground" />}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{nft.name}</CardTitle>
                        <CardDescription className="text-xs uppercase tracking-wide">
                          {nft.type?.replace('_', ' ')}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">{nft.description}</p>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1">
                        <Coins className="h-4 w-4 text-primary" />
                        <span className="font-bold">{nft.price_credits} Tokens</span>
                      </div>
                    </div>
                    <Button
                      className="w-full"
                      onClick={() => purchaseNft(nft)}
                      disabled={ownedNfts.has(nft.id) || !profile || profile.credits < nft.price_credits}
                    >
                      {ownedNfts.has(nft.id) ? 'In Wallet' : 'Mint NFT'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
              {nfts.length === 0 && (
                <Card className="col-span-full">
                  <CardContent className="p-8 text-center text-muted-foreground">
                    <Hexagon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No NFTs available at the moment</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        )}

        {activeTab === 'season' && (
          <div className="grid gap-6">
            {seasonPasses.map((pass) => (
              <Card key={pass.id} className="bg-gradient-to-br from-primary/5 to-purple-500/5">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Season {pass.season_number}: {pass.name}
                      </CardTitle>
                      <CardDescription>{pass.description}</CardDescription>
                    </div>
                    <Badge variant="outline">Max Level {pass.max_level}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(pass.start_date), 'MMM dd')} - {format(new Date(pass.end_date), 'MMM dd, yyyy')}
                    </span>
                    <div className="flex items-center gap-1">
                      <Coins className="h-4 w-4 text-primary" />
                      <span className="font-bold text-lg">{pass.price_credits} Tokens</span>
                    </div>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => purchaseSeasonPass(pass)}
                    disabled={!profile || profile.credits < pass.price_credits}
                  >
                    Activate Season Pass
                  </Button>
                </CardContent>
              </Card>
            ))}
            {seasonPasses.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No active season passes at the moment</p>
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
              Choose your preferred crypto to purchase {selectedPackage?.amount} tokens for R{selectedPackage?.price}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-3 mt-4">
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
