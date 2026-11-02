/**
 * Bharat Bus Simulator 3D (BUSSID inspired)
 * Main Application Orchestrator
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  BusConfig,
  CameraView,
  ControlType,
  Driver,
  FuelStation,
  GameMode,
  GraphicsQuality,
  IndianRoute,
  Passenger,
  PassengerReaction,
  PlayerStats,
  TimeOfDay,
  TrafficDensityLevel,
  VehicleControlState,
  WeatherType
} from './types/game';
import { INITIAL_BUSES, INITIAL_DRIVERS, INDIAN_ROUTES } from './data/gameData';
import { storageService } from './services/storageService';
import { audioService } from './services/audioService';
import { GameCanvas } from './game/GameCanvas';
import { HUD } from './components/HUD';
import { MainMenu } from './components/MainMenu';
import { BusShowroom } from './components/BusShowroom';
import { DriverShowroom } from './components/DriverShowroom';
import { GarageModal } from './components/GarageModal';
import { MapSelector } from './components/MapSelector';
import { DailyRewardsModal } from './components/DailyRewardsModal';
import { TripCompletedModal } from './components/TripCompletedModal';
import { MultiplayerModal } from './components/MultiplayerModal';
import { SettingsModal } from './components/SettingsModal';
import { LoadingScreen } from './components/LoadingScreen';
import { PauseModal } from './components/PauseModal';
import { RefuelModal } from './components/RefuelModal';
import { PassengerManager } from './game/passengerManager';

type ActiveModal =
  | 'showroom'
  | 'drivers'
  | 'garage'
  | 'map'
  | 'daily'
  | 'multiplayer'
  | 'settings'
  | 'trip_completed'
  | 'pause'
  | 'refuel'
  | null;

export default function App() {
  // Persistent Player Stats
  const [stats, setStats] = useState<PlayerStats>(() => storageService.loadStats());

  // Active Selections
  const [selectedBusId, setSelectedBusId] = useState<string>(() => stats.selectedBusId || 'ksrtc_airavat');
  const [selectedDriverId, setSelectedDriverId] = useState<string>(() => stats.selectedDriverId || 'raju_anna');
  const [selectedRoute, setSelectedRoute] = useState<IndianRoute>(INDIAN_ROUTES[0]);
  const [gameMode, setGameMode] = useState<GameMode>('free_drive');
  const [weather, setWeather] = useState<WeatherType>('sunny');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('noon');

  // App Screen States
  const [screen, setScreen] = useState<'menu' | 'loading' | 'driving'>('menu');
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);

  // Settings
  const [graphicsQuality, setGraphicsQuality] = useState<GraphicsQuality>('high');
  const [controlType, setControlType] = useState<ControlType>('wheel');
  const [cameraView, setCameraView] = useState<CameraView>('rear');

  // Driving Vehicle Controls State
  const [controls, setControls] = useState<VehicleControlState>({
    throttle: 0,
    brake: 0,
    steering: 0,
    gear: 'D',
    gearNumber: 1,
    handbrake: false,
    engineOn: true,
    headlights: 'off',
    leftIndicator: false,
    rightIndicator: false,
    hazardLights: false,
    wipers: false,
    doorOpen: false,
    hornActive: 0
  });

  // Active Trip Telemetry
  const [speedKmH, setSpeedKmH] = useState(0);
  const [gearNumber, setGearNumber] = useState(1);
  const [distanceMeters, setDistanceMeters] = useState(0);
  const [isAtBusStop, setIsAtBusStop] = useState(false);
  const [busHealth, setBusHealth] = useState(94);

  // Fuel Management Telemetry
  const [fuelLiters, setFuelLiters] = useState(240);
  const [fuelCapacity, setFuelCapacity] = useState(280);
  const [estimatedRangeKm, setEstimatedRangeKm] = useState(750);
  const [consumptionRateLPer100Km, setConsumptionRateLPer100Km] = useState(28.0);
  const [isLowFuel, setIsLowFuel] = useState(false);
  const [isNearFuelStation, setIsNearFuelStation] = useState(false);
  const [currentFuelStation, setCurrentFuelStation] = useState<FuelStation | undefined>(undefined);
  const [refuelLitersToAdd, setRefuelLitersToAdd] = useState(0);

  // Dynamic Traffic Telemetry
  const [trafficDensity, setTrafficDensity] = useState<TrafficDensityLevel>('medium');
  const [activeTrafficCount, setActiveTrafficCount] = useState(10);

  // Interactive Passenger System State
  const passengerManagerRef = useRef<PassengerManager | null>(null);
  const [onboardPassengerList, setOnboardPassengerList] = useState<Passenger[]>([]);
  const [passengerReactions, setPassengerReactions] = useState<PassengerReaction[]>([]);
  const [satisfaction, setSatisfaction] = useState(95);
  const [currentBusStopName, setCurrentBusStopName] = useState('');
  const [nextBusStopName, setNextBusStopName] = useState('');

  // Trip completion summary state
  const [completedTripSummary, setCompletedTripSummary] = useState<{
    distanceKm: number;
    passengers: number;
    score: number;
    baseReward: number;
    bonusReward: number;
  } | null>(null);

  const selectedBus = INITIAL_BUSES.find((b) => b.id === selectedBusId) || INITIAL_BUSES[0];
  const selectedDriver = INITIAL_DRIVERS.find((d) => d.id === selectedDriverId) || INITIAL_DRIVERS[0];
  const driverEcoBonus = selectedDriver.specialAbility.toLowerCase().includes('fuel');

  // Save changes to active selections in persistent storage
  useEffect(() => {
    setStats((prev) => {
      const updated = {
        ...prev,
        selectedBusId,
        selectedDriverId
      };
      storageService.saveStats(updated);
      return updated;
    });
  }, [selectedBusId, selectedDriverId]);

  // Start a new driving trip in selected mode
  const handleStartGame = (mode: GameMode) => {
    setGameMode(mode);
    setWeather(selectedRoute.defaultWeather);
    const chosenTime: TimeOfDay = mode === 'challenge' ? 'night' : 'noon';
    setTimeOfDay(chosenTime);

    // Initialize vehicle fuel state
    const savedFuel = stats.busFuel[selectedBus.id] || selectedBus.fuelCapacity;
    setFuelLiters(savedFuel);
    setFuelCapacity(selectedBus.fuelCapacity);
    setEstimatedRangeKm(Math.round((savedFuel / 28.0) * 100));
    setBusHealth(100 - (stats.busDamage[selectedBus.id] || 0));
    setDistanceMeters(0);
    setRefuelLitersToAdd(0);

    // Initialize Passenger Manager for this route
    const startingPaxCount = Math.floor(selectedBus.passengerCapacity * 0.55);
    const pm = new PassengerManager(selectedRoute, startingPaxCount);
    passengerManagerRef.current = pm;
    setOnboardPassengerList([...pm.onboardPassengers]);
    setPassengerReactions([]);
    setSatisfaction(pm.getAverageSatisfaction());
    setCurrentBusStopName(pm.getCurrentStopName());
    setNextBusStopName(pm.getNextStopName());

    // Audio init & start
    audioService.init();
    audioService.startEngine();

    setScreen('loading');
  };

  const handleLoaded = () => {
    setScreen('driving');
  };

  // Switch camera views
  const handleChangeCamera = useCallback(() => {
    const views: CameraView[] = ['rear', 'cockpit', 'front', 'side', 'passenger', 'top', 'cinematic'];
    setCameraView((prev) => {
      const idx = views.indexOf(prev);
      return views[(idx + 1) % views.length];
    });
  }, []);

  // Update trip telemetry from Three.js physics and environment loop
  const handleTripTelemetry = useCallback(
    (telemetry: {
      speedKmH: number;
      distanceCoveredMeters: number;
      isAtBusStop: boolean;
      gearNumber: number;
      fuelLiters: number;
      fuelCapacity: number;
      consumptionRateLPer100Km: number;
      estimatedRangeKm: number;
      isLowFuel: boolean;
      isNearFuelStation: boolean;
      currentFuelStation?: FuelStation;
      trafficDensity: TrafficDensityLevel;
      activeTrafficCount: number;
    }) => {
      setSpeedKmH(telemetry.speedKmH);
      setGearNumber(telemetry.gearNumber);
      setDistanceMeters(telemetry.distanceCoveredMeters);
      setIsAtBusStop(telemetry.isAtBusStop);

      // Fuel updates
      setFuelLiters(telemetry.fuelLiters);
      setFuelCapacity(telemetry.fuelCapacity);
      setConsumptionRateLPer100Km(telemetry.consumptionRateLPer100Km);
      setEstimatedRangeKm(telemetry.estimatedRangeKm);
      setIsLowFuel(telemetry.isLowFuel);

      // Fuel station detection
      setIsNearFuelStation(telemetry.isNearFuelStation);
      setCurrentFuelStation(telemetry.currentFuelStation);

      // Dynamic traffic density
      setTrafficDensity(telemetry.trafficDensity);
      setActiveTrafficCount(telemetry.activeTrafficCount);

      // Passenger reaction and comfort monitor
      if (passengerManagerRef.current) {
        const pm = passengerManagerRef.current;
        const isHardBraking = controls.brake > 0.8 && telemetry.speedKmH > 35;
        const overspeedingGhat = selectedRoute.terrain === 'ghat' && telemetry.speedKmH > 65;

        pm.updateDrivingComfort(0.03, {
          speedKmH: telemetry.speedKmH,
          isHardBraking,
          collided: false,
          overspeedingGhat
        });

        setPassengerReactions([...pm.reactions]);
        setSatisfaction(pm.getAverageSatisfaction());
      }

      // Check trip completion (target distance reached e.g. 1,600 simulated meters)
      if (telemetry.distanceCoveredMeters > 1600 && !completedTripSummary) {
        const earnedBase = selectedRoute.rewardCoins;
        const earnedBonus = Math.round(satisfaction * 5);
        const distKm = selectedRoute.distanceKm;
        const currentPaxCount = passengerManagerRef.current ? passengerManagerRef.current.onboardPassengers.length : 30;

        storageService.recordTripCompleted({
          distanceKm: distKm,
          passengers: currentPaxCount,
          earnedCoins: earnedBase + earnedBonus,
          busId: selectedBus.id,
          damageIncurred: 2,
          fuelUsed: Math.round(telemetry.fuelCapacity - telemetry.fuelLiters)
        });

        setStats(storageService.loadStats());

        setCompletedTripSummary({
          distanceKm: distKm,
          passengers: currentPaxCount,
          score: Math.min(100, Math.round(satisfaction)),
          baseReward: earnedBase,
          bonusReward: earnedBonus
        });

        setActiveModal('trip_completed');
      }
    },
    [completedTripSummary, controls.brake, satisfaction, selectedBus.id, selectedRoute]
  );

  // Collision callback
  const handleCollision = useCallback(() => {
    setBusHealth((prev) => Math.max(10, prev - 8));
    if (passengerManagerRef.current) {
      passengerManagerRef.current.updateDrivingComfort(0.1, {
        speedKmH,
        isHardBraking: true,
        collided: true,
        overspeedingGhat: false
      });
      setPassengerReactions([...passengerManagerRef.current.reactions]);
      setSatisfaction(passengerManagerRef.current.getAverageSatisfaction());
    }
  }, [speedKmH]);

  // Board and disembark passengers at bus stop
  const handleBoardPassengers = () => {
    if (!passengerManagerRef.current) return;
    const pm = passengerManagerRef.current;

    // 1. Disembark arriving passengers and collect tip
    const disembarkResult = pm.disembarkPassengersAtStop();

    // 2. Board waiting passengers and collect fares
    const boardResult = pm.boardAtBusStop(selectedBus.passengerCapacity);

    // Update wallet with fares and tips
    const totalNewIncome = boardResult.earnedFares + disembarkResult.tipBonus;
    if (totalNewIncome > 0) {
      storageService.addCoins(totalNewIncome);
      setStats(storageService.loadStats());
    }

    // Sync state
    setOnboardPassengerList([...pm.onboardPassengers]);
    setPassengerReactions([...pm.reactions]);
    setSatisfaction(pm.getAverageSatisfaction());
    setCurrentBusStopName(pm.getCurrentStopName());
    setNextBusStopName(pm.getNextStopName());
  };

  // Roadside Petrol Pump Refueling Action
  const handleExecuteRefuel = (liters: number, cost: number) => {
    if (storageService.deductCoins(cost)) {
      setStats(storageService.loadStats());
      setRefuelLitersToAdd(liters);
      setFuelLiters((prev) => Math.min(fuelCapacity, prev + liters));
      // Save in persistent stats
      const loaded = storageService.loadStats();
      loaded.busFuel[selectedBus.id] = Math.min(fuelCapacity, (loaded.busFuel[selectedBus.id] || fuelCapacity) + liters);
      storageService.saveStats(loaded);
    }
  };

  // Bus Showroom unlock/select
  const handleUnlockBus = (busId: string, cost: number) => {
    if (storageService.unlockBus(busId, cost)) {
      setStats(storageService.loadStats());
      setSelectedBusId(busId);
      audioService.playChime();
    }
  };

  const handleSelectBus = (busId: string) => {
    setSelectedBusId(busId);
    setActiveModal(null);
  };

  // Driver Showroom unlock/select
  const handleUnlockDriver = (driverId: string, cost: number) => {
    if (storageService.unlockDriver(driverId, cost)) {
      setStats(storageService.loadStats());
      setSelectedDriverId(driverId);
      audioService.playChime();
    }
  };

  const handleSelectDriver = (driverId: string) => {
    setSelectedDriverId(driverId);
    setActiveModal(null);
  };

  // Garage maintenance
  const handleRepairBus = (cost: number) => {
    if (storageService.repairBus(selectedBus.id, cost)) {
      setBusHealth(100);
      setStats(storageService.loadStats());
      audioService.playChime();
    }
  };

  const handleRefuelBusFromGarage = (cost: number, liters: number) => {
    if (storageService.refuelBus(selectedBus.id, liters, cost)) {
      setFuelLiters(liters);
      setStats(storageService.loadStats());
      audioService.playChime();
    }
  };

  const handleUpgradeBus = (part: 'engine' | 'brakes' | 'suspension', cost: number) => {
    if (storageService.upgradeBusPart(selectedBus.id, part, cost)) {
      setStats(storageService.loadStats());
      audioService.playChime();
    }
  };

  // Daily Rewards Claim
  const handleClaimDailyReward = (coinsToAdd: number) => {
    const updated = storageService.loadStats();
    updated.coins += coinsToAdd;
    updated.lastDailyRewardClaimDate = new Date().toDateString();
    updated.consecutiveLoginDays = (updated.consecutiveLoginDays || 0) + 1;
    storageService.saveStats(updated);
    setStats(updated);
  };

  // Multiplayer join room
  const handleJoinMultiplayerRoom = (room: { name: string; route: string }) => {
    setActiveModal(null);
    const matchingRoute = INDIAN_ROUTES.find((r) => r.name.toLowerCase().includes(room.route.toLowerCase())) || selectedRoute;
    setSelectedRoute(matchingRoute);
    handleStartGame('multiplayer');
  };

  // Post-trip claim and return
  const handleClaimTripFinished = () => {
    setCompletedTripSummary(null);
    setActiveModal(null);
    setScreen('menu');
  };

  return (
    <div className={`w-full font-sans ${screen === 'driving' ? 'fixed inset-0 h-full overflow-hidden select-none bg-black' : 'min-h-screen bg-neutral-950 text-white'}`}>
      {/* 1. Main Menu View */}
      {screen === 'menu' && (
        <MainMenu
          stats={stats}
          selectedBus={selectedBus}
          selectedDriver={selectedDriver}
          selectedRoute={selectedRoute}
          onStartGame={handleStartGame}
          onOpenBusShowroom={() => setActiveModal('showroom')}
          onOpenDriverShowroom={() => setActiveModal('drivers')}
          onOpenGarage={() => setActiveModal('garage')}
          onOpenMap={() => setActiveModal('map')}
          onOpenDailyRewards={() => setActiveModal('daily')}
          onOpenMultiplayer={() => setActiveModal('multiplayer')}
          onOpenSettings={() => setActiveModal('settings')}
        />
      )}

      {/* 2. Loading Screen */}
      {screen === 'loading' && (
        <LoadingScreen onLoaded={handleLoaded} routeName={selectedRoute.name} />
      )}

      {/* 3. 3D Driving Gameplay Canvas and HUD */}
      {screen === 'driving' && (
        <>
          <GameCanvas
            busConfig={selectedBus}
            route={selectedRoute}
            weather={weather}
            timeOfDay={timeOfDay}
            graphicsQuality={graphicsQuality}
            cameraView={cameraView}
            controls={controls}
            initialFuel={fuelLiters}
            passengerCount={onboardPassengerList.length}
            driverEcoBonus={driverEcoBonus}
            refuelLitersToAdd={refuelLitersToAdd}
            onTripTelemetry={handleTripTelemetry}
            onCollision={handleCollision}
          />

          <HUD
            route={selectedRoute}
            controls={controls}
            onUpdateControls={setControls}
            speedKmH={speedKmH}
            gearNumber={gearNumber}
            fuelLiters={fuelLiters}
            fuelCapacity={fuelCapacity}
            estimatedRangeKm={estimatedRangeKm}
            consumptionRateLPer100Km={consumptionRateLPer100Km}
            isLowFuel={isLowFuel}
            healthPercent={busHealth}
            coins={stats.coins}
            passengers={onboardPassengerList.length}
            passengerCapacity={selectedBus.passengerCapacity}
            satisfaction={satisfaction}
            isAtBusStop={isAtBusStop}
            currentBusStopName={currentBusStopName || selectedRoute.originCity}
            nextBusStopName={nextBusStopName || selectedRoute.destinationCity}
            isNearFuelStation={isNearFuelStation}
            currentFuelStation={currentFuelStation}
            trafficDensity={trafficDensity}
            activeTrafficCount={activeTrafficCount}
            passengerReactions={passengerReactions}
            onboardPassengerList={onboardPassengerList}
            cameraView={cameraView}
            controlType={controlType}
            onChangeCamera={handleChangeCamera}
            onPause={() => setActiveModal('pause')}
            onBoardPassengers={handleBoardPassengers}
            onOpenRefuelModal={() => setActiveModal('refuel')}
          />
        </>
      )}

      {/* MODALS */}

      {/* Roadside Fuel Station Refuel Modal */}
      {activeModal === 'refuel' && currentFuelStation && (
        <RefuelModal
          station={currentFuelStation}
          currentFuel={fuelLiters}
          fuelCapacity={fuelCapacity}
          coins={stats.coins}
          onRefuel={handleExecuteRefuel}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* Bus Showroom Modal */}
      {activeModal === 'showroom' && (
        <BusShowroom
          buses={INITIAL_BUSES}
          unlockedBusIds={stats.unlockedBusIds}
          selectedBusId={selectedBusId}
          coins={stats.coins}
          onSelectBus={handleSelectBus}
          onUnlockBus={handleUnlockBus}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* Driver Showroom Modal */}
      {activeModal === 'drivers' && (
        <DriverShowroom
          drivers={INITIAL_DRIVERS}
          unlockedDriverIds={stats.unlockedDriverIds}
          selectedDriverId={selectedDriverId}
          coins={stats.coins}
          onSelectDriver={handleSelectDriver}
          onUnlockDriver={handleUnlockDriver}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* Garage / Workshop Modal */}
      {activeModal === 'garage' && (
        <GarageModal
          bus={selectedBus}
          damagePercent={100 - busHealth}
          fuelLiters={fuelLiters}
          coins={stats.coins}
          upgrades={stats.busUpgrades[selectedBus.id] || { engine: 0, brakes: 0, suspension: 0 }}
          onRepair={handleRepairBus}
          onRefuel={handleRefuelBusFromGarage}
          onUpgrade={handleUpgradeBus}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* Indian Routes / Map Selector Modal */}
      {activeModal === 'map' && (
        <MapSelector
          routes={INDIAN_ROUTES}
          selectedRouteId={selectedRoute.id}
          onSelectRoute={(r) => {
            setSelectedRoute(r);
            setActiveModal(null);
          }}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* Daily Login Rewards Modal */}
      {activeModal === 'daily' && (
        <DailyRewardsModal
          consecutiveDays={stats.consecutiveLoginDays || 0}
          lastClaimDate={stats.lastDailyRewardClaimDate || ''}
          onClaim={handleClaimDailyReward}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* Multiplayer Lobbies Modal */}
      {activeModal === 'multiplayer' && (
        <MultiplayerModal
          onJoinRoom={handleJoinMultiplayerRoom}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* Game Settings Modal */}
      {activeModal === 'settings' && (
        <SettingsModal
          graphicsQuality={graphicsQuality}
          controlType={controlType}
          onChangeGraphics={setGraphicsQuality}
          onChangeControl={setControlType}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* Pause Menu Modal */}
      {activeModal === 'pause' && (
        <PauseModal
          onResume={() => setActiveModal(null)}
          onRestart={() => {
            setActiveModal(null);
            handleStartGame(gameMode);
          }}
          onOpenSettings={() => setActiveModal('settings')}
          onExit={() => {
            audioService.stopEngine();
            audioService.stopIndicator();
            setActiveModal(null);
            setScreen('menu');
          }}
        />
      )}

      {/* Trip Completed Rewards Modal */}
      {activeModal === 'trip_completed' && completedTripSummary && (
        <TripCompletedModal
          route={selectedRoute}
          distanceKm={completedTripSummary.distanceKm}
          passengers={completedTripSummary.passengers}
          satisfaction={satisfaction}
          score={completedTripSummary.score}
          baseReward={completedTripSummary.baseReward}
          safeDrivingBonus={completedTripSummary.bonusReward}
          onClaim={handleClaimTripFinished}
        />
      )}
    </div>
  );
}
