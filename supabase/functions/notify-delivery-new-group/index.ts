// supabase/functions/notify-delivery-new-group/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ONESIGNAL_APP_ID     = Deno.env.get('ONESIGNAL_APP_ID')!;
const ONESIGNAL_REST_API_KEY = Deno.env.get('ONESIGNAL_REST_API_KEY')!;

async function sendPushToExternalIds(
  externalIds: string[],
  title: string,
  body: string,
  data: Record<string, string>
) {
  if (externalIds.length === 0) return;

  await fetch('https://onesignal.com/api/v1/notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
    },
    body: JSON.stringify({
      app_id:           ONESIGNAL_APP_ID,
      include_aliases:  { external_id: externalIds },
      target_channel:   'push',
      headings:         { en: title },
      contents:         { en: body },
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
    const group    = payload.record;
    const oldGroup = payload.old_record;

    // ── Guard: only fire when assignment_status changes to 'broadcasting' ──
    if (
      oldGroup?.assignment_status === group.assignment_status ||
      group.assignment_status !== 'broadcasting'
    ) {
      return new Response(JSON.stringify({ skipped: true }));
    }

    // Fetch all online + available + verified delivery boys
    const { data: deliveryBoys, error } = await supabase
      .from('delivery_boys')
      .select('user_id, first_name')
      .eq('is_online', true)
      .eq('is_available', true)
      .eq('is_verified', true)
      .is('suspended_until', null);

    if (error) throw error;
    if (!deliveryBoys || deliveryBoys.length === 0) {
      return new Response(JSON.stringify({ skipped: true, reason: 'no available partners' }));
    }

    // Fetch group details for a rich notification body
    const { data: groupDetail } = await supabase
      .from('order_groups')
      .select(`
        id,
        total_amount,
        delivery_fee,
        payment_method,
        subtotal,
        orders(
          id,
          vendors!inner(store_name, city)
        )
      `)
      .eq('id', group.id)
      .single();

    const vendorNames = [
      ...new Set(
        (groupDetail?.orders ?? [])
          .map((o: any) => o.vendors?.store_name)
          .filter(Boolean)
      ),
    ].join(', ');

    const orderCount   = (groupDetail?.orders ?? []).length;
    const deliveryFee  = Number(groupDetail?.delivery_fee ?? 0);
    const paymentMethod = (groupDetail?.payment_method ?? '').toUpperCase();

    const title = '🛵 New Order Group Available!';
    const body  = `${orderCount} order${orderCount > 1 ? 's' : ''} from ${vendorNames} · ₹${deliveryFee.toFixed(2)} payout · ${paymentMethod}`;

    const externalIds = deliveryBoys.map((d: any) => d.user_id);

    await sendPushToExternalIds(externalIds, title, body, {
      type:         'new_order_group',
      orderGroupId: group.id,
      screen:       'delivery_order_detail',
    });

    return new Response(JSON.stringify({ success: true, notified: externalIds.length }));
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500 }
    );
  }
});