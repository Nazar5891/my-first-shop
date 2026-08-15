import React, { useEffect, useState, useMemo } from 'react';
import { Header } from './components/Header';
import { MapView } from './components/MapView';
import { ListingDetailBottomSheet } from './components/ListingDetailBottomSheet';
import { CreateListingModal } from './components/CreateListingModal';
import { NearMeView } from './components/NearMeView';
import { CallModal } from './components/CallModal';
import { RouteModal } from './components/RouteModal';
import { ReportModal } from './components/ReportModal';
import { MoreTab } from './components/MoreTab';
import { BottomNav } from './components/BottomNav';
import { INITIAL_LISTINGS, COMMUNITY_CENTER } from './data/mockListings';
import { Listing, ListingComment, CategoryId, ActiveTab } from './types';
import { sortListings, calculateDistanceMeters } from './utils/distance';
import { db, auth } from './firebase';
import { addDoc, collection, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { Siren } from 'lucide-react';
import { ListingsPanel } from './components/ListingsPanel';

const ADMIN_EMAIL = 'nazar0111111@gmail.com';
const LISTING_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

export default function App() {
  const [remoteListings, setRemoteListings] = useState<Listing[]>([]);
  const [commentsByListing, setCommentsByListing] = useState<Record<string, ListingComment[]>>({});
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('map');
  const [searchQuery, setSearchQuery] = useState('');
  const [submittedSearchQuery, setSubmittedSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | 'all'>('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [isNearMeActive, setIsNearMeActive] = useState(false);
  const [maxRadiusKm, setMaxRadiusKm] = useState<number | null>(null);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [detailListing, setDetailListing] = useState<Listing | null>(null);
  const [activeNavigationListing, setActiveNavigationListing] = useState<Listing | null>(null);
  const [userCoords, setUserCoords] = useState<[number, number]>(COMMUNITY_CENTER);
  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [callingListing, setCallingListing] = useState<Listing | null>(null);
  const [routingListing, setRoutingListing] = useState<Listing | null>(null);
  const [reportingListing, setReportingListing] = useState<Listing | null>(null);

  const listings = useMemo(() => [...INITIAL_LISTINGS, ...remoteListings.map(item => ({ ...item, comments: commentsByListing[item.id] ?? item.comments ?? [] }))], [remoteListings, commentsByListing]);
  useEffect(() => onAuthStateChanged(auth, setUser), []);
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'listings'), snapshot => {
      const now = Date.now();
      const remote = snapshot.docs.map(item => ({ ...(item.data() as Omit<Listing, 'id'>), id: item.id })).filter(item => {
        const expiresAt = (item as Listing & { expiresAt?: unknown }).expiresAt;
        if (!expiresAt) return true;
        const expiryMs = expiresAt instanceof Date ? expiresAt.getTime() : typeof expiresAt === 'string' ? Date.parse(expiresAt) : Number((expiresAt as { toMillis?: () => number })?.toMillis?.() ?? NaN);
        return !Number.isFinite(expiryMs) || expiryMs > now;
      }) as Listing[];
      setRemoteListings(remote);
    }, error => { console.error('Не вдалося завантажити оголошення з Firestore:', error); setRemoteListings([]); });
    return unsubscribe;
  }, []);
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'comments'), snapshot => {
      const grouped: Record<string, ListingComment[]> = {};
      snapshot.docs.forEach(item => {
        const data = item.data() as Omit<ListingComment, 'id'> & { listingId?: string };
        if (!data.listingId) return;
        const comment: ListingComment = { id: item.id, authorName: data.authorName || 'Мешканець громади', text: data.text || '', createdAt: data.createdAt || '', rating: data.rating, verifiedUser: data.verifiedUser };
        if (!grouped[data.listingId]) grouped[data.listingId] = [];
        grouped[data.listingId].push(comment);
      });
      Object.values(grouped).forEach(list => list.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))));
      setCommentsByListing(grouped);
    }, error => console.error('Не вдалося завантажити відгуки:', error));
    return unsubscribe;
  }, []);
  useEffect(() => {
    const applySearch = () => setSubmittedSearchQuery(searchQuery);
    window.addEventListener('meister-focus-search', applySearch);
    return () => window.removeEventListener('meister-focus-search', applySearch);
  }, [searchQuery]);
  useEffect(() => {
    const openMapListing = (event: Event) => {
      const listing = (event as CustomEvent<Listing>).detail;
      if (!listing) return;
      setSelectedListing(listing);
      setDetailListing(null);
      setRoutingListing(null);
      setActiveNavigationListing(null);
      setActiveTab('map');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('meister-open-map-listing', openMapListing);
    return () => window.removeEventListener('meister-open-map-listing', openMapListing);
  }, []);
  const processedListings = useMemo(() => listings.map(item => ({ ...item, distanceMeters: calculateDistanceMeters(userCoords[0], userCoords[1], item.coordinates[0], item.coordinates[1]) })), [listings, userCoords]);
  const myListings = useMemo(() => user ? processedListings.filter(item => item.authorId === user.uid) : [], [processedListings, user]);
  const urgentCount = useMemo(() => processedListings.filter(l => l.isUrgent).length, [processedListings]);
  const filteredListings = useMemo(() => processedListings.filter(item => {
    if (maxRadiusKm !== null && item.distanceMeters > maxRadiusKm * 1000) return false;
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    if (selectedSubcategory && item.subcategory !== selectedSubcategory) return false;
    if (submittedSearchQuery.trim()) {
      const q = submittedSearchQuery.toLowerCase();
      const searchable = [item.title, item.description, item.locationName, item.pay, item.authorName, item.subcategory || ''].join(' ').toLowerCase();
      if (!searchable.includes(q)) return false;
    }
    return true;
  }), [processedListings, selectedCategory, selectedSubcategory, submittedSearchQuery, maxRadiusKm]);
  const sortedSearchResults = useMemo(() => sortListings(filteredListings, 'distance'), [filteredListings]);
  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL;
  const handleSearch = () => { setSubmittedSearchQuery(searchQuery.trim()); setSelectedListing(null); setDetailListing(null); setActiveTab('map'); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const handleCreateListing = async (newListingData: Omit<Listing, 'id' | 'createdAt' | 'viewsCount' | 'callsCount' | 'distanceMeters'>): Promise<boolean> => {
    if (!user) { setActiveTab('more'); return false; }
    const createdAt = new Date(); const expiresAt = new Date(createdAt.getTime() + LISTING_LIFETIME_MS);
    const listingData: Record<string, unknown> = { title: newListingData.title, category: newListingData.category, description: newListingData.description, pay: newListingData.pay, payValueNumber: newListingData.payValueNumber, payType: newListingData.payType, locationName: newListingData.locationName, coordinates: newListingData.coordinates, when: newListingData.when, duration: newListingData.duration, phone: newListingData.phone, isUrgent: newListingData.isUrgent, verified: newListingData.verified, authorId: user.uid, authorName: user.displayName || user.email?.split('@')[0] || 'Користувач', createdAt: createdAt.toISOString(), expiresAt: expiresAt.toISOString(), viewsCount: 1, callsCount: 0 };
    if (newListingData.subcategory) listingData.subcategory = newListingData.subcategory;
    if (newListingData.urgencyLevel) listingData.urgencyLevel = newListingData.urgencyLevel;
    if (newListingData.urgentType) listingData.urgentType = newListingData.urgentType;
    if (newListingData.photoUrl) listingData.photoUrl = newListingData.photoUrl;
    try { const created = await addDoc(collection(db, 'listings'), listingData); const dist = calculateDistanceMeters(userCoords[0], userCoords[1], newListingData.coordinates[0], newListingData.coordinates[1]); const createdListing = { ...(listingData as Omit<Listing, 'id'>), id: created.id, distanceMeters: dist } as Listing; setSelectedListing(createdListing); setDetailListing(createdListing); setIsCreateModalOpen(false); return true; }
    catch (error) { console.error('Не вдалося опублікувати оголошення:', error); return false; }
  };
  const handleAddComment = async (listingId: string, commentData: Omit<ListingComment, 'id' | 'createdAt'>): Promise<boolean> => {
    if (!user) return false;
    try { await addDoc(collection(db, 'comments'), { listingId, authorId: user.uid, authorName: commentData.authorName || user.displayName || 'Мешканець громади', text: commentData.text, rating: commentData.rating ?? 5, verifiedUser: true, createdAt: new Date().toISOString() }); return true; }
    catch (error) { console.error('Не вдалося зберегти відгук:', error); return false; }
  };
  const handleDeleteListing = async (id: string): Promise<boolean> => {
    if (!user || (!isAdmin && listings.find(item => item.id === id)?.authorId !== user.uid)) return false;
    try { await deleteDoc(doc(db, 'listings', id)); if (selectedListing?.id === id) setSelectedListing(null); if (detailListing?.id === id) setDetailListing(null); if (activeNavigationListing?.id === id) setActiveNavigationListing(null); return true; }
    catch (error) { console.error('Не вдалося видалити оголошення:', error); return false; }
  };
  const handleSelectListing = (listing: Listing | null) => { setSelectedListing(listing); if (listing) setDetailListing(listing); };
  const handleStartOnlineNavigation = (listing: Listing) => { setDetailListing(null); setRoutingListing(null); setSelectedListing(listing); setActiveNavigationListing(listing); setActiveTab('map'); };

  return <div className="h-full min-h-screen flex flex-col bg-[url('https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center bg-fixed text-slate-100 font-sans selection:bg-purple-600 selection:text-white relative">
    <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-[2px] pointer-events-none z-0 cosmic-bg-overlay"/>
    <div className="relative z-10 h-full min-h-screen flex flex-col">
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory} selectedSubcategory={selectedSubcategory} setSelectedSubcategory={setSelectedSubcategory} isNearMeActive={isNearMeActive} setIsNearMeActive={active=>{setIsNearMeActive(active);if(active)setActiveTab('near');}} urgentCount={urgentCount} totalListingsCount={processedListings.length}/>
      <main className="flex-1 relative overflow-hidden flex flex-col min-h-0">
        {activeTab==='map'&&<div className="relative w-full h-full flex-1 flex flex-col min-h-[calc(100vh-140px)]"><div className="flex-1 w-full h-full"><MapView listings={filteredListings} selectedListing={selectedListing} onSelectListing={handleSelectListing} userCoordinates={userCoords} setUserCoordinates={setUserCoords} onGpsStatusChange={setGpsEnabled} activeNavigationListing={activeNavigationListing} onStopNavigation={()=>setActiveNavigationListing(null)} onCallListing={setCallingListing} onRouteListing={setRoutingListing} onDetailListing={setDetailListing} maxRadiusKm={maxRadiusKm} onChangeMaxRadiusKm={setMaxRadiusKm}/></div>{urgentCount>0&&selectedCategory==='urgent'&&<div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-rose-950/90 text-rose-200 text-xs font-black px-3.5 py-1.5 rounded-full shadow-lg border border-rose-600/50 flex items-center gap-2 animate-pulse backdrop-blur-md"><Siren className="w-4 h-4 text-rose-400 shrink-0"/><span>{urgentCount} термінових запитів допомоги поруч</span><button onClick={()=>setSelectedCategory('all')} className="underline text-[11px] text-rose-300 hover:text-white shrink-0 ml-1">Всі</button></div>}</div>}
        {activeTab==='search'&&<div className="h-full overflow-hidden pb-24"><ListingsPanel listings={sortedSearchResults} onSelectListing={listing=>{setSelectedListing(listing);setDetailListing(listing);}}/></div>}
        {activeTab==='near'&&<div className="h-full overflow-y-auto overscroll-contain p-3 sm:p-4 max-w-3xl mx-auto w-full pb-32"><NearMeView listings={processedListings} onSelectListing={setDetailListing} onCallListing={setCallingListing} selectedCategory={selectedCategory} maxRadiusKm={maxRadiusKm} onChangeMaxRadiusKm={setMaxRadiusKm} totalListingsCount={processedListings.length}/></div>}
        {activeTab==='more'&&<div className="h-full overflow-y-auto overscroll-contain p-3 sm:p-4 max-w-3xl mx-auto w-full pb-36"><MoreTab myListings={myListings} allListings={processedListings} onDeleteListing={handleDeleteListing} onSelectCategoryAndSubcategory={(catId,sub)=>{setSelectedCategory(catId);setSelectedSubcategory(sub||null);setActiveTab('search');}}/></div>}
      </main>
      <ListingDetailBottomSheet listing={detailListing} onClose={()=>setDetailListing(null)} onCall={setCallingListing} onRoute={listing=>{setRoutingListing(listing);if(listing.category==='rideshare'){setSelectedListing(listing);setActiveTab('map');}}} onReport={setReportingListing} onAddComment={handleAddComment} onDeleted={id=>{setSelectedListing(null);setDetailListing(null);setActiveNavigationListing(active=>active?.id===id?null:active);}}/>
      <CreateListingModal isOpen={isCreateModalOpen} onClose={()=>setIsCreateModalOpen(false)} onSubmit={handleCreateListing} userCoordinates={userCoords} gpsEnabled={gpsEnabled}/>
      <CallModal listing={callingListing} onClose={()=>setCallingListing(null)}/><RouteModal listing={routingListing} onClose={()=>setRoutingListing(null)} onStartOnlineNavigation={handleStartOnlineNavigation}/><ReportModal listing={reportingListing} onClose={()=>setReportingListing(null)}/>
      <BottomNav activeTab={activeTab} setActiveTab={tab=>{setActiveTab(tab);if(tab!=='near')setIsNearMeActive(false);}} onOpenCreateModal={()=>{if(user)setIsCreateModalOpen(true);else setActiveTab('more');}} urgentCount={urgentCount}/>
    </div>
  </div>;
}