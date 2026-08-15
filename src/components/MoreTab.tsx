import React, { useState } from 'react';
import { Trash2, X } from 'lucide-react';
import { Listing } from '../types';
import { AuthPanel } from './AuthPanel';

interface MoreTabProps {
  myListings: Listing[];
  allListings?: Listing[];
  onDeleteListing: (id: string) => Promise<boolean>;
  onSelectCategoryAndSubcategory: (category: any, subcategory?: string | null) => void;
}

export const MoreTab: React.FC<MoreTabProps> = ({ myListings, onDeleteListing }) => {
  const [deletingId, setDeletingId] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

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

  const closeAccount = () => window.dispatchEvent(new Event('meister-close-account'));

  return (
    <div className="space-y-5 pb-24">
      <div className="sticky top-0 z-30 -mx-1 px-1 pt-1 pb-2 bg-slate-950/80 backdrop-blur-xl">
        <div className="flex items-center justify-between rounded-2xl border border-purple-800/50 bg-slate-950/95 px-4 py-3 shadow-xl">
          <div className="text-base font-black text-white">Мій акаунт</div>
          <button type="button" onClick={closeAccount} aria-label="Закрити Мій акаунт" title="Закрити" className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-800 hover:bg-slate-700 active:scale-95 text-white border border-purple-700/50">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <AuthPanel />

      <section className="bg-slate-900/95 rounded-3xl p-5 border-2 border-cyan-800/50 shadow-2xl space-y-3" aria-label="Мої оголошення">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-white font-black text-base">
            <span className="text-xl">📋</span>
            <span>Мої оголошення</span>
          </div>
          <span className="min-w-8 text-center text-xs font-black px-2 py-1 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700/60">
            {myListings.length}
          </span>
        </div>
        <p className="text-xs text-slate-300/80">Ваші оголошення прив'язані до цього Google-акаунта.</p>
        {statusMessage && (
          <div className="p-3 bg-emerald-950/60 rounded-xl text-xs font-bold text-emerald-300 border border-emerald-700/50">
            {statusMessage}
          </div>
        )}
        {myListings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-cyan-800/50 bg-slate-950/70 p-5 text-center">
            <div className="text-2xl mb-2">📭</div>
            <div className="text-sm font-extrabold text-white">Поки немає оголошень</div>
            <div className="text-xs text-slate-400 mt-1">Опубліковані вами оголошення автоматично з'являться тут.</div>
          </div>
        ) : (
          <div className="space-y-2">
            {myListings.map(item => (
              <div key={item.id} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-950 border border-cyan-900/40">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-extrabold text-white truncate">{item.title}</div>
                  <div className="text-[11px] text-cyan-300/70 truncate">{item.pay} · {item.locationName}</div>
                </div>
                <button type="button" disabled={deletingId === item.id} onClick={() => handleDelete(item.id)} className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-black shadow-lg">
                  <Trash2 className="w-3.5 h-3.5" />
                  {deletingId === item.id ? '…' : 'Видалити'}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
