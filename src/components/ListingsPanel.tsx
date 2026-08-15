import React, { useMemo, useState } from 'react';
import { Search, SlidersHorizontal, X, ChevronDown, MapPin, Navigation } from 'lucide-react';
import { Listing, CATEGORIES } from '../types';
import { ListingCard } from './ListingCard';

interface ListingsPanelProps {
  listings: Listing[];
  onSelectListing: (listing: Listing) => void;
  userCoordinates?: [number, number];
}

type RadiusKm = 1 | 5 | 10 | 25 | 50 | 100;

const RADIUS_OPTIONS: RadiusKm[] = [1, 5, 10, 25, 50, 100];

const distanceKm = (a: [number, number], b: [number, number]) => {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLon = ((b[1] - a[1]) * Math.PI) / 180;
  const lat1 = (a[0] * Math.PI) / 180;
  const lat2 = (b[0] * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
};

export const ListingsPanel: React.FC<ListingsPanelProps> = ({ listings, onSelectListing, userCoordinates }) => {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedLocationCoords, setSelectedLocationCoords] = useState<[number, number] | null>(null);
  const [radiusKm, setRadiusKm] = useState<RadiusKm | null>(null);
  const [openMenu, setOpenMenu] = useState<'category' | 'location' | 'radius' | null>(null);

  const categories = useMemo(() => Object.values(CATEGORIES), []);

  const availableSubcategories = useMemo(() => {
    if (!category) return [];
    return CATEGORIES[category]?.subcategories || [];
  }, [category]);

  const locations = useMemo(() => {
    const map = new Map<string, [number, number]>();
    listings.forEach(l => {
      if (l.locationName && l.coordinates && !map.has(l.locationName)) map.set(l.locationName, l.coordinates);
    });
    return Array.from(map.entries())
      .map(([name, coords]) => ({ name, coords }))
      .sort((a, b) => a.name.localeCompare(b.name, 'uk'));
  }, [listings]);

  // Підказки працюють як у Google: спочатку тільки назви, що ПОЧИНАЮТЬСЯ
  // з введеного тексту. Регістр та зайві пробіли не мають значення.
  const locationSuggestions = useMemo(() => {
    const q = locationQuery.trim().toLocaleLowerCase('uk-UA');
    if (!q) return locations.slice(0, 8);

    return locations
      .filter(l => l.name.trim().toLocaleLowerCase('uk-UA').startsWith(q))
      .slice(0, 8);
  }, [locations, locationQuery]);

  const searchCenter = selectedLocationCoords || userCoordinates || null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return listings.filter(l => {
      const matchesQuery = !q || [l.title, l.description, l.locationName, l.category, l.subcategory, l.pay]
        .filter(Boolean).join(' ').toLowerCase().includes(q);
      const matchesCategory = !category || l.category === category;
      const matchesSubcategory = !subcategory || l.subcategory === subcategory;
      const matchesLocation = !selectedLocation || l.locationName === selectedLocation;
      const matchesRadius = !radiusKm || !searchCenter || distanceKm(searchCenter, l.coordinates) <= radiusKm;
      return matchesQuery && matchesCategory && matchesSubcategory && matchesLocation && matchesRadius;
    });
  }, [listings, query, category, subcategory, selectedLocation, radiusKm, searchCenter]);

  const clearFilters = () => {
    setCategory('');
    setSubcategory('');
    setLocationQuery('');
    setSelectedLocation('');
    setSelectedLocationCoords(null);
    setRadiusKm(null);
    setQuery('');
    setOpenMenu(null);
  };

  const chooseCategory = (id: string) => {
    setCategory(id);
    setSubcategory('');
    setOpenMenu(null);
  };

  const chooseLocation = (name: string, coords: [number, number]) => {
    setSelectedLocation(name);
    setSelectedLocationCoords(coords);
    setLocationQuery(name);
    setOpenMenu(null);
  };

  const hasFilters = Boolean(category || subcategory || selectedLocation || radiusKm);

  return (
    <section className="h-full w-full overflow-hidden bg-[#050505] text-white flex flex-col">
      <header className="shrink-0 border-b border-white/10 bg-[#050505] px-4 pt-4 pb-3 sm:px-5">
        <div className="flex items-end justify-between gap-3 mb-4">
          <div>
            <p className="text-[9px] uppercase tracking-[0.38em] text-white/35 font-black">LOCAL MARKET / 01</p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-black uppercase tracking-[-0.04em]">Оголошення</h1>
          </div>
          <button type="button" onClick={() => setShowFilters(v => !v)} className={`h-10 w-10 shrink-0 border flex items-center justify-center transition-colors ${showFilters ? 'bg-white text-black border-white' : 'bg-transparent text-white border-white/15 hover:border-white/40'}`} aria-label="Фільтри">
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="ПОШУК ОГОЛОШЕНЬ" className="w-full h-11 bg-[#0a0a0a] border border-white/15 pl-10 pr-10 text-[11px] uppercase tracking-[0.14em] text-white placeholder:text-white/25 outline-none focus:border-white/45 transition-colors" />
          {query && <button type="button" onClick={() => setQuery('')} className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 flex items-center justify-center text-white/40 hover:text-white"><X className="w-4 h-4" /></button>}
        </div>

        {showFilters && (
          <div className="mt-3 space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-white/10 border border-white/10">
              <div className="relative">
                <button type="button" onClick={() => setOpenMenu(openMenu === 'category' ? null : 'category')} className="w-full bg-[#080808] px-3 py-3 text-left flex items-center justify-between">
                  <span><span className="block text-[8px] uppercase tracking-[0.2em] text-white/30">02 / Категорія</span><span className="block mt-1 text-[11px] font-bold uppercase truncate">{category ? CATEGORIES[category]?.shortLabel || category : 'Усі категорії'}</span></span>
                  <ChevronDown className={`w-4 h-4 text-white/40 ${openMenu === 'category' ? 'rotate-180' : ''}`} />
                </button>
                {openMenu === 'category' && <div className="absolute z-50 left-0 right-0 top-full max-h-72 overflow-y-auto border border-white/10 bg-[#080808] shadow-2xl">
                  <button type="button" onClick={() => { setCategory(''); setSubcategory(''); setOpenMenu(null); }} className="w-full px-3 py-2.5 text-left text-[11px] font-bold uppercase hover:bg-white/10">Усі категорії</button>
                  {categories.map(c => <button key={c.id} type="button" onClick={() => chooseCategory(c.id)} className={`w-full px-3 py-2.5 text-left text-[11px] uppercase border-t border-white/5 hover:bg-white/10 ${category === c.id ? 'bg-white text-black font-black' : 'text-white/75'}`}>{c.pinSymbol} {c.shortLabel}</button>)}
                </div>}
              </div>

              <div className="relative">
                <button type="button" disabled={!category} onClick={() => setOpenMenu(openMenu === 'radius' ? null : 'radius')} className={`w-full bg-[#080808] px-3 py-3 text-left flex items-center justify-between ${!category ? 'opacity-40 cursor-not-allowed' : ''}`}>
                  <span><span className="block text-[8px] uppercase tracking-[0.2em] text-white/30">03 / Підкатегорія</span><span className="block mt-1 text-[11px] font-bold uppercase truncate">{subcategory || 'Усі'}</span></span>
                  <ChevronDown className="w-4 h-4 text-white/40" />
                </button>
                {openMenu === 'radius' && category && <div className="absolute z-50 left-0 right-0 top-full max-h-72 overflow-y-auto border border-white/10 bg-[#080808] shadow-2xl">
                  <button type="button" onClick={() => { setSubcategory(''); setOpenMenu(null); }} className="w-full px-3 py-2.5 text-left text-[11px] font-bold uppercase hover:bg-white/10">Усі підкатегорії</button>
                  {availableSubcategories.map(s => <button key={s} type="button" onClick={() => { setSubcategory(s); setOpenMenu(null); }} className={`w-full px-3 py-2.5 text-left text-[11px] border-t border-white/5 hover:bg-white/10 ${subcategory === s ? 'bg-white text-black font-black' : 'text-white/75'}`}>{s}</button>)}
                </div>}
              </div>
            </div>

            <div className="relative">
              <div className="flex items-center bg-[#080808] border border-white/10">
                <MapPin className="ml-3 w-4 h-4 text-white/35 shrink-0" />
                <input value={locationQuery} onChange={e => { setLocationQuery(e.target.value); if (!e.target.value) { setSelectedLocation(''); setSelectedLocationCoords(null); } setOpenMenu('location'); }} onFocus={() => setOpenMenu('location')} placeholder="Місце: населений пункт або адреса" className="w-full h-11 bg-transparent px-2 text-[11px] text-white placeholder:text-white/25 outline-none" />
                {selectedLocation && <button type="button" onClick={() => { setLocationQuery(''); setSelectedLocation(''); setSelectedLocationCoords(null); }} className="pr-3 text-white/35 hover:text-white"><X className="w-4 h-4" /></button>}
              </div>
              {openMenu === 'location' && <div className="absolute z-50 left-0 right-0 top-full max-h-64 overflow-y-auto border border-white/10 bg-[#080808] shadow-2xl">
                <div className="px-3 py-2 text-[8px] uppercase tracking-[0.2em] text-white/25 border-b border-white/5">ПІДКАЗКИ МІСЦЯ</div>
                {locationSuggestions.length > 0 ? locationSuggestions.map(l => <button key={l.name} type="button" onClick={() => chooseLocation(l.name, l.coords)} className={`w-full px-3 py-3 text-left flex items-center gap-2 text-[11px] border-b border-white/5 hover:bg-white/10 ${selectedLocation === l.name ? 'bg-white text-black font-black' : 'text-white/80'}`}><MapPin className="w-3.5 h-3.5 shrink-0" />{l.name}</button>) : <div className="px-3 py-4 text-[11px] text-white/35">Місце з таким початком не знайдено.</div>}
              </div>}
            </div>

            <div className="relative">
              <button type="button" onClick={() => setOpenMenu(openMenu === 'radius' ? null : 'radius')} className="w-full bg-[#080808] border border-white/10 px-3 py-3 text-left flex items-center justify-between">
                <span><span className="block text-[8px] uppercase tracking-[0.2em] text-white/30">04 / Радіус</span><span className="block mt-1 text-[11px] font-bold uppercase">{radiusKm ? `${radiusKm} км` : 'Без обмеження'}</span></span>
                <ChevronDown className={`w-4 h-4 text-white/40 ${openMenu === 'radius' ? 'rotate-180' : ''}`} />
              </button>
              {openMenu === 'radius' && <div className="absolute z-50 left-0 right-0 top-full border border-white/10 bg-[#080808] shadow-2xl grid grid-cols-3 gap-px">
                <button type="button" onClick={() => { setRadiusKm(null); setOpenMenu(null); }} className="p-3 text-[10px] uppercase font-bold hover:bg-white/10">Усі</button>
                {RADIUS_OPTIONS.map(r => <button key={r} type="button" onClick={() => { setRadiusKm(r); setOpenMenu(null); }} className={`p-3 text-[10px] uppercase font-bold hover:bg-white/10 ${radiusKm === r ? 'bg-white text-black' : ''}`}>{r} км</button>)}
              </div>}
            </div>

            {radiusKm && !searchCenter && <div className="flex items-center gap-2 border border-white/10 bg-white/[0.03] px-3 py-2 text-[10px] text-white/45"><Navigation className="w-3.5 h-3.5" />Оберіть місце або увімкніть геолокацію, щоб застосувати радіус.</div>}
            {hasFilters && <button type="button" onClick={clearFilters} className="text-[9px] uppercase tracking-[0.2em] text-white/45 hover:text-white">× Скинути всі фільтри</button>}
          </div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-3 py-3 sm:px-4 space-y-3 overscroll-contain">
        <div className="flex items-center justify-between px-1 pb-1">
          <span className="text-[9px] uppercase tracking-[0.28em] text-white/30 font-black">INDEX / {String(filtered.length).padStart(2, '0')}</span>
          <span className="text-[9px] uppercase tracking-[0.2em] text-white/20">LIVE LIST</span>
        </div>
        {filtered.map((listing, index) => <ListingCard key={listing.id} listing={listing} onClick={() => onSelectListing(listing)} variant="full" index={index} />)}
        {filtered.length === 0 && <div className="min-h-48 border border-white/10 flex items-center justify-center text-center px-6"><div><div className="text-[9px] uppercase tracking-[0.3em] text-white/25 mb-2">NO RESULT</div><p className="text-sm text-white/40">Нічого не знайдено.<br />Спробуйте змінити пошук або фільтри.</p></div></div>}
      </div>
    </section>
  );
};
