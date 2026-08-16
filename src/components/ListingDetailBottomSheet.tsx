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
        setNewCommentText('');
        setNewAuthorName('');
        setSuccessMessage('Дякуємо! Ваш відгук збережено.');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else setSuccessMessage('Не вдалося зберегти відгук. Перевірте вхід в акаунт та доступ до бази.');
    } catch (error) {
      console.error('Помилка відгуку:', error);
      setSuccessMessage('Не вдалося зберегти відгук.');
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
      await batch.commit();
      onDeleted?.(listing.id);
      onClose();
    } catch (error) {
      console.error('Не вдалося видалити оголошення:', error);
      alert('Не вдалося видалити оголошення. Перевірте підключення та права доступу.');
    } finally { setIsDeleting(false); }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) await navigator.share({ title: listing.title, text: `${listing.title} — ${listing.pay} (Помічник Громада)`, url: window.location.href });
      else { await navigator.clipboard.writeText(window.location.href); alert('Посилання скопійовано!'); }
    } catch { /* скасовано */ }
  };

  return (
    <div className="fixed inset-0 z-[9990] flex justify-end bg-black/55 backdrop-blur-[3px] animate-fade-in">
      <div className="flex-1 hidden sm:block cursor-pointer" onClick={onClose} />
      <section className="relative w-full sm:w-[430px] md:w-[470px] h-[100dvh] max-h-[100dvh] bg-[#050505]/88 backdrop-blur-2xl text-white border-l-2 border-cyan-400/60 shadow-[0_0_40px_rgba(0,0,0,0.75)] flex flex-col overflow-hidden z-[9991] animate-slide-in-right">
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-cyan-400/[0.035] via-transparent to-purple-500/[0.035]" />

        <header className="relative shrink-0 border-b border-white/10 bg-[#050505]/80 px-4 pt-3 pb-3 sm:px-5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[8px] uppercase tracking-[0.34em] text-white/30 font-black">LOCAL MARKET / DETAIL</p>
              <p className="mt-1 text-[9px] uppercase tracking-[0.2em] text-cyan-300/70 font-black">ОГОЛОШЕННЯ / {String(listing.id).slice(-4).toUpperCase()}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {canDelete && <button type="button" onClick={handleDelete} disabled={isDeleting} className="h-9 w-9 border border-rose-500/60 bg-rose-950/70 text-rose-200 flex items-center justify-center disabled:opacity-50" title="Видалити"><Trash2 className="w-4 h-4" /></button>}
              <button type="button" onClick={handleShare} className="h-9 w-9 border border-white/15 bg-[#090909]/80 text-white/65 flex items-center justify-center hover:border-cyan-300/50 hover:text-white" title="Поділитися"><Share2 className="w-4 h-4" /></button>
              <button type="button" onClick={onClose} className="h-9 w-9 border border-white/15 bg-[#090909]/80 text-white/65 flex items-center justify-center hover:border-white/50 hover:text-white" title="Закрити"><X className="w-5 h-5" /></button>
            </div>
          </div>
        </header>

        <div className="relative flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-3 sm:px-4 pb-28 space-y-3">
          {isUrgent && <div className="border-2 border-white bg-white/[0.035] px-3 py-3 flex items-center gap-3 shadow-[0_0_18px_rgba(255,255,255,0.08)]"><div className="h-9 w-9 shrink-0 bg-white text-black flex items-center justify-center"><Siren className="w-5 h-5" /></div><div className="min-w-0"><div className="flex items-center gap-2 flex-wrap"><span className="text-[10px] font-black uppercase tracking-[0.12em] text-white">Терміново</span>{urgencyInfo && <span className="text-[8px] font-black uppercase bg-white text-black px-1.5 py-0.5">{urgencyInfo.label}</span>}</div><p className="mt-1 text-[9px] uppercase tracking-[0.08em] text-white/45">Потрібна допомога якнайшвидше</p></div></div>}

          <div className="flex items-center gap-2 flex-wrap">
            <span className="border border-cyan-400/45 bg-[#080808]/80 px-2 py-1 text-[8px] font-black uppercase tracking-[0.12em] text-white/75">{cat.pinSymbol} {cat.shortLabel || cat.label}</span>
            {listing.subcategory && <span className="border border-white/15 bg-[#080808]/80 px-2 py-1 text-[8px] font-black uppercase tracking-[0.1em] text-white/55">{listing.subcategory}</span>}
            <span className="border border-white/10 bg-[#080808]/70 px-2 py-1 text-[8px] font-bold uppercase tracking-[0.08em] text-white/40 flex items-center gap-1"><MapPin className="w-3 h-3" />{formatDistance(listing.distanceMeters)}</span>
            {listing.verified && <span className="border border-emerald-400/30 px-2 py-1 text-[8px] font-black uppercase text-emerald-300/70 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Verified</span>}
          </div>

          <div className="border-b border-white/10 pb-3">
            <p className="text-[8px] uppercase tracking-[0.28em] text-white/25 font-black">LIVE LIST / {isUrgent ? 'URGENT' : 'ACTIVE'}</p>
            <h2 className="mt-1 text-2xl sm:text-3xl font-black uppercase tracking-[-0.04em] leading-[0.95] text-white">{listing.title}</h2>
          </div>

          <div className="grid grid-cols-2 gap-px bg-white/10 border border-white/10">
            <div className="bg-[#080808]/90 px-3 py-2.5"><div className="flex items-center gap-1.5 text-[8px] uppercase tracking-[0.15em] text-white/30 font-black"><Calendar className="w-3.5 h-3.5" />Коли</div><p className="mt-1 text-[11px] font-bold text-white/80">{listing.when || 'Не вказано'}</p></div>
            <div className="bg-[#080808]/90 px-3 py-2.5"><div className="flex items-center gap-1.5 text-[8px] uppercase tracking-[0.15em] text-white/30 font-black"><Clock className="w-3.5 h-3.5" />Тривалість</div><p className="mt-1 text-[11px] font-bold text-white/80">{listing.duration || 'Не вказано'}</p></div>
            <div className="col-span-2 bg-[#080808]/90 px-3 py-2.5"><div className="flex items-center gap-1.5 text-[8px] uppercase tracking-[0.15em] text-white/30 font-black"><MapPin className="w-3.5 h-3.5" />Локація</div><p className="mt-1 text-[11px] font-bold text-white/80 uppercase">{listing.locationName || 'Локацію не вказано'}</p></div>
          </div>

          <div className="flex items-stretch justify-between gap-3 border-2 border-cyan-400/55 bg-[#080808]/85 px-3 py-3"><div><span className="block text-[8px] uppercase tracking-[0.18em] text-white/35 font-black">Ціна</span><span className="block mt-1 text-xl font-black text-white">{listing.pay || 'За домовленістю'}</span></div>{hasCoordinates && <button type="button" onClick={() => onRoute(listing)} className="shrink-0 border border-white bg-white text-black px-3 text-[9px] uppercase tracking-[0.1em] font-black flex items-center gap-1.5 hover:bg-white/85"><Navigation className="w-3.5 h-3.5" />Маршрут</button>}</div>

          {isRideshare && (listing.rideRouteFrom || listing.rideRouteTo) && <div className="border-2 border-cyan-400/45 bg-[#080808]/90 p-3 space-y-2.5"><div className="flex items-center justify-between gap-2"><span className="text-[9px] font-black uppercase tracking-[0.14em] text-cyan-300 flex items-center gap-1.5"><Car className="w-3.5 h-3.5" />Маршрут поїздки</span><span className="text-[8px] uppercase font-black border border-white/15 px-1.5 py-1 text-white/60">{listing.rideRole === 'driver' ? 'Водій' : 'Пасажир'}</span></div><div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-[10px] font-black uppercase text-white/75"><span>{listing.rideRouteFrom || 'Рокитне'}</span><span className="text-cyan-300">→</span><span className="text-right">{listing.rideRouteTo || 'Рівне'}</span></div>{listing.rideCarInfo && <div className="border border-white/10 px-2 py-1.5 text-[9px] text-white/45">Автомобіль: <strong className="text-white/70">{listing.rideCarInfo}</strong></div>}<button type="button" onClick={() => onRoute(listing)} className="w-full h-9 border border-white bg-white text-black text-[9px] uppercase tracking-[0.12em] font-black flex items-center justify-center gap-1.5"><Navigation className="w-3.5 h-3.5" />Показати маршрут</button></div>}

          {listing.photoUrl && <div className="border-2 border-cyan-400/35 bg-[#080808] overflow-hidden"><img src={listing.photoUrl} alt={listing.title} className="block w-full max-h-[55vh] object-contain" /></div>}

          <div><h4 className="text-[9px] uppercase tracking-[0.25em] text-white/35 font-black mb-1.5">Опис</h4><p className="border border-white/10 bg-[#080808]/75 px-3 py-3 text-[11px] text-white/65 leading-relaxed whitespace-pre-line">{listing.description || 'Опис не вказано.'}</p></div>

          <button type="button" onClick={handleCall} className="w-full border-2 border-white bg-white text-black px-4 py-3.5 flex items-center justify-between gap-3 shadow-[0_0_20px_rgba(255,255,255,0.10)] hover:bg-white/90 active:scale-[0.99] transition-transform"><div className="flex items-center gap-3"><div className="h-10 w-10 bg-black text-white flex items-center justify-center border border-black"><Phone className="w-5 h-5" /></div><div className="text-left"><span className="block text-[8px] uppercase tracking-[0.2em] font-black opacity-50">Контакт</span><span className="block text-sm font-black uppercase tracking-[0.08em]">Подзвонити</span></div></div><span className="text-[8px] uppercase tracking-[0.15em] font-black opacity-45">CALL</span></button>

          <div className="border border-white/10 bg-[#080808]/80 p-3 space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2"><div className="flex items-center gap-2"><MessageSquare className="w-4 h-4 text-cyan-300" /><span className="text-[9px] font-black uppercase tracking-[0.12em]">Відгуки громади ({commentsList.length})</span></div>{listing.rating && <div className="flex items-center gap-1 text-amber-300 text-[9px] font-black"><Star className="w-3 h-3 fill-amber-400" />{listing.rating.toFixed(1)}</div>}</div>
            {commentsList.length === 0 ? <p className="text-[9px] uppercase tracking-[0.12em] text-white/25">Поки що немає відгуків.</p> : <div className="space-y-2 max-h-56 overflow-y-auto">{commentsList.map(item => <div key={item.id} className="border border-white/10 bg-black/35 p-2.5 text-[10px]"><div className="flex items-center justify-between gap-2"><div className="flex items-center gap-1.5"><span className="font-black text-white/75">{item.authorName}</span>{item.verifiedUser && <span className="text-[8px] text-emerald-300"><UserCheck className="w-3 h-3 inline" /> VERIFIED</span>}</div>{item.rating && <div className="flex text-amber-400">{[...Array(item.rating)].map((_, i) => <Star key={i} className="w-3 h-3 fill-amber-400" />)}</div>}</div><p className="text-white/60 mt-1">{item.text}</p><span className="text-[8px] text-white/25 block text-right mt-1">{item.createdAt}</span></div>)}</div>}
            <form onSubmit={handleSubmitComment} className="pt-2 border-t border-white/10 space-y-2"><span className="text-[8px] font-black text-cyan-300 uppercase tracking-[0.16em] block">Залишити свій відгук</span>{successMessage && <div className="border border-cyan-400/30 bg-cyan-950/20 text-cyan-200 px-2 py-2 text-[9px] font-bold">{successMessage}</div>}<div className="grid grid-cols-2 gap-1"><input type="text" placeholder="Ваше ім'я" value={newAuthorName} onChange={e => setNewAuthorName(e.target.value)} className="h-9 px-2 bg-[#080808] text-white text-[10px] border border-white/10 outline-none focus:border-cyan-300/50" /><div className="h-9 flex items-center gap-1 justify-end px-2 bg-[#080808] border border-white/10">{[1,2,3,4,5].map(star => <button key={star} type="button" onClick={() => setNewRating(star)} className="p-0.5"><Star className={`w-3.5 h-3.5 ${star <= newRating ? 'fill-amber-400 text-amber-400' : 'text-white/15'}`} /></button>)}</div></div><textarea value={newCommentText} onChange={e => setNewCommentText(e.target.value)} placeholder="Ваш відгук..." rows={3} className="w-full px-2.5 py-2 bg-[#080808] text-white text-[10px] border border-white/10 outline-none focus:border-cyan-300/50 resize-none" /><button type="submit" disabled={isSubmitting || !newCommentText.trim()} className="w-full h-9 bg-white text-black disabled:opacity-30 text-[9px] uppercase tracking-[0.12em] font-black flex items-center justify-center gap-1.5"><Send className="w-3.5 h-3.5" />{isSubmitting ? 'Зберігаємо...' : 'Залишити відгук'}</button></form>
          </div>
        </div>

        <footer className="relative shrink-0 z-[10000] p-2.5 pb-[calc(0.65rem+env(safe-area-inset-bottom))] bg-[#050505]/96 backdrop-blur-xl border-t-2 border-cyan-400/60 shadow-[0_-14px_35px_rgba(0,0,0,0.85)]"><div className="grid grid-cols-2 gap-2"><button type="button" onClick={handleCall} className="min-h-[54px] bg-white text-black border-2 border-white font-black uppercase tracking-[0.1em] text-[10px] flex items-center justify-center gap-2 shadow-[0_0_18px_rgba(255,255,255,0.14)] hover:bg-white/90 active:scale-[0.98]"><Phone className="w-5 h-5" />Подзвонити</button><button type="button" onClick={() => onReport(listing)} className="min-h-[54px] bg-[#080808] text-white/70 border-2 border-white/15 font-black uppercase tracking-[0.1em] text-[10px] flex items-center justify-center gap-2 hover:border-rose-400/60 hover:text-rose-300 active:scale-[0.98]"><Flag className="w-5 h-5" />Поскаржитися</button></div></footer>
      </section>
    </div>
  );
};
