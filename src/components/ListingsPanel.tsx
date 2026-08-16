import React, { useEffect, useMemo, useState } from 'react';
import { Search, SlidersHorizontal, X, ChevronDown, MapPin, Navigation } from 'lucide-react';
import { Listing, CATEGORIES, CategoryId } from '../types';
import { ListingCard } from './ListingCard';

interface ListingsPanelProps {
  listings: Listing[];
  onSelectListing: (listing: Listing) => void;
  userCoordinates?: [number, number];
}

type RadiusKm = 1 | 5 | 10 | 25 | 50 | 100;
const RADIUS_OPTIONS: RadiusKm[] = [1, 5, 10, 25, 50, 100];

interface LocationSuggestion {
  name: string;
  coords: [number, number];
}

const normalize = (value: string) => value.trim().toLocaleLowerCase('uk-UA');

const distanceKm = (a: [number, number], b: [number, number]) => {
  const R = 6371;
  const dLat = (b[0] - a[0]) * Math.PI / 180;
  const dLon = (b[1] - a[1]) * Math.PI / 180;
  const lat1 = a[0] * Math.PI / 180;
  const lat2 = b[0] * Math.PI / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};

export const ListingsPanel: React.FC<ListingsPanelProps> = ({ listings, onSelectListing, userCoordinates }) => {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [category, setCategory] = useState<CategoryId | ''>('');
  const [subcategory, setSubcategory] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedLocationCoords, setSelectedLocationCoords] = useState<[number, number] | null>(null);
  const [radiusKm, setRadiusKm] = useState<RadiusKm | null>(null);
  const [openMenu, setOpenMenu] = useState<'category' | 'subcategory' | 'location' | 'radius' | null>(null);
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [searchActive, setSearchActive] = useState(false);

  const categories = useMemo(() => Object.values(CATEGORIES), []);
  const availableSubcategories = useMemo(
    () => category ? CATEGORIES[category]?.subcategories || [] : [],
    [category]
  );

  const localLocations = useMemo<LocationSuggestion[]>(() => {
    const map = new Map<string, [number, number]>();
    listings.forEach(listing => {
      if (listing.locationName && listing.coordinates && !map.has(listing.locationName)) {
        map.set(listing.locationName, listing.coordinates);
      }
    });
    return Array.from(map.entries()).map(([name, coords]) => ({ name, coords }));
  }, [listings]);

  useEffect(() => {
    const q = locationQuery.trim();
    if (q.length < 2 || selectedLocation === q) {
      setLocationSuggestions([]);
      setLocationLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLocationLoading(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=10&countrycodes=ua&accept-language=uk&q=${encodeURIComponent(q)}`;
        const response = await fetch(url, {
          signal: controller.signal,
          headers: { Accept: 'application/json' }
        });
        if (!response.ok) throw new Error('place search failed');

        const data = await response.json();
        const prefix = normalize(q);
        const real: LocationSuggestion[] = (Array.isArray(data) ? data : [])
          .map((item: any) => ({
            name: String(item.display_name || item.name || '').split(',').slice(0, 3).join(',').trim(),
            coords: [Number(item.lat), Number(item.lon)] as [number, number]
          }))
          .filter((item: LocationSuggestion) => item.name && Number.isFinite(item.coords[0]) && Number.isFinite(item.coords[1]))
          .filter((item: LocationSuggestion) => normalize(item.name).startsWith(prefix))
          .filter((item: LocationSuggestion, index: number, array: LocationSuggestion[]) =>
            array.findIndex(other => normalize(other.name) === normalize(item.name)) === index
          )
          .slice(0, 8);

        const local = localLocations.filter(item =>
          normalize(item.name).startsWith(prefix) &&
          !real.some(other => normalize(other.name) === normalize(item.name))
        );

        setLocationSuggestions([...real, ...local].slice(0, 8));
      } catch {
        if (!controller.signal.aborted) {
          const prefix = normalize(q);
          setLocationSuggestions(localLocations.filter(item => normalize(item.name).startsWith(prefix)).slice(0, 8));
        }
      } finally {
        if (!controller.signal.aborted) setLocationLoading(false);
      }
    }, 300);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [locationQuery, selectedLocation, localLocations]);

  const searchCenter = selectedLocationCoords || userCoordinates || null;

  const filtered = useMemo(() => {
    const q = normalize(query);
    return listings.filter(listing => {
      const text = [
        listing.title,
        listing.description,
        listing.locationName,
        listing.category,
        listing.subcategory,
        listing.pay
      ].filter(Boolean).join(' ').toLocaleLowerCase('uk-UA');

      const markerCoords = listing.coordinates;
      const hasValidMarker = Array.isArray(markerCoords) &&
        markerCoords.length === 2 &&
        Number.isFinite(markerCoords[0]) &&
        Number.isFinite(markerCoords[1]);

      const inSelectedPlace = !selectedLocation || (hasValidMarker && !!selectedLocationCoords);
      const inRadius = !radiusKm || !searchCenter || (hasValidMarker && distanceKm(searchCenter, markerCoords) <= radiusKm);

      return (!q || text.includes(q)) &&
        (!category || listing.category === category) &&
        (!subcategory || listing.subcategory === subcategory) &&
        inSelectedPlace &&
        inRadius;
    });
  }, [listings, query, category, subcategory, selectedLocation, radiusKm, searchCenter, selectedLocationCoords]);

  const chooseLocation = (place: LocationSuggestion) => {
    setSelectedLocation(place.name);
    setSelectedLocationCoords(place.coords);
    setLocationQuery(place.name);
    setOpenMenu('radius');
    setSearchActive(false);
  };

  const executeSearch = () => {
    setSearchActive(true);
    setShowFilters(false);
    setOpenMenu(null);
  };

  const clearFilters = () => {
    setQuery('');
    setCategory('');
    setSubcategory('');
    setLocationQuery('');
    setSelectedLocation('');
    setSelectedLocationCoords(null);
    setRadiusKm(null);
    setOpenMenu(null);
    setSearchActive(false);
  };

  const hasFilters = Boolean(query || category || subcategory || selectedLocation || radiusKm);

  return (
    <section className="h-full w-full overflow-hidden bg-[#050505] text-white flex flex-col">
      <header className="shrink-0 border-b border-white/10 bg-[#050505] px-4 pt-4 pb-3 sm:px-5">
        <div className="flex items-end justify-between gap-3 mb-4">
          <div>
            <p className="text-[9px] uppercase tracking-[0.38em] text-white/35 font-black">LOCAL MARKET / 01</p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-black uppercase tracking-[-0.04em]">Оголошення</h1>
          </div>
          <button
            type="button"
            onClick={() => setShowFilters(value => !value)}
            className={`h-10 w-10 shrink-0 border flex items-center justify-center ${showFilters ? 'bg-white text-black border-white' : 'bg-transparent text-white border-white/15'}`}
            aria-label="Фільтри"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>

        <div className="w-full rounded-xl border-2 border-cyan-400 bg-slate-950/90 p-1.5 shadow-[0_0_22px_rgba(34,211,238,0.28)] flex items-center gap-2">
          <div className="relative min-w-0 flex-1 rounded-lg border-2 border-cyan-300/80 bg-[#0a0a0a]/95">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-200" />
            <input
              value={query}
              onChange={event => { setQuery(event.target.value); setSearchActive(false); }}
              onKeyDown={event => { if (event.key === 'Enter') executeSearch(); }}
              placeholder="Пошук оголошення"
              aria-label="Пошук оголошення"
              className="block w-full h-11 bg-transparent border-0 pl-10 pr-9 text-[10px] sm:text-[11px] tracking-[0.08em] font-bold text-cyan-50 placeholder:text-cyan-100 outline-none focus:ring-0 whitespace-nowrap"
            />
            {query && (
              <button
                type="button"
                onClick={() => { setQuery(''); setSearchActive(false); }}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-8 flex items-center justify-center text-cyan-200/80"
                aria-label="Очистити пошук"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={executeSearch}
            className="h-11 w-[92px] sm:w-[108px] shrink-0 rounded-lg border-2 border-white bg-white text-slate-950 font-black text-[10px] uppercase tracking-[0.12em] shadow-[0_0_16px_rgba(255,255,255,0.34)] hover:bg-slate-100 active:scale-[0.98] transition-all flex items-center justify-center"
          >
            ПОШУК
          </button>
        </div>

        {showFilters && (
          <div className="mt-3 space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-white/10 border border-white/10">
              <div className="relative">
                <button type="button" onClick={() => setOpenMenu(openMenu === 'category' ? null : 'category')} className="w-full bg-[#080808] px-3 py-3 text-left flex items-center justify-between">
                  <span><span className="block text-[8px] uppercase tracking-[0.2em] text-white/30">02 / Категорія</span><span className="block mt-1 text-[11px] font-bold uppercase truncate">{category ? CATEGORIES[category]?.shortLabel : 'Усі категорії'}</span></span>
                  <ChevronDown className="w-4 h-4 text-white/40" />
                </button>
                {openMenu === 'category' && <div className="absolute z-50 left-0 right-0 top-full max-h-72 overflow-y-auto border border-white/10 bg-[#080808] shadow-2xl"><button type="button" onClick={() => { setCategory(''); setSubcategory(''); setSearchActive(false); setOpenMenu(null); }} className="w-full px-3 py-2.5 text-left text-[11px] font-bold uppercase">Усі категорії</button>{categories.map(item => <button key={item.id} type="button" onClick={() => { setCategory(item.id); setSubcategory(''); setSearchActive(false); setOpenMenu(null); }} className={`w-full px-3 py-2.5 text-left text-[11px] uppercase border-t border-white/5 ${category === item.id ? 'bg-white text-black font-black' : 'text-white/75'}`}>{item.pinSymbol} {item.shortLabel}</button>)}</div>}
              </div>

              <div className="relative">
                <button type="button" disabled={!category} onClick={() => setOpenMenu(openMenu === 'subcategory' ? null : 'subcategory')} className={`w-full bg-[#080808] px-3 py-3 text-left flex items-center justify-between ${!category ? 'opacity-40 cursor-not-allowed' : ''}`}>
                  <span><span className="block text-[8px] uppercase tracking-[0.2em] text-white/30">03 / Підкатегорія</span><span className="block mt-1 text-[11px] font-bold uppercase truncate">{subcategory || 'Усі'}</span></span>
                  <ChevronDown className="w-4 h-4 text-white/40" />
                </button>
                {openMenu === 'subcategory' && category && <div className="absolute z-50 left-0 right-0 top-full max-h-72 overflow-y-auto border border-white/10 bg-[#080808] shadow-2xl"><button type="button" onClick={() => { setSubcategory(''); setSearchActive(false); setOpenMenu(null); }} className="w-full px-3 py-2.5 text-left text-[11px] font-bold uppercase">Усі підкатегорії</button>{availableSubcategories.map(item => <button key={item} type="button" onClick={() => { setSubcategory(item); setSearchActive(false); setOpenMenu(null); }} className={`w-full px-3 py-2.5 text-left text-[11px] border-t border-white/5 ${subcategory === item ? 'bg-white text-black font-black' : 'text-white/75'}`}>{item}</button>)}</div>}
              </div>
            </div>

            <div className="relative">
              <div className="flex items-center bg-[#080808] border border-white/10">
                <MapPin className="ml-3 w-4 h-4 text-white/35 shrink-0" />
                <input value={locationQuery} onChange={event => { setLocationQuery(event.target.value); setSelectedLocation(''); setSelectedLocationCoords(null); setSearchActive(false); setOpenMenu('location'); }} onFocus={() => setOpenMenu('location')} placeholder="Місце — введіть Ро, Рок..." className="w-full h-11 bg-transparent px-2 text-[11px] text-white placeholder:text-white/25 outline-none" />
                {locationQuery && <button type="button" onClick={() => { setLocationQuery(''); setSelectedLocation(''); setSelectedLocationCoords(null); setLocationSuggestions([]); setSearchActive(false); }} className="pr-3 text-white/35"><X className="w-4 h-4" /></button>}
              </div>
              {openMenu === 'location' && <div className="absolute z-[60] left-0 right-0 top-full max-h-80 overflow-y-auto border border-white/10 bg-[#080808] shadow-2xl"><div className="px-3 py-2 text-[8px] uppercase tracking-[0.2em] text-white/25 border-b border-white/5">РЕАЛЬНІ МІСЦЯ / ПІДКАЗКИ</div>{locationQuery.trim().length < 2 && <div className="px-3 py-3 text-[10px] text-white/35">Введіть щонайменше 2 літери. Наприклад: <b className="text-white/60">Ро</b></div>}{locationLoading && <div className="px-3 py-3 text-[10px] text-white/45">Шукаємо реальні місця…</div>}{!locationLoading && locationQuery.trim().length >= 2 && locationSuggestions.map(place => <button key={`${place.name}-${place.coords.join('-')}`} type="button" onMouseDown={event => event.preventDefault()} onClick={() => chooseLocation(place)} className="w-full px-3 py-3 text-left flex items-center gap-2 text-[11px] border-b border-white/5 hover:bg-white/10 text-white/85"><MapPin className="w-3.5 h-3.5 shrink-0 text-white/40" />{place.name}</button>)}{!locationLoading && locationQuery.trim().length >= 2 && locationSuggestions.length === 0 && <div className="px-3 py-4 text-[11px] text-white/35">Реальних місць за цим початком не знайдено.</div>}</div>}
            </div>

            <div className="relative">
              <button type="button" onClick={() => setOpenMenu(openMenu === 'radius' ? null : 'radius')} className="w-full bg-[#080808] border border-white/10 px-3 py-3 text-left flex items-center justify-between">
                <span><span className="block text-[8px] uppercase tracking-[0.2em] text-white/30">04 / Радіус</span><span className="block mt-1 text-[11px] font-bold uppercase">{radiusKm ? `${radiusKm} км` : 'Без обмеження'}</span></span>
                <ChevronDown className="w-4 h-4 text-white/40" />
              </button>
              {openMenu === 'radius' && <div className="absolute z-50 left-0 right-0 top-full border border-white/10 bg-[#080808] shadow-2xl grid grid-cols-3 gap-px"><button type="button" onClick={() => { setRadiusKm(null); setSearchActive(false); setOpenMenu(null); }} className="p-3 text-[10px] uppercase font-bold">Усі</button>{RADIUS_OPTIONS.map(radius => <button key={radius} type="button" onClick={() => { setRadiusKm(radius); setSearchActive(false); setOpenMenu(null); }} className={`p-3 text-[10px] uppercase font-bold ${radiusKm === radius ? 'bg-white text-black' : ''}`}>{radius} км</button>)}</div>}
            </div>

            <div className="flex items-center justify-between gap-3">
              {radiusKm && !searchCenter && <div className="flex items-center gap-2 text-[10px] text-white/45"><Navigation className="w-3.5 h-3.5" />Оберіть місце для радіуса</div>}
              {hasFilters && <button type="button" onClick={clearFilters} className="ml-auto text-[9px] uppercase tracking-[0.2em] text-white/45">× Скинути все</button>}
            </div>
          </div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-3 py-3 sm:px-4 space-y-3 overscroll-contain">
        <div className="flex items-center justify-between px-1 pb-1"><span className="text-[9px] uppercase tracking-[0.28em] text-white/30 font-black">INDEX / {String(filtered.length).padStart(2, '0')}</span><span className="text-[9px] uppercase tracking-[0.2em] text-white/20">{searchActive ? 'SEARCH RESULT' : 'LIVE LIST'}</span></div>
        {filtered.map((listing, index) => <ListingCard key={listing.id} listing={listing} onClick={() => onSelectListing(listing)} variant="full" index={index} />)}
        {filtered.length === 0 && <div className="min-h-48 border border-white/10 flex items-center justify-center text-center px-6"><div><div className="text-[9px] uppercase tracking-[0.3em] text-white/25 mb-2">NO RESULT</div><p className="text-sm text-white/40">Нічого не знайдено.<br />Спробуйте змінити пошук або фільтри.</p></div></div>}
      </div>
    </section>
  );
};
