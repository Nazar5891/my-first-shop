import React, { useState } from 'react';
import { X, Phone, MapPin, Clock, Calendar, Siren, Navigation, CheckCircle2, Flag, Share2, Star, MessageSquare, Send, UserCheck, Car, Trash2 } from 'lucide-react';
import { Listing, CATEGORIES, URGENCY_LEVELS_MAP, ListingComment } from '../types';
import { formatDistance } from '../utils/distance';
import { auth, db } from '../firebase';
import { collection, doc, getDocs, query, where, writeBatch } from 'firebase/firestore';

interface ListingDetailBottomSheetProps {
  listing: Listing | null;
  onClose: () => void;
  onCall: (listing: Listing) => void;
  onRoute: (listing: Listing) => void;
  onReport: (listing: Listing) => void;
  onAddComment?: (listingId: string, comment: Omit<ListingComment, 'id' | 'createdAt'>) => Promise<boolean>;
  onDeleted?: (listingId: string) => void;
}

export const ListingDetailBottomSheet: React.FC<ListingDetailBottomSheetProps> = ({ listing, onClose, onCall, onRoute, onReport, onAddComment, onDeleted }) => {
  const [newAuthorName, setNewAuthorName] = useState('');
  const [newCommentText, setNewCommentText] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  if (!listing) return null;

  const cat = CATEGORIES[listing.category] || CATEGORIES.part_time;
  const isUrgent = Boolean(listing.isUrgent);
  const urgencyInfo = listing.urgencyLevel ? URGENCY_LEVELS_MAP[listing.urgencyLevel] : null;
  const isRideshare = listing.category === 'rideshare' || Boolean(listing.rideRole);
  const isOwner = Boolean(auth.currentUser && listing.authorId === auth.currentUser.uid);
  const isAdmin = auth.currentUser?.email?.toLowerCase() === 'nazar0111111@gmail.com';
  const canDelete = isOwner || isAdmin;
  const commentsList = listing.comments || [];
  const hasCoordinates = Array.isArray(listing.coordinates) && listing.coordinates.length === 2 && Number.isFinite(listing.coordinates[0]) && Number.isFinite(listing.coordinates[1]);
  const phone = String(listing.phone || '').trim();
  const cleanPhone = phone.replace(/[^+\d]/g, '');

  const handleCall = () => {
    if (cleanPhone) window.location.href = `tel:${cleanPhone}`;
    else onCall(listing);
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !onAddComment || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const ok = await onAddComment(listing.id, { authorName: newAuthorName.trim() || auth.currentUser?.displayName || 'Мешканець громади', text: newCommentText.trim(), rating: newRating, verifiedUser: true });
      if (ok) {
        setNewCommentText(''); setNewAuthorName(''); setSuccessMessage('Дякуємо! Ваш відгук збережено.');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else setSuccessMessage('Не вдалося зберегти відгук. Перевірте вхід в акаунт та доступ до бази.');
    } catch (error) {
      console.error('Помилка відгуку:', error); setSuccessMessage('Не вдалося зберегти відгук.');
    } finally { setIsSubmitting(false); }
  };

  const handleDelete = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser || (!isOwner && !isAdmin) || isDeleting) return;
    if (!window.confirm(isAdmin && !isOwner ? 'Видалити це оголошення як адміністратор назавжди?' : 'Видалити це оголошення назавжди?')) return;
    setIsDeleting(true);
    try {
      const commentsSnap = await getDocs(query(collection(db, 'comments'), where('listingId', '==', listing.id)));
      const batch = writeBatch(db);
      commentsSnap.docs.forEach(item => batch.delete(item.ref));
      batch.delete(doc(db, 'listings', listing.id));
      await batch.commit(); onDeleted?.(listing.id); onClose();
    } catch (error) {
      console.error('Не вдалося видалити оголошення:', error); alert('Не вдалося видалити оголошення. Перевірте підключення та права доступу.');
    } finally { setIsDeleting(false); }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) await navigator.share({ title: listing.title, text: `${listing.title} — ${listing.pay} (Помічник Громада)`, url: window.location.href });
      else { await navigator.clipboard.writeText(window.location.href); alert('Посилання скопійовано!'); }
    } catch { /* share cancelled */ }
  };

  return (
    <div className="fixed inset-0 z-[9990] flex justify-end bg-slate-950/50 backdrop-blur-[2px] animate-fade-in">
      <div className="flex-1 hidden sm:block cursor-pointer" onClick={onClose} />
      <div className="relative w-full sm:w-[420px] md:w-[460px] h-[100dvh] max-h-[100dvh] bg-slate-950/98 backdrop-blur-2xl text-slate-100 shadow-2xl border-l-2 border-purple-600/80 flex flex-col overflow-hidden z-[9991] animate-slide-in-right">
        <div className="w-12 h-1.5 bg-purple-900/60 rounded-full mx-auto my-2 shrink-0 sm:hidden" />

        <div className="absolute top-3 right-3 flex items-center gap-1.5 z-[10010]">
          {canDelete && <button type="button" onClick={handleDelete} disabled={isDeleting} className="w-9 h-9 rounded-full bg-rose-950/90 hover:bg-rose-700 text-rose-200 border border-rose-600/60 flex items-center justify-center disabled:opacity-50" title="Видалити оголошення"><Trash2 className="w-4 h-4" /></button>}
          <button type="button" onClick={handleShare} className="w-9 h-9 rounded-full bg-slate-900/90 hover:bg-purple-950 text-purple-300 border border-purple-800/40 flex items-center justify-center" title="Поділитися"><Share2 className="w-4 h-4" /></button>
          <button type="button" onClick={onClose} className="w-9 h-9 rounded-full bg-slate-900/90 hover:bg-purple-950 text-purple-300 border border-purple-800/40 flex items-center justify-center" title="Закрити"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 pb-[150px] space-y-4">
          {isUrgent && <div className="bg-rose-950/80 border-2 border-rose-600/60 rounded-2xl p-3.5 flex items-start gap-3 text-rose-100 shadow-md"><div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0"><Siren className="w-6 h-6" /></div><div><div className="flex items-center gap-2 flex-wrap"><span className="font-black text-rose-300 text-sm uppercase">Термінова допомога</span>{urgencyInfo && <span className="bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{urgencyInfo.label}</span>}</div><p className="text-xs text-rose-200/90">Будь ласка, допоможіть земляку якнайшвидше!</p></div></div>}
          <div className="flex items-center gap-2 flex-wrap pr-20"><span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold border bg-purple-950/80 text-purple-200 border-purple-800/50"><span>{cat.pinSymbol}</span><span>{cat.label}</span></span>{listing.subcategory && <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-900 text-cyan-300 border border-cyan-800/50">{listing.subcategory}</span>}<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-900/90 text-purple-200 border border-purple-800/40"><MapPin className="w-3.5 h-3.5 text-purple-400" />📍 {formatDistance(listing.distanceMeters)} від вас</span>{listing.verified && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-950/60 text-purple-300 border border-purple-800/50"><CheckCircle2 className="w-3.5 h-3.5" />Номер перевірено</span>}</div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-100 leading-tight">{listing.title}</h2>
          {hasCoordinates && <button type="button" onClick={() => onRoute(listing)} className="w-full py-3 bg-white hover:bg-slate-200 active:bg-slate-300 text-slate-950 font-black text-xs uppercase tracking-wide rounded-xl border border-white flex items-center justify-center gap-2 shadow-lg"><Navigation className="w-4 h-4" />Прокласти маршрут</button>}
          {isRideshare && (listing.rideRouteFrom || listing.rideRouteTo) && <div className="p-4 bg-gradient-to-br from-sky-950 to-slate-900 rounded-2xl border-2 border-sky-500/60 space-y-3"><div className="flex items-center justify-between"><span className="text-xs font-black uppercase text-sky-300 flex items-center gap-1.5"><Car className="w-4 h-4" />Маршрут поїздки</span><span className="bg-sky-900/80 text-sky-200 text-[11px] font-bold px-2.5 py-0.5 rounded-full">{listing.rideRole === 'driver' ? '🚗 Водій' : '🙋‍♂️ Пасажир'}</span></div><div className="flex items-center justify-between text-sm font-extrabold text-sky-100"><div><span className="text-[10px] text-sky-400 block">Звідки</span><span>{listing.rideRouteFrom || 'Рокитне'}</span></div><div className="text-sky-400 text-lg">➔</div><div className="text-right"><span className="text-[10px] text-sky-400 block">Куди</span><span>{listing.rideRouteTo || 'Рівне'}</span></div></div>{listing.rideCarInfo && <div className="text-xs text-slate-300 bg-slate-950/60 p-2 rounded-xl">🚘 <strong>Автомобіль:</strong> {listing.rideCarInfo}</div>}<button type="button" onClick={() => onRoute(listing)} className="w-full py-2 bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5"><Navigation className="w-3.5 h-3.5" />Показати маршрут на карті</button></div>}
          {listing.photoUrl && <div className="w-full rounded-2xl overflow-hidden border border-purple-900/40 bg-slate-900"><img src={listing.photoUrl} alt={listing.title} className="block w-full h-auto max-h-[70vh] object-contain" /></div>}
          <div className="grid grid-cols-2 gap-2.5"><div className="bg-slate-900/80 p-3 rounded-2xl border border-purple-900/40"><div className="flex items-center gap-1 text-purple-400 text-[11px] font-bold uppercase"><Calendar className="w-3.5 h-3.5" />Коли</div><p className="font-extrabold text-sm">{listing.when}</p></div><div className="bg-slate-900/80 p-3 rounded-2xl border border-purple-900/40"><div className="flex items-center gap-1 text-purple-400 text-[11px] font-bold uppercase"><Clock className="w-3.5 h-3.5" />Тривалість</div><p className="font-extrabold text-sm">{listing.duration}</p></div><div className="bg-slate-900/80 p-3 rounded-2xl border border-purple-900/40 col-span-2"><div className="flex items-center gap-1 text-purple-400 text-[11px] font-bold uppercase"><MapPin className="w-3.5 h-3.5" />Локація</div><p className="font-extrabold text-sm">{listing.locationName || 'Локацію не вказано'}</p></div></div>
          <div className="bg-purple-950/70 p-4 rounded-2xl border border-purple-800/50"><span className="text-xs font-bold text-purple-300 uppercase block">{isRideshare ? 'Ціна поїздки' : 'Винагорода / Оплата'}</span><span className="text-2xl font-black text-violet-200">{listing.pay}</span></div>
          <div><h4 className="text-xs font-extrabold text-purple-400 uppercase mb-1">Опис</h4><p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line bg-slate-900/60 p-3.5 rounded-2xl border border-purple-900/30">{listing.description}</p></div>
          {phone && <div className="rounded-2xl border-2 border-emerald-500/60 bg-emerald-950/30 p-4 shadow-lg"><div className="text-[11px] font-black uppercase tracking-wide text-emerald-300 mb-2">Контактний номер</div><a href={`tel:${cleanPhone}`} className="flex items-center justify-between gap-3 rounded-xl bg-slate-950/70 border border-emerald-700/50 px-4 py-3"><span className="text-lg font-black text-white tracking-wide">{phone}</span><Phone className="w-5 h-5 text-emerald-400 shrink-0" /></a></div>}
          <div className="p-4 bg-slate-900/90 rounded-2xl border border-purple-800/40 space-y-3"><div className="flex items-center justify-between border-b border-purple-900/40 pb-2"><div className="flex items-center gap-2"><MessageSquare className="w-4 h-4 text-cyan-400" /><span className="text-xs font-extrabold uppercase text-slate-100">Відгуки громади ({commentsList.length})</span></div>{listing.rating && <div className="flex items-center gap-1 text-amber-300 text-xs font-extrabold"><Star className="w-3.5 h-3.5 fill-amber-400" />{listing.rating.toFixed(1)}</div>}</div>{commentsList.length === 0 ? <p className="text-xs text-purple-300/60 italic">Поки що немає відгуків.</p> : <div className="space-y-2.5 max-h-56 overflow-y-auto">{commentsList.map(item => <div key={item.id} className="p-3 bg-slate-950/80 rounded-xl border border-purple-900/30 text-xs"><div className="flex items-center justify-between gap-2"><div className="flex items-center gap-1.5"><span className="font-extrabold text-purple-200">{item.authorName}</span>{item.verifiedUser && <span className="text-[10px] text-emerald-400"><UserCheck className="w-3 h-3 inline" /> Підтверджено</span>}</div>{item.rating && <div className="flex text-amber-400">{[...Array(item.rating)].map((_, i) => <Star key={i} className="w-3 h-3 fill-amber-400" />)}</div>}</div><p className="text-slate-200 mt-1">{item.text}</p><span className="text-[10px] text-purple-300/50 block text-right">{item.createdAt}</span></div>)}</div>}
          <form onSubmit={handleSubmitComment} className="pt-2 border-t border-purple-900/40 space-y-2"><span className="text-[11px] font-extrabold text-cyan-300 block uppercase">Залишити свій відгук</span>{successMessage && <div className="p-2 bg-slate-950 text-cyan-200 border border-cyan-800 text-xs rounded-xl font-bold">{successMessage}</div>}<div className="grid grid-cols-2 gap-2"><input type="text" placeholder="Ваше ім'я" value={newAuthorName} onChange={e => setNewAuthorName(e.target.value)} className="px-2.5 py-1.5 bg-slate-950 text-slate-100 text-xs rounded-xl border border-purple-800/50" /><div className="flex items-center gap-1 justify-end px-2 bg-slate-950 rounded-xl border border-purple-800/50">{[1,2,3,4,5].map(star => <button key={star} type="button" onClick={() => setNewRating(star)} className="p-0.5"><Star className={`w-3.5 h-3.5 ${star <= newRating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`} /></button>)}</div></div><textarea value={newCommentText} onChange={e => setNewCommentText(e.target.value)} placeholder="Ваш відгук..." rows={3} className="w-full px-3 py-2 bg-slate-950 text-slate-100 text-xs rounded-xl border border-purple-800/50 resize-none" /><button type="submit" disabled={isSubmitting || !newCommentText.trim()} className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5"><Send className="w-3.5 h-3.5" />{isSubmitting ? 'Зберігаємо...' : 'Залишити відгук'}</button></form></div>
        </div>

        <div className="relative shrink-0 z-[10000] p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] bg-slate-950 border-t-2 border-purple-500 shadow-[0_-12px_35px_rgba(0,0,0,0.85)]">
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={handleCall} className="min-h-[52px] py-3.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-black rounded-xl flex items-center justify-center gap-2 shadow-lg border border-emerald-400/40"><Phone className="w-5 h-5" />Зателефонувати</button>
            <button type="button" onClick={() => onReport(listing)} className="min-h-[52px] py-3.5 bg-slate-900 hover:bg-rose-950 active:bg-rose-900 text-rose-300 font-black rounded-xl border border-rose-700/60 flex items-center justify-center gap-2 shadow-lg"><Flag className="w-5 h-5" />Поскаржитися</button>
          </div>
        </div>
      </div>
    </div>
  );
};
