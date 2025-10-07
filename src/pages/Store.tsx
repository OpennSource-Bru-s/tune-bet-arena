import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Coins, Sparkles } from 'lucide-react';

const creditPackages = [
  { amount: 100, price: 9.99, id: 'pkg_100credits' },
  { amount: 500, price: 39.99, id: 'pkg_500credits', popular: true },
  { amount: 1000, price: 69.99, id: 'pkg_1000credits' },
  { amount: 5000, price: 249.99, id: 'pkg_5000credits' },
];

const Store = () => {
  const { profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const success = searchParams.get('success');
    const credits = searchParams.get('credits');
    const cancelled = searchParams.get('cancelled');
    const failed = searchParams.get('failed');

    if (success && credits) {
      handlePaymentSuccess(parseInt(credits));
      navigate('/store', { replace: true });
    } else if (cancelled) {
      toast({
        title: "Payment Cancelled",
        description: "Your payment was cancelled.",
      });
      navigate('/store', { replace: true });
    } else if (failed) {
      toast({
        title: "Payment Failed",
        description: "Your payment failed. Please try again.",
        variant: "destructive",
      });
      navigate('/store', { replace: true });
    }
  }, [searchParams]);

  const handlePaymentSuccess = async (credits: number) => {
    try {
      // Update user credits
      const { error } = await supabase
        .from('profiles')
        .update({ credits: (profile?.credits || 0) + credits })
        .eq('id', profile?.id);

      if (error) throw error;

      await refreshProfile();

      toast({
        title: "Purchase Successful!",
        description: `${credits} credits have been added to your account.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to add credits. Please contact support.",
        variant: "destructive",
      });
    }
  };

  const handlePurchase = async (pkg: typeof creditPackages[0]) => {
    setLoading(pkg.id);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-yoco-checkout', {
        body: { 
          amount: pkg.price,
          credits: pkg.amount,
        },
      });

      if (error) throw error;

      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create checkout session",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Credit Store
            </h1>
            <p className="text-muted-foreground">Purchase credits to play more games</p>
          </div>
        </div>

        <Card className="bg-gradient-card border-primary/20 shadow-card">
          <CardHeader className="flex flex-row items-center space-y-0 space-x-3 pb-2">
            <Coins className="w-8 h-8 text-primary" />
            <div>
              <CardDescription>Your Balance</CardDescription>
              <CardTitle className="text-3xl">{profile?.credits || 0} Credits</CardTitle>
            </div>
          </CardHeader>
        </Card>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {creditPackages.map((pkg) => (
            <Card
              key={pkg.id}
              className={`relative bg-card border-primary/20 shadow-card hover:shadow-glow transition-shadow ${
                pkg.popular ? 'border-secondary' : ''
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <div className="bg-gradient-primary px-4 py-1 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span className="text-xs font-semibold">Most Popular</span>
                  </div>
                </div>
              )}
              <CardHeader className="text-center">
                <Coins className="w-12 h-12 mx-auto mb-2 text-primary" />
                <CardTitle className="text-2xl">{pkg.amount} Credits</CardTitle>
                <CardDescription className="text-xl font-bold">R{pkg.price}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => handlePurchase(pkg)}
                  disabled={!!loading}
                  className="w-full bg-gradient-primary hover:opacity-90"
                >
                  {loading === pkg.id ? 'Processing...' : 'Purchase'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="bg-card border-primary/20">
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• Credits are used to stake in games</p>
            <p>• Win games to earn double your stake</p>
            <p>• New players receive 250 free credits</p>
            <p>• Players with 0 credits receive 250 free credits every 24 hours</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Store;
