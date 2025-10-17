import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Coins, Sparkles } from 'lucide-react';

type PaymentMethod = 'yoco' | 'zapper';

const creditPackages = [
  { 
    amount: 100, 
    price: 9.99, 
    id: 'pkg_100credits',
    paymentLinks: {
      yoco: 'https://pay.yoco.com/r/mRAe8r',
      zapper: '' // Add Zapper link when available
    }
  },
  { 
    amount: 500, 
    price: 39.99, 
    id: 'pkg_500credits', 
    popular: true,
    paymentLinks: {
      yoco: 'https://pay.yoco.com/r/mRAe8r',
      zapper: ''
    }
  },
  { 
    amount: 1000, 
    price: 69.99, 
    id: 'pkg_1000credits',
    paymentLinks: {
      yoco: 'https://pay.yoco.com/r/mRAe8r',
      zapper: ''
    }
  },
  { 
    amount: 5000, 
    price: 249.99, 
    id: 'pkg_5000credits',
    paymentLinks: {
      yoco: 'https://pay.yoco.com/r/mRAe8r',
      zapper: ''
    }
  },
];

const Store = () => {
  const { profile, refreshProfile } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('yoco');
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const success = searchParams.get('success');
    const cancelled = searchParams.get('cancelled');
    const failed = searchParams.get('failed');

    if (success) {
      // Credits will be added server-side via Yoco webhook
      refreshProfile();
      toast({
        title: "Payment Processing",
        description: "Your payment is being processed. Credits will be added shortly.",
      });
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
  }, [searchParams, refreshProfile, toast, navigate]);

  const handlePurchase = (pkg: typeof creditPackages[0]) => {
    const paymentLink = pkg.paymentLinks[paymentMethod];
    
    if (!paymentLink) {
      toast({
        title: "Payment Unavailable",
        description: `${paymentMethod === 'yoco' ? 'Yoco' : 'Zapper'} payment link not configured for this package.`,
        variant: "destructive",
      });
      return;
    }

    // Redirect to payment link
    window.location.href = paymentLink;
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

        <Card className="bg-card border-primary/20">
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
              variant={paymentMethod === 'zapper' ? 'default' : 'outline'}
              onClick={() => setPaymentMethod('zapper')}
              className="flex-1"
            >
              Zapper (Crypto)
            </Button>
          </CardContent>
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
                  disabled={!pkg.paymentLinks[paymentMethod]}
                  className="w-full bg-gradient-primary hover:opacity-90"
                >
                  {!pkg.paymentLinks[paymentMethod] ? 'Unavailable' : 'Purchase'}
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
