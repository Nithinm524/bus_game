import React, { useState } from 'react';
import { ArrowLeft, Award, Check, Sparkles, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';
import { DAILY_BONUSES } from '../data/gameData';
import { audioService } from '../services/audioService';

interface DailyRewardsModalProps {
  consecutiveDays: number;
  lastClaimDate: string;
  onClaim: (coins: number) => void;
  onClose: () => void;
}

export const DailyRewardsModal: React.FC<DailyRewardsModalProps> = ({
  consecutiveDays,
  lastClaimDate,
  onClaim,
  onClose
}) => {
  const todayStr = new Date().toDateString();
  const alreadyClaimedToday = lastClaimDate === todayStr;
  const currentDayIndex = (consecutiveDays % 7);
  const currentReward = DAILY_BONUSES[currentDayIndex];
  const [claimedJustNow, setClaimedJustNow] = useState(false);

  const handleClaim = () => {
    if (alreadyClaimedToday || claimedJustNow) return;

    setClaimedJustNow(true);
    audioService.playChime();

    // Trigger celebratory confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    onClaim(currentReward.coins);
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/95 backdrop-blur-xl flex flex-col text-white items-center justify-start md:justify-center overflow-y-auto p-4 py-8 pb-16">
      <div className="bg-neutral-900 border border-white/10 rounded-3xl p-6 md:p-8 max-w-xl w-full shadow-2xl relative text-center my-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-neutral-800 hover:bg-neutral-700 rounded-xl text-neutral-400 hover:text-white transition-all"
        >
          ✕
        </button>

        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 to-yellow-400 mx-auto flex items-center justify-center text-3xl shadow-lg border-2 border-amber-200 mb-3">
          🎁
        </div>

        <h2 className="text-2xl font-black uppercase tracking-wider text-amber-400">
          DAILY LOGIN REWARDS
        </h2>
        <p className="text-xs text-neutral-400 mb-6">
          Log in every consecutive day to earn Bharat Coins and legendary rewards!
        </p>

        {/* 7-Day Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mb-6">
          {DAILY_BONUSES.map((bonus, idx) => {
            const isCompleted = idx < currentDayIndex;
            const isToday = idx === currentDayIndex;

            return (
              <div
                key={bonus.day}
                className={`p-3 rounded-2xl border flex flex-col items-center justify-between text-center transition-all ${
                  isToday
                    ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400 scale-105 shadow-xl'
                    : isCompleted
                    ? 'bg-neutral-950/80 border-white/5 opacity-60'
                    : 'bg-neutral-950/40 border-white/5'
                }`}
              >
                <div className="text-[10px] font-bold text-neutral-400 uppercase">
                  Day {bonus.day}
                </div>
                <div className="text-xl my-1.5">
                  {idx === 6 ? '👑' : '🪙'}
                </div>
                <div className="text-xs font-black text-amber-300 font-mono">
                  +{bonus.coins}
                </div>
                {isCompleted && (
                  <div className="mt-1">
                    <Check size={14} className="text-emerald-400 mx-auto" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Claim Action Button */}
        <div className="flex justify-center">
          <button
            onClick={handleClaim}
            disabled={alreadyClaimedToday || claimedJustNow}
            className={`px-8 py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center gap-2 transition-all active:scale-95 shadow-xl ${
              alreadyClaimedToday || claimedJustNow
                ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-white/5'
                : 'bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black border-2 border-yellow-200'
            }`}
          >
            <Sparkles size={18} />
            {alreadyClaimedToday || claimedJustNow ? 'REWARD CLAIMED TODAY ✓' : `CLAIM DAY ${currentReward.day} (+₹ ${currentReward.coins})`}
          </button>
        </div>
      </div>
    </div>
  );
};
