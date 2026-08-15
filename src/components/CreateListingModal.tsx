{/* SCROLLABLE FORM AREA */}
<div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
  <div className="p-4 sm:p-6 pb-32">
    {success ? (
      <div className="py-12 text-center space-y-4">
        <CheckCircle2 className="w-16 h-16 mx-auto text-emerald-400" />

        <h3 className="text-2xl font-black text-emerald-300">
          Оголошення додано!
        </h3>

        <p className="text-sm text-slate-300">
          Ваше оголошення успішно опубліковано.
        </p>

        <button
          type="button"
          onClick={onClose}
          className="px-8 py-3 bg-purple-600 rounded-2xl font-extrabold"
        >
          Готово
        </button>
      </div>
    ) : (
      <form
        id="create-listing-form"
        onSubmit={submit}
        className="space-y-4 pb-6"
      >
        {/* LOCATION STATUS */}
        <div
          className={`p-3 rounded-2xl border text-xs font-bold flex gap-2 ${
            canPublish
              ? 'bg-emerald-950/50 text-emerald-200 border-emerald-800/60'
              : 'bg-amber-950/60 text-amber-200 border-amber-800/60'
          }`}
        >
          <MapPin className="w-4 h-4 shrink-0" />

          <span>
            {canPublish
              ? 'Місце визначено. Координати збережено.'
              : 'Визначте місце для оголошення.'}
          </span>
        </div>

        {/* LOCATION BUTTONS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={determineAutomatically}
            disabled={locating}
            className="py-3 rounded-2xl bg-emerald-600 text-white font-black flex items-center justify-center gap-2"
          >
            <LocateFixed className="w-4 h-4" />

            {locating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Визначаю...
              </>
            ) : (
              'Визначити автоматично'
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setErrorMessage('');
              setMapOpen(true);
            }}
            className="py-3 rounded-2xl bg-cyan-600 text-white font-black flex items-center justify-center gap-2"
          >
            <MapPin className="w-4 h-4" />
            Вказати місце на карті
          </button>
        </div>

        {coordinates && (
          <div className="p-3 rounded-2xl bg-emerald-950/50 border border-emerald-800/50 text-xs font-bold text-emerald-200">
            📍 Координати вибрані:{' '}
            {coordinates[0].toFixed(6)},{' '}
            {coordinates[1].toFixed(6)}
          </div>
        )}

        {/* ERROR */}
        {errorMessage && (
          <div className="p-3 bg-rose-950/80 text-rose-200 border border-rose-800/60 rounded-2xl text-xs font-bold flex gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {errorMessage}
          </div>
        )}

        {/* CATEGORY */}
        <div>
          <label className="text-xs font-extrabold text-purple-300">
            ОСНОВНА КАТЕГОРІЯ
          </label>

          <div className="flex gap-2 overflow-x-auto mt-2 pb-1">
            {MAIN_CATEGORY_IDS.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => {
                  setCategory(k);
                  setSubcategory('');
                }}
                className={`shrink-0 px-3 py-2 rounded-2xl text-left border ${
                  category === k
                    ? 'bg-purple-600 text-white border-purple-400'
                    : 'bg-slate-900 text-purple-200 border-purple-900/40'
                }`}
              >
                <span>{CATEGORIES[k].pinSymbol}</span>

                <span className="block text-xs font-extrabold mt-1">
                  {CATEGORIES[k].shortLabel}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* SUBCATEGORY */}
        {subcategories.length > 0 && (
          <div>
            <label className="text-xs font-extrabold text-cyan-300">
              ПІДКАТЕГОРІЯ{' '}
              {category === 'sale' ? '— ПРОДАМ' : ''}
            </label>

            <div className="flex flex-wrap gap-1.5 mt-2">
              {subcategories.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() =>
                    setSubcategory(
                      subcategory === s ? '' : s
                    )
                  }
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                    subcategory === s
                      ? 'bg-cyan-500 text-slate-950'
                      : 'bg-slate-950 text-purple-200 border-purple-800/40'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TITLE */}
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={
            isUrgent
              ? 'Що потрібно терміново?'
              : 'Назва оголошення'
          }
          className="w-full px-3.5 py-3 rounded-xl bg-slate-900 border border-purple-900/50 text-white text-sm"
        />

        {/* DESCRIPTION */}
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Опис та деталі"
          className="w-full px-3.5 py-3 rounded-xl bg-slate-900 border border-purple-900/50 text-white text-sm"
        />

        {/* LOCATION NAME */}
        <input
          value={locationName}
          onChange={(e) => setLocationName(e.target.value)}
          placeholder="Вулиця, номер або назва місця"
          className="w-full px-3.5 py-3 rounded-xl bg-slate-900 border border-purple-900/50 text-white text-sm"
        />

        {/* PHONE */}
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          type="tel"
          placeholder="+380..."
          className="w-full px-3.5 py-3 rounded-xl bg-slate-900 border border-purple-900/50 text-white text-sm"
        />

        {/* PHOTO */}
        <div>
          <label className="text-xs font-extrabold text-cyan-300">
            ФОТО ТОВАРУ — 1 ФОТО
          </label>

          <div className="mt-2 rounded-2xl border border-dashed border-cyan-500/50 bg-slate-900/70 p-3">
            {photoPreview ? (
              <div className="relative">
                <div className="w-full max-h-[60vh] flex items-center justify-center overflow-hidden rounded-xl bg-slate-950">
                  <img
                    src={photoPreview}
                    alt="Фото товару"
                    className="block max-w-full max-h-[60vh] w-auto h-auto object-contain rounded-xl"
                  />
                </div>

                <button
                  type="button"
                  onClick={clearPhoto}
                  className="absolute right-2 top-2 rounded-full bg-rose-600 px-3 py-1.5 text-xs font-black text-white"
                >
                  Видалити
                </button>

                <div className="mt-2 text-[10px] text-emerald-300 font-bold">
                  WebP:{' '}
                  {(photoOriginalSize / 1024 / 1024).toFixed(1)}{' '}
                  МБ →{' '}
                  {(photoCompressedSize / 1024).toFixed(0)}{' '}
                  КБ · збережено пропорції
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={processingPhoto}
                  onClick={() =>
                    cameraInputRef.current?.click()
                  }
                  className="py-7 rounded-xl bg-slate-950 text-cyan-200 font-black flex flex-col items-center justify-center gap-2"
                >
                  <Camera className="w-8 h-8" />
                  <span>Зробити фото</span>
                </button>

                <button
                  type="button"
                  disabled={processingPhoto}
                  onClick={() =>
                    photoInputRef.current?.click()
                  }
                  className="py-7 rounded-xl bg-slate-950 text-cyan-200 font-black flex flex-col items-center justify-center gap-2"
                >
                  <ImagePlus className="w-8 h-8" />
                  <span>З галереї</span>
                </button>
              </div>
            )}

            {processingPhoto && (
              <div className="mt-2 text-center text-xs text-cyan-300 font-bold flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Конвертую у WebP…
              </div>
            )}

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                void handlePhoto(e.target.files?.[0]);
                e.currentTarget.value = '';
              }}
            />

            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                void handlePhoto(e.target.files?.[0]);
                e.currentTarget.value = '';
              }}
            />
          </div>
        </div>

        {/* PAYMENT */}
        <div className="grid grid-cols-2 gap-2.5">
          <input
            value={payAmount}
            onChange={(e) => setPayAmount(e.target.value)}
            placeholder="Ціна / оплата, грн"
            className="w-full px-3.5 py-3 rounded-xl bg-slate-900 border border-purple-900/50 text-white text-sm"
          />

          <select
            value={payType}
            onChange={(e) =>
              setPayType(e.target.value as PayType)
            }
            className="w-full px-3.5 py-3 rounded-xl bg-slate-900 border border-purple-900/50 text-white text-sm"
          >
            <option value="fixed">Фіксована</option>
            <option value="hourly">За годину</option>
            <option value="daily">За день</option>
            <option value="monthly">За місяць</option>
            <option value="free">Безкоштовно</option>
          </select>
        </div>

        {/* WHEN / DURATION */}
        <div className="grid grid-cols-2 gap-2.5">
          <select
            value={when}
            onChange={(e) => setWhen(e.target.value)}
            className="w-full px-3.5 py-3 rounded-xl bg-slate-900 border border-purple-900/50 text-white text-sm"
          >
            <option>Сьогодні</option>
            <option>Завтра</option>
            <option>Найближчим часом</option>
            <option>Постійно</option>
          </select>

          <input
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="Тривалість"
            className="w-full px-3.5 py-3 rounded-xl bg-slate-900 border border-purple-900/50 text-white text-sm"
          />
        </div>

        {/* URGENT */}
        {isUrgent && (
          <div className="p-3 rounded-2xl bg-rose-950/60 border border-rose-800/50 space-y-2">
            <div className="text-rose-300 text-xs font-black">
              🚨 ТЕРМІНОВА ДОПОМОГА
            </div>

            <div className="flex flex-wrap gap-2">
              {(Object.keys(
                URGENT_TYPES_MAP
              ) as UrgentHelpType[]).map((k) => (
                <button
                  type="button"
                  key={k}
                  onClick={() => setUrgentType(k)}
                  className={`px-2 py-1.5 rounded-xl text-xs font-bold border ${
                    urgentType === k
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-900 text-rose-200 border-rose-900'
                  }`}
                >
                  {URGENT_TYPES_MAP[k].label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {(Object.keys(
                URGENCY_LEVELS_MAP
              ) as UrgencyLevel[]).map((k) => (
                <button
                  type="button"
                  key={k}
                  onClick={() => setUrgencyLevel(k)}
                  className={`px-2 py-1.5 rounded-xl text-xs font-bold border ${
                    urgencyLevel === k
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-900 text-rose-200 border-rose-900'
                  }`}
                >
                  {URGENCY_LEVELS_MAP[k].label.split('—')[0]}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* EXTRA SPACE FOR PUBLISH BAR */}
        <div className="h-20" />
      </form>
    )}
  </div>
</div>

{/* PUBLISH BAR */}
{!success && (
  <div
    className="
      shrink-0
      relative
      z-[100]
      p-3
      sm:p-4
      bg-slate-950
      border-t
      border-purple-900/60
      shadow-[0_-10px_30px_rgba(0,0,0,0.55)]
      pb-[calc(0.75rem+env(safe-area-inset-bottom))]
      sm:pb-4
    "
  >
    <button
      disabled={
        busy ||
        processingPhoto ||
        !canPublish
      }
      type="submit"
      form="create-listing-form"
      className={`w-full py-4 rounded-2xl text-white font-black text-base flex items-center justify-center gap-2 shadow-xl border border-white/10 transition ${
        canPublish &&
        !busy &&
        !processingPhoto
          ? 'bg-gradient-to-r from-purple-600 to-cyan-600 active:scale-[0.99]'
          : 'bg-slate-700/70 text-slate-400 cursor-not-allowed'
      }`}
    >
      <Send className="w-5 h-5" />

      {processingPhoto
        ? 'Конвертую фото…'
        : busy
        ? 'Публікація…'
        : 'Опублікувати оголошення'}
    </button>

    {!canPublish && (
      <div className="text-center text-[10px] text-amber-300/70 mt-1.5">
        Спочатку виберіть місце на карті
        або визначте його автоматично
      </div>
    )}
  </div>
)}
