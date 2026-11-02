import * as THREE from 'three';
import { IndianRoute, TimeOfDay, TrafficDensityLevel, TrafficVehicle } from '../types/game';

export interface TrafficManager {
  vehicles: TrafficVehicle[];
  currentDensity: TrafficDensityLevel;
  activeCount: number;
  update: (delta: number, playerZ: number, playerX: number) => { collided: boolean; collisionSpeed: number };
  setConditions: (timeOfDay: TimeOfDay, terrain: IndianRoute['terrain']) => void;
  dispose: () => void;
}

export function createTrafficSystem(
  scene: THREE.Scene,
  initialTime: TimeOfDay = 'noon',
  initialTerrain: IndianRoute['terrain'] = 'highway'
): TrafficManager {
  const MAX_POOL = 18;
  const trafficVehicles: TrafficVehicle[] = [];
  const vehicleMeshes: THREE.Group[] = [];
  let targetActiveCount = 10;
  let currentActiveCount = 10;
  let currentDensityLevel: TrafficDensityLevel = 'medium';

  // 1. Auto-Rickshaw 3D Model (Bajaj RE 3-wheeler)
  function createAutoRickshawMesh(): THREE.Group {
    const rickshaw = new THREE.Group();

    // Yellow & Green Body
    const lowerBody = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.7, 2.6),
      new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.5 }) // green base
    );
    lowerBody.position.y = 0.55;
    rickshaw.add(lowerBody);

    const upperCanopy = new THREE.Mesh(
      new THREE.BoxGeometry(1.35, 0.9, 2.2),
      new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 }) // yellow roof
    );
    upperCanopy.position.set(0, 1.25, -0.1);
    rickshaw.add(upperCanopy);

    // Front single wheel
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.9 });
    const fWheel = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.15, 12), wheelMat);
    fWheel.rotateZ(Math.PI / 2);
    fWheel.position.set(0, 0.24, 1.1);
    rickshaw.add(fWheel);

    // Rear twin wheels
    [-0.65, 0.65].forEach((xPos) => {
      const rw = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.15, 12), wheelMat);
      rw.rotateZ(Math.PI / 2);
      rw.position.set(xPos, 0.24, -0.8);
      rickshaw.add(rw);
    });

    // Headlight
    const headlight = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xfef08a })
    );
    headlight.position.set(0, 0.75, 1.3);
    rickshaw.add(headlight);

    return rickshaw;
  }

  // 2. Indian Tata Truck 3D Model with Cargo Tarpaulin
  function createIndianTruckMesh(): THREE.Group {
    const truck = new THREE.Group();

    // Cabin
    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(2.3, 2.4, 2.2),
      new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.5 })
    );
    cabin.position.set(0, 1.6, 2.4);
    cabin.castShadow = true;
    truck.add(cabin);

    // Windshield
    const windshield = new THREE.Mesh(
      new THREE.PlaneGeometry(1.9, 0.8),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    windshield.position.set(0, 2.1, 3.51);
    truck.add(windshield);

    // Cargo Bed with Blue Tarpaulin
    const cargoBed = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 1.8, 5.2),
      new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.7 })
    );
    cargoBed.position.set(0, 1.6, -1.4);
    cargoBed.castShadow = true;
    truck.add(cargoBed);

    // Wheels
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
    const wheelGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.32, 12);
    wheelGeo.rotateZ(Math.PI / 2);

    [-1.2, 1.2].forEach((xPos) => {
      const wf = new THREE.Mesh(wheelGeo, wheelMat);
      wf.position.set(xPos, 0.48, 2.4);
      truck.add(wf);

      const wr1 = new THREE.Mesh(wheelGeo, wheelMat);
      wr1.position.set(xPos, 0.48, -1.2);
      truck.add(wr1);

      const wr2 = new THREE.Mesh(wheelGeo, wheelMat);
      wr2.position.set(xPos, 0.48, -2.4);
      truck.add(wr2);
    });

    // Rear "HORN PLEASE" signage
    const rearCanvas = document.createElement('canvas');
    rearCanvas.width = 256;
    rearCanvas.height = 128;
    const rCtx = rearCanvas.getContext('2d');
    if (rCtx) {
      rCtx.fillStyle = '#facc15';
      rCtx.fillRect(0, 0, 256, 128);
      rCtx.fillStyle = '#dc2626';
      rCtx.font = 'bold 30px sans-serif';
      rCtx.textAlign = 'center';
      rCtx.fillText('HORN PLEASE', 128, 64);
    }
    const rTex = new THREE.CanvasTexture(rearCanvas);
    const rPlate = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.7), new THREE.MeshBasicMaterial({ map: rTex }));
    rPlate.position.set(0, 1.2, -4.01);
    rPlate.rotation.y = Math.PI;
    truck.add(rPlate);

    return truck;
  }

  // 3. Indian Car (Sedan / Hatchback)
  function createCarMesh(): THREE.Group {
    const car = new THREE.Group();

    const carBody = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 0.75, 4.2),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25, metalness: 0.3 })
    );
    carBody.position.y = 0.55;
    carBody.castShadow = true;
    car.add(carBody);

    const carRoof = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.65, 2.2),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2, metalness: 0.5 })
    );
    carRoof.position.set(0, 1.15, -0.2);
    car.add(carRoof);

    // Wheels
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.9 });
    const wheelGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.22, 12);
    wheelGeo.rotateZ(Math.PI / 2);

    [-0.95, 0.95].forEach((xPos) => {
      const wf = new THREE.Mesh(wheelGeo, wheelMat);
      wf.position.set(xPos, 0.3, 1.3);
      car.add(wf);

      const wr = new THREE.Mesh(wheelGeo, wheelMat);
      wr.position.set(xPos, 0.3, -1.3);
      car.add(wr);
    });

    return car;
  }

  // 4. Indian Rural Tractor with Trailer
  function createTractorMesh(): THREE.Group {
    const tractor = new THREE.Group();

    // Red Tractor Hood Engine
    const hood = new THREE.Mesh(
      new THREE.BoxGeometry(1.3, 1.1, 2.2),
      new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.6 })
    );
    hood.position.set(0, 1.1, 1.2);
    tractor.add(hood);

    // Chimney Exhaust Pipe
    const pipe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 1.2),
      new THREE.MeshStandardMaterial({ color: 0x18181b })
    );
    pipe.position.set(0.45, 1.9, 1.5);
    tractor.add(pipe);

    // Small Front Wheels
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.9 });
    [-0.75, 0.75].forEach((x) => {
      const fw = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.22, 12), wheelMat);
      fw.rotateZ(Math.PI / 2);
      fw.position.set(x, 0.32, 1.9);
      tractor.add(fw);
    });

    // Massive Ribbed Rear Wheels
    [-0.85, 0.85].forEach((x) => {
      const rw = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.35, 16), wheelMat);
      rw.rotateZ(Math.PI / 2);
      rw.position.set(x, 0.72, 0.2);
      tractor.add(rw);
    });

    // Wooden/Steel Agricultural Trailer
    const trailer = new THREE.Mesh(
      new THREE.BoxGeometry(2.1, 1.0, 3.4),
      new THREE.MeshStandardMaterial({ color: 0x713f12, roughness: 0.8 })
    );
    trailer.position.set(0, 1.0, -2.6);
    trailer.castShadow = true;
    tractor.add(trailer);

    // Trailer Wheels
    [-1.1, 1.1].forEach((x) => {
      const tw = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.25, 12), wheelMat);
      tw.rotateZ(Math.PI / 2);
      tw.position.set(x, 0.42, -2.6);
      tractor.add(tw);
    });

    return tractor;
  }

  const lanes = [-3.8, -1.3, 2.2, 4.6];

  // Initialize pool of MAX_POOL (18) vehicles
  for (let i = 0; i < MAX_POOL; i++) {
    const typeRoll = Math.random();
    let type: 'truck' | 'autorickshaw' | 'car' | 'bike';
    let mesh: THREE.Group;
    let baseSpeed: number;

    if (typeRoll < 0.3) {
      type = 'truck';
      mesh = createIndianTruckMesh();
      baseSpeed = 40 + Math.random() * 12; // km/h
    } else if (typeRoll < 0.55) {
      type = 'autorickshaw';
      mesh = createAutoRickshawMesh();
      baseSpeed = 32 + Math.random() * 14;
    } else if (typeRoll < 0.85) {
      type = 'car';
      mesh = createCarMesh();
      baseSpeed = 60 + Math.random() * 25;
    } else {
      type = 'truck'; // tractor variant
      mesh = createTractorMesh();
      baseSpeed = 26 + Math.random() * 10;
    }

    const laneIndex = i % lanes.length;
    const initialLaneX = lanes[laneIndex];
    const initialZ = 35 + i * 35;

    mesh.position.set(initialLaneX, 0, initialZ);
    mesh.visible = i < currentActiveCount;
    scene.add(mesh);
    vehicleMeshes.push(mesh);

    trafficVehicles.push({
      id: i,
      type,
      x: initialLaneX,
      z: initialZ,
      speed: baseSpeed / 3.6,
      lane: laneIndex,
      targetSpeed: baseSpeed / 3.6,
      meshIndex: i,
      color: '#fff'
    });
  }

  // Calculate dynamic density targets based on time of day and road terrain
  function computeTargetDensity(time: TimeOfDay, terrain: IndianRoute['terrain']): { target: number; density: TrafficDensityLevel } {
    let base = 10;
    let level: TrafficDensityLevel = 'medium';

    if (time === 'morning') {
      // Morning rush hour (office, markets, schools)
      base = 15;
      level = 'rush_hour';
    } else if (time === 'evening') {
      // Evening peak traffic (intercity buses, evening commuters)
      base = 16;
      level = 'rush_hour';
    } else if (time === 'night') {
      // Late night: open roads, low traffic density (long-haul trucks)
      base = 5;
      level = 'low';
    } else {
      // Noon
      base = 10;
      level = 'medium';
    }

    // Terrain modifier
    if (terrain === 'ghat' || terrain === 'snow_mountain') {
      // Narrow ghat curves reduce safe traffic volume
      base = Math.max(4, Math.round(base * 0.65));
      if (level === 'rush_hour') level = 'high';
    } else if (terrain === 'highway') {
      // Expressways hold more vehicles
      base = Math.min(MAX_POOL, Math.round(base * 1.15));
    } else if (terrain === 'village') {
      base = Math.round(base * 0.8);
    }

    return { target: Math.min(MAX_POOL, Math.max(3, base)), density: level };
  }

  const initialCalc = computeTargetDensity(initialTime, initialTerrain);
  targetActiveCount = initialCalc.target;
  currentDensityLevel = initialCalc.density;

  return {
    vehicles: trafficVehicles,
    currentDensity: currentDensityLevel,
    activeCount: currentActiveCount,
    setConditions: (timeOfDay: TimeOfDay, terrain: IndianRoute['terrain']) => {
      const res = computeTargetDensity(timeOfDay, terrain);
      targetActiveCount = res.target;
      currentDensityLevel = res.density;
    },
    update: (delta: number, playerZ: number, playerX: number) => {
      let collided = false;
      let collisionSpeed = 0;

      // Smooth density transition: smoothly increase or retire active vehicles
      if (Math.abs(currentActiveCount - targetActiveCount) > 0.05) {
        currentActiveCount += Math.sign(targetActiveCount - currentActiveCount) * delta * 2.5;
      }

      const effectiveActiveInt = Math.round(currentActiveCount);

      for (let i = 0; i < MAX_POOL; i++) {
        const v = trafficVehicles[i];
        const mesh = vehicleMeshes[v.meshIndex];

        const isActive = i < effectiveActiveInt;
        mesh.visible = isActive;

        if (!isActive) {
          // Park idle vehicles far outside view
          v.z = playerZ - 300;
          continue;
        }

        // Intelligent convoy spacing: check if any vehicle is ahead in the same lane
        let vehicleAheadDistance = Infinity;
        for (let j = 0; j < MAX_POOL; j++) {
          if (i === j || j >= effectiveActiveInt) continue;
          const other = trafficVehicles[j];
          if (Math.abs(other.x - v.x) < 1.4 && other.z > v.z) {
            const dist = other.z - v.z;
            if (dist < vehicleAheadDistance) {
              vehicleAheadDistance = dist;
            }
          }
        }

        // Brake if approaching vehicle ahead too closely
        if (vehicleAheadDistance < 14) {
          v.speed = Math.max(2, v.speed - delta * 4.5);
        } else {
          // Accelerate back to target cruising speed
          v.speed = THREE.MathUtils.damp(v.speed, v.targetSpeed, 2, delta);
        }

        // Advance along highway
        v.z += v.speed * delta;
        mesh.position.z = v.z;
        mesh.position.x = v.x;

        // Recycle vehicles smoothly when they pass out of range
        if (v.z < playerZ - 70) {
          // Respawn ahead
          v.z = playerZ + 240 + Math.random() * 90;
          v.x = lanes[Math.floor(Math.random() * lanes.length)];
        } else if (v.z > playerZ + 420) {
          v.z = playerZ - 50;
          v.x = lanes[Math.floor(Math.random() * lanes.length)];
        }

        // Check collision with player bus
        const dx = Math.abs(v.x - playerX);
        const dz = Math.abs(v.z - playerZ);

        if (dx < 2.2 && dz < 7.0) {
          collided = true;
          collisionSpeed = Math.abs(v.speed);
          v.z += 2.5; // push forward
        }
      }

      return { collided, collisionSpeed };
    },
    dispose: () => {
      vehicleMeshes.forEach((mesh) => {
        scene.remove(mesh);
      });
      vehicleMeshes.length = 0;
      trafficVehicles.length = 0;
    }
  };
}
