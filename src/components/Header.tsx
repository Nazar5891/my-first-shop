import React from 'react';
import { Search, MapPin, X, Siren } from 'lucide-react';
import { CategoryId, CATEGORIES } from '../types';

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
  onOpenUrgentFilter?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  selectedSubcategory,
  setSelectedSubcategory,
  isNearMeActive,
  setIsNearMeActive,
  urgentCount,
  totalListingsCount,
}) => {
  const currentCategoryInfo = selectedCategory !== 'all' ? CATEGORIES[selectedCategory] : null;
  const subcategories = currentCategoryInfo?.subcategories ?? [];

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#090b12]/95 px-3 py-3 shadow-xl backdrop-blur-2xl sm:px-5">
      <div className="mx-auto w-full max-w-6xl space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 via-indigo-500 to-violet-600 text-lg font-black text-white shadow-lg shadow-indigo-950/50">
              П
              <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#090b12] bg-emerald-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-lg font-black leading-tight tracking-tight text-white">Помічник</h1>
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-[11px] font-bold leading-none text-emerald-300">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                <span>Помічник онлайн</span>
                <span className="text-slate-500 font-medium">• {totalListingsCount} оголошень</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsNearMeActive(!isNearMeActive)}
            className={`flex shrink-0 items-center gap-1.5 rounded-2xl border px-3 py-2 text-xs font-extrabold transition-all ${
              isNearMeActive
                ? 'border-cyan-300 bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-950/30'
                : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
            }`}
          >
            <MapPin className="h-3.5 w-3.5" />
            <span>Поруч</span>
          </button>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-300" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Знайти товар, послугу, роботу або допомогу…"
            className="w-full rounded-2xl border border-white/10 bg-white/[0.06] py-3 pl-11 pr-10 text-sm font-medium text-white outline-none transition-all placeholder:text-slate-500 focus:border-cyan-400/60 focus:bg-white/[0.09] focus:ring-2 focus:ring-cyan-400/10"
          />
          {searchQuery && (
            <button type="button" onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto py-0.5">
          <button type="button" onClick={() => { setSelectedCategory('all'); setSelectedSubcategory?.(null); }} className={`shrink-0 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all ${selectedCategory === 'all' ? 'border-white bg-white text-slate-950 shadow-md' : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'}`}>Всі</button>
          <button type="button" onClick={() => { setSelectedCategory(selectedCategory === 'urgent' ? 'all' : 'urgent'); setSelectedSubcategory?.(null); }} className={`flex shrink-0 items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-black transition-all ${selectedCategory === 'urgent' ? 'border-rose-300 bg-rose-600 text-white' : 'border-rose-500/20 bg-rose-500/10 text-rose-300'}`}>
            <Siren className="h-3.5 w-3.5" /><span>Терміново</span>{urgentCount > 0 && <span className="rounded-full bg-rose-800 px-1.5 text-white">{urgentCount}</span>}
          </button>
          {(Object.keys(CATEGORIES) as CategoryId[]).filter((cat) => cat !== 'urgent' && cat !== 'sale').map((catKey) => {
            const cat = CATEGORIES[catKey];
            const isSelected = selectedCategory === catKey;
            return (
              <button key={catKey} type="button" onClick={() => { setSelectedCategory(isSelected ? 'all' : catKey); setSelectedSubcategory?.(null); }} className={`flex shrink-0 items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all ${isSelected ? 'border-cyan-300 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md' : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'}`}>
                <span>{cat.pinSymbol}</span><span>{cat.shortLabel}</span>
              </button>
            );
          })}
        </div>

        {subcategories.length > 0 && (
          <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto border-t border-white/10 pt-2 pb-0.5">
            <span className="mr-1 shrink-0 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Підкатегорії</span>
            <button type="button" onClick={() => setSelectedSubcategory?.(null)} className={`shrink-0 rounded-xl border px-3 py-1.5 text-[11px] font-extrabold ${!selectedSubcategory ? 'border-cyan-300 bg-cyan-400 text-slate-950' : 'border-white/10 bg-white/5 text-slate-300'}`}>Всі</button>
            {subcategories.map((sub) => (
              <button key={sub} type="button" onClick={() => setSelectedSubcategory?.(selectedSubcategory === sub ? null : sub)} className={`shrink-0 rounded-xl border px-3 py-1.5 text-[11px] font-bold transition-all ${selectedSubcategory === sub ? 'border-cyan-300 bg-cyan-400 text-slate-950' : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'}`}>{sub}</button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
};
