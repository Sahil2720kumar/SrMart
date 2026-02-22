import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const keyId = Deno.env.get("RAZORPAY_KEY_ID")!;
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET")!;

    const body = await req.json();
    const { amount: directAmount, order_group_id } = body;

    console.log("Received request body:", body);

    let amountInPaise: number;

    if (directAmount !== undefined && directAmount !== null) {
      // Amount passed directly from app (online payment before order creation)
      amountInPaise = Math.round(directAmount * 100);
      console.log("Using direct amount:", directAmount, "→ paise:", amountInPaise);
    } else if (order_group_id) {
      // Fallback: fetch from order_groups table
      const { data: orderGroup, error: fetchError } = await supabase
        .from("order_groups")
        .select("total_amount")
        .eq("id", order_group_id)
        .single();

      if (fetchError || !orderGroup) {
        console.error("Order group fetch error:", fetchError);
        return new Response(
          JSON.stringify({ error: "Order group not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      amountInPaise = Math.round(orderGroup.total_amount * 100);
      console.log("Using order_group total_amount:", orderGroup.total_amount, "→ paise:", amountInPaise);
    } else {
      return new Response(
        JSON.stringify({ error: "Either amount or order_group_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Razorpay minimum is 100 paise (₹1)
    if (amountInPaise < 100) {
      console.error("Amount too low:", amountInPaise);
      return new Response(
        JSON.stringify({ error: "Amount must be at least ₹1" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Creating Razorpay order with amount (paise):", amountInPaise);

    // Create Razorpay order
    const razorpayRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Basic " + btoa(`${keyId}:${keySecret}`),
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: "INR",
        receipt: order_group_id || `receipt-${Date.now()}`,
        notes: order_group_id ? { order_group_id } : {},
      }),
    });

    const razorpayOrder = await razorpayRes.json();
    console.log("Razorpay response:", razorpayOrder);

    if (!razorpayRes.ok) {
      console.error("Razorpay API error:", razorpayOrder);
      return new Response(
        JSON.stringify({
          error: razorpayOrder.error?.description || "Failed to create Razorpay order",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If order_group_id was provided, save razorpay_order_id back to DB
    if (order_group_id) {
      const { error: updateError } = await supabase
        .from("order_groups")
        .update({ razorpay_order_id: razorpayOrder.id })
        .eq("id", order_group_id);

      if (updateError) {
        console.error("Failed to save razorpay_order_id:", updateError);
        // Non-fatal, continue
      }
    }

    return new Response(
      JSON.stringify({
        razorpay_order_id: razorpayOrder.id,
        amount: razorpayOrder.amount,       // in paise
        currency: razorpayOrder.currency,
        key_id: keyId,                      // public key, safe to send
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});