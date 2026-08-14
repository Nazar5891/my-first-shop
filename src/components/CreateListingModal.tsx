import React, { useEffect, useState } from 'react';
import { X, CheckCircle2, AlertCircle, Send, MapPin, LocateFixed, Loader2 } from 'lucide-react';
import { CategoryId, CATEGORIES, UrgencyLevel, UrgentHelpType, URGENCY_LEVELS_MAP, URGENT_TYPES_MAP, Listing, PayType } from '../types';
import { ListingMapPicker } from './ListingMapPicker';

interface CreateListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newListing: Omit<Listing, 'id' | 'createdAt' | 'viewsCount' | 'callsCount' | 'distanceMeters'>) => Promise<boolean>;
  userCoordinates?: [number, number];
  gpsEnabled?: boolean;
}

export const CreateListingModal: React.FC<CreateListingModalProps> = ({ isOpen, onClose, onSubmit, userCoordinates, gpsEnabled = false }) => {
  const [category, setCategory] = useState<CategoryId>('part_time');
  const [subcategory, setSubcategory] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payType, setPayType] = useState<PayType>('fixed');
  const [locationName, setLocationName] = useState('');
  const [when, setWhen] = useState('Сьогодні');
  const [duration, setDuration] = useState('2 години');
  const [phone, setPhone] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [urgencyLevel, setUrgencyLevel] = useState<UrgencyLevel>('immediate');
  const [urgentType, setUrgentType] = useState<UrgentHelpType>('auto');
  const [mapOpen, setMapOpen] = useState(false);
  const [coordinates, setCoordinates] = useState<[number, number] | null>(null);
  const [locating, setLocating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const isUrgent = category === 'urgent';
  const currentCategory = CATEGORIES[category];
  const selectedCoordinates = coordinates || (gpsEnabled && userCoordinates ? userCoordinates : null);
  const canPublish = Boolean(selectedCoordinates);

  useEffect(() => {
    if (!isOpen) return;
    setSuccess(false);
    setErrorMessage('');
    setBusy(false);
    setMapOpen(false);
    setCoordinates(null);
    setLocationName('');
  }, [isOpen]);

  const determineAutomatically = () => {
    if (!navigator.geolocation) {
      setErrorMessage('Цей браузер не підтримує визначення місцезнаходження.');
      return;
    }
    setLocating(true);
    setErrorMessage('');
    navigator.geolocation.getCurrentPosition(
      position => {
        const coords: [number, number] = [position.coords.latitude, position.coords.longitude];
        setCoordinates(coords);
        setLocating(false);
        setMapOpen(true);
      },
      error => {
        setLocating(false);
        setErrorMessage(error.code === 1 ? 'Дозвольте браузеру доступ до геолокації та натисніть кнопку ще раз.' : 'Не вдалося визначити місцезнаходження. Перевірте GPS.');
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage('');
    if (!canPublish) { setErrorMessage('📍 Спочатку визначте місце автоматично або виберіть точку на карті.'); return; }
    if (!title.trim()) { setErrorMessage('Вкажіть заголовок оголошення.'); return; }
    if (!phone.trim()) { setErrorMessage('Вкажіть номер телефону.'); return; }

    let pay = payAmount ? `${payAmount} грн` : 'За домовленістю';
    if (payType === 'hourly') pay += '/год';
    if (payType === 'daily') pay += '/день';
    if (payType === 'monthly') pay += '/міс';
    if (payType === 'free') pay = 'Безкоштовно';

    setBusy(true);
    try {
      const ok = await onSubmit({
        title: isUrgent ? `🚨 ${title}` : title,
        category,
        subcategory: subcategory || undefined,
        description: description || 'Опис не вказано.',
        pay,
        payValueNumber: parseInt(payAmount.replace(/\D/g, ''), 10) || 0,
        payType,
        locationName: locationName.trim(),
        coordinates: selectedCoordinates!,
        when: isUrgent ? 'Терміново (зараз)' : when,
        duration,
        phone,
        isUrgent,
        urgencyLevel: isUrgent ? urgencyLevel : undefined,
        urgentType: isUrgent ? urgentType : undefined,
        photoUrl: photoUrl || undefined,
        verified: true
      });
      if (ok) setSuccess(true);
      else setErrorMessage('Не вдалося опублікувати. Спочатку увійдіть в акаунт.');
    } catch (error) {
      console.error(error);
      setErrorMessage('Не вдалося опублікувати оголошення. Перевірте Firebase.');
    } finally {
      setBusy(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <div className="relative w-full max-w-xl bg-slate-950/95 text-slate-100 rounded-3xl shadow-2xl border border-purple-900/50 overflow-hidden my-auto max-h-[92vh] flex flex-col">
          <div className="p-4 border-b border-purple-900/40 flex items-center justify-between">
            <div><h2 className="text-lg font-black">Додати оголошення</h2><p className="text-[11px] text-purple-300/70">Публікація доступна авторизованим користувачам</p></div>
            <button type="button" onClick={onClose} className="w-9 h-9 rounded-full bg-slate-900 text-purple-300 border border-purple-800/40 flex items-center justify-center"><X className="w-5 h-5"/></button>
          </div>

          <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
            {success ? (
              <div className="py-8 text-center space-y-4"><CheckCircle2 className="w-16 h-16 mx-auto text-emerald-400"/><h3 className="text-xl font-black">Оголошення опубліковано!</h3><button type="button" onClick={onClose} className="px-8 py-3 bg-purple-600 rounded-2xl font-extrabold">Готово</button></div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <div className={`p-3 rounded-2xl border text-xs font-bold flex gap-2 ${canPublish ? 'bg-emerald-950/50 text-emerald-200 border-emerald-800/60' : 'bg-amber-950/60 text-amber-200 border-amber-800/60'}`}><MapPin className="w-4 h-4 shrink-0"/><span>{canPublish ? 'Місце визначено. Координати збережено.' : 'Визначте місце для оголошення.'}</span></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button type="button" onClick={determineAutomatically} disabled={locating} className="py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-black flex items-center justify-center gap-2"><LocateFixed className="w-4 h-4"/>{locating ? <><Loader2 className="w-4 h-4 animate-spin"/>Визначаю...</> : 'Визначити автоматично'}</button>
                  <button type="button" onClick={() => { setErrorMessage(''); setMapOpen(true); }} className="py-3 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-black flex items-center justify-center gap-2"><MapPin className="w-4 h-4"/>Вказати місце на карті</button>
                </div>
                {coordinates && <div className="p-3 rounded-2xl bg-emerald-950/50 border border-emerald-800/50 text-xs font-bold text-emerald-200">📍 Координати вибрані: {coordinates[0].toFixed(6)}, {coordinates[1].toFixed(6)}</div>}
                {errorMessage && <div className="p-3 bg-rose-950/80 text-rose-200 border border-rose-800/60 rounded-2xl text-xs font-bold flex gap-2"><AlertCircle className="w-4 h-4"/>{errorMessage}</div>}
                <div><label className="text-xs font-extrabold text-purple-300">КАТЕГОРІЯ</label><div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">{(Object.keys(CATEGORIES) as CategoryId[]).filter(k=>k!=='sale').map(k=><button key={k} type="button" onClick={()=>{setCategory(k);setSubcategory('')}} className={`p-2.5 rounded-2xl text-left border ${category===k?'bg-purple-600 text-white border-purple-400':'bg-slate-900 text-purple-200 border-purple-900/40'}`}><span>{CATEGORIES[k].pinSymbol}</span><span className="block text-xs font-extrabold mt-1">{CATEGORIES[k].shortLabel}</span></button>)}</div></div>
                {currentCategory?.subcategories?.length ? <div><label className="text-xs font-extrabold text-cyan-300">ПІДКАТЕГОРІЯ</label><div className="flex flex-wrap gap-1.5 mt-2">{currentCategory.subcategories.map(s=><button key={s} type="button" onClick={()=>setSubcategory(subcategory===s?'':s)} className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${subcategory===s?'bg-cyan-500 text-slate-950':'bg-slate-950 text-purple-200 border-purple-800/40'}`}>{s}</button>)}</div></div> : null}
                <input required value={title} onChange={e=>setTitle(e.target.value)} placeholder={isUrgent?'Що потрібно терміново?':'Назва оголошення'} className="w-full px-3.5 py-3 rounded-xl bg-slate-900 border border-purple-900/50 text-white text-sm"/>
                <textarea value={description} onChange={e=>setDescription(e.target.value)} rows={3} placeholder="Опис та деталі" className="w-full px-3.5 py-3 rounded-xl bg-slate-900 border border-purple-900/50 text-white text-sm"/>
                <div className="grid grid-cols-2 gap-2.5"><input value={locationName} onChange={e=>setLocationName(e.target.value)} placeholder="Вулиця, номер або назва місця (якщо не визначилось автоматично)" className="w-full px-3.5 py-3 rounded-xl bg-slate-900 border border-purple-900/50 text-white text-sm"/><input value={phone} onChange={e=>setPhone(e.target.value)} required type="tel" placeholder="+380..." className="w-full px-3.5 py-3 rounded-xl bg-slate-900 border border-purple-900/50 text-white text-sm"/></div>
                <div className="grid grid-cols-2 gap-2.5"><input value={payAmount} onChange={e=>setPayAmount(e.target.value)} placeholder="Оплата, грн" className="w-full px-3.5 py-3 rounded-xl bg-slate-900 border border-purple-900/50 text-white text-sm"/><select value={payType} onChange={e=>setPayType(e.target.value as PayType)} className="w-full px-3.5 py-3 rounded-xl bg-slate-900 border border-purple-900/50 text-white text-sm"><option value="fixed">Фіксована</option><option value="hourly">За годину</option><option value="daily">За день</option><option value="monthly">За місяць</option><option value="free">Безкоштовно</option></select></div>
                <div className="grid grid-cols-2 gap-2.5"><select value={when} onChange={e=>setWhen(e.target.value)} className="w-full px-3.5 py-3 rounded-xl bg-slate-900 border border-purple-900/50 text-white text-sm"><option>Сьогодні</option><option>Завтра</option><option>Найближчим часом</option><option>Постійно</option></select><input value={duration} onChange={e=>setDuration(e.target.value)} placeholder="Тривалість" className="w-full px-3.5 py-3 rounded-xl bg-slate-900 border border-purple-900/50 text-white text-sm"/></div>
                <input value={photoUrl} onChange={e=>setPhotoUrl(e.target.value)} placeholder="Посилання на фото (необов'язково)" className="w-full px-3.5 py-3 rounded-xl bg-slate-900 border border-purple-900/50 text-white text-sm"/>
                {isUrgent && <div className="p-3 rounded-2xl bg-rose-950/60 border border-rose-800/50 space-y-2"><div className="text-rose-300 text-xs font-black">🚨 ТЕРМІНОВА ДОПОМОГА</div><div className="flex flex-wrap gap-2">{(Object.keys(URGENT_TYPES_MAP) as UrgentHelpType[]).map(k=><button type="button" key={k} onClick={()=>setUrgentType(k)} className={`px-2 py-1.5 rounded-xl text-xs font-bold border ${urgentType===k?'bg-rose-600 text-white':'bg-slate-900 text-rose-200 border-rose-900'}`}>{URGENT_TYPES_MAP[k].label}</button>)}</div><div className="flex flex-wrap gap-2">{(Object.keys(URGENCY_LEVELS_MAP) as UrgencyLevel[]).map(k=><button type="button" key={k} onClick={()=>setUrgencyLevel(k)} className={`px-2 py-1.5 rounded-xl text-xs font-bold border ${urgencyLevel===k?'bg-rose-600 text-white':'bg-slate-900 text-rose-200 border-rose-900'}`}>{URGENCY_LEVELS_MAP[k].label.split('—')[0]}</button>)}</div></div>}
                <button disabled={busy || !canPublish} type="submit" className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-black flex items-center justify-center gap-2 disabled:opacity-50"><Send className="w-4 h-4"/>{busy?'Публікація...':'Опублікувати оголошення'}</button>
              </form>
            )}
          </div>
        </div>
      </div>
      <ListingMapPicker
        isOpen={mapOpen}
        initialCoordinates={coordinates}
        onConfirm={(coords, detectedLocation) => {
          setCoordinates(coords);
          if (detectedLocation) setLocationName(detectedLocation);
          setMapOpen(false);
          setErrorMessage('');
        }}
        onClose={() => setMapOpen(false)}
      />
    </>
  );
};
