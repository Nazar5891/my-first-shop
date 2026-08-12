import React, { useState } from 'react';
import {
  Grid,
  ChevronRight,
  Search,
  Trash2,
  Siren,
  FolderTree,
  Tag,
  ArrowUpRight,
} from 'lucide-react';
import { CategoryId, CATEGORIES, Listing } from '../types';

interface MoreTabProps {
  myListings: Listing[];
  allListings?: Listing[];
  onDeleteListing: (id: string, code: string) => boolean;
  onSelectCategoryAndSubcategory: (category: CategoryId | 'all', subcategory?: string | null) => void;
}

export const MoreTab: React.FC<MoreTabProps> = ({
  myListings,
  allListings = [],
  onDeleteListing,
  onSelectCategoryAndSubcategory,
}) => {
  const [catalogSearch, setCatalogSearch] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<CategoryId | null>(null);

  // Manage listings state
  const [deleteCode, setDeleteCode] = useState('');
  const [deleteListingId, setDeleteListingId] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const handleDelete = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deleteListingId) {
      setStatusMessage('Оберіть оголошення для видалення');
      return;
    }
    const success = onDeleteListing(deleteListingId, deleteCode);
    if (success) {
      setStatusMessage('✅ Оголошення успішно видалено!');
      setDeleteCode('');
    } else {
      setStatusMessage('❌ Невірний код видалення. Перевірте код з SMS.');
    }
  };

  const categoryKeys = (Object.keys(CATEGORIES) as CategoryId[]).filter(
    (k) => k !== 'sale'
  );

  // Filter categories by catalog search query
  const filteredCategoryKeys = categoryKeys.filter((catKey) => {
    const cat = CATEGORIES[catKey];
    if (!catalogSearch.trim()) return true;
    const q = catalogSearch.toLowerCase();
    const titleMatch = cat.label.toLowerCase().includes(q) || cat.shortLabel.toLowerCase().includes(q);
    const subMatch = cat.subcategories?.some((s) => s.toLowerCase().includes(q));
    return titleMatch || subMatch;
  });

  // Calculate count of listings per category
  const getCategoryCount = (catId: CategoryId) => {
    return allListings.filter((l) => l.category === catId).length;
  };

  // Calculate count per subcategory
  const getSubcategoryCount = (catId: CategoryId, sub: string) => {
    return allListings.filter((l) => l.category === catId && l.subcategory === sub).length;
  };

  return (
    <div className="space-y-5 pb-24">
      {/* CATALOG / DIRECTORY HEADER */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-950 to-indigo-950 rounded-3xl p-5 border border-purple-800/40 shadow-2xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-violet-300 font-extrabold text-sm">
            <FolderTree className="w-5 h-5 text-cyan-400" />
            <span className="uppercase tracking-wider text-xs">Каталог розділів та категорій</span>
          </div>
          <span className="bg-cyan-950 text-cyan-300 border border-cyan-800/50 text-[10px] font-black px-2.5 py-0.5 rounded-full">
            {categoryKeys.length} Розділів
          </span>
        </div>

        <h2 className="text-xl font-black text-white">
          Усі категорії та підкатегорії громади
        </h2>

        {/* Search within Catalog */}
        <div className="relative">
          <Search className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={catalogSearch}
            onChange={(e) => setCatalogSearch(e.target.value)}
            placeholder="Шукати категорію або підрозділ (дрова, підвіз, сантехніка...)"
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 text-slate-100 text-xs font-medium rounded-2xl border border-purple-800/50 focus:border-cyan-400 outline-none transition-all placeholder-purple-300/40"
          />
        </div>
      </div>

      {/* CATEGORIES & SUBCATEGORIES ACCORDION/GRID */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-extrabold uppercase tracking-widest text-purple-300/80 flex items-center gap-1.5">
            <Grid className="w-4 h-4 text-purple-400" />
            <span>Розділи та підрозділи</span>
          </span>
          <button
            onClick={() => onSelectCategoryAndSubcategory('all', null)}
            className="text-xs font-bold text-cyan-400 hover:text-cyan-300 underline flex items-center gap-1"
          >
            <span>Всі оголошення</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {filteredCategoryKeys.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/80 rounded-3xl border border-purple-900/40 space-y-2">
            <p className="text-sm font-bold text-slate-200">Категорію за цим запитом не знайдено</p>
            <button
              onClick={() => setCatalogSearch('')}
              className="text-xs font-bold text-purple-400 underline"
            >
              Скинути пошук
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5">
            {filteredCategoryKeys.map((catKey) => {
              const cat = CATEGORIES[catKey];
              const isExpanded = expandedCategory === catKey || Boolean(catalogSearch.trim());
              const count = getCategoryCount(catKey);
              const subs = cat.subcategories || [];

              return (
                <div
                  key={catKey}
                  className={`rounded-2xl border transition-all overflow-hidden ${
                    isExpanded
                      ? 'bg-slate-900/95 border-purple-500/60 shadow-xl ring-1 ring-purple-500/20'
                      : 'bg-slate-900/80 border-purple-900/40 hover:border-purple-700/60'
                  }`}
                >
                  {/* Category Header Row */}
                  <div className="p-3.5 flex items-center justify-between gap-3">
                    <button
                      onClick={() => onSelectCategoryAndSubcategory(catKey, null)}
                      className="flex items-center gap-3 text-left flex-1 group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-slate-950 border border-purple-800/50 flex items-center justify-center text-lg shrink-0 group-hover:scale-105 transition-transform shadow-md">
                        {cat.pinSymbol}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-black text-slate-100 group-hover:text-cyan-300 transition-colors">
                            {cat.label}
                          </h3>
                          {catKey === 'urgent' && (
                            <span className="bg-rose-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full animate-pulse">
                              ВАЖЛИВО
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-purple-300/70 font-medium">
                          {subs.length > 0 ? `${subs.length} підрозділів` : 'Основна категорія'}
                        </p>
                      </div>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onSelectCategoryAndSubcategory(catKey, null)}
                        className="px-2.5 py-1 bg-purple-950/80 hover:bg-purple-900 text-purple-200 text-xs font-extrabold rounded-xl border border-purple-800/60 transition-all flex items-center gap-1"
                      >
                        <span>{count}</span>
                        <ArrowUpRight className="w-3 h-3 text-purple-400" />
                      </button>

                      {subs.length > 0 && (
                        <button
                          onClick={() => setExpandedCategory(isExpanded ? null : catKey)}
                          className="p-2 text-purple-400 hover:text-white rounded-xl bg-slate-950/60 border border-purple-900/40 transition-colors"
                          title="Показати підкатегорії"
                        >
                          <ChevronRight
                            className={`w-4 h-4 transition-transform duration-200 ${
                              isExpanded ? 'rotate-90 text-cyan-400' : ''
                            }`}
                          />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Subcategories Grid */}
                  {isExpanded && subs.length > 0 && (
                    <div className="px-3.5 pb-3.5 pt-1 border-t border-purple-900/30 bg-slate-950/50 space-y-1.5 animate-fade-in">
                      <span className="text-[10px] font-black text-purple-300/60 uppercase tracking-widest block py-1">
                        Підрозділи:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {subs.map((sub) => {
                          const subCount = getSubcategoryCount(catKey, sub);
                          return (
                            <button
                              key={sub}
                              onClick={() => onSelectCategoryAndSubcategory(catKey, sub)}
                              className="p-2 rounded-xl bg-slate-900/90 hover:bg-purple-950/80 border border-purple-900/40 hover:border-cyan-500/50 text-left transition-all flex items-center justify-between group"
                            >
                              <div className="flex items-center gap-2 overflow-hidden">
                                <Tag className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                                <span className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 truncate">
                                  {sub}
                                </span>
                              </div>
                              {subCount > 0 && (
                                <span className="text-[10px] font-extrabold bg-purple-950 text-purple-300 px-2 py-0.5 rounded-md border border-purple-800/40 shrink-0 ml-1">
                                  {subCount}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MANAGE MY LISTINGS / DELETE SECTION */}
      <div className="bg-slate-900/90 p-5 rounded-3xl border border-purple-900/40 space-y-3 shadow-xl">
        <div className="flex items-center gap-2 text-slate-100 font-extrabold text-sm">
          <Trash2 className="w-5 h-5 text-rose-400" />
          <span>Керування / Видалення моїх оголошень</span>
        </div>

        <p className="text-xs text-purple-200/70 font-medium">
          Видаліть виконане оголошення за допомогою вашого коду з SMS:
        </p>

        {statusMessage && (
          <div className="p-3 bg-slate-950 rounded-xl text-xs font-bold text-purple-200 border border-purple-800/50">
            {statusMessage}
          </div>
        )}

        <form onSubmit={handleDelete} className="space-y-3">
          <div className="space-y-1">
            <label className="text-[11px] font-extrabold text-purple-300/80 uppercase tracking-widest block">
              Оберіть ваше оголошення:
            </label>
            <select
              value={deleteListingId}
              onChange={(e) => setDeleteListingId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-purple-900/50 font-bold text-slate-100 text-xs bg-slate-950 outline-none"
            >
              <option value="" className="bg-slate-950 text-slate-200">
                -- Оберіть зі списку --
              </option>
              {myListings.map((item) => (
                <option key={item.id} value={item.id} className="bg-slate-950 text-slate-200">
                  {item.title} ({item.pay})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-extrabold text-purple-300/80 uppercase tracking-widest block">
              Код видалення (із SMS):
            </label>
            <input
              type="text"
              required
              value={deleteCode}
              onChange={(e) => setDeleteCode(e.target.value)}
              placeholder="Введіть код видалення (напр. 8899)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-purple-900/50 font-bold text-slate-100 text-xs bg-slate-950 outline-none placeholder-purple-300/40"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all"
          >
            Видалити оголошення
          </button>
        </form>
      </div>

      {/* EMERGENCY COMMUNITY CONTACTS */}
      <div className="bg-slate-900/90 p-5 rounded-3xl border border-purple-900/40 space-y-3">
        <div className="flex items-center gap-2 text-slate-100 font-extrabold text-sm">
          <Siren className="w-5 h-5 text-rose-500" />
          <span>Екстрені служби Рокитнівської громади</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs font-bold">
          <a
            href="tel:101"
            className="p-2.5 bg-slate-950 rounded-xl border border-purple-900/40 hover:bg-purple-950/40 transition-colors flex items-center justify-between"
          >
            <span>🚒 ДСНС</span>
            <span className="text-rose-400 font-mono">101</span>
          </a>
          <a
            href="tel:102"
            className="p-2.5 bg-slate-950 rounded-xl border border-purple-900/40 hover:bg-purple-950/40 transition-colors flex items-center justify-between"
          >
            <span>🚓 Поліція</span>
            <span className="text-cyan-400 font-mono">102</span>
          </a>
          <a
            href="tel:103"
            className="p-2.5 bg-slate-950 rounded-xl border border-purple-900/40 hover:bg-purple-950/40 transition-colors flex items-center justify-between"
          >
            <span>🏥 Швидка</span>
            <span className="text-purple-300 font-mono">103</span>
          </a>
          <a
            href="tel:104"
            className="p-2.5 bg-slate-950 rounded-xl border border-purple-900/40 hover:bg-purple-950/40 transition-colors flex items-center justify-between"
          >
            <span>⚡ Аварійна</span>
            <span className="text-amber-400 font-mono">104</span>
          </a>
        </div>
      </div>
    </div>
  );
};
