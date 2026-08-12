import { Listing, CategoryId, ServiceStatusType } from '../types';

export function createListing(
  id: string,
  title: string,
  serviceCategoryGroup: string,
  category: CategoryId,
  statusType: ServiceStatusType,
  locationName: string,
  coordinates: [number, number],
  pay: string,
  payValueNumber: number,
  when: string,
  duration: string,
  description: string,
  performerName: string,
  rating: number = 4.9,
  availabilityStatus: 'available' | 'busy' = 'available',
  isUrgent: boolean = false,
  phone: string = '+380 67 000 00 00'
): Listing {
  return {
    id,
    title,
    serviceCategoryGroup,
    category,
    statusType,
    locationName,
    coordinates,
    distanceMeters: 500, // calculated dynamically in App
    pay,
    payValueNumber,
    payType: statusType === 'hourly' ? 'hourly' : statusType === 'daily' ? 'daily' : statusType === 'delivery' ? 'fixed' : 'fixed',
    when,
    duration,
    description,
    performerName,
    rating,
    availabilityStatus,
    phone,
    createdAt: 'Сьогодні',
    isUrgent: isUrgent || statusType === 'urgent',
    verified: true,
    viewsCount: Math.floor(Math.random() * 80) + 15,
    callsCount: Math.floor(Math.random() * 20) + 2,
  };
}
