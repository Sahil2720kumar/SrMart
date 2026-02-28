// supabase/functions/notify-delivery-assigned/index.ts
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

  // Only fire when delivery_boy_id is newly assigned
  if (!order.delivery_boy_id || order.delivery_boy_id === oldOrder.delivery_boy_id) {
    return new Response(JSON.stringify({ skipped: true }));
  }

  // Get vendor store name for context
  const { data: vendor } = await supabase
    .from('vendors')
    .select('store_name, address, city')
    .eq('user_id', order.vendor_id)
    .single();

  await fetch('https://onesignal.com/api/v1/notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
    },
    body: JSON.stringify({
      app_id: ONESIGNAL_APP_ID,
      include_aliases: { external_id: [order.delivery_boy_id] },
      target_channel: 'push',
      headings: { en: '🚴 New Delivery Assigned!' },
      contents: {
        en: `Pickup from ${vendor?.store_name} · Order #${order.order_number}`,
      },
      data: {
        // Matches: app/delivery/order/[orderId].tsx
        type: 'delivery_order',
        orderId: order.id,
        screen: 'delivery_order',
      },
    }),
  });

  return new Response(JSON.stringify({ success: true }));
});