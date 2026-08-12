import React from 'react';
import { Phone, MapPin, Clock, Siren, Car, Users, Navigation } from 'lucide-react';
import { Listing, CATEGORIES, URGENCY_LEVELS_MAP } from '../types';
import { formatDistance } from '../utils/distance';

interface ListingCardProps {
  listing: Listing;
  onClick: () => void;
  onCallClick?: (e: React.MouseEvent) => void;
  isSelected?: boolean;
  variant?: 'compact' | 'full' | 'horizontal';
}

export const ListingCard: React.FC<ListingCardProps> = ({
  listing,
  onClick,
  onCallClick,
  isSelected = false,
  variant = 'compact',
}) => {
  const cat = CATEGORIES[listing.category] || CATEGORIES.part_time;
  const isUrgent = listing.isUrgent;
  const urgencyInfo = listing.urgencyLevel ? URGENCY_LEVELS_MAP[listing.urgencyLevel] : null;
  const isRideshare = listing.category === 'rideshare' || Boolean(listing.rideRole);

  return (
    <div
      onClick={onClick}
      className={`group cursor-pointer rounded-2xl transition-all duration-200 border relative overflow-hidden backdrop-blur-xl ${
        isUrgent
          ? 'bg-slate-950/85 border-rose-500/60 shadow-lg ring-2 ring-rose-500/20 hover:border-rose-400/80'
          : isSelected
          ? 'bg-slate-900/90 border-purple-400 ring-2 ring-purple-500/30 shadow-xl shadow-purple-950/50'
          : 'bg-slate-950/80 border-purple-900/40 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-950/40'
      } ${
        variant === 'horizontal' ? 'w-72 sm:w-80 shrink-0' : 'w-full'
      }`}
    >
      {/* Top Urgent Flash Accent Bar */}
      {isUrgent && (
        <div className="bg-gradient-to-r from-rose-600 via-red-500 to-rose-600 h-1.5 w-full animate-pulse"></div>
      )}

      <div className="p-3.5 sm:p-4 space-y-2.5">
        {/* Category Badge + Distance Badge */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border bg-purple-950/80 text-purple-200 border-purple-800/50`}
            >
              <span>{cat.pinSymbol}</span>
              <span>{cat.shortLabel || cat.label}</span>
            </span>

            {listing.subcategory && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 text-cyan-300 border border-cyan-800/50">
                {listing.subcategory}
              </span>
            )}

            {isUrgent && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white animate-pulse shadow-sm">
                <Siren className="w-3 h-3 text-white" />
                <span>ТЕРМІНОВО</span>
              </span>
            )}

            {listing.comments && listing.comments.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/70 text-amber-300 border border-amber-700/50">
                <span>💬 {listing.comments.length}</span>
              </span>
            )}
          </div>

          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold bg-slate-900/80 text-purple-300 border border-purple-800/40 shrink-0">
            <MapPin className="w-3 h-3 text-purple-400" />
            <span>{formatDistance(listing.distanceMeters)}</span>
          </div>
        </div>

        {/* Title */}
        <h3
          className={`font-extrabold text-slate-100 leading-snug line-clamp-2 ${
            variant === 'full' ? 'text-base sm:text-lg' : 'text-sm sm:text-base'
          }`}
        >
          {listing.title}
        </h3>

        {/* RIDESHARE ROUTE CARD */}
        {isRideshare && (listing.rideRouteFrom || listing.rideRouteTo) && (
          <div className="p-2.5 rounded-xl bg-gradient-to-r from-sky-950/90 to-slate-900/90 border border-sky-800/50 space-y-1.5 text-xs text-sky-100">
            <div className="flex items-center justify-between font-black text-sky-300">
              <span className="flex items-center gap-1">
                <Navigation className="w-3.5 h-3.5 text-sky-400" />
                <span>{listing.rideRouteFrom}</span>
                <span className="text-sky-400 font-extrabold">➔</span>
                <span>{listing.rideRouteTo}</span>
              </span>
              {listing.rideSeats && (
                <span className="flex items-center gap-1 bg-sky-900/60 px-1.5 py-0.5 rounded text-[10px] border border-sky-700/50 text-sky-200">
                  <Users className="w-3 h-3 text-sky-300" />
                  <span>{listing.rideSeats} міст.</span>
                </span>
              )}
            </div>

            {listing.rideDepartureTime && (
              <div className="flex items-center justify-between text-[11px] text-sky-200/80 font-medium">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-sky-400" />
                  <span>Виїзд: {listing.rideDepartureTime}</span>
                </span>
                {listing.rideCarInfo && (
                  <span className="truncate max-w-[140px] text-[10px] text-slate-400 font-semibold">
                    🚘 {listing.rideCarInfo}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Urgency Subtext if present */}
        {isUrgent && urgencyInfo && (
          <div className="flex items-center gap-1.5 text-xs font-extrabold text-rose-300 bg-rose-950/70 p-1.5 rounded-lg border border-rose-800/50">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            <span>{urgencyInfo.label}</span>
          </div>
        )}

        {/* Details snippet: Duration & Location */}
        <div className="flex items-center justify-between text-xs text-purple-300/70 font-medium pt-0.5 border-t border-purple-900/30">
          <div className="flex items-center gap-1 truncate max-w-[60%]">
            <MapPin className="w-3.5 h-3.5 text-purple-400/80 shrink-0" />
            <span className="truncate">{listing.locationName}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0 text-purple-200 font-semibold">
            <Clock className="w-3.5 h-3.5 text-purple-400/80" />
            <span>{listing.duration}</span>
          </div>
        </div>

        {/* Pay & Action Footer */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-purple-400/80 font-bold block">
              {isRideshare ? 'Ціна поїздки' : 'Оплата'}
            </span>
            <span
              className={`font-black text-base sm:text-lg leading-none ${
                isUrgent
                  ? 'text-rose-400'
                  : isRideshare
                  ? 'text-sky-300'
                  : listing.payType === 'free'
                  ? 'text-cyan-300'
                  : 'text-violet-300'
              }`}
            >
              {listing.pay}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onCallClick) onCallClick(e);
                else onClick();
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold shadow-md transition-all active:scale-95 ${
                isUrgent
                  ? 'bg-rose-600 hover:bg-rose-700 text-white ring-2 ring-rose-500/30 shadow-rose-950/50'
                  : isRideshare
                  ? 'bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white ring-2 ring-sky-500/30 shadow-sky-950/50'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white ring-2 ring-purple-500/30 shadow-purple-950/50'
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>{isRideshare ? 'Зв’язатися' : 'Подзвонити'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
