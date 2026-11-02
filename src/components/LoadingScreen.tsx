import React, { useEffect, useState } from 'react';

interface LoadingScreenProps {
  onLoaded: () => void;
  routeName: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onLoaded, routeName }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onLoaded, 300);
          return 100;
        }
        return prev + Math.floor(Math.random() * 15) + 10;
      });
    }, 150);

    return () => clearInterval(interval);
  }, [onLoaded]);

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950 flex flex-col items-center justify-between p-8 text-white select-none">
      <div className="text-center mt-12">
        <span className="text-xs font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
          Entering Route
        </span>
        <h2 className="text-2xl md:text-3xl font-black mt-2 text-white">{routeName}</h2>
      </div>

      {/* Animated Indian Bus driving through scenic hills */}
      <div className="w-full max-w-md flex flex-col items-center">
        <div className="w-full h-36 relative overflow-hidden flex items-end justify-center border-b-4 border-amber-500/60">
          {/* Animated Mountains silhouette in background */}
          <div className="absolute inset-0 flex items-end justify-center opacity-30">
            <div className="w-48 h-28 bg-emerald-900 rounded-t-full transform -translate-x-16" />
            <div className="w-64 h-32 bg-emerald-800 rounded-t-full transform translate-x-12" />
          </div>

          {/* Animated Indian Bus */}
          <div className="animate-bounce z-10 flex flex-col items-center">
            {/* Bus Roof luggage & AC */}
            <div className="w-24 h-3 bg-amber-600 rounded-t-sm" />
            {/* Bus Body */}
            <div className="w-36 h-14 bg-gradient-to-r from-red-600 via-amber-500 to-red-600 rounded-lg shadow-xl relative flex items-center justify-between px-2 border border-yellow-300">
              {/* Windows */}
              <div className="w-6 h-5 bg-cyan-200/80 rounded" />
              <div className="w-6 h-5 bg-cyan-200/80 rounded" />
              <div className="w-6 h-5 bg-cyan-200/80 rounded" />
              <div className="w-6 h-5 bg-cyan-200/80 rounded" />
            </div>
            {/* Wheels */}
            <div className="flex justify-between w-28 -mt-2.5 z-20">
              <div className="w-6 h-6 rounded-full bg-neutral-900 border-2 border-neutral-600 animate-spin" />
              <div className="w-6 h-6 rounded-full bg-neutral-900 border-2 border-neutral-600 animate-spin" />
            </div>
          </div>
        </div>

        {/* Loading Progress Bar */}
        <div className="w-full bg-neutral-900 h-2.5 rounded-full mt-6 overflow-hidden border border-white/10">
          <div
            className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex justify-between w-full text-xs text-neutral-400 mt-2 font-mono">
          <span>Loading 3D Terrain & AI Traffic...</span>
          <span className="text-amber-400 font-bold">{progress}%</span>
        </div>
      </div>

      <div className="text-center text-xs text-neutral-500 mb-6">
        Tip: Press <kbd className="bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-300">H</kbd> for famous Indian multi-tone air horns on highways!
      </div>
    </div>
  );
};
