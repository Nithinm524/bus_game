import React, { useState } from 'react';
import { ArrowLeft, Check, Lock, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import { BusConfig } from '../types/game';

interface BusShowroomProps {
  buses: BusConfig[];
  unlockedBusIds: string[];
  selectedBusId: string;
  coins: number;
  onSelectBus: (busId: string) => void;
  onUnlockBus: (busId: string, cost: number) => void;
  onClose: () => void;
}

export const BusShowroom: React.FC<BusShowroomProps> = ({
  buses,
  unlockedBusIds,
  selectedBusId,
  coins,
  onSelectBus,
  onUnlockBus,
  onClose
}) => {
  const [filter, setFilter] = useState<'all' | 'government' | 'private' | 'special'>('all');
  const [activePreviewId, setActivePreviewId] = useState<string>(selectedBusId);

  const filteredBuses = buses.filter((b) => (filter === 'all' ? true : b.category === filter));
  const previewBus = buses.find((b) => b.id === activePreviewId) || buses[0];
  const isUnlocked = unlockedBusIds.includes(previewBus.id);
  const isSelected = selectedBusId === previewBus.id;
  const canAfford = coins >= previewBus.price;

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
              INDIAN BUS SHOWROOM
            </h2>
            <p className="text-xs text-neutral-400">Discover State Transport & Luxury Intercity Fleets</p>
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

      {/* Main Content: Showcase Split View */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 my-4">
        {/* Left Side: 3D Bus Hero Preview & Specs */}
        <div className="lg:col-span-7 flex flex-col justify-between bg-neutral-900/70 border border-white/10 rounded-3xl p-6 shadow-2xl overflow-y-auto">
          <div>
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/30">
                  {previewBus.operator} • {previewBus.state}
                </span>
                <h3 className="text-2xl md:text-3xl font-black mt-2 text-white">
                  {previewBus.name}
                </h3>
              </div>
              <span className="text-xs uppercase font-extrabold px-3 py-1 rounded-lg bg-neutral-800 border border-white/20 text-neutral-300">
                {previewBus.category}
              </span>
            </div>

            <p className="text-xs text-neutral-300 mb-4">{previewBus.description}</p>

            {/* Stylized Visual Model Preview Box */}
            <div className="h-48 md:h-56 rounded-2xl bg-gradient-to-b from-neutral-800/90 to-neutral-950 border border-white/10 flex flex-col items-center justify-center p-6 relative shadow-inner">
              <div
                className="w-4/5 h-28 rounded-xl shadow-2xl border-4 relative flex items-center justify-center"
                style={{
                  backgroundColor: previewBus.primaryColor,
                  borderColor: previewBus.secondaryColor
                }}
              >
                <div
                  className="w-full h-4 absolute top-4 opacity-90"
                  style={{ backgroundColor: previewBus.secondaryColor }}
                />
                <div
                  className="w-full h-2 absolute bottom-4 opacity-80"
                  style={{ backgroundColor: previewBus.accentColor }}
                />
                <span className="relative z-10 font-black text-base tracking-widest text-neutral-900 bg-white/70 px-3 py-1 rounded">
                  {previewBus.operator.toUpperCase()}
                </span>
              </div>

              {/* Dual Axle / Multi-Axle wheels */}
              <div className="flex justify-between w-3/5 -mt-3 z-10">
                <div className="w-8 h-8 rounded-full bg-neutral-900 border-4 border-neutral-600 shadow-md" />
                <div className="w-8 h-8 rounded-full bg-neutral-900 border-4 border-neutral-600 shadow-md" />
              </div>
            </div>

            {/* Bus Features List */}
            <div className="mt-4 flex flex-wrap gap-2">
              {previewBus.features.map((feat, i) => (
                <span
                  key={i}
                  className="text-xs bg-neutral-950 text-neutral-300 px-2.5 py-1 rounded-lg border border-white/10 flex items-center gap-1.5"
                >
                  <ShieldCheck size={14} className="text-amber-400" />
                  {feat}
                </span>
              ))}
            </div>

            {/* Performance Gauges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              <div className="bg-neutral-950 p-2.5 rounded-xl border border-white/5">
                <div className="text-[10px] text-neutral-400">TOP SPEED</div>
                <div className="text-base font-black text-amber-400">{previewBus.topSpeed} km/h</div>
                <div className="w-full bg-neutral-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                  <div className="bg-amber-400 h-full" style={{ width: `${(previewBus.topSpeed / 140) * 100}%` }} />
                </div>
              </div>

              <div className="bg-neutral-950 p-2.5 rounded-xl border border-white/5">
                <div className="text-[10px] text-neutral-400">ACCELERATION</div>
                <div className="text-base font-black text-emerald-400">{previewBus.acceleration}%</div>
                <div className="w-full bg-neutral-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                  <div className="bg-emerald-400 h-full" style={{ width: `${previewBus.acceleration}%` }} />
                </div>
              </div>

              <div className="bg-neutral-950 p-2.5 rounded-xl border border-white/5">
                <div className="text-[10px] text-neutral-400">BRAKING POWER</div>
                <div className="text-base font-black text-cyan-400">{previewBus.braking}%</div>
                <div className="w-full bg-neutral-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                  <div className="bg-cyan-400 h-full" style={{ width: `${previewBus.braking}%` }} />
                </div>
              </div>

              <div className="bg-neutral-950 p-2.5 rounded-xl border border-white/5">
                <div className="text-[10px] text-neutral-400">CAPACITY</div>
                <div className="text-base font-black text-purple-400">{previewBus.passengerCapacity} seats</div>
                <div className="w-full bg-neutral-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                  <div className="bg-purple-400 h-full" style={{ width: `${(previewBus.passengerCapacity / 80) * 100}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Action Button: Select vs Unlock */}
          <div className="mt-4 pt-4 border-t border-white/10 flex justify-end gap-3">
            {isUnlocked ? (
              <button
                onClick={() => onSelectBus(previewBus.id)}
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
                    SELECTED IN GARAGE
                  </>
                ) : (
                  'SELECT THIS BUS'
                )}
              </button>
            ) : (
              <button
                onClick={() => onUnlockBus(previewBus.id, previewBus.price)}
                disabled={!canAfford}
                className={`px-6 py-3 rounded-xl font-black text-sm flex items-center gap-2 transition-all active:scale-95 shadow-lg ${
                  canAfford
                    ? 'bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black'
                    : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                }`}
              >
                <Lock size={18} />
                UNLOCK FOR ₹ {previewBus.price.toLocaleString('en-IN')}
              </button>
            )}
          </div>
        </div>

        {/* Right Side: Bus Catalog List */}
        <div className="lg:col-span-5 flex flex-col bg-neutral-900/60 border border-white/10 rounded-3xl p-4 shadow-xl overflow-hidden">
          {/* Category Filter Pills */}
          <div className="flex gap-2 pb-3 mb-3 border-b border-white/10 overflow-x-auto">
            {(['all', 'government', 'private', 'special'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all whitespace-nowrap ${
                  filter === cat
                    ? 'bg-amber-500 text-black shadow-md'
                    : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Buses Scrollable List */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {filteredBuses.map((bus) => {
              const busUnlocked = unlockedBusIds.includes(bus.id);
              const busActive = activePreviewId === bus.id;
              const busSelected = selectedBusId === bus.id;

              return (
                <div
                  key={bus.id}
                  onClick={() => setActivePreviewId(bus.id)}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                    busActive
                      ? 'bg-neutral-800 border-amber-500/80 shadow-md scale-[1.01]'
                      : 'bg-neutral-950/60 hover:bg-neutral-900 border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Small Color Swatch */}
                    <div
                      className="w-10 h-10 rounded-xl border-2 shadow-inner flex items-center justify-center font-bold text-xs"
                      style={{
                        backgroundColor: bus.primaryColor,
                        borderColor: bus.secondaryColor
                      }}
                    >
                      🚍
                    </div>
                    <div>
                      <div className="text-xs font-black text-white flex items-center gap-1.5">
                        {bus.name}
                        {busSelected && (
                          <span className="text-[9px] bg-emerald-600 text-white font-bold px-1.5 py-0.2 rounded">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-neutral-400">{bus.operator}</div>
                    </div>
                  </div>

                  <div>
                    {busUnlocked ? (
                      <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                        <Check size={14} /> Owned
                      </span>
                    ) : (
                      <span className="text-xs text-amber-400 font-mono font-bold flex items-center gap-1">
                        <Lock size={12} /> ₹ {bus.price.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
