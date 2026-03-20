// supabase/functions/notify-delivery-pickup-ready/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ONESIGNAL_APP_ID       = Deno.env.get('ONESIGNAL_APP_ID')!;
const ONESIGNAL_REST_API_KEY = Deno.env.get('ONESIGNAL_REST_API_KEY')!;

async function sendPush(
  externalId: string,
  title: string,
  body: string,
  data: Record<string, string>
) {
  await fetch('https://onesignal.com/api/v1/notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
    },
    body: JSON.stringify({
      app_id:          ONESIGNAL_APP_ID,
      include_aliases: { external_id: [externalId] },
      target_channel:  'push',
      headings:        { en: title },
      contents:        { en: body },
      data,
    }),
  });
}

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const payload  = await req.json();
    const order    = payload.record;
    const oldOrder = payload.old_record;

    // Only fire when status changes TO 'ready_for_pickup'
    if (
      oldOrder?.status === order.status ||
      order.status !== 'ready_for_pickup'
    ) {
      return new Response(JSON.stringify({ skipped: true }));
    }

    // No delivery boy assigned — nothing to notify
    if (!order.delivery_boy_id) {
      return new Response(
        JSON.stringify({ skipped: true, reason: 'no delivery boy assigned' })
      );
    }

    // Fetch the vendor that just marked ready
    const { data: readyVendor } = await supabase
      .from('vendors')
      .select('store_name, city')
      .eq('user_id', order.vendor_id)
      .single();

    const readyVendorName = readyVendor?.store_name ?? 'A vendor';
    const readyVendorCity = readyVendor?.city ?? '';

    // If this order belongs to a group, fetch ALL orders in the group
    // with their vendor info and statuses
    if (order.order_group_id) {
      const { data: groupOrders } = await supabase
        .from('orders')
        .select(`
          id,
          status,
          order_number,
          vendor_id,
          vendors!inner(store_name, city)
        `)
        .eq('order_group_id', order.order_group_id)
        .neq('status', 'cancelled');

      if (!groupOrders || groupOrders.length === 0) {
        return new Response(JSON.stringify({ skipped: true, reason: 'no group orders found' }));
      }

      const totalOrders = groupOrders.length;

      // Categorise each order
      const readyOrders = groupOrders.filter((o: any) =>
        ['ready_for_pickup', 'picked_up', 'out_for_delivery', 'delivered'].includes(o.status)
      );
      const preparingOrders = groupOrders.filter((o: any) =>
        !['ready_for_pickup', 'picked_up', 'out_for_delivery', 'delivered', 'cancelled'].includes(o.status)
      );

      const readyCount    = readyOrders.length;
      const preparingCount = preparingOrders.length;
      const allReady      = preparingCount === 0;

      let title: string;
      let body: string;

      if (allReady) {
        // Every vendor in the group is ready
        const vendorNames = groupOrders
          .map((o: any) => o.vendors?.store_name)
          .filter(Boolean)
          .join(', ');

        title = '✅ All Orders Ready for Pickup!';
        body  = `All ${totalOrders} orders ready · ${vendorNames} · Head out now!`;

      } else {
        // Some ready, some still preparing
        const readyNames = readyOrders
          .map((o: any) => o.vendors?.store_name)
          .filter(Boolean)
          .join(', ');

        const preparingNames = preparingOrders
          .map((o: any) => o.vendors?.store_name)
          .filter(Boolean)
          .join(', ');

        title = `📦 ${readyCount}/${totalOrders} Orders Ready`;
        body  = `Ready: ${readyNames} · Still preparing: ${preparingNames}`;
      }

      await sendPush(order.delivery_boy_id, title, body, {
        type:          'pickup_ready',
        orderId:       order.id,
        orderGroupId:  order.order_group_id,
        vendorId:      order.vendor_id,
        readyCount:    String(readyCount),
        totalCount:    String(totalOrders),
        allReady:      String(allReady),
        screen:        'delivery_order_detail',
      });

      return new Response(JSON.stringify({
        success:    true,
        all_ready:  allReady,
        ready:      readyCount,
        preparing:  preparingCount,
        total:      totalOrders,
      }));

    } else {
      // Single order (not in a group) — simple notification
      const title = '📦 Order Ready for Pickup!';
      const body  = `${readyVendorName}${readyVendorCity ? ', ' + readyVendorCity : ''} · #${order.order_number} is ready. Head over!`;

      await sendPush(order.delivery_boy_id, title, body, {
        type:         'pickup_ready',
        orderId:      order.id,
        orderGroupId: '',
        vendorId:     order.vendor_id,
        readyCount:   '1',
        totalCount:   '1',
        allReady:     'true',
        screen:       'delivery_order_detail',
      });

      return new Response(JSON.stringify({ success: true, all_ready: true }));
    }

  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500 }
    );
  }
});