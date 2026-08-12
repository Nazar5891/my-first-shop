import React, { useState } from 'react';
import {
  X,
  MapPin,
  Phone,
  Siren,
  Camera,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Send,
} from 'lucide-react';
import {
  CategoryId,
  CATEGORIES,
  UrgencyLevel,
  UrgentHelpType,
  URGENCY_LEVELS_MAP,
  URGENT_TYPES_MAP,
  Listing,
  PayType,
} from '../types';
import { COMMUNITY_CENTER } from '../data/mockListings';

interface CreateListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newListing: Omit<Listing, 'id' | 'createdAt' | 'viewsCount' | 'callsCount' | 'distanceMeters'>) => void;
  userCoordinates?: [number, number];
}

export const CreateListingModal: React.FC<CreateListingModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  userCoordinates = COMMUNITY_CENTER,
}) => {
  if (!isOpen) return null;

  // Form State
  const [step, setStep] = useState<'form' | 'sms_verify' | 'success'>('form');
  const [category, setCategory] = useState<CategoryId>('part_time');
  const [subcategory, setSubcategory] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payType, setPayType] = useState<PayType>('fixed');
  const [locationName, setLocationName] = useState('смт Рокитне, центр');
  const [when, setWhen] = useState('Сьогодні');
  const [duration, setDuration] = useState('2 години');
  const [phone, setPhone] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [coords, setCoords] = useState<[number, number]>(userCoordinates);

  // Rideshare specific state
  const [rideRole, setRideRole] = useState<'driver' | 'passenger'>('driver');
  const [rideRouteFrom, setRideRouteFrom] = useState('смт Рокитне');
  const [rideRouteTo, setRideRouteTo] = useState('м. Рівне');
  const [rideDepartureTime, setRideDepartureTime] = useState('Сьогодні о 15:00');
  const [rideSeats, setRideSeats] = useState<number>(3);
  const [rideCarInfo, setRideCarInfo] = useState('');

  // Urgent Help Specific Fields
  const [urgencyLevel, setUrgencyLevel] = useState<UrgencyLevel>('immediate');
  const [urgentType, setUrgentType] = useState<UrgentHelpType>('auto');

  // SMS Verification state
  const [smsCode, setSmsCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('7788');
  const [authorDeleteCode, setAuthorDeleteCode] = useState('8899');
  const [errorMessage, setErrorMessage] = useState('');

  const isUrgent = category === 'urgent';
  const isRideshare = category === 'rideshare';
  const currentCategoryObj = CATEGORIES[category];

  const handleNextToSms = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (isRideshare) {
      if (!rideRouteFrom.trim() || !rideRouteTo.trim()) {
        setErrorMessage('Будь ласка, вкажіть пункт відправлення та пункт призначення');
        return;
      }
    } else {
      if (!title.trim()) {
        setErrorMessage('Будь ласка, вкажіть що саме вам потрібно');
        return;
      }
    }

    if (!phone.trim() || phone.length < 9) {
      setErrorMessage('Вкажіть правильний номер телефону (+380...)');
      return;
    }

    // Generate random OTP code for verification step
    const randomOtp = Math.floor(1000 + Math.random() * 9000).toString();
    const randomDelCode = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(randomOtp);
    setAuthorDeleteCode(randomDelCode);
    setStep('sms_verify');
  };

  const handleConfirmSms = () => {
    if (smsCode !== generatedOtp && smsCode !== '7788') {
      setErrorMessage('Невірний код з SMS. Спробуйте код 7788');
      return;
    }

    let finalPayText = payAmount ? `${payAmount} грн` : 'За домовленістю';
    if (payType === 'hourly') finalPayText += '/год';
    if (payType === 'daily') finalPayText += '/день';
    if (payType === 'monthly') finalPayText += '/міс';
    if (payType === 'free') finalPayText = 'Безкоштовно';

    const numPay = parseInt(payAmount.replace(/\D/g, ''), 10) || 0;

    const computedTitle = isRideshare
      ? `${rideRole === 'driver' ? '🚗 Водій' : '🙋‍♂️ Пасажир'}: ${rideRouteFrom} ➔ ${rideRouteTo}`
      : isUrgent
      ? `🚨 ${title}`
      : title;

    onSubmit({
      title: computedTitle,
      category,
      subcategory: subcategory || (isRideshare ? (rideRole === 'driver' ? 'Водій (Пропоную поїздку)' : 'Пасажир (Шукаю підвіз)') : undefined),
      description: description || (isRideshare ? `Поїздка за маршрутом ${rideRouteFrom} - ${rideRouteTo}. Час виїзду: ${rideDepartureTime}.` : 'Опис не вказано.'),
      pay: finalPayText,
      payValueNumber: numPay,
      payType,
      locationName: locationName || 'Рокитнівська громада',
      coordinates: coords,
      when: isRideshare ? rideDepartureTime : isUrgent ? 'Терміново (зараз)' : when,
      duration: isRideshare ? 'Поїздка' : duration,
      phone,
      isUrgent,
      urgencyLevel: isUrgent ? urgencyLevel : undefined,
      urgentType: isUrgent ? urgentType : undefined,
      photoUrl: photoUrl || undefined,
      verified: true,
      authorSmsCode: authorDeleteCode,

      // Rideshare specific
      rideRole: isRideshare ? rideRole : undefined,
      rideRouteFrom: isRideshare ? rideRouteFrom : undefined,
      rideRouteTo: isRideshare ? rideRouteTo : undefined,
      rideDepartureTime: isRideshare ? rideDepartureTime : undefined,
      rideSeats: isRideshare ? rideSeats : undefined,
      rideCarInfo: isRideshare && rideRole === 'driver' ? rideCarInfo : undefined,
    });

    setStep('success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-950/95 backdrop-blur-2xl text-slate-100 rounded-3xl shadow-2xl border border-purple-900/50 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-purple-900/40 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-base shadow-md shadow-purple-950/80">
              ＋
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-100 leading-tight">
                Додати оголошення
              </h2>
              <p className="text-[11px] font-medium text-purple-300/70">
                Без реєстрації • Публікація за 1 хвилину
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-900 hover:bg-purple-950 text-purple-300 border border-purple-800/40 flex items-center justify-center font-bold transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {errorMessage && (
            <div className="p-3 bg-rose-950/80 text-rose-200 border border-rose-800/60 rounded-2xl text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {step === 'form' && (
            <form onSubmit={handleNextToSms} className="space-y-4">
              {/* Category selector grid */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-purple-300 uppercase tracking-widest block">
                  1. Категорія
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(Object.keys(CATEGORIES) as CategoryId[])
                    .filter((catKey) => catKey !== 'sale')
                    .map((catKey) => {
                      const cat = CATEGORIES[catKey];
                      const isSelected = category === catKey;
                      return (
                        <button
                          key={catKey}
                          type="button"
                          onClick={() => {
                            setCategory(catKey);
                            setSubcategory('');
                          }}
                          className={`p-2.5 rounded-2xl text-left border transition-all flex flex-col justify-between space-y-1 ${
                            isSelected
                              ? catKey === 'urgent'
                                ? 'bg-rose-600 text-white border-rose-500 shadow-md ring-2 ring-rose-500/30'
                                : catKey === 'rideshare'
                                ? 'bg-sky-600 text-white border-sky-400 shadow-md ring-2 ring-sky-500/30'
                                : 'bg-purple-600 text-white border-purple-400 shadow-md ring-2 ring-purple-500/30'
                              : 'bg-slate-900/80 text-purple-200 hover:bg-purple-950/60 border-purple-900/40'
                          }`}
                        >
                          <span className="text-base">{cat.pinSymbol}</span>
                          <span className="text-xs font-extrabold leading-tight">
                            {cat.shortLabel || cat.label}
                          </span>
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Subcategories selector if available */}
              {currentCategoryObj?.subcategories && currentCategoryObj.subcategories.length > 0 && !isRideshare && (
                <div className="space-y-1.5 p-3 rounded-2xl bg-slate-900/80 border border-purple-900/40">
                  <label className="text-xs font-extrabold text-cyan-300 uppercase tracking-widest block">
                    Підкатегорія (необов’язково)
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {currentCategoryObj.subcategories.map((sub) => {
                      const isSel = subcategory === sub;
                      return (
                        <button
                          key={sub}
                          type="button"
                          onClick={() => setSubcategory(isSel ? '' : sub)}
                          className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all ${
                            isSel
                              ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-sm'
                              : 'bg-slate-950 text-purple-200 hover:bg-purple-900/50 border-purple-800/40'
                          }`}
                        >
                          {sub}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* RIDESHARE (BLABLACAR) SPECIFIC CONTROLS */}
              {isRideshare && (
                <div className="p-4 bg-gradient-to-br from-sky-950/90 to-slate-950 border-2 border-sky-500/60 rounded-2xl space-y-4 animate-fade-in shadow-xl">
                  <div className="flex items-center justify-between border-b border-sky-800/50 pb-2">
                    <span className="text-xs font-black uppercase text-sky-300 tracking-wider flex items-center gap-1.5">
                      <span>🚗</span>
                      <span>Параметри підвозу (BlaBlaCar)</span>
                    </span>
                  </div>

                  {/* Role Selector: Driver vs Passenger */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRideRole('driver')}
                      className={`p-3 rounded-xl text-center font-extrabold text-xs transition-all border flex flex-col items-center gap-1 ${
                        rideRole === 'driver'
                          ? 'bg-sky-600 text-white border-sky-300 shadow-lg ring-2 ring-sky-400/50'
                          : 'bg-slate-900/90 text-sky-200 border-sky-900/60 hover:bg-sky-950'
                      }`}
                    >
                      <span className="text-lg">🚗</span>
                      <span>Я ВОДІЙ (Пропоную)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRideRole('passenger')}
                      className={`p-3 rounded-xl text-center font-extrabold text-xs transition-all border flex flex-col items-center gap-1 ${
                        rideRole === 'passenger'
                          ? 'bg-orange-600 text-white border-orange-300 shadow-lg ring-2 ring-orange-400/50'
                          : 'bg-slate-900/90 text-orange-200 border-orange-900/60 hover:bg-orange-950'
                      }`}
                    >
                      <span className="text-lg">🙋‍♂️</span>
                      <span>Я ПАСАЖИР (Шукаю)</span>
                    </button>
                  </div>

                  {/* Route Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-extrabold text-sky-200 block uppercase">
                        Звідки (Пункт А) *
                      </label>
                      <input
                        type="text"
                        required
                        value={rideRouteFrom}
                        onChange={(e) => setRideRouteFrom(e.target.value)}
                        placeholder="напр. смт Рокитне"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 text-slate-100 text-xs font-bold border border-sky-800 focus:border-sky-400 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-extrabold text-sky-200 block uppercase">
                        Куди (Пункт Б) *
                      </label>
                      <input
                        type="text"
                        required
                        value={rideRouteTo}
                        onChange={(e) => setRideRouteTo(e.target.value)}
                        placeholder="напр. м. Рівне (автовокзал)"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 text-slate-100 text-xs font-bold border border-sky-800 focus:border-sky-400 outline-none"
                      />
                    </div>
                  </div>

                  {/* Departure time & Seats */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-extrabold text-sky-200 block uppercase">
                        Дата та час виїзду *
                      </label>
                      <input
                        type="text"
                        required
                        value={rideDepartureTime}
                        onChange={(e) => setRideDepartureTime(e.target.value)}
                        placeholder="напр. Сьогодні о 17:30"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 text-slate-100 text-xs font-bold border border-sky-800 focus:border-sky-400 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-extrabold text-sky-200 block uppercase">
                        {rideRole === 'driver' ? 'Вільних місць' : 'Кількість пасажирів'}
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={8}
                        value={rideSeats}
                        onChange={(e) => setRideSeats(parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 text-slate-100 text-xs font-bold border border-sky-800 focus:border-sky-400 outline-none"
                      />
                    </div>
                  </div>

                  {/* Car info for Drivers */}
                  {rideRole === 'driver' && (
                    <div className="space-y-1">
                      <label className="text-[11px] font-extrabold text-sky-200 block uppercase">
                        Автомобіль (марка, колір)
                      </label>
                      <input
                        type="text"
                        value={rideCarInfo}
                        onChange={(e) => setRideCarInfo(e.target.value)}
                        placeholder="напр. Skoda Octavia, срібляста"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 text-slate-100 text-xs font-bold border border-sky-800 focus:border-sky-400 outline-none"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* URGENT HELP SPECIFIC CONTROLS */}
              {isUrgent && (
                <div className="p-4 bg-rose-950/70 border-2 border-rose-600/50 rounded-2xl space-y-3 animate-fade-in">
                  <div className="flex items-center gap-2 text-rose-300 font-extrabold text-xs uppercase tracking-wider">
                    <Siren className="w-4 h-4 text-rose-400 animate-bounce" />
                    <span>Параметри термінової допомоги</span>
                  </div>

                  {/* Type of Help */}
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-rose-200 block">Тип термінової потреби:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {(Object.keys(URGENT_TYPES_MAP) as UrgentHelpType[]).map((typeKey) => {
                        const info = URGENT_TYPES_MAP[typeKey];
                        const isSel = urgentType === typeKey;
                        return (
                          <button
                            key={typeKey}
                            type="button"
                            onClick={() => setUrgentType(typeKey)}
                            className={`p-2 rounded-xl text-left text-xs font-bold border transition-all ${
                              isSel
                                ? 'bg-rose-600 text-white border-rose-500 shadow-xs'
                                : 'bg-slate-900/90 text-rose-200 hover:bg-rose-900/60 border-rose-800/40'
                            }`}
                          >
                            {info.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Urgency Level */}
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-rose-200 block">Рівень терміновості:</span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(Object.keys(URGENCY_LEVELS_MAP) as UrgencyLevel[]).map((levelKey) => {
                        const levelInfo = URGENCY_LEVELS_MAP[levelKey];
                        const isSel = urgencyLevel === levelKey;
                        return (
                          <button
                            key={levelKey}
                            type="button"
                            onClick={() => setUrgencyLevel(levelKey)}
                            className={`p-2 rounded-xl text-center text-xs font-extrabold border transition-all ${
                              isSel
                                ? 'bg-rose-600 text-white border-rose-500 shadow-xs'
                                : 'bg-slate-900/90 text-rose-200 hover:bg-rose-900/60 border-rose-800/40'
                            }`}
                          >
                            {levelInfo.label.split('—')[0]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* What is needed? Title */}
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-purple-300 uppercase tracking-widest block">
                  2. Що потрібно? (Короткий заголовок) *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={
                    isUrgent
                      ? 'Наприклад: Зламалося авто, потрібен буксир!'
                      : 'Наприклад: Покосити траву / Продавець у магазин'
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-purple-900/50 font-bold text-slate-100 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 outline-none bg-slate-900/90 placeholder-purple-300/40"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-purple-300 uppercase tracking-widest block">
                  3. Опис та деталі
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Опишіть обсяг роботи, інструменти або умови..."
                  className="w-full px-3.5 py-2 rounded-xl border border-purple-900/50 font-medium text-slate-100 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 outline-none bg-slate-900/90 placeholder-purple-300/40"
                />
              </div>

              {/* Location */}
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-purple-300 uppercase tracking-widest block">
                  4. Локація
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-purple-400" />
                  <input
                    type="text"
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    placeholder="смт Рокитне, вул. Соборна 10"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-purple-900/50 font-bold text-slate-100 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 outline-none bg-slate-900/90 placeholder-purple-300/40"
                  />
                </div>
              </div>

              {/* Pay & Duration Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-purple-300 uppercase tracking-widest block">
                    Оплата (грн)
                  </label>
                  <input
                    type="text"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    placeholder="600 або 18000"
                    className="w-full px-3.5 py-2 rounded-xl border border-purple-900/50 font-bold text-slate-100 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 outline-none bg-slate-900/90 placeholder-purple-300/40"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-purple-300 uppercase tracking-widest block">
                    Тип оплати
                  </label>
                  <select
                    value={payType}
                    onChange={(e) => setPayType(e.target.value as PayType)}
                    className="w-full px-3.5 py-2 rounded-xl border border-purple-900/50 font-bold text-slate-100 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 outline-none bg-slate-900/90"
                  >
                    <option value="fixed" className="bg-slate-950 text-slate-200">Фіксована сума</option>
                    <option value="hourly" className="bg-slate-950 text-slate-200">грн / годину</option>
                    <option value="daily" className="bg-slate-950 text-slate-200">грн / день</option>
                    <option value="monthly" className="bg-slate-950 text-slate-200">грн / місяць</option>
                    <option value="free" className="bg-slate-950 text-slate-200">Безкоштовно / Допомога</option>
                  </select>
                </div>
              </div>

              {/* When & Duration */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-purple-300 uppercase tracking-widest block">
                    Коли?
                  </label>
                  <select
                    value={when}
                    onChange={(e) => setWhen(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-purple-900/50 font-bold text-slate-100 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 outline-none bg-slate-900/90"
                  >
                    <option value="Сьогодні" className="bg-slate-950 text-slate-200">Сьогодні</option>
                    <option value="Завтра" className="bg-slate-950 text-slate-200">Завтра</option>
                    <option value="Найближчим часом" className="bg-slate-950 text-slate-200">Найближчим часом</option>
                    <option value="Постійно" className="bg-slate-950 text-slate-200">Постійно</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-purple-300 uppercase tracking-widest block">
                    Тривалість
                  </label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="2 години / 1 день"
                    className="w-full px-3.5 py-2 rounded-xl border border-purple-900/50 font-bold text-slate-100 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 outline-none bg-slate-900/90 placeholder-purple-300/40"
                  />
                </div>
              </div>

              {/* Mandatory Phone Number */}
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-purple-300 uppercase tracking-widest block">
                  Номер телефону * (Обов'язково для дзвінка)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-4 h-4 text-purple-400" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+380 67 123 45 67"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-purple-900/50 font-extrabold text-slate-100 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 outline-none bg-slate-900/90 placeholder-purple-300/40"
                  />
                </div>
              </div>

              {/* Optional Photo URL */}
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-purple-400/80 uppercase tracking-widest block">
                  Фото (Необов'язково)
                </label>
                <div className="relative">
                  <Camera className="absolute left-3 top-3 w-4 h-4 text-purple-400" />
                  <input
                    type="url"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="https://... посилання на фото"
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-purple-900/50 font-medium text-slate-100 text-xs focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 outline-none bg-slate-900/90 placeholder-purple-300/40"
                  />
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                className={`w-full py-3.5 rounded-2xl font-black text-white text-base shadow-lg transition-all active:scale-98 flex items-center justify-center gap-2 ${
                  isUrgent
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-950/80 ring-2 ring-rose-500/30'
                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-purple-950/80 ring-2 ring-purple-500/30'
                }`}
              >
                <span>Опублікувати оголошення</span>
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* SMS VERIFICATION STEP */}
          {step === 'sms_verify' && (
            <div className="py-4 space-y-4 text-center">
              <div className="w-12 h-12 bg-purple-950 text-purple-300 border border-purple-800/50 rounded-full flex items-center justify-center mx-auto">
                <ShieldCheck className="w-7 h-7" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-100">
                  Підтвердження номера
                </h3>
                <p className="text-xs text-purple-200/80 font-medium max-w-sm mx-auto">
                  Ми надіслали одноразовий SMS-код на номер <strong className="text-slate-100">{phone}</strong>.
                </p>
              </div>

              {/* Simulated SMS Notification Banner */}
              <div className="bg-purple-950/80 border border-purple-800/60 rounded-2xl p-3.5 text-left text-xs space-y-1">
                <div className="flex items-center justify-between font-bold text-purple-200">
                  <span>💬 Імітація SMS входу:</span>
                  <button
                    type="button"
                    onClick={() => setSmsCode(generatedOtp)}
                    className="text-violet-300 underline font-black"
                  >
                    Вставити {generatedOtp}
                  </button>
                </div>
                <p className="text-purple-300/90 font-medium">
                  Ваш код підтвердження в Помічнику: <strong className="text-white font-black">{generatedOtp}</strong> (або введіть 7788).
                </p>
              </div>

              {/* Code Input */}
              <div className="space-y-2 max-w-xs mx-auto">
                <input
                  type="text"
                  maxLength={4}
                  value={smsCode}
                  onChange={(e) => setSmsCode(e.target.value)}
                  placeholder="7788"
                  className="w-full text-center text-2xl font-black tracking-widest py-3 rounded-2xl border-2 border-purple-500 focus:ring-4 focus:ring-purple-500/30 outline-none bg-slate-900 text-white"
                />

                <button
                  type="button"
                  onClick={handleConfirmSms}
                  className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-sm rounded-2xl shadow-lg shadow-purple-950/80 transition-all"
                >
                  Підтвердити та публікувати
                </button>

                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="text-xs font-bold text-purple-400 hover:underline block mx-auto"
                >
                  ← Повернутися до редагування
                </button>
              </div>
            </div>
          )}

          {/* SUCCESS STEP */}
          {step === 'success' && (
            <div className="py-6 space-y-4 text-center">
              <div className="w-16 h-16 bg-purple-950 text-purple-300 border border-purple-700/60 rounded-full flex items-center justify-center mx-auto animate-bounce shadow-lg shadow-purple-950/80">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-black text-slate-100">
                  Оголошення опубліковано!
                </h3>
                <p className="text-xs text-purple-200/80 font-medium max-w-sm mx-auto">
                  Воно вже відображається на карті громади та у списку "Поруч зі мною".
                </p>
              </div>

              <div className="bg-slate-900/90 p-4 rounded-2xl border border-purple-900/50 text-left space-y-1.5 max-w-sm mx-auto">
                <div className="flex items-center justify-between text-xs font-bold text-purple-200">
                  <span>Код видалення для автора:</span>
                  <span className="font-mono bg-slate-950 px-2 py-0.5 rounded border border-purple-700 font-black text-violet-300">
                    {authorDeleteCode}
                  </span>
                </div>
                <p className="text-[11px] text-purple-300/70">
                  Збережіть цей код. Якщо завдання виконано, ви зможете швидко закрити оголошення за цим кодом без реєстрації.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="px-8 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-sm rounded-2xl shadow-lg transition-all"
              >
                Зрозуміло, на карту
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
