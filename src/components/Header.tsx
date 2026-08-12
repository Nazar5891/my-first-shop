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
    <header className="sticky top-0 z-30 bg-slate-950/85 backdrop-blur-xl border-b border-purple-900/40 shadow-xl px-3 py-2.5 sm:px-4">
      <div className="max-w-4xl mx-auto space-y-2">
        {/* Top bar: Brand + "Поруч зі мною" toggle */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-700 via-indigo-600 to-violet-500 text-white flex items-center justify-center font-black text-lg shadow-lg shadow-purple-900/50 ring-2 ring-purple-500/40">
              П
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-black text-slate-100 text-base leading-tight tracking-tight">
                  Помічник
                </h1>
                <span className="bg-purple-950/90 text-purple-300 text-[10px] font-bold px-2 py-0.5 rounded-md border border-purple-800/50 uppercase tracking-widest">
                  Рівненщина
                </span>
              </div>
              <p className="text-[11px] font-medium text-purple-300/70 leading-none">
                Карта пропозицій, підвозу та товарів ({totalListingsCount})
              </p>
            </div>
          </div>

          {/* Near Me Quick Toggle Button */}
          <button
            onClick={() => setIsNearMeActive(!isNearMeActive)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 shadow-sm border ${
              isNearMeActive
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-500 ring-2 ring-purple-500/40 shadow-purple-950/50'
                : 'bg-slate-900/80 text-purple-200 hover:bg-purple-950/60 border-purple-900/40'
            }`}
          >
            <MapPin className={`w-3.5 h-3.5 ${isNearMeActive ? 'animate-bounce text-white' : 'text-purple-400'}`} />
            <span>📍 Поруч зі мною</span>
            {isNearMeActive && (
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            )}
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative flex items-center">
          <div className="absolute left-3.5 text-purple-400 pointer-events-none">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Що шукаєте? (підвіз до Рівного, молоко, газоблок, Starlink...)"
            className="w-full pl-10 pr-9 py-2 text-sm bg-slate-900/90 hover:bg-slate-900 focus:bg-slate-950 text-slate-100 placeholder-purple-300/40 rounded-xl border border-purple-900/50 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 outline-none transition-all font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 text-purple-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Categories horizontal filter bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1">
          {/* All Filter button */}
          <button
            onClick={() => {
              setSelectedCategory('all');
              if (setSelectedSubcategory) setSelectedSubcategory(null);
            }}
            className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
              selectedCategory === 'all'
                ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-950/60'
                : 'bg-slate-900/80 text-purple-200/80 hover:bg-purple-950/60 border-purple-900/40'
            }`}
          >
            Всі
          </button>

          {/* Urgent category highlight pill */}
          <button
            onClick={() => {
              setSelectedCategory(selectedCategory === 'urgent' ? 'all' : 'urgent');
              if (setSelectedSubcategory) setSelectedSubcategory(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black whitespace-nowrap transition-all border ${
              selectedCategory === 'urgent'
                ? 'bg-rose-600 text-white border-rose-500 ring-2 ring-rose-500/40 shadow-rose-950/60 animate-pulse'
                : 'bg-rose-950/60 text-rose-300 hover:bg-rose-900/80 border-rose-800/50'
            }`}
          >
            <Siren className="w-3.5 h-3.5 text-rose-400 animate-bounce" />
            <span>🔴 Терміново</span>
            {urgentCount > 0 && (
              <span className="ml-0.5 bg-rose-600 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {urgentCount}
              </span>
            )}
          </button>

          {/* Other Categories */}
          {(Object.keys(CATEGORIES) as CategoryId[])
            .filter((cat) => cat !== 'urgent' && cat !== 'sale')
            .map((catKey) => {
              const cat = CATEGORIES[catKey];
              const isSelected = selectedCategory === catKey;
              return (
                <button
                  key={catKey}
                  onClick={() => {
                    setSelectedCategory(isSelected ? 'all' : catKey);
                    if (setSelectedSubcategory) setSelectedSubcategory(null);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                    isSelected
                      ? `bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-950/60 font-bold ring-2 ring-purple-500/30`
                      : `bg-slate-900/80 text-purple-200/90 hover:bg-purple-950/60 border-purple-900/40`
                  }`}
                >
                  <span>{cat.pinSymbol}</span>
                  <span>{cat.shortLabel}</span>
                </button>
              );
            })}
        </div>

        {/* Subcategories Bar (if current category has subcategories) */}
        {subcategories && subcategories.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 pb-0.5 border-t border-purple-900/30 animate-fade-in">
            <span className="text-[10px] uppercase font-extrabold text-purple-300/60 shrink-0 mr-1">
              Підкатегорії:
            </span>
            <button
              onClick={() => setSelectedSubcategory && setSelectedSubcategory(null)}
              className={`px-2.5 py-0.5 rounded-lg text-[11px] font-extrabold whitespace-nowrap transition-all border ${
                !selectedSubcategory
                  ? 'bg-cyan-600 text-white border-cyan-400 shadow-sm'
                  : 'bg-slate-900/90 text-purple-200 hover:bg-purple-950 border-purple-900/50'
              }`}
            >
              Всі у розділі
            </button>
            {subcategories.map((sub) => {
              const isSubSelected = selectedSubcategory === sub;
              return (
                <button
                  key={sub}
                  onClick={() =>
                    setSelectedSubcategory &&
                    setSelectedSubcategory(isSubSelected ? null : sub)
                  }
                  className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all border ${
                    isSubSelected
                      ? 'bg-cyan-500 text-slate-950 border-cyan-300 font-extrabold shadow-md'
                      : 'bg-slate-900/90 text-purple-200/90 hover:bg-purple-900/60 border-purple-900/50'
                  }`}
                >
                  {sub}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
};
