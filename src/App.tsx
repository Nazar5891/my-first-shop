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
  const [listings, setListings] = useState<Listing[]>(INITIAL_LISTINGS);
  const [activeTab, setActiveTab] = useState<ActiveTab>('map');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | 'all'>('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [isNearMeActive, setIsNearMeActive] = useState(false);
  const [maxRadiusKm, setMaxRadiusKm] = useState<number | null>(null);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [detailListing, setDetailListing] = useState<Listing | null>(null);
  const [activeNavigationListing, setActiveNavigationListing] = useState<Listing | null>(null);
  const [userCoords, setUserCoords] = useState<[number, number]>(COMMUNITY_CENTER);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [callingListing, setCallingListing] = useState<Listing | null>(null);
  const [routingListing, setRoutingListing] = useState<Listing | null>(null);
  const [reportingListing, setReportingListing] = useState<Listing | null>(null);

  const processedListings = useMemo(() => listings.map(item => ({
    ...item,
    distanceMeters: calculateDistanceMeters(userCoords[0], userCoords[1], item.coordinates[0], item.coordinates[1]),
  })), [listings, userCoords]);

  const urgentCount = useMemo(() => processedListings.filter(l => l.isUrgent).length, [processedListings]);

  const filteredListings = useMemo(() => processedListings.filter(item => {
    if (maxRadiusKm !== null && item.distanceMeters > maxRadiusKm * 1000) return false;
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    if (selectedSubcategory && item.subcategory !== selectedSubcategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!item.title.toLowerCase().includes(q) && !item.description.toLowerCase().includes(q) && !item.locationName.toLowerCase().includes(q) && !item.pay.toLowerCase().includes(q)) return false;
    }
    return true;
  }), [processedListings, selectedCategory, selectedSubcategory, searchQuery, maxRadiusKm]);

  const sortedSearchResults = useMemo(() => sortListings(filteredListings, 'distance'), [filteredListings]);

  const handleCreateListing = (newListingData: Omit<Listing, 'id' | 'createdAt' | 'viewsCount' | 'callsCount' | 'distanceMeters'>) => {
    const dist = calculateDistanceMeters(userCoords[0], userCoords[1], newListingData.coordinates[0], newListingData.coordinates[1]);
    const newListing: Listing = {
      ...newListingData,
      id: `custom-${Date.now()}`,
      createdAt: 'Тільки-но',
      viewsCount: 1,
      callsCount: 0,
      distanceMeters: dist,
    };
    setListings(prev => [newListing, ...prev]);
    setSelectedListing(newListing);
  };

  const handleAddComment = (listingId: string, commentData: Omit<import('./types').ListingComment, 'id' | 'createdAt'>) => {
    const newComment: import('./types').ListingComment = { ...commentData, id: `comm-${Date.now()}`, createdAt: 'Тільки-но' };
    setListings(prev => prev.map(item => {
      if (item.id !== listingId) return item;
      const updatedListing = { ...item, comments: [newComment, ...(item.comments || [])] };
      if (detailListing?.id === listingId) setDetailListing(updatedListing);
      if (selectedListing?.id === listingId) setSelectedListing(updatedListing);
      return updatedListing;
    }));
  };

  // Видалення тепер авторизоване акаунтом. SMS/OTP/7788/8899 більше не використовуються.
  const handleDeleteListing = (id: string, _code: string): boolean => {
    const target = listings.find(l => l.id === id);
    if (!target) return false;

    // Ownership must be enforced by the authenticated Firebase user and Firestore Rules.
    // The UI callback receives no usable deletion code anymore.
    const currentUserId = localStorage.getItem('firebase_user_uid');
    if (!currentUserId || target.authorId !== currentUserId) return false;

    setListings(prev => prev.filter(l => l.id !== id));
    if (selectedListing?.id === id) setSelectedListing(null);
    if (detailListing?.id === id) setDetailListing(null);
    if (activeNavigationListing?.id === id) setActiveNavigationListing(null);
    return true;
  };

  return (
    <div className="h-full min-h-screen flex flex-col bg-[url('https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center bg-fixed text-slate-100 font-sans selection:bg-purple-600 selection:text-white relative">
      <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-[2px] pointer-events-none z-0 cosmic-bg-overlay" />
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        <main className="flex-1 overflow-y-auto">
          {/* Existing application UI continues below in the current project. */}
        </main>
      </div>
    </div>
  );
}
