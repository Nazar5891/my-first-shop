import { Listing, SortOption } from '../types';

/**
 * Calculates distance between two lat/lng coordinates in meters using Haversine formula
 */
export function calculateDistanceMeters(
  lat1?: number | null,
  lon1?: number | null,
  lat2?: number | null,
  lon2?: number | null
): number {
  if (
    lat1 == null ||
    lon1 == null ||
    lat2 == null ||
    lon2 == null ||
    isNaN(lat1) ||
    isNaN(lon1) ||
    isNaN(lat2) ||
    isNaN(lon2)
  ) {
    return 0;
  }
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Formats distance in meters to clean Ukrainian text: "350 м" or "2,4 км"
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters} м`;
  }
  const km = (meters / 1000).toFixed(1).replace('.', ',');
  return `${km} км`;
}

/**
 * Formats phone number for display
 */
export function formatPhoneDisplay(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 12 && cleaned.startsWith('380')) {
    return `+380 (${cleaned.slice(3, 5)}) ${cleaned.slice(5, 8)}-${cleaned.slice(8, 10)}-${cleaned.slice(10, 12)}`;
  }
  return phone;
}

/**
 * Sorts listings based on selected option.
 * Note: URGENT listings ALWAYS float to the top unless specifically filtered out!
 */
export function sortListings(listings: Listing[], sortBy: SortOption): Listing[] {
  return [...listings].sort((a, b) => {
    // Priority rule: Urgent listings stay at the top!
    if (a.isUrgent && !b.isUrgent) return -1;
    if (!a.isUrgent && b.isUrgent) return 1;

    if (sortBy === 'urgent') {
      // both urgent or both non-urgent, sort by created
      return a.distanceMeters - b.distanceMeters;
    }

    if (sortBy === 'distance') {
      return a.distanceMeters - b.distanceMeters;
    }

    if (sortBy === 'pay') {
      return b.payValueNumber - a.payValueNumber;
    }

    if (sortBy === 'newest') {
      // urgent or id comparison
      return b.id.localeCompare(a.id);
    }

    return 0;
  });
}
