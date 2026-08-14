import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Layers, Crosshair, Compass, Navigation, X, Car, Footprints, ChevronRight, MapPin, Phone, ExternalLink } from 'lucide-react';
import { Listing, CATEGORIES } from '../types';
import { COMMUNITY_CENTER } from '../data/mockListings';
import { formatDistance } from '../utils/distance';
import { DistanceRangeSlider } from './DistanceRangeSlider';
import { renderMarkerHtml } from '../utils/categoryMarkerIcons';

export type MapTileStyle = 'light' | 'streets' | 'satellite' | 'dark';

interface MapViewProps {
  listings: Listing[];
  selectedListing: Listing | null;
  onSelectListing: (listing: Listing | null) => void;
  userCoordinates?: [number, number];
  setUserCoordinates?: (coords: [number, number]) => void;
  isPinSelectMode?: boolean;
  selectedPinLocation?: [number, number] | null;
  onPinSelected?: (coords: [number, number]) => void;
  activeNavigationListing?: Listing | null;
  onStopNavigation?: () => void;
  onCallListing?: (listing: Listing) => void;
  onRouteListing?: (listing: Listing) => void;
  onDetailListing?: (listing: Listing) => void;
  maxRadiusKm?: number | null;
  onChangeMaxRadiusKm?: (radius: number | null) => void;
  onGpsStatusChange?: (enabled: boolean) => void;
}

const TILE_URLS: Record<MapTileStyle, { url: string; attr: string }> = {
  light: { url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', attr: '&copy; OpenStreetMap &copy; CARTO' },
  streets: { url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', attr: '&copy; OpenStreetMap &copy; CARTO' },
  satellite: { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attr: '&copy; Esri, Maxar, Earthstar Geographics' },
  dark: { url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', attr: '&copy; OpenStreetMap &copy; CARTO' }
};

export const MapView: React.FC<MapViewProps> = ({
  listings, selectedListing, onSelectListing, userCoordinates, setUserCoordinates,
  isPinSelectMode = false, selectedPinLocation, onPinSelected,
  activeNavigationListing = null, onStopNavigation, onCallListing, onRouteListing, onDetailListing,
  maxRadiusKm = null, onChangeMaxRadiusKm, onGpsStatusChange
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const routeGroupRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);
  const pinMarkerRef = useRef<L.Marker | null>(null);
  const onSelectRef = useRef(onSelectListing);
  const onPinRef = useRef(onPinSelected);
  const [mapStyle, setMapStyle] = useState<MapTileStyle>('light');
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const [showRadiusMenu, setShowRadiusMenu] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [realGpsCoordinates, setRealGpsCoordinates] = useState<[number, number] | null>(null);
  const [routeError, setRouteError] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);
  const [navSteps, setNavSteps] = useState<string[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => { onSelectRef.current = onSelectListing; onPinRef.current = onPinSelected; }, [onSelectListing, onPinSelected]);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;
    const map = L.map(mapContainerRef.current, { center: COMMUNITY_CENTER, zoom: 14, zoomControl: false });
    const tile = TILE_URLS[mapStyle];
    tileLayerRef.current = L.tileLayer(tile.url, { maxZoom: 19, attribution: tile.attr }).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    markersGroupRef.current = L.layerGroup().addTo(map);
    routeGroupRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;
    map.on('click', (e: L.LeafletMouseEvent) => {
      if (isPinSelectMode && onPinRef.current) onPinRef.current([e.latlng.lat, e.latlng.lng]);
      else onSelectRef.current(null);
    });
    setTimeout(() => map.invalidateSize(), 300);
    return () => {
      map.remove();
      mapInstanceRef.current = null;
      tileLayerRef.current = null;
      markersGroupRef.current = null;
      routeGroupRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    tileLayerRef.current?.remove();
    const tile = TILE_URLS[mapStyle];
    tileLayerRef.current = L.tileLayer(tile.url, { maxZoom: 19, attribution: tile.attr }).addTo(map);
  }, [mapStyle]);

  const requestGPS = () => {
    if (!navigator.geolocation) {
      alert('Геолокація не підтримується вашим браузером.');
      setGpsEnabled(false);
      onGpsStatusChange?.(false);
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      position => {
        const coords: [number, number] = [position.coords.latitude, position.coords.longitude];
        setRealGpsCoordinates(coords);
        setGpsEnabled(true);
        onGpsStatusChange?.(true);
        setUserCoordinates?.(coords);
        mapInstanceRef.current?.flyTo(coords, 16, { animate: true, duration: 1.5 });
        setIsLocating(false);
      },
      error => {
        console.log('GPS error:', error.message);
        setIsLocating(false);
        setGpsEnabled(false);
        onGpsStatusChange?.(false);
        setRealGpsCoordinates(null);
        mapInstanceRef.current?.flyTo(COMMUNITY_CENTER, 14, { animate: true });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    onGpsStatusChange?.(false);
  }, [onGpsStatusChange]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    userMarkerRef.current?.remove();
    userMarkerRef.current = null;
    radiusCircleRef.current?.remove();
    radiusCircleRef.current = null;
    if (!gpsEnabled || !realGpsCoordinates) return;

    const icon = L.divIcon({
      className: 'user-location-marker', iconSize: [52, 52], iconAnchor: [26, 26],
      html: `<div style="position:relative;width:52px;height:52px;pointer-events:none"><div style="position:absolute;left:50%;top:50%;width:48px;height:48px;transform:translate(-50%,-50%);border-radius:50%;background:rgba(6,182,212,.20);animation:gpsPulse 2s infinite"></div><div style="position:absolute;left:50%;top:50%;width:20px;height:20px;transform:translate(-50%,-50%);border-radius:50%;background:#06b6d4;border:3px solid white;box-shadow:0 0 14px rgba(6,182,212,.95)"></div><div style="position:absolute;left:50%;top:50%;width:6px;height:6px;transform:translate(-50%,-50%);border-radius:50%;background:#0f172a"></div></div><style>@keyframes gpsPulse{0%{transform:scale(.7);opacity:.9}70%{transform:scale(1.4);opacity:0}100%{opacity:0}}</style>`
    });
    userMarkerRef.current = L.marker(realGpsCoordinates, { icon, zIndexOffset: 2000, interactive: false, bubblingMouseEvents: false }).addTo(map);

    if (maxRadiusKm !== null && maxRadiusKm > 0) {
      radiusCircleRef.current = L.circle(realGpsCoordinates, { radius: maxRadiusKm * 1000, color: '#c084fc', fillColor: '#a855f7', fillOpacity: .12, weight: 2, dashArray: '6, 8', interactive: false }).addTo(map);
    }
  }, [gpsEnabled, realGpsCoordinates, maxRadiusKm]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (isPinSelectMode && selectedPinLocation) {
      const icon = L.divIcon({ className: 'custom-pin-select-marker', iconSize: [0, 0], iconAnchor: [0, 0], html: `<div style="transform:translate(-50%,-100%);display:flex;flex-direction:column;align-items:center"><div style="background:#9333ea;color:white;font-weight:800;font-size:12px;padding:6px 10px;border-radius:999px;border:2px solid #c084fc;box-shadow:0 4px 15px rgba(0,0,0,.4);white-space:nowrap">📍 Обрана точка</div><div style="width:12px;height:12px;background:#9333ea;transform:rotate(45deg);margin-top:-5px"></div></div>` });
      if (pinMarkerRef.current) pinMarkerRef.current.setLatLng(selectedPinLocation);
      else pinMarkerRef.current = L.marker(selectedPinLocation, { icon, interactive: false }).addTo(map);
    } else {
      pinMarkerRef.current?.remove();
      pinMarkerRef.current = null;
    }
  }, [isPinSelectMode, selectedPinLocation]);

  useEffect(() => {
    const map = mapInstanceRef.current, layer = markersGroupRef.current;
    if (!map || !layer) return;
    layer.clearLayers();
    listings.forEach(listing => {
      if (!listing?.coordinates || !Array.isArray(listing.coordinates) || listing.coordinates.length < 2) return;
      const icon = L.divIcon({ className: 'custom-listing-marker', html: renderMarkerHtml(listing, selectedListing?.id === listing.id, activeNavigationListing?.id === listing.id), iconSize: [0, 0] });
      const marker = L.marker(listing.coordinates, { icon }).addTo(layer);
      marker.on('click', e => { if (e.originalEvent) L.DomEvent.stopPropagation(e.originalEvent); onSelectRef.current(listing); map.panTo(listing.coordinates, { animate: true }); });
    });
  }, [listings, selectedListing, activeNavigationListing]);

  useEffect(() => {
    const map = mapInstanceRef.current, group = routeGroupRef.current;
    if (!map || !group) return;
    group.clearLayers();
    setRouteError(false); setRouteLoading(false); setNavSteps([]); setCurrentStepIndex(0);
    if (!activeNavigationListing || !gpsEnabled || !realGpsCoordinates) return;

    const start = realGpsCoordinates;
    const end = activeNavigationListing.coordinates;
    if (!end || end.length < 2) return;

    const controller = new AbortController();
    setRouteLoading(true);
    const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson&steps=true`;
    fetch(url, { signal: controller.signal })
      .then(r => { if (!r.ok) throw new Error(`OSRM ${r.status}`); return r.json(); })
      .then(data => {
        if (data.code !== 'Ok' || !data.routes?.[0]) throw new Error('Маршрут не знайдено');
        const route = data.routes[0];
        const coords: [number, number][] = route.geometry.coordinates.map((p: [number, number]) => [p[1], p[0]]);
        L.polyline(coords, { color: '#0284c7', weight: 9, opacity: .28, interactive: false }).addTo(group);
        L.polyline(coords, { color: '#22d3ee', weight: 5, opacity: .95, interactive: false }).addTo(group);
        const steps: string[] = [];
        for (const leg of route.legs || []) for (const step of leg.steps || []) {
          const name = step.name ? ` по ${step.name}` : '';
          const type = step.maneuver?.type || 'Рух';
          const modifier = step.maneuver?.modifier ? ` ${step.maneuver.modifier}` : '';
          steps.push(`${type}${modifier}${name}`);
        }
        setNavSteps(steps.length ? steps.slice(0, 20) : ['Рухайтеся за маршрутом до пункту призначення']);
        map.fitBounds(L.latLngBounds(coords), { padding: [80, 80], animate: true });
        setRouteLoading(false);
      })
      .catch(error => {
        if (error?.name === 'AbortError') return;
        console.error('Не вдалося побудувати маршрут:', error);
        setRouteError(true); setRouteLoading(false);
      });
    return () => controller.abort();
  }, [activeNavigationListing, gpsEnabled, realGpsCoordinates]);

  const handleGPSButton = () => {
    if (gpsEnabled) {
      setGpsEnabled(false); setRealGpsCoordinates(null); return;
    }
    requestGPS();
  };

  const handleRecenter = () => {
    if (gpsEnabled && realGpsCoordinates) mapInstanceRef.current?.flyTo(realGpsCoordinates, 16, { animate: true });
    else mapInstanceRef.current?.flyTo(COMMUNITY_CENTER, 14, { animate: true });
  };

  const shownSteps = navSteps.length ? navSteps : ['Очікуємо маршрут…'];

  return <div className="relative w-full h-full min-h-[420px] flex-1">
    <div ref={mapContainerRef} className="w-full h-full rounded-2xl overflow-hidden shadow-inner border border-purple-900/30" />

    {isPinSelectMode && <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 bg-purple-900/95 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg border border-purple-400/50">📍 Натисніть на карту, щоб вибрати точку</div>}

    <div className="absolute top-3 left-3 z-30 flex flex-col gap-2">
      <button onClick={handleGPSButton} disabled={isLocating} className={`p-2.5 rounded-xl shadow-lg border font-bold text-xs flex items-center gap-1.5 ${gpsEnabled ? 'bg-cyan-600 text-white border-cyan-300' : 'bg-slate-950/90 text-cyan-300 border-cyan-800/60'}`}>
        <Crosshair className={isLocating ? 'w-4 h-4 animate-spin' : 'w-4 h-4'} />
        <span>{isLocating ? 'Пошук GPS…' : gpsEnabled ? 'Геолокація: ВКЛ' : 'Геолокація: ВИКЛ'}</span>
      </button>
      <button onClick={() => setShowRadiusMenu(v => !v)} className="p-2.5 rounded-xl shadow-lg border font-bold text-xs flex items-center gap-1.5 bg-slate-950/90 text-purple-200 border-purple-800/60"><Compass className="w-4 h-4" /><span>Радіус: {maxRadiusKm !== null ? `${maxRadiusKm} км` : 'Всі'}</span></button>
      {showRadiusMenu && <div className="w-72 sm:w-80 shadow-2xl"><DistanceRangeSlider maxRadiusKm={maxRadiusKm} onChangeMaxRadiusKm={onChangeMaxRadiusKm} filteredCount={listings.length} compact /></div>}
    </div>

    <div className="absolute top-3 right-3 z-30 flex flex-col gap-2">
      <div className="relative"><button onClick={() => setShowStyleMenu(v => !v)} className="p-2.5 rounded-xl bg-slate-950/90 text-purple-200 border border-purple-800/50 shadow-lg"><Layers className="w-4 h-4" /></button>
        {showStyleMenu && <div className="absolute right-0 top-12 bg-slate-950/95 border border-purple-800/60 rounded-2xl p-2 shadow-2xl w-48 z-40 text-xs font-extrabold">{(['light','streets','satellite','dark'] as MapTileStyle[]).map(style => <button key={style} onClick={() => { setMapStyle(style); setShowStyleMenu(false); }} className={`w-full text-left p-2 rounded-xl ${mapStyle === style ? 'bg-purple-600 text-white' : 'text-purple-200'}`}>{style === 'light' ? '☀️ Світла карта' : style === 'streets' ? '🗺️ Вулиці' : style === 'satellite' ? '🛰️ Супутник' : '🌌 Нічна карта'}{mapStyle === style && ' ✓'}</button>)}</div>}
      </div>
      <button onClick={handleRecenter} className="p-2.5 rounded-xl bg-slate-950/90 text-purple-200 border border-purple-800/50 shadow-lg"><Compass className="w-4 h-4" /></button>
    </div>

    {!activeNavigationListing && <div className="absolute bottom-3 left-3 z-20 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md border border-purple-800/50 text-[11px] font-bold text-purple-200"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block mr-2" />Рокитне • онлайн-карта</div>}

    {activeNavigationListing && <div className="absolute top-3 left-3 right-16 z-40 max-w-lg bg-slate-950/95 border-2 border-cyan-500 rounded-2xl p-3 shadow-2xl text-slate-100">
      <div className="flex items-center justify-between gap-2"><div className="flex items-center gap-2"><Navigation className="w-5 h-5 text-cyan-400" /><div><div className="text-[9px] font-black text-cyan-400">АКТИВНИЙ МАРШРУТ ДОРОГАМИ</div><div className="font-extrabold text-xs">{activeNavigationListing.title}</div></div></div><button onClick={onStopNavigation} className="p-1 rounded-lg bg-slate-900 text-rose-300"><X className="w-4 h-4" /></button></div>
      <div className="grid grid-cols-3 gap-2 mt-3"><div className="bg-slate-900 p-2 rounded-xl text-center"><span className="text-[9px] text-purple-300 block">Відстань</span><span className="text-cyan-300 font-black text-xs">{formatDistance(activeNavigationListing.distanceMeters)}</span></div><div className="bg-slate-900 p-2 rounded-xl text-center"><Car className="w-4 h-4 mx-auto text-purple-400" /><span className="text-[9px] text-purple-300 block">Авто</span><span className="text-white font-black text-xs">~{Math.max(1, Math.round((activeNavigationListing.distanceMeters / 1000 / 40) * 60))} хв</span></div><div className="bg-slate-900 p-2 rounded-xl text-center"><Footprints className="w-4 h-4 mx-auto text-purple-400" /><span className="text-[9px] text-purple-300 block">Пішки</span><span className="text-white font-black text-xs">~{Math.round((activeNavigationListing.distanceMeters / 1000 / 4) * 60)} хв</span></div></div>
      {routeLoading && <div className="mt-2 bg-cyan-950/70 p-2 rounded-xl text-xs text-cyan-200">🛣️ Будуємо маршрут дорогами…</div>}
      {routeError && <div className="mt-2 bg-rose-950/80 p-2 rounded-xl text-xs text-rose-200">Не вдалося отримати маршрут дорогами. Перевірте інтернет і спробуйте ще раз.</div>}
      {!routeLoading && !routeError && <div className="mt-2 bg-cyan-950/60 p-2 rounded-xl text-xs text-cyan-200 flex items-center justify-between gap-2"><span className="truncate"><ChevronRight className="w-4 h-4 inline" /> {shownSteps[currentStepIndex % shownSteps.length]}</span>{shownSteps.length > 1 && <button onClick={() => setCurrentStepIndex(i => (i + 1) % shownSteps.length)} className="text-[9px] font-extrabold bg-cyan-600 text-slate-950 px-2 py-1 rounded-md">Далі →</button>}</div>}
    </div>}

    {selectedListing && <div className="absolute top-3 right-3 bottom-3 z-50 w-[calc(100%-24px)] sm:w-[380px] bg-slate-950/95 border-2 border-purple-600 text-slate-100 rounded-3xl p-4 shadow-2xl overflow-y-auto">
      <div className="flex items-center justify-between border-b border-purple-900/50 pb-3"><span className="bg-purple-950 text-purple-200 text-xs font-black px-2.5 py-1 rounded-full border border-purple-800/60">{CATEGORIES[selectedListing.category]?.pinSymbol || '📌'} {CATEGORIES[selectedListing.category]?.label || 'Пропозиція'}</span><button onClick={() => onSelectListing(null)} className="p-1.5 rounded-full bg-slate-900 text-purple-300"><X className="w-4 h-4" /></button></div>
      <h4 className="font-extrabold text-base mt-3">{selectedListing.title}</h4><div className="text-xs text-purple-300 mt-2"><MapPin className="w-3.5 h-3.5 inline text-cyan-400" /> {formatDistance(selectedListing.distanceMeters)} від вас</div>
      {selectedListing.photoUrl && <div className="rounded-2xl overflow-hidden mt-3 h-36"><img src={selectedListing.photoUrl} alt={selectedListing.title} className="w-full h-full object-cover" /></div>}
      <div className="bg-slate-900 p-3 rounded-2xl mt-3 text-xs"><div><b className="text-purple-400">Адреса:</b> {selectedListing.locationName}</div><div className="mt-2">{selectedListing.description}</div></div>
      <div className="grid grid-cols-2 gap-2 mt-3">{onCallListing && <button onClick={() => onCallListing(selectedListing)} className="py-2.5 bg-purple-600 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1"><Phone className="w-4 h-4" />Дзвінок</button>}{onRouteListing && <button onClick={() => onRouteListing(selectedListing)} className="py-2.5 bg-slate-900 text-purple-200 font-bold text-xs rounded-xl border border-purple-800 flex items-center justify-center gap-1"><Navigation className="w-4 h-4" />Маршрут</button>}</div>
      {onDetailListing && <button onClick={() => onDetailListing(selectedListing)} className="w-full mt-2 py-2 bg-purple-950 text-purple-200 font-bold text-xs rounded-xl border border-purple-800 flex items-center justify-center gap-1">Повна інформація<ExternalLink className="w-3.5 h-3.5" /></button>}
    </div>}
  </div>;
};
