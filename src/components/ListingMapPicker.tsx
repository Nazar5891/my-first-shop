import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Check, LocateFixed, X } from 'lucide-react';
import { COMMUNITY_CENTER } from '../data/mockListings';

interface ListingMapPickerProps {
  isOpen: boolean;
  initialCoordinates?: [number, number] | null;
  onConfirm: (coordinates: [number, number]) => void;
  onClose: () => void;
}

export const ListingMapPicker: React.FC<ListingMapPickerProps> = ({ isOpen, initialCoordinates, onConfirm, onClose }) => {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [selected, setSelected] = useState<[number, number] | null>(initialCoordinates ?? null);
  const [gpsBusy, setGpsBusy] = useState(false);

  useEffect(() => {
    if (isOpen) setSelected(initialCoordinates ?? null);
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

    const putMarker = (coords: [number, number]) => {
      setSelected(coords);
      const map = mapRef.current;
      if (!map) return;
      if (!markerRef.current) markerRef.current = L.marker(coords, { icon }).addTo(map);
      else markerRef.current.setLatLng(coords);
    };

    const init = () => {
      const el = elementRef.current;
      if (cancelled || !el || mapRef.current) return;
      if (el.clientWidth < 100 || el.clientHeight < 100) {
        retry = setTimeout(init, 100);
        return;
      }

      const map = L.map(el, {
        center: initialCoordinates ?? COMMUNITY_CENTER,
        zoom: 14,
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
        setSelected(point);
        mapRef.current?.setView(point, 16, { animate: true });
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

  if (!isOpen) return null;

  return (
    <div className="listing-map-overlay fixed inset-0 z-[9999] bg-slate-950 flex flex-col">
      <div className="listing-map-header shrink-0 h-16 px-4 flex items-center justify-between bg-slate-950 border-b border-purple-900/50">
        <div><div className="font-black text-white">Виберіть місце</div><div className="text-xs text-purple-300">Натисніть на карту, щоб поставити 📍</div></div>
        <button type="button" onClick={onClose} className="w-10 h-10 rounded-full bg-slate-900 border border-purple-800 text-white flex items-center justify-center"><X /></button>
      </div>
      <div ref={elementRef} className="listing-map-picker flex-1 min-h-0 w-full" />
      <div className="listing-map-footer shrink-0 p-3 bg-slate-950 border-t border-purple-900/50 flex gap-2">
        <button type="button" onClick={locate} disabled={gpsBusy} className="flex-1 py-3 rounded-2xl bg-emerald-600 text-white font-black flex items-center justify-center gap-2 disabled:opacity-60"><LocateFixed className="w-4 h-4"/>{gpsBusy ? 'Визначаю...' : 'Моє місце'}</button>
        <button type="button" onClick={() => selected && onConfirm(selected)} disabled={!selected} className="flex-1 py-3 rounded-2xl bg-cyan-600 text-white font-black flex items-center justify-center gap-2 disabled:opacity-40"><Check className="w-4 h-4"/>Готово</button>
      </div>
    </div>
  );
};
