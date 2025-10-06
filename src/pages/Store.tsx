import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Coins, Sparkles } from 'lucide-react';

const creditPackages = [
  { amount: 100, price: 0.99, priceId: 'price_100credits' },
  { amount: 500, price: 3.99, priceId: 'price_500credits', popular: true },
  { amount: 1000, price: 6.99, priceId: 'price_1000credits' },
  { amount: 5000, price: 24.99, priceId: 'price_5000credits' },
];

const Store = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handlePurchase = async (pkg: typeof creditPackages[0]) => {
    setLoading(pkg.priceId);
    
    try {
      toast({
        title: "Payment Integration Needed",
        description: "Please connect your Stripe account to enable credit purchases. Contact admin to set up payment processing.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
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
              key={pkg.priceId}
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
                <CardDescription className="text-xl font-bold">${pkg.price}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => handlePurchase(pkg)}
                  disabled={!!loading}
                  className="w-full bg-gradient-primary hover:opacity-90"
                >
                  {loading === pkg.priceId ? 'Processing...' : 'Purchase'}
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
