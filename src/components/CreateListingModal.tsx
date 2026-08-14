import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { X, Phone, Siren, Camera, CheckCircle2, AlertCircle, Send, MapPin, Navigation } from 'lucide-react';
import { CategoryId, CATEGORIES, UrgencyLevel, UrgentHelpType, URGENCY_LEVELS_MAP, URGENT_TYPES_MAP, Listing, PayType } from '../types';
import { COMMUNITY_CENTER } from '../data/mockListings';

interface CreateListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newListing: Omit<Listing, 'id' | 'createdAt' | 'viewsCount' | 'callsCount' | 'distanceMeters'>) => Promise<boolean>;
  userCoordinates?: [number, number];
}

const isCommunityCenter = (coords: [number, number]) =>
  Math.abs(coords[0] - COMMUNITY_CENTER[0]) < 0.000001 && Math.abs(coords[1] - COMMUNITY_CENTER[1]) < 0.000001;

export const CreateListingModal: React.FC<CreateListingModalProps> = ({ isOpen, onClose, onSubmit, userCoordinates = COMMUNITY_CENTER }) => {
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
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualCoordinates, setManualCoordinates] = useState<[number, number] | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const isUrgent = category === 'urgent';
  const currentCategory = CATEGORIES[category];
  const hasRealGps = !isCommunityCenter(userCoordinates);
  const selectedCoordinates = hasRealGps ? userCoordinates : manualCoordinates;
  const canPublish = hasRealGps || Boolean(manualCoordinates);

  useEffect(() => {
    if (!isOpen || !manualMode || !mapElementRef.current || mapRef.current) return;
    const map = L.map(mapElementRef.current, { center: COMMUNITY_CENTER, zoom: 14, zoomControl: true });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap &copy; CARTO' }).addTo(map);
    map.on('click', (e: L.LeafletMouseEvent) => {
      const coords: [number, number] = [e.latlng.lat, e.latlng.lng];
      setManualCoordinates(coords);
      if (markerRef.current) markerRef.current.setLatLng(coords);
      else markerRef.current = L.marker(coords).addTo(map).bindPopup('Місце оголошення').openPopup();
    });
    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 100);
    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [isOpen, manualMode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!canPublish) return setErrorMessage('📍 Увімкніть геолокацію або виберіть місце оголошення на карті.');
    if (!title.trim()) return setErrorMessage('Будь ласка, вкажіть заголовок оголошення.');
    if (!phone.trim()) return setErrorMessage('Вкажіть номер телефону.');
    let pay = payAmount ? `${payAmount} грн` : 'За домовленістю';
    if (payType === 'hourly') pay += '/год';
    if (payType === 'daily') pay += '/день';
    if (payType === 'monthly') pay += '/міс';
    if (payType === 'free') pay = 'Безкоштовно';
    setBusy(true);
    try {
      const published = await onSubmit({
        title: isUrgent ? `🚨 ${title}` : title,
        category,
        subcategory: subcategory || undefined,
        description: description || 'Опис не вказано.',
        pay,
        payValueNumber: parseInt(payAmount.replace(/\D/g, ''), 10) || 0,
        payType,
        locationName: locationName || 'Рокитнівська громада',
        coordinates: selectedCoordinates!,
        when: isUrgent ? 'Терміново (зараз)' : when,
        duration,
        phone,
        isUrgent,
        urgencyLevel: isUrgent ? urgencyLevel : undefined,
        urgentType: isUrgent ? urgentType : undefined,
        photoUrl: photoUrl || undefined,
        verified: true,
      });
      if (published) setSuccess(true);
      else setErrorMessage('Не вдалося опублікувати. Спочатку увійдіть в акаунт.');
    } catch (error) {
      console.error(error);
      setErrorMessage('Не вдалося опублікувати оголошення. Перевірте Firebase.');
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-950/95 text-slate-100 rounded-3xl shadow-2xl border border-purple-900/50 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        <div className="p-4 sm:p-5 border-b border-purple-900/40 flex items-center justify-between"><div><h2 className="text-lg font-black">Додати оголошення</h2><p className="text-[11px] text-purple-300/70">Публікація доступна авторизованим користувачам</p></div><button onClick={onClose} className="w-9 h-9 rounded-full bg-slate-900 text-purple-300 border border-purple-800/40 flex items-center justify-center"><X className="w-5 h-5" /></button></div>
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {success ? <div className="py-8 text-center space-y-4"><CheckCircle2 className="w-16 h-16 mx-auto text-emerald-400" /><h3 className="text-xl font-black">Оголошення опубліковано!</h3><p className="text-sm text-purple-200/80">Оголошення збережено у Firebase.</p><button onClick={onClose} className="px-8 py-3 bg-purple-600 rounded-2xl font-extrabold">Готово</button></div> : <form onSubmit={handleSubmit} className="space-y-4">
            <div className={`p-3 rounded-2xl border text-xs font-bold flex gap-2 ${canPublish ? 'bg-emerald-950/50 text-emerald-200 border-emerald-800/60' : 'bg-amber-950/60 text-amber-200 border-amber-800/60'}`}><MapPin className="w-4 h-4 shrink-0" /><span>{hasRealGps ? 'Ваше реальне місцезнаходження визначено. Оголошення буде розміщено за вашими координатами.' : manualCoordinates ? 'Місце вибрано вручну на карті. GPS не потрібен.' : 'GPS вимкнено. Виберіть місце оголошення вручну на карті або увімкніть геолокацію.'}</span></div>
            {!hasRealGps && <div className="space-y-2"><button type="button" onClick={() => setManualMode(v => !v)} className="w-full py-3 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-black flex items-center justify-center gap-2"><MapPin className="w-4 h-4" />{manualMode ? 'Закрити карту' : 'Вказати місце на карті'}</button>{manualMode && <div className="rounded-2xl overflow-hidden border-2 border-cyan-700/60"><div ref={mapElementRef} className="w-full h-64" />{manualCoordinates && <div className="p-2 bg-slate-900 text-center text-xs text-cyan-200 font-bold">📍 Точка вибрана. Тепер можна публікувати.</div>}</div>}</div>}
            {errorMessage && <div className="p-3 bg-rose-950/80 text-rose-200 border border-rose-800/60 rounded-2xl text-xs font-bold flex gap-2"><AlertCircle className="w-4 h-4" />{errorMessage}</div>}
            <div className="space-y-2"><label className="text-xs font-extrabold text-purple-300 uppercase tracking-widest">Категорія</label><div className="grid grid-cols-2 sm:grid-cols-4 gap-2">{(Object.keys(CATEGORIES) as CategoryId[]).filter(k => k !== 'sale').map(k => <button key={k} type="button" onClick={() => { setCategory(k); setSubcategory(''); }} className={`p-2.5 rounded-2xl text-left border ${category === k ? 'bg-purple-600 text-white border-purple-400' : 'bg-slate-900 text-purple-200 border-purple-900/40'}`}><span className="text-base">{CATEGORIES[k].pinSymbol}</span><span className="block text-xs font-extrabold mt-1">{CATEGORIES[k].shortLabel}</span></button>)}</div></div>
            {currentCategory?.subcategories?.length ? <div className="space-y-2"><label className="text-xs font-extrabold text-cyan-300 uppercase tracking-widest">Підкатегорія</label><div className="flex flex-wrap gap-1.5">{currentCategory.subcategories.map(s => <button key={s} type="button" onClick={() => setSubcategory(subcategory === s ? '' : s)} className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${subcategory === s ? 'bg-cyan-500 text-slate-950 border-cyan-300' : 'bg-slate-950 text-purple-200 border-purple-800/40'}`}>{s}</button>)}</div></div> : null}
            <input required value={title} onChange={e => setTitle(e.target.value)} placeholder={isUrgent ? 'Що потрібно терміново?' : 'Назва оголошення'} className="w-full px-3.5 py-3 rounded-xl bg-slate-900 border border-purple-900/50 text-white text-sm outline-none" />
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Опис та деталі" className="w-full px-3.5 py-3 rounded-xl bg-slate-900 border border-purple-900/50 text-white text-sm outline-none" />
            {isUrgent && <div className="p-3 rounded-2xl bg-rose-950/60 border border-rose-800/50 space-y-3"><div className="flex items-center gap-2 text-rose-300 text-xs font-black"><Siren className="w-4 h-4" /> Термінова допомога</div><div className="grid grid-cols-2 gap-2">{(Object.keys(URGENT_TYPES_MAP) as UrgentHelpType[]).map(k => <button type="button" key={k} onClick={() => setUrgentType(k)} className={`p-2 rounded-xl text-xs font-bold border ${urgentType === k ? 'bg-rose-600 text-white border-rose-400' : 'bg-slate-900 text-rose-200 border-rose-900'}`}>{URGENT_TYPES_MAP[k].label}</button>)}</div><div className="grid grid-cols-3 gap-2">{(Object.keys(URGENCY_LEVELS_MAP) as UrgencyLevel[]).map(k => <button type="button" key={k} onClick={() => setUrgencyLevel(k)} className={`p-2 rounded-xl text-xs font-bold border ${urgencyLevel === k ? 'bg-rose-600 text-white border-rose-400' : 'bg-slate-900 text-rose-200 border-rose-900'}`}>{URGENCY_LEVELS_MAP[k].label.split('—')[0]}</button>)}</div></div>}
            <div className="grid grid-cols-2 gap-2.5"><input value={locationName} onChange={e => setLocationName(e.target.value)} placeholder="Локація / назва місця" className="w-full px-3.5 py-3 rounded-xl bg-slate-900 border border-purple-900/50 text-white text-sm outline-none" /><input value={phone} onChange={e => setPhone(e.target.value)} required type="tel" placeholder="+380..." className="w-full px-3.5 py-3 rounded-xl bg-slate-900 border border-purple-900/50 text-white text-sm outline-none" /></div>
            <div className="grid grid-cols-2 gap-2.5"><input value={payAmount} onChange={e => setPayAmount(e.target.value)} placeholder="Оплата, грн" className="w-full px-3.5 py-3 rounded-xl bg-slate-900 border border-purple-900/50 text-white text-sm outline-none" /><select value={payType} onChange={e => setPayType(e.target.value as PayType)} className="w-full px-3.5 py-3 rounded-xl bg-slate-900 border border-purple-900/50 text-white text-sm outline-none"><option value="fixed">Фіксована</option><option value="hourly">За годину</option><option value="daily">За день</option><option value="monthly">За місяць</option><option value="free">Безкоштовно</option></select></div>
            <div className="grid grid-cols-2 gap-2.5"><select value={when} onChange={e => setWhen(e.target.value)} className="w-full px-3.5 py-3 rounded-xl bg-slate-900 border border-purple-900/50 text-white text-sm outline-none"><option>Сьогодні</option><option>Завтра</option><option>Найближчим часом</option><option>Постійно</option></select><input value={duration} onChange={e => setDuration(e.target.value)} placeholder="Тривалість" className="w-full px-3.5 py-3 rounded-xl bg-slate-900 border border-purple-900/50 text-white text-sm outline-none" /></div>
            <div className="relative"><Camera className="absolute left-3 top-3 w-4 h-4 text-purple-400" /><input type="url" value={photoUrl} onChange={e => setPhotoUrl(e.target.value)} placeholder="Посилання на фото (необов'язково)" className="w-full pl-9 pr-3.5 py-3 rounded-xl bg-slate-900 border border-purple-900/50 text-white text-sm outline-none" /></div>
            <button disabled={busy || !canPublish} type="submit" className={`w-full py-3.5 rounded-2xl font-black text-white flex items-center justify-center gap-2 disabled:opacity-50 ${isUrgent ? 'bg-rose-600' : 'bg-gradient-to-r from-purple-600 to-indigo-600'}`}><Send className="w-4 h-4" />{busy ? 'Публікація…' : canPublish ? 'Опублікувати оголошення' : 'Виберіть місце на карті або увімкніть GPS'}</button>
          </form>}
        </div>
      </div>
    </div>
  );
};