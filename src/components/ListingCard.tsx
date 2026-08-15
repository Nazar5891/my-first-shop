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
}

export const ListingCard: React.FC<ListingCardProps> = ({ listing, onClick, onCallClick, isSelected = false, variant = 'compact' }) => {
  const cat = CATEGORIES[listing.category] || CATEGORIES.part_time;
  const isUrgent = listing.isUrgent;
  const urgencyInfo = listing.urgencyLevel ? URGENCY_LEVELS_MAP[listing.urgencyLevel] : null;
  const isRideshare = listing.category === 'rideshare' || Boolean(listing.rideRole);

  return (
    <article onClick={onClick} className={`group cursor-pointer overflow-hidden rounded-2xl border bg-[#0a0a0a]/95 backdrop-blur-xl transition-all duration-200 ${isUrgent ? 'border-white/60' : isSelected ? 'border-white ring-1 ring-white/30 shadow-xl shadow-black' : 'border-white/10 hover:border-white/30 hover:-translate-y-0.5'} ${variant === 'horizontal' ? 'w-72 sm:w-80 shrink-0' : 'w-full'}`}>
      {isUrgent && <div className="h-1 w-full bg-white animate-pulse" />}
      <div className="p-3.5 sm:p-4 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-white/15 bg-white/5 text-white/85"><span>{cat.pinSymbol}</span><span>{cat.shortLabel || cat.label}</span></span>
            {listing.subcategory && <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold bg-white/[0.03] text-white/55 border border-white/10">{listing.subcategory}</span>}
            {isUrgent && <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-black bg-white text-black"><Siren className="w-3 h-3"/>ТЕРМІНОВО</span>}
            {listing.comments && listing.comments.length > 0 && <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold bg-white/[0.03] text-white/55 border border-white/10">💬 {listing.comments.length}</span>}
          </div>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-white/[0.03] text-white/55 border border-white/10 shrink-0"><MapPin className="w-3 h-3"/>{formatDistance(listing.distanceMeters)}</span>
        </div>

        <h3 className={`font-black text-white leading-snug tracking-tight line-clamp-2 ${variant === 'full' ? 'text-base sm:text-lg' : 'text-sm sm:text-base'}`}>{listing.title}</h3>

        {isRideshare && (listing.rideRouteFrom || listing.rideRouteTo) && <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-1.5 text-xs text-white/80"><div className="flex items-center justify-between font-black"><span className="flex items-center gap-1"><Navigation className="w-3.5 h-3.5"/><span>{listing.rideRouteFrom}</span><span>→</span><span>{listing.rideRouteTo}</span></span>{listing.rideSeats && <span className="flex items-center gap-1 bg-white/5 px-1.5 py-0.5 rounded text-[10px] border border-white/10"><Users className="w-3 h-3"/>{listing.rideSeats} міс.</span>}</div>{listing.rideDepartureTime && <div className="flex items-center justify-between text-[11px] text-white/50"><span className="flex items-center gap-1"><Clock className="w-3 h-3"/>Виїзд: {listing.rideDepartureTime}</span>{listing.rideCarInfo && <span className="truncate max-w-[140px]">🚘 {listing.rideCarInfo}</span>}</div>}</div>}

        {isUrgent && urgencyInfo && <div className="flex items-center gap-1.5 text-xs font-extrabold text-white/80 bg-white/[0.03] p-1.5 rounded-lg border border-white/10"><span className="w-2 h-2 rounded-full bg-white animate-ping"/><span>{urgencyInfo.label}</span></div>}

        <div className="flex items-center justify-between text-xs text-white/45 font-medium pt-2 border-t border-white/10"><div className="flex items-center gap-1 truncate max-w-[60%]"><MapPin className="w-3.5 h-3.5 text-white/60 shrink-0"/><span className="truncate">{listing.locationName}</span></div><div className="flex items-center gap-1 shrink-0 text-white/60"><Clock className="w-3.5 h-3.5"/><span>{listing.duration}</span></div></div>

        <div className="flex items-center justify-between gap-2 pt-1"><div><span className="text-[9px] uppercase tracking-[0.2em] text-white/35 font-bold block">{isRideshare ? 'Ціна поїздки' : 'Ціна'}</span><span className="font-black text-lg leading-none text-white">{listing.pay}</span></div><button onClick={(e) => { e.stopPropagation(); onCallClick ? onCallClick(e) : onClick(); }} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold bg-white text-black shadow-md transition-all active:scale-95 hover:bg-white/90"><Phone className="w-3.5 h-3.5"/><span>{isRideshare ? 'Зв’язатися' : 'Подзвонити'}</span></button></div>
      </div>
    </article>
  );
};
