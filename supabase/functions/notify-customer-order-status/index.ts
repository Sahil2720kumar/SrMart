// supabase/functions/notify-customer-order-status/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ONESIGNAL_APP_ID = Deno.env.get('ONESIGNAL_APP_ID')!;
const ONESIGNAL_REST_API_KEY = Deno.env.get('ONESIGNAL_REST_API_KEY')!;

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const payload = await req.json();
  const order = payload.record;
  const oldOrder = payload.old_record;

  // Only fire when status actually changes
  if (order.status === oldOrder.status) {
    return new Response(JSON.stringify({ skipped: true }));
  }

  const statusMessages: Record<string, { title: string; body: string }> = {
    confirmed: {
      title: '✅ Order Confirmed!',
      body: `Your order #${order.order_number} has been confirmed`,
    },
    picked_up: {
      title: '🚴 Order On The Way!',
      body: `Your order #${order.order_number} is picked up & heading to you`,
    },
    delivered: {
      title: '🎉 Order Delivered!',
      body: `Your order #${order.order_number} has been delivered. Enjoy!`,
    },
    cancelled: {
      title: '❌ Order Cancelled',
      body: `Your order #${order.order_number} has been cancelled`,
    },
    ready_for_pickup: {
      title: '📦 Order Ready!',
      body: `Your order #${order.order_number} is ready for pickup`,
    },
  };

  const notif = statusMessages[order.status];
  if (!notif) return new Response(JSON.stringify({ skipped: true }));

  await fetch('https://onesignal.com/api/v1/notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
    },
    body: JSON.stringify({
      app_id: ONESIGNAL_APP_ID,
      // Target specific customer
      include_aliases: { external_id: [order.customer_id] },
      target_channel: 'push',
      headings: { en: notif.title },
      contents: { en: notif.body },
      data: {
        // Matches: app/(tabs)/customer/order/order-groups/orders/[orderId].tsx
        type: 'order',
        orderId: order.id,
        orderGroupId: order.order_group_id,
        screen: 'customer_order',
      },
    }),
  });

  return new Response(JSON.stringify({ success: true }));
});