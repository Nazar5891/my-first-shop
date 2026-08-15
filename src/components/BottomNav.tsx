import React, { useEffect } from 'react';
import { Map, ShoppingBag, Plus } from 'lucide-react';
import { ActiveTab } from '../types';

interface BottomNavProps { activeTab: ActiveTab; setActiveTab: (tab: ActiveTab) => void; onOpenCreateModal: () => void; urgentCount?: number; }
const NAV_STATE = 'meisterOnlineNav';

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab, onOpenCreateModal, urgentCount = 0 }) => {
  useEffect(() => {
    if (!window.history.state?.[NAV_STATE]) {
      window.history.replaceState({ ...(window.history.state || {}), [NAV_STATE]: true, tab: 'search' }, '', window.location.href);
      setActiveTab('search');
    }
    const onPopState = (event: PopStateEvent) => {
      if (event.state?.[NAV_STATE]) setActiveTab((event.state.tab as ActiveTab) || 'search');
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

  useEffect(() => {
    const openAccount = () => navigate('more');
    const closeAccount = () => navigate('map');
    window.addEventListener('meister-open-account', openAccount);
    window.addEventListener('meister-close-account', closeAccount);
    return () => { window.removeEventListener('meister-open-account', openAccount); window.removeEventListener('meister-close-account', closeAccount); };
  }, [activeTab]);

  return <div className="fixed left-0 right-0 bottom-0 w-full z-[5000] p-3 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent pointer-events-none" style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}>
    <div className="max-w-md mx-auto bg-slate-950/90 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl p-1.5 flex items-center justify-around pointer-events-auto ring-1 ring-white/5">
      <button onClick={() => navigate('search')} className={`flex-1 py-2 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-200 ${activeTab === 'search' || activeTab === 'near' ? 'text-white font-black bg-white/10 border border-white/15 shadow-sm' : 'text-white/50 hover:text-white font-semibold'}`}>
        <ShoppingBag className="w-5 h-5" />
        <span className="text-[11px] leading-none">Оголошення</span>
        {urgentCount > 0 && <span className="absolute top-1 right-[calc(50%+3.5rem)] w-2 h-2 rounded-full bg-white animate-ping" />}
      </button>
      <button onClick={onOpenCreateModal} className="mx-1 w-16 h-12 rounded-2xl bg-white text-black flex items-center justify-center gap-1.5 px-2 shadow-lg shadow-black/50 hover:scale-105 active:scale-95 transition-all ring-4 ring-slate-950 border border-white/80" title="Подати оголошення">
        <Plus className="w-5 h-5 stroke-[3]" />
        <span className="text-[8px] font-black uppercase leading-tight text-center">Подати оголошення</span>
      </button>
      <button onClick={() => navigate('map')} className={`flex-1 py-2 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-200 ${activeTab === 'map' ? 'text-white font-black bg-white/10 border border-white/15 shadow-sm' : 'text-white/50 hover:text-white font-semibold'}`}>
        <Map className="w-5 h-5" />
        <span className="text-[11px] leading-none">Карта</span>
      </button>
    </div>
  </div>;
};