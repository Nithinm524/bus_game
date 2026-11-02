import React from 'react';
import { Home, Play, RotateCcw, Settings } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onOpenSettings: () => void;
  onExit: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onOpenSettings,
  onExit
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 text-white">
      <div className="bg-neutral-900 border border-white/10 rounded-3xl p-6 md:p-8 max-w-sm w-full text-center shadow-2xl">
        <h2 className="text-2xl font-black uppercase tracking-wider text-amber-400 mb-6">
          GAME PAUSED
        </h2>

        <div className="space-y-3">
          <button
            onClick={onResume}
            className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg"
          >
            <Play size={18} className="fill-black" />
            Resume Driving
          </button>

          <button
            onClick={onRestart}
            className="w-full py-3 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-white/10 transition-all active:scale-95"
          >
            <RotateCcw size={16} />
            Restart Route
          </button>

          <button
            onClick={onOpenSettings}
            className="w-full py-3 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-white/10 transition-all active:scale-95"
          >
            <Settings size={16} />
            Settings
          </button>

          <button
            onClick={onExit}
            className="w-full py-3 rounded-2xl bg-red-950/70 hover:bg-red-900 text-red-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-red-500/30 transition-all active:scale-95 mt-4"
          >
            <Home size={16} />
            Exit to Main Menu
          </button>
        </div>
      </div>
    </div>
  );
};
