import { Listing } from '../types';
import { DOMESTIC_SERVICES } from './servicesDomestic';
import { TECHNICAL_SERVICES } from './servicesTechnical';
import { CONSTRUCTION_SERVICES } from './servicesConstruction';
import { TRANSPORT_SERVICES } from './servicesTransport';
import { RIDESHARE_LISTINGS } from './rideshareListings';
import { SALES_LISTINGS } from './salesListings';

// Center coordinates: Rokytne, Rivne Oblast (51.2825, 27.2130)
export const COMMUNITY_CENTER: [number, number] = [51.2825, 27.2130];
export const COMMUNITY_NAME = "смт Рокитне та Рокитнівська громада";

export const INITIAL_LISTINGS: Listing[] = [
  ...RIDESHARE_LISTINGS,
  ...SALES_LISTINGS,
  ...DOMESTIC_SERVICES,
  ...TECHNICAL_SERVICES,
  ...CONSTRUCTION_SERVICES,
  ...TRANSPORT_SERVICES,
];
