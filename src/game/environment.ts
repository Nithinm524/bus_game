import * as THREE from 'three';
import { FuelStation, GraphicsQuality, IndianRoute, WeatherType } from '../types/game';

export interface RoadChunk {
  group: THREE.Group;
  zCenter: number;
  hasBusStop?: boolean;
  hasTollPlaza?: boolean;
  hasFuelStation?: boolean;
  busStopZone?: { zMin: number; zMax: number };
  fuelStationZone?: { zMin: number; zMax: number; station: FuelStation };
}

export interface EnvironmentManager {
  chunks: RoadChunk[];
  update: (playerZ: number) => {
    isAtBusStop: boolean;
    isNearFuelStation: boolean;
    currentFuelStation?: FuelStation;
  };
  setWeather: (weather: WeatherType) => void;
  dispose: () => void;
}

export function createEnvironment(
  scene: THREE.Scene,
  route: IndianRoute,
  weather: WeatherType,
  quality: GraphicsQuality = 'high'
): EnvironmentManager {
  const CHUNK_LENGTH = 160;
  const ROAD_WIDTH = 14;
  const CHUNK_COUNT = 6;

  const chunks: RoadChunk[] = [];
  const roadMaterial = createRealisticRoadMaterial(route.terrain);
  const curbMaterial = createCurbChevronMaterial();
  const guardrailMaterial = new THREE.MeshStandardMaterial({
    color: 0xcccccc,
    metalness: 0.85,
    roughness: 0.25
  });
  const terrainMaterial = createRealisticTerrainMaterial(route.terrain);
  const rockMaterial = new THREE.MeshStandardMaterial({
    color: 0x6b7280,
    roughness: 0.9,
    metalness: 0.1
  });

  // Road geometry with concrete slab width
  const roadGeo = new THREE.PlaneGeometry(ROAD_WIDTH, CHUNK_LENGTH, 2, 8);
  roadGeo.rotateX(-Math.PI / 2);

  // Realistic rolling 3D hillside terrain geometries (Left and Right mountain slopes)
  const segmentsX = quality === 'ultra' ? 24 : quality === 'high' ? 18 : 12;
  const segmentsZ = quality === 'ultra' ? 24 : quality === 'high' ? 18 : 10;
  const leftShoulderGeo = createHillsideGeometry(120, CHUNK_LENGTH, segmentsX, segmentsZ, -1, route.terrain);
  const rightShoulderGeo = createHillsideGeometry(120, CHUNK_LENGTH, segmentsX, segmentsZ, 1, route.terrain);

  // Barrier & Guardrail components
  const barrierBlockGeo = new THREE.BoxGeometry(0.5, 0.65, 2.2);
  const guardrailPostGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.15, 8);
  const guardrailBeamGeo = new THREE.BoxGeometry(0.08, 0.38, CHUNK_LENGTH);

  // Tree and Foliage Geometries
  const pineTrunkGeo = new THREE.CylinderGeometry(0.22, 0.4, 4.0, 8);
  const pineConeGeo1 = new THREE.ConeGeometry(2.4, 3.8, 8);
  const pineConeGeo2 = new THREE.ConeGeometry(1.9, 3.2, 8);
  const pineConeGeo3 = new THREE.ConeGeometry(1.4, 2.6, 8);

  const deciduousTrunkGeo = new THREE.CylinderGeometry(0.3, 0.5, 4.2, 8);
  const deciduousCrownGeo = new THREE.DodecahedronGeometry(2.6, 1);

  const bushGeo = new THREE.DodecahedronGeometry(1.2, 1);

  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3d2714, roughness: 0.95 });
  const pineFoliageMat = new THREE.MeshStandardMaterial({
    color: route.terrain === 'snow_mountain' ? 0x1e3a24 : route.terrain === 'desert' ? 0x4d5b36 : 0x1b4322,
    roughness: 0.85
  });
  const deciduousFoliageMat = new THREE.MeshStandardMaterial({
    color: route.terrain === 'desert' ? 0x657843 : 0x245a2a,
    roughness: 0.8
  });
  const bushMat = new THREE.MeshStandardMaterial({
    color: 0x2d6a33,
    roughness: 0.85
  });

  // Utility Pole components
  const poleGeo = new THREE.CylinderGeometry(0.12, 0.16, 7.5, 8);
  const crossarmGeo = new THREE.BoxGeometry(2.4, 0.12, 0.12);
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.8 });

  // 1. Build Multi-tier Conifer Pine Tree
  function makePineTree(x: number, z: number, scale: number = 1): THREE.Group {
    const tree = new THREE.Group();
    const trunk = new THREE.Mesh(pineTrunkGeo, trunkMat);
    trunk.position.y = 2.0;
    trunk.castShadow = quality !== 'low';
    tree.add(trunk);

    const c1 = new THREE.Mesh(pineConeGeo1, pineFoliageMat);
    c1.position.y = 4.2;
    c1.castShadow = quality !== 'low';
    tree.add(c1);

    const c2 = new THREE.Mesh(pineConeGeo2, pineFoliageMat);
    c2.position.y = 5.8;
    c2.castShadow = quality !== 'low';
    tree.add(c2);

    const c3 = new THREE.Mesh(pineConeGeo3, pineFoliageMat);
    c3.position.y = 7.2;
    c3.castShadow = quality !== 'low';
    tree.add(c3);

    tree.position.set(x, 0, z);
    tree.scale.setScalar(scale * (0.85 + Math.random() * 0.35));
    return tree;
  }

  // 2. Build Leafy Deciduous Indian Tree (Neem / Banyan / Sal)
  function makeDeciduousTree(x: number, z: number, scale: number = 1): THREE.Group {
    const tree = new THREE.Group();
    const trunk = new THREE.Mesh(deciduousTrunkGeo, trunkMat);
    trunk.position.y = 2.1;
    trunk.castShadow = quality !== 'low';
    tree.add(trunk);

    const crown = new THREE.Mesh(deciduousCrownGeo, deciduousFoliageMat);
    crown.position.set(0, 5.2, 0);
    crown.scale.set(1.1, 1.0, 1.2);
    crown.castShadow = quality !== 'low';
    tree.add(crown);

    tree.position.set(x, 0, z);
    tree.scale.setScalar(scale * (0.85 + Math.random() * 0.3));
    return tree;
  }

  // 3. Build Roadside Rocky Boulder
  function makeBoulder(x: number, z: number, scale: number = 1): THREE.Mesh {
    const geo = new THREE.DodecahedronGeometry(1.6 * scale, 1);
    const boulder = new THREE.Mesh(geo, rockMaterial);
    boulder.position.set(x, 0.8 * scale, z);
    boulder.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    boulder.castShadow = quality !== 'low';
    boulder.receiveShadow = true;
    return boulder;
  }

  // 4. Utility Power Poles along Road
  function makeUtilityPole(x: number, z: number): THREE.Group {
    const poleGroup = new THREE.Group();
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = 3.75;
    pole.castShadow = true;
    poleGroup.add(pole);

    const arm1 = new THREE.Mesh(crossarmGeo, poleMat);
    arm1.position.set(0, 7.0, 0);
    poleGroup.add(arm1);

    const arm2 = new THREE.Mesh(crossarmGeo, poleMat);
    arm2.position.set(0, 6.0, 0);
    poleGroup.add(arm2);

    poleGroup.position.set(x, 0, z);
    return poleGroup;
  }

  // Create a single 160m chunk of Indian road and surroundings
  function buildChunk(chunkIndex: number, zCenter: number): RoadChunk {
    const chunkGroup = new THREE.Group();
    chunkGroup.position.z = zCenter;

    // Road surface (slightly elevated by 0.03m to eliminate coplanar z-fighting)
    const road = new THREE.Mesh(roadGeo, roadMaterial);
    road.position.y = 0.03;
    road.receiveShadow = true;
    chunkGroup.add(road);

    // Left and Right elevated rolling mountain hillsides
    const leftTerrain = new THREE.Mesh(leftShoulderGeo, terrainMaterial);
    leftTerrain.position.set(-ROAD_WIDTH / 2 - 60, 0, 0);
    leftTerrain.receiveShadow = true;
    chunkGroup.add(leftTerrain);

    const rightTerrain = new THREE.Mesh(rightShoulderGeo, terrainMaterial);
    rightTerrain.position.set(ROAD_WIDTH / 2 + 60, 0, 0);
    rightTerrain.receiveShadow = true;
    chunkGroup.add(rightTerrain);

    // Chevron black-and-yellow hazard barrier curbs on right side shoulder (matching reference screenshot)
    for (let z = -CHUNK_LENGTH / 2 + 8; z < CHUNK_LENGTH / 2; z += 8.5) {
      const rightCurb = new THREE.Mesh(barrierBlockGeo, curbMaterial);
      rightCurb.position.set(ROAD_WIDTH / 2 + 0.45, 0.32, z);
      rightCurb.receiveShadow = true;
      chunkGroup.add(rightCurb);
    }

    // Steel crash guardrails on cliff side (left side)
    const leftBeam = new THREE.Mesh(guardrailBeamGeo, guardrailMaterial);
    leftBeam.position.set(-ROAD_WIDTH / 2 - 0.45, 0.8, 0);
    chunkGroup.add(leftBeam);

    for (let z = -CHUNK_LENGTH / 2; z <= CHUNK_LENGTH / 2; z += 6) {
      const post = new THREE.Mesh(guardrailPostGeo, guardrailMaterial);
      post.position.set(-ROAD_WIDTH / 2 - 0.45, 0.55, z);
      chunkGroup.add(post);
    }

    // Roadside Streetlights / Utility Poles
    for (let z = -CHUNK_LENGTH / 2 + 10; z < CHUNK_LENGTH / 2; z += 40) {
      chunkGroup.add(makeUtilityPole(ROAD_WIDTH / 2 + 1.6, z));
    }

    // Dense Forest & Hillside Foliage based on graphics quality
    const treeCount = quality === 'ultra' ? 38 : quality === 'high' ? 26 : quality === 'medium' ? 16 : 8;
    for (let i = 0; i < treeCount; i++) {
      const side = Math.random() > 0.5 ? 1 : -1;
      const xDist = ROAD_WIDTH / 2 + 3.5 + Math.random() * 55;
      const x = xDist * side;
      const z = -CHUNK_LENGTH / 2 + Math.random() * CHUNK_LENGTH;
      const elevation = Math.pow((xDist - 7) / 60, 1.35) * 16;

      const isPine = Math.random() > 0.45;
      const tree = isPine ? makePineTree(x, z, 1.1) : makeDeciduousTree(x, z, 1.1);
      tree.position.y = Math.max(0, elevation);
      chunkGroup.add(tree);
    }

    // Roadside Boulders and Cliffs
    const boulderCount = quality === 'ultra' ? 8 : 4;
    for (let i = 0; i < boulderCount; i++) {
      const side = Math.random() > 0.5 ? 1 : -1;
      const x = (ROAD_WIDTH / 2 + 1.5 + Math.random() * 8) * side;
      const z = -CHUNK_LENGTH / 2 + Math.random() * CHUNK_LENGTH;
      chunkGroup.add(makeBoulder(x, z, 0.8 + Math.random() * 0.7));
    }

    // Roadside Bush Clusters
    for (let z = -CHUNK_LENGTH / 2 + 5; z < CHUNK_LENGTH / 2; z += 18) {
      const bush = new THREE.Mesh(bushGeo, bushMat);
      bush.position.set(-ROAD_WIDTH / 2 - 1.2, 0.6, z);
      chunkGroup.add(bush);
    }

    // Indian Highway Milestone Marker (every 80m)
    const mileKm = Math.max(5, Math.round(route.distanceKm - (chunkIndex * 15)));
    const milestone = createMilestoneMarker(mileKm, route.destinationCity);
    milestone.position.set(ROAD_WIDTH / 2 + 1.2, 0, 10);
    chunkGroup.add(milestone);

    // Roadside Indian Village House (on alternate chunks)
    if (chunkIndex % 3 === 1) {
      const house = createIndianVillageHouse();
      house.position.set(-ROAD_WIDTH / 2 - 14, 0, 12);
      chunkGroup.add(house);
    }

    let hasBusStop = false;
    let hasTollPlaza = false;
    let hasFuelStation = false;
    let busStopZone: { zMin: number; zMax: number } | undefined;
    let fuelStationZone: { zMin: number; zMax: number; station: FuelStation } | undefined;

    // Alternating roadside facilities:
    // Every 4th chunk has an authentic Indian Bus Stop or Dhaba
    if (chunkIndex % 4 === 2) {
      hasBusStop = true;
      busStopZone = {
        zMin: zCenter - 15,
        zMax: zCenter + 15
      };

      // Bus shelter structure
      const shelter = createBusShelter(route.originCity);
      shelter.position.set(ROAD_WIDTH / 2 + 2.5, 0, 0);
      chunkGroup.add(shelter);

      // Roadside Dhaba ("SHER-E-PUNJAB DHABA")
      const dhaba = createIndianDhaba();
      dhaba.position.set(-ROAD_WIDTH / 2 - 10, 0, -15);
      chunkGroup.add(dhaba);
    } else if (chunkIndex % 5 === 3) {
      // Highway Petrol Pump Fuel Station (IndianOil / Bharat Petroleum)
      hasFuelStation = true;
      const brand = chunkIndex % 2 === 0 ? 'IndianOil' : 'BharatPetroleum';
      const stationObj: FuelStation = {
        id: `station_${chunkIndex}`,
        brand,
        name: brand === 'IndianOil' ? 'IndianOil Swarna Highway Station' : 'Bharat Petroleum Ghar Highway Point',
        pricePerLiter: 89.5,
        zMin: zCenter - 18,
        zMax: zCenter + 18
      };
      fuelStationZone = {
        zMin: zCenter - 18,
        zMax: zCenter + 18,
        station: stationObj
      };

      const fuelStationMesh = createIndianFuelStation(brand);
      fuelStationMesh.position.set(ROAD_WIDTH / 2 + 8.5, 0, 0);
      chunkGroup.add(fuelStationMesh);
    } else if (chunkIndex % 6 === 5) {
      hasTollPlaza = true;
      const toll = createTollPlaza();
      toll.position.set(0, 0, 0);
      chunkGroup.add(toll);
    }

    scene.add(chunkGroup);

    return {
      group: chunkGroup,
      zCenter,
      hasBusStop,
      hasTollPlaza,
      hasFuelStation,
      busStopZone,
      fuelStationZone
    };
  }

  // Initialize pool of chunks along the Z axis
  for (let i = 0; i < CHUNK_COUNT; i++) {
    const zCenter = i * CHUNK_LENGTH;
    chunks.push(buildChunk(i, zCenter));
  }

  return {
    chunks,
    update: (playerZ: number) => {
      let isAtBusStop = false;
      let isNearFuelStation = false;
      let currentFuelStation: FuelStation | undefined = undefined;

      // Check if player is near any bus stop or fuel station
      for (const chunk of chunks) {
        if (chunk.busStopZone) {
          if (playerZ >= chunk.busStopZone.zMin && playerZ <= chunk.busStopZone.zMax) {
            isAtBusStop = true;
          }
        }
        if (chunk.fuelStationZone) {
          if (playerZ >= chunk.fuelStationZone.zMin && playerZ <= chunk.fuelStationZone.zMax) {
            isNearFuelStation = true;
            currentFuelStation = chunk.fuelStationZone.station;
          }
        }
      }

      // Stream chunks: recycle chunks that are far behind player to the front
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        if (playerZ - chunk.zCenter > CHUNK_LENGTH * 1.5) {
          let maxZ = -Infinity;
          chunks.forEach((c) => {
            if (c.zCenter > maxZ) maxZ = c.zCenter;
          });
          chunk.zCenter = maxZ + CHUNK_LENGTH;
          chunk.group.position.z = chunk.zCenter;

          if (chunk.busStopZone) {
            chunk.busStopZone.zMin = chunk.zCenter - 15;
            chunk.busStopZone.zMax = chunk.zCenter + 15;
          }
          if (chunk.fuelStationZone) {
            chunk.fuelStationZone.zMin = chunk.zCenter - 18;
            chunk.fuelStationZone.zMax = chunk.zCenter + 18;
            chunk.fuelStationZone.station.zMin = chunk.fuelStationZone.zMin;
            chunk.fuelStationZone.station.zMax = chunk.fuelStationZone.zMax;
          }
        }
      }

      return { isAtBusStop, isNearFuelStation, currentFuelStation };
    },
    setWeather: (_weather: WeatherType) => {
      // dynamic adjustments
    },
    dispose: () => {
      chunks.forEach((chunk) => {
        scene.remove(chunk.group);
      });
      chunks.length = 0;
    }
  };
}

// Procedural 3D Hillside Geometry with natural elevation curves
function createHillsideGeometry(
  width: number,
  length: number,
  segmentsX: number,
  segmentsZ: number,
  direction: number, // -1 for left side, 1 for right side
  terrain: string
): THREE.PlaneGeometry {
  const geo = new THREE.PlaneGeometry(width, length, segmentsX, segmentsZ);
  geo.rotateX(-Math.PI / 2);

  const pos = geo.attributes.position as THREE.BufferAttribute;
  const isGhat = terrain === 'ghat' || terrain === 'snow_mountain';

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);

    // Calculate normalized distance from the highway edge (0 at road shoulder, 1 at distant mountain ridge)
    // For left side (direction === -1), local x runs from -width/2 to +width/2. +width/2 touches the road.
    // For right side (direction === 1), local x runs from -width/2 to +width/2. -width/2 touches the road.
    const normalizedDist = direction === -1
      ? (width / 2 - x) / width
      : (x + width / 2) / width;
    const distClamped = Math.max(0, Math.min(1, normalizedDist));

    // Keep flat ground for the first 3 meters near road edge before elevation starts
    const shoulderOffset = Math.max(0, (distClamped - 0.04) / 0.96);
    const hillHeight = isGhat ? 24 : 14;
    const wave = Math.sin(z * 0.04 + x * 0.03) * 3.2 + Math.cos(z * 0.07) * 1.6;

    const y = Math.pow(shoulderOffset, 1.55) * hillHeight + wave * shoulderOffset;
    pos.setY(i, Math.max(0, y));
  }

  geo.computeVertexNormals();
  return geo;
}

// Procedural Realistic Dark Grey Asphalt Highway Texture matching BUSSID reference image
function createRealisticRoadMaterial(_terrain: string): THREE.MeshStandardMaterial {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Rich dark charcoal asphalt base
    ctx.fillStyle = '#22252c';
    ctx.fillRect(0, 0, 1024, 1024);

    // Multi-shade asphalt aggregates and fine gravel grain
    for (let i = 0; i < 45000; i++) {
      const nx = Math.random() * 1024;
      const ny = Math.random() * 1024;
      const grainVal = Math.random();
      if (grainVal > 0.6) {
        ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.08})`;
      } else if (grainVal > 0.3) {
        ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.15})`;
      } else {
        ctx.fillStyle = `rgba(60,65,75,${Math.random() * 0.12})`;
      }
      ctx.fillRect(nx, ny, 2, 2);
    }

    // Realistic dark rubber tire tracks in both lanes
    ctx.fillStyle = 'rgba(12, 14, 18, 0.28)';
    ctx.fillRect(140, 0, 140, 1024);
    ctx.fillRect(340, 0, 140, 1024);
    ctx.fillRect(544, 0, 140, 1024);
    ctx.fillRect(744, 0, 140, 1024);

    // Concrete expansion / asphalt pavement seams every 256px
    ctx.fillStyle = 'rgba(10, 12, 16, 0.4)';
    for (let y = 0; y < 1024; y += 256) {
      ctx.fillRect(0, y, 1024, 3);
    }

    // Solid outer shoulder boundary lines in crisp white
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(50, 0, 18, 1024);
    ctx.fillRect(1024 - 68, 0, 18, 1024);

    // Center Bright Amber Yellow Highway Line (dashed divider)
    ctx.fillStyle = '#fbbf24';
    const dashLength = 160;
    const gapLength = 96;
    for (let y = 0; y < 1024; y += dashLength + gapLength) {
      ctx.fillRect(503, y, 18, dashLength);
    }

    // Reflective road studs (Cat's Eyes / RPMs) along centerline
    ctx.fillStyle = '#fef08a';
    for (let y = 20; y < 1024; y += dashLength + gapLength) {
      ctx.fillRect(507, y, 10, 14);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 8);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;

  return new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.72,
    metalness: 0.08
  });
}

// Procedural Chevron Hazard Barrier Material (Black and Yellow 45° stripes)
function createCurbChevronMaterial(): THREE.MeshStandardMaterial {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#facc15';
    ctx.fillRect(0, 0, 256, 256);

    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    const stripeWidth = 40;
    for (let x = -256; x < 512; x += stripeWidth * 2) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x + stripeWidth, 0);
      ctx.lineTo(x + stripeWidth + 256, 256);
      ctx.lineTo(x + 256, 256);
      ctx.closePath();
    }
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 1);
  texture.colorSpace = THREE.SRGBColorSpace;

  return new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.65,
    metalness: 0.2
  });
}

// Procedural Realistic Mountain Grass and Terrain Material
function createRealisticTerrainMaterial(terrain: string): THREE.MeshStandardMaterial {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    if (terrain === 'snow_mountain') {
      // Himalayan alpine snow & rugged rock face
      ctx.fillStyle = '#64748b';
      ctx.fillRect(0, 0, 1024, 1024);
      ctx.fillStyle = '#94a3b8';
      for (let i = 0; i < 20000; i++) {
        ctx.fillRect(Math.random() * 1024, Math.random() * 1024, 3, 3);
      }
      ctx.fillStyle = '#e2e8f0';
      for (let i = 0; i < 15000; i++) {
        ctx.fillRect(Math.random() * 1024, Math.random() * 1024, 5, 5);
      }
    } else if (terrain === 'desert') {
      // Golden Thar desert sand with warm dunes and gravel
      ctx.fillStyle = '#b4833e';
      ctx.fillRect(0, 0, 1024, 1024);
      ctx.fillStyle = '#966826';
      for (let i = 0; i < 25000; i++) {
        ctx.fillRect(Math.random() * 1024, Math.random() * 1024, 3, 3);
      }
      ctx.fillStyle = '#cda25b';
      for (let i = 0; i < 12000; i++) {
        ctx.fillRect(Math.random() * 1024, Math.random() * 1024, 4, 4);
      }
    } else {
      // Lush Indian countryside greenery matching BUSSID screenshot (deep forest green with rich soil)
      ctx.fillStyle = '#224d1f';
      ctx.fillRect(0, 0, 1024, 1024);

      // Deep forest tones
      ctx.fillStyle = '#173915';
      for (let i = 0; i < 35000; i++) {
        ctx.fillRect(Math.random() * 1024, Math.random() * 1024, 3, 3);
      }

      // Bright grass blade highlights
      ctx.fillStyle = '#2d6328';
      for (let i = 0; i < 20000; i++) {
        ctx.fillRect(Math.random() * 1024, Math.random() * 1024, 2, 4);
      }

      // Earthy moss & brown soil patches
      ctx.fillStyle = 'rgba(78, 54, 32, 0.35)';
      for (let i = 0; i < 8000; i++) {
        ctx.fillRect(Math.random() * 1024, Math.random() * 1024, 6, 6);
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 12);
  texture.colorSpace = THREE.SRGBColorSpace;

  return new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.88,
    metalness: 0.05
  });
}

// Indian Milestone Marker ("NH-44 • 45 KM")
function createMilestoneMarker(km: number, destCity: string): THREE.Group {
  const milestone = new THREE.Group();

  // White base body
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.8, 0.35),
    new THREE.MeshStandardMaterial({ color: 0xf9fafb, roughness: 0.8 })
  );
  body.position.y = 0.4;
  body.castShadow = true;
  milestone.add(body);

  // Yellow rounded dome cap
  const cap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.25, 0.25, 0.35, 12),
    new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.7 })
  );
  cap.position.y = 0.8;
  cap.rotation.z = Math.PI / 2;
  milestone.add(cap);

  // Text plate
  const mCanvas = document.createElement('canvas');
  mCanvas.width = 256;
  mCanvas.height = 256;
  const mCtx = mCanvas.getContext('2d');
  if (mCtx) {
    mCtx.fillStyle = '#f59e0b';
    mCtx.fillRect(0, 0, 256, 100);
    mCtx.fillStyle = '#0f172a';
    mCtx.font = 'bold 36px sans-serif';
    mCtx.textAlign = 'center';
    mCtx.fillText('NH 44', 128, 65);

    mCtx.fillStyle = '#ffffff';
    mCtx.fillRect(0, 100, 256, 156);
    mCtx.fillStyle = '#0f172a';
    mCtx.font = 'bold 30px sans-serif';
    mCtx.fillText(destCity.slice(0, 8).toUpperCase(), 128, 160);
    mCtx.font = 'bold 44px sans-serif';
    mCtx.fillText(`${km} KM`, 128, 220);
  }
  const mTex = new THREE.CanvasTexture(mCanvas);
  mTex.colorSpace = THREE.SRGBColorSpace;
  const mSign = new THREE.Mesh(new THREE.PlaneGeometry(0.48, 0.9), new THREE.MeshBasicMaterial({ map: mTex }));
  mSign.position.set(0, 0.5, 0.18);
  milestone.add(mSign);

  return milestone;
}

// Indian Village House with Clay/Tin Roof & Porch
function createIndianVillageHouse(): THREE.Group {
  const house = new THREE.Group();

  // White plastered brick walls
  const walls = new THREE.Mesh(
    new THREE.BoxGeometry(7, 3.2, 5.5),
    new THREE.MeshStandardMaterial({ color: 0xe5e7eb, roughness: 0.9 })
  );
  walls.position.y = 1.6;
  walls.castShadow = true;
  walls.receiveShadow = true;
  house.add(walls);

  // Slanted clay/tin roof
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(5.2, 2.0, 4),
    new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.85 })
  );
  roof.position.y = 4.0;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  house.add(roof);

  // Front wooden door and window
  const door = new THREE.Mesh(
    new THREE.PlaneGeometry(1.0, 2.1),
    new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.7 })
  );
  door.position.set(0, 1.05, 2.76);
  house.add(door);

  const windowMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1.0, 0.9),
    new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.5 })
  );
  windowMesh.position.set(2.0, 1.6, 2.76);
  house.add(windowMesh);

  return house;
}

// Authentic Indian Bus Shelter with Waiting Passengers
function createBusShelter(_cityName: string): THREE.Group {
  const shelter = new THREE.Group();

  // Platform concrete base
  const platform = new THREE.Mesh(
    new THREE.BoxGeometry(6, 0.4, 16),
    new THREE.MeshStandardMaterial({ color: 0x9ca3af, roughness: 0.8 })
  );
  platform.position.set(0, 0.2, 0);
  shelter.add(platform);

  // Metal pillars and curved canopy roof
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.7, roughness: 0.3 });
  [-6, 0, 6].forEach((zPos) => {
    const pillar1 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.2), pillarMat);
    pillar1.position.set(-1.8, 1.8, zPos);
    shelter.add(pillar1);

    const pillar2 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.2), pillarMat);
    pillar2.position.set(1.8, 1.8, zPos);
    shelter.add(pillar2);
  });

  // Blue metal corrugated roof
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(4.5, 0.15, 16.5),
    new THREE.MeshStandardMaterial({ color: 0x0369a1, roughness: 0.4 })
  );
  roof.position.set(0, 3.4, 0);
  shelter.add(roof);

  // Signboard: "BUS STOP - YATRI PRATIKSHALAY"
  const signCanvas = document.createElement('canvas');
  signCanvas.width = 512;
  signCanvas.height = 128;
  const sCtx = signCanvas.getContext('2d');
  if (sCtx) {
    sCtx.fillStyle = '#0284c7';
    sCtx.fillRect(0, 0, 512, 128);
    sCtx.fillStyle = '#ffffff';
    sCtx.font = 'bold 38px sans-serif';
    sCtx.textAlign = 'center';
    sCtx.fillText('BUS STOP / बस स्टॉप', 256, 50);
    sCtx.font = 'bold 24px sans-serif';
    sCtx.fillText('STOP HERE FOR BOARDING', 256, 95);
  }
  const signTex = new THREE.CanvasTexture(signCanvas);
  signTex.colorSpace = THREE.SRGBColorSpace;
  const signMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(4.2, 0.8),
    new THREE.MeshBasicMaterial({ map: signTex })
  );
  signMesh.position.set(0, 3.85, 0);
  signMesh.rotation.y = -Math.PI / 2;
  shelter.add(signMesh);

  // Waiting Indian passenger figures
  const passengerColors = [0xef4444, 0x10b981, 0x3b82f6, 0xf59e0b, 0x8b5cf6];
  for (let p = 0; p < 5; p++) {
    const passenger = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.25, 0.9),
      new THREE.MeshStandardMaterial({ color: passengerColors[p % passengerColors.length] })
    );
    body.position.y = 0.85;
    passenger.add(body);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0xc68642 })
    );
    head.position.y = 1.45;
    passenger.add(head);

    passenger.position.set(-0.6 + Math.random() * 1.2, 0.4, -4 + p * 2.2);
    shelter.add(passenger);
  }

  return shelter;
}

// Authentic Indian Highway Dhaba ("SHER-E-PUNJAB DHABA")
function createIndianDhaba(): THREE.Group {
  const dhaba = new THREE.Group();

  // Building main hall
  const building = new THREE.Mesh(
    new THREE.BoxGeometry(10, 4, 14),
    new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.8 })
  );
  building.position.set(0, 2, 0);
  dhaba.add(building);

  // Colorful Dhaba Roof
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(8, 2.5, 4),
    new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.7 })
  );
  roof.position.set(0, 5.25, 0);
  roof.rotation.y = Math.PI / 4;
  dhaba.add(roof);

  // Dhaba sign
  const dhabaCanvas = document.createElement('canvas');
  dhabaCanvas.width = 512;
  dhabaCanvas.height = 128;
  const dCtx = dhabaCanvas.getContext('2d');
  if (dCtx) {
    dCtx.fillStyle = '#dc2626';
    dCtx.fillRect(0, 0, 512, 128);
    dCtx.fillStyle = '#fef08a';
    dCtx.font = 'bold 36px sans-serif';
    dCtx.textAlign = 'center';
    dCtx.fillText('SHER-E-PUNJAB DHABA', 256, 48);
    dCtx.fillStyle = '#ffffff';
    dCtx.font = 'bold 24px sans-serif';
    dCtx.fillText('24x7 SPECIAL CHAI & TANDOORI', 256, 95);
  }
  const dTex = new THREE.CanvasTexture(dhabaCanvas);
  dTex.colorSpace = THREE.SRGBColorSpace;
  const dSign = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.4), new THREE.MeshBasicMaterial({ map: dTex }));
  dSign.position.set(5.02, 3, 0);
  dSign.rotation.y = Math.PI / 2;
  dhaba.add(dSign);

  return dhaba;
}

// Indian National Highway Toll Plaza with FASTag
function createTollPlaza(): THREE.Group {
  const toll = new THREE.Group();

  const canopy = new THREE.Mesh(
    new THREE.BoxGeometry(22, 1.2, 8),
    new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.4 })
  );
  canopy.position.set(0, 6, 0);
  toll.add(canopy);

  [-7, 0, 7].forEach((xPos) => {
    const booth = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 3.5, 3),
      new THREE.MeshStandardMaterial({ color: 0xf3f4f6, roughness: 0.5 })
    );
    booth.position.set(xPos, 1.75, 0);
    toll.add(booth);

    const boom = new THREE.Mesh(
      new THREE.BoxGeometry(4.5, 0.1, 0.1),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b })
    );
    boom.position.set(xPos > 0 ? xPos - 2.8 : xPos + 2.8, 1.2, 1.5);
    toll.add(boom);
  });

  return toll;
}

// Authentic Indian Roadside Fuel Station (IndianOil / Bharat Petroleum)
function createIndianFuelStation(brand: 'IndianOil' | 'BharatPetroleum'): THREE.Group {
  const station = new THREE.Group();

  const isIO = brand === 'IndianOil';
  const primaryBrandColor = isIO ? 0xf97316 : 0xfacc15;
  const secondaryBrandColor = isIO ? 0x1e3a8a : 0x1d4ed8;

  const forecourt = new THREE.Mesh(
    new THREE.BoxGeometry(16, 0.25, 24),
    new THREE.MeshStandardMaterial({ color: 0x3f3f46, roughness: 0.8 })
  );
  forecourt.position.set(0, 0.12, 0);
  station.add(forecourt);

  const canopy = new THREE.Mesh(
    new THREE.BoxGeometry(14, 1.1, 20),
    new THREE.MeshStandardMaterial({ color: secondaryBrandColor, roughness: 0.3, metalness: 0.2 })
  );
  canopy.position.set(0, 5.6, 0);
  canopy.castShadow = true;
  station.add(canopy);

  const stripe = new THREE.Mesh(
    new THREE.BoxGeometry(14.2, 0.35, 20.2),
    new THREE.MeshStandardMaterial({ color: primaryBrandColor, roughness: 0.3 })
  );
  stripe.position.set(0, 5.3, 0);
  station.add(stripe);

  const pillarMat = new THREE.MeshStandardMaterial({ color: 0xf4f4f5, roughness: 0.4, metalness: 0.1 });
  [-5, 5].forEach((x) => {
    [-7, 7].forEach((z) => {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 5.2, 12), pillarMat);
      col.position.set(x, 2.7, z);
      col.castShadow = true;
      station.add(col);
    });
  });

  const islandMat = new THREE.MeshStandardMaterial({ color: 0xa1a1aa, roughness: 0.7 });
  const pumpBodyMat = new THREE.MeshStandardMaterial({ color: primaryBrandColor, roughness: 0.4 });
  const pumpScreenMat = new THREE.MeshBasicMaterial({ color: 0x059669 });

  [-2.8, 2.8].forEach((x) => {
    const island = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.4, 7), islandMat);
    island.position.set(x, 0.35, 0);
    station.add(island);

    [-1.8, 1.8].forEach((z) => {
      const pump = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.9, 0.8), pumpBodyMat);
      pump.position.set(x, 1.35, z);
      station.add(pump);

      const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.25), pumpScreenMat);
      screen.position.set(x + 0.41, 1.6, z);
      screen.rotation.y = Math.PI / 2;
      station.add(screen);
    });
  });

  const signCanvas = document.createElement('canvas');
  signCanvas.width = 512;
  signCanvas.height = 256;
  const ctx = signCanvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = isIO ? '#1e3a8a' : '#1e293b';
    ctx.fillRect(0, 0, 512, 256);

    ctx.fillStyle = isIO ? '#f97316' : '#facc15';
    ctx.fillRect(0, 0, 512, 70);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(isIO ? 'INDIAN OIL' : 'BHARAT PETROLEUM', 256, 48);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText('DIESEL / डीजल', 256, 120);

    ctx.fillStyle = '#4ade80';
    ctx.font = 'bold 44px monospace';
    ctx.fillText('₹ 89.50 / L', 256, 185);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('FREE AIR & WATER • 24x7', 256, 230);
  }

  const signTex = new THREE.CanvasTexture(signCanvas);
  signTex.colorSpace = THREE.SRGBColorSpace;
  const pylonSign = new THREE.Mesh(
    new THREE.PlaneGeometry(3.6, 2.2),
    new THREE.MeshBasicMaterial({ map: signTex })
  );
  pylonSign.position.set(-6.5, 4.5, 10);
  pylonSign.rotation.y = -Math.PI / 2;
  station.add(pylonSign);

  const signPole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.12, 4.5),
    new THREE.MeshStandardMaterial({ color: 0x52525b })
  );
  signPole.position.set(-6.5, 2.25, 10);
  station.add(signPole);

  return station;
}
