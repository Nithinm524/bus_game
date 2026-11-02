export type GameMode = 'free_drive' | 'career' | 'tour' | 'multiplayer' | 'challenge';

export type WeatherType = 'sunny' | 'rainy' | 'heavy_rain' | 'snow' | 'foggy' | 'desert';

export type TimeOfDay = 'morning' | 'noon' | 'evening' | 'night';

export type GraphicsQuality = 'low' | 'medium' | 'high' | 'ultra';

export type ControlType = 'wheel' | 'buttons' | 'tilt';

export type CameraView = 'rear' | 'cockpit' | 'front' | 'side' | 'passenger' | 'top' | 'cinematic';

export interface BusConfig {
  id: string;
  name: string;
  category: 'government' | 'private' | 'special';
  operator: string;
  state: string;
  price: number;
  unlocked: boolean;
  topSpeed: number; // km/h
  acceleration: number; // 0-100 rating
  braking: number; // rating
  handling: number; // rating
  fuelCapacity: number; // liters
  passengerCapacity: number;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  liveryStyle: 'ksrtc' | 'tnstc' | 'msrtc' | 'upsrtc' | 'bmtc' | 'sleeper' | 'hrtc' | 'best' | 'electric' | 'vintage';
  description: string;
  features: string[];
}

export interface Driver {
  id: string;
  name: string;
  nativeState: string;
  experience: number; // years
  rating: number; // 1-5
  price: number;
  unlocked: boolean;
  avatarColor: string;
  uniform: string;
  specialAbility: string;
  description: string;
}

export interface IndianRoute {
  id: string;
  name: string;
  region: 'North' | 'South' | 'West' | 'East' | 'Central' | 'Northeast';
  originCity: string;
  destinationCity: string;
  distanceKm: number;
  terrain: 'highway' | 'ghat' | 'snow_mountain' | 'desert' | 'coastal' | 'village';
  estimatedTimeMin: number;
  tollCount: number;
  defaultWeather: WeatherType;
  passengerDemand: number;
  rewardCoins: number;
  scenicHighlights: string[];
}

export interface PlayerStats {
  coins: number;
  playerLevel: number;
  xp: number;
  totalDistanceKm: number;
  totalTripsCompleted: number;
  totalPassengersTransported: number;
  selectedBusId: string;
  selectedDriverId: string;
  unlockedBusIds: string[];
  unlockedDriverIds: string[];
  lastDailyRewardClaimDate: string;
  consecutiveLoginDays: number;
  busUpgrades: Record<string, { engine: number; brakes: number; suspension: number }>;
  busDamage: Record<string, number>; // 0 to 100%
  busFuel: Record<string, number>; // liters
}

export interface TripSession {
  route: IndianRoute;
  mode: GameMode;
  weather: WeatherType;
  timeOfDay: TimeOfDay;
  passengersOnBoard: number;
  passengerCapacity: number;
  passengerSatisfaction: number; // 0 - 100
  distanceTraveledKm: number;
  targetDistanceKm: number;
  currentSpeedKmH: number;
  fuelRemainingL: number;
  busHealthPct: number;
  safeDrivingPoints: number;
  violationsCount: number;
  isCompleted: boolean;
  busStopsReached: number;
  totalBusStops: number;
  isAtBusStop: boolean;
}

export interface VehicleControlState {
  throttle: number; // 0 to 1
  brake: number; // 0 to 1
  steering: number; // -1 to 1
  gear: 'D' | 'N' | 'R';
  gearNumber: number; // 1 to 6
  handbrake: boolean;
  engineOn: boolean;
  headlights: 'off' | 'low' | 'high';
  leftIndicator: boolean;
  rightIndicator: boolean;
  hazardLights: boolean;
  wipers: boolean;
  doorOpen: boolean;
  hornActive: number; // 0 = off, 1 = horn 1, 2 = horn 2, 3 = horn 3
}

export interface TrafficVehicle {
  id: number;
  type: 'truck' | 'autorickshaw' | 'car' | 'bike' | 'bus';
  x: number;
  z: number;
  speed: number;
  lane: number;
  targetSpeed: number;
  meshIndex: number;
  color: string;
}

export interface MultiplayerRoom {
  id: string;
  name: string;
  route: string;
  playersCount: number;
  maxPlayers: number;
  pingMs: number;
  hostName: string;
}

export interface Passenger {
  id: string;
  name: string;
  avatar: string;
  destination: string;
  fare: number;
  happiness: number; // 0 - 100
  joinedAtStop: string;
  isSenior?: boolean;
}

export interface PassengerReaction {
  id: string;
  passengerName: string;
  message: string;
  type: 'complaint' | 'praise' | 'info';
  timestamp: number;
}

export interface FuelStation {
  id: string;
  brand: 'IndianOil' | 'BharatPetroleum' | 'HP';
  name: string;
  pricePerLiter: number;
  zMin: number;
  zMax: number;
}

export interface FuelTelemetry {
  fuelLiters: number;
  fuelCapacity: number;
  consumptionRateLPer100Km: number;
  estimatedRangeKm: number;
  isLowFuel: boolean;
  isNearFuelStation: boolean;
  currentFuelStation?: FuelStation;
}

export type TrafficDensityLevel = 'low' | 'medium' | 'high' | 'rush_hour';

