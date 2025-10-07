import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    
    if (!user?.email) {
      throw new Error("User not authenticated");
    }

    const { amount, credits } = await req.json();

    if (!amount || !credits) {
      throw new Error("Amount and credits are required");
    }

    const yocoSecretKey = Deno.env.get("YOCO_SECRET_KEY");
    if (!yocoSecretKey) {
      throw new Error("YOCO_SECRET_KEY is not configured");
    }

    // Create Yoco checkout session
    const yocoResponse = await fetch("https://api.yoco.com/v1/checkouts", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${yocoSecretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amount * 100, // Convert to cents
        currency: "ZAR",
        successUrl: `${req.headers.get("origin")}/store?success=true&credits=${credits}`,
        cancelUrl: `${req.headers.get("origin")}/store?cancelled=true`,
        failureUrl: `${req.headers.get("origin")}/store?failed=true`,
        metadata: {
          userId: user.id,
          credits: credits.toString(),
          email: user.email,
        },
      }),
    });

    if (!yocoResponse.ok) {
      const error = await yocoResponse.text();
      throw new Error(`Yoco API error: ${error}`);
    }

    const checkout = await yocoResponse.json();

    return new Response(JSON.stringify({ redirectUrl: checkout.redirectUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Error creating Yoco checkout:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
