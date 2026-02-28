// supabase/functions/notify-vendor-new-order/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ONESIGNAL_APP_ID = Deno.env.get('ONESIGNAL_APP_ID')!;
const ONESIGNAL_REST_API_KEY = Deno.env.get('ONESIGNAL_REST_API_KEY')!;

serve(async (req) => {
  const payload = await req.json();
  const order = payload.record;

  await fetch('https://onesignal.com/api/v1/notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
    },
    body: JSON.stringify({
      app_id: ONESIGNAL_APP_ID,
      include_aliases: { external_id: [order.vendor_id] },
      target_channel: 'push',
      headings: { en: '🛍️ New Order Received!' },
      contents: { en: `Order #${order.order_number} · ₹${order.total_amount} · ${order.item_count} items` },
      data: {
        type: 'vendor_order',
        orderId: order.id,
        screen: 'vendor_order',
      },
    }),
  });

  return new Response(JSON.stringify({ success: true }));
});