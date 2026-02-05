import { supabase } from "@/lib/supabase";

export const getDeliveryFee = async (distanceKm: number) => {
  const { data, error } = await supabase.rpc(
    "calculate_delivery_fee",
    {
      p_distance_km: distanceKm,
    }
  );

  if (error) {
    console.error("Delivery fee error:", error);
    return 0;
  }

  return data; // numeric value
};

 // Haversine formula to calculate distance between two coordinates
 export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371 // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c

  return distance
}

export const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180)
}
