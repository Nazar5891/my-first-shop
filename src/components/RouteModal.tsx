import React from 'react';
import { X, Navigation, Footprints, Car, ExternalLink, Play, Bike } from 'lucide-react';
import { Listing } from '../types';
import { formatDistance } from '../utils/distance';

interface RouteModalProps {
  listing: Listing | null;
  onClose: () => void;
  onStartOnlineNavigation?: (listing: Listing) => void;
}

export const RouteModal: React.FC<RouteModalProps> = ({
  listing,
  onClose,
  onStartOnlineNavigation,
}) => {
  if (!listing) return null;

  const [lat, lng] = listing.coordinates;
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  // Estimate walking & driving & cycling time
  const walkMinutes = Math.round((listing.distanceMeters / 1000 / 4) * 60); // 4 km/h
  const cycleMinutes = Math.max(1, Math.round((listing.distanceMeters / 1000 / 15) * 60)); // 15 km/h
  const driveMinutes = Math.max(1, Math.round((listing.distanceMeters / 1000 / 40) * 60)); // 40 km/h

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-sm bg-slate-950/95 backdrop-blur-2xl text-slate-100 rounded-3xl shadow-2xl border border-purple-900/50 overflow-hidden p-5 space-y-4">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-purple-900/40 pb-3">
          <div className="flex items-center gap-2 text-purple-300 font-extrabold text-xs uppercase tracking-widest">
            <Navigation className="w-4 h-4 text-purple-400" />
            <span>Інтерактивна онлайн-навігація</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-900 text-purple-300 border border-purple-800/40 flex items-center justify-center font-bold"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Destination Location Box */}
        <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-purple-900/40 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-purple-400/80 uppercase">
              Пункт призначення
            </span>
            <span className="text-xs font-black text-cyan-300">
              📍 {formatDistance(listing.distanceMeters)}
            </span>
          </div>
          <h4 className="font-extrabold text-slate-100 text-sm leading-snug">
            {listing.locationName}
          </h4>
          <p className="text-xs text-purple-300/70 font-medium line-clamp-1">
            {listing.title}
          </p>
        </div>

        {/* Travel Time Estimates Grid */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2.5 bg-purple-950/70 rounded-2xl border border-purple-800/50 text-center space-y-0.5">
            <Car className="w-4 h-4 text-purple-400 mx-auto" />
            <span className="text-[9px] font-extrabold text-purple-300 uppercase block">
              Авто
            </span>
            <span className="text-sm font-black text-white">~{driveMinutes} хв</span>
          </div>

          <div className="p-2.5 bg-slate-900/90 rounded-2xl border border-purple-900/40 text-center space-y-0.5">
            <Bike className="w-4 h-4 text-purple-400/80 mx-auto" />
            <span className="text-[9px] font-extrabold text-purple-400/80 uppercase block">
              Велосипед
            </span>
            <span className="text-sm font-black text-slate-200">~{cycleMinutes} хв</span>
          </div>

          <div className="p-2.5 bg-slate-900/90 rounded-2xl border border-purple-900/40 text-center space-y-0.5">
            <Footprints className="w-4 h-4 text-purple-400/70 mx-auto" />
            <span className="text-[9px] font-extrabold text-purple-400/70 uppercase block">
              Пішки
            </span>
            <span className="text-sm font-black text-slate-200">~{walkMinutes} хв</span>
          </div>
        </div>

        {/* Primary Action: Start App Online Navigation */}
        {onStartOnlineNavigation && (
          <button
            onClick={() => {
              onStartOnlineNavigation(listing);
              onClose();
            }}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-black text-sm shadow-xl shadow-cyan-950/80 flex items-center justify-center gap-2 transition-all active:scale-95 ring-2 ring-cyan-400/40 border border-cyan-300/30"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Побудувати маршрут на карті</span>
          </button>
        )}

        {/* Secondary Action: Open external Google Maps Navigator */}
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-850 text-purple-200 font-extrabold text-xs border border-purple-800/40 flex items-center justify-center gap-2 transition-all"
        >
          <span>Відкрити в Google Навігаторі</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
};
