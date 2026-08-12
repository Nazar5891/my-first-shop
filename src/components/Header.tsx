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
  const subcategories = currentCategoryInfo?.subcategories;

  return (
    <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-2xl border-b border-white/10 shadow-2xl px-3 py-3 sm:px-4">
      <div className="max-w-5xl mx-auto space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-11 h-11 shrink-0 rounded-2xl bg-gradient-to-br from-violet-500 via-indigo-500 to-cyan-400 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-950/60">
              П
              <span className="absolute -right-0.5 -bottom-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-slate-950" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-black text-white text-lg leading-tight tracking-tight">Помічник</h1>
                <span className="hidden sm:inline-flex bg-white/5 text-slate-300 text-[9px] font-bold px-2 py-1 rounded-full border border-white/10 uppercase tracking-widest">Рівненщина</span>
              </div>
              <p className="text-[11px] font-bold text-emerald-300 flex items-center gap-1.5 leading-none mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Помічник онлайн
                <span className="text-slate-500 font-medium">• {totalListingsCount} оголошень</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsNearMeActive(!isNearMeActive)}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold transition-all duration-200 border ${
              isNearMeActive
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-violet-400 shadow-lg shadow-indigo-950/60'
                : 'bg-white/5 text-slate-200 hover:bg-white/10 border-white/10'
            }`}
          >
            <MapPin className={`w-3.5 h-3.5 ${isNearMeActive ? 'animate-bounce text-white' : 'text-cyan-300'}`} />
            <span>Поруч</span>
            {isNearMeActive && <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-ping" />}
          </button>
        </div>

        <div className="relative flex items-center">
          <div className="absolute left-4 text-cyan-300 pointer-events-none"><Search className="w-4 h-4" /></div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Знайти товар, послугу, роботу або допомогу…"
            className="w-full pl-11 pr-10 py-3 text-sm bg-white/5 hover:bg-white/[0.07] focus:bg-slate-900/80 text-white placeholder-slate-500 rounded-2xl border border-white/10 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/10 outline-none transition-all font-medium"
          />
          {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-3 text-slate-400 hover:text-white p-1"><X className="w-4 h-4" /></button>}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1">
          <button onClick={() => { setSelectedCategory('all'); setSelectedSubcategory?.(null); }} className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition-all ${selectedCategory === 'all' ? 'bg-white text-slate-950 border-white shadow-md' : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'}`}>Всі</button>
          <button onClick={() => { setSelectedCategory(selectedCategory === 'urgent' ? 'all' : 'urgent'); setSelectedSubcategory?.(null); }} className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap border transition-all ${selectedCategory === 'urgent' ? 'bg-rose-600 text-white border-rose-400' : 'bg-rose-500/10 text-rose-300 border-rose-500/20'}`}>
            <Siren className="w-3.5 h-3.5" /><span>Терміново</span>{urgentCount > 0 && <span className="bg-rose-600 text-white px-1.5 rounded-full">{urgentCount}</span>}
          </button>
          {(Object.keys(CATEGORIES) as CategoryId[]).filter((cat) => cat !== 'urgent' && cat !== 'sale').map((catKey) => {
            const cat = CATEGORIES[catKey];
            const isSelected = selectedCategory === catKey;
            return <button key={catKey} onClick={() => { setSelectedCategory(isSelected ? 'all' : catKey); setSelectedSubcategory?.(null); }} className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all ${isSelected ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-violet-400 shadow-md' : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'}`}><span>{cat.pinSymbol}</span><span>{cat.shortLabel}</span></button>;
          })}
        </div>

        {subcategories && subcategories.length > 0 && <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-2 pb-1 border-t border-white/10 animate-fade-in">
          <span className="text-[10px] uppercase font-extrabold text-slate-500 shrink-0 mr-1">Підкатегорії</span>
          <button onClick={() => setSelectedSubcategory?.(null)} className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold whitespace-nowrap border ${!selectedSubcategory ? 'bg-cyan-500 text-slate-950 border-cyan-300' : 'bg-white/5 text-slate-300 border-white/10'}`}>Всі</button>
          {subcategories.map((sub) => <button key={sub} onClick={() => setSelectedSubcategory?.(selectedSubcategory === sub ? null : sub)} className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap border transition-all ${selectedSubcategory === sub ? 'bg-cyan-400 text-slate-950 border-cyan-300' : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'}`}>{sub}</button>)}
        </div>}
      </div>
    </header>
  );
};
