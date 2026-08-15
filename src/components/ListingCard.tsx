import React from 'react';
import { Phone, MapPin, Clock, Siren, Users, Navigation } from 'lucide-react';
import { Listing, CATEGORIES, URGENCY_LEVELS_MAP } from '../types';
import { formatDistance } from '../utils/distance';

interface ListingCardProps {
  listing: Listing;
  onClick: () => void;
  onCallClick?: (e: React.MouseEvent) => void;
  isSelected?: boolean;
  variant?: 'compact' | 'full' | 'horizontal';
  index?: number;
}

export const ListingCard: React.FC<ListingCardProps> = ({ listing, onClick, onCallClick, isSelected = false, variant = 'compact', index = 0 }) => {
  const cat = CATEGORIES[listing.category] || CATEGORIES.part_time;
  const isUrgent = listing.isUrgent;
  const urgencyInfo = listing.urgencyLevel ? URGENCY_LEVELS_MAP[listing.urgencyLevel] : null;
  const isRideshare = listing.category === 'rideshare' || Boolean(listing.rideRole);
  const number = String(index + 1).padStart(2, '0');
  const hasCoordinates = Array.isArray(listing.coordinates) && listing.coordinates.length === 2 && Number.isFinite(listing.coordinates[0]) && Number.isFinite(listing.coordinates[1]);

  const openOnMap = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent('meister-open-map-listing', { detail: listing }));
  };

  return (
    <article onClick={onClick} className={`group cursor-pointer overflow-hidden border bg-[#080808] transition-all duration-200 ${isUrgent ? 'border-white' : isSelected ? 'border-white ring-1 ring-white/30' : 'border-white/10 hover:border-white/35'} ${variant === 'horizontal' ? 'w-72 sm:w-80 shrink-0' : 'w-full'}`}>
      <div className="relative">
        {listing.photoUrl ? (
          <div className="relative h-44 sm:h-52 overflow-hidden bg-[#0c0c0c]">
            <img src={listing.photoUrl} alt={listing.title} className="h-full w-full object-cover grayscale-[15%] transition-transform duration-500 group-hover:scale-[1.025]" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10 pointer-events-none" />
            <span className="absolute left-3 top-3 text-[9px] uppercase tracking-[0.22em] font-black bg-black/75 border border-white/15 px-2 py-1">{number} / {cat.shortLabel || cat.label}</span>
            {isUrgent && <span className="absolute right-3 top-3 inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider bg-white text-black px-2 py-1"><Siren className="w-3 h-3" /> Терміново</span>}
            <div className="absolute left-3 right-3 bottom-3 flex items-end justify-between gap-3">
              <h3 className={`font-black text-white leading-[0.95] tracking-[-0.035em] line-clamp-2 drop-shadow-lg ${variant === 'full' ? 'text-xl sm:text-2xl' : 'text-lg'}`}>{listing.title}</h3>
              <div className="shrink-0 bg-white text-black px-2.5 py-2 min-w-[74px] text-right"><span className="block text-[7px] uppercase tracking-[0.18em] font-black opacity-50">Ціна</span><span className="block text-sm sm:text-base font-black leading-none mt-0.5">{listing.pay}</span></div>
            </div>
          </div>
        ) : (
          <div className="px-3.5 pt-3.5 sm:px-4 sm:pt-4">
            <div className="flex items-start justify-between gap-3">
              <div><span className="block text-[8px] uppercase tracking-[0.28em] text-white/30 mb-2">{number} / {cat.shortLabel || cat.label}</span><h3 className={`font-black text-white leading-[0.98] tracking-[-0.03em] line-clamp-2 ${variant === 'full' ? 'text-xl sm:text-2xl' : 'text-lg'}`}>{listing.title}</h3></div>
              <div className="shrink-0 bg-white text-black px-2.5 py-2 min-w-[74px] text-right"><span className="block text-[7px] uppercase tracking-[0.18em] font-black opacity-50">Ціна</span><span className="block text-sm sm:text-base font-black leading-none mt-0.5">{listing.pay}</span></div>
            </div>
          </div>
        )}

        <div className="p-3.5 sm:p-4 space-y-3">
          <div className="flex items-center justify-between gap-2 text-[9px] uppercase tracking-[0.15em]">
            <div className="flex items-center gap-2 min-w-0 text-white/45"><span className="border border-white/10 px-2 py-1 text-white/65 truncate">{listing.subcategory || cat.shortLabel || cat.label}</span>{listing.verified && <span className="text-white/55 shrink-0">VERIFIED</span>}</div>
            <span className="flex items-center gap-1 text-white/35 shrink-0"><MapPin className="w-3 h-3" />{formatDistance(listing.distanceMeters)}</span>
          </div>

          {listing.description && <p className="text-xs sm:text-sm leading-relaxed text-white/45 line-clamp-2">{listing.description}</p>}

          {isRideshare && (listing.rideRouteFrom || listing.rideRouteTo) && <div className="p-3 bg-[#0b0b0b] border border-white/10 space-y-2 text-xs text-white/80"><div className="flex items-center justify-between gap-2 font-black"><span className="flex items-center gap-1.5 min-w-0"><Navigation className="w-3.5 h-3.5 shrink-0" /><span className="truncate">{listing.rideRouteFrom}</span><span>→</span><span className="truncate">{listing.rideRouteTo}</span></span>{listing.rideSeats && <span className="flex items-center gap-1 text-[9px] border border-white/10 px-1.5 py-1 shrink-0"><Users className="w-3 h-3" />{listing.rideSeats}</span>}</div>{listing.rideDepartureTime && <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-white/35"><span className="flex items-center gap-1"><Clock className="w-3 h-3" />Виїзд: {listing.rideDepartureTime}</span>{listing.rideCarInfo && <span className="truncate max-w-[140px]">{listing.rideCarInfo}</span>}</div>}</div>}

          {isUrgent && urgencyInfo && <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-black text-white bg-white/[0.04] px-2.5 py-2 border border-white/15"><span className="w-1.5 h-1.5 bg-white animate-pulse" /><span>{urgencyInfo.label}</span></div>}

          <div className="flex items-center justify-between gap-3 pt-2.5 border-t border-white/10">
            <div className="min-w-0 text-[10px] text-white/35 uppercase tracking-[0.13em]"><div className="flex items-center gap-1.5 truncate"><MapPin className="w-3.5 h-3.5 shrink-0" /><span className="truncate">{listing.locationName}</span></div><div className="flex items-center gap-1.5 mt-1"><Clock className="w-3.5 h-3.5 shrink-0" /><span>{listing.duration}</span></div></div>
            <div className="flex items-center gap-2 shrink-0">
              {hasCoordinates && <button type="button" onClick={openOnMap} aria-label="Показати на карті" title="Показати на карті" className="h-10 w-10 flex items-center justify-center border border-white/15 text-white/70 hover:bg-white hover:text-black hover:border-white transition-colors active:scale-[0.98]"><Navigation className="w-4 h-4" /></button>}
              <button onClick={(e) => { e.stopPropagation(); onCallClick ? onCallClick(e) : onClick(); }} className="h-10 px-4 flex items-center gap-2 text-[10px] uppercase tracking-[0.12em] font-black bg-white text-black hover:bg-white/85 transition-colors active:scale-[0.98]"><Phone className="w-3.5 h-3.5" /><span>{isRideshare ? 'Зв’язатися' : 'Подзвонити'}</span></button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};