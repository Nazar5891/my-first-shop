import React, { useState } from 'react';
import { X, Flag, CheckCircle2 } from 'lucide-react';
import { Listing } from '../types';

interface ReportModalProps {
  listing: Listing | null;
  onClose: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({ listing, onClose }) => {
  const [reason, setReason] = useState('spam');
  const [submitted, setSubmitted] = useState(false);

  if (!listing) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-sm bg-slate-950/95 backdrop-blur-2xl text-slate-100 rounded-3xl shadow-2xl border border-purple-900/50 overflow-hidden p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-purple-900/40 pb-3">
          <div className="flex items-center gap-2 text-rose-400 font-extrabold text-xs uppercase tracking-widest">
            <Flag className="w-4 h-4 text-rose-400" />
            <span>Скарга на оголошення</span>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-900 text-purple-300 border border-purple-800/40 flex items-center justify-center font-bold">
            <X className="w-4 h-4" />
          </button>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-3">
            <p className="text-xs text-purple-200/80 font-medium">
              Оберіть причину скарги для захисту громади від спаму та нечесних пропозицій:
            </p>

            <div className="space-y-1.5 text-xs font-semibold text-slate-200">
              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-purple-900/40 bg-slate-900/80 hover:bg-slate-900 cursor-pointer">
                <input type="radio" name="reason" value="spam" checked={reason === 'spam'} onChange={() => setReason('spam')} className="accent-rose-500" />
                <span>Спам або неактуальне пропозиція</span>
              </label>
              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-purple-900/40 bg-slate-900/80 hover:bg-slate-900 cursor-pointer">
                <input type="radio" name="reason" value="phone" checked={reason === 'phone'} onChange={() => setReason('phone')} className="accent-rose-500" />
                <span>Неправильний / вимкнений номер телефону</span>
              </label>
              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-purple-900/40 bg-slate-900/80 hover:bg-slate-900 cursor-pointer">
                <input type="radio" name="reason" value="scam" checked={reason === 'scam'} onChange={() => setReason('scam')} className="accent-rose-500" />
                <span>Підозра на шахрайство або вимога авансу</span>
              </label>
              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-purple-900/40 bg-slate-900/80 hover:bg-slate-900 cursor-pointer">
                <input type="radio" name="reason" value="offensive" checked={reason === 'offensive'} onChange={() => setReason('offensive')} className="accent-rose-500" />
                <span>Нененалежний зміст або образи</span>
              </label>
            </div>

            <button type="submit" className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-rose-950/80 transition-all">
              Надіслати скаргу
            </button>
          </form>
        ) : (
          <div className="py-6 text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 text-purple-400 mx-auto animate-bounce" />
            <h4 className="font-extrabold text-slate-100 text-sm">Скаргу відправлено!</h4>
            <p className="text-xs text-purple-200/70 font-medium">Дякуємо за допомогу в підтримці порядку у громаді.</p>
          </div>
        )}
      </div>
    </div>
  );
};
