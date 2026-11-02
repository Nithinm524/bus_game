import { IndianRoute, Passenger, PassengerReaction } from '../types/game';
import { audioService } from '../services/audioService';

const INDIAN_PASSENGER_NAMES = [
  'Aarav Sharma',
  'Ananya Iyer',
  'Rajesh Gowda',
  'Pooja Hegde',
  'Gurpreet Singh',
  'Kavita Reddy',
  'Sanjay Verma',
  'Deepak Patel',
  'Sunita Patil',
  'Vikram Joshi',
  'Meenakshi Sundaram',
  'Arjun Nair',
  'Mohan Lal',
  'Fatima Bi',
  'Ramesh Kumar',
  'Lakshmi Narayanan',
  'Amitabh Sengupta',
  'Preeti Deshmukh',
  'Harpreet Kaur',
  'Karthik Venkat'
];

const COMPLAINT_QUOTES = [
  'Arrey bhai aaram se break lagao, seat se gir jaayenge!',
  'Bhaiya thoda dheere chalao, aage mod hai!',
  'Look where you are driving! Almost had an accident!',
  'Arrey baap re! Itna jhatka mat do!',
  'Driver saab please control the speed in turns!',
  'Accident karwaoge kya?! Help!',
  'Too much shaking, my luggage fell down!'
];

const PRAISE_QUOTES = [
  'Bahut smooth driving hai bhai, shabash!',
  'Time pe pahunchenge lagta hai, excellent ride!',
  'Comfortable cruise captain, very safe feeling!',
  'Badiya chalaya bhai, smooth acceleration!',
  'State transport at its finest, thank you driver!'
];

export class PassengerManager {
  public onboardPassengers: Passenger[] = [];
  public currentStopIndex: number = 0;
  public totalFaresCollected: number = 0;
  public reactions: PassengerReaction[] = [];
  private lastReactionTime: number = 0;
  private smoothDrivingTimer: number = 0;
  private route: IndianRoute;
  private stops: string[] = [];

  constructor(route: IndianRoute, startingPassengerCount: number = 22) {
    this.route = route;
    // Generate 4-6 authentic waypoint stops along the journey
    this.stops = this.generateRouteStops(route);

    // Initial starting passengers who boarded at origin depot
    for (let i = 0; i < startingPassengerCount; i++) {
      const destIndex = Math.floor(Math.random() * (this.stops.length - 1)) + 1;
      const destStop = this.stops[destIndex] || route.destinationCity;
      const fare = 50 + destIndex * 40;
      this.totalFaresCollected += fare;
      this.onboardPassengers.push({
        id: `pax_init_${i}`,
        name: INDIAN_PASSENGER_NAMES[i % INDIAN_PASSENGER_NAMES.length],
        avatar: ['👨', '👩', '👴', '👵', '🧑'][i % 5],
        destination: destStop,
        fare,
        happiness: 95,
        joinedAtStop: route.originCity,
        isSenior: i % 4 === 0
      });
    }
  }

  private generateRouteStops(route: IndianRoute): string[] {
    const stops = [route.originCity];
    if (route.id.includes('bengaluru')) {
      stops.push('Kengeri Bus Terminal', 'Ramanagara Junction', 'Channapatna Toy Town', 'Mandya City Stand', route.destinationCity);
    } else if (route.id.includes('mumbai')) {
      stops.push('Navi Mumbai Depot', 'Khandala Ghat Stop', 'Lonavala Valley Stand', 'Talegaon Toll Post', route.destinationCity);
    } else if (route.id.includes('manali')) {
      stops.push('Karnal Bypass', 'Chandigarh Sector 43', 'Bilaspur Ghat', 'Kullu Apple Stand', route.destinationCity);
    } else if (route.id.includes('jaipur')) {
      stops.push('Kishangarh Marble Toll', 'Ajmer Dargah Bypass', 'Bhilwara Textile Stop', route.destinationCity);
    } else {
      stops.push(`${route.originCity} Bypass`, 'Highway Midway Dhaba', 'State Border Checkpost', route.destinationCity);
    }
    return stops;
  }

  public getCurrentStopName(): string {
    return this.stops[Math.min(this.stops.length - 1, this.currentStopIndex)];
  }

  public getNextStopName(): string {
    return this.stops[Math.min(this.stops.length - 1, this.currentStopIndex + 1)];
  }

  // Boarding waiting passengers at current bus stop
  public boardAtBusStop(busCapacity: number): { boardedCount: number; earnedFares: number } {
    const freeSeats = Math.max(0, busCapacity - this.onboardPassengers.length);
    if (freeSeats <= 0) {
      this.addReaction('Station Master', 'Bus is at full capacity! No more seats available.', 'info');
      return { boardedCount: 0, earnedFares: 0 };
    }

    const currentStop = this.getCurrentStopName();
    const waitingCount = Math.min(freeSeats, Math.floor(Math.random() * 8) + 4);
    let earned = 0;

    for (let i = 0; i < waitingCount; i++) {
      const nameIndex = Math.floor(Math.random() * INDIAN_PASSENGER_NAMES.length);
      // Choose destination ahead of current stop
      const remainingStops = this.stops.slice(this.currentStopIndex + 1);
      const chosenDest = remainingStops.length > 0 ? remainingStops[Math.floor(Math.random() * remainingStops.length)] : this.route.destinationCity;
      const fare = 60 + Math.floor(Math.random() * 80);
      earned += fare;

      this.onboardPassengers.push({
        id: `pax_${Date.now()}_${i}`,
        name: INDIAN_PASSENGER_NAMES[nameIndex],
        avatar: ['👨', '👩', '👴', '👵', '🧑'][Math.floor(Math.random() * 5)],
        destination: chosenDest,
        fare,
        happiness: 96,
        joinedAtStop: currentStop,
        isSenior: Math.random() < 0.2
      });
    }

    this.totalFaresCollected += earned;
    audioService.playChime();
    this.addReaction(
      'Ticketing Conductor',
      `+${waitingCount} passengers boarded! Collected ₹${earned} in fares.`,
      'info'
    );

    return { boardedCount: waitingCount, earnedFares: earned };
  }

  // Disembark passengers who reached their destination
  public disembarkPassengersAtStop(): { disembarkedCount: number; tipBonus: number } {
    const currentStop = this.getCurrentStopName();
    const alighting: Passenger[] = [];
    const remaining: Passenger[] = [];

    this.onboardPassengers.forEach((pax) => {
      if (pax.destination.toLowerCase() === currentStop.toLowerCase() || this.currentStopIndex >= this.stops.length - 1) {
        alighting.push(pax);
      } else {
        remaining.push(pax);
      }
    });

    this.onboardPassengers = remaining;
    let tipBonus = 0;

    if (alighting.length > 0) {
      // Calculate satisfaction tip bonus
      const avgHappiness = alighting.reduce((sum, p) => sum + p.happiness, 0) / alighting.length;
      if (avgHappiness > 85) {
        tipBonus = Math.round(alighting.length * 15);
      }

      this.addReaction(
        alighting[0].name,
        `Reached ${currentStop}! Thank you captain for the trip!${tipBonus > 0 ? ` (Tip: +₹${tipBonus})` : ''}`,
        'praise'
      );
      audioService.playPassengerPraise();
    }

    // Progress to next route waypoint stop
    this.currentStopIndex = Math.min(this.stops.length - 1, this.currentStopIndex + 1);

    return { disembarkedCount: alighting.length, tipBonus };
  }

  // Driving quality analyzer
  public updateDrivingComfort(
    delta: number,
    telemetry: {
      speedKmH: number;
      isHardBraking: boolean;
      collided: boolean;
      overspeedingGhat: boolean;
    }
  ) {
    const now = Date.now();

    // 1. Collision / Accident Reaction
    if (telemetry.collided && now - this.lastReactionTime > 2500) {
      this.lastReactionTime = now;
      this.smoothDrivingTimer = 0;
      const quote = COMPLAINT_QUOTES[Math.floor(Math.random() * COMPLAINT_QUOTES.length)];
      const randomPax = this.getRandomPassengerName();
      this.addReaction(randomPax, quote, 'complaint');
      audioService.playPassengerGasp();

      // Drop happiness across passengers
      this.onboardPassengers.forEach((p) => {
        p.happiness = Math.max(15, p.happiness - 16);
      });
      return;
    }

    // 2. Hard Emergency Braking Reaction
    if (telemetry.isHardBraking && telemetry.speedKmH > 35 && now - this.lastReactionTime > 4000) {
      this.lastReactionTime = now;
      this.smoothDrivingTimer = 0;
      const quote = 'Arrey bhai aaram se break lagao, seat se gir jaayenge!';
      const randomPax = this.getRandomPassengerName();
      this.addReaction(randomPax, quote, 'complaint');
      audioService.playPassengerGasp();

      this.onboardPassengers.forEach((p) => {
        p.happiness = Math.max(25, p.happiness - 10);
      });
      return;
    }

    // 3. Overspeeding in Ghat curves
    if (telemetry.overspeedingGhat && now - this.lastReactionTime > 5000) {
      this.lastReactionTime = now;
      this.smoothDrivingTimer = 0;
      const quote = 'Bhaiya thoda dheere chalao, ghat road par speed limit 40 hai!';
      const randomPax = this.getRandomPassengerName();
      this.addReaction(randomPax, quote, 'complaint');
      audioService.playPassengerGasp();

      this.onboardPassengers.forEach((p) => {
        p.happiness = Math.max(30, p.happiness - 8);
      });
      return;
    }

    // 4. Smooth steady cruising praise
    if (telemetry.speedKmH > 45 && !telemetry.isHardBraking) {
      this.smoothDrivingTimer += delta;
      if (this.smoothDrivingTimer > 18 && now - this.lastReactionTime > 12000) {
        this.smoothDrivingTimer = 0;
        this.lastReactionTime = now;
        const quote = PRAISE_QUOTES[Math.floor(Math.random() * PRAISE_QUOTES.length)];
        const randomPax = this.getRandomPassengerName();
        this.addReaction(randomPax, quote, 'praise');
        audioService.playPassengerPraise();

        // Increment happiness
        this.onboardPassengers.forEach((p) => {
          p.happiness = Math.min(100, p.happiness + 6);
        });
      }
    } else {
      this.smoothDrivingTimer = Math.max(0, this.smoothDrivingTimer - delta * 0.5);
    }

    // Clear old reactions after 4.5 seconds
    this.reactions = this.reactions.filter((r) => now - r.timestamp < 4500);
  }

  public getAverageSatisfaction(): number {
    if (this.onboardPassengers.length === 0) return 95;
    const total = this.onboardPassengers.reduce((sum, p) => sum + p.happiness, 0);
    return Math.round(total / this.onboardPassengers.length);
  }

  private addReaction(name: string, message: string, type: 'complaint' | 'praise' | 'info') {
    this.reactions.unshift({
      id: `react_${Date.now()}_${Math.random()}`,
      passengerName: name,
      message,
      type,
      timestamp: Date.now()
    });
    // Keep max 3 recent reactions on screen
    if (this.reactions.length > 3) {
      this.reactions.pop();
    }
  }

  private getRandomPassengerName(): string {
    if (this.onboardPassengers.length > 0) {
      const idx = Math.floor(Math.random() * this.onboardPassengers.length);
      return this.onboardPassengers[idx].name;
    }
    return 'Passenger';
  }
}
