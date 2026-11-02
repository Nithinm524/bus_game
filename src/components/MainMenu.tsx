import React from 'react';
import {
  Award,
  Calendar,
  Compass,
  Flame,
  Globe,
  Navigation,
  Play,
  Settings,
  Shield,
  Truck,
  Users,
  Wrench,
  Zap
} from 'lucide-react';
import { BusConfig, Driver, GameMode, IndianRoute, PlayerStats } from '../types/game';

interface MainMenuProps {
  stats: PlayerStats;
  selectedBus: BusConfig;
  selectedDriver: Driver;
  selectedRoute: IndianRoute;
  onStartGame: (mode: GameMode) => void;
  onOpenBusShowroom: () => void;
  onOpenDriverShowroom: () => void;
  onOpenGarage: () => void;
  onOpenMap: () => void;
  onOpenDailyRewards: () => void;
  onOpenMultiplayer: () => void;
  onOpenSettings: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  stats,
  selectedBus,
  selectedDriver,
  selectedRoute,
  onStartGame,
  onOpenBusShowroom,
  onOpenDriverShowroom,
  onOpenGarage,
  onOpenMap,
  onOpenDailyRewards,
  onOpenMultiplayer,
  onOpenSettings
}) => {
  return (
    <div className="relative min-h-screen w-full bg-gradient-to-br from-neutral-950 via-slate-900 to-amber-950 text-white flex flex-col justify-between p-4 md:p-8 pb-32">
      {/* Background Decorative Glow & Patterns */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(217,119,6,0.15),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(16,185,129,0.1),transparent_50%)] pointer-events-none" />

      {/* TOP BAR: Title Branding & Player Profile Stats */}
      <header className="relative z-10 flex flex-wrap justify-between items-center gap-4 bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-600 to-yellow-400 flex items-center justify-center shadow-lg border border-amber-200">
            <span className="text-2xl font-black text-neutral-900">🚍</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-black tracking-wider bg-gradient-to-r from-amber-400 via-yellow-200 to-orange-400 bg-clip-text text-transparent uppercase">
                BHARAT BUS SIMULATOR 3D
              </h1>
              <span className="text-[10px] bg-red-600 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                BUSSID Style
              </span>
            </div>
            <p className="text-xs text-neutral-400">Authentic 3D Indian Highways & State Transport Experience</p>
          </div>
        </div>

        {/* Currency & Level Badges */}
        <div className="flex items-center gap-3">
          {/* Daily Bonus Trigger */}
          <button
            onClick={onOpenDailyRewards}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-black font-extrabold px-3 py-1.5 rounded-xl shadow-md transition-all active:scale-95"
          >
            <Calendar size={18} className="text-neutral-900" />
            <span className="text-xs">Daily Rewards</span>
            <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
          </button>

          {/* Wallet Balance */}
          <div className="flex items-center gap-2 bg-neutral-900/90 border border-amber-500/40 px-3 py-1.5 rounded-xl shadow-inner">
            <span className="text-amber-400 font-black text-sm">₹</span>
            <span className="text-amber-300 font-bold font-mono text-sm md:text-base">
              {stats.coins.toLocaleString('en-IN')}
            </span>
          </div>

          {/* Driver Level Badge */}
          <div className="flex items-center gap-2 bg-neutral-900/90 border border-white/10 px-3 py-1.5 rounded-xl">
            <Award size={18} className="text-blue-400" />
            <div className="text-left text-xs">
              <div className="text-neutral-400 leading-none text-[10px]">DRIVER LVL</div>
              <div className="font-bold text-white leading-none">{stats.playerLevel}</div>
            </div>
          </div>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded-xl border border-white/10 text-neutral-300 hover:text-white transition-all active:scale-95"
            title="Settings"
          >
            <Settings size={20} />
          </button>
        </div>
      </header>

      {/* CENTER SECTION: Active Bus Showcase & Quick Config Card */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 my-6 items-center">
        {/* Left Column: Hero Bus Preview Card */}
        <div className="lg:col-span-7 bg-neutral-900/60 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
          {/* Regional Flagship Tag */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/30">
                {selectedBus.operator} • {selectedBus.state}
              </span>
              <h2 className="text-2xl md:text-3xl font-black mt-2 tracking-wide text-white">
                {selectedBus.name}
              </h2>
            </div>
            <button
              onClick={onOpenBusShowroom}
              className="text-xs font-bold bg-neutral-800 hover:bg-neutral-700 px-3 py-1.5 rounded-xl border border-white/20 transition-all text-neutral-200"
            >
              Change Bus ⇄
            </button>
          </div>

          {/* Stylized Bus Visual Canvas / Preview */}
          <div className="h-52 md:h-64 rounded-2xl bg-gradient-to-b from-neutral-800/80 to-neutral-950 border border-white/10 flex flex-col items-center justify-center p-4 relative overflow-hidden group">
            {/* Visual Bus Livery Silhouette */}
            <div
              className="w-4/5 h-28 rounded-xl shadow-2xl border-4 relative flex items-center justify-center transition-transform group-hover:scale-105 duration-300"
              style={{
                backgroundColor: selectedBus.primaryColor,
                borderColor: selectedBus.secondaryColor
              }}
            >
              <div
                className="w-full h-4 absolute top-4 opacity-90"
                style={{ backgroundColor: selectedBus.secondaryColor }}
              />
              <div
                className="w-full h-2 absolute bottom-4 opacity-80"
                style={{ backgroundColor: selectedBus.accentColor }}
              />
              <span className="relative z-10 font-black text-sm md:text-base tracking-widest drop-shadow-md text-neutral-900 bg-white/70 px-3 py-1 rounded">
                {selectedBus.operator.toUpperCase()}
              </span>
            </div>

            {/* Wheels under preview */}
            <div className="flex justify-between w-3/5 -mt-3 z-10">
              <div className="w-8 h-8 rounded-full bg-neutral-900 border-4 border-neutral-600 shadow-md" />
              <div className="w-8 h-8 rounded-full bg-neutral-900 border-4 border-neutral-600 shadow-md" />
            </div>

            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              {selectedBus.features.map((feat, idx) => (
                <span
                  key={idx}
                  className="text-[10px] bg-neutral-900/90 text-neutral-300 px-2 py-0.5 rounded border border-white/10"
                >
                  ✓ {feat}
                </span>
              ))}
            </div>
          </div>

          {/* Quick Bus Specs Grid */}
          <div className="grid grid-cols-4 gap-3 mt-4 text-center">
            <div className="bg-neutral-950/70 p-2.5 rounded-xl border border-white/5">
              <div className="text-[10px] text-neutral-400">TOP SPEED</div>
              <div className="text-base font-black text-amber-400">{selectedBus.topSpeed} km/h</div>
            </div>
            <div className="bg-neutral-950/70 p-2.5 rounded-xl border border-white/5">
              <div className="text-[10px] text-neutral-400">CAPACITY</div>
              <div className="text-base font-black text-emerald-400">{selectedBus.passengerCapacity} seats</div>
            </div>
            <div className="bg-neutral-950/70 p-2.5 rounded-xl border border-white/5">
              <div className="text-[10px] text-neutral-400">FUEL TANK</div>
              <div className="text-base font-black text-cyan-400">{selectedBus.fuelCapacity} L</div>
            </div>
            <div className="bg-neutral-950/70 p-2.5 rounded-xl border border-white/5">
              <div className="text-[10px] text-neutral-400">HANDLING</div>
              <div className="text-base font-black text-purple-400">{selectedBus.handling}%</div>
            </div>
          </div>
        </div>

        {/* Right Column: Active Driver & Route Cards */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Active Assigned Driver Card */}
          <div className="bg-neutral-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-white text-lg shadow-md"
                style={{ backgroundColor: selectedDriver.avatarColor }}
              >
                {selectedDriver.name[0]}
              </div>
              <div>
                <div className="text-[10px] text-neutral-400 font-bold uppercase">Assigned Captain</div>
                <div className="text-base font-black text-white">{selectedDriver.name}</div>
                <div className="text-xs text-amber-400 font-semibold">{selectedDriver.specialAbility}</div>
              </div>
            </div>
            <button
              onClick={onOpenDriverShowroom}
              className="text-xs font-bold bg-neutral-800 hover:bg-neutral-700 px-3 py-1.5 rounded-xl border border-white/20 transition-all text-neutral-200"
            >
              Drivers
            </button>
          </div>

          {/* Active Route Card */}
          <div className="bg-neutral-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl">
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="text-[10px] text-neutral-400 font-bold uppercase">Selected Journey</div>
                <div className="text-base font-black text-white">{selectedRoute.name}</div>
                <div className="text-xs text-neutral-300">
                  {selectedRoute.originCity} ➔ {selectedRoute.destinationCity} ({selectedRoute.distanceKm} KM)
                </div>
              </div>
              <button
                onClick={onOpenMap}
                className="text-xs font-bold bg-neutral-800 hover:bg-neutral-700 px-3 py-1.5 rounded-xl border border-white/20 transition-all text-neutral-200 flex items-center gap-1"
              >
                <Compass size={14} />
                Map
              </button>
            </div>
            <div className="flex items-center justify-between text-xs text-neutral-400 bg-neutral-950/60 p-2 rounded-lg mt-2">
              <span>Terrain: <strong className="text-white capitalize">{selectedRoute.terrain}</strong></span>
              <span>Trip Reward: <strong className="text-amber-400 font-mono">₹ {selectedRoute.rewardCoins}</strong></span>
            </div>
          </div>

          {/* Garage & Upgrades Quick Link */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onOpenGarage}
              className="flex items-center justify-center gap-2 bg-neutral-900/80 hover:bg-neutral-800 border border-white/10 p-3 rounded-2xl font-bold text-xs text-neutral-200 transition-all active:scale-95 shadow-md"
            >
              <Wrench size={16} className="text-amber-400" />
              Garage & Repairs
            </button>
            <button
              onClick={onOpenMultiplayer}
              className="flex items-center justify-center gap-2 bg-neutral-900/80 hover:bg-neutral-800 border border-white/10 p-3 rounded-2xl font-bold text-xs text-neutral-200 transition-all active:scale-95 shadow-md"
            >
              <Globe size={16} className="text-cyan-400" />
              Online Multiplayer
            </button>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: 5 Game Modes Select Buttons */}
      <footer className="relative z-10 bg-black/50 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-2xl">
        <div className="text-xs font-black uppercase tracking-wider text-neutral-400 mb-3 text-center md:text-left">
          Select Game Mode
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {/* Mode 1: Free Drive */}
          <button
            onClick={() => onStartGame('free_drive')}
            className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-gradient-to-b from-neutral-800 to-neutral-900 hover:from-amber-600 hover:to-yellow-600 group border border-white/10 transition-all active:scale-95 shadow-lg text-center"
          >
            <Compass size={24} className="text-amber-400 group-hover:text-black mb-1.5 transition-colors" />
            <span className="font-black text-sm text-white group-hover:text-black">FREE DRIVE</span>
            <span className="text-[10px] text-neutral-400 group-hover:text-neutral-900">Unrestricted Indian roads</span>
          </button>

          {/* Mode 2: Career Mode */}
          <button
            onClick={() => onStartGame('career')}
            className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-gradient-to-b from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black border-2 border-yellow-300 transition-all active:scale-95 shadow-xl text-center transform hover:-translate-y-0.5"
          >
            <Play size={24} className="text-black mb-1.5 fill-black" />
            <span className="font-black text-sm tracking-wider">CAREER MODE</span>
            <span className="text-[10px] font-bold text-neutral-900">Missions, Fares & XP</span>
          </button>

          {/* Mode 3: Tour Mode */}
          <button
            onClick={() => onStartGame('tour')}
            className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-gradient-to-b from-neutral-800 to-neutral-900 hover:from-emerald-600 hover:to-teal-600 group border border-white/10 transition-all active:scale-95 shadow-lg text-center"
          >
            <Navigation size={24} className="text-emerald-400 group-hover:text-black mb-1.5 transition-colors" />
            <span className="font-black text-sm text-white group-hover:text-black">TOUR MODE</span>
            <span className="text-[10px] text-neutral-400 group-hover:text-neutral-900">Scenic Tourism Routes</span>
          </button>

          {/* Mode 4: Multiplayer */}
          <button
            onClick={onOpenMultiplayer}
            className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-gradient-to-b from-neutral-800 to-neutral-900 hover:from-blue-600 hover:to-cyan-600 group border border-white/10 transition-all active:scale-95 shadow-lg text-center"
          >
            <Users size={24} className="text-blue-400 group-hover:text-black mb-1.5 transition-colors" />
            <span className="font-black text-sm text-white group-hover:text-black">MULTIPLAYER</span>
            <span className="text-[10px] text-neutral-400 group-hover:text-neutral-900">Live Convoys & Rooms</span>
          </button>

          {/* Mode 5: Challenge Mode */}
          <button
            onClick={() => onStartGame('challenge')}
            className="col-span-2 md:col-span-1 flex flex-col items-center justify-center p-3.5 rounded-xl bg-gradient-to-b from-neutral-800 to-neutral-900 hover:from-purple-600 hover:to-pink-600 group border border-white/10 transition-all active:scale-95 shadow-lg text-center"
          >
            <Flame size={24} className="text-purple-400 group-hover:text-black mb-1.5 transition-colors" />
            <span className="font-black text-sm text-white group-hover:text-black">CHALLENGES</span>
            <span className="text-[10px] text-neutral-400 group-hover:text-neutral-900">Ghats, Rain & Parking</span>
          </button>
        </div>
      </footer>
    </div>
  );
};
