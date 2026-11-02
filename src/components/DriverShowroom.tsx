import React, { useState } from 'react';
import { ArrowLeft, Check, Lock, Star, UserCheck } from 'lucide-react';
import { Driver } from '../types/game';

interface DriverShowroomProps {
  drivers: Driver[];
  unlockedDriverIds: string[];
  selectedDriverId: string;
  coins: number;
  onSelectDriver: (driverId: string) => void;
  onUnlockDriver: (driverId: string, cost: number) => void;
  onClose: () => void;
}

export const DriverShowroom: React.FC<DriverShowroomProps> = ({
  drivers,
  unlockedDriverIds,
  selectedDriverId,
  coins,
  onSelectDriver,
  onUnlockDriver,
  onClose
}) => {
  const [activeDriverId, setActiveDriverId] = useState<string>(selectedDriverId);
  const activeDriver = drivers.find((d) => d.id === activeDriverId) || drivers[0];
  const isUnlocked = unlockedDriverIds.includes(activeDriver.id);
  const isSelected = selectedDriverId === activeDriver.id;
  const canAfford = coins >= activeDriver.price;

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/95 backdrop-blur-xl flex flex-col text-white overflow-y-auto p-4 md:p-8 pb-16">
      {/* Top Header */}
      <div className="flex justify-between items-center pb-4 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded-xl border border-white/10 active:scale-95 transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl md:text-2xl font-black uppercase tracking-wider text-amber-400">
              INDIAN DRIVER SHOWROOM
            </h2>
            <p className="text-xs text-neutral-400">Hire Experienced Captains from Across India</p>
          </div>
        </div>

        {/* Currency Display */}
        <div className="flex items-center gap-2 bg-neutral-900 border border-amber-500/40 px-3.5 py-1.5 rounded-xl font-mono">
          <span className="text-amber-400 font-bold">₹</span>
          <span className="text-amber-300 font-extrabold text-base md:text-lg">
            {coins.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Main Content Split View */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 my-4">
        {/* Left Side: Driver Profile Card */}
        <div className="lg:col-span-7 flex flex-col justify-between bg-neutral-900/70 border border-white/10 rounded-3xl p-6 shadow-2xl overflow-y-auto">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center font-black text-white text-3xl shadow-xl border-2 border-white/20"
                style={{ backgroundColor: activeDriver.avatarColor }}
              >
                {activeDriver.name[0]}
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/30">
                  {activeDriver.nativeState}
                </span>
                <h3 className="text-2xl md:text-3xl font-black mt-1 text-white">
                  {activeDriver.name}
                </h3>
                <div className="flex items-center gap-1 text-amber-400 text-xs mt-0.5">
                  <Star size={14} className="fill-amber-400" />
                  <span className="font-bold">{activeDriver.rating} / 5.0 Rating</span>
                  <span className="text-neutral-500">•</span>
                  <span className="text-neutral-300">{activeDriver.experience} Years Highway Exp</span>
                </div>
              </div>
            </div>

            <p className="text-sm text-neutral-300 mb-6 bg-neutral-950/60 p-4 rounded-2xl border border-white/5">
              {activeDriver.description}
            </p>

            {/* Special Abilities & Uniform */}
            <div className="space-y-3">
              <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-xl">
                <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                  Special Driving Trait
                </div>
                <div className="text-sm font-black text-amber-200 mt-0.5">
                  ✨ {activeDriver.specialAbility}
                </div>
              </div>

              <div className="bg-neutral-950 p-3.5 rounded-xl border border-white/5">
                <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                  Official Attire / Livery Uniform
                </div>
                <div className="text-sm font-semibold text-neutral-200 mt-0.5">
                  👔 {activeDriver.uniform}
                </div>
              </div>
            </div>
          </div>

          {/* Action Button: Assign vs Hire */}
          <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
            {isUnlocked ? (
              <button
                onClick={() => onSelectDriver(activeDriver.id)}
                disabled={isSelected}
                className={`px-6 py-3 rounded-xl font-black text-sm flex items-center gap-2 transition-all active:scale-95 shadow-lg ${
                  isSelected
                    ? 'bg-neutral-800 text-neutral-500 cursor-default'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                {isSelected ? (
                  <>
                    <Check size={18} />
                    CURRENT CAPTAIN
                  </>
                ) : (
                  'ASSIGN TO BUS'
                )}
              </button>
            ) : (
              <button
                onClick={() => onUnlockDriver(activeDriver.id, activeDriver.price)}
                disabled={!canAfford}
                className={`px-6 py-3 rounded-xl font-black text-sm flex items-center gap-2 transition-all active:scale-95 shadow-lg ${
                  canAfford
                    ? 'bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black'
                    : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                }`}
              >
                <Lock size={18} />
                HIRE FOR ₹ {activeDriver.price.toLocaleString('en-IN')}
              </button>
            )}
          </div>
        </div>

        {/* Right Side: Drivers Catalog */}
        <div className="lg:col-span-5 flex flex-col bg-neutral-900/60 border border-white/10 rounded-3xl p-4 shadow-xl overflow-y-auto space-y-3">
          {drivers.map((driver) => {
            const driverUnlocked = unlockedDriverIds.includes(driver.id);
            const driverActive = activeDriverId === driver.id;
            const driverSelected = selectedDriverId === driver.id;

            return (
              <div
                key={driver.id}
                onClick={() => setActiveDriverId(driver.id)}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                  driverActive
                    ? 'bg-neutral-800 border-amber-500/80 shadow-md scale-[1.01]'
                    : 'bg-neutral-950/60 hover:bg-neutral-900 border-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-white text-base shadow-inner"
                    style={{ backgroundColor: driver.avatarColor }}
                  >
                    {driver.name[0]}
                  </div>
                  <div>
                    <div className="text-sm font-black text-white flex items-center gap-1.5">
                      {driver.name}
                      {driverSelected && (
                        <span className="text-[9px] bg-emerald-600 text-white font-bold px-1.5 py-0.2 rounded">
                          ASSIGNED
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-neutral-400">{driver.nativeState} • {driver.experience} Yrs</div>
                  </div>
                </div>

                <div>
                  {driverUnlocked ? (
                    <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                      <Check size={14} /> Hired
                    </span>
                  ) : (
                    <span className="text-xs text-amber-400 font-mono font-bold flex items-center gap-1">
                      <Lock size={12} /> ₹ {driver.price.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
