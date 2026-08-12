import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Layers,
  Crosshair,
  Compass,
  Navigation,
  X,
  Car,
  Footprints,
  Bike,
  Siren,
  ChevronRight,
  MapPin,
  Phone,
  ExternalLink,
  Info,
} from 'lucide-react';
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
}

export const MapView: React.FC<MapViewProps> = ({
  listings,
  selectedListing,
  onSelectListing,
  userCoordinates = COMMUNITY_CENTER,
  setUserCoordinates,
  isPinSelectMode = false,
  selectedPinLocation,
  onPinSelected,
  activeNavigationListing = null,
  onStopNavigation,
  onCallListing,
  onRouteListing,
  onDetailListing,
  maxRadiusKm = null,
  onChangeMaxRadiusKm,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const routeGroupRef = useRef<L.LayerGroup | null>(null);
  const pinSelectionMarkerRef = useRef<L.Marker | null>(null);

  // Default to Light map style
  const [mapStyle, setMapStyle] = useState<MapTileStyle>('light');
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const [showRadiusMenu, setShowRadiusMenu] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isNavHudMinimized, setIsNavHudMinimized] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const isPinSelectModeRef = useRef(isPinSelectMode);
  const onPinSelectedRef = useRef(onPinSelected);
  const onSelectListingRef = useRef(onSelectListing);

  useEffect(() => {
    isPinSelectModeRef.current = isPinSelectMode;
    onPinSelectedRef.current = onPinSelected;
    onSelectListingRef.current = onSelectListing;
  }, [isPinSelectMode, onPinSelected, onSelectListing]);

  // Map Tile Source URLs (Light map, Voyager streets, Satellite, Dark)
  const TILE_URLS: Record<MapTileStyle, { url: string; attr: string }> = {
    light: {
      url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      attr: '&copy; OpenStreetMap &copy; CARTO',
    },
    streets: {
      url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      attr: '&copy; OpenStreetMap &copy; CARTO',
    },
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attr: '&copy; Esri, Maxar, Earthstar Geographics',
    },
    dark: {
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      attr: '&copy; OpenStreetMap &copy; CARTO',
    },
  };

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const initialCenter: [number, number] =
      userCoordinates && Array.isArray(userCoordinates) && userCoordinates.length === 2
        ? userCoordinates
        : COMMUNITY_CENTER;

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 14,
      zoomControl: false,
    });

    const initialTileConfig = TILE_URLS[mapStyle];
    const tileLayer = L.tileLayer(initialTileConfig.url, {
      maxZoom: 19,
      attribution: initialTileConfig.attr,
    }).addTo(map);

    tileLayerRef.current = tileLayer;

    // Zoom control at bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    markersGroupRef.current = layerGroup;

    const routeGroup = L.layerGroup().addTo(map);
    routeGroupRef.current = routeGroup;

    mapInstanceRef.current = map;

    // Map click handler: safely handle click events
    map.on('click', (e: L.LeafletMouseEvent) => {
      if (!e || !e.latlng || typeof e.latlng.lat !== 'number' || typeof e.latlng.lng !== 'number') {
        onSelectListingRef.current?.(null);
        return;
      }
      if (isPinSelectModeRef.current && onPinSelectedRef.current) {
        onPinSelectedRef.current([e.latlng.lat, e.latlng.lng]);
      } else {
        onSelectListingRef.current?.(null);
      }
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Change Tile Style dynamically
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    const map = mapInstanceRef.current;
    
    tileLayerRef.current.remove();
    const newConfig = TILE_URLS[mapStyle];
    tileLayerRef.current = L.tileLayer(newConfig.url, {
      maxZoom: 19,
      attribution: newConfig.attr,
    }).addTo(map);
  }, [mapStyle]);

  // 3. Pin selection marker effect
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (isPinSelectMode && selectedPinLocation) {
      if (pinSelectionMarkerRef.current) {
        pinSelectionMarkerRef.current.setLatLng(selectedPinLocation);
      } else {
        const customPinIcon = L.divIcon({
          className: 'custom-pin-select-marker',
          html: `
            <div class="relative -translate-x-1/2 -translate-y-full flex flex-col items-center">
              <div class="bg-purple-600 text-white font-extrabold text-xs px-2.5 py-1 rounded-full shadow-lg border-2 border-purple-400 flex items-center gap-1 animate-bounce">
                📍 Обрана точка
              </div>
              <div class="w-3 h-3 bg-purple-600 rotate-45 -mt-1.5 border-r border-b border-purple-400"></div>
            </div>
          `,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        });

        const newMarker = L.marker(selectedPinLocation, { icon: customPinIcon }).addTo(map);
        pinSelectionMarkerRef.current = newMarker;
      }
    } else {
      if (pinSelectionMarkerRef.current) {
        pinSelectionMarkerRef.current.remove();
        pinSelectionMarkerRef.current = null;
      }
    }
  }, [isPinSelectMode, selectedPinLocation]);

  // 4. Update markers on map
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = markersGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    // User Location Pulse Marker
    if (userCoordinates) {
      const userIcon = L.divIcon({
        className: 'user-location-marker',
        html: `
          <div class="relative -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
            <div class="w-9 h-9 rounded-full bg-cyan-500/30 animate-ping absolute"></div>
            <div class="w-5 h-5 rounded-full bg-cyan-400 border-2 border-white shadow-lg flex items-center justify-center shadow-cyan-500/80">
              <div class="w-2 h-2 rounded-full bg-slate-950"></div>
            </div>
          </div>
        `,
        iconSize: [0, 0],
      });
      L.marker(userCoordinates, { icon: userIcon, zIndexOffset: 1000 })
        .bindTooltip('Ви тут (GPS)', { permanent: false, direction: 'top' })
        .addTo(layerGroup);

      // Optional Radius Circle around user position
      if (maxRadiusKm !== null && Array.isArray(userCoordinates) && userCoordinates.length === 2) {
        L.circle(userCoordinates, {
          radius: maxRadiusKm * 1000,
          color: '#c084fc',
          fillColor: '#a855f7',
          fillOpacity: 0.12,
          weight: 2,
          dashArray: '6, 8',
        }).addTo(layerGroup);
      }
    }

    // Listing Pins
    listings.forEach((listing) => {
      if (
        !listing ||
        !listing.coordinates ||
        !Array.isArray(listing.coordinates) ||
        listing.coordinates.length < 2 ||
        typeof listing.coordinates[0] !== 'number' ||
        typeof listing.coordinates[1] !== 'number'
      ) {
        return;
      }

      const isSelected = selectedListing?.id === listing.id;
      const isNavTarget = activeNavigationListing?.id === listing.id;
      const markerHtml = renderMarkerHtml(listing, isSelected, isNavTarget);

      const icon = L.divIcon({
        className: 'custom-listing-marker',
        html: markerHtml,
        iconSize: [0, 0],
      });

      const marker = L.marker(listing.coordinates, { icon }).addTo(layerGroup);

      marker.on('click', (e: L.LeafletMouseEvent) => {
        if (e && e.originalEvent) {
          L.DomEvent.stopPropagation(e);
        }
        onSelectListingRef.current?.(listing);
        if (mapInstanceRef.current && listing.coordinates) {
          mapInstanceRef.current.panTo(listing.coordinates, { animate: true });
        }
      });
    });
  }, [listings, selectedListing, userCoordinates, activeNavigationListing, maxRadiusKm]);

  // 5. Draw Interactive Route Line when Navigation or Rideshare Listing is selected
  useEffect(() => {
    const map = mapInstanceRef.current;
    const routeGroup = routeGroupRef.current;
    if (!map || !routeGroup) return;

    routeGroup.clearLayers();

    // Case A: Online GPS Navigation is Active
    if (activeNavigationListing) {
      const start: [number, number] = userCoordinates;
      const end: [number, number] = activeNavigationListing.coordinates;

      // Draw route polyline with neon glow
      L.polyline([start, end], {
        color: '#06b6d4', // Cyan neon
        weight: 6,
        opacity: 0.9,
        dashArray: '10, 10',
      }).addTo(routeGroup);

      // Fit map bounds to view entire route
      map.fitBounds([start, end], { padding: [70, 70], animate: true });
      return;
    }

    // Case B: Selected Rideshare Listing has Destination Coordinates
    if (
      selectedListing &&
      (selectedListing.category === 'rideshare' || selectedListing.destinationCoordinates) &&
      selectedListing.coordinates
    ) {
      const start: [number, number] = selectedListing.coordinates;
      const dest: [number, number] | undefined = selectedListing.destinationCoordinates;

      if (dest && Array.isArray(dest) && dest.length === 2) {
        // Outer glowing route line
        L.polyline([start, dest], {
          color: '#0284c7', // Sky blue
          weight: 7,
          opacity: 0.4,
        }).addTo(routeGroup);

        // Inner dashed animated route line
        L.polyline([start, dest], {
          color: '#38bdf8', // Light sky blue
          weight: 4,
          opacity: 0.95,
          dashArray: '8, 8',
        }).addTo(routeGroup);

        // Destination Marker (Point B 🏁)
        const destIcon = L.divIcon({
          className: 'destination-flag-marker',
          html: `
            <div class="relative -translate-x-1/2 -translate-y-full flex flex-col items-center">
              <div class="bg-slate-950 text-sky-300 font-black text-[11px] px-2.5 py-1 rounded-full shadow-xl border-2 border-sky-400 flex items-center gap-1.5 whitespace-nowrap backdrop-blur-md">
                <span>🏁 ${selectedListing.rideRouteTo || 'Пункт призначення'}</span>
              </div>
              <div class="w-2.5 h-2.5 bg-sky-400 rotate-45 -mt-1 shadow-md"></div>
            </div>
          `,
          iconSize: [0, 0],
        });

        L.marker(dest, { icon: destIcon, zIndexOffset: 900 }).addTo(routeGroup);

        // Fit map bounds so both start and destination are nicely visible
        map.fitBounds([start, dest], { padding: [80, 80], animate: true });
      }
    }
  }, [activeNavigationListing, selectedListing, userCoordinates]);

  // Live GPS geolocation trigger
  const handleGPSLocate = () => {
    if (!navigator.geolocation) {
      alert('Геолокація не підтримується вашим браузером');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: [number, number] = [
          position.coords.latitude,
          position.coords.longitude,
        ];
        if (setUserCoordinates) {
          setUserCoordinates(coords);
        }
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo(coords, 15, { animate: true });
        }
        setIsLocating(false);
      },
      (error) => {
        console.warn('GPS error, fallback to community center', error);
        setIsLocating(false);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo(userCoordinates, 14, { animate: true });
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Recenter map button handler
  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(userCoordinates, 14, { animate: true });
    }
  };

  // Turn-by-turn navigation steps for active navigation
  const navSteps = activeNavigationListing
    ? [
        `Старт від вашої позиції у громаді`,
        `Рухайтеся прямо в напрямку ${activeNavigationListing.locationName}`,
        `Через ~${formatDistance(activeNavigationListing.distanceMeters)} прибуття до «${activeNavigationListing.title}»`,
      ]
    : [];

  return (
    <div className="relative w-full h-full min-h-[420px] flex-1">
      {/* Leaflet Map Canvas */}
      <div
        ref={mapContainerRef}
        className="w-full h-full rounded-2xl overflow-hidden shadow-inner border border-purple-900/30"
      />

      {/* ACTIVE ONLINE NAVIGATION HUD OVERLAY */}
      {activeNavigationListing && !isNavHudMinimized && (
        <div className="absolute top-3 left-3 right-16 z-30 max-w-lg bg-slate-950/95 border-2 border-cyan-500 rounded-2xl p-3 shadow-2xl backdrop-blur-xl space-y-2 text-slate-100 animate-slide-down">
          <div className="flex items-center justify-between gap-2 border-b border-cyan-900/50 pb-2">
            <div className="flex items-center gap-2 truncate">
              <div className="w-7 h-7 rounded-lg bg-cyan-500 text-slate-950 flex items-center justify-center font-black animate-pulse shrink-0">
                <Navigation className="w-4 h-4 fill-slate-950" />
              </div>
              <div className="truncate">
                <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest block">
                  АКТИВНИЙ МАРШРУТ ОНЛАЙН
                </span>
                <h4 className="font-extrabold text-xs text-white truncate">
                  {activeNavigationListing.title}
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setIsNavHudMinimized(true)}
                className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-800/40 text-[10px] font-extrabold transition-colors"
                title="Згорнути панель"
              >
                — Згорнути
              </button>
              <button
                onClick={onStopNavigation}
                className="p-1 rounded-lg bg-slate-900 hover:bg-rose-950 text-rose-300 border border-rose-800/50 transition-colors"
                title="Завершити навігацію"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Nav Stats bar */}
          <div className="grid grid-cols-3 gap-1.5 text-center text-xs font-bold pt-0.5">
            <div className="bg-slate-900/90 p-1.5 rounded-xl border border-purple-900/40">
              <span className="text-[9px] text-purple-300/80 block uppercase">Відстань</span>
              <span className="text-cyan-300 font-black text-xs">
                {formatDistance(activeNavigationListing.distanceMeters)}
              </span>
            </div>

            <div className="bg-slate-900/90 p-1.5 rounded-xl border border-purple-900/40 flex items-center justify-center gap-1">
              <Car className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <div>
                <span className="text-[9px] text-purple-300/80 block uppercase">Авто</span>
                <span className="text-white font-black text-xs">
                  ~{Math.max(1, Math.round((activeNavigationListing.distanceMeters / 1000 / 40) * 60))} хв
                </span>
              </div>
            </div>

            <div className="bg-slate-900/90 p-1.5 rounded-xl border border-purple-900/40 flex items-center justify-center gap-1">
              <Footprints className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <div>
                <span className="text-[9px] text-purple-300/80 block uppercase">Пішки</span>
                <span className="text-white font-black text-xs">
                  ~{Math.round((activeNavigationListing.distanceMeters / 1000 / 4) * 60)} хв
                </span>
              </div>
            </div>
          </div>

          {/* Current Turn Step */}
          <div className="bg-cyan-950/60 p-2 rounded-xl border border-cyan-800/50 text-[11px] font-semibold text-cyan-200 flex items-center justify-between">
            <div className="flex items-center gap-1.5 truncate pr-1">
              <ChevronRight className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="truncate">{navSteps[currentStepIndex]}</span>
            </div>

            {navSteps.length > 1 && (
              <button
                onClick={() =>
                  setCurrentStepIndex((prev) => (prev + 1) % navSteps.length)
                }
                className="text-[9px] font-extrabold bg-cyan-600 text-slate-950 px-2 py-0.5 rounded-md shrink-0 hover:bg-cyan-400"
              >
                Далі →
              </button>
            )}
          </div>
        </div>
      )}

      {/* MINIMIZED NAVIGATION PILL */}
      {activeNavigationListing && isNavHudMinimized && (
        <div className="absolute top-3 left-3 z-30 bg-slate-950/90 border border-cyan-400 text-cyan-200 px-3 py-1.5 rounded-full shadow-xl backdrop-blur-md flex items-center gap-2 text-xs font-bold">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
          <span className="truncate max-w-[160px] sm:max-w-xs">
            🧭 {activeNavigationListing.title}
          </span>
          <button
            onClick={() => setIsNavHudMinimized(false)}
            className="bg-cyan-500 text-slate-950 px-2 py-0.5 rounded-full text-[10px] font-black hover:bg-cyan-300"
          >
            Розгорнути
          </button>
          <button
            onClick={onStopNavigation}
            className="p-1 hover:text-rose-400 transition-colors"
            title="Завершити навігацію"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Pin picking mode alert */}
      {isPinSelectMode && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-purple-900/90 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg border border-purple-400/50 flex items-center gap-2 animate-bounce backdrop-blur-md">
          <span>📍 Натисніть на карту, щоб вибрати точку</span>
        </div>
      )}

      {/* TOP LEFT CONTROLS GROUP (Distance Radius Filter & Legend) */}
      <div className="absolute top-3 left-3 z-20 flex flex-col items-start gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setShowRadiusMenu(!showRadiusMenu);
              if (!showRadiusMenu) setShowLegend(false);
            }}
            className={`p-2.5 rounded-xl shadow-lg border font-bold text-xs flex items-center gap-1.5 transition-all backdrop-blur-md active:scale-95 ${
              maxRadiusKm !== null
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-400 ring-2 ring-purple-500/40 shadow-purple-950/80'
                : 'bg-slate-950/85 hover:bg-slate-900 text-purple-200 border-purple-800/60'
            }`}
            title="Налаштувати радіус відображення"
          >
            <Compass className="w-4 h-4 text-purple-300" />
            <span>Радіус: {maxRadiusKm !== null ? `${maxRadiusKm} км` : 'Всі'}</span>
          </button>

          <button
            onClick={() => {
              setShowLegend(!showLegend);
              if (!showLegend) setShowRadiusMenu(false);
            }}
            className={`p-2.5 rounded-xl shadow-lg border font-bold text-xs flex items-center gap-1.5 transition-all backdrop-blur-md active:scale-95 ${
              showLegend
                ? 'bg-purple-600 text-white border-purple-300 shadow-purple-950/80'
                : 'bg-slate-950/85 hover:bg-slate-900 text-purple-200 border-purple-800/60'
            }`}
            title="Легенда іконок та категорій"
          >
            <Info className="w-4 h-4 text-purple-300" />
            <span className="hidden sm:inline">Легенда</span>
          </button>
        </div>

        {showRadiusMenu && (
          <div className="w-72 sm:w-80 animate-slide-down shadow-2xl z-30">
            <DistanceRangeSlider
              maxRadiusKm={maxRadiusKm}
              onChangeMaxRadiusKm={(radius) => {
                onChangeMaxRadiusKm?.(radius);
              }}
              filteredCount={listings.length}
              compact
            />
          </div>
        )}

        {showLegend && (
          <div className="w-72 sm:w-80 bg-slate-950/95 border border-purple-800/70 rounded-2xl p-3.5 shadow-2xl backdrop-blur-xl animate-slide-down z-30 space-y-2 text-xs">
            <div className="flex items-center justify-between pb-1.5 border-b border-purple-900/50">
              <span className="font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-purple-400" /> Легенда маркерів послуг
              </span>
              <button
                onClick={() => setShowLegend(false)}
                className="text-purple-400 hover:text-white p-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px] font-bold">
              <div className="flex items-center gap-2 p-1.5 rounded-lg bg-rose-950/60 border border-rose-800/40 text-rose-200">
                <span className="w-5 h-5 rounded-md bg-rose-600 flex items-center justify-center shrink-0 text-white font-black">🚨</span>
                <span>Терміново</span>
              </div>

              <div className="flex items-center gap-2 p-1.5 rounded-lg bg-amber-950/60 border border-amber-800/40 text-amber-200">
                <span className="w-5 h-5 rounded-md bg-amber-500 flex items-center justify-center shrink-0 text-white font-black">⚡</span>
                <span>Електрика</span>
              </div>

              <div className="flex items-center gap-2 p-1.5 rounded-lg bg-sky-950/60 border border-sky-800/40 text-sky-200">
                <span className="w-5 h-5 rounded-md bg-sky-500 flex items-center justify-center shrink-0 text-white font-black">🔧</span>
                <span>Сантехніка</span>
              </div>

              <div className="flex items-center gap-2 p-1.5 rounded-lg bg-orange-950/60 border border-orange-800/40 text-orange-200">
                <span className="w-5 h-5 rounded-md bg-orange-600 flex items-center justify-center shrink-0 text-white font-black">🔥</span>
                <span>Опалення</span>
              </div>

              <div className="flex items-center gap-2 p-1.5 rounded-lg bg-yellow-950/60 border border-yellow-800/40 text-yellow-200">
                <span className="w-5 h-5 rounded-md bg-yellow-600 flex items-center justify-center shrink-0 text-white font-black">🔨</span>
                <span>Будівництво</span>
              </div>

              <div className="flex items-center gap-2 p-1.5 rounded-lg bg-cyan-950/60 border border-cyan-800/40 text-cyan-200">
                <span className="w-5 h-5 rounded-md bg-cyan-500 flex items-center justify-center shrink-0 text-white font-black">📶</span>
                <span>Інтернет</span>
              </div>

              <div className="flex items-center gap-2 p-1.5 rounded-lg bg-purple-950/60 border border-purple-800/40 text-purple-200">
                <span className="w-5 h-5 rounded-md bg-purple-600 flex items-center justify-center shrink-0 text-white font-black">🚜</span>
                <span>Техніка</span>
              </div>

              <div className="flex items-center gap-2 p-1.5 rounded-lg bg-blue-950/60 border border-blue-800/40 text-blue-200">
                <span className="w-5 h-5 rounded-md bg-blue-600 flex items-center justify-center shrink-0 text-white font-black">🚚</span>
                <span>Доставка</span>
              </div>

              <div className="flex items-center gap-2 p-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800/40 text-emerald-200">
                <span className="w-5 h-5 rounded-md bg-emerald-600 flex items-center justify-center shrink-0 text-white font-black">🌿</span>
                <span>Сад / Город</span>
              </div>

              <div className="flex items-center gap-2 p-1.5 rounded-lg bg-fuchsia-950/60 border border-fuchsia-800/40 text-fuchsia-200">
                <span className="w-5 h-5 rounded-md bg-fuchsia-600 flex items-center justify-center shrink-0 text-white font-black">🤝</span>
                <span>Допомога</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* TOP RIGHT CONTROLS GROUP (GPS, Layer Switcher, Recenter) */}
      <div className={`absolute top-3 ${selectedListing ? 'right-3 sm:right-[400px] md:right-[420px]' : 'right-3'} z-20 flex flex-col items-end gap-2 transition-all duration-300`}>
        {/* GPS Locate Me Button */}
        <button
          onClick={handleGPSLocate}
          disabled={isLocating}
          className={`p-2.5 rounded-xl shadow-lg border font-bold text-xs flex items-center gap-1.5 transition-all backdrop-blur-md active:scale-95 ${
            isLocating
              ? 'bg-cyan-600 text-white border-cyan-400 animate-pulse'
              : 'bg-slate-950/85 hover:bg-slate-900 text-cyan-300 border-cyan-800/60'
          }`}
          title="Моя точна геолокація (GPS)"
        >
          <Crosshair className={`w-4 h-4 ${isLocating ? 'animate-spin' : 'text-cyan-400'}`} />
          <span className="hidden sm:inline">GPS Точка</span>
        </button>

        {/* Layer Style Switcher Button */}
        <div className="relative">
          <button
            onClick={() => setShowStyleMenu(!showStyleMenu)}
            className="p-2.5 rounded-xl bg-slate-950/85 hover:bg-slate-900 text-purple-200 border border-purple-800/50 shadow-lg font-bold text-xs flex items-center gap-1.5 transition-all backdrop-blur-md"
            title="Змінити шар карти"
          >
            <Layers className="w-4 h-4 text-purple-400" />
            <span className="hidden sm:inline">Шар карти</span>
          </button>

          {/* Style selector popover */}
          {showStyleMenu && (
            <div className="absolute right-0 top-12 bg-slate-950/95 border border-purple-800/60 rounded-2xl p-2 shadow-2xl backdrop-blur-xl space-y-1 w-48 z-40 text-xs font-extrabold">
              <button
                onClick={() => {
                  setMapStyle('light');
                  setShowStyleMenu(false);
                }}
                className={`w-full text-left p-2 rounded-xl flex items-center justify-between ${
                  mapStyle === 'light'
                    ? 'bg-purple-600 text-white'
                    : 'text-purple-200 hover:bg-purple-950/60'
                }`}
              >
                <span>☀️ Світла карта</span>
                {mapStyle === 'light' && '✓'}
              </button>

              <button
                onClick={() => {
                  setMapStyle('streets');
                  setShowStyleMenu(false);
                }}
                className={`w-full text-left p-2 rounded-xl flex items-center justify-between ${
                  mapStyle === 'streets'
                    ? 'bg-purple-600 text-white'
                    : 'text-purple-200 hover:bg-purple-950/60'
                }`}
              >
                <span>🗺️ Вулиці / Схема</span>
                {mapStyle === 'streets' && '✓'}
              </button>

              <button
                onClick={() => {
                  setMapStyle('satellite');
                  setShowStyleMenu(false);
                }}
                className={`w-full text-left p-2 rounded-xl flex items-center justify-between ${
                  mapStyle === 'satellite'
                    ? 'bg-purple-600 text-white'
                    : 'text-purple-200 hover:bg-purple-950/60'
                }`}
              >
                <span>🛰️ Супутник</span>
                {mapStyle === 'satellite' && '✓'}
              </button>

              <button
                onClick={() => {
                  setMapStyle('dark');
                  setShowStyleMenu(false);
                }}
                className={`w-full text-left p-2 rounded-xl flex items-center justify-between ${
                  mapStyle === 'dark'
                    ? 'bg-purple-600 text-white'
                    : 'text-purple-200 hover:bg-purple-950/60'
                }`}
              >
                <span>🌌 Космічна ніч</span>
                {mapStyle === 'dark' && '✓'}
              </button>
            </div>
          )}
        </div>

        {/* Recenter Button */}
        <button
          onClick={handleRecenter}
          className="p-2.5 rounded-xl bg-slate-950/85 hover:bg-slate-900 text-purple-200 border border-purple-800/50 shadow-lg font-bold text-xs flex items-center gap-1.5 transition-all backdrop-blur-md active:scale-95"
          title="Повернутися до громади"
        >
          <Compass className="w-4 h-4 text-purple-400" />
          <span className="hidden sm:inline">Центр</span>
        </button>
      </div>

      {/* TOP LEFT LEGEND */}
      {!activeNavigationListing && (
        <div className="absolute top-3 left-3 z-20 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md border border-purple-800/50 text-[11px] font-bold text-purple-200 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Рівненська область • Світла онлайн-карта</span>
        </div>
      )}

      {/* SELECTED PROPOSAL RIGHT-SIDE PANEL OVERLAY */}
      {selectedListing && (
        <div className="absolute top-3 right-3 bottom-3 z-30 w-[calc(100%-24px)] sm:w-[380px] md:w-[400px] bg-slate-950/95 border-2 border-purple-600/90 text-slate-100 rounded-3xl p-4 shadow-2xl backdrop-blur-2xl animate-slide-in-right flex flex-col justify-between overflow-y-auto space-y-3">
          {/* Panel Header */}
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-purple-900/50 pb-2.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="bg-purple-950 text-purple-200 text-xs font-black px-2.5 py-1 rounded-full border border-purple-800/60 flex items-center gap-1">
                  <span>{CATEGORIES[selectedListing.category]?.pinSymbol || '📌'}</span>
                  <span>{CATEGORIES[selectedListing.category]?.label || 'Пропозиція'}</span>
                </span>

                {selectedListing.isUrgent && (
                  <span className="bg-rose-600 text-white text-xs font-black px-2.5 py-0.5 rounded-full animate-pulse">
                    🚨 Терміново
                  </span>
                )}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectListing(null);
                }}
                className="p-1.5 rounded-full bg-slate-900 hover:bg-rose-950 text-purple-300 hover:text-rose-300 border border-purple-800/40 transition-colors flex items-center justify-center shrink-0"
                title="Закрити бокове вікно (X)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Title & Pay */}
            <div className="space-y-1 pt-1">
              <h4 className="font-extrabold text-base text-slate-100 leading-snug">
                {selectedListing.title}
              </h4>
              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="text-xs text-purple-300/90 font-bold flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  <span>📍 {formatDistance(selectedListing.distanceMeters)} від вас</span>
                </span>
                <span className="text-xs font-black text-violet-200 bg-purple-950/90 px-3 py-1 rounded-xl border border-purple-800/60">
                  {selectedListing.pay}
                </span>
              </div>
            </div>
          </div>

          {/* Optional Photo */}
          {selectedListing.photoUrl && (
            <div className="rounded-2xl overflow-hidden border border-purple-900/40 h-36 bg-slate-900 shrink-0 my-1">
              <img
                src={selectedListing.photoUrl}
                alt={selectedListing.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Location & Details Info */}
          <div className="space-y-2 text-xs bg-slate-900/80 p-3 rounded-2xl border border-purple-900/40">
            <div className="text-purple-200/90 font-medium">
              <span className="text-purple-400 font-bold">Адреса: </span>
              <span>{selectedListing.locationName}</span>
            </div>
            <div className="flex justify-between text-purple-300/80">
              <span><b>Коли:</b> {selectedListing.when}</span>
              <span><b>Тривалість:</b> {selectedListing.duration}</span>
            </div>
            <p className="text-slate-300 text-xs line-clamp-3 pt-1 border-t border-purple-900/30 font-normal">
              {selectedListing.description}
            </p>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-1 gap-2 pt-2 border-t border-purple-900/40">
            <div className="grid grid-cols-2 gap-2">
              {onCallListing && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCallListing(selectedListing);
                  }}
                  className="py-2.5 px-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-1.5 transition-all active:scale-95 border border-purple-400/30"
                >
                  <Phone className="w-4 h-4" />
                  <span>Дзвінок</span>
                </button>
              )}

              {onRouteListing && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRouteListing(selectedListing);
                  }}
                  className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-purple-200 font-extrabold text-xs rounded-xl border border-purple-800/50 flex items-center justify-center gap-1.5 transition-all active:scale-95"
                >
                  <Navigation className="w-4 h-4 text-purple-400" />
                  <span>Маршрут</span>
                </button>
              )}
            </div>

            {onDetailListing && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDetailListing(selectedListing);
                }}
                className="w-full py-2 px-3 bg-purple-950/80 hover:bg-purple-900 text-purple-200 font-extrabold text-xs rounded-xl border border-purple-800/60 flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <span>Повна інформація та контакти</span>
                <ExternalLink className="w-3.5 h-3.5 text-purple-400" />
              </button>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
