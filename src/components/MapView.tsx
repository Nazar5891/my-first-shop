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
  ChevronRight,
  MapPin,
  Phone,
  ExternalLink,
  Info
} from 'lucide-react';

import { Listing, CATEGORIES } from '../types';
import { COMMUNITY_CENTER } from '../data/mockListings';
import { formatDistance } from '../utils/distance';
import { DistanceRangeSlider } from './DistanceRangeSlider';
import { renderMarkerHtml } from '../utils/categoryMarkerIcons';

export type MapTileStyle =
  | 'light'
  | 'streets'
  | 'satellite'
  | 'dark';

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

  userCoordinates,
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
  onChangeMaxRadiusKm
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const routeGroupRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);
  const pinSelectionMarkerRef = useRef<L.Marker | null>(null);

  const onSelectListingRef = useRef(onSelectListing);
  const onPinSelectedRef = useRef(onPinSelected);

  const [mapStyle, setMapStyle] =
    useState<MapTileStyle>('light');

  const [showStyleMenu, setShowStyleMenu] =
    useState(false);

  const [showRadiusMenu, setShowRadiusMenu] =
    useState(false);

  const [showLegend, setShowLegend] =
    useState(false);

  const [isLocating, setIsLocating] =
    useState(false);

  const [isNavHudMinimized, setIsNavHudMinimized] =
    useState(false);

  const [currentStepIndex, setCurrentStepIndex] =
    useState(0);

  /*
   * -------------------------------------------------------
   * CALLBACK REFS
   * -------------------------------------------------------
   */

  useEffect(() => {
    onSelectListingRef.current = onSelectListing;
    onPinSelectedRef.current = onPinSelected;
  }, [onSelectListing, onPinSelected]);

  /*
   * -------------------------------------------------------
   * MAP TILE SOURCES
   * -------------------------------------------------------
   */

  const TILE_URLS: Record<
    MapTileStyle,
    { url: string; attr: string }
  > = {
    light: {
      url:
        'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      attr:
        '&copy; OpenStreetMap &copy; CARTO'
    },

    streets: {
      url:
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      attr:
        '&copy; OpenStreetMap &copy; CARTO'
    },

    satellite: {
      url:
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attr:
        '&copy; Esri, Maxar, Earthstar Geographics'
    },

    dark: {
      url:
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      attr:
        '&copy; OpenStreetMap &copy; CARTO'
    }
  };

  /*
   * -------------------------------------------------------
   * INITIALIZE MAP
   * -------------------------------------------------------
   */

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(
      mapContainerRef.current,
      {
        center: COMMUNITY_CENTER,
        zoom: 14,
        zoomControl: false
      }
    );

    const tileConfig = TILE_URLS[mapStyle];

    tileLayerRef.current =
      L.tileLayer(
        tileConfig.url,
        {
          maxZoom: 19,
          attribution: tileConfig.attr
        }
      ).addTo(map);

    L.control
      .zoom({
        position: 'bottomright'
      })
      .addTo(map);

    markersGroupRef.current =
      L.layerGroup().addTo(map);

    routeGroupRef.current =
      L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    map.on(
      'click',
      (event: L.LeafletMouseEvent) => {
        if (!event.latlng) {
          onSelectListingRef.current(null);
          return;
        }

        onSelectListingRef.current(null);
      }
    );

    setTimeout(() => {
      map.invalidateSize();
    }, 300);

    return () => {
      map.remove();

      mapInstanceRef.current = null;
      tileLayerRef.current = null;
      markersGroupRef.current = null;
      routeGroupRef.current = null;
      userMarkerRef.current = null;
      radiusCircleRef.current = null;
    };
  }, []);

  /*
   * -------------------------------------------------------
   * CHANGE MAP STYLE
   * -------------------------------------------------------
   */

  useEffect(() => {
    const map = mapInstanceRef.current;

    if (!map) return;

    if (tileLayerRef.current) {
      tileLayerRef.current.remove();
    }

    const tileConfig = TILE_URLS[mapStyle];

    tileLayerRef.current =
      L.tileLayer(
        tileConfig.url,
        {
          maxZoom: 19,
          attribution: tileConfig.attr
        }
      ).addTo(map);
  }, [mapStyle]);

  /*
   * -------------------------------------------------------
   * AUTOMATIC GPS REQUEST
   * -------------------------------------------------------
   *
   * This runs once when the map opens.
   *
   * If permission is granted:
   *   → get real position
   *   → save coordinates
   *   → move map to user
   *
   * If denied:
   *   → stay in Rokytne
   */

  useEffect(() => {
    if (!setUserCoordinates) return;

    if (!navigator.geolocation) {
      console.log(
        'Геолокація не підтримується браузером'
      );
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      position => {
        const coords: [number, number] = [
          position.coords.latitude,
          position.coords.longitude
        ];

        console.log(
          'GPS координати:',
          coords
        );

        setUserCoordinates(coords);

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo(
            coords,
            16,
            {
              animate: true,
              duration: 1.5
            }
          );
        }

        setIsLocating(false);
      },

      error => {
        console.log(
          'GPS не отримано:',
          error.message
        );

        setIsLocating(false);

        /*
         * DO NOT replace the user position
         * with COMMUNITY_CENTER.
         *
         * The map simply remains on Rokytne.
         */

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo(
            COMMUNITY_CENTER,
            14,
            {
              animate: true
            }
          );
        }
      },

      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  }, [setUserCoordinates]);

  /*
   * -------------------------------------------------------
   * GPS MARKER
   * -------------------------------------------------------
   */

  useEffect(() => {
    const map = mapInstanceRef.current;

    if (!map) return;

    /*
     * Remove previous marker.
     */

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    /*
     * IMPORTANT:
     *
     * If there is NO real GPS coordinate,
     * we DON'T show a fake GPS point.
     */

    if (
      !userCoordinates ||
      !Array.isArray(userCoordinates) ||
      userCoordinates.length !== 2
    ) {
      return;
    }

    const userIcon =
      L.divIcon({
        className:
          'user-location-marker',
        html: `
          <div
            style="
              position:relative;
              width:50px;
              height:50px;
              transform:translate(-50%,-50%);
              pointer-events:none;
            "
          >

            <div
              style="
                position:absolute;
                left:50%;
                top:50%;
                width:46px;
                height:46px;
                transform:translate(-50%,-50%);
                border-radius:50%;
                background:rgba(6,182,212,0.20);
                animation:gpsPulse 2s infinite;
              "
            ></div>

            <div
              style="
                position:absolute;
                left:50%;
                top:50%;
                width:20px;
                height:20px;
                transform:translate(-50%,-50%);
                border-radius:50%;
                background:#06b6d4;
                border:3px solid white;
                box-shadow:0 0 12px rgba(6,182,212,.9);
              "
            ></div>

            <div
              style="
                position:absolute;
                left:50%;
                top:50%;
                width:6px;
                height:6px;
                transform:translate(-50%,-50%);
                border-radius:50%;
                background:#0f172a;
              "
            ></div>

          </div>

          <style>
            @keyframes gpsPulse {
              0% {
                transform:translate(-50%,-50%) scale(.7);
                opacity:.9;
              }
              70% {
                transform:translate(-50%,-50%) scale(1.4);
                opacity:0;
              }
              100% {
                opacity:0;
              }
            }
          </style>
        `,
        iconSize: [50, 50],
        iconAnchor: [25, 25]
      });

    userMarkerRef.current =
      L.marker(
        userCoordinates,
        {
          icon: userIcon,
          zIndexOffset: 2000,
          interactive: false,
          bubblingMouseEvents: false
        }
      ).addTo(map);

    /*
     * Radius circle
     */

    if (radiusCircleRef.current) {
      radiusCircleRef.current.remove();
      radiusCircleRef.current = null;
    }

    if (
      maxRadiusKm !== null &&
      maxRadiusKm > 0
    ) {
      radiusCircleRef.current =
        L.circle(
          userCoordinates,
          {
            radius: maxRadiusKm * 1000,
            color: '#c084fc',
            fillColor: '#a855f7',
            fillOpacity: 0.12,
            weight: 2,
            dashArray: '6, 8',
            interactive: false
          }
        ).addTo(map);
    }

  }, [userCoordinates, maxRadiusKm]);

  /*
   * -------------------------------------------------------
   * MANUAL GPS BUTTON
   * -------------------------------------------------------
   */

  const handleGPSLocate = () => {
    if (!navigator.geolocation) {
      alert(
        'Геолокація не підтримується вашим браузером.'
      );
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      position => {
        const coords: [number, number] = [
          position.coords.latitude,
          position.coords.longitude
        ];

        setUserCoordinates?.(coords);

        mapInstanceRef.current?.flyTo(
          coords,
          16,
          {
            animate: true,
            duration: 1.5
          }
        );

        setIsLocating(false);
      },

      error => {
        console.log(
          'Помилка GPS:',
          error.message
        );

        setIsLocating(false);

        alert(
          'Не вдалося отримати ваше місцезнаходження. Перевірте дозвіл на геолокацію для сайту.'
        );
      },

      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

  /*
   * -------------------------------------------------------
   * PIN SELECT MODE
   * -------------------------------------------------------
   */

  useEffect(() => {
    const map = mapInstanceRef.current;

    if (!map) return;

    if (
      isPinSelectMode &&
      selectedPinLocation
    ) {
      const icon =
        L.divIcon({
          className:
            'custom-pin-select-marker',
          html: `
            <div
              style="
                transform:translate(-50%,-100%);
                display:flex;
                flex-direction:column;
                align-items:center;
              "
            >
              <div
                style="
                  background:#9333ea;
                  color:white;
                  font-weight:800;
                  font-size:12px;
                  padding:6px 10px;
                  border-radius:999px;
                  border:2px solid #c084fc;
                  box-shadow:0 4px 15px rgba(0,0,0,.4);
                  white-space:nowrap;
                "
              >
                📍 Обрана точка
              </div>

              <div
                style="
                  width:12px;
                  height:12px;
                  background:#9333ea;
                  transform:rotate(45deg);
                  margin-top:-5px;
                "
              ></div>
            </div>
          `,
          iconSize: [0, 0],
          iconAnchor: [0, 0]
        });

      if (pinSelectionMarkerRef.current) {
        pinSelectionMarkerRef.current.setLatLng(
          selectedPinLocation
        );
      } else {
        pinSelectionMarkerRef.current =
          L.marker(
            selectedPinLocation,
            {
              icon,
              interactive: false
            }
          ).addTo(map);
      }

    } else {

      if (pinSelectionMarkerRef.current) {
        pinSelectionMarkerRef.current.remove();
        pinSelectionMarkerRef.current = null;
      }

    }

  }, [
    isPinSelectMode,
    selectedPinLocation
  ]);

  /*
   * -------------------------------------------------------
   * LISTING MARKERS
   * -------------------------------------------------------
   */

  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = markersGroupRef.current;

    if (!map || !layer) return;

    layer.clearLayers();

    listings.forEach(listing => {

      if (
        !listing?.coordinates ||
        !Array.isArray(listing.coordinates) ||
        listing.coordinates.length < 2
      ) {
        return;
      }

      const isSelected =
        selectedListing?.id === listing.id;

      const isNavTarget =
        activeNavigationListing?.id === listing.id;

      const icon =
        L.divIcon({
          className:
            'custom-listing-marker',
          html:
            renderMarkerHtml(
              listing,
              isSelected,
              isNavTarget
            ),
          iconSize: [0, 0]
        });

      const marker =
        L.marker(
          listing.coordinates,
          {
            icon
          }
        ).addTo(layer);

      marker.on(
        'click',
        event => {

          if (event.originalEvent) {
            L.DomEvent.stopPropagation(
              event.originalEvent
            );
          }

          onSelectListingRef.current(
            listing
          );

          map.panTo(
            listing.coordinates,
            {
              animate: true
            }
          );
        }
      );
    });

  }, [
    listings,
    selectedListing,
    activeNavigationListing
  ]);

  /*
   * -------------------------------------------------------
   * ROUTE DISPLAY
   * -------------------------------------------------------
   *
   * IMPORTANT:
   * We do NOT pretend that a straight line
   * is a road route.
   *
   * Actual road routing should be done through
   * OSRM / another routing service.
   */

  useEffect(() => {

    const map = mapInstanceRef.current;
    const routeGroup = routeGroupRef.current;

    if (!map || !routeGroup) return;

    routeGroup.clearLayers();

    if (!activeNavigationListing) {
      return;
    }

    if (
      !userCoordinates ||
      !activeNavigationListing.coordinates
    ) {
      return;
    }

    /*
     * Only show a subtle connection line for now.
     * It is NOT presented as an actual road route.
     */

    const start: [number, number] =
      userCoordinates;

    const end: [number, number] =
      activeNavigationListing.coordinates;

    L.polyline(
      [start, end],
      {
        color: '#06b6d4',
        weight: 4,
        opacity: 0.45,
        dashArray: '8, 10',
        interactive: false
      }
    ).addTo(routeGroup);

    map.fitBounds(
      [start, end],
      {
        padding: [80, 80],
        animate: true
      }
    );

  }, [
    activeNavigationListing,
    userCoordinates
  ]);

  /*
   * -------------------------------------------------------
   * RECENTER
   * -------------------------------------------------------
   */

  const handleRecenter = () => {

    if (
      userCoordinates &&
      Array.isArray(userCoordinates)
    ) {

      mapInstanceRef.current?.flyTo(
        userCoordinates,
        16,
        {
          animate: true
        }
      );

    } else {

      mapInstanceRef.current?.flyTo(
        COMMUNITY_CENTER,
        14,
        {
          animate: true
        }
      );

    }
  };

  /*
   * -------------------------------------------------------
   * NAVIGATION STEPS
   * -------------------------------------------------------
   */

  const navSteps =
    activeNavigationListing
      ? [
          'Старт від вашої позиції',
          `Рухайтеся в напрямку ${activeNavigationListing.locationName}`,
          `Прибуття до «${activeNavigationListing.title}»`
        ]
      : [];

  /*
   * -------------------------------------------------------
   * RENDER
   * -------------------------------------------------------
   */

  return (
    <div className="relative w-full h-full min-h-[420px] flex-1">

      <div
        ref={mapContainerRef}
        className="w-full h-full rounded-2xl overflow-hidden shadow-inner border border-purple-900/30"
      />

      {isLocating && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 bg-slate-950/95 text-cyan-300 border border-cyan-500 rounded-full px-4 py-2 text-xs font-bold shadow-xl">
          📍 Визначаємо ваше місцезнаходження…
        </div>
      )}

      {isPinSelectMode && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 bg-purple-900/95 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg border border-purple-400/50">
          📍 Натисніть на карту, щоб вибрати точку
        </div>
      )}

      <div className="absolute top-3 left-3 z-30 flex flex-col gap-2">

        <button
          onClick={handleGPSLocate}
          disabled={isLocating}
          className="p-2.5 rounded-xl shadow-lg border font-bold text-xs flex items-center gap-1.5 bg-slate-950/90 text-cyan-300 border-cyan-800/60"
        >
          <Crosshair
            className={
              isLocating
                ? 'w-4 h-4 animate-spin'
                : 'w-4 h-4'
            }
          />

          <span className="hidden sm:inline">
            {isLocating
              ? 'Пошук GPS…'
              : 'Моє місце'}
          </span>
        </button>

        <button
          onClick={() => {
            setShowRadiusMenu(
              !showRadiusMenu
            );
            setShowLegend(false);
          }}
          className="p-2.5 rounded-xl shadow-lg border font-bold text-xs flex items-center gap-1.5 bg-slate-950/90 text-purple-200 border-purple-800/60"
        >
          <Compass className="w-4 h-4" />

          <span className="hidden sm:inline">
            Радіус:{' '}
            {maxRadiusKm !== null
              ? `${maxRadiusKm} км`
              : 'Всі'}
          </span>
        </button>

        {showRadiusMenu && (
          <div className="w-72 sm:w-80 shadow-2xl">
            <DistanceRangeSlider
              maxRadiusKm={maxRadiusKm}
              onChangeMaxRadiusKm={
                onChangeMaxRadiusKm
              }
              filteredCount={
                listings.length
              }
              compact
            />
          </div>
        )}

      </div>

      <div className="absolute top-3 right-3 z-30 flex flex-col gap-2">

        <div className="relative">

          <button
            onClick={() =>
              setShowStyleMenu(
                !showStyleMenu
              )
            }
            className="p-2.5 rounded-xl bg-slate-950/90 text-purple-200 border border-purple-800/50 shadow-lg"
          >
            <Layers className="w-4 h-4" />
          </button>

          {showStyleMenu && (
            <div className="absolute right-0 top-12 bg-slate-950/95 border border-purple-800/60 rounded-2xl p-2 shadow-2xl w-48 z-40 text-xs font-extrabold">

              {(
                [
                  'light',
                  'streets',
                  'satellite',
                  'dark'
                ] as MapTileStyle[]
              ).map(style => (

                <button
                  key={style}
                  onClick={() => {
                    setMapStyle(style);
                    setShowStyleMenu(false);
                  }}
                  className={`w-full text-left p-2 rounded-xl ${
                    mapStyle === style
                      ? 'bg-purple-600 text-white'
                      : 'text-purple-200'
                  }`}
                >
                  {style === 'light'
                    ? '☀️ Світла карта'
                    : style === 'streets'
                    ? '🗺️ Вулиці'
                    : style === 'satellite'
                    ? '🛰️ Супутник'
                    : '🌌 Нічна карта'}

                  {mapStyle === style &&
                    ' ✓'}
                </button>

              ))}

            </div>
          )}

        </div>

        <button
          onClick={handleRecenter}
          className="p-2.5 rounded-xl bg-slate-950/90 text-purple-200 border border-purple-800/50 shadow-lg"
        >
          <Compass className="w-4 h-4" />
        </button>

      </div>

      {!activeNavigationListing && (
        <div className="absolute bottom-3 left-3 z-20 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md border border-purple-800/50 text-[11px] font-bold text-purple-200">
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block mr-2" />
          Рокитне • онлайн-карта
        </div>
      )}

      {activeNavigationListing &&
        !isNavHudMinimized && (

        <div className="absolute top-3 left-3 right-16 z-40 max-w-lg bg-slate-950/95 border-2 border-cyan-500 rounded-2xl p-3 shadow-2xl text-slate-100">

          <div className="flex items-center justify-between gap-2">

            <div className="flex items-center gap-2">

              <Navigation className="w-5 h-5 text-cyan-400" />

              <div>

                <div className="text-[9px] font-black text-cyan-400">
                  АКТИВНИЙ МАРШРУТ
                </div>

                <div className="font-extrabold text-xs">
                  {activeNavigationListing.title}
                </div>

              </div>

            </div>

            <button
              onClick={onStopNavigation}
              className="p-1 rounded-lg bg-slate-900 text-rose-300"
            >
              <X className="w-4 h-4" />
            </button>

          </div>

          <div className="grid grid-cols-3 gap-2 mt-3">

            <div className="bg-slate-900 p-2 rounded-xl text-center">
              <span className="text-[9px] text-purple-300 block">
                Відстань
              </span>

              <span className="text-cyan-300 font-black text-xs">
                {formatDistance(
                  activeNavigationListing.distanceMeters
                )}
              </span>
            </div>

            <div className="bg-slate-900 p-2 rounded-xl text-center">
              <Car className="w-4 h-4 mx-auto text-purple-400" />

              <span className="text-[9px] text-purple-300 block">
                Авто
              </span>

              <span className="text-white font-black text-xs">
                ~
                {Math.max(
                  1,
                  Math.round(
                    (
                      activeNavigationListing.distanceMeters /
                      1000 /
                      40
                    ) * 60
                  )
                )}{' '}
                хв
              </span>
            </div>

            <div className="bg-slate-900 p-2 rounded-xl text-center">
              <Footprints className="w-4 h-4 mx-auto text-purple-400" />

              <span className="text-[9px] text-purple-300 block">
                Пішки
              </span>

              <span className="text-white font-black text-xs">
                ~
                {Math.round(
                  (
                    activeNavigationListing.distanceMeters /
                    1000 /
                    4
                  ) * 60
                )}{' '}
                хв
              </span>
            </div>

          </div>

          <div className="mt-2 bg-cyan-950/60 p-2 rounded-xl text-xs text-cyan-200 flex items-center justify-between">

            <span>
              <ChevronRight className="w-4 h-4 inline" />
              {navSteps[currentStepIndex]}
            </span>

            <button
              onClick={() =>
                setCurrentStepIndex(
                  index =>
                    (index + 1) %
                    navSteps.length
                )
              }
              className="text-[9px] font-extrabold bg-cyan-600 text-slate-950 px-2 py-1 rounded-md"
            >
              Далі →
            </button>

          </div>

        </div>
      )}

      {selectedListing && (

        <div className="absolute top-3 right-3 bottom-3 z-50 w-[calc(100%-24px)] sm:w-[380px] bg-slate-950/95 border-2 border-purple-600 text-slate-100 rounded-3xl p-4 shadow-2xl overflow-y-auto">

          <div className="flex items-center justify-between border-b border-purple-900/50 pb-3">

            <span className="bg-purple-950 text-purple-200 text-xs font-black px-2.5 py-1 rounded-full border border-purple-800/60">
              {CATEGORIES[
                selectedListing.category
              ]?.pinSymbol || '📌'}{' '}
              {CATEGORIES[
                selectedListing.category
              ]?.label || 'Пропозиція'}
            </span>

            <button
              onClick={() =>
                onSelectListing(null)
              }
              className="p-1.5 rounded-full bg-slate-900 text-purple-300"
            >
              <X className="w-4 h-4" />
            </button>

          </div>

          <h4 className="font-extrabold text-base mt-3">
            {selectedListing.title}
          </h4>

          <div className="text-xs text-purple-300 mt-2">
            📍{' '}
            {formatDistance(
              selectedListing.distanceMeters
            )}{' '}
            від вас
          </div>

          {selectedListing.photoUrl && (
            <div className="rounded-2xl overflow-hidden mt-3 h-36">
              <img
                src={selectedListing.photoUrl}
                alt={selectedListing.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="bg-slate-900 p-3 rounded-2xl mt-3 text-xs">

            <div>
              <b className="text-purple-400">
                Адреса:
              </b>{' '}
              {selectedListing.locationName}
            </div>

            <div className="mt-2">
              {selectedListing.description}
            </div>

          </div>

          <div className="grid grid-cols-2 gap-2 mt-3">

            {onCallListing && (
              <button
                onClick={() =>
                  onCallListing(
                    selectedListing
                  )
                }
                className="py-2.5 bg-purple-600 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1"
              >
                <Phone className="w-4 h-4" />
                Дзвінок
              </button>
            )}

            {onRouteListing && (
              <button
                onClick={() =>
                  onRouteListing(
                    selectedListing
                  )
                }
                className="py-2.5 bg-slate-900 text-purple-200 font-bold text-xs rounded-xl border border-purple-800 flex items-center justify-center gap-1"
              >
                <Navigation className="w-4 h-4" />
                Маршрут
              </button>
            )}

          </div>

          {onDetailListing && (
            <button
              onClick={() =>
                onDetailListing(
                  selectedListing
                )
              }
              className="w-full mt-2 py-2 bg-purple-950 text-purple-200 font-bold text-xs rounded-xl border border-purple-800 flex items-center justify-center gap-1"
            >
              Повна інформація
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}

        </div>
      )}

    </div>
  );
};
