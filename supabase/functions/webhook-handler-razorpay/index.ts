import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const payload = await req.json();

    // Only handle payment captured events
    if (payload.event !== "payment.captured") {
      return new Response(JSON.stringify({ message: "Event ignored" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const razorpayOrderId = payload.payload.payment.entity.order_id;
    const razorpayPaymentId = payload.payload.payment.entity.id;

    // ========================================
    // 1. Update Order Group
    // ========================================
    const { data: orderGroup, error: groupError } = await supabase
      .from("order_groups")
      .update({
        payment_status: "paid",
        razorpay_payment_id: razorpayPaymentId,
      })
      .eq("razorpay_order_id", razorpayOrderId)
      .select()
      .single();

    if (groupError || !orderGroup) {
      console.error("Order group not found:", groupError);
      return new Response(
        JSON.stringify({ error: "Order group not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // ========================================
    // 2. Update All Orders in Group
    // ========================================
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .update({
        payment_status: "paid",
        status: "confirmed",
        confirmed_at: new Date().toISOString(),
      })
      .eq("order_group_id", orderGroup.id)
      .select();

    if (ordersError) {
      console.error("Failed to update orders:", ordersError);
      return new Response(
        JSON.stringify({ error: "Failed to update orders" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // ========================================
    // 3. Credit Vendor Wallets (Pending)
    // ========================================
    for (const order of orders ?? []) {
      const { error: walletError } = await supabase.rpc(
        "credit_vendor_wallet_pending",
        {
          p_order_id: order.id,
        }
      );

      if (walletError) {
        console.error(
          `Failed to credit wallet for order ${order.id}:`,
          walletError
        );
        // Continue with other orders even if one fails
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        order_group_id: orderGroup.id,
        orders_updated: orders?.length || 0,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});