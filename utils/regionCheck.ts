// utils/regionCheck.ts

export interface ServiceRegion {
  name: string;
  lat: number;
  lng: number;
  radiusKm: number;
}

export const SERVICE_REGIONS: ServiceRegion[] = [
  {
    name: "Dibrugarh",
    lat: 27.4728,
    lng: 94.9120,
    radiusKm: 20,
  },
  {
    name: "Guwahati",
    lat: 26.1445,
    lng: 91.7362,
    radiusKm: 25,
  },
  // Add more regions here easily
];

/**
 * Calculates the distance between two points using the Haversine formula
 */
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
    
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Checks if a location is within any serviceable region.
 * Returns the region object if found, otherwise null.
 */
export function getServiceableRegion(lat: number, lng: number): ServiceRegion | null {
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;

  for (const region of SERVICE_REGIONS) {
    const distance = getDistanceKm(lat, lng, region.lat, region.lng);
    if (distance <= region.radiusKm) {
      return region; // Returns the first region that matches
    }
  }
  return null;
}