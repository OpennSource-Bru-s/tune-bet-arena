import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Gift, Users, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface Referral {
  id: string;
  referred_id: string;
  reward_claimed: boolean;
  created_at: string;
  referred_profile?: {
    username: string;
  };
}

export default function Referrals() {
  const { user, profile, refreshProfile } = useAuth();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [copied, setCopied] = useState(false);
  const referralLink = `${window.location.origin}/?ref=${profile?.referral_code}`;

  useEffect(() => {
    if (user) {
      fetchReferrals();
    }
  }, [user]);

  const fetchReferrals = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('referrals')
      .select(`
        *,
        referred_profile:profiles!referrals_referred_id_fkey(username)
      `)
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setReferrals(data);
    }
  };

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success('Referral link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const claimReward = async (referralId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase.rpc('process_referral_reward', {
        p_referrer_id: user.id,
        p_referred_id: referralId
      });

      if (error) throw error;

      toast.success('Claimed 250 credits!');
      refreshProfile();
      fetchReferrals();
    } catch (error: any) {
      toast.error(error.message || 'Failed to claim reward');
    }
  };

  const totalReferrals = referrals.length;
  const unclaimedRewards = referrals.filter(r => !r.reward_claimed).length;

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold">Refer Friends</h1>
        <p className="text-muted-foreground">
          Invite friends and earn 250 credits for each successful referral!
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReferrals}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unclaimed Rewards</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unclaimedRewards}</div>
            <p className="text-xs text-muted-foreground">{unclaimedRewards * 250} credits</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {referrals.filter(r => r.reward_claimed).length * 250}
            </div>
            <p className="text-xs text-muted-foreground">credits</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Referral Link</CardTitle>
          <CardDescription>
            Share this link with friends. When they sign up and play their first game, you'll earn 250 credits!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={referralLink}
              readOnly
              className="flex-1"
            />
            <Button onClick={copyReferralLink} variant="outline">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            Your referral code: <span className="font-mono font-bold">{profile?.referral_code}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Referral History</CardTitle>
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No referrals yet. Start sharing your link!
            </p>
          ) : (
            <div className="space-y-4">
              {referrals.map((referral) => (
                <div
                  key={referral.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{referral.referred_profile?.username || 'Unknown User'}</p>
                    <p className="text-sm text-muted-foreground">
                      Joined {new Date(referral.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {!referral.reward_claimed ? (
                    <Button onClick={() => claimReward(referral.referred_id)}>
                      Claim 250 Credits
                    </Button>
                  ) : (
                    <span className="text-sm text-muted-foreground">Claimed ✓</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
