import React, { useEffect, useState } from 'react';
import { Search, MapPin, X, Siren, Sparkles, UserRound } from 'lucide-react';
import { CategoryId, CATEGORIES } from '../types';
import { AuthPanel } from './AuthPanel';
import { subscribeToAuth } from '../auth';
import type { User } from 'firebase/auth';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: CategoryId | 'all';
  setSelectedCategory: (category: CategoryId | 'all') => void;
  selectedSubcategory?: string | null;
  setSelectedSubcategory?: (sub: string | null) => void;
  isNearMeActive: boolean;
  setIsNearMeActive: (active: boolean) => void;
  urgentCount: number;
  totalListingsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery, setSearchQuery, selectedCategory, setSelectedCategory,
  selectedSubcategory, setSelectedSubcategory, isNearMeActive,
  setIsNearMeActive, urgentCount, totalListingsCount,
}) => {
  const currentCategoryInfo = selectedCategory !== 'all' ? CATEGORIES[selectedCategory] : null;
  const subcategories = currentCategoryInfo?.subcategories ?? [];
  const [accountOpen, setAccountOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => subscribeToAuth(setUser), []);

  return (
    <header className="sticky top-0 z-[1000] border-b border-white/10 bg-slate-950/90 px-3 py-3 shadow-2xl backdrop-blur-xl sm:px-5">
      <div className="mx-auto w-full max-w-6xl space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <button type="button" onClick={() => setAccountOpen(true)} aria-label="Мій акаунт" className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-cyan-300/70 bg-slate-800 shadow-lg hover:scale-105 transition-transform">
              {user?.photoURL ? <img src={user.photoURL} alt="Фото профілю" className="h-full w-full object-cover" /> : <UserRound className="h-5 w-5 text-cyan-300" />}
              <span className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-slate-950 ${user ? 'bg-emerald-400' : 'bg-slate-500'}`} />
            </button>
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 via-indigo-500 to-violet-600 text-lg font-black text-white shadow-lg">П</div>
            <div className="min-w-0">
              <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 shrink-0 text-cyan-300" /><h1 className="truncate text-lg font-black tracking-tight text-white">Помічник онлайн</h1></div>
              <div className="mt-1 flex items-center gap-1.5 text-[11px] font-bold text-emerald-300"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /><span>{user ? 'Акаунт онлайн' : 'Онлайн'}</span><span className="text-slate-500 font-medium">• {totalListingsCount} оголошень</span></div>
            </div>
          </div>
          <button type="button" onClick={() => setIsNearMeActive(!isNearMeActive)} className={`flex shrink-0 items-center gap-1.5 rounded-2xl border px-3 py-2 text-xs font-extrabold transition-all ${isNearMeActive ? 'border-cyan-300 bg-cyan-400 text-slate-950' : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'}`}><MapPin className="h-3.5 w-3.5" /><span>Поруч</span></button>
        </div>

        <div className="relative"><Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-300" /><input type="search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Пошук товарів, послуг, роботи або допомоги…" className="w-full rounded-2xl border border-white/10 bg-white/[0.06] py-3 pl-11 pr-10 text-sm font-medium text-white outline-none transition focus:border-cyan-400/60 focus:bg-white/[0.09] focus:ring-2 focus:ring-cyan-400/10 placeholder:text-slate-500" />{searchQuery && <button type="button" onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"><X className="h-4 w-4" /></button>}</div>

        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto py-0.5">
          <button type="button" onClick={() => { setSelectedCategory('all'); setSelectedSubcategory?.(null); }} className={`shrink-0 rounded-full border px-4 py-2 text-xs font-extrabold transition ${selectedCategory === 'all' ? 'border-white bg-white text-slate-950' : 'border-white/10 bg-white/5 text-slate-300'}`}>Усе</button>
          <button type="button" onClick={() => { setSelectedCategory(selectedCategory === 'urgent' ? 'all' : 'urgent'); setSelectedSubcategory?.(null); }} className={`flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-black ${selectedCategory === 'urgent' ? 'border-rose-300 bg-rose-600 text-white' : 'border-rose-500/20 bg-rose-500/10 text-rose-300'}`}><Siren className="h-3.5 w-3.5" />Терміново{urgentCount > 0 && <span className="rounded-full bg-rose-900 px-1.5 text-white">{urgentCount}</span>}</button>
          {(Object.keys(CATEGORIES) as CategoryId[]).filter((cat) => cat !== 'urgent' && cat !== 'sale').map((catKey) => { const cat = CATEGORIES[catKey]; const selected = selectedCategory === catKey; return <button key={catKey} type="button" onClick={() => { setSelectedCategory(selected ? 'all' : catKey); setSelectedSubcategory?.(null); }} className={`flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-semibold transition ${selected ? 'border-cyan-300 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-950/30' : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'}`}><span>{cat.pinSymbol}</span>{cat.shortLabel}</button>; })}
        </div>

        {subcategories.length > 0 && <div className="no-scrollbar flex items-center gap-2 overflow-x-auto border-t border-white/10 pt-2"><span className="shrink-0 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Підкатегорії</span><button type="button" onClick={() => setSelectedSubcategory?.(null)} className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-extrabold ${!selectedSubcategory ? 'border-cyan-300 bg-cyan-400 text-slate-950' : 'border-white/10 bg-white/5 text-slate-300'}`}>Усі</button>{subcategories.map((sub) => <button key={sub} type="button" onClick={() => setSelectedSubcategory?.(selectedSubcategory === sub ? null : sub)} className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-bold ${selectedSubcategory === sub ? 'border-cyan-300 bg-cyan-400 text-slate-950' : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'}`}>{sub}</button>)}</div>}
      </div>

      {accountOpen && <div className="fixed inset-0 z-[2000] flex items-start justify-center bg-black/70 p-3 pt-16 backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget) setAccountOpen(false); }}><div className="w-full max-w-md max-h-[calc(100vh-80px)] overflow-y-auto"><div className="mb-2 flex justify-end"><button type="button" onClick={() => setAccountOpen(false)} className="rounded-full bg-slate-900/90 p-2 text-slate-300 hover:text-white border border-white/10">✕</button></div><AuthPanel /></div></div>}
    </header>
  );
};