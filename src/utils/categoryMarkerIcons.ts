import { Listing, CATEGORIES, CategoryId } from '../types';
import { formatDistance } from './distance';

export interface MarkerConfig {
  iconSvg: string;
  bgColor: string;       // Hex or Tailwind bg
  borderColor: string;   // Hex or border color
  textColor: string;     // Accent text
  glowClass: string;
  categoryLabel: string;
}

// Crisp inline 24x24 SVG paths for Lucide-style icons
const SVG_ICONS = {
  // Electricity / Електрика
  bolt: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>`,
  
  // Plumbing / Сантехніка
  wrench: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`,
  
  // Heating / Опалення
  flame: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3.5z"/></svg>`,
  
  // Construction / Будівництво
  hammer: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 12-8.5 8.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L12 9"/><path d="M17.64 15 22 10.64"/><path d="m20.91 3.26-2.17-2.17a2 2 0 0 0-2.83 0l-8.4 8.41a2 2 0 0 0 0 2.83l2.17 2.17a2 2 0 0 0 2.83 0l8.4-8.41a2 2 0 0 0 0-2.83Z"/></svg>`,
  
  // Internet / Зв'язок
  wifi: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h.01"/><path d="M2 8.82a15 15 0 0 1 20 0"/><path d="M5 12.85a10 10 0 0 1 14 0"/><path d="M8.5 16.42a5 5 0 0 1 7 0"/></svg>`,
  
  // Emergency / Терміново
  siren: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 18v-6a5 5 0 1 1 10 0v6"/><path d="M5 21h14"/><path d="M12 2v2"/><path d="M12 18v3"/></svg>`,
  
  // Machinery / Техніка
  tractor: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m10 11 11 .01"/><path d="M18 11V5a1 1 0 0 0-1-1h-5"/><path d="M3 17h8"/><circle cx="7" cy="17" r="4"/><circle cx="18" cy="18" r="3"/><path d="M7 17l2-6h5l2 6"/></svg>`,
  
  // Garden / Seasonal / Сад / Сезонна
  leaf: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.4 19 2c1.2 5 1 10-2 13a8 8 0 0 1-6 5z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>`,
  
  // Delivery / Доставка
  truck: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>`,
  
  // Auto / Авто
  car: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C1.4 11.2 1 12.1 1 13v3c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="18" r="2"/></svg>`,
  
  // Part-time / Підробіток
  briefcase: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
  
  // Full-time / Робота
  building: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="9" y1="6" x2="9" y2="6.01"/><line x1="15" y1="6" x2="15" y2="6.01"/><line x1="9" y1="10" x2="9" y2="10.01"/><line x1="15" y1="10" x2="15" y2="10.01"/><line x1="9" y1="14" x2="9" y2="14.01"/><line x1="15" y1="14" x2="15" y2="14.01"/><line x1="9" y1="18" x2="15" y2="18"/></svg>`,
  
  // Sale / Продаж
  bag: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`,
  
  // Help / Допомога
  heart: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`,
  
  // Domestic / Побут
  home: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
};

/**
 * Returns distinct SVG icon, color theme, and label based on listing category and service group.
 */
export function getMarkerConfig(listing: Listing): MarkerConfig {
  const group = (listing.serviceCategoryGroup || '').toUpperCase();
  const category = listing.category;

  // 1. Urgent Listing Override
  if (listing.isUrgent || category === 'urgent') {
    return {
      iconSvg: SVG_ICONS.siren,
      bgColor: 'bg-rose-600',
      borderColor: 'border-rose-300',
      textColor: 'text-rose-200',
      glowClass: 'cosmic-glow-red ring-2 ring-rose-500/80',
      categoryLabel: 'Терміново',
    };
  }

  // 2. Specific Service Category Group Checks
  if (group.includes('ЕЛЕКТРИКА')) {
    return {
      iconSvg: SVG_ICONS.bolt,
      bgColor: 'bg-amber-500',
      borderColor: 'border-amber-200',
      textColor: 'text-amber-200',
      glowClass: 'shadow-amber-900/60 ring-2 ring-amber-400/80',
      categoryLabel: 'Електрика',
    };
  }

  if (group.includes('САНТЕХНІКА')) {
    return {
      iconSvg: SVG_ICONS.wrench,
      bgColor: 'bg-sky-500',
      borderColor: 'border-sky-200',
      textColor: 'text-sky-200',
      glowClass: 'shadow-sky-900/60 ring-2 ring-sky-400/80',
      categoryLabel: 'Сантехніка',
    };
  }

  if (group.includes('ОПАЛЕННЯ')) {
    return {
      iconSvg: SVG_ICONS.flame,
      bgColor: 'bg-orange-600',
      borderColor: 'border-orange-200',
      textColor: 'text-orange-200',
      glowClass: 'shadow-orange-900/60 ring-2 ring-orange-400/80',
      categoryLabel: 'Опалення',
    };
  }

  if (group.includes('БУДІВНИЦТВО') || group.includes('ДВЕРІ')) {
    return {
      iconSvg: SVG_ICONS.hammer,
      bgColor: 'bg-yellow-600',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-200',
      glowClass: 'shadow-yellow-900/60 ring-2 ring-yellow-400/80',
      categoryLabel: 'Будівництво',
    };
  }

  if (group.includes('ГОРОД') || group.includes('САД') || category === 'seasonal') {
    return {
      iconSvg: SVG_ICONS.leaf,
      bgColor: 'bg-emerald-600',
      borderColor: 'border-emerald-200',
      textColor: 'text-emerald-200',
      glowClass: 'shadow-emerald-900/60 ring-2 ring-emerald-400/80',
      categoryLabel: 'Сад / Город',
    };
  }

  if (group.includes('ДОСТАВКА')) {
    return {
      iconSvg: SVG_ICONS.truck,
      bgColor: 'bg-blue-600',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-200',
      glowClass: 'shadow-blue-900/60 ring-2 ring-blue-400/80',
      categoryLabel: 'Доставка',
    };
  }

  if (group.includes('АВТО')) {
    return {
      iconSvg: SVG_ICONS.car,
      bgColor: 'bg-violet-600',
      borderColor: 'border-violet-200',
      textColor: 'text-violet-200',
      glowClass: 'shadow-violet-900/60 ring-2 ring-violet-400/80',
      categoryLabel: 'Автопослуги',
    };
  }

  if (group.includes('ПОБУТ')) {
    return {
      iconSvg: SVG_ICONS.home,
      bgColor: 'bg-indigo-600',
      borderColor: 'border-indigo-200',
      textColor: 'text-indigo-200',
      glowClass: 'shadow-indigo-900/60 ring-2 ring-indigo-400/80',
      categoryLabel: 'Побут',
    };
  }

  // 3. Category Fallbacks
  switch (category) {
    case 'rideshare':
      if (listing.rideRole === 'passenger') {
        return {
          iconSvg: SVG_ICONS.briefcase,
          bgColor: 'bg-orange-600',
          borderColor: 'border-orange-300',
          textColor: 'text-orange-200',
          glowClass: 'shadow-orange-900/80 ring-2 ring-orange-500/80',
          categoryLabel: 'Пасажир (Підвіз)',
        };
      }
      return {
        iconSvg: SVG_ICONS.car,
        bgColor: 'bg-sky-600',
        borderColor: 'border-sky-300',
        textColor: 'text-sky-200',
        glowClass: 'shadow-sky-900/80 ring-2 ring-sky-400/80',
        categoryLabel: 'Водій (Підвіз)',
      };
    case 'sale_goods':
      return {
        iconSvg: SVG_ICONS.bag,
        bgColor: 'bg-emerald-600',
        borderColor: 'border-emerald-200',
        textColor: 'text-emerald-200',
        glowClass: 'shadow-emerald-900/60 ring-2 ring-emerald-400/80',
        categoryLabel: 'Товари / Побут',
      };
    case 'sale_auto_build':
      return {
        iconSvg: SVG_ICONS.hammer,
        bgColor: 'bg-amber-600',
        borderColor: 'border-amber-200',
        textColor: 'text-amber-200',
        glowClass: 'shadow-amber-900/60 ring-2 ring-amber-400/80',
        categoryLabel: 'Авто / Будматеріали',
      };
    case 'internet':
      return {
        iconSvg: SVG_ICONS.wifi,
        bgColor: 'bg-cyan-500',
        borderColor: 'border-cyan-200',
        textColor: 'text-cyan-200',
        glowClass: 'shadow-cyan-900/60 ring-2 ring-cyan-400/80',
        categoryLabel: 'Інтернет',
      };
    case 'machinery':
      return {
        iconSvg: SVG_ICONS.tractor,
        bgColor: 'bg-purple-600',
        borderColor: 'border-purple-200',
        textColor: 'text-purple-200',
        glowClass: 'shadow-purple-900/60 ring-2 ring-purple-400/80',
        categoryLabel: 'Техніка',
      };
    case 'part_time':
      return {
        iconSvg: SVG_ICONS.briefcase,
        bgColor: 'bg-orange-500',
        borderColor: 'border-orange-200',
        textColor: 'text-orange-200',
        glowClass: 'shadow-orange-900/60 ring-2 ring-orange-400/80',
        categoryLabel: 'Підробіток',
      };
    case 'full_time':
      return {
        iconSvg: SVG_ICONS.building,
        bgColor: 'bg-teal-600',
        borderColor: 'border-teal-200',
        textColor: 'text-teal-200',
        glowClass: 'shadow-teal-900/60 ring-2 ring-teal-400/80',
        categoryLabel: 'Робота',
      };
    case 'sale':
      return {
        iconSvg: SVG_ICONS.bag,
        bgColor: 'bg-pink-600',
        borderColor: 'border-pink-200',
        textColor: 'text-pink-200',
        glowClass: 'shadow-pink-900/60 ring-2 ring-pink-400/80',
        categoryLabel: 'Продаж',
      };
    case 'help':
      return {
        iconSvg: SVG_ICONS.heart,
        bgColor: 'bg-fuchsia-600',
        borderColor: 'border-fuchsia-200',
        textColor: 'text-fuchsia-200',
        glowClass: 'shadow-fuchsia-900/60 ring-2 ring-fuchsia-400/80',
        categoryLabel: 'Допомога',
      };
    case 'service':
    default:
      return {
        iconSvg: SVG_ICONS.wrench,
        bgColor: 'bg-blue-600',
        borderColor: 'border-blue-200',
        textColor: 'text-blue-200',
        glowClass: 'shadow-blue-900/60 ring-2 ring-blue-400/80',
        categoryLabel: 'Послуги',
      };
  }
}

/**
 * Renders HTML string for Leaflet Marker Icon.
 */
export function renderMarkerHtml(
  listing: Listing,
  isSelected: boolean,
  isNavTarget: boolean
): string {
  if (isNavTarget) {
    return `
      <div class="relative -translate-x-1/2 -translate-y-1/2 cursor-pointer z-50">
        <div class="w-12 h-12 bg-cyan-400 text-slate-950 rounded-full flex items-center justify-center font-black shadow-2xl border-2 border-white animate-bounce ring-4 ring-cyan-500/50">
          🏁
        </div>
        <div class="absolute top-12 left-1/2 -translate-x-1/2 bg-slate-950 text-cyan-200 text-xs font-black px-2.5 py-1 rounded-lg border border-cyan-400 whitespace-nowrap shadow-xl">
          Пункт призначення
        </div>
      </div>
    `;
  }

  const config = getMarkerConfig(listing);
  const distText = formatDistance(listing.distanceMeters);

  const isRideshare = listing.category === 'rideshare';
  const badgeLabel = isRideshare && listing.rideRouteFrom && listing.rideRouteTo
    ? `${listing.rideRole === 'passenger' ? '🙋‍♂️' : '🚗'} ${listing.rideRouteFrom} ➔ ${listing.rideRouteTo}`
    : `📍 ${distText}`;

  const sizeClass = isSelected
    ? 'w-11 h-11 scale-125 z-50 ring-4 ring-purple-300'
    : 'w-10 h-10 hover:scale-110 z-20';

  return `
    <div class="relative -translate-x-1/2 -translate-y-1/2 cursor-pointer group transition-all duration-200 ${sizeClass}">
      <!-- Outer Glow/Badge Container -->
      <div class="${config.bgColor} ${config.glowClass} text-white rounded-2xl p-2 flex items-center justify-center shadow-xl border-2 ${config.borderColor} transition-transform">
        ${config.iconSvg}
      </div>

      <!-- Distance & Category Badge -->
      <div class="absolute top-11 left-1/2 -translate-x-1/2 bg-slate-950/95 ${config.textColor} text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg whitespace-nowrap border border-purple-800/80 backdrop-blur-md flex items-center gap-1">
        <span>${badgeLabel}</span>
      </div>
    </div>
  `;
}
