import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

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

    // Define validation schema
    const CheckoutSchema = z.object({
      amount: z.number()
        .positive('Amount must be positive')
        .min(9.99, 'Minimum purchase is R9.99')
        .max(10000, 'Maximum purchase is R10,000')
        .finite('Invalid amount'),
      credits: z.number()
        .int('Credits must be an integer')
        .positive('Credits must be positive')
        .min(100, 'Minimum 100 credits')
        .max(100000, 'Maximum 100,000 credits')
    });

    // Parse and validate request body
    const body = await req.json();
    const validationResult = CheckoutSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid input', 
          details: validationResult.error.errors 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    const { amount, credits } = validationResult.data;

    // Validate against allowed packages
    const validPackages = [
      { amount: 9.99, credits: 100 },
      { amount: 39.99, credits: 500 },
      { amount: 69.99, credits: 1000 },
      { amount: 249.99, credits: 5000 }
    ];

    const isValidPackage = validPackages.some(pkg => 
      pkg.amount === amount && pkg.credits === credits
    );

    if (!isValidPackage) {
      return new Response(
        JSON.stringify({ error: 'Invalid package configuration' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
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
