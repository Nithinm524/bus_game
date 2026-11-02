import { PlayerStats } from '../types/game';

const STORAGE_KEY = 'bharat_bus_simulator_save_v1';

const DEFAULT_STATS: PlayerStats = {
  coins: 5000, // Starter funds
  playerLevel: 1,
  xp: 0,
  totalDistanceKm: 0,
  totalTripsCompleted: 0,
  totalPassengersTransported: 0,
  selectedBusId: 'ksrtc_airavat',
  selectedDriverId: 'raju_anna',
  unlockedBusIds: ['ksrtc_airavat'],
  unlockedDriverIds: ['raju_anna'],
  lastDailyRewardClaimDate: '',
  consecutiveLoginDays: 0,
  busUpgrades: {
    ksrtc_airavat: { engine: 0, brakes: 0, suspension: 0 }
  },
  busDamage: {
    ksrtc_airavat: 0
  },
  busFuel: {
    ksrtc_airavat: 280
  }
};

export const storageService = {
  loadStats(): PlayerStats {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULT_STATS };
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_STATS, ...parsed };
    } catch {
      return { ...DEFAULT_STATS };
    }
  },

  saveStats(stats: PlayerStats) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    } catch {
      // ignore
    }
  },

  addCoins(amount: number): number {
    const stats = this.loadStats();
    stats.coins = Math.max(0, stats.coins + amount);
    this.saveStats(stats);
    return stats.coins;
  },

  deductCoins(amount: number): boolean {
    const stats = this.loadStats();
    if (stats.coins < amount) return false;
    stats.coins -= amount;
    this.saveStats(stats);
    return true;
  },

  unlockBus(busId: string, cost: number): boolean {
    const stats = this.loadStats();
    if (stats.unlockedBusIds.includes(busId)) return true;
    if (stats.coins < cost) return false;
    stats.coins -= cost;
    stats.unlockedBusIds.push(busId);
    stats.selectedBusId = busId;
    if (!stats.busUpgrades[busId]) {
      stats.busUpgrades[busId] = { engine: 0, brakes: 0, suspension: 0 };
    }
    this.saveStats(stats);
    return true;
  },

  unlockDriver(driverId: string, cost: number): boolean {
    const stats = this.loadStats();
    if (stats.unlockedDriverIds.includes(driverId)) return true;
    if (stats.coins < cost) return false;
    stats.coins -= cost;
    stats.unlockedDriverIds.push(driverId);
    stats.selectedDriverId = driverId;
    this.saveStats(stats);
    return true;
  },

  upgradeBusPart(busId: string, part: 'engine' | 'brakes' | 'suspension', cost: number): boolean {
    const stats = this.loadStats();
    if (stats.coins < cost) return false;
    stats.coins -= cost;
    if (!stats.busUpgrades[busId]) {
      stats.busUpgrades[busId] = { engine: 0, brakes: 0, suspension: 0 };
    }
    stats.busUpgrades[busId][part] = Math.min(5, (stats.busUpgrades[busId][part] || 0) + 1);
    this.saveStats(stats);
    return true;
  },

  recordTripCompleted(params: {
    distanceKm: number;
    passengers: number;
    earnedCoins: number;
    busId: string;
    damageIncurred: number;
    fuelUsed: number;
  }) {
    const stats = this.loadStats();
    stats.coins += params.earnedCoins;
    stats.totalDistanceKm += Math.round(params.distanceKm);
    stats.totalTripsCompleted += 1;
    stats.totalPassengersTransported += params.passengers;
    stats.xp += Math.round(params.distanceKm * 10 + params.passengers * 5);

    // Level formula: Level = Math.floor(Math.sqrt(xp / 100)) + 1
    stats.playerLevel = Math.max(1, Math.floor(Math.sqrt(stats.xp / 100)) + 1);

    // Apply damage and fuel
    stats.busDamage[params.busId] = Math.min(100, (stats.busDamage[params.busId] || 0) + params.damageIncurred);
    const curFuel = stats.busFuel[params.busId] ?? 200;
    stats.busFuel[params.busId] = Math.max(10, curFuel - params.fuelUsed);

    this.saveStats(stats);
    return stats;
  },

  repairBus(busId: string, cost: number): boolean {
    const stats = this.loadStats();
    if (stats.coins < cost) return false;
    stats.coins -= cost;
    stats.busDamage[busId] = 0;
    this.saveStats(stats);
    return true;
  },

  refuelBus(busId: string, fuelLiters: number, cost: number): boolean {
    const stats = this.loadStats();
    if (stats.coins < cost) return false;
    stats.coins -= cost;
    stats.busFuel[busId] = fuelLiters;
    this.saveStats(stats);
    return true;
  }
};
