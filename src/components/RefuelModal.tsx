import React, { useState } from 'react';
import { Check, Fuel, Sparkles, X, Zap } from 'lucide-react';
import { FuelStation } from '../types/game';
import { audioService } from '../services/audioService';

interface RefuelModalProps {
  station: FuelStation;
  currentFuel: number;
  fuelCapacity: number;
  coins: number;
  onRefuel: (liters: number, cost: number) => void;
  onClose: () => void;
}

export const RefuelModal: React.FC<RefuelModalProps> = ({
  station,
  currentFuel,
  fuelCapacity,
  coins,
  onRefuel,
  onClose
}) => {
  const [isPumping, setIsPumping] = useState(false);
  const [pumpedLiters, setPumpedLiters] = useState<number | null>(null);

  const neededFuel = Math.max(0, Math.round(fuelCapacity - currentFuel));
  const isIO = station.brand === 'IndianOil';

  const handleRefuelAction = (litersToAdd: number) => {
    const actualLiters = Math.min(neededFuel, litersToAdd);
    if (actualLiters <= 0) return;

    const totalCost = Math.round(actualLiters * station.pricePerLiter);
    if (coins < totalCost) return;

    setIsPumping(true);
    audioService.playRefuelPump();

    setTimeout(() => {
      onRefuel(actualLiters, totalCost);
      setIsPumping(false);
      setPumpedLiters(actualLiters);
      setTimeout(() => {
        setPumpedLiters(null);
      }, 2500);
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 text-white overflow-y-auto">
      <div className="bg-neutral-900 border border-white/10 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative text-center my-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-neutral-800 hover:bg-neutral-700 rounded-xl text-neutral-400 hover:text-white transition-all"
        >
          <X size={18} />
        </button>

        {/* Station Emblem */}
        <div
          className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-3xl shadow-lg border-2 mb-3"
          style={{
            backgroundColor: isIO ? '#1e3a8a' : '#1d4ed8',
            borderColor: isIO ? '#f97316' : '#facc15'
          }}
        >
          ⛽
        </div>

        <span
          className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded border"
          style={{
            backgroundColor: isIO ? 'rgba(249,115,22,0.1)' : 'rgba(250,204,21,0.1)',
            borderColor: isIO ? 'rgba(249,115,22,0.3)' : 'rgba(250,204,21,0.3)',
            color: isIO ? '#fb923c' : '#facc15'
          }}
        >
          {station.brand} Highway Service Point
        </span>

        <h2 className="text-xl md:text-2xl font-black uppercase tracking-wider text-white mt-1">
          {station.name}
        </h2>
        <div className="text-xs text-neutral-400 mb-4">
          High-Speed Commercial Diesel • Rate: <span className="text-emerald-400 font-bold font-mono">₹{station.pricePerLiter.toFixed(2)} / L</span>
        </div>

        {/* Current Fuel Tank Level Card */}
        <div className="bg-neutral-950 p-4 rounded-2xl border border-white/5 mb-5 text-left">
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="text-neutral-400 flex items-center gap-1.5">
              <Fuel size={14} className="text-amber-400" />
              Bus Diesel Tank
            </span>
            <span className="font-mono font-bold text-amber-300">
              {Math.round(currentFuel)} / {fuelCapacity} Liters ({Math.round((currentFuel / fuelCapacity) * 100)}%)
            </span>
          </div>
          <div className="w-full bg-neutral-800 h-3 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                currentFuel / fuelCapacity < 0.2 ? 'bg-red-500' : 'bg-amber-400'
              }`}
              style={{ width: `${(currentFuel / fuelCapacity) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-neutral-400 mt-2">
            <span>Needed for full tank: <strong className="text-white">{neededFuel} L</strong></span>
            <span>Your Balance: <strong className="text-amber-400 font-mono">₹{coins.toLocaleString('en-IN')}</strong></span>
          </div>
        </div>

        {/* Success confirmation toast */}
        {pumpedLiters !== null && (
          <div className="mb-4 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5">
            <Check size={16} />
            Refueled +{pumpedLiters} Liters of Diesel! Ready for highway.
          </div>
        )}

        {/* Refuel Preset Buttons */}
        <div className="grid grid-cols-3 gap-2.5 mb-4">
          {[25, 50, 100].map((liters) => {
            const cost = Math.round(liters * station.pricePerLiter);
            const canAfford = coins >= cost;
            const disabled = neededFuel < 5 || !canAfford || isPumping;

            return (
              <button
                key={liters}
                onClick={() => handleRefuelAction(liters)}
                disabled={disabled}
                className={`p-3 rounded-2xl border flex flex-col items-center justify-center transition-all active:scale-95 ${
                  disabled
                    ? 'bg-neutral-950/60 border-neutral-800 text-neutral-600 cursor-not-allowed'
                    : 'bg-neutral-800 hover:bg-neutral-700 border-white/10 text-white'
                }`}
              >
                <span className="text-xs font-black text-amber-300">+{liters} Liters</span>
                <span className="text-[10px] text-neutral-400 font-mono mt-0.5">₹{cost}</span>
              </button>
            );
          })}
        </div>

        {/* Full Tank Button */}
        <button
          onClick={() => handleRefuelAction(neededFuel)}
          disabled={neededFuel <= 2 || coins < Math.round(neededFuel * station.pricePerLiter) || isPumping}
          className={`w-full py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl mb-3 ${
            neededFuel <= 2 || coins < Math.round(neededFuel * station.pricePerLiter) || isPumping
              ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black border-2 border-yellow-200'
          }`}
        >
          <Fuel size={18} />
          {isPumping ? (
            'DISPENSING DIESEL...'
          ) : neededFuel <= 2 ? (
            'TANK IS ALREADY FULL'
          ) : (
            `FILL FULL TANK (+${neededFuel} L • ₹${Math.round(neededFuel * station.pricePerLiter)})`
          )}
        </button>

        <button
          onClick={onClose}
          className="text-xs text-neutral-400 hover:text-white underline transition-colors"
        >
          Done Refueling, Back to Road
        </button>
      </div>
    </div>
  );
};
