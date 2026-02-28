// supabase/functions/send-promo-notification/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const ONESIGNAL_APP_ID = Deno.env.get('ONESIGNAL_APP_ID')!;
const ONESIGNAL_REST_API_KEY = Deno.env.get('ONESIGNAL_REST_API_KEY')!;

serve(async (req) => {
  const { title, message, imageUrl, offerId } = await req.json();

  const response = await fetch('https://onesignal.com/api/v1/notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
    },
    body: JSON.stringify({
      app_id: ONESIGNAL_APP_ID,
      filters: [{ field: 'tag', key: 'role', relation: '=', value: 'customer' }],
      headings: { en: title },
      contents: { en: message },
      big_picture: imageUrl,
      ios_attachments: { image: imageUrl },
      data: {
        // Matches your route: app/(tabs)/customer/offers/[offerId].tsx
        screen: '/(tabs)/customer/offers',
        offerId: offerId,         // → navigates to /offers/[offerId]
        type: 'offer',
      },
    }),
  });

  const result = await response.json();
  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' },
  });
});