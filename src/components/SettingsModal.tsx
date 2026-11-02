import React from 'react';
import { ArrowLeft, Monitor, Sliders, Volume2 } from 'lucide-react';
import { ControlType, GraphicsQuality } from '../types/game';

interface SettingsModalProps {
  graphicsQuality: GraphicsQuality;
  controlType: ControlType;
  onChangeGraphics: (quality: GraphicsQuality) => void;
  onChangeControl: (type: ControlType) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  graphicsQuality,
  controlType,
  onChangeGraphics,
  onChangeControl,
  onClose
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/95 backdrop-blur-xl flex flex-col text-white overflow-y-auto p-4 md:p-8 pb-28">
      {/* Top Header */}
      <div className="flex justify-between items-center pb-4 border-b border-white/10 max-w-2xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded-xl border border-white/10 active:scale-95 transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl md:text-2xl font-black uppercase tracking-wider text-amber-400">
              GAME SETTINGS
            </h2>
            <p className="text-xs text-neutral-400">Configure Graphics, Driving Controls & Audio</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto w-full space-y-6 my-6">
        {/* Graphics Quality */}
        <div className="bg-neutral-900/80 border border-white/10 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-3">
            <Monitor size={18} className="text-amber-400" />
            <h3 className="text-base font-black text-white">Graphics & Visual Quality</h3>
          </div>
          <p className="text-xs text-neutral-400 mb-4">
            Optimized for Android smartphones and desktop browsers. Ultra enables soft shadows and high foliage density.
          </p>

          <div className="grid grid-cols-4 gap-2">
            {(['low', 'medium', 'high', 'ultra'] as const).map((q) => (
              <button
                key={q}
                onClick={() => onChangeGraphics(q)}
                className={`py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all active:scale-95 ${
                  graphicsQuality === q
                    ? 'bg-amber-500 text-black shadow-lg ring-2 ring-amber-400 scale-105'
                    : 'bg-neutral-950 text-neutral-400 hover:bg-neutral-800 hover:text-white border border-white/5'
                }`}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Driving Controls Selection */}
        <div className="bg-neutral-900/80 border border-white/10 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-3">
            <Sliders size={18} className="text-cyan-400" />
            <h3 className="text-base font-black text-white">Driving Controls</h3>
          </div>
          <p className="text-xs text-neutral-400 mb-4">
            Select your preferred mobile steering interface or use keyboard shortcuts.
          </p>

          <div className="grid grid-cols-3 gap-3">
            {[
              { type: 'wheel' as const, label: '3D Steering Wheel', icon: '🛞' },
              { type: 'buttons' as const, label: 'Touch Arrow Keys', icon: '◀ ▶' },
              { type: 'tilt' as const, label: 'Device Tilt Gyro', icon: '📱' }
            ].map((c) => (
              <button
                key={c.type}
                onClick={() => onChangeControl(c.type)}
                className={`p-4 rounded-2xl font-bold text-xs flex flex-col items-center gap-2 transition-all active:scale-95 text-center ${
                  controlType === c.type
                    ? 'bg-cyan-600 text-white shadow-lg ring-2 ring-cyan-400 scale-105'
                    : 'bg-neutral-950 text-neutral-400 hover:bg-neutral-800 hover:text-white border border-white/5'
                }`}
              >
                <span className="text-2xl">{c.icon}</span>
                <span>{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Keyboard Controls Guide */}
        <div className="bg-neutral-900/80 border border-white/10 rounded-3xl p-6 shadow-xl">
          <h3 className="text-sm font-black text-white mb-3">Desktop Keyboard Shortcuts</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-neutral-950 p-2.5 rounded-xl border border-white/5 flex justify-between">
              <span className="text-neutral-400">Accelerate / Throttle</span>
              <kbd className="font-mono bg-neutral-800 px-2 py-0.5 rounded text-amber-300">W / ↑</kbd>
            </div>
            <div className="bg-neutral-950 p-2.5 rounded-xl border border-white/5 flex justify-between">
              <span className="text-neutral-400">Brake / Reverse</span>
              <kbd className="font-mono bg-neutral-800 px-2 py-0.5 rounded text-amber-300">S / ↓</kbd>
            </div>
            <div className="bg-neutral-950 p-2.5 rounded-xl border border-white/5 flex justify-between">
              <span className="text-neutral-400">Steer Left / Right</span>
              <kbd className="font-mono bg-neutral-800 px-2 py-0.5 rounded text-amber-300">A / D</kbd>
            </div>
            <div className="bg-neutral-950 p-2.5 rounded-xl border border-white/5 flex justify-between">
              <span className="text-neutral-400">Air Brakes</span>
              <kbd className="font-mono bg-neutral-800 px-2 py-0.5 rounded text-amber-300">Space</kbd>
            </div>
            <div className="bg-neutral-950 p-2.5 rounded-xl border border-white/5 flex justify-between">
              <span className="text-neutral-400">Indian Musical Horn</span>
              <kbd className="font-mono bg-neutral-800 px-2 py-0.5 rounded text-amber-300">H</kbd>
            </div>
            <div className="bg-neutral-950 p-2.5 rounded-xl border border-white/5 flex justify-between">
              <span className="text-neutral-400">Switch Camera View</span>
              <kbd className="font-mono bg-neutral-800 px-2 py-0.5 rounded text-amber-300">C</kbd>
            </div>
            <div className="bg-neutral-950 p-2.5 rounded-xl border border-white/5 flex justify-between">
              <span className="text-neutral-400">Toggle Headlights</span>
              <kbd className="font-mono bg-neutral-800 px-2 py-0.5 rounded text-amber-300">L</kbd>
            </div>
            <div className="bg-neutral-950 p-2.5 rounded-xl border border-white/5 flex justify-between">
              <span className="text-neutral-400">Windshield Wipers</span>
              <kbd className="font-mono bg-neutral-800 px-2 py-0.5 rounded text-amber-300">J</kbd>
            </div>
            <div className="bg-neutral-950 p-2.5 rounded-xl border border-white/5 flex justify-between">
              <span className="text-neutral-400">Handbrake</span>
              <kbd className="font-mono bg-neutral-800 px-2 py-0.5 rounded text-amber-300">P</kbd>
            </div>
            <div className="bg-neutral-950 p-2.5 rounded-xl border border-white/5 flex justify-between">
              <span className="text-neutral-400">Passenger Door</span>
              <kbd className="font-mono bg-neutral-800 px-2 py-0.5 rounded text-amber-300">E</kbd>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
