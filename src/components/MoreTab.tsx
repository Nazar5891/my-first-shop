import React, { useState } from 'react';
import { Grid, ChevronRight, Search, Trash2, Siren, FolderTree, Tag, ArrowUpRight } from 'lucide-react';
import { CategoryId, CATEGORIES, Listing } from '../types';
import { AuthPanel } from './AuthPanel';

interface MoreTabProps {
  myListings: Listing[];
  allListings?: Listing[];
  onDeleteListing: (id: string) => Promise<boolean>;
  onSelectCategoryAndSubcategory: (category: CategoryId | 'all', subcategory?: string | null) => void;
}

export const MoreTab: React.FC<MoreTabProps> = ({ myListings, allListings = [], onDeleteListing, onSelectCategoryAndSubcategory }) => {
  const [catalogSearch, setCatalogSearch] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<CategoryId | null>(null);
  const [deletingId, setDeletingId] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const categoryKeys = (Object.keys(CATEGORIES) as CategoryId[]).filter(k => k !== 'sale');
  const filteredCategoryKeys = categoryKeys.filter(k => {
    if (!catalogSearch.trim()) return true;
    const q = catalogSearch.toLowerCase();
    const c = CATEGORIES[k];
    return c.label.toLowerCase().includes(q) || c.shortLabel.toLowerCase().includes(q) || c.subcategories?.some(s => s.toLowerCase().includes(q));
  });

  const handleDelete = async (id: string) => {
    const item = myListings.find(x => x.id === id);
    if (!item) return;
    if (!window.confirm(`Видалити оголошення «${item.title}»?`)) return;
    setDeletingId(id);
    setStatusMessage('');
    const success = await onDeleteListing(id);
    setDeletingId('');
    setStatusMessage(success ? '✅ Оголошення видалено.' : '❌ Не вдалося видалити оголошення.');
  };

  return (
    <div className="space-y-5 pb-24">
      <AuthPanel />

      <div className="bg-gradient-to-r from-purple-950 via-slate-950 to-indigo-950 rounded-3xl p-5 border border-purple-800/40 shadow-2xl space-y-3">
        <div className="flex items-center justify-between"><div className="flex items-center gap-2 text-violet-300 font-extrabold text-sm"><FolderTree className="w-5 h-5 text-cyan-400" /><span className="uppercase tracking-wider text-xs">Каталог розділів та категорій</span></div><span className="bg-cyan-950 text-cyan-300 border border-cyan-800/50 text-[10px] font-black px-2.5 py-0.5 rounded-full">{categoryKeys.length} Розділів</span></div>
        <h2 className="text-xl font-black text-white">Усі категорії та підкатегорії громади</h2>
        <div className="relative"><Search className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2" /><input value={catalogSearch} onChange={e => setCatalogSearch(e.target.value)} placeholder="Шукати категорію або підрозділ" className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 text-slate-100 text-xs rounded-2xl border border-purple-800/50 outline-none" /></div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between px-1"><span className="text-xs font-extrabold uppercase tracking-widest text-purple-300/80 flex items-center gap-1.5"><Grid className="w-4 h-4 text-purple-400" />Розділи та підрозділи</span><button onClick={() => onSelectCategoryAndSubcategory('all', null)} className="text-xs font-bold text-cyan-400 underline flex items-center gap-1">Всі оголошення<ArrowUpRight className="w-3.5 h-3.5" /></button></div>
        <div className="grid grid-cols-1 gap-2.5">
          {filteredCategoryKeys.map(catKey => {
            const cat = CATEGORIES[catKey];
            const expanded = expandedCategory === catKey || Boolean(catalogSearch.trim());
            const subs = cat.subcategories || [];
            const count = allListings.filter(l => l.category === catKey).length;
            return <div key={catKey} className="rounded-2xl border bg-slate-900/80 border-purple-900/40 overflow-hidden">
              <div className="p-3.5 flex items-center justify-between gap-3"><button onClick={() => onSelectCategoryAndSubcategory(catKey, null)} className="flex items-center gap-3 text-left flex-1"><div className="w-10 h-10 rounded-xl bg-slate-950 border border-purple-800/50 flex items-center justify-center text-lg">{cat.pinSymbol}</div><div><h3 className="text-sm font-black text-slate-100">{cat.label}</h3><p className="text-[11px] text-purple-300/70">{subs.length} підрозділів · {count} оголошень</p></div></button>{subs.length > 0 && <button onClick={() => setExpandedCategory(expanded ? null : catKey)} className="p-2 text-purple-400 rounded-xl bg-slate-950/60 border border-purple-900/40"><ChevronRight className={`w-4 h-4 ${expanded ? 'rotate-90 text-cyan-400' : ''}`} /></button>}</div>
              {expanded && subs.length > 0 && <div className="px-3.5 pb-3.5 pt-1 border-t border-purple-900/30 grid grid-cols-1 sm:grid-cols-2 gap-1.5">{subs.map(sub => <button key={sub} onClick={() => onSelectCategoryAndSubcategory(catKey, sub)} className="p-2 rounded-xl bg-slate-900 border border-purple-900/40 text-left flex items-center gap-2"><Tag className="w-3.5 h-3.5 text-cyan-400" /><span className="text-xs font-bold text-slate-200">{sub}</span></button>)}</div>}
            </div>;
          })}
        </div>
      </div>

      <div className="bg-slate-900/90 p-5 rounded-3xl border border-rose-900/40 space-y-3 shadow-xl">
        <div className="flex items-center justify-between gap-2"><div className="flex items-center gap-2 text-slate-100 font-extrabold text-sm"><Trash2 className="w-5 h-5 text-rose-400" /><span>Мої оголошення</span></div><span className="text-[10px] font-black px-2 py-1 rounded-full bg-rose-950 text-rose-300 border border-rose-800/50">{myListings.length}</span></div>
        <p className="text-xs text-purple-200/70">Тут показані тільки ваші оголошення. Для кожного є окрема кнопка видалення — без SMS-кодів.</p>
        {statusMessage && <div className="p-3 bg-slate-950 rounded-xl text-xs font-bold text-purple-200 border border-purple-800/50">{statusMessage}</div>}
        {myListings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-purple-800/50 bg-slate-950/60 p-5 text-center">
            <div className="text-2xl mb-2">📭</div>
            <div className="text-sm font-extrabold text-slate-200">Ваших оголошень поки немає</div>
            <div className="text-xs text-purple-300/70 mt-1">Створіть оголошення — воно автоматично з'явиться тут.</div>
          </div>
        ) : (
          <div className="space-y-2">
            {myListings.map(item => (
              <div key={item.id} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-950 border border-purple-900/40">
                <div className="min-w-0 flex-1"><div className="text-sm font-extrabold text-white truncate">{item.title}</div><div className="text-[11px] text-purple-300/70 truncate">{item.pay} · {item.locationName}</div></div>
                <button type="button" disabled={deletingId === item.id} onClick={() => handleDelete(item.id)} className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-black shadow-lg" aria-label={`Видалити ${item.title}`} title="Видалити моє оголошення"><Trash2 className="w-3.5 h-3.5" />{deletingId === item.id ? '…' : 'Видалити'}</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-slate-900/90 p-5 rounded-3xl border border-purple-900/40 space-y-3"><div className="flex items-center gap-2 text-slate-100 font-extrabold text-sm"><Siren className="w-5 h-5 text-rose-500" /><span>Екстрені служби Рокитнівської громади</span></div><div className="grid grid-cols-2 gap-2 text-xs font-bold">{[['101','ДСНС'],['102','Поліція'],['103','Швидка'],['104','Аварійна']].map(([num,name]) => <a key={num} href={`tel:${num}`} className="p-2.5 bg-slate-950 rounded-xl border border-purple-900/40 flex items-center justify-between"><span>{name}</span><span className="text-cyan-400 font-mono">{num}</span></a>)}</div></div>
    </div>
  );
};
