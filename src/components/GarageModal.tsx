import React from 'react';
import { ArrowLeft, Fuel, Gauge, Sparkles, Volume2, Wrench, Zap } from 'lucide-react';
import { BusConfig } from '../types/game';
import { audioService } from '../services/audioService';

interface GarageModalProps {
  bus: BusConfig;
  damagePercent: number;
  fuelLiters: number;
  coins: number;
  upgrades: { engine: number; brakes: number; suspension: number };
  onRepair: (cost: number) => void;
  onRefuel: (cost: number, liters: number) => void;
  onUpgrade: (part: 'engine' | 'brakes' | 'suspension', cost: number) => void;
  onClose: () => void;
}

export const GarageModal: React.FC<GarageModalProps> = ({
  bus,
  damagePercent,
  fuelLiters,
  coins,
  upgrades,
  onRepair,
  onRefuel,
  onUpgrade,
  onClose
}) => {
  const repairCost = Math.round((damagePercent / 100) * 1200);
  const neededFuel = Math.round(bus.fuelCapacity - fuelLiters);
  const refuelCost = Math.round(neededFuel * 2.5);

  const upgradeCosts = {
    engine: (upgrades.engine + 1) * 2000,
    brakes: (upgrades.brakes + 1) * 1500,
    suspension: (upgrades.suspension + 1) * 1500
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/95 backdrop-blur-xl flex flex-col text-white overflow-y-auto p-4 md:p-8 pb-28">
      {/* Header */}
      <div className="flex justify-between items-center pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded-xl border border-white/10 active:scale-95 transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl md:text-2xl font-black uppercase tracking-wider text-amber-400">
              BHARAT WORKSHOP & GARAGE
            </h2>
            <p className="text-xs text-neutral-400">Maintenance, Repairs, Upgrades & Horn Testing</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-neutral-900 border border-amber-500/40 px-3.5 py-1.5 rounded-xl font-mono">
          <span className="text-amber-400 font-bold">₹</span>
          <span className="text-amber-300 font-extrabold text-base md:text-lg">
            {coins.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-6">
        {/* Left Side: Vehicle Status & Maintenance */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-neutral-900/70 border border-white/10 rounded-3xl p-6 shadow-xl">
            <h3 className="text-lg font-black text-white mb-1">{bus.name}</h3>
            <p className="text-xs text-neutral-400 mb-4">{bus.operator} • {bus.state}</p>

            {/* Health / Damage Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-neutral-400">Vehicle Body Damage</span>
                <span className={`font-bold ${damagePercent > 30 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {Math.round(damagePercent)}% Damaged
                </span>
              </div>
              <div className="w-full bg-neutral-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    damagePercent > 50 ? 'bg-red-500' : damagePercent > 20 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${damagePercent}%` }}
                />
              </div>
            </div>

            {/* Fuel Level Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-neutral-400">Diesel Fuel Level</span>
                <span className="font-bold text-amber-300">
                  {Math.round(fuelLiters)} / {bus.fuelCapacity} Liters
                </span>
              </div>
              <div className="w-full bg-neutral-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-400 h-full transition-all"
                  style={{ width: `${(fuelLiters / bus.fuelCapacity) * 100}%` }}
                />
              </div>
            </div>

            {/* Maintenance Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onRepair(repairCost)}
                disabled={damagePercent === 0 || coins < repairCost}
                className={`p-3 rounded-2xl border font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 ${
                  damagePercent === 0
                    ? 'bg-neutral-800/50 border-neutral-700 text-neutral-500 cursor-default'
                    : coins >= repairCost
                    ? 'bg-red-600/90 hover:bg-red-500 border-red-400 text-white'
                    : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                }`}
              >
                <Wrench size={16} />
                {damagePercent === 0 ? 'Pristine Condition' : `Full Repair (₹ ${repairCost})`}
              </button>

              <button
                onClick={() => onRefuel(refuelCost, bus.fuelCapacity)}
                disabled={neededFuel <= 5 || coins < refuelCost}
                className={`p-3 rounded-2xl border font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 ${
                  neededFuel <= 5
                    ? 'bg-neutral-800/50 border-neutral-700 text-neutral-500 cursor-default'
                    : coins >= refuelCost
                    ? 'bg-amber-600/90 hover:bg-amber-500 border-amber-400 text-black'
                    : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                }`}
              >
                <Fuel size={16} />
                {neededFuel <= 5 ? 'Tank Full' : `Refuel Tank (₹ ${refuelCost})`}
              </button>
            </div>
          </div>

          {/* Test Indian Horns in Garage */}
          <div className="bg-neutral-900/70 border border-white/10 rounded-3xl p-6 shadow-xl">
            <h4 className="text-sm font-black text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Volume2 size={16} />
              Audio Horn Soundboard
            </h4>
            <p className="text-xs text-neutral-400 mb-4">
              Test authentic Indian pneumatic melodies before taking to the highway.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 1, label: 'Bollywood Melody' },
                { id: 2, label: 'Highway Dual Air' },
                { id: 3, label: 'Tata Truck Bass' }
              ].map((h) => (
                <button
                  key={h.id}
                  onClick={() => {
                    audioService.playHorn(h.id);
                    setTimeout(() => audioService.stopHorn(), 800);
                  }}
                  className="bg-neutral-800 hover:bg-amber-500 hover:text-black border border-white/10 p-3 rounded-xl text-xs font-bold transition-all active:scale-95 text-center"
                >
                  🎺 {h.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Bus Performance Tuning Upgrades */}
        <div className="lg:col-span-6 bg-neutral-900/70 border border-white/10 rounded-3xl p-6 shadow-xl">
          <h3 className="text-lg font-black text-white mb-1">Performance Tuning & Upgrades</h3>
          <p className="text-xs text-neutral-400 mb-6">Upgrade your chassis, braking, and turbocharger</p>

          <div className="space-y-4">
            {/* Engine Turbo Upgrade */}
            <div className="bg-neutral-950 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
              <div>
                <div className="text-sm font-black text-white flex items-center gap-1.5">
                  <Zap size={16} className="text-amber-400" />
                  Turbocharged Engine Tuning
                </div>
                <div className="text-xs text-neutral-400">Increases top speed and acceleration</div>
                <div className="flex gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <div
                      key={lvl}
                      className={`w-6 h-2 rounded-full ${
                        upgrades.engine >= lvl ? 'bg-amber-400 shadow-sm' : 'bg-neutral-800'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <button
                onClick={() => onUpgrade('engine', upgradeCosts.engine)}
                disabled={upgrades.engine >= 5 || coins < upgradeCosts.engine}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all active:scale-95 ${
                  upgrades.engine >= 5
                    ? 'bg-neutral-800 text-neutral-500'
                    : coins >= upgradeCosts.engine
                    ? 'bg-amber-500 hover:bg-amber-400 text-black'
                    : 'bg-neutral-800 text-neutral-500'
                }`}
              >
                {upgrades.engine >= 5 ? 'MAX LEVEL' : `UPGRADE (₹ ${upgradeCosts.engine.toLocaleString('en-IN')})`}
              </button>
            </div>

            {/* Power Brakes Upgrade */}
            <div className="bg-neutral-950 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
              <div>
                <div className="text-sm font-black text-white flex items-center gap-1.5">
                  <Gauge size={16} className="text-cyan-400" />
                  Pneumatic Disc Brakes
                </div>
                <div className="text-xs text-neutral-400">Shortens emergency stopping distance</div>
                <div className="flex gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <div
                      key={lvl}
                      className={`w-6 h-2 rounded-full ${
                        upgrades.brakes >= lvl ? 'bg-cyan-400 shadow-sm' : 'bg-neutral-800'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <button
                onClick={() => onUpgrade('brakes', upgradeCosts.brakes)}
                disabled={upgrades.brakes >= 5 || coins < upgradeCosts.brakes}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all active:scale-95 ${
                  upgrades.brakes >= 5
                    ? 'bg-neutral-800 text-neutral-500'
                    : coins >= upgradeCosts.brakes
                    ? 'bg-cyan-500 hover:bg-cyan-400 text-black'
                    : 'bg-neutral-800 text-neutral-500'
                }`}
              >
                {upgrades.brakes >= 5 ? 'MAX LEVEL' : `UPGRADE (₹ ${upgradeCosts.brakes.toLocaleString('en-IN')})`}
              </button>
            </div>

            {/* Air Suspension Upgrade */}
            <div className="bg-neutral-950 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
              <div>
                <div className="text-sm font-black text-white flex items-center gap-1.5">
                  <Sparkles size={16} className="text-purple-400" />
                  Heavy Duty Air Suspension
                </div>
                <div className="text-xs text-neutral-400">Enhances ghat cornering & passenger comfort</div>
                <div className="flex gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <div
                      key={lvl}
                      className={`w-6 h-2 rounded-full ${
                        upgrades.suspension >= lvl ? 'bg-purple-400 shadow-sm' : 'bg-neutral-800'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <button
                onClick={() => onUpgrade('suspension', upgradeCosts.suspension)}
                disabled={upgrades.suspension >= 5 || coins < upgradeCosts.suspension}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all active:scale-95 ${
                  upgrades.suspension >= 5
                    ? 'bg-neutral-800 text-neutral-500'
                    : coins >= upgradeCosts.suspension
                    ? 'bg-purple-500 hover:bg-purple-400 text-white'
                    : 'bg-neutral-800 text-neutral-500'
                }`}
              >
                {upgrades.suspension >= 5 ? 'MAX LEVEL' : `UPGRADE (₹ ${upgradeCosts.suspension.toLocaleString('en-IN')})`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
