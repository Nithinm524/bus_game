import * as THREE from 'three';
import { GraphicsQuality, TimeOfDay, WeatherType } from '../types/game';
import { audioService } from '../services/audioService';

export interface WeatherSystem {
  update: (delta: number, playerPos: THREE.Vector3) => void;
  setWeather: (weather: WeatherType) => void;
  setTimeOfDay: (time: TimeOfDay) => void;
  dispose: () => void;
}

export function createWeatherSystem(
  scene: THREE.Scene,
  initialWeather: WeatherType = 'sunny',
  initialTime: TimeOfDay = 'noon',
  quality: GraphicsQuality = 'high'
): WeatherSystem {
  let currentWeather = initialWeather;
  let currentTime = initialTime;

  // Key Directional Sun/Moon Light with Soft Shadows
  const sunLight = new THREE.DirectionalLight(0xfffaed, 2.2);
  sunLight.position.set(45, 85, 35);
  sunLight.castShadow = quality !== 'low';

  const shadowRes = quality === 'ultra' ? 2048 : quality === 'high' ? 1024 : 512;
  sunLight.shadow.mapSize.width = shadowRes;
  sunLight.shadow.mapSize.height = shadowRes;
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far = 320;
  sunLight.shadow.camera.left = -55;
  sunLight.shadow.camera.right = 55;
  sunLight.shadow.camera.top = 55;
  sunLight.shadow.camera.bottom = -55;
  sunLight.shadow.bias = -0.0003;
  sunLight.shadow.normalBias = 0.02;
  scene.add(sunLight);

  // Hemisphere Ambient Light (Warm Sky, Cool Ground)
  const hemiLight = new THREE.HemisphereLight(0x7ec8f8, 0x3d4a34, 0.85);
  scene.add(hemiLight);

  // Procedural Fluffy Cumulus Clouds drifting in the sky
  const cloudGroup = new THREE.Group();
  const cloudPuffsGeo = new THREE.DodecahedronGeometry(12, 1);
  const cloudMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 1.0,
    metalness: 0.0,
    transparent: true,
    opacity: 0.82
  });

  const cloudCount = quality === 'low' ? 6 : 14;
  for (let c = 0; c < cloudCount; c++) {
    const cloudCluster = new THREE.Group();
    const puffCount = 5 + Math.floor(Math.random() * 4);
    for (let p = 0; p < puffCount; p++) {
      const puff = new THREE.Mesh(cloudPuffsGeo, cloudMat);
      puff.position.set(
        (Math.random() - 0.5) * 28,
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 22
      );
      const puffScale = 0.7 + Math.random() * 0.8;
      puff.scale.set(puffScale * 1.5, puffScale * 0.7, puffScale);
      cloudCluster.add(puff);
    }
    cloudCluster.position.set(
      (Math.random() - 0.5) * 350,
      75 + Math.random() * 25,
      (Math.random() - 0.5) * 450
    );
    cloudGroup.add(cloudCluster);
  }
  scene.add(cloudGroup);

  // Rain / Snow Particle System
  const PARTICLE_COUNT = quality === 'ultra' ? 4000 : quality === 'high' ? 2500 : 1200;
  const particleGeo = new THREE.BufferGeometry();
  const particlePositions = new Float32Array(PARTICLE_COUNT * 3);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particlePositions[i * 3] = (Math.random() - 0.5) * 90;
    particlePositions[i * 3 + 1] = Math.random() * 40;
    particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 90;
  }

  particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

  const particleMat = new THREE.PointsMaterial({
    color: 0x93c5fd,
    size: 0.22,
    transparent: true,
    opacity: 0.7
  });

  const particleSystem = new THREE.Points(particleGeo, particleMat);
  particleSystem.visible = false;
  scene.add(particleSystem);

  function applyWeather(weather: WeatherType) {
    currentWeather = weather;
    if (weather === 'rainy' || weather === 'heavy_rain') {
      particleSystem.visible = true;
      particleMat.color.setHex(0x93c5fd);
      particleMat.size = weather === 'heavy_rain' ? 0.32 : 0.2;
      particleMat.opacity = weather === 'heavy_rain' ? 0.85 : 0.6;
      audioService.setRain(true, weather === 'heavy_rain');
      scene.fog = new THREE.FogExp2(0x566573, weather === 'heavy_rain' ? 0.014 : 0.007);
      cloudMat.color.setHex(0x94a3b8);
    } else if (weather === 'snow') {
      particleSystem.visible = true;
      particleMat.color.setHex(0xffffff);
      particleMat.size = 0.38;
      particleMat.opacity = 0.9;
      audioService.setRain(false);
      scene.fog = new THREE.FogExp2(0xcfdbe8, 0.011);
      cloudMat.color.setHex(0xe2e8f0);
    } else if (weather === 'foggy') {
      particleSystem.visible = false;
      audioService.setRain(false);
      scene.fog = new THREE.Fog(0xb4c2d4, 30, 110);
      cloudMat.color.setHex(0xcccccc);
    } else if (weather === 'desert') {
      particleSystem.visible = false;
      audioService.setRain(false);
      scene.fog = new THREE.Fog(0xd4a373, 60, 240);
      cloudMat.color.setHex(0xfef08a);
    } else {
      // Sunny - clear mountain visibility matching sky
      particleSystem.visible = false;
      audioService.setRain(false);
      scene.fog = new THREE.Fog(0x7bb5eb, 100, 480);
      cloudMat.color.setHex(0xffffff);
    }
  }

  function applyTimeOfDay(time: TimeOfDay) {
    currentTime = time;
    if (time === 'night') {
      scene.background = new THREE.Color(0x0a101f);
      sunLight.color.setHex(0x4a6fa5);
      sunLight.intensity = 0.22;
      sunLight.position.set(-30, 45, -30);
      hemiLight.color.setHex(0x1a2638);
      hemiLight.groundColor.setHex(0x0a0f0d);
      hemiLight.intensity = 0.25;
      cloudMat.opacity = 0.2;
      if (scene.fog) {
        if (scene.fog instanceof THREE.Fog) (scene.fog as THREE.Fog).color.setHex(0x0a101f);
        else (scene.fog as THREE.FogExp2).color.setHex(0x0a101f);
      }
    } else if (time === 'evening') {
      // Gentle golden hour twilight with blue sky and warm horizon
      scene.background = new THREE.Color(0x567b9e);
      sunLight.color.setHex(0xf5b778);
      sunLight.intensity = 1.25;
      sunLight.position.set(70, 30, 20);
      hemiLight.color.setHex(0x85a0ba);
      hemiLight.groundColor.setHex(0x232d1d);
      hemiLight.intensity = 0.45;
      cloudMat.opacity = 0.75;
      cloudMat.color.setHex(0xe2caa8);
      if (scene.fog) {
        if (scene.fog instanceof THREE.Fog) (scene.fog as THREE.Fog).color.setHex(0x567b9e);
        else (scene.fog as THREE.FogExp2).color.setHex(0x567b9e);
      }
    } else if (time === 'morning') {
      // Crisp clear morning with soft warm sun
      scene.background = new THREE.Color(0x7eb3e3);
      sunLight.color.setHex(0xfff4de);
      sunLight.intensity = 1.35;
      sunLight.position.set(-60, 45, 30);
      hemiLight.color.setHex(0xa0cdfa);
      hemiLight.groundColor.setHex(0x283e20);
      hemiLight.intensity = 0.5;
      cloudMat.opacity = 0.8;
      cloudMat.color.setHex(0xfff7ed);
      if (scene.fog) {
        if (scene.fog instanceof THREE.Fog) (scene.fog as THREE.Fog).color.setHex(0x7eb3e3);
        else (scene.fog as THREE.FogExp2).color.setHex(0x7eb3e3);
      }
    } else {
      // Noon - Natural bright Indian sunlight and blue sky matching reference image
      scene.background = new THREE.Color(0x6ba8e5);
      sunLight.color.setHex(0xfffbf0);
      sunLight.intensity = 1.45;
      sunLight.position.set(35, 85, 35);
      hemiLight.color.setHex(0x90caf9);
      hemiLight.groundColor.setHex(0x2d4323);
      hemiLight.intensity = 0.55;
      cloudMat.opacity = 0.85;
      cloudMat.color.setHex(0xffffff);
      if (scene.fog) {
        if (scene.fog instanceof THREE.Fog) (scene.fog as THREE.Fog).color.setHex(0x7bb5eb);
        else (scene.fog as THREE.FogExp2).color.setHex(0x7bb5eb);
      }
    }
  }

  applyWeather(initialWeather);
  applyTimeOfDay(initialTime);

  return {
    update: (delta: number, playerPos: THREE.Vector3) => {
      // Keep sun shadows centered on player
      sunLight.position.z = playerPos.z + 45;
      sunLight.target.position.set(playerPos.x, 0, playerPos.z);
      sunLight.target.updateMatrixWorld();

      // Drift procedural cumulus clouds along highway
      cloudGroup.position.z = playerPos.z;
      cloudGroup.children.forEach((c) => {
        c.position.z += delta * 2.5;
        if (c.position.z > 220) {
          c.position.z = -220;
        }
      });

      // Keep rain/snow particle box centered on player
      if (particleSystem.visible) {
        particleSystem.position.set(playerPos.x, 0, playerPos.z);
        const posAttr = particleGeo.attributes.position as THREE.BufferAttribute;
        const posArray = posAttr.array as Float32Array;

        const isSnow = currentWeather === 'snow';
        const fallSpeed = isSnow ? 6 : 30;

        for (let i = 0; i < PARTICLE_COUNT; i++) {
          let y = posArray[i * 3 + 1];
          y -= fallSpeed * delta;
          if (y < 0) {
            y = 40;
          }
          posArray[i * 3 + 1] = y;
        }
        posAttr.needsUpdate = true;
      }
    },
    setWeather: (w) => applyWeather(w),
    setTimeOfDay: (t) => applyTimeOfDay(t),
    dispose: () => {
      scene.remove(sunLight);
      scene.remove(hemiLight);
      scene.remove(cloudGroup);
      scene.remove(particleSystem);
      particleGeo.dispose();
      particleMat.dispose();
      cloudPuffsGeo.dispose();
      cloudMat.dispose();
      audioService.setRain(false);
    }
  };
}
