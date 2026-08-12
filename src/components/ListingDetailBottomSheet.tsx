import React, { useState } from 'react';
import {
  X,
  Phone,
  MapPin,
  Clock,
  Calendar,
  Siren,
  Navigation,
  Eye,
  CheckCircle2,
  Flag,
  Share2,
  Star,
  MessageSquare,
  Send,
  UserCheck,
  Car,
} from 'lucide-react';
import { Listing, CATEGORIES, URGENCY_LEVELS_MAP, ListingComment } from '../types';
import { formatDistance } from '../utils/distance';

interface ListingDetailBottomSheetProps {
  listing: Listing | null;
  onClose: () => void;
  onCall: (listing: Listing) => void;
  onRoute: (listing: Listing) => void;
  onReport: (listing: Listing) => void;
  onAddComment?: (listingId: string, comment: Omit<ListingComment, 'id' | 'createdAt'>) => void;
}

export const ListingDetailBottomSheet: React.FC<ListingDetailBottomSheetProps> = ({
  listing,
  onClose,
  onCall,
  onRoute,
  onReport,
  onAddComment,
}) => {
  if (!listing) return null;

  const cat = CATEGORIES[listing.category] || CATEGORIES.part_time;
  const isUrgent = listing.isUrgent;
  const urgencyInfo = listing.urgencyLevel ? URGENCY_LEVELS_MAP[listing.urgencyLevel] : null;
  const isRideshare = listing.category === 'rideshare' || Boolean(listing.rideRole);

  // New comment state
  const [newAuthorName, setNewAuthorName] = useState('');
  const [newCommentText, setNewCommentText] = useState('');
  const [newRating, setNewRating] = useState<number>(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const commentsList = listing.comments || [];

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    setIsSubmitting(true);
    if (onAddComment) {
      onAddComment(listing.id, {
        authorName: newAuthorName.trim() || 'Мешканець громади',
        text: newCommentText.trim(),
        rating: newRating,
        verifiedUser: true,
      });
    }

    setNewCommentText('');
    setNewAuthorName('');
    setIsSubmitting(false);
    setSuccessMessage('Дякуємо! Ваш відгук збережено.');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-[2px] transition-opacity animate-fade-in">
      {/* Backdrop overlay click */}
      <div className="flex-1 hidden sm:block cursor-pointer" onClick={onClose} />

      {/* Right Side Panel */}
      <div className="relative w-full sm:w-[420px] md:w-[460px] h-full bg-slate-950/98 backdrop-blur-2xl text-slate-100 shadow-2xl border-l-2 border-purple-600/80 overflow-hidden flex flex-col z-10 animate-slide-in-right">
        {/* Top Handle bar for mobile indicator */}
        <div className="w-12 h-1.5 bg-purple-900/60 rounded-full mx-auto my-2 shrink-0 sm:hidden" />

        {/* Close & Share Top Actions */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 z-20">
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: listing.title,
                  text: `${listing.title} — ${listing.pay} (Помічник Громада)`,
                  url: window.location.href,
                }).catch(() => {});
              } else {
                navigator.clipboard.writeText(window.location.href);
                alert('Посилання скопійовано!');
              }
            }}
            className="w-9 h-9 rounded-full bg-slate-900/90 hover:bg-purple-950 text-purple-300 border border-purple-800/40 flex items-center justify-center transition-all"
            title="Поділитися"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-900/90 hover:bg-purple-950 text-purple-300 border border-purple-800/40 flex items-center justify-center transition-all font-bold"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Scroll Container */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Urgent Warning Banner if applicable */}
          {isUrgent && (
            <div className="bg-rose-950/80 border-2 border-rose-600/60 rounded-2xl p-3.5 flex items-start gap-3 text-rose-100 shadow-md">
              <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 animate-pulse shadow-lg shadow-rose-950/50">
                <Siren className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-black text-rose-300 text-sm uppercase tracking-wide">
                    Термінова допомога
                  </span>
                  {urgencyInfo && (
                    <span className="bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                      {urgencyInfo.label}
                    </span>
                  )}
                </div>
                <p className="text-xs text-rose-200/90 font-medium leading-relaxed">
                  Будь ласка, допоможіть земляку якнайшвидше! Натисніть кнопку підзвонити нижче.
                </p>
              </div>
            </div>
          )}

          {/* Category & Distance Pills */}
          <div className="flex items-center gap-2 flex-wrap pr-20">
            <span
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold border bg-purple-950/80 text-purple-200 border-purple-800/50`}
            >
              <span>{cat.pinSymbol}</span>
              <span>{cat.label}</span>
            </span>

            {listing.subcategory && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-900 text-cyan-300 border border-cyan-800/50">
                {listing.subcategory}
              </span>
            )}

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-900/90 text-purple-200 border border-purple-800/40">
              <MapPin className="w-3.5 h-3.5 text-purple-400" />
              <span>📍 {formatDistance(listing.distanceMeters)} від вас</span>
            </span>

            {listing.verified && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-950/60 text-purple-300 border border-purple-800/50">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                <span>Номер перевірено</span>
              </span>
            )}
          </div>

          {/* Title */}
          <h2 className="text-xl sm:text-2xl font-black text-slate-100 leading-tight">
            {listing.title}
          </h2>

          {/* RIDESHARE ROUTE CARD DETAILS */}
          {isRideshare && (listing.rideRouteFrom || listing.rideRouteTo) && (
            <div className="p-4 bg-gradient-to-br from-sky-950 to-slate-900 rounded-2xl border-2 border-sky-500/60 space-y-3 shadow-lg">
              <div className="flex items-center justify-between border-b border-sky-800/50 pb-2">
                <span className="text-xs font-black uppercase text-sky-300 tracking-wider flex items-center gap-1.5">
                  <Car className="w-4 h-4 text-sky-400" />
                  <span>Маршрут поїздки (BlaBlaCar)</span>
                </span>
                <span className="bg-sky-900/80 text-sky-200 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-sky-700/50">
                  {listing.rideRole === 'driver' ? '🚗 Водій' : '🙋‍♂️ Пасажир'}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm font-extrabold text-sky-100">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-sky-400 uppercase tracking-widest block font-bold">
                    Звідки (А)
                  </span>
                  <span>{listing.rideRouteFrom || 'Рокитне'}</span>
                </div>
                <div className="text-sky-400 text-lg font-black px-2">➔</div>
                <div className="space-y-0.5 text-right">
                  <span className="text-[10px] text-sky-400 uppercase tracking-widest block font-bold">
                    Куди (Б)
                  </span>
                  <span>{listing.rideRouteTo || 'Рівне'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-sky-200/90 pt-1 border-t border-sky-900/40">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Час виїзду</span>
                  <span className="font-bold text-sky-100">{listing.rideDepartureTime || listing.when}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Кількість місць</span>
                  <span className="font-bold text-sky-100">{listing.rideSeats || 1} міст.</span>
                </div>
              </div>

              {listing.rideCarInfo && (
                <div className="text-xs text-slate-300 bg-slate-950/60 p-2 rounded-xl border border-sky-900/40">
                  🚘 <strong>Автомобіль:</strong> {listing.rideCarInfo}
                </div>
              )}

              <button
                onClick={() => onRoute(listing)}
                className="w-full py-2 bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Показати лінію маршруту на карті</span>
              </button>
            </div>
          )}

          {/* Optional Photo */}
          {listing.photoUrl && (
            <div className="rounded-2xl overflow-hidden border border-purple-900/40 max-h-52 bg-slate-900">
              <img
                src={listing.photoUrl}
                alt={listing.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Grid Information Cards */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <div className="bg-slate-900/80 p-3 rounded-2xl border border-purple-900/40 space-y-0.5">
              <div className="flex items-center gap-1 text-purple-400/80 text-[11px] font-bold uppercase tracking-wider">
                <Calendar className="w-3.5 h-3.5 text-purple-400" />
                <span>Коли</span>
              </div>
              <p className="font-extrabold text-slate-100 text-sm">{listing.when}</p>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-2xl border border-purple-900/40 space-y-0.5">
              <div className="flex items-center gap-1 text-purple-400/80 text-[11px] font-bold uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5 text-purple-400" />
                <span>Тривалість</span>
              </div>
              <p className="font-extrabold text-slate-100 text-sm">{listing.duration}</p>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-2xl border border-purple-900/40 space-y-0.5 col-span-2">
              <div className="flex items-center gap-1 text-purple-400/80 text-[11px] font-bold uppercase tracking-wider">
                <MapPin className="w-3.5 h-3.5 text-purple-400" />
                <span>Локація</span>
              </div>
              <p className="font-extrabold text-slate-100 text-sm">{listing.locationName}</p>
            </div>
          </div>

          {/* Pay Display */}
          <div className="bg-purple-950/70 p-4 rounded-2xl border border-purple-800/50 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-purple-300 uppercase tracking-widest block">
                {isRideshare ? 'Ціна поїздки' : 'Винагорода / Оплата'}
              </span>
              <span className="text-2xl font-black text-violet-200">{listing.pay}</span>
            </div>
            <span className="text-xs font-semibold text-purple-300 bg-slate-900/90 px-3 py-1 rounded-xl border border-purple-800/40">
              {listing.payType === 'fixed'
                ? 'Фіксована сума'
                : listing.payType === 'hourly'
                ? 'За годину'
                : listing.payType === 'monthly'
                ? 'Щомісячно'
                : listing.payType === 'free'
                ? 'Безкоштовно'
                : 'За день'}
            </span>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <h4 className="text-xs font-extrabold text-purple-400/80 uppercase tracking-widest">Опис</h4>
            <p className="text-sm text-slate-200 leading-relaxed font-normal whitespace-pre-line bg-slate-900/60 p-3.5 rounded-2xl border border-purple-900/30">
              {listing.description}
            </p>
          </div>

          {/* COMMUNITY REVIEWS & FEEDBACK SECTION */}
          <div className="p-4 bg-slate-900/90 rounded-2xl border border-purple-800/40 space-y-3">
            <div className="flex items-center justify-between border-b border-purple-900/40 pb-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-100">
                  Відгуки громади ({commentsList.length})
                </span>
              </div>
              {listing.rating && (
                <div className="flex items-center gap-1 bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-600/40 text-amber-300 text-xs font-extrabold">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{listing.rating.toFixed(1)}</span>
                </div>
              )}
            </div>

            {/* List of comments */}
            {commentsList.length === 0 ? (
              <p className="text-xs text-purple-300/60 italic py-1">
                Поки що немає відгуків. Будьте першим, хто залишить відгук про цю послугу або поїздку!
              </p>
            ) : (
              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {commentsList.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-slate-950/80 rounded-xl border border-purple-900/30 space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-purple-200">{item.authorName}</span>
                        {item.verifiedUser && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-800/40">
                            <UserCheck className="w-3 h-3" />
                            <span>Підтверджено</span>
                          </span>
                        )}
                      </div>

                      {item.rating && (
                        <div className="flex items-center gap-0.5 text-amber-400">
                          {[...Array(item.rating)].map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-amber-400" />
                          ))}
                        </div>
                      )}
                    </div>

                    <p className="text-slate-200 font-normal leading-normal">{item.text}</p>
                    <span className="text-[10px] text-purple-300/50 block text-right">
                      {item.createdAt}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Add Comment Form */}
            <form onSubmit={handleSubmitComment} className="pt-2 border-t border-purple-900/40 space-y-2">
              <span className="text-[11px] font-extrabold text-cyan-300 block uppercase">
                Залишити свій відгук
              </span>

              {successMessage && (
                <div className="p-2 bg-emerald-950/80 text-emerald-200 border border-emerald-600/50 text-xs rounded-xl font-bold">
                  {successMessage}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Ваше ім'я"
                  value={newAuthorName}
                  onChange={(e) => setNewAuthorName(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-950 text-slate-100 text-xs rounded-xl border border-purple-800/50 outline-none focus:border-cyan-400 font-medium"
                />

                {/* Rating Picker */}
                <div className="flex items-center gap-1 justify-end px-2 bg-slate-950 rounded-xl border border-purple-800/50">
                  <span className="text-[10px] text-purple-300/70 font-bold mr-1">Оцінка:</span>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewRating(star)}
                      className="p-0.5 transition-transform hover:scale-125"
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${
                          star <= newRating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <textarea
                  required
                  rows={2}
                  placeholder="Опишіть ваші враження від поїздки чи послуги..."
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 bg-slate-950 text-slate-100 text-xs rounded-xl border border-purple-800/50 outline-none focus:border-cyan-400 font-medium resize-none"
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !newCommentText.trim()}
                  className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex flex-col items-center justify-center gap-1 shrink-0"
                >
                  <Send className="w-4 h-4" />
                  <span className="text-[9px]">Надіслати</span>
                </button>
              </div>
            </form>
          </div>

          {/* Listing Stats Footer */}
          <div className="flex items-center justify-between text-xs text-purple-300/60 font-medium pt-2 border-t border-purple-900/30">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                <span>{listing.viewsCount} переглядів</span>
              </span>
              <span>•</span>
              <span>{listing.createdAt}</span>
            </div>
            <button
              onClick={() => onReport(listing)}
              className="flex items-center gap-1 text-purple-400/80 hover:text-rose-400 transition-colors"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>Поскаржитися</span>
            </button>
          </div>
        </div>

        {/* Fixed Action Footer: CALL & ROUTE */}
        <div className="p-4 bg-slate-950 border-t border-purple-900/40 grid grid-cols-5 gap-2.5 shrink-0">
          <button
            onClick={() => onRoute(listing)}
            className="col-span-2 flex items-center justify-center gap-1.5 px-4 py-3.5 rounded-2xl font-extrabold text-sm bg-slate-900 hover:bg-slate-850 text-purple-200 transition-all active:scale-95 border border-purple-800/50"
          >
            <Navigation className="w-4 h-4 text-purple-400" />
            <span>Маршрут</span>
          </button>

          <button
            onClick={() => onCall(listing)}
            className={`col-span-3 flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl font-black text-base text-white shadow-xl transition-all active:scale-95 ${
              isUrgent
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-950/60 ring-2 ring-rose-500/30 animate-pulse'
                : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-purple-950/60 ring-2 ring-purple-500/30'
            }`}
          >
            <Phone className="w-5 h-5" />
            <span>Подзвонити</span>
          </button>
        </div>
      </div>
    </div>
  );
};
