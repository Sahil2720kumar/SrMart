import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std/crypto/mod.ts";

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

    const webhookSecret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");
    const body = await req.text(); // read as text for signature verification

    // ✅ Verify webhook signature (security check)
    // Ensures request is actually from Razorpay, not a fake request
    if (webhookSecret) {
      const razorpaySignature = req.headers.get("x-razorpay-signature");

      if (!razorpaySignature) {
        console.error("Missing x-razorpay-signature header");
        return new Response(
          JSON.stringify({ error: "Missing signature" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // HMAC-SHA256 verification
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(webhookSecret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );

      const signature = await crypto.subtle.sign(
        "HMAC",
        key,
        encoder.encode(body)
      );

      const expectedSignature = Array.from(new Uint8Array(signature))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      if (expectedSignature !== razorpaySignature) {
        console.error("Signature mismatch");
        return new Response(
          JSON.stringify({ error: "Invalid signature" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("✅ Webhook signature verified");
    } else {
      console.warn("⚠️ RAZORPAY_WEBHOOK_SECRET not set — skipping signature verification");
    }

    const payload = JSON.parse(body);
    console.log("Webhook event received:", payload.event);

    // Only handle payment.captured
    if (payload.event !== "payment.captured") {
      console.log("Ignoring event:", payload.event);
      return new Response(
        JSON.stringify({ message: "Event ignored" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const paymentEntity = payload.payload.payment.entity;
    const razorpayOrderId = paymentEntity.order_id;
    const razorpayPaymentId = paymentEntity.id;
    const amountPaid = paymentEntity.amount; // in paise

    console.log("Payment captured:", {
      razorpayOrderId,
      razorpayPaymentId,
      amountPaid,
    });

    if (!razorpayOrderId) {
      console.error("No razorpay order_id in payload");
      return new Response(
        JSON.stringify({ error: "Missing razorpay order_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Find order group by razorpay_order_id
    const { data: orderGroup, error: groupFetchError } = await supabase
      .from("order_groups")
      .select("id, payment_status, customer_id")
      .eq("razorpay_order_id", razorpayOrderId)
      .single();

    if (groupFetchError || !orderGroup) {
      console.error("Order group not found for razorpay_order_id:", razorpayOrderId, groupFetchError);
      return new Response(
        JSON.stringify({ error: "Order group not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Guard: skip if already paid (webhook can fire multiple times)
    if (orderGroup.payment_status === "paid") {
      console.log("Order group already marked as paid, skipping:", orderGroup.id);
      return new Response(
        JSON.stringify({ message: "Already processed" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Updating order group:", orderGroup.id);

    // 2. Update order group — mark as paid
    const { error: groupUpdateError } = await supabase
      .from("order_groups")
      .update({
        payment_status: "paid",
        razorpay_payment_id: razorpayPaymentId,
        status: "confirmed",
      })
      .eq("id", orderGroup.id);

    if (groupUpdateError) {
      console.error("Failed to update order group:", groupUpdateError);
      return new Response(
        JSON.stringify({ error: "Failed to update order group" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Update all individual orders in this group
    const { data: orders, error: ordersUpdateError } = await supabase
      .from("orders")
      .update({
        payment_status: "paid",
        status: "confirmed",
        confirmed_at: new Date().toISOString(),
      })
      .eq("order_group_id", orderGroup.id)
      .select("id, vendor_id");

    if (ordersUpdateError) {
      console.error("Failed to update orders:", ordersUpdateError);
      return new Response(
        JSON.stringify({ error: "Failed to update orders" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Updated orders:", orders?.length);

    // 4. Credit vendor wallets (pending balance)
    const walletResults = [];
    for (const order of orders ?? []) {
      const { error: walletError } = await supabase.rpc(
        "credit_vendor_wallet_pending",
        { p_order_id: order.id }
      );

      if (walletError) {
        console.error(`Failed to credit wallet for order ${order.id}:`, walletError);
        walletResults.push({ order_id: order.id, success: false, error: walletError.message });
      } else {
        console.log(`✅ Wallet credited for order ${order.id}`);
        walletResults.push({ order_id: order.id, success: true });
      }
    }

    // 5. Log payment transaction for records
    if (orders && orders.length > 0) {
      const { error: txError } = await supabase
        .from("payment_transactions")
        .insert({
          order_id: orders[0].id, // link to first order
          amount: amountPaid / 100, // convert back to rupees
          payment_method: "upi",
          status: "success",
          transaction_id: razorpayPaymentId,
          gateway_name: "razorpay",
          gateway_response: paymentEntity,
        });

      if (txError) {
        console.error("Failed to log payment transaction:", txError);
        // Non-fatal, continue
      }
    }

    console.log("✅ Webhook processing complete for order group:", orderGroup.id);

    return new Response(
      JSON.stringify({
        success: true,
        order_group_id: orderGroup.id,
        orders_updated: orders?.length || 0,
        wallet_results: walletResults,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Webhook handler crashed:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});