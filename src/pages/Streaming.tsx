import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Zap, Star, Trophy } from "lucide-react";
import { toast } from "sonner";

export default function Streaming() {
  const { profile } = useAuth();

  const features = [
    { icon: Zap, title: "Ad-Free Experience", description: "Enjoy uninterrupted gameplay" },
    { icon: Trophy, title: "Exclusive Tournaments", description: "Access to premium-only tournaments" },
    { icon: Crown, title: "Priority Matchmaking", description: "Get matched faster with premium players" },
    { icon: Star, title: "Bonus Credits Monthly", description: "Receive 500 bonus credits each month" },
  ];

  const isPremium = profile?.is_premium && profile?.premium_expires_at && new Date(profile.premium_expires_at) > new Date();

  const handleSubscribe = () => {
    toast.info("Premium subscriptions coming soon! Currently in development.");
  };

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold">Premium Membership</h1>
        <p className="text-muted-foreground">
          Unlock exclusive features and take your gameplay to the next level
        </p>
      </div>

      {isPremium && (
        <Card className="border-primary">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Crown className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="font-bold text-lg">Premium Active</h3>
                  <p className="text-sm text-muted-foreground">
                    Valid until {new Date(profile.premium_expires_at!).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Badge variant="default">Active</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Free</CardTitle>
            <CardDescription>Perfect for casual players</CardDescription>
            <div className="text-3xl font-bold">R0</div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-muted-foreground mt-0.5" />
                <span>250 starting credits</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-muted-foreground mt-0.5" />
                <span>Daily free credits when balance is zero</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-muted-foreground mt-0.5" />
                <span>Access to public games</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-muted-foreground mt-0.5" />
                <span>Basic achievements</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-primary relative overflow-hidden">
          <div className="absolute top-4 right-4">
            <Badge variant="default">Popular</Badge>
          </div>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Crown className="h-6 w-6" />
              Premium
            </CardTitle>
            <CardDescription>For serious competitors</CardDescription>
            <div className="text-3xl font-bold">R99/month</div>
          </CardHeader>
          <CardContent className="space-y-6">
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary mt-0.5" />
                <span className="font-medium">All Free features</span>
              </li>
              {features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <span className="font-medium">{feature.title}</span>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </li>
              ))}
            </ul>
            <Button 
              className="w-full" 
              size="lg"
              onClick={handleSubscribe}
              disabled={isPremium}
            >
              {isPremium ? 'Active' : 'Subscribe Now'}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon: Live Streaming</CardTitle>
          <CardDescription>
            Premium members will get exclusive access to live streaming features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Watch top players compete in real-time, learn from the best, and participate in
            live tournaments. This feature is currently in development and will be available
            exclusively to Premium members.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
