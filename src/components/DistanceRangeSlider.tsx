import React from 'react';
import { Target, Compass, Check } from 'lucide-react';

export const RADIUS_STEPS: (number | null)[] = [1, 5, 10, 20, null];

interface DistanceRangeSliderProps {
  maxRadiusKm: number | null;
  onChangeMaxRadiusKm: (radius: number | null) => void;
  filteredCount?: number;
  totalCount?: number;
  compact?: boolean;
}

export const DistanceRangeSlider: React.FC<DistanceRangeSliderProps> = ({
  maxRadiusKm,
  onChangeMaxRadiusKm,
  filteredCount,
  totalCount,
  compact = false,
}) => {
  // Find index corresponding to maxRadiusKm
  const currentIndex = RADIUS_STEPS.findIndex((step) => step === maxRadiusKm);
  const safeIndex = currentIndex !== -1 ? currentIndex : 4; // default to 'All' if unmatched

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const idx = parseInt(e.target.value, 10);
    const newRadius = RADIUS_STEPS[idx];
    onChangeMaxRadiusKm(newRadius);
  };

  const getLabel = (step: number | null) => {
    if (step === null) return 'Всі';
    return `${step} км`;
  };

  const currentLabel = maxRadiusKm === null ? 'Вся громада (без обмежень)' : `до ${maxRadiusKm} км`;

  return (
    <div className={`bg-slate-900/90 backdrop-blur-md rounded-2xl border border-purple-900/50 p-3.5 shadow-xl space-y-3 transition-all ${compact ? 'py-2.5 px-3' : ''}`}>
      {/* Header Info */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-950 text-purple-300 border border-purple-800/60 flex items-center justify-center shrink-0">
            <Compass className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-extrabold text-slate-100 uppercase tracking-wider">
                Радіус відображення
              </span>
              <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-purple-900/80 text-purple-200 border border-purple-700/60">
                {currentLabel}
              </span>
            </div>
            {!compact && totalCount !== undefined && filteredCount !== undefined && (
              <p className="text-[11px] font-medium text-purple-300/70 leading-none mt-0.5">
                Відображається: <strong className="text-white">{filteredCount}</strong> з {totalCount} оголошень
              </p>
            )}
          </div>
        </div>

        {maxRadiusKm !== null && (
          <button
            onClick={() => onChangeMaxRadiusKm(null)}
            className="text-[11px] font-bold text-violet-400 hover:text-violet-200 bg-purple-950/60 hover:bg-purple-900/80 px-2.5 py-1 rounded-lg border border-purple-800/50 transition-colors"
          >
            Скинути (Всі)
          </button>
        )}
      </div>

      {/* Range Slider Control */}
      <div className="space-y-1.5 px-1">
        <div className="relative flex items-center">
          <input
            type="range"
            min={0}
            max={RADIUS_STEPS.length - 1}
            step={1}
            value={safeIndex}
            onChange={handleSliderChange}
            className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-purple-500 hover:accent-purple-400 focus:outline-none ring-1 ring-purple-900/60"
            aria-label="Повзунок діапазону відстані"
          />
        </div>

        {/* Step Ticks Below Slider */}
        <div className="flex justify-between items-center text-[11px] font-extrabold text-purple-300/70 pt-0.5">
          {RADIUS_STEPS.map((step, idx) => {
            const isActive = safeIndex === idx;
            return (
              <span
                key={idx}
                onClick={() => onChangeMaxRadiusKm(step)}
                className={`cursor-pointer transition-colors px-1 py-0.5 rounded ${
                  isActive ? 'text-purple-300 font-black scale-105' : 'hover:text-purple-200'
                }`}
              >
                {getLabel(step)}
              </span>
            );
          })}
        </div>
      </div>

      {/* Preset Quick Buttons */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
        {RADIUS_STEPS.map((step, idx) => {
          const isSelected = safeIndex === idx;
          return (
            <button
              key={idx}
              onClick={() => onChangeMaxRadiusKm(step)}
              className={`flex-1 min-w-[54px] py-1 px-2 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all border flex items-center justify-center gap-1 ${
                isSelected
                  ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-950/80 font-black'
                  : 'bg-slate-950/80 text-purple-200/90 hover:bg-purple-950/60 border-purple-900/40'
              }`}
            >
              {isSelected && <Check className="w-3 h-3 text-white shrink-0" />}
              <span>{getLabel(step)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
