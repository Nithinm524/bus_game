import React, { useState, useEffect, useRef } from 'react';
import {
  AlertTriangle,
  Camera,
  DoorClosed,
  DoorOpen,
  Fuel,
  Gauge,
  Heart,
  Lightbulb,
  MessageSquare,
  Pause,
  RotateCcw,
  Sparkles,
  Users,
  Volume2,
  VolumeX,
  Wind,
  Wrench,
  X
} from 'lucide-react';
import {
  CameraView,
  ControlType,
  FuelStation,
  IndianRoute,
  Passenger,
  PassengerReaction,
  TrafficDensityLevel,
  VehicleControlState
} from '../types/game';
import { audioService } from '../services/audioService';

interface HUDProps {
  route: IndianRoute;
  controls: VehicleControlState;
  onUpdateControls: (updater: (prev: VehicleControlState) => VehicleControlState) => void;
  speedKmH: number;
  gearNumber: number;
  fuelLiters: number;
  fuelCapacity: number;
  estimatedRangeKm: number;
  consumptionRateLPer100Km: number;
  isLowFuel: boolean;
  healthPercent: number;
  coins: number;
  passengers: number;
  passengerCapacity: number;
  satisfaction: number;
  isAtBusStop: boolean;
  currentBusStopName: string;
  nextBusStopName: string;
  isNearFuelStation: boolean;
  currentFuelStation?: FuelStation;
  trafficDensity: TrafficDensityLevel;
  activeTrafficCount: number;
  passengerReactions: PassengerReaction[];
  onboardPassengerList: Passenger[];
  cameraView: CameraView;
  controlType: ControlType;
  onChangeCamera: () => void;
  onPause: () => void;
  onBoardPassengers: () => void;
  onOpenRefuelModal: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  route,
  controls,
  onUpdateControls,
  speedKmH,
  gearNumber,
  fuelLiters,
  fuelCapacity,
  estimatedRangeKm,
  consumptionRateLPer100Km,
  isLowFuel,
  healthPercent,
  coins,
  passengers,
  passengerCapacity,
  satisfaction,
  isAtBusStop,
  currentBusStopName,
  nextBusStopName,
  isNearFuelStation,
  currentFuelStation,
  trafficDensity,
  activeTrafficCount,
  passengerReactions,
  onboardPassengerList,
  cameraView,
  controlType,
  onChangeCamera,
  onPause,
  onBoardPassengers,
  onOpenRefuelModal
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [steeringAngle, setSteeringAngle] = useState(0); // in degrees
  const [showPassengerManifest, setShowPassengerManifest] = useState(false);
  const wheelRef = useRef<HTMLDivElement>(null);
  const isDraggingWheel = useRef(false);
  const wheelCenter = useRef({ x: 0, y: 0 });

  // Handle keyboard driving controls
  useEffect(() => {
    const keysDown = new Set<string>();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
      keysDown.add(e.code);

      // Single triggers
      if (e.code === 'KeyH') {
        audioService.playHorn(1);
        onUpdateControls((p) => ({ ...p, hornActive: 1 }));
      } else if (e.code === 'KeyC') {
        onChangeCamera();
      } else if (e.code === 'KeyL') {
        onUpdateControls((p) => ({
          ...p,
          headlights: p.headlights === 'off' ? 'low' : p.headlights === 'low' ? 'high' : 'off'
        }));
      } else if (e.code === 'KeyJ') {
        onUpdateControls((p) => ({ ...p, wipers: !p.wipers }));
      } else if (e.code === 'KeyP') {
        onUpdateControls((p) => {
          const next = !p.handbrake;
          if (next) audioService.playAirBrake();
          return { ...p, handbrake: next };
        });
      } else if (e.code === 'KeyE') {
        // Toggle door
        onUpdateControls((p) => {
          const nextDoor = !p.doorOpen;
          audioService.playDoorSound(nextDoor);
          if (nextDoor && isAtBusStop) {
            onBoardPassengers();
          }
          return { ...p, doorOpen: nextDoor };
        });
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysDown.delete(e.code);
      if (e.code === 'KeyH') {
        audioService.stopHorn();
        onUpdateControls((p) => ({ ...p, hornActive: 0 }));
      }
    };

    const pollInterval = window.setInterval(() => {
      onUpdateControls((prev) => {
        let throttle = 0;
        let brake = 0;
        let steering = prev.steering;

        if (keysDown.has('KeyW') || keysDown.has('ArrowUp')) {
          throttle = 1.0;
        }
        if (keysDown.has('KeyS') || keysDown.has('ArrowDown')) {
          brake = 1.0;
        }

        if (controlType !== 'wheel' || keysDown.has('KeyA') || keysDown.has('KeyD') || keysDown.has('ArrowLeft') || keysDown.has('ArrowRight')) {
          if (keysDown.has('KeyA') || keysDown.has('ArrowLeft')) {
            steering = Math.max(-1, steering - 0.15);
          } else if (keysDown.has('KeyD') || keysDown.has('ArrowRight')) {
            steering = Math.min(1, steering + 0.15);
          } else if (!isDraggingWheel.current) {
            steering *= 0.8;
            if (Math.abs(steering) < 0.02) steering = 0;
          }
        }

        if (keysDown.has('Space')) {
          brake = 1.0;
        }

        return {
          ...prev,
          throttle,
          brake,
          steering
        };
      });
    }, 30);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      clearInterval(pollInterval);
    };
  }, [controlType, isAtBusStop, onBoardPassengers, onChangeCamera, onUpdateControls]);

  // Touch / Drag handler for interactive 3D steering wheel
  const handleWheelStart = (clientX: number, clientY: number) => {
    if (!wheelRef.current) return;
    const rect = wheelRef.current.getBoundingClientRect();
    wheelCenter.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
    isDraggingWheel.current = true;
    updateWheelAngle(clientX, clientY);
  };

  const updateWheelAngle = (clientX: number, clientY: number) => {
    const dx = clientX - wheelCenter.current.x;
    const dy = clientY - wheelCenter.current.y;
    const angleRad = Math.atan2(dx, -dy);
    let angleDeg = (angleRad * 180) / Math.PI;
    angleDeg = Math.max(-160, Math.min(160, angleDeg));
    setSteeringAngle(angleDeg);
    const steerVal = angleDeg / 160;
    onUpdateControls((p) => ({ ...p, steering: steerVal }));
  };

  const handleWheelEnd = () => {
    isDraggingWheel.current = false;
    const springBack = () => {
      if (isDraggingWheel.current) return;
      setSteeringAngle((prev) => {
        const next = prev * 0.75;
        if (Math.abs(next) < 1) {
          onUpdateControls((p) => ({ ...p, steering: 0 }));
          return 0;
        }
        onUpdateControls((p) => ({ ...p, steering: next / 160 }));
        requestAnimationFrame(springBack);
        return next;
      });
    };
    requestAnimationFrame(springBack);
  };

  const toggleSound = () => {
    const next = !isMuted;
    setIsMuted(next);
    audioService.setMuted(next);
  };

  const toggleEngine = () => {
    onUpdateControls((p) => {
      const nextEngine = !p.engineOn;
      if (nextEngine) {
        audioService.startEngine();
      } else {
        audioService.stopEngine();
      }
      return { ...p, engineOn: nextEngine };
    });
  };

  const toggleDoor = () => {
    onUpdateControls((p) => {
      const nextDoor = !p.doorOpen;
      audioService.playDoorSound(nextDoor);
      if (nextDoor && isAtBusStop) {
        onBoardPassengers();
      }
      return { ...p, doorOpen: nextDoor };
    });
  };

  const handleHornPress = (preset: number) => {
    audioService.playHorn(preset);
    onUpdateControls((p) => ({ ...p, hornActive: preset }));
  };

  const handleHornRelease = () => {
    audioService.stopHorn();
    onUpdateControls((p) => ({ ...p, hornActive: 0 }));
  };

  const trafficLabel =
    trafficDensity === 'rush_hour'
      ? 'Peak Rush Hour'
      : trafficDensity === 'high'
      ? 'Dense Traffic'
      : trafficDensity === 'low'
      ? 'Late Night Low'
      : 'Moderate Traffic';

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden text-white font-sans">
      {/* TOP BAR: Exact BUSSID Style Cluster */}
      <div className="flex justify-between items-start p-3 pointer-events-auto">
        {/* TOP LEFT CLUSTER: Controls & Lights */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 bg-black/65 px-3 py-1.5 rounded-lg border border-white/20">
            <button
              onClick={onPause}
              className="p-1.5 bg-neutral-800 hover:bg-neutral-700 active:scale-95 rounded text-yellow-400"
              title="Pause Game"
            >
              <Pause size={18} />
            </button>
            <button
              onClick={toggleSound}
              className="p-1.5 bg-neutral-800 hover:bg-neutral-700 active:scale-95 rounded text-white"
              title="Mute Sound"
            >
              {isMuted ? <VolumeX size={18} className="text-red-400" /> : <Volume2 size={18} />}
            </button>
            <div className="text-xs font-mono text-neutral-300">
              <span>13:58</span> • <span className="text-green-400 font-bold">60 FPS</span>
            </div>
            {/* Dynamic Traffic Density Badge */}
            <div className="border-l border-neutral-700 pl-2 text-[10px] text-cyan-300 flex items-center gap-1">
              <span>🚦</span>
              <span>{trafficLabel} ({Math.round(activeTrafficCount)} AI)</span>
            </div>
          </div>

          {/* Quick Vehicle Feature Toggles */}
          <div className="flex items-center gap-1.5 bg-black/65 p-1.5 rounded-lg border border-white/20">
            {/* Headlights */}
            <button
              onClick={() =>
                onUpdateControls((p) => ({
                  ...p,
                  headlights: p.headlights === 'off' ? 'low' : p.headlights === 'low' ? 'high' : 'off'
                }))
              }
              className={`p-1.5 rounded text-xs flex items-center gap-1 font-semibold ${
                controls.headlights !== 'off'
                  ? controls.headlights === 'high'
                    ? 'bg-blue-600 text-white'
                    : 'bg-yellow-500 text-black'
                  : 'bg-neutral-800 text-neutral-400'
              }`}
              title="Headlights (Off / Low / High)"
            >
              <Lightbulb size={16} />
              {controls.headlights.toUpperCase()}
            </button>

            {/* Hazard Flasher */}
            <button
              onClick={() =>
                onUpdateControls((p) => {
                  const next = !p.hazardLights;
                  if (next) audioService.startIndicator();
                  else if (!p.leftIndicator && !p.rightIndicator) audioService.stopIndicator();
                  return { ...p, hazardLights: next };
                })
              }
              className={`p-1.5 rounded ${controls.hazardLights ? 'bg-red-600 text-white animate-pulse' : 'bg-neutral-800 text-neutral-400'}`}
              title="Hazard Warning Lights"
            >
              ⚠️
            </button>

            {/* Wipers */}
            <button
              onClick={() => onUpdateControls((p) => ({ ...p, wipers: !p.wipers }))}
              className={`p-1.5 rounded ${controls.wipers ? 'bg-cyan-600 text-white' : 'bg-neutral-800 text-neutral-400'}`}
              title="Windshield Wipers"
            >
              <Wind size={16} />
            </button>

            {/* Handbrake Toggle */}
            <button
              onClick={() =>
                onUpdateControls((p) => {
                  const next = !p.handbrake;
                  if (next) audioService.playAirBrake();
                  return { ...p, handbrake: next };
                })
              }
              className={`p-1.5 rounded font-bold text-xs ${controls.handbrake ? 'bg-red-600 text-white' : 'bg-neutral-800 text-neutral-300'}`}
              title="Handbrake [P]"
            >
              ( P )
            </button>
          </div>

          {/* Turn Indicators & Horn Buttons */}
          <div className="flex items-center gap-1.5 bg-black/65 p-1.5 rounded-lg border border-white/20">
            {/* Left Indicator */}
            <button
              onClick={() =>
                onUpdateControls((p) => {
                  const next = !p.leftIndicator;
                  if (next) audioService.startIndicator();
                  else if (!p.hazardLights && !p.rightIndicator) audioService.stopIndicator();
                  return { ...p, leftIndicator: next, rightIndicator: false };
                })
              }
              className={`px-2 py-1 rounded text-sm font-black ${controls.leftIndicator ? 'bg-amber-500 text-black animate-pulse' : 'bg-neutral-800 text-neutral-300'}`}
            >
              ◀
            </button>

            {/* Indian Multi-tone Musical Horn Presets [1] [2] [3] */}
            <div className="flex items-center gap-1">
              {[1, 2, 3].map((num) => (
                <button
                  key={num}
                  onMouseDown={() => handleHornPress(num)}
                  onMouseUp={handleHornRelease}
                  onTouchStart={() => handleHornPress(num)}
                  onTouchEnd={handleHornRelease}
                  className={`px-2 py-1 rounded text-xs font-bold active:scale-95 transition-all ${
                    controls.hornActive === num
                      ? 'bg-amber-400 text-black scale-105 ring-2 ring-amber-300'
                      : 'bg-neutral-800 text-amber-400 hover:bg-neutral-700'
                  }`}
                  title={`Indian Musical Horn #${num}`}
                >
                  🎺 {num}
                </button>
              ))}
            </div>

            {/* Right Indicator */}
            <button
              onClick={() =>
                onUpdateControls((p) => {
                  const next = !p.rightIndicator;
                  if (next) audioService.startIndicator();
                  else if (!p.hazardLights && !p.leftIndicator) audioService.stopIndicator();
                  return { ...p, rightIndicator: next, leftIndicator: false };
                })
              }
              className={`px-2 py-1 rounded text-sm font-black ${controls.rightIndicator ? 'bg-amber-500 text-black animate-pulse' : 'bg-neutral-800 text-neutral-300'}`}
            >
              ▶
            </button>
          </div>
        </div>

        {/* TOP RIGHT CLUSTER: Digital Speedometer, Gear, Fuel & Range, Health */}
        <div className="flex flex-col items-end gap-2">
          {/* Main Digital Instrument Cluster */}
          <div className="flex items-center gap-3 bg-black/80 px-3 py-2 rounded-xl border border-white/20 shadow-2xl">
            {/* Gear Badge */}
            <div className="bg-amber-500 text-black font-black px-2.5 py-1 rounded-md text-base leading-none">
              {controls.gear} {controls.gear === 'D' ? gearNumber : ''}
            </div>

            {/* Digital Speedometer */}
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-3xl font-black tracking-wider text-white">
                {String(speedKmH).padStart(3, '0')}
              </span>
              <span className="text-[10px] text-neutral-400 uppercase font-semibold">km/h</span>
            </div>

            {/* Health & Fuel Indicators with Range */}
            <div className="flex flex-col gap-0.5 border-l border-neutral-700 pl-2.5 text-xs font-mono">
              <div className="flex items-center gap-1 text-emerald-400">
                <Heart size={12} />
                <span>{Math.round(healthPercent)}%</span>
              </div>
              {/* Detailed Fuel + Estimated Range */}
              <div className="flex items-center gap-1 text-amber-300">
                <Fuel size={12} className={isLowFuel ? 'text-red-400 animate-pulse' : ''} />
                <span>{Math.round(fuelLiters)} L</span>
                <span className="text-[10px] text-neutral-400">({Math.round((fuelLiters / fuelCapacity) * 100)}%)</span>
              </div>
              <div className="text-[10px] text-cyan-300 font-sans font-bold">
                Range: ~{estimatedRangeKm} KM
              </div>
            </div>

            {/* In-game Bharat Coins */}
            <div className="border-l border-neutral-700 pl-2 text-right">
              <div className="text-[10px] text-neutral-400 uppercase font-semibold">Bharat Coins</div>
              <div className="text-amber-400 font-bold font-mono text-sm">
                ₹ {coins.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Low Fuel Warning Alert */}
          {isLowFuel && (
            <div className="bg-red-600/90 text-white px-3 py-1 rounded-lg text-xs font-bold border border-red-300 flex items-center gap-1.5 shadow-lg animate-pulse">
              <AlertTriangle size={14} />
              <span>LOW DIESEL! Range: {estimatedRangeKm} KM. Refuel soon!</span>
            </div>
          )}

          {/* Current Route & Next Stop Banner */}
          <div className="flex items-center gap-2 bg-black/65 px-3 py-1 rounded-lg border border-white/20 text-xs">
            <span className="text-amber-400 font-bold">📍 {route.name}</span>
            <span className="text-neutral-400">• Next Stop: <strong className="text-white">{nextBusStopName}</strong></span>
          </div>

          {/* Roadside Fuel Station Pull-In Prompt */}
          {isNearFuelStation && currentFuelStation && (
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white px-4 py-2 rounded-xl text-xs font-bold border border-cyan-300 flex items-center gap-3 shadow-2xl animate-bounce">
              <div>
                <div className="flex items-center gap-1 text-amber-300">
                  <Fuel size={14} />
                  <span>{currentFuelStation.name}</span>
                </div>
                <div className="text-[10px] text-neutral-200">Diesel @ ₹{currentFuelStation.pricePerLiter.toFixed(2)}/L</div>
              </div>
              <button
                onClick={onOpenRefuelModal}
                className="bg-amber-400 hover:bg-amber-300 text-black px-3 py-1 rounded-lg font-black shadow-md active:scale-95 transition-all"
              >
                REFUEL BUS ⛽
              </button>
            </div>
          )}

          {/* Bus Stop Boarding Prompt when at bus stand */}
          {isAtBusStop && (
            <div className="bg-emerald-600/95 text-white px-3 py-1.5 rounded-lg text-xs font-bold border border-emerald-300 flex items-center gap-2 shadow-lg animate-bounce">
              <span>🚏 {currentBusStopName}</span>
              <button
                onClick={toggleDoor}
                className="bg-white text-emerald-800 px-2 py-0.5 rounded font-black hover:bg-emerald-100"
              >
                {controls.doorOpen ? 'BOARDED ✓' : 'OPEN DOORS'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* FLOATING PASSENGER REACTION SPEECH BUBBLES (Middle-Left) */}
      <div className="absolute left-4 top-40 flex flex-col gap-2 max-w-xs pointer-events-none z-30">
        {passengerReactions.map((reaction) => (
          <div
            key={reaction.id}
            className={`p-2.5 rounded-2xl shadow-2xl border text-xs flex items-start gap-2 backdrop-blur-md animate-fade-in ${
              reaction.type === 'complaint'
                ? 'bg-red-950/90 border-red-500/60 text-red-200'
                : reaction.type === 'praise'
                ? 'bg-emerald-950/90 border-emerald-500/60 text-emerald-200'
                : 'bg-blue-950/90 border-blue-500/60 text-blue-200'
            }`}
          >
            <span className="text-base">
              {reaction.type === 'complaint' ? '😡' : reaction.type === 'praise' ? '😊' : '📢'}
            </span>
            <div>
              <div className="font-black text-[11px] flex items-center gap-1">
                <span>{reaction.passengerName}</span>
                {reaction.type === 'complaint' && <span className="text-red-400 text-[9px] uppercase font-bold">[Complaint]</span>}
                {reaction.type === 'praise' && <span className="text-emerald-400 text-[9px] uppercase font-bold">[Praise]</span>}
              </div>
              <div className="text-xs leading-snug mt-0.5">{reaction.message}</div>
            </div>
          </div>
        ))}
      </div>

      {/* RIGHT SIDEBAR CLUSTER: Passenger Card, Engine Switch, Camera, Door */}
      <div className="absolute right-3 top-28 flex flex-col items-center gap-2.5 pointer-events-auto">
        {/* Passenger Stats (Clickable to open manifest drawer) */}
        <button
          onClick={() => setShowPassengerManifest(!showPassengerManifest)}
          className="flex flex-col items-center bg-black/75 p-2 rounded-xl border border-white/20 text-xs w-16 text-center hover:bg-neutral-800 transition-all active:scale-95"
          title="View Passenger Manifest"
        >
          <span className="text-base">👥</span>
          <span className="font-bold text-amber-300">
            {passengers}/{passengerCapacity}
          </span>
          <div className="w-full bg-neutral-700 h-1.5 rounded-full mt-1 overflow-hidden">
            <div
              className={`h-full ${satisfaction > 70 ? 'bg-emerald-500' : satisfaction > 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
              style={{ width: `${satisfaction}%` }}
            />
          </div>
          <span className="text-[8px] text-neutral-400 mt-0.5">Manifest</span>
        </button>

        {/* Engine Start/Stop Switch */}
        <button
          onClick={toggleEngine}
          className={`flex flex-col items-center justify-center w-14 h-14 rounded-full border-2 transition-all active:scale-95 ${
            controls.engineOn
              ? 'bg-emerald-600 border-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.5)]'
              : 'bg-red-800 border-red-500'
          }`}
          title="Engine Start/Stop"
        >
          <span className="text-xs font-black tracking-wider">ENGINE</span>
          <span className="text-[10px] font-bold">{controls.engineOn ? 'ON' : 'OFF'}</span>
        </button>

        {/* Camera Switcher (6 Perspectives) */}
        <button
          onClick={onChangeCamera}
          className="flex flex-col items-center justify-center w-12 h-12 bg-neutral-900/80 hover:bg-neutral-800 border border-white/20 rounded-xl active:scale-95 transition-all text-xs"
          title="Switch Camera View"
        >
          <Camera size={18} className="text-cyan-400" />
          <span className="text-[9px] text-neutral-300 capitalize">{cameraView}</span>
        </button>

        {/* Bus Passenger Door Button */}
        <button
          onClick={toggleDoor}
          className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl border transition-all active:scale-95 ${
            controls.doorOpen ? 'bg-amber-600 border-amber-300' : 'bg-neutral-900/80 border-white/20'
          }`}
          title="Pneumatic Door"
        >
          {controls.doorOpen ? <DoorOpen size={18} className="text-white" /> : <DoorClosed size={18} className="text-neutral-400" />}
          <span className="text-[9px] font-bold">{controls.doorOpen ? 'OPEN' : 'DOOR'}</span>
        </button>
      </div>

      {/* PASSENGER MANIFEST DRAWER OVERLAY */}
      {showPassengerManifest && (
        <div className="absolute right-20 top-24 z-40 bg-neutral-950/95 border border-white/20 rounded-3xl p-4 w-80 shadow-2xl pointer-events-auto max-h-[70vh] flex flex-col">
          <div className="flex justify-between items-center pb-2 border-b border-white/10 mb-3">
            <div>
              <h4 className="text-sm font-black text-amber-400 flex items-center gap-1.5">
                <Users size={16} />
                Passenger Manifest
              </h4>
              <p className="text-[10px] text-neutral-400">
                {onboardPassengerList.length} passengers onboard • Avg Happiness: {satisfaction}%
              </p>
            </div>
            <button
              onClick={() => setShowPassengerManifest(false)}
              className="p-1 hover:bg-neutral-800 rounded-lg text-neutral-400"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {onboardPassengerList.length === 0 ? (
              <div className="text-center text-xs text-neutral-500 py-6">
                No passengers onboard. Stop at the next bus shelter to board passengers!
              </div>
            ) : (
              onboardPassengerList.map((pax) => (
                <div
                  key={pax.id}
                  className="bg-neutral-900 p-2.5 rounded-xl border border-white/5 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{pax.avatar}</span>
                    <div>
                      <div className="font-bold text-white flex items-center gap-1">
                        {pax.name}
                        {pax.isSenior && <span className="text-[9px] bg-purple-900 px-1 rounded text-purple-200">Senior</span>}
                      </div>
                      <div className="text-[10px] text-neutral-400">
                        Dest: <strong className="text-amber-300">{pax.destination}</strong>
                      </div>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-emerald-400 font-bold">₹{pax.fare}</div>
                    <div className="text-[9px] text-neutral-400">{pax.happiness}% Happy</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* BOTTOM CONTROLS CLUSTER: Mobile pedals, gear shift & realistic steering wheel */}
      <div className="absolute bottom-3 inset-x-3 flex justify-between items-end pointer-events-auto">
        {/* BOTTOM LEFT: Interactive 3D Steering Wheel or Directional Buttons */}
        <div className="flex flex-col items-center">
          {controlType === 'wheel' ? (
            <div className="relative select-none touch-none">
              <div
                ref={wheelRef}
                onMouseDown={(e) => handleWheelStart(e.clientX, e.clientY)}
                onMouseMove={(e) => isDraggingWheel.current && updateWheelAngle(e.clientX, e.clientY)}
                onMouseUp={handleWheelEnd}
                onMouseLeave={handleWheelEnd}
                onTouchStart={(e) => {
                  const touch = e.touches[0];
                  handleWheelStart(touch.clientX, touch.clientY);
                }}
                onTouchMove={(e) => {
                  const touch = e.touches[0];
                  if (isDraggingWheel.current) updateWheelAngle(touch.clientX, touch.clientY);
                }}
                onTouchEnd={handleWheelEnd}
                style={{ transform: `rotate(${steeringAngle}deg)` }}
                className="w-36 h-36 md:w-44 md:h-44 rounded-full border-8 border-neutral-900 bg-neutral-800 shadow-[0_10px_25px_rgba(0,0,0,0.8)] cursor-grab active:cursor-grabbing flex items-center justify-center relative transition-transform duration-75"
              >
                {/* Wheel Outer Grip Details */}
                <div className="w-full h-full rounded-full border-4 border-neutral-700/60 flex items-center justify-center">
                  <div className="absolute w-full h-4 bg-neutral-900" />
                  <div className="absolute h-full w-4 bg-neutral-900" />
                  <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-400 border-2 border-amber-200 flex flex-col items-center justify-center shadow-inner z-10">
                    <span className="text-[9px] font-black tracking-widest text-neutral-900">BHARAT</span>
                    <span className="text-[7px] font-bold text-neutral-950">BUS 3D</span>
                  </div>
                </div>
              </div>
              <div className="text-center text-[10px] text-neutral-400 mt-1 font-mono">
                Steer: {Math.round(steeringAngle)}° [A / D]
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onMouseDown={() => onUpdateControls((p) => ({ ...p, steering: -0.85 }))}
                onMouseUp={() => onUpdateControls((p) => ({ ...p, steering: 0 }))}
                onTouchStart={() => onUpdateControls((p) => ({ ...p, steering: -0.85 }))}
                onTouchEnd={() => onUpdateControls((p) => ({ ...p, steering: 0 }))}
                className="w-16 h-16 bg-neutral-900/90 active:bg-amber-500 active:text-black border-2 border-white/20 rounded-2xl flex items-center justify-center text-2xl font-black shadow-lg"
              >
                ◀
              </button>
              <button
                onMouseDown={() => onUpdateControls((p) => ({ ...p, steering: 0.85 }))}
                onMouseUp={() => onUpdateControls((p) => ({ ...p, steering: 0 }))}
                onTouchStart={() => onUpdateControls((p) => ({ ...p, steering: 0.85 }))}
                onTouchEnd={() => onUpdateControls((p) => ({ ...p, steering: 0 }))}
                className="w-16 h-16 bg-neutral-900/90 active:bg-amber-500 active:text-black border-2 border-white/20 rounded-2xl flex items-center justify-center text-2xl font-black shadow-lg"
              >
                ▶
              </button>
            </div>
          )}
        </div>

        {/* BOTTOM RIGHT: Transmission Gear Lever + Brake & Accelerator Pedals */}
        <div className="flex items-end gap-3 select-none touch-none">
          {/* Automatic / Manual Gear Lever (D / N / R) */}
          <div className="flex flex-col bg-black/80 rounded-xl p-1 border border-white/20 shadow-xl">
            {(['D', 'N', 'R'] as const).map((gearMode) => (
              <button
                key={gearMode}
                onClick={() => onUpdateControls((p) => ({ ...p, gear: gearMode }))}
                className={`w-10 h-9 rounded-lg font-black text-sm flex items-center justify-center transition-all ${
                  controls.gear === gearMode
                    ? gearMode === 'D'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : gearMode === 'R'
                      ? 'bg-red-600 text-white shadow-md'
                      : 'bg-amber-500 text-black shadow-md'
                    : 'text-neutral-400 hover:bg-neutral-800'
                }`}
              >
                {gearMode}
              </button>
            ))}
          </div>

          {/* Brake Pedal */}
          <button
            onMouseDown={() => {
              audioService.playAirBrake();
              onUpdateControls((p) => ({ ...p, brake: 1.0, throttle: 0 }));
            }}
            onMouseUp={() => onUpdateControls((p) => ({ ...p, brake: 0 }))}
            onTouchStart={() => {
              audioService.playAirBrake();
              onUpdateControls((p) => ({ ...p, brake: 1.0, throttle: 0 }));
            }}
            onTouchEnd={() => onUpdateControls((p) => ({ ...p, brake: 0 }))}
            className={`w-18 h-28 md:w-22 md:h-32 rounded-xl border-4 transition-all flex flex-col items-center justify-center shadow-2xl ${
              controls.brake > 0
                ? 'bg-red-600 border-red-300 translate-y-2'
                : 'bg-gradient-to-b from-neutral-800 to-neutral-950 border-neutral-700'
            }`}
          >
            <div className="w-12 h-1 bg-neutral-600 rounded mb-1" />
            <div className="w-12 h-1 bg-neutral-600 rounded mb-1" />
            <div className="w-12 h-1 bg-neutral-600 rounded mb-1" />
            <span className="text-xs font-black tracking-widest text-neutral-300 mt-1">BRAKE</span>
            <span className="text-[9px] text-neutral-400">[S / Space]</span>
          </button>

          {/* Accelerator Pedal */}
          <button
            onMouseDown={() => onUpdateControls((p) => ({ ...p, throttle: 1.0, brake: 0 }))}
            onMouseUp={() => onUpdateControls((p) => ({ ...p, throttle: 0 }))}
            onTouchStart={() => onUpdateControls((p) => ({ ...p, throttle: 1.0, brake: 0 }))}
            onTouchEnd={() => onUpdateControls((p) => ({ ...p, throttle: 0 }))}
            className={`w-14 h-36 md:w-16 md:h-40 rounded-xl border-4 transition-all flex flex-col items-center justify-center shadow-2xl ${
              controls.throttle > 0
                ? 'bg-amber-500 border-amber-300 translate-y-3'
                : 'bg-gradient-to-b from-neutral-800 to-neutral-950 border-neutral-700'
            }`}
          >
            <div className="w-8 h-1 bg-neutral-600 rounded mb-1.5" />
            <div className="w-8 h-1 bg-neutral-600 rounded mb-1.5" />
            <div className="w-8 h-1 bg-neutral-600 rounded mb-1.5" />
            <div className="w-8 h-1 bg-neutral-600 rounded mb-1.5" />
            <span className="text-[10px] font-black tracking-widest text-neutral-300 mt-2">GAS</span>
            <span className="text-[8px] text-neutral-400">[W / ↑]</span>
          </button>
        </div>
      </div>
    </div>
  );
};
