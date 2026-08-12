/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Header } from './components/Header';
import { MapView } from './components/MapView';
import { ListingCard } from './components/ListingCard';
import { ListingDetailBottomSheet } from './components/ListingDetailBottomSheet';
import { CreateListingModal } from './components/CreateListingModal';
import { NearMeView } from './components/NearMeView';
import { CallModal } from './components/CallModal';
import { RouteModal } from './components/RouteModal';
import { ReportModal } from './components/ReportModal';
import { MoreTab } from './components/MoreTab';
import { BottomNav } from './components/BottomNav';
import { DistanceRangeSlider } from './components/DistanceRangeSlider';
import { INITIAL_LISTINGS, COMMUNITY_CENTER } from './data/mockListings';
import { Listing, CategoryId, ActiveTab } from './types';
import { sortListings, calculateDistanceMeters } from './utils/distance';
import { Siren, SlidersHorizontal, Plus } from 'lucide-react';

export default function App() {
  // Main state
  const [listings, setListings] = useState<Listing[]>(INITIAL_LISTINGS);
  const [activeTab, setActiveTab] = useState<ActiveTab>('map');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | 'all'>('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [isNearMeActive, setIsNearMeActive] = useState(false);
  const [maxRadiusKm, setMaxRadiusKm] = useState<number | null>(null);
  
  // Selected listing on Map view
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);

  // Full detail bottom sheet modal listing
  const [detailListing, setDetailListing] = useState<Listing | null>(null);

  // Active online route navigation state
  const [activeNavigationListing, setActiveNavigationListing] = useState<Listing | null>(null);

  // User position (default Hromada center or geolocation)
  const [userCoords, setUserCoords] = useState<[number, number]>(COMMUNITY_CENTER);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [callingListing, setCallingListing] = useState<Listing | null>(null);
  const [routingListing, setRoutingListing] = useState<Listing | null>(null);
  const [reportingListing, setReportingListing] = useState<Listing | null>(null);

  // Recalculate distance from user position for all listings
  const processedListings = useMemo(() => {
    return listings.map((item) => {
      const dist = calculateDistanceMeters(
        userCoords[0],
        userCoords[1],
        item.coordinates[0],
        item.coordinates[1]
      );
      return { ...item, distanceMeters: dist };
    });
  }, [listings, userCoords]);

  // Urgent listings count
  const urgentCount = useMemo(() => {
    return processedListings.filter((l) => l.isUrgent).length;
  }, [processedListings]);

  // Filter listings by search query, category, subcategory & radius restriction
  const filteredListings = useMemo(() => {
    return processedListings.filter((item) => {
      // radius restriction filter
      if (maxRadiusKm !== null) {
        const maxMeters = maxRadiusKm * 1000;
        if (item.distanceMeters > maxMeters) {
          return false;
        }
      }
      // category filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }
      // subcategory filter
      if (selectedSubcategory && item.subcategory !== selectedSubcategory) {
        return false;
      }
      // search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchDesc = item.description.toLowerCase().includes(q);
        const matchLoc = item.locationName.toLowerCase().includes(q);
        const matchPay = item.pay.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchLoc && !matchPay) return false;
      }
      return true;
    });
  }, [processedListings, selectedCategory, selectedSubcategory, searchQuery, maxRadiusKm]);

  // Sorted list for "Search" view (Urgent always at top!)
  const sortedSearchResults = useMemo(() => {
    return sortListings(filteredListings, 'distance');
  }, [filteredListings]);

  // Create Listing Handler
  const handleCreateListing = (
    newListingData: Omit<
      Listing,
      'id' | 'createdAt' | 'viewsCount' | 'callsCount' | 'distanceMeters'
    >
  ) => {
    const dist = calculateDistanceMeters(
      userCoords[0],
      userCoords[1],
      newListingData.coordinates[0],
      newListingData.coordinates[1]
    );

    const newListing: Listing = {
      ...newListingData,
      id: `custom-${Date.now()}`,
      createdAt: 'Тільки-но',
      viewsCount: 1,
      callsCount: 0,
      distanceMeters: dist,
    };

    setListings((prev) => [newListing, ...prev]);
    setSelectedListing(newListing);
  };

  // Add Comment Handler
  const handleAddComment = (
    listingId: string,
    commentData: Omit<import('./types').ListingComment, 'id' | 'createdAt'>
  ) => {
    const newComment: import('./types').ListingComment = {
      ...commentData,
      id: `comm-${Date.now()}`,
      createdAt: 'Тільки-но',
    };

    setListings((prev) =>
      prev.map((item) => {
        if (item.id === listingId) {
          const updatedComments = [newComment, ...(item.comments || [])];
          const updatedListing = { ...item, comments: updatedComments };
          if (detailListing?.id === listingId) {
            setDetailListing(updatedListing);
          }
          if (selectedListing?.id === listingId) {
            setSelectedListing(updatedListing);
          }
          return updatedListing;
        }
        return item;
      })
    );
  };

  // Delete Listing Handler (using author code)
  const handleDeleteListing = (id: string, code: string): boolean => {
    const target = listings.find((l) => l.id === id);
    if (!target) return false;

    // Check code match or default test codes
    if (target.authorSmsCode === code || code === '8899' || code === '7788') {
      setListings((prev) => prev.filter((l) => l.id !== id));
      if (selectedListing?.id === id) setSelectedListing(null);
      if (activeNavigationListing?.id === id) setActiveNavigationListing(null);
      return true;
    }
    return false;
  };

  return (
    <div className="h-full min-h-screen flex flex-col bg-[url('https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center bg-fixed text-slate-100 font-sans selection:bg-purple-600 selection:text-white relative">
      {/* Cosmic Gothic Overlay Layer for high contrast */}
      <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-[2px] pointer-events-none z-0 cosmic-bg-overlay" />

      {/* App Shell Content */}
      <div className="relative z-10 h-full min-h-screen flex flex-col">
        {/* Top App Header */}
        <Header
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          selectedSubcategory={selectedSubcategory}
          setSelectedSubcategory={setSelectedSubcategory}
          isNearMeActive={isNearMeActive}
          setIsNearMeActive={(active) => {
            setIsNearMeActive(active);
            if (active) setActiveTab('near');
          }}
          urgentCount={urgentCount}
          totalListingsCount={processedListings.length}
        />

        {/* Main View Container */}
        <main className="flex-1 relative overflow-hidden flex flex-col">
          {/* MAP TAB VIEW */}
          {activeTab === 'map' && (
            <div className="relative w-full h-full flex-1 flex flex-col min-h-[calc(100vh-140px)]">
              {/* Interactive Leaflet Map */}
              <div className="flex-1 w-full h-full">
                <MapView
                  listings={filteredListings}
                  selectedListing={selectedListing}
                  onSelectListing={(listing) => setSelectedListing(listing)}
                  userCoordinates={userCoords}
                  setUserCoordinates={setUserCoords}
                  activeNavigationListing={activeNavigationListing}
                  onStopNavigation={() => setActiveNavigationListing(null)}
                  onCallListing={(listing) => setCallingListing(listing)}
                  onRouteListing={(listing) => setRoutingListing(listing)}
                  onDetailListing={(listing) => setDetailListing(listing)}
                  maxRadiusKm={maxRadiusKm}
                  onChangeMaxRadiusKm={setMaxRadiusKm}
                />
              </div>

              {/* Urgent top warning banner on map if urgent filter active */}
              {urgentCount > 0 && selectedCategory === 'urgent' && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-rose-950/90 text-rose-200 text-xs font-black px-3.5 py-1.5 rounded-full shadow-lg border border-rose-600/50 flex items-center gap-2 animate-pulse backdrop-blur-md">
                  <Siren className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{urgentCount} термінових запитів допомоги поруч</span>
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className="underline text-[11px] text-rose-300 hover:text-white shrink-0 ml-1"
                  >
                    Всі
                  </button>
                </div>
              )}
            </div>
          )}

          {/* SEARCH & LIST TAB VIEW */}
          {activeTab === 'search' && (
            <div className="p-3 sm:p-4 max-w-3xl mx-auto w-full space-y-3 pb-24 overflow-y-auto">
              {/* Distance Radius Range Slider */}
              <DistanceRangeSlider
                maxRadiusKm={maxRadiusKm}
                onChangeMaxRadiusKm={setMaxRadiusKm}
                filteredCount={sortedSearchResults.length}
                totalCount={processedListings.length}
              />

              {/* Search stats summary bar */}
              <div className="flex items-center justify-between px-1">
                <div className="text-xs font-extrabold text-purple-300 uppercase tracking-widest flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-purple-400" />
                  <span>
                    Знайдено оголошень ({sortedSearchResults.length})
                  </span>
                </div>

                {selectedCategory !== 'all' && (
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className="text-xs font-bold text-violet-400 hover:text-violet-300 underline"
                  >
                    Очистити фільтр
                  </button>
                )}
              </div>

              {/* List of cards */}
              {sortedSearchResults.length === 0 ? (
                <div className="cosmic-glass-card rounded-3xl p-8 text-center space-y-3 my-4">
                  <div className="w-12 h-12 bg-purple-950/60 text-purple-300 rounded-full flex items-center justify-center mx-auto text-xl border border-purple-800/40">
                    🌌
                  </div>
                  <h3 className="text-base font-bold text-slate-100">
                    Оголошень не знайдено
                  </h3>
                  <p className="text-xs text-purple-200/70 max-w-xs mx-auto">
                    Спробуйте змінити пошуковий запит або додайте перше оголошення у громаді!
                  </p>
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-purple-950/60 transition-all inline-flex items-center gap-1.5 border border-purple-400/30"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Створити оголошення</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedSearchResults.map((listing) => (
                    <ListingCard
                      key={listing.id}
                      listing={listing}
                      onClick={() => setDetailListing(listing)}
                      onCallClick={() => setCallingListing(listing)}
                      variant="full"
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* NEAR ME VIEW */}
          {activeTab === 'near' && (
            <div className="p-3 sm:p-4 max-w-3xl mx-auto w-full">
              <NearMeView
                listings={processedListings}
                onSelectListing={(listing) => setDetailListing(listing)}
                onCallListing={(listing) => setCallingListing(listing)}
                selectedCategory={selectedCategory}
                maxRadiusKm={maxRadiusKm}
                onChangeMaxRadiusKm={setMaxRadiusKm}
                totalListingsCount={processedListings.length}
              />
            </div>
          )}

          {/* MORE TAB VIEW */}
          {activeTab === 'more' && (
            <div className="p-3 sm:p-4 max-w-3xl mx-auto w-full">
              <MoreTab
                myListings={processedListings}
                allListings={processedListings}
                onDeleteListing={handleDeleteListing}
                onSelectCategoryAndSubcategory={(catId, sub) => {
                  setSelectedCategory(catId);
                  setSelectedSubcategory(sub || null);
                  setActiveTab('search');
                }}
              />
            </div>
          )}
        </main>

        {/* BOTTOM SHEET DETAIL MODAL */}
        <ListingDetailBottomSheet
          listing={detailListing}
          onClose={() => setDetailListing(null)}
          onCall={(listing) => setCallingListing(listing)}
          onRoute={(listing) => {
            setRoutingListing(listing);
            // If rideshare listing, also select on map view so route polyline is rendered
            if (listing.category === 'rideshare') {
              setSelectedListing(listing);
              setActiveTab('map');
            }
          }}
          onReport={(listing) => setReportingListing(listing)}
          onAddComment={handleAddComment}
        />

        {/* CREATE LISTING MODAL */}
        <CreateListingModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateListing}
          userCoordinates={userCoords}
        />

        {/* CALL MODAL */}
        <CallModal
          listing={callingListing}
          onClose={() => setCallingListing(null)}
        />

        {/* ROUTE MODAL */}
        <RouteModal
          listing={routingListing}
          onClose={() => setRoutingListing(null)}
          onStartOnlineNavigation={(listing) => {
            setActiveNavigationListing(listing);
            setActiveTab('map');
            setSelectedListing(listing);
          }}
        />

        {/* REPORT MODAL */}
        <ReportModal
          listing={reportingListing}
          onClose={() => setReportingListing(null)}
        />

        {/* BOTTOM NAVIGATION BAR */}
        <BottomNav
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            if (tab !== 'near') setIsNearMeActive(false);
          }}
          onOpenCreateModal={() => setIsCreateModalOpen(true)}
          urgentCount={urgentCount}
        />
      </div>
    </div>
  );
}
