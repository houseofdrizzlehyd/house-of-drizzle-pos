// Store location + delivery-radius helpers, shared by the checkout page
// (client-side live feedback) and the orders API (server-side enforcement —
// never trust a client-sent distance).

export const STORE_LAT = 17.321433978265425;
export const STORE_LNG = 78.57049417116448;

/** Great-circle distance between two lat/lng points, in kilometers. */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth radius, km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function distanceFromStoreKm(lat: number, lng: number): number {
  return haversineKm(STORE_LAT, STORE_LNG, lat, lng);
}
