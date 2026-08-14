import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Check, LocateFixed, MapPin, X } from 'lucide-react';
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
    if (!isOpen) return;
    setSelected(initialCoordinates ?? null);
  }, [isOpen, initialCoordinates]);

  useEffect(() => {
    if (!isOpen || !elementRef.current) return;

    const el = elementRef.current;
    let cancelled = false;
    let map: L.Map | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const markerIcon = L.divIcon({
      className: 'listing-location-pin',
      html: '<div style="font-size:38px;line-height:38px;filter:drop-shadow(0 2px 4px rgba(0,0,0,.8))">📍</div>',
      iconSize: [38, 38],
      iconAnchor: [19, 36],
    });

    const putMarker = (coords: [number, number]) => {
      setSelected(coords);
      if (!map) return;
      if (!markerRef.current) markerRef.current = L.marker(coords, { icon: markerIcon }).addTo(map);
      else markerRef.current.setLatLng(coords);
    };

    const init = () => {
      if (cancelled || !elementRef.current || mapRef.current) return;
      const rect = elementRef.current.getBoundingClientRect();
      if (rect.width < 100 || rect.height < 100) {
        timer = setTimeout(init, 100);
        return;
      }

      try {
        map = L.map(elementRef.current, { center: initialCoordinates ?? COMMUNITY_CENTER, zoom: 14, zoomControl: true, attributionControl: true });
        mapRef.current = map;

        const osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors',
          crossOrigin: true,
        }).addTo(map);

        osm.on('tileerror', () => {
          // Do not hide the map when a tile request fails; the map and controls remain usable.
          console.warn('OpenStreetMap tile failed');
        });

        map.on('click', e => putMarker([e.latlng.lat, e.latlng.lng]));

        if (initialCoordinates) putMarker(initialCoordinates);

        const resize = () => map?.invalidateSize({ animate: false });
        requestAnimationFrame(resize);
        setTimeout(resize, 100);
        setTimeout(resize, 400);
      } catch (e) {
        console.error('Map picker initialization failed', e);
      }
    };

    requestAnimationFrame(() => requestAnimationFrame(init));

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
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
      position => {
        const coords: [number, number] = [position.coords.latitude, position.coords.longitude];
        setGpsBusy(false);
        setSelected(coords);
        mapRef.current?.setView(coords, 16, { animate: true });
        if (mapRef.current) {
          if (!markerRef.current) {
            markerRef.current = L.marker(coords, { icon: L.divIcon({ className: 'listing-location-pin', html: '<div style="font-size:38px;line-height:38px">📍</div>', iconSize: [38,38], iconAnchor: [19,36] }) }).addTo(mapRef.current);
          } else markerRef.current.setLatLng(coords);
        }
      },
      () => setGpsBusy(false),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  if (!isOpen) return null;

  return (
    <div className="listing-map-picker-overlay fixed inset-0 z-[200] bg-slate-950 flex flex-col">
      <div className="shrink-0 h-16 px-4 flex items-center justify-between bg-slate-950/95 border-b border-purple-900/50">
        <div><div className="font-black text-white">Виберіть місце</div><div className="text-xs text-purple-300">Натисніть на карту, щоб поставити 📍</div></div>
        <button type="button" onClick={onClose} className="w-10 h-10 rounded-full bg-slate-900 border border-purple-800 text-white flex items-center justify-center"><X /></button>
      </div>
      <div ref={elementRef} className="flex-1 min-h-0 w-full bg-slate-800" />
      <div className="shrink-0 p-3 bg-slate-950/95 border-t border-purple-900/50 flex gap-2">
        <button type="button" onClick={locate} disabled={gpsBusy} className="flex-1 py-3 rounded-2xl bg-emerald-600 text-white font-black flex items-center justify-center gap-2 disabled:opacity-60"><LocateFixed className="w-4 h-4"/>{gpsBusy ? 'Визначаю...' : 'Моє місце'}</button>
        <button type="button" onClick={() => selected && onConfirm(selected)} disabled={!selected} className="flex-1 py-3 rounded-2xl bg-cyan-600 text-white font-black flex items-center justify-center gap-2 disabled:opacity-40"><Check className="w-4 h-4"/>Готово</button>
      </div>
    </div>
  );
};
