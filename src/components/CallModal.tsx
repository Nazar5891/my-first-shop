import React, { useState } from 'react';
import { X, Phone, Copy, Check, ShieldCheck } from 'lucide-react';
import { Listing } from '../types';
import { formatPhoneDisplay } from '../utils/distance';

interface CallModalProps {
  listing: Listing | null;
  onClose: () => void;
}

export const CallModal: React.FC<CallModalProps> = ({ listing, onClose }) => {
  if (!listing) return null;

  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(listing.phone);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-sm bg-slate-950/95 backdrop-blur-2xl text-slate-100 rounded-3xl shadow-2xl border border-purple-900/50 overflow-hidden p-5 space-y-4">
        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-purple-900/40 pb-3">
          <div className="flex items-center gap-2 text-purple-300 font-extrabold text-xs uppercase tracking-widest">
            <Phone className="w-4 h-4 text-purple-400" />
            <span>Дзвінок земляку</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-900 text-purple-300 border border-purple-800/40 flex items-center justify-center font-bold"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Listing Context */}
        <div className="bg-slate-900/90 p-3 rounded-2xl border border-purple-900/40 space-y-1">
          <span className="text-[10px] font-extrabold text-purple-400/80 uppercase">Оголошення</span>
          <h4 className="font-extrabold text-slate-100 text-sm line-clamp-1">{listing.title}</h4>
          <p className="text-xs font-bold text-violet-300">{listing.pay}</p>
        </div>

        {/* Big Phone Number Display */}
        <div className="text-center space-y-2 py-2">
          <span className="text-2xl sm:text-3xl font-black text-white tracking-tight font-mono">
            {formatPhoneDisplay(listing.phone)}
          </span>

          <div className="flex items-center justify-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-purple-950 text-purple-200 border border-purple-800/40 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-purple-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Скопійовано!' : 'Скопіювати номер'}</span>
            </button>
          </div>
        </div>

        {/* Direct Call Button */}
        <a
          href={`tel:${listing.phone}`}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-base shadow-lg shadow-purple-950/80 flex items-center justify-center gap-2 transition-all active:scale-95 border border-purple-400/30"
        >
          <Phone className="w-5 h-5 fill-white" />
          <span>Подзвонити зараз</span>
        </a>

        {/* Safety Note */}
        <div className="bg-purple-950/60 p-3 rounded-2xl border border-purple-800/40 text-[11px] text-purple-200 font-medium flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
          <span>Прямий контакт без посередників та комісій громади. Повідомте, що знайшли оголошення у Помічнику.</span>
        </div>
      </div>
    </div>
  );
};
