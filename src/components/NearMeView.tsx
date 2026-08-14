import React, { useState } from 'react';
import { MapPin, Siren } from 'lucide-react';
import { Listing, SortOption } from '../types';
import { sortListings } from '../utils/distance';
import { ListingCard } from './ListingCard';
import { DistanceRangeSlider } from './DistanceRangeSlider';

interface NearMeViewProps {
  listings: Listing[];
  onSelectListing: (listing: Listing) => void;
  onCallListing: (listing: Listing) => void;
  selectedCategory: string;
  maxRadiusKm: number | null;
  onChangeMaxRadiusKm: (radius: number | null) => void;
  totalListingsCount?: number;
}

export const NearMeView: React.FC<NearMeViewProps> = ({
  listings,
  onSelectListing,
  onCallListing,
  selectedCategory,
  maxRadiusKm,
  onChangeMaxRadiusKm,
  totalListingsCount,
}) => {
  const [sortBy, setSortBy] = useState<SortOption>('distance');
  const [onlyUrgent, setOnlyUrgent] = useState(false);

  let filtered = listings.filter((l) => {
    if (onlyUrgent && !l.isUrgent) return false;
    if (selectedCategory !== 'all' && l.category !== selectedCategory) return false;
    if (maxRadiusKm !== null) {
      if (l.distanceMeters > maxRadiusKm * 1000) return false;
    }
    return true;
  });

  const sortedListings = sortListings(filtered, sortBy);
  const urgentListings = sortedListings.filter((l) => l.isUrgent);
  const regularListings = sortedListings.filter((l) => !l.isUrgent);

  return (
    <div className="space-y-4 pb-24">
      {/* Location status: determined by the device/browser, without a fixed community name. */}
      <div className="flex items-center justify-between px-2 py-1.5 bg-slate-900/80 rounded-2xl border border-purple-900/40">
        <span className="inline-flex items-center gap-1.5 text-purple-200 text-xs font-bold">
          <MapPin className="w-3.5 h-3.5 text-purple-400" />
          <span>Моє місцезнаходження</span>
        </span>
        <span className="text-[11px] font-bold text-cyan-400 flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
          GPS
        </span>
      </div>

      <DistanceRangeSlider
        maxRadiusKm={maxRadiusKm}
        onChangeMaxRadiusKm={onChangeMaxRadiusKm}
        filteredCount={sortedListings.length}
        totalCount={totalListingsCount ?? listings.length}
      />

      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        <button onClick={() => { setSortBy('distance'); setOnlyUrgent(false); }} className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${sortBy === 'distance' && !onlyUrgent ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-950/60' : 'bg-slate-900/80 text-purple-200/90 hover:bg-purple-950/60 border-purple-900/40'}`}>📍 Найближчі</button>
        <button onClick={() => { setSortBy('pay'); setOnlyUrgent(false); }} className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${sortBy === 'pay' && !onlyUrgent ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-950/60' : 'bg-slate-900/80 text-purple-200/90 hover:bg-purple-950/60 border-purple-900/40'}`}>💰 Найкраще оплачувані</button>
        <button onClick={() => { setSortBy('newest'); setOnlyUrgent(false); }} className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${sortBy === 'newest' && !onlyUrgent ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-950/60' : 'bg-slate-900/80 text-purple-200/90 hover:bg-purple-950/60 border-purple-900/40'}`}>✨ Нові</button>
        <button onClick={() => setOnlyUrgent(!onlyUrgent)} className={`px-3.5 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all border flex items-center gap-1.5 ${onlyUrgent ? 'bg-rose-600 text-white border-rose-500 shadow-lg ring-2 ring-rose-500/30' : 'bg-rose-950/60 text-rose-300 hover:bg-rose-900/80 border-rose-800/50'}`}><Siren className="w-3.5 h-3.5 text-rose-400 animate-bounce" /><span>🚨 Тільки термінові</span></button>
      </div>

      {urgentListings.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1"><h3 className="text-xs font-extrabold text-rose-400 uppercase tracking-widest flex items-center gap-1.5"><Siren className="w-4 h-4 text-rose-500 animate-pulse" /><span>НЕГАЙНА ТЕРМІНОВА ДОПОМОГА ({urgentListings.length})</span></h3><span className="text-[11px] font-black text-rose-200 bg-rose-950/80 border border-rose-800/60 px-2 py-0.5 rounded-full">Пріоритет №1</span></div>
          <div className="space-y-2.5">{urgentListings.map((listing) => <ListingCard key={listing.id} listing={listing} onClick={() => onSelectListing(listing)} onCallClick={() => onCallListing(listing)} variant="full" />)}</div>
        </div>
      )}

      {!onlyUrgent && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1 pt-2"><h3 className="text-xs font-extrabold text-purple-300/80 uppercase tracking-widest">УСІ ПРОПОЗИЦІЇ ПОРУЧ ({regularListings.length})</h3><span className="text-xs font-bold text-purple-300/60">Сортування: {sortBy === 'distance' ? 'за відстанню' : sortBy === 'pay' ? 'за оплатою' : 'нові'}</span></div>
          {regularListings.length === 0 ? <div className="cosmic-glass-card rounded-3xl p-8 text-center space-y-3"><div className="w-12 h-12 bg-purple-950/60 text-purple-300 rounded-full flex items-center justify-center mx-auto border border-purple-800/40">📍</div><p className="text-sm font-bold text-slate-200">Оголошень за цими фільтрами не знайдено</p><button onClick={() => { setSortBy('distance'); setOnlyUrgent(false); }} className="text-xs font-bold text-purple-400 hover:text-purple-300 underline">Скинути фільтри</button></div> : <div className="space-y-2.5">{regularListings.map((listing) => <ListingCard key={listing.id} listing={listing} onClick={() => onSelectListing(listing)} onCallClick={() => onCallListing(listing)} variant="full" />)}</div>}
        </div>
      )}
    </div>
  );
};
