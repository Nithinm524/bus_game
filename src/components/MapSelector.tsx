import React, { useState } from 'react';
import { ArrowLeft, Check, CloudRain, Compass, MapPin, Mountain, Sun } from 'lucide-react';
import { IndianRoute } from '../types/game';

interface MapSelectorProps {
  routes: IndianRoute[];
  selectedRouteId: string;
  onSelectRoute: (route: IndianRoute) => void;
  onClose: () => void;
}

export const MapSelector: React.FC<MapSelectorProps> = ({
  routes,
  selectedRouteId,
  onSelectRoute,
  onClose
}) => {
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const regions = ['All', 'South', 'North', 'West', 'East', 'Central', 'Northeast'];

  const filteredRoutes = routes.filter((r) =>
    selectedRegion === 'All' ? true : r.region === selectedRegion
  );

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/95 backdrop-blur-xl flex flex-col text-white overflow-y-auto p-4 md:p-8 pb-24">
      {/* Top Header */}
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
              INDIA HIGHWAYS & ROUTES NAVIGATION
            </h2>
            <p className="text-xs text-neutral-400">Select Across 28 States & 8 Union Territories</p>
          </div>
        </div>
      </div>

      {/* Region Filter Buttons */}
      <div className="flex gap-2 my-4 overflow-x-auto pb-2">
        {regions.map((reg) => (
          <button
            key={reg}
            onClick={() => setSelectedRegion(reg)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              selectedRegion === reg
                ? 'bg-amber-500 text-black shadow-lg scale-105'
                : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800 hover:text-white border border-white/5'
            }`}
          >
            {reg === 'All' ? '🇮🇳 All India' : `${reg} India`}
          </button>
        ))}
      </div>

      {/* Routes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 my-2">
        {filteredRoutes.map((route) => {
          const isSelected = selectedRouteId === route.id;

          return (
            <div
              key={route.id}
              onClick={() => onSelectRoute(route)}
              className={`p-5 rounded-3xl border cursor-pointer transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-neutral-800 border-amber-500 ring-2 ring-amber-500/50 shadow-2xl scale-[1.02]'
                  : 'bg-neutral-900/60 hover:bg-neutral-800/80 border-white/10'
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-neutral-950 text-amber-400 border border-white/10">
                    {route.region} Zone • {route.terrain.replace('_', ' ')}
                  </span>
                  {isSelected && (
                    <span className="text-[10px] bg-emerald-600 text-white font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Check size={12} /> ACTIVE
                    </span>
                  )}
                </div>

                <h3 className="text-base font-black text-white mt-1">{route.name}</h3>
                <div className="flex items-center gap-2 text-xs text-neutral-300 mt-1">
                  <MapPin size={14} className="text-red-400" />
                  <span>{route.originCity}</span>
                  <span className="text-amber-400 font-bold">➔</span>
                  <MapPin size={14} className="text-emerald-400" />
                  <span>{route.destinationCity}</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center bg-neutral-950/70 p-2.5 rounded-2xl border border-white/5 my-3">
                  <div>
                    <div className="text-[9px] text-neutral-400">DISTANCE</div>
                    <div className="text-xs font-black text-white">{route.distanceKm} KM</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-neutral-400">TOLL PLAZAS</div>
                    <div className="text-xs font-black text-amber-300">{route.tollCount} FASTag</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-neutral-400">REWARD</div>
                    <div className="text-xs font-black text-emerald-400 font-mono">₹ {route.rewardCoins}</div>
                  </div>
                </div>

                <div className="text-[11px] text-neutral-400 space-y-1">
                  <div className="font-bold text-neutral-300">Route Landmarks:</div>
                  <ul className="list-disc list-inside text-neutral-400">
                    {route.scenicHighlights.slice(0, 2).map((high, i) => (
                      <li key={i} className="truncate">{high}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center text-xs">
                <span className="text-neutral-400 capitalize flex items-center gap-1">
                  {route.defaultWeather === 'rainy' ? <CloudRain size={14} className="text-blue-400" /> : <Sun size={14} className="text-yellow-400" />}
                  {route.defaultWeather} Climate
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectRoute(route);
                    onClose();
                  }}
                  className={`px-4 py-1.5 rounded-xl font-black text-xs transition-all active:scale-95 ${
                    isSelected
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-500 hover:bg-amber-400 text-black'
                  }`}
                >
                  {isSelected ? 'SELECTED ✓' : 'CHOOSE ROUTE'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
