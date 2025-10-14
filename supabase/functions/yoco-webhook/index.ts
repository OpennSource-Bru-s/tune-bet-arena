import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    console.log('Yoco webhook received');

    // Get the raw body for signature verification
    const body = await req.text();
    const signature = req.headers.get('x-yoco-signature');
    const webhookSecret = Deno.env.get('YOCO_WEBHOOK_SECRET');

    // Verify Yoco signature
    if (!signature || !webhookSecret) {
      console.error('Missing signature or webhook secret');
      return new Response('Unauthorized', { status: 401, headers: corsHeaders });
    }

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(webhookSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(body)
    );

    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    if (signature !== expectedSignature) {
      console.error('Invalid signature');
      return new Response('Unauthorized', { status: 401, headers: corsHeaders });
    }

    // Parse the webhook payload
    const event = JSON.parse(body);
    console.log('Webhook event type:', event.type);

    if (event.type === 'payment.succeeded' || event.status === 'succeeded') {
      const userId = event.metadata?.userId;
      const credits = parseInt(event.metadata?.credits);

      if (!userId || !credits) {
        console.error('Missing userId or credits in metadata');
        return new Response('Bad Request', { status: 400, headers: corsHeaders });
      }

      console.log(`Processing payment for user ${userId}, adding ${credits} credits`);

      // First get current credits, then update atomically
      const { data: currentProfile, error: fetchError } = await supabaseClient
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .single();

      if (fetchError || !currentProfile) {
        console.error('Error fetching profile:', fetchError);
        return new Response('User not found', { status: 404, headers: corsHeaders });
      }

      // Atomically add credits to user profile
      const { error: updateError } = await supabaseClient
        .from('profiles')
        .update({ credits: currentProfile.credits + credits })
        .eq('id', userId);

      if (updateError) {
        console.error('Error updating credits:', updateError);
        return new Response('Internal Server Error', { status: 500, headers: corsHeaders });
      }

      // Create transaction record
      const { error: transactionError } = await supabaseClient
        .from('transactions')
        .insert({
          user_id: userId,
          amount: credits,
          type: 'purchase',
          stripe_payment_id: event.id,
          description: `Purchased ${credits} credits`
        });

      if (transactionError) {
        console.error('Error creating transaction:', transactionError);
        // Don't fail the webhook if transaction logging fails
      }

      console.log(`Successfully added ${credits} credits to user ${userId}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
