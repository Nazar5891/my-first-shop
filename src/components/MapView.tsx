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
  onChangeMaxRadiusKm
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const routeGroupRef = useRef<L.LayerGroup | null>(null);
  const pinSelectionMarkerRef = useRef<L.Marker | null>(null);

  const routeRequestRef = useRef(0);

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

  const isPinSelectModeRef =
    useRef(isPinSelectMode);

  const onPinSelectedRef =
    useRef(onPinSelected);

  const onSelectListingRef =
    useRef(onSelectListing);

  useEffect(() => {
    isPinSelectModeRef.current = isPinSelectMode;
    onPinSelectedRef.current = onPinSelected;
    onSelectListingRef.current = onSelectListing;
  }, [
    isPinSelectMode,
    onPinSelected,
    onSelectListing
  ]);

  /*
   * КАРТИ
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
   * СТВОРЕННЯ КАРТИ
   *
   * ВАЖЛИВО:
   * Тут НІЯКОГО автоматичного navigator.geolocation.
   *
   * Геолокація запускається тільки кнопкою GPS.
   */
  useEffect(() => {
    if (
      !mapContainerRef.current ||
      mapInstanceRef.current
    ) {
      return;
    }

    const initialCenter =
      userCoordinates &&
      Array.isArray(userCoordinates) &&
      userCoordinates.length === 2
        ? userCoordinates
        : COMMUNITY_CENTER;

    const map = L.map(
      mapContainerRef.current,
      {
        center: initialCenter,
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
      (e: L.LeafletMouseEvent) => {
        if (!e?.latlng) {
          onSelectListingRef.current?.(null);
          return;
        }

        if (
          isPinSelectModeRef.current &&
          onPinSelectedRef.current
        ) {
          onPinSelectedRef.current([
            e.latlng.lat,
            e.latlng.lng
          ]);
        } else {
          onSelectListingRef.current?.(null);
        }
      }
    );

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  /*
   * ЗМІНА ШАРУ КАРТИ
   */
  useEffect(() => {
    const map = mapInstanceRef.current;

    if (
      !map ||
      !tileLayerRef.current
    ) {
      return;
    }

    tileLayerRef.current.remove();

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
   * ВИБРАНА ТОЧКА
   */
  useEffect(() => {
    const map = mapInstanceRef.current;

    if (!map) {
      return;
    }

    if (
      isPinSelectMode &&
      selectedPinLocation
    ) {
      if (
        pinSelectionMarkerRef.current
      ) {
        pinSelectionMarkerRef.current.setLatLng(
          selectedPinLocation
        );
      } else {
        const icon = L.divIcon({
          className:
            'custom-pin-select-marker',

          html: `
            <div class="relative -translate-x-1/2 -translate-y-full flex flex-col items-center">
              <div class="bg-purple-600 text-white font-extrabold text-xs px-2.5 py-1 rounded-full shadow-lg border-2 border-purple-400 flex items-center gap-1 animate-bounce">
                📍 Обрана точка
              </div>

              <div class="w-3 h-3 bg-purple-600 rotate-45 -mt-1.5 border-r border-b border-purple-400"></div>
            </div>
          `,

          iconSize: [0, 0],
          iconAnchor: [0, 0]
        });

        pinSelectionMarkerRef.current =
          L.marker(
            selectedPinLocation,
            {
              icon,
              interactive: false
            }
          ).addTo(map);
      }

    } else if (
      pinSelectionMarkerRef.current
    ) {
      pinSelectionMarkerRef.current.remove();
      pinSelectionMarkerRef.current = null;
    }

  }, [
    isPinSelectMode,
    selectedPinLocation
  ]);

  /*
   * МАРКЕРИ + ПОЗИЦІЯ КОРИСТУВАЧА
   */
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup =
      markersGroupRef.current;

    if (!map || !layerGroup) {
      return;
    }

    layerGroup.clearLayers();

    /*
     * Поточна позиція користувача.
     *
     * Вона НЕ клікабельна.
     */
    if (userCoordinates) {
      const userIcon = L.divIcon({
        className:
          'user-location-marker',

        html: `
          <div class="relative -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">

            <div class="w-10 h-10 rounded-full bg-cyan-500/25 animate-ping absolute pointer-events-none"></div>

            <div class="w-5 h-5 rounded-full bg-cyan-400 border-2 border-white shadow-lg flex items-center justify-center shadow-cyan-500/80 pointer-events-none">

              <div class="w-2 h-2 rounded-full bg-slate-950"></div>

            </div>

          </div>
        `,

        iconSize: [0, 0]
      });

      L.marker(
        userCoordinates,
        {
          icon: userIcon,
          zIndexOffset: 1000,
          interactive: false,
          bubblingMouseEvents: false,
          keyboard: false
        }
      ).addTo(layerGroup);

      /*
       * Радіус пошуку
       */
      if (
        maxRadiusKm !== null &&
        Array.isArray(userCoordinates) &&
        userCoordinates.length === 2
      ) {
        L.circle(
          userCoordinates,
          {
            radius:
              maxRadiusKm * 1000,

            color: '#c084fc',
            fillColor: '#a855f7',
            fillOpacity: 0.12,
            weight: 2,
            dashArray: '6, 8',
            interactive: false
          }
        ).addTo(layerGroup);
      }
    }

    /*
     * МАРКЕРИ ОГОЛОШЕНЬ
     */
    listings.forEach(
      (listing) => {
        if (
          !listing?.coordinates ||
          !Array.isArray(
            listing.coordinates
          ) ||
          listing.coordinates.length < 2 ||
          typeof listing.coordinates[0] !==
            'number' ||
          typeof listing.coordinates[1] !==
            'number'
        ) {
          return;
        }

        const isSelected =
          selectedListing?.id ===
          listing.id;

        const isNavTarget =
          activeNavigationListing?.id ===
          listing.id;

        const icon = L.divIcon({
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
          );

        marker.addTo(layerGroup);

        marker.on(
          'click',
          (
            e: L.LeafletMouseEvent
          ) => {
            if (e?.originalEvent) {
              L.DomEvent.stopPropagation(
                e
              );
            }

            onSelectListingRef.current?.(
              listing
            );

            mapInstanceRef.current?.panTo(
              listing.coordinates,
              {
                animate: true
              }
            );
          }
        );
      }
    );

  }, [
    listings,
    selectedListing,
    userCoordinates,
    activeNavigationListing,
    maxRadiusKm
  ]);

  /*
   * GPS
   *
   * СИСТЕМНИЙ ЗАПИТ З'ЯВЛЯЄТЬСЯ
   * ТІЛЬКИ ПІСЛЯ НАТИСКАННЯ КНОПКИ.
   */
  const handleGPSLocate = () => {
    if (!navigator.geolocation) {
      alert(
        'Геолокація не підтримується вашим браузером.'
      );
      return;
    }

    if (!setUserCoordinates) {
      alert(
        'Функція геолокації недоступна.'
      );
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: [
          number,
          number
        ] = [
          position.coords.latitude,
          position.coords.longitude
        ];

        setUserCoordinates(coords);

        mapInstanceRef.current?.flyTo(
          coords,
          16,
          {
            animate: true,
            duration: 1.2
          }
        );

        setIsLocating(false);
      },

      (error) => {
        console.error(
          'Geolocation error:',
          error
        );

        setIsLocating(false);

        if (
          error.code ===
          error.PERMISSION_DENIED
        ) {
          alert(
            'Ви заборонили доступ до геолокації. Дозвольте доступ у налаштуваннях браузера.'
          );
        } else if (
          error.code ===
          error.POSITION_UNAVAILABLE
        ) {
          alert(
            'Не вдалося визначити ваше місцезнаходження.'
          );
        } else if (
          error.code ===
          error.TIMEOUT
        ) {
          alert(
            'Час очікування геолокації вичерпано. Спробуйте ще раз.'
          );
        }
      },

      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

  /*
   * ЦЕНТР КАРТИ
   */
  const handleRecenter = () => {
    if (!mapInstanceRef.current) {
      return;
    }

    mapInstanceRef.current.flyTo(
      userCoordinates,
      15,
      {
        animate: true
      }
    );
  };

  /*
   * СПРАВЖНІЙ МАРШРУТ ПО ДОРОГАХ
   *
   * Використовується OSRM.
   *
   * ВАЖЛИВО:
   * Leaflet більше НЕ малює
   * просту пряму лінію.
   */
  useEffect(() => {
    const map = mapInstanceRef.current;
    const routeGroup =
      routeGroupRef.current;

    if (!map || !routeGroup) {
      return;
    }

    routeGroup.clearLayers();

    const requestId =
      ++routeRequestRef.current;

    /*
     * Навігація до об'єкта
     */
    if (activeNavigationListing) {
      const start: [
        number,
        number
      ] = userCoordinates;

      const end: [
        number,
        number
      ] =
        activeNavigationListing.coordinates;

      const startLon = start[1];
      const startLat = start[0];

      const endLon = end[1];
      const endLat = end[0];

      const url =
        `https://router.project-osrm.org/route/v1/driving/` +
        `${startLon},${startLat};${endLon},${endLat}` +
        `?overview=full&geometries=geojson&steps=true`;

      fetch(url)
        .then((response) => {
          if (!response.ok) {
            throw new Error(
              'OSRM route error'
            );
          }

          return response.json();
        })
        .then((data) => {
          if (
            requestId !==
            routeRequestRef.current
          ) {
            return;
          }

          if (
            !data?.routes?.length
          ) {
            throw new Error(
              'Маршрут не знайдено'
            );
          }

          const route =
            data.routes[0];

          const coordinates =
            route.geometry.coordinates.map(
              (point: [
                number,
                number
              ]) => [
                point[1],
                point[0]
              ] as [
                number,
                number
              ]
            );

          /*
           * Тінь маршруту
           */
          L.polyline(
            coordinates,
            {
              color: '#0284c7',
              weight: 10,
              opacity: 0.35,
              lineCap: 'round',
              lineJoin: 'round',
              interactive: false
            }
          ).addTo(routeGroup);

          /*
           * Основний маршрут
           */
          L.polyline(
            coordinates,
            {
              color: '#06b6d4',
              weight: 6,
              opacity: 0.95,
              lineCap: 'round',
              lineJoin: 'round',
              interactive: false
            }
          ).addTo(routeGroup);

          /*
           * Початок маршруту
           */
          L.circleMarker(
            start,
            {
              radius: 7,
              color: '#ffffff',
              weight: 3,
              fillColor: '#06b6d4',
              fillOpacity: 1,
              interactive: false
            }
          ).addTo(routeGroup);

          /*
           * Кінець маршруту
           */
          const destinationIcon =
            L.divIcon({
              className:
                'destination-flag-marker',

              html: `
                <div class="relative -translate-x-1/2 -translate-y-full flex flex-col items-center">

                  <div class="bg-slate-950 text-sky-300 font-black text-[11px] px-2.5 py-1 rounded-full shadow-xl border-2 border-sky-400 flex items-center gap-1.5 whitespace-nowrap">

                    <span>
                      🏁 ${
                        activeNavigationListing.locationName ||
                        activeNavigationListing.title
                      }
                    </span>

                  </div>

                  <div class="w-2.5 h-2.5 bg-sky-400 rotate-45 -mt-1"></div>

                </div>
              `,

              iconSize: [0, 0],
              iconAnchor: [0, 0]
            });

          L.marker(
            end,
            {
              icon: destinationIcon,
              zIndexOffset: 900,
              interactive: false
            }
          ).addTo(routeGroup);

          /*
           * Показуємо весь маршрут
           */
          const bounds =
            L.latLngBounds(
              coordinates
            );

          map.fitBounds(
            bounds,
            {
              padding: [80, 80],
              animate: true
            }
          );
        })
        .catch((error) => {
          console.error(
            'Не вдалося побудувати маршрут:',
            error
          );

          if (
            requestId !==
            routeRequestRef.current
          ) {
            return;
          }

          /*
           * Якщо сервіс маршрутизації
           * недоступний — показуємо
           * пунктир як запасний варіант.
           */
          L.polyline(
            [start, end],
            {
              color: '#06b6d4',
              weight: 5,
              opacity: 0.7,
              dashArray: '10, 10',
              interactive: false
            }
          ).addTo(routeGroup);

          map.fitBounds(
            [start, end],
            {
              padding: [70, 70],
              animate: true
            }
          );
        });

      return;
    }

    /*
     * МАРШРУТ ПОЇЗДКИ / RIDESHARE
     */
    if (
      selectedListing &&
      (
        selectedListing.category ===
          'rideshare' ||
        selectedListing.destinationCoordinates
      ) &&
      selectedListing.coordinates
    ) {
      const start: [
        number,
        number
      ] =
        selectedListing.coordinates;

      const destination =
        selectedListing.destinationCoordinates;

      if (
        !destination ||
        !Array.isArray(destination) ||
        destination.length !== 2
      ) {
        return;
      }

      const startLon = start[1];
      const startLat = start[0];

      const endLon = destination[1];
      const endLat = destination[0];

      const url =
        `https://router.project-osrm.org/route/v1/driving/` +
        `${startLon},${startLat};${endLon},${endLat}` +
        `?overview=full&geometries=geojson`;

      fetch(url)
        .then((response) => {
          if (!response.ok) {
            throw new Error(
              'OSRM route error'
            );
          }

          return response.json();
        })
        .then((data) => {
          if (
            !data?.routes?.length
          ) {
            return;
          }

          const route =
            data.routes[0];

          const coordinates =
            route.geometry.coordinates.map(
              (point: [
                number,
                number
              ]) => [
                point[1],
                point[0]
              ] as [
                number,
                number
              ]
            );

          L.polyline(
            coordinates,
            {
              color: '#0284c7',
              weight: 9,
              opacity: 0.3,
              lineCap: 'round',
              lineJoin: 'round',
              interactive: false
            }
          ).addTo(routeGroup);

          L.polyline(
            coordinates,
            {
              color: '#38bdf8',
              weight: 5,
              opacity: 0.95,
              lineCap: 'round',
              lineJoin: 'round',
              interactive: false
            }
          ).addTo(routeGroup);

          const destinationIcon =
            L.divIcon({
              className:
                'destination-flag-marker',

              html: `
                <div class="relative -translate-x-1/2 -translate-y-full flex flex-col items-center">

                  <div class="bg-slate-950 text-sky-300 font-black text-[11px] px-2.5 py-1 rounded-full shadow-xl border-2 border-sky-400 flex items-center gap-1.5 whitespace-nowrap">

                    <span>
                      🏁 ${
                        selectedListing.rideRouteTo ||
                        'Пункт призначення'
                      }
                    </span>

                  </div>

                  <div class="w-2.5 h-2.5 bg-sky-400 rotate-45 -mt-1"></div>

                </div>
              `,

              iconSize: [0, 0],
              iconAnchor: [0, 0]
            });

          L.marker(
            destination,
            {
              icon: destinationIcon,
              zIndexOffset: 900,
              interactive: false
            }
          ).addTo(routeGroup);

          map.fitBounds(
            L.latLngBounds(
              coordinates
            ),
            {
              padding: [80, 80],
              animate: true
            }
          );
        })
        .catch((error) => {
          console.error(
            'Route error:',
            error
          );
        });
    }

  }, [
    activeNavigationListing,
    selectedListing,
    userCoordinates
  ]);

  /*
   * КРОКИ НАВІГАЦІЇ
   */
  const navSteps =
    activeNavigationListing
      ? [
          'Старт від вашої позиції',

          `Рухайтеся дорогою в напрямку ${
            activeNavigationListing.locationName
          }`,

          `Приблизна відстань: ${
            formatDistance(
              activeNavigationListing.distanceMeters
            )
          }`,

          `Прибуття до «${
            activeNavigationListing.title
          }»`
        ]
      : [];

  return (
    <div className="relative w-full h-full min-h-[420px] flex-1">

      <div
        ref={mapContainerRef}
        className="w-full h-full rounded-2xl overflow-hidden shadow-inner border border-purple-900/30"
      />

      /*
       * АКТИВНА НАВІГАЦІЯ
       */
      {activeNavigationListing &&
        !isNavHudMinimized && (
          <div className="absolute top-3 left-3 right-16 z-30 max-w-lg bg-slate-950/95 border-2 border-cyan-500 rounded-2xl p-3 shadow-2xl backdrop-blur-xl space-y-2 text-slate-100">

            <div className="flex items-center justify-between gap-2 border-b border-cyan-900/50 pb-2">

              <div className="flex items-center gap-2 truncate">

                <div className="w-7 h-7 rounded-lg bg-cyan-500 text-slate-950 flex items-center justify-center font-black animate-pulse shrink-0">

                  <Navigation className="w-4 h-4 fill-slate-950" />

                </div>

                <div className="truncate">

                  <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest block">
                    АКТИВНИЙ МАРШРУТ
                  </span>

                  <h4 className="font-extrabold text-xs text-white truncate">
                    {activeNavigationListing.title}
                  </h4>

                </div>

              </div>

              <div className="flex items-center gap-1 shrink-0">

                <button
                  onClick={() =>
                    setIsNavHudMinimized(true)
                  }
                  className="px-2 py-1 rounded-lg bg-slate-900 text-cyan-300 border border-cyan-800/40 text-[10px] font-extrabold"
                >
                  — Згорнути
                </button>

                <button
                  onClick={onStopNavigation}
                  className="p-1 rounded-lg bg-slate-900 text-rose-300 border border-rose-800/50"
                >
                  <X className="w-4 h-4" />
                </button>

              </div>
            </div>

            <div className="grid grid-cols-3 gap-1.5 text-center text-xs font-bold">

              <div className="bg-slate-900/90 p-1.5 rounded-xl border border-purple-900/40">

                <span className="text-[9px] text-purple-300/80 block uppercase">
                  Відстань
                </span>

                <span className="text-cyan-300 font-black text-xs">
                  {formatDistance(
                    activeNavigationListing.distanceMeters
                  )}
                </span>

              </div>

              <div className="bg-slate-900/90 p-1.5 rounded-xl border border-purple-900/40 flex items-center justify-center gap-1">

                <Car className="w-3.5 h-3.5 text-purple-400" />

                <div>

                  <span className="text-[9px] text-purple-300/80 block uppercase">
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
                    )}
                    {' '}хв
                  </span>

                </div>

              </div>

              <div className="bg-slate-900/90 p-1.5 rounded-xl border border-purple-900/40 flex items-center justify-center gap-1">

                <Footprints className="w-3.5 h-3.5 text-purple-400" />

                <div>

                  <span className="text-[9px] text-purple-300/80 block uppercase">
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
                    )}
                    {' '}хв
                  </span>

                </div>

              </div>

            </div>

            <div className="bg-cyan-950/60 p-2 rounded-xl border border-cyan-800/50 text-[11px] font-semibold text-cyan-200 flex items-center justify-between">

              <div className="flex items-center gap-1.5 truncate pr-1">

                <ChevronRight className="w-3.5 h-3.5 text-cyan-400" />

                <span className="truncate">
                  {navSteps[
                    currentStepIndex
                  ]}
                </span>

              </div>

              {navSteps.length > 1 && (
                <button
                  onClick={() =>
                    setCurrentStepIndex(
                      (p) =>
                        (p + 1) %
                        navSteps.length
                    )
                  }
                  className="text-[9px] font-extrabold bg-cyan-600 text-slate-950 px-2 py-0.5 rounded-md"
                >
                  Далі →
                </button>
              )}

            </div>

          </div>
        )}

      /*
       * МІНІМАЛЬНИЙ HUD
       */
      {activeNavigationListing &&
        isNavHudMinimized && (
          <div className="absolute top-3 left-3 z-30 bg-slate-950/90 border border-cyan-400 text-cyan-200 px-3 py-1.5 rounded-full shadow-xl backdrop-blur-md flex items-center gap-2 text-xs font-bold">

            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>

            <span className="truncate max-w-[160px] sm:max-w-xs">
              🧭 {activeNavigationListing.title}
            </span>

            <button
              onClick={() =>
                setIsNavHudMinimized(false)
              }
              className="bg-cyan-500 text-slate-950 px-2 py-0.5 rounded-full text-[10px] font-black"
            >
              Розгорнути
            </button>

            <button
              onClick={onStopNavigation}
              className="p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>

          </div>
        )}

      /*
       * ВИБІР ТОЧКИ
       */
      {isPinSelectMode && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-purple-900/90 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg border border-purple-400/50 flex items-center gap-2 animate-bounce backdrop-blur-md">

          <span>
            📍 Натисніть на карту, щоб вибрати точку
          </span>

        </div>
      )}

      /*
       * ЛІВА ПАНЕЛЬ
       */
      <div className="absolute top-3 left-3 z-20 flex flex-col items-start gap-2">

        <div className="flex items-center gap-2">

          <button
            onClick={() => {
              setShowRadiusMenu(
                !showRadiusMenu
              );

              if (!showRadiusMenu) {
                setShowLegend(false);
              }
            }}
            className={`p-2.5 rounded-xl shadow-lg border font-bold text-xs flex items-center gap-1.5 transition-all backdrop-blur-md ${
              maxRadiusKm !== null
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-400'
                : 'bg-slate-950/85 text-purple-200 border-purple-800/60'
            }`}
          >
            <Compass className="w-4 h-4 text-purple-300" />

            <span>
              Радіус:{' '}
              {maxRadiusKm !== null
                ? `${maxRadiusKm} км`
                : 'Всі'}
            </span>

          </button>

          <button
            onClick={() => {
              setShowLegend(
                !showLegend
              );

              if (!showLegend) {
                setShowRadiusMenu(false);
              }
            }}
            className={`p-2.5 rounded-xl shadow-lg border font-bold text-xs flex items-center gap-1.5 transition-all backdrop-blur-md ${
              showLegend
                ? 'bg-purple-600 text-white border-purple-300'
                : 'bg-slate-950/85 text-purple-200 border-purple-800/60'
            }`}
          >
            <Info className="w-4 h-4 text-purple-300" />

            <span className="hidden sm:inline">
              Легенда
            </span>

          </button>

        </div>

        {showRadiusMenu && (
          <div className="w-72 sm:w-80 animate-slide-down shadow-2xl z-30">

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

      /*
       * ПРАВА ПАНЕЛЬ
       */
      <div
        className={`absolute top-3 ${
          selectedListing
            ? 'right-3 sm:right-[400px] md:right-[420px]'
            : 'right-3'
        } z-20 flex flex-col items-end gap-2`}
      >

        /*
         * GPS
         */
        <button
          onClick={handleGPSLocate}
          disabled={isLocating}
          className="p-2.5 rounded-xl shadow-lg border font-bold text-xs flex items-center gap-1.5 bg-slate-950/85 text-cyan-300 border-cyan-800/60"
          title="Визначити моє місцезнаходження"
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
              ? 'Визначення...'
              : 'GPS Точка'}
          </span>

        </button>

        /*
         * ШАРИ
         */
        <div className="relative">

          <button
            onClick={() =>
              setShowStyleMenu(
                !showStyleMenu
              )
            }
            className="p-2.5 rounded-xl bg-slate-950/85 text-purple-200 border border-purple-800/50 shadow-lg font-bold text-xs flex items-center gap-1.5"
          >

            <Layers className="w-4 h-4 text-purple-400" />

            <span className="hidden sm:inline">
              Шар карти
            </span>

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
              ).map((style) => (

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
                    ? '🗺️ Вулиці / Схема'
                    : style === 'satellite'
                    ? '🛰️ Супутник'
                    : '🌌 Космічна ніч'}

                  {mapStyle === style &&
                    ' ✓'}

                </button>

              ))}

            </div>
          )}

        </div>

        /*
         * ЦЕНТР
         */
        <button
          onClick={handleRecenter}
          className="p-2.5 rounded-xl bg-slate-950/85 text-purple-200 border border-purple-800/50 shadow-lg font-bold text-xs flex items-center gap-1.5"
          title="Повернутися до поточної точки"
        >

          <Compass className="w-4 h-4 text-purple-400" />

          <span className="hidden sm:inline">
            Центр
          </span>

        </button>

      </div>

      /*
       * ІНФОРМАЦІЙНИЙ НАПИС
       */
      {!activeNavigationListing && (
        <div className="absolute top-3 left-3 z-10 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md border border-purple-800/50 text-[11px] font-bold text-purple-200 flex items-center gap-2">

          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>

          <span>
            Рівненська область • Онлайн-карта
          </span>

        </div>
      )}

      /*
       * КАРТКА ОБ'ЄКТА
       */
      {selectedListing && (
        <div className="absolute top-3 right-3 bottom-3 z-30 w-[calc(100%-24px)] sm:w-[380px] md:w-[400px] bg-slate-950/95 border-2 border-purple-600/90 text-slate-100 rounded-3xl p-4 shadow-2xl backdrop-blur-2xl flex flex-col justify-between overflow-y-auto space-y-3">

          <div className="space-y-2">

            <div className="flex items-center justify-between border-b border-purple-900/50 pb-2.5">

              <div className="flex items-center gap-1.5 flex-wrap">

                <span className="bg-purple-950 text-purple-200 text-xs font-black px-2.5 py-1 rounded-full border border-purple-800/60 flex items-center gap-1">

                  <span>
                    {CATEGORIES[
                      selectedListing.category
                    ]?.pinSymbol || '📌'}
                  </span>

                  <span>
                    {CATEGORIES[
                      selectedListing.category
                    ]?.label ||
                      'Пропозиція'}
                  </span>

                </span>

                {selectedListing.isUrgent && (
                  <span className="bg-rose-600 text-white text-xs font-black px-2 py-0.5 rounded-full animate-pulse">
                    🚨 Терміново
                  </span>
                )}

              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectListing(null);
                }}
                className="p-1.5 rounded-full bg-slate-900 text-purple-300 border border-purple-800/40"
              >
                <X className="w-4 h-4" />
              </button>

            </div>

            <div className="space-y-1 pt-1">

              <h4 className="font-extrabold text-base text-slate-100 leading-snug">
                {selectedListing.title}
              </h4>

              <div className="flex items-center justify-between gap-2 pt-1">

                <span className="text-xs text-purple-300/90 font-bold flex items-center gap-1">

                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />

                  <span>
                    📍{' '}
                    {formatDistance(
                      selectedListing.distanceMeters
                    )}{' '}
                    від вас
                  </span>

                </span>

                <span className="text-xs font-black text-violet-200 bg-purple-950/90 px-3 py-1 rounded-xl border border-purple-800/60">
                  {selectedListing.pay}
                </span>

              </div>

            </div>

          </div>

          {selectedListing.photoUrl && (
            <div className="rounded-2xl overflow-hidden border border-purple-900/40 h-36 bg-slate-900 shrink-0">

              <img
                src={
                  selectedListing.photoUrl
                }
                alt={
                  selectedListing.title
                }
                className="w-full h-full object-cover"
              />

            </div>
          )}

          <div className="space-y-2 text-xs bg-slate-900/80 p-3 rounded-2xl border border-purple-900/40">

            <div className="text-purple-200/90 font-medium">

              <span className="text-purple-400 font-bold">
                Адреса:{' '}
              </span>

              <span>
                {
                  selectedListing.locationName
                }
              </span>

            </div>

            <div className="flex justify-between text-purple-300/80">

              <span>
                <b>Коли:</b>{' '}
                {selectedListing.when}
              </span>

              <span>
                <b>Тривалість:</b>{' '}
                {
                  selectedListing.duration
                }
              </span>

            </div>

            <p className="text-slate-300 text-xs line-clamp-3 pt-1 border-t border-purple-900/30 font-normal">
              {
                selectedListing.description
              }
            </p>

          </div>

          <div className="grid grid-cols-1 gap-2 pt-2 border-t border-purple-900/40">

            <div className="grid grid-cols-2 gap-2">

              {onCallListing && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCallListing(
                      selectedListing
                    );
                  }}
                  className="py-2.5 px-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5"
                >

                  <Phone className="w-4 h-4" />

                  <span>
                    Дзвінок
                  </span>

                </button>
              )}

              {onRouteListing && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRouteListing(
                      selectedListing
                    );
                  }}
                  className="py-2.5 px-3 bg-slate-900 text-purple-200 font-extrabold text-xs rounded-xl border border-purple-800/50 flex items-center justify-center gap-1.5"
                >

                  <Navigation className="w-4 h-4 text-purple-400" />

                  <span>
                    Маршрут
                  </span>

                </button>
              )}

            </div>

            {onDetailListing && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDetailListing(
                    selectedListing
                  );
                }}
                className="w-full py-2 px-3 bg-purple-950/80 text-purple-200 font-extrabold text-xs rounded-xl border border-purple-800/60 flex items-center justify-center gap-1.5"
              >

                <span>
                  Повна інформація та контакти
                </span>

                <ExternalLink className="w-3.5 h-3.5 text-purple-400" />

              </button>
            )}

          </div>

        </div>
      )}

    </div>
  );
};
