import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Check, LocateFixed, Search, X } from 'lucide-react';

interface ListingMapPickerProps {
  isOpen: boolean;
  initialCoordinates?: [number, number] | null;
  onConfirm: (coordinates: [number, number], locationName?: string) => void;
  onClose: () => void;
}

const UKRAINE_VIEW: [number, number] = [49.0, 31.5];
const UKRAINE_ZOOM = 6;

export const ListingMapPicker: React.FC<ListingMapPickerProps> = ({ isOpen, initialCoordinates, onConfirm, onClose }) => {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [selected, setSelected] = useState<[number, number] | null>(initialCoordinates ?? null);
  const [gpsBusy, setGpsBusy] = useState(false);
  const [addressBusy, setAddressBusy] = useState(false);
  const [searchBusy, setSearchBusy] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchError, setSearchError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelected(initialCoordinates ?? null);
      setSearchQuery('');
      setSearchError('');
    }
  }, [isOpen, initialCoordinates]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    let retry: ReturnType<typeof setTimeout> | null = null;

    const icon = L.divIcon({
      className: 'listing-location-pin',
      html: '<div style="font-size:38px;line-height:38px;filter:drop-shadow(0 2px 4px rgba(0,0,0,.8))">📍</div>',
      iconSize: [38, 38],
      iconAnchor: [19, 36],
    });

    const putMarker = (coords: [number, number], zoom?: number) => {
      setSelected(coords);
      const map = mapRef.current;
      if (!map) return;
      if (!markerRef.current) markerRef.current = L.marker(coords, { icon }).addTo(map);
      else markerRef.current.setLatLng(coords);
      if (zoom) map.setView(coords, zoom, { animate: true });
    };

    const init = () => {
      const el = elementRef.current;
      if (cancelled || !el || mapRef.current) return;
      if (el.clientWidth < 100 || el.clientHeight < 100) {
        retry = setTimeout(init, 100);
        return;
      }

      const map = L.map(el, {
        center: initialCoordinates ?? UKRAINE_VIEW,
        zoom: initialCoordinates ? 16 : UKRAINE_ZOOM,
        zoomControl: true,
        attributionControl: true,
        tap: true,
      });
      mapRef.current = map;

      const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);
      tiles.on('tileerror', () => console.warn('OSM tile failed'));
      map.on('click', e => putMarker([e.latlng.lat, e.latlng.lng]));
      if (initialCoordinates) putMarker(initialCoordinates);

      const resize = () => {
        if (!cancelled && mapRef.current) mapRef.current.invalidateSize({ animate: false });
      };
      requestAnimationFrame(resize);
      setTimeout(resize, 150);
      setTimeout(resize, 500);
    };

    requestAnimationFrame(() => requestAnimationFrame(init));

    return () => {
      cancelled = true;
      if (retry) clearTimeout(retry);
      markerRef.current = null;
      if (mapRef.current) {
        mapRef.current.off();
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [isOpen]);

  const locate = () => {
    if (!navigator.geolocation) return;
    setGpsBusy(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const point: [number, number] = [coords.latitude, coords.longitude];
        setGpsBusy(false);
        setSearchError('');
        setSelected(point);
        mapRef.current?.setView(point, 17, { animate: true });
        if (mapRef.current) {
          const icon = L.divIcon({ className: 'listing-location-pin', html: '<div style="font-size:38px;line-height:38px">📍</div>', iconSize: [38, 38], iconAnchor: [19, 36] });
          if (!markerRef.current) markerRef.current = L.marker(point, { icon }).addTo(mapRef.current);
          else markerRef.current.setLatLng(point);
        }
      },
      () => setGpsBusy(false),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  const searchPlace = async () => {
    const query = searchQuery.trim();
    if (!query) return;
    setSearchBusy(true);
    setSearchError('');
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&addressdetails=1&q=${encodeURIComponent(query)}`, { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error('Search failed');
      const results = await response.json();
      const result = results?.[0];
      if (!result) {
        setSearchError('Місто або адресу не знайдено. Спробуйте написати інакше.');
        return;
      }
      const point: [number, number] = [Number(result.lat), Number(result.lon)];
      const map = mapRef.current;
      if (map) {
        const icon = L.divIcon({ className: 'listing-location-pin', html: '<div style="font-size:38px;line-height:38px">📍</div>', iconSize: [38, 38], iconAnchor: [19, 36] });
        if (!markerRef.current) markerRef.current = L.marker(point, { icon }).addTo(map);
        else markerRef.current.setLatLng(point);
        map.setView(point, 16, { animate: true });
      }
      setSelected(point);
    } catch (error) {
      console.warn('Place search failed', error);
      setSearchError('Не вдалося знайти місце. Перевірте інтернет-зʼєднання.');
    } finally {
      setSearchBusy(false);
    }
  };

  const confirm = async () => {
    if (!selected) return;
    setAddressBusy(true);
    let locationName: string | undefined;
    try {
      const [lat, lon] = selected;
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&zoom=18&addressdetails=1`, { headers: { Accept: 'application/json' } });
      if (response.ok) {
        const data = await response.json();
        const a = data?.address ?? {};
        const street = a.road || a.pedestrian || a.footway;
        const house = a.house_number;
        const locality = a.city || a.town || a.village || a.municipality || a.county;
        locationName = [street && `${street}${house ? ` ${house}` : ''}`, locality].filter(Boolean).join(', ') || data?.display_name || undefined;
      }
    } catch (error) {
      console.warn('Reverse geocoding failed', error);
    } finally {
      setAddressBusy(false);
    }
    onConfirm(selected, locationName);
  };

  if (!isOpen) return null;

  const overlay = (
    <div className="listing-map-overlay" style={{ position: 'fixed', inset: 0, width: '100vw', height: '100dvh', zIndex: 99999, overflow: 'hidden' }}>
      <div className="listing-map-header" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 3500 }}>
        <div className="shrink-0 bg-slate-950 border-b border-purple-900/50 p-3 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div><div className="font-black text-white">Виберіть місце</div><div className="text-xs text-purple-300">Рівне, Рокитне або будь-яке інше місто</div></div>
            <button type="button" onClick={onClose} className="w-10 h-10 shrink-0 rounded-full bg-slate-900 border border-purple-800 text-white flex items-center justify-center"><X /></button>
          </div>
          <div className="flex gap-2">
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') searchPlace(); }} placeholder="Знайти місто або адресу, напр. Рівне" className="min-w-0 flex-1 px-3 py-2.5 rounded-xl bg-slate-900 border border-purple-800/60 text-white text-sm outline-none focus:border-cyan-500" />
            <button type="button" onClick={searchPlace} disabled={searchBusy || !searchQuery.trim()} className="px-3 rounded-xl bg-purple-600 text-white font-black disabled:opacity-50 flex items-center gap-1.5"><Search className="w-4 h-4" />{searchBusy ? '...' : 'Знайти'}</button>
          </div>
          {searchError && <div className="text-[11px] font-bold text-rose-300 px-1">{searchError}</div>}
        </div>
      </div>

      <div ref={elementRef} className="listing-map-picker" style={{ position: 'fixed', inset: 0, width: '100vw', height: '100dvh', zIndex: 1 }} />

      <div className="listing-map-footer" style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 6000, width: '100vw' }}>
        <div className="p-3 bg-slate-950 border-t border-purple-900/50 flex gap-2 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
          <button type="button" onClick={locate} disabled={gpsBusy} className="flex-1 py-3 rounded-2xl bg-emerald-600 text-white font-black flex items-center justify-center gap-2 disabled:opacity-60"><LocateFixed className="w-4 h-4" />{gpsBusy ? 'Визначаю...' : 'Моє місце'}</button>
          <button type="button" onClick={confirm} disabled={!selected || addressBusy} className="flex-1 py-3 rounded-2xl bg-cyan-600 text-white font-black flex items-center justify-center gap-2 disabled:opacity-40"><Check className="w-4 h-4" />{addressBusy ? 'Визначаю адресу...' : 'Готово'}</button>
        </div>
      </div>

      <style>{`.listing-map-overlay .leaflet-control-zoom{position:absolute!important;top:110px!important;right:14px!important;left:auto!important;bottom:auto!important;z-index:7000!important}`}</style>
    </div>
  );

  return createPortal(overlay, document.body);
};
