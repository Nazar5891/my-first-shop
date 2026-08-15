import React, { useEffect, useState } from 'react';
import { Map, Search, Plus, Menu } from 'lucide-react';
import { ActiveTab } from '../types';
import { subscribeToAuth } from '../auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

interface BottomNavProps { activeTab: ActiveTab; setActiveTab: (tab: ActiveTab) => void; onOpenCreateModal: () => void; urgentCount?: number; }
const NAV_STATE = 'meisterOnlineNav';

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab, onOpenCreateModal, urgentCount = 0 }) => {
  const [profilePhoto, setProfilePhoto] = useState('');

  useEffect(() => {
    let stopProfile: (() => void) | null = null;
    const stopAuth = subscribeToAuth(user => {
      setProfilePhoto('');
      stopProfile?.();
      stopProfile = null;
      if (!user) return;
      stopProfile = onSnapshot(doc(db, 'users', user.uid), snap => {
        const data = snap.exists() ? snap.data() : {};
        const custom = typeof data.photo === 'string' ? data.photo : '';
        setProfilePhoto(custom || user.photoURL || '');
      }, () => setProfilePhoto(user.photoURL || ''));
    });
    return () => { stopProfile?.(); stopAuth(); };
  }, []);

  useEffect(() => {
    if (!window.history.state?.[NAV_STATE]) {
      window.history.replaceState({ ...(window.history.state || {}), [NAV_STATE]: true, tab: activeTab }, '', window.location.href);
    }
    const onPopState = (event: PopStateEvent) => {
      if (event.state?.[NAV_STATE]) setActiveTab((event.state.tab as ActiveTab) || 'map');
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [setActiveTab]);

  const navigate = (tab: ActiveTab) => {
    if (tab === activeTab) return;
    window.history.pushState({ ...(window.history.state || {}), [NAV_STATE]: true, tab }, '', window.location.href);
    setActiveTab(tab);
    if (tab === 'search') window.dispatchEvent(new Event('meister-focus-search'));
  };

  return <div className="fixed left-0 right-0 bottom-0 w-full z-[5000] p-3 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent pointer-events-none" style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}>
    <div className="max-w-md mx-auto bg-slate-950/90 backdrop-blur-2xl border border-purple-900/50 rounded-3xl shadow-2xl p-1.5 flex items-center justify-around pointer-events-auto ring-1 ring-purple-500/20">
      <button onClick={() => navigate('map')} className={`flex-1 py-2 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-200 ${activeTab === 'map' ? 'text-violet-300 font-black bg-purple-950/80 border border-purple-800/50 shadow-sm' : 'text-purple-300/70 hover:text-white font-semibold'}`}><Map className="w-5 h-5" /><span className="text-[11px] leading-none">Карта</span></button>
      <button onClick={() => navigate('search')} className={`flex-1 py-2 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-200 relative ${activeTab === 'search' || activeTab === 'near' ? 'text-violet-300 font-black bg-purple-950/80 border border-purple-800/50 shadow-sm' : 'text-purple-300/70 hover:text-white font-semibold'}`}><Search className="w-5 h-5" /><span className="text-[11px] leading-none">Знайти</span>{urgentCount > 0 && <span className="absolute top-1 right-3 w-2 h-2 rounded-full bg-rose-500 animate-ping" />}</button>
      <button onClick={onOpenCreateModal} className="mx-1 w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-violet-500 text-white flex items-center justify-center shadow-lg shadow-purple-950/80 hover:scale-105 active:scale-95 transition-all ring-4 ring-slate-950 border border-purple-400/40" title="Додати оголошення"><Plus className="w-6 h-6 stroke-[3]" /></button>
      <button onClick={() => navigate('more')} className={`flex-1 py-2 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-200 ${activeTab === 'more' ? 'text-violet-300 font-black bg-purple-950/80 border border-purple-800/50 shadow-sm' : 'text-purple-300/70 hover:text-white font-semibold'}`}>
        {profilePhoto ? <img src={profilePhoto} alt="Мій акаунт" className="w-6 h-6 rounded-full object-cover border border-cyan-300/70" /> : <Menu className="w-5 h-5" />}
        <span className="text-[11px] leading-none">Мій акаунт</span>
      </button>
    </div>
  </div>;
};