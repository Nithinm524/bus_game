import React, { useEffect } from 'react';
import { Award, Check, Coins, ShieldCheck, Trophy, Users } from 'lucide-react';
import confetti from 'canvas-confetti';
import { IndianRoute } from '../types/game';
import { audioService } from '../services/audioService';

interface TripCompletedModalProps {
  route: IndianRoute;
  distanceKm: number;
  passengers: number;
  satisfaction: number;
  score: number;
  baseReward: number;
  safeDrivingBonus: number;
  onClaim: () => void;
}

export const TripCompletedModal: React.FC<TripCompletedModalProps> = ({
  route,
  distanceKm,
  passengers,
  satisfaction,
  score,
  baseReward,
  safeDrivingBonus,
  onClaim
}) => {
  const totalEarned = baseReward + safeDrivingBonus;

  useEffect(() => {
    audioService.playChime();
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.5 }
    });
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/95 backdrop-blur-xl flex flex-col text-white items-center justify-start md:justify-center overflow-y-auto p-4 py-8 pb-16">
      <div className="bg-neutral-900 border border-white/10 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl relative text-center my-auto">
        {/* Trophy icon */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 to-yellow-400 mx-auto flex items-center justify-center text-3xl shadow-lg border-2 border-amber-200 mb-3">
          🏆
        </div>

        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/30">
          JOURNEY COMPLETED
        </span>

        <h2 className="text-2xl md:text-3xl font-black uppercase tracking-wider text-white mt-1">
          TRIP FINISHED!
        </h2>
        <p className="text-xs text-neutral-400 mb-6">
          {route.originCity} ➔ {route.destinationCity}
        </p>

        {/* Stats Summary Grid */}
        <div className="grid grid-cols-3 gap-2.5 mb-6 text-center">
          <div className="bg-neutral-950 p-3 rounded-2xl border border-white/5">
            <div className="text-[10px] text-neutral-400">DISTANCE</div>
            <div className="text-sm font-black text-white">{Math.round(distanceKm)} KM</div>
          </div>
          <div className="bg-neutral-950 p-3 rounded-2xl border border-white/5">
            <div className="text-[10px] text-neutral-400">PASSENGERS</div>
            <div className="text-sm font-black text-amber-300">{passengers} Pax</div>
          </div>
          <div className="bg-neutral-950 p-3 rounded-2xl border border-white/5">
            <div className="text-[10px] text-neutral-400">DRIVING SCORE</div>
            <div className="text-sm font-black text-emerald-400">{score}/100</div>
          </div>
        </div>

        {/* Earnings Breakdown */}
        <div className="bg-neutral-950/80 p-4 rounded-2xl border border-white/5 text-xs space-y-2 mb-6 text-left">
          <div className="flex justify-between items-center text-neutral-300">
            <span>Base Route Reward:</span>
            <span className="font-mono font-bold text-white">₹ {baseReward}</span>
          </div>
          <div className="flex justify-between items-center text-neutral-300">
            <span>Safe Driving & Comfort Bonus:</span>
            <span className="font-mono font-bold text-emerald-400">+₹ {safeDrivingBonus}</span>
          </div>
          <div className="border-t border-white/10 pt-2 flex justify-between items-center text-sm font-black">
            <span className="text-amber-400">TOTAL BHARAT COINS:</span>
            <span className="font-mono text-amber-300 text-lg">₹ {totalEarned.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onClaim}
          className="w-full py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black border-2 border-yellow-200 shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <Coins size={18} />
          CLAIM EARNINGS & CONTINUE
        </button>
      </div>
    </div>
  );
};
