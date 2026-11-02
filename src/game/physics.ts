import * as THREE from 'three';
import { BusConfig, VehicleControlState } from '../types/game';
import { BusMeshRefs } from './busModels';
import { audioService } from '../services/audioService';

export interface BusPhysicsState {
  x: number;
  y: number;
  z: number;
  speed: number; // m/s
  speedKmH: number;
  heading: number; // radians
  steeringAngle: number;
  pitch: number;
  roll: number;
  gearNumber: number;
  fuelLiters: number;
  fuelCapacity: number;
  consumptionRateLPer100Km: number;
  estimatedRangeKm: number;
  isLowFuel: boolean;
}

export class BusPhysicsEngine {
  public state: BusPhysicsState;
  private config: BusConfig;
  private maxSteerAngle = 0.52; // ~30 degrees
  private wheelRotation = 0;
  private wiperAngle = 0;
  private wiperDir = 1;
  private doorProgress = 0; // 0 = closed, 1 = open

  constructor(config: BusConfig, initialFuel?: number) {
    this.config = config;
    const startingFuel = initialFuel !== undefined ? initialFuel : config.fuelCapacity;
    this.state = {
      x: 0,
      y: 0,
      z: 0,
      speed: 0,
      speedKmH: 0,
      heading: 0,
      steeringAngle: 0,
      pitch: 0,
      roll: 0,
      gearNumber: 1,
      fuelLiters: startingFuel,
      fuelCapacity: config.fuelCapacity,
      consumptionRateLPer100Km: 28.0,
      estimatedRangeKm: Math.round((startingFuel / 28.0) * 100),
      isLowFuel: (startingFuel / config.fuelCapacity) < 0.15
    };
  }

  public refuel(liters: number) {
    this.state.fuelLiters = Math.min(this.config.fuelCapacity, this.state.fuelLiters + liters);
    this.state.estimatedRangeKm = Math.round((this.state.fuelLiters / Math.max(15, this.state.consumptionRateLPer100Km)) * 100);
    this.state.isLowFuel = (this.state.fuelLiters / this.config.fuelCapacity) < 0.15;
  }

  public update(
    delta: number,
    controls: VehicleControlState,
    busRefs: BusMeshRefs,
    collidedWithTraffic: boolean,
    isWetSurface: boolean,
    passengerCount: number = 20,
    terrain: string = 'highway',
    driverEcoBonus: boolean = false
  ) {
    const maxSpeedMs = (this.config.topSpeed * 1000) / 3600;
    const accelPower = (this.config.acceleration / 100) * 11.0;
    const brakePower = (this.config.braking / 100) * 18.0;

    // 1. Steering Dynamics
    const targetSteer = controls.steering * this.maxSteerAngle;
    this.state.steeringAngle = THREE.MathUtils.damp(this.state.steeringAngle, targetSteer, 8, delta);

    // Front wheels steering visual rotation
    busRefs.frontWheels.forEach((wheel) => {
      wheel.rotation.y = this.state.steeringAngle;
    });
    if (busRefs.steeringWheelMesh) {
      busRefs.steeringWheelMesh.rotation.z = -this.state.steeringAngle * 3.5;
    }

    // 2. Engine and Throttle / Brake
    if (controls.engineOn) {
      if (this.state.fuelLiters <= 0) {
        // Engine ran out of diesel!
        controls.engineOn = false;
        audioService.stopEngine();
      } else {
        if (controls.gear === 'D') {
          if (controls.throttle > 0 && !controls.handbrake) {
            this.state.speed += accelPower * controls.throttle * delta;
          }
        } else if (controls.gear === 'R') {
          if (controls.throttle > 0 && !controls.handbrake) {
            this.state.speed -= accelPower * 0.45 * controls.throttle * delta;
          }
        }

        // --- Realistic Fuel Consumption Model ---
        // 1. Idle burn (when engine is on at stop): ~1.2 L/hr -> 0.00033 L/s
        const idleBurn = 0.00033;
        // 2. Speed aerodynamic drag (quadratic scaling above 60 km/h)
        const speedRatio = Math.max(0, this.state.speedKmH) / 60;
        const aeroFactor = 1.0 + Math.pow(speedRatio, 1.8) * 0.75;
        // 3. Throttle exertion factor (heavy gas burns 2.2x)
        const throttleFactor = 1.0 + controls.throttle * 1.6;
        // 4. Passenger weight load factor (full coach burns up to 30% more)
        const loadRatio = Math.min(1.2, passengerCount / Math.max(1, this.config.passengerCapacity));
        const loadFactor = 1.0 + loadRatio * 0.3;
        // 5. Terrain resistance (ghat/mountain climbs burn 45% more; desert rolling sand burns 20% more)
        const terrainFactor = terrain === 'ghat' || terrain === 'snow_mountain' ? 1.45 : terrain === 'desert' ? 1.2 : 1.0;
        // 6. Driver eco trait bonus (e.g. Raju Anna: 18% fuel savings)
        const driverFactor = driverEcoBonus ? 0.82 : 1.0;

        // Base cruise consumption rate: ~28 Liters per 100km
        const distanceTraveledKmThisFrame = (Math.abs(this.state.speed) * delta) / 1000;
        const dynamicBurnRate = distanceTraveledKmThisFrame * (28.0 / 100) * aeroFactor * throttleFactor * loadFactor * terrainFactor * driverFactor;
        const totalFuelBurn = (idleBurn * delta) + dynamicBurnRate;

        this.state.fuelLiters = Math.max(0, this.state.fuelLiters - totalFuelBurn);

        // Real-time instantaneous / smoothed L/100km calculation
        if (this.state.speedKmH > 6) {
          const instantL100 = (totalFuelBurn / Math.max(0.00001, distanceTraveledKmThisFrame)) * 100;
          this.state.consumptionRateLPer100Km = THREE.MathUtils.damp(
            this.state.consumptionRateLPer100Km,
            Math.min(75, Math.max(18, instantL100)),
            2.5,
            delta
          );
        }

        // Estimated remaining driving range in KM
        this.state.estimatedRangeKm = Math.round(
          (this.state.fuelLiters / Math.max(15, this.state.consumptionRateLPer100Km)) * 100
        );

        const wasLow = this.state.isLowFuel;
        this.state.isLowFuel = (this.state.fuelLiters / this.config.fuelCapacity) <= 0.15;
        if (!wasLow && this.state.isLowFuel) {
          audioService.playLowFuelAlert();
        }
      }
    }

    // Natural drag and friction (higher on wet/snow surfaces)
    const rollingResistance = isWetSurface ? 1.8 : 1.2;
    if (this.state.speed > 0) {
      this.state.speed = Math.max(0, this.state.speed - rollingResistance * delta);
    } else if (this.state.speed < 0) {
      this.state.speed = Math.min(0, this.state.speed + rollingResistance * delta);
    }

    // Foot brake and Handbrake
    if (controls.brake > 0) {
      const brakeForce = brakePower * controls.brake * delta;
      if (this.state.speed > 0) {
        this.state.speed = Math.max(0, this.state.speed - brakeForce);
      } else if (this.state.speed < 0) {
        this.state.speed = Math.min(0, this.state.speed + brakeForce);
      }
    }

    if (controls.handbrake) {
      const handbrakeForce = 22.0 * delta;
      if (this.state.speed > 0) {
        this.state.speed = Math.max(0, this.state.speed - handbrakeForce);
      } else if (this.state.speed < 0) {
        this.state.speed = Math.min(0, this.state.speed + handbrakeForce);
      }
    }

    // Cap at top speed
    this.state.speed = THREE.MathUtils.clamp(this.state.speed, -10, maxSpeedMs);
    this.state.speedKmH = Math.round(Math.abs(this.state.speed) * 3.6);

    // Dynamic Gear calculation for digital display [D 1 .. D 6]
    if (controls.gear === 'D') {
      if (this.state.speedKmH < 20) this.state.gearNumber = 1;
      else if (this.state.speedKmH < 40) this.state.gearNumber = 2;
      else if (this.state.speedKmH < 65) this.state.gearNumber = 3;
      else if (this.state.speedKmH < 85) this.state.gearNumber = 4;
      else if (this.state.speedKmH < 105) this.state.gearNumber = 5;
      else this.state.gearNumber = 6;
    } else if (controls.gear === 'R') {
      this.state.gearNumber = 1;
    } else {
      this.state.gearNumber = 0;
    }

    // Collision with traffic bounce
    if (collidedWithTraffic) {
      this.state.speed *= 0.55;
    }

    // 3. Movement kinematics (turning circle & forward vector)
    const wheelbase = 6.2;
    const turnRadius = this.state.steeringAngle !== 0 ? wheelbase / Math.sin(this.state.steeringAngle) : Infinity;
    if (Math.abs(turnRadius) < 1000) {
      const angularVelocity = this.state.speed / turnRadius;
      this.state.heading += angularVelocity * delta;
    }

    // Road boundary collision / guardrail resistance
    // Road width is ~14m. Center is 0. If bus goes beyond ±6.8m, collision with guardrail/curb
    const roadBoundary = 6.8;
    if (Math.abs(this.state.x) > roadBoundary) {
      this.state.x = Math.sign(this.state.x) * roadBoundary;
      this.state.speed *= 0.75; // scrap curb
    }

    this.state.x += Math.sin(this.state.heading) * this.state.speed * delta;
    this.state.z += Math.cos(this.state.heading) * this.state.speed * delta;

    // 4. Wheels rotation (revolving tires)
    const wheelCircumference = 2 * Math.PI * 0.52;
    const distanceThisFrame = this.state.speed * delta;
    this.wheelRotation += (distanceThisFrame / wheelCircumference) * Math.PI * 2;

    busRefs.frontWheels.forEach((w) => {
      w.children.forEach((child) => {
        child.rotation.x = this.wheelRotation;
      });
    });

    busRefs.rearWheels.forEach((w) => {
      w.children.forEach((child) => {
        child.rotation.x = this.wheelRotation;
      });
    });

    // 5. Suspension Pitch & Roll Dynamics
    const targetPitch = (controls.throttle * 0.03 - controls.brake * 0.05) * (this.state.speed / 20);
    this.state.pitch = THREE.MathUtils.damp(this.state.pitch, targetPitch, 5, delta);

    const targetRoll = -this.state.steeringAngle * (this.state.speed / 18) * 0.2;
    this.state.roll = THREE.MathUtils.damp(this.state.roll, targetRoll, 6, delta);

    // Apply to 3D Bus Group
    busRefs.group.position.set(this.state.x, this.state.y, this.state.z);
    busRefs.group.rotation.y = this.state.heading;
    busRefs.bodyMesh.rotation.x = this.state.pitch;
    busRefs.bodyMesh.rotation.z = this.state.roll;

    // 6. Lights & Spotlights control
    const isHeadlightsOn = controls.headlights !== 'off';
    const isHighBeam = controls.headlights === 'high';
    busRefs.leftSpotlight.visible = isHeadlightsOn;
    busRefs.rightSpotlight.visible = isHeadlightsOn;
    busRefs.leftSpotlight.intensity = isHighBeam ? 25 : 12;
    busRefs.rightSpotlight.intensity = isHighBeam ? 25 : 12;
    busRefs.leftSpotlight.distance = isHighBeam ? 80 : 45;
    busRefs.rightSpotlight.distance = isHighBeam ? 80 : 45;

    // Taillights brighten on brake
    const isBraking = controls.brake > 0.1 || controls.handbrake;
    busRefs.taillightLenses.forEach((lens) => {
      const mat = lens.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = isBraking ? 1.8 : 0.4;
    });

    // 7. Indicators & Hazard lights flashing (2 Hz)
    const blinkOn = Math.floor(Date.now() / 350) % 2 === 0;
    const flashLeft = controls.hazardLights || controls.leftIndicator;
    const flashRight = controls.hazardLights || controls.rightIndicator;

    busRefs.indicatorLensesLeft.forEach((lens) => {
      const mat = lens.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = flashLeft && blinkOn ? 1.5 : 0.05;
    });
    busRefs.indicatorLensesRight.forEach((lens) => {
      const mat = lens.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = flashRight && blinkOn ? 1.5 : 0.05;
    });

    // 8. Windshield Wipers Animation
    if (controls.wipers) {
      this.wiperAngle += this.wiperDir * delta * 4.5;
      if (this.wiperAngle > 1.2) {
        this.wiperAngle = 1.2;
        this.wiperDir = -1;
        audioService.playWiperSweep();
      } else if (this.wiperAngle < 0) {
        this.wiperAngle = 0;
        this.wiperDir = 1;
      }
      busRefs.wipers.forEach((w) => {
        w.rotation.z = this.wiperAngle;
      });
    } else {
      this.wiperAngle = THREE.MathUtils.damp(this.wiperAngle, 0, 8, delta);
      busRefs.wipers.forEach((w) => {
        w.rotation.z = this.wiperAngle;
      });
    }

    // 9. Passenger Door slide open/close
    const targetDoor = controls.doorOpen ? 1 : 0;
    this.doorProgress = THREE.MathUtils.damp(this.doorProgress, targetDoor, 5, delta);
    busRefs.passengerDoor.position.x = 2.6 / 2 + 0.01 - this.doorProgress * 0.15;
    busRefs.passengerDoor.position.z = 12 * 0.35 + this.doorProgress * 0.8;

    // Update audio engine RPM
    audioService.updateEngine(this.state.speedKmH, controls.throttle);
  }

  public resetPosition(z: number = 0) {
    this.state.x = 0;
    this.state.y = 0;
    this.state.z = z;
    this.state.speed = 0;
    this.state.speedKmH = 0;
    this.state.heading = 0;
    this.state.steeringAngle = 0;
  }
}
