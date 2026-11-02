import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { WeatherPostShader } from './weatherShader';
import {
  BusConfig,
  CameraView,
  FuelStation,
  GraphicsQuality,
  IndianRoute,
  TimeOfDay,
  TrafficDensityLevel,
  VehicleControlState,
  WeatherType
} from '../types/game';
import { createBusMesh, BusMeshRefs } from './busModels';
import { createEnvironment, EnvironmentManager } from './environment';
import { createTrafficSystem, TrafficManager } from './traffic';
import { createWeatherSystem, WeatherSystem } from './weather';
import { BusPhysicsEngine } from './physics';
import { audioService } from '../services/audioService';

interface GameCanvasProps {
  busConfig: BusConfig;
  route: IndianRoute;
  weather: WeatherType;
  timeOfDay: TimeOfDay;
  graphicsQuality: GraphicsQuality;
  cameraView: CameraView;
  controls: VehicleControlState;
  initialFuel?: number;
  passengerCount?: number;
  driverEcoBonus?: boolean;
  refuelLitersToAdd?: number;
  onTripTelemetry: (telemetry: {
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
  }) => void;
  onCollision: () => void;
}

// Module-level math helpers to avoid garbage collection
const _cameraTarget = new THREE.Vector3();
const _desiredPos = new THREE.Vector3();

export const GameCanvas: React.FC<GameCanvasProps> = ({
  busConfig,
  route,
  weather,
  timeOfDay,
  graphicsQuality,
  cameraView,
  controls,
  initialFuel,
  passengerCount = 24,
  driverEcoBonus = false,
  refuelLitersToAdd = 0,
  onTripTelemetry,
  onCollision
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<VehicleControlState>(controls);
  const cameraViewRef = useRef<CameraView>(cameraView);
  const onTripTelemetryRef = useRef(onTripTelemetry);
  const onCollisionRef = useRef(onCollision);
  const passengerCountRef = useRef(passengerCount);
  const driverEcoBonusRef = useRef(driverEcoBonus);
  const physicsRef = useRef<BusPhysicsEngine | null>(null);

  // Keep refs updated for animation loop access
  controlsRef.current = controls;
  cameraViewRef.current = cameraView;
  onTripTelemetryRef.current = onTripTelemetry;
  onCollisionRef.current = onCollision;
  passengerCountRef.current = passengerCount;
  driverEcoBonusRef.current = driverEcoBonus;

  // Handle refueling signal from HUD / Modal
  useEffect(() => {
    if (refuelLitersToAdd > 0 && physicsRef.current) {
      physicsRef.current.refuel(refuelLitersToAdd);
    }
  }, [refuelLitersToAdd]);

  useEffect(() => {
    if (!mountRef.current) return;

    // 1. Detect Software WebGL
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = mountRef.current.clientWidth || window.innerWidth;
    const height = mountRef.current.clientHeight || window.innerHeight;

    // 2. Scene & Camera with graphics-quality dependent draw distance
    const scene = new THREE.Scene();
    const cameraFar = graphicsQuality === 'ultra' ? 850 : graphicsQuality === 'high' ? 700 : graphicsQuality === 'medium' ? 500 : 350;
    const camera = new THREE.PerspectiveCamera(54, width / height, 0.1, cameraFar);

    // 3. Renderer with ACESFilmicToneMapping and PCFSoftShadowMap
    const renderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
      antialias: !isSoftwareGl && graphicsQuality !== 'low'
    });
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.setPixelRatio(
      isSoftwareGl || graphicsQuality === 'low' ? 1 : Math.min(window.devicePixelRatio, 2)
    );
    renderer.shadowMap.enabled = !isSoftwareGl && graphicsQuality !== 'low';
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    mountRef.current.appendChild(renderer.domElement);

    // 4. Room Environment for realistic vehicle metal & glass specular reflections
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 5. Post-processing setup with WeatherPostShader
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const weatherPass = new ShaderPass(WeatherPostShader);
    weatherPass.renderToScreen = true;
    weatherPass.uniforms.uResolution.value.set(width, height);
    composer.addPass(weatherPass);

    const weatherTypeMap: Record<WeatherType, number> = {
      sunny: 0,
      rainy: 1,
      heavy_rain: 2,
      snow: 3,
      foggy: 4,
      desert: 5
    };

    // 6. Initialize Subsystems
    const busRefs: BusMeshRefs = createBusMesh(busConfig);
    scene.add(busRefs.group);

    const physics = new BusPhysicsEngine(busConfig, initialFuel);
    physicsRef.current = physics;

    const envManager: EnvironmentManager = createEnvironment(scene, route, weather, graphicsQuality);
    const trafficManager: TrafficManager = createTrafficSystem(scene, timeOfDay, route.terrain);
    const weatherSys: WeatherSystem = createWeatherSystem(scene, weather, timeOfDay, graphicsQuality);

    // 7. Animation and Simulation Loop
    const clock = new THREE.Clock();
    let frameId = 0;
    let totalDistanceMeters = 0;
    let collisionCooldown = 0;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      const delta = Math.min(clock.getDelta(), 0.1);
      collisionCooldown = Math.max(0, collisionCooldown - delta);

      // Traffic update and collision
      const trafficResult = trafficManager.update(delta, physics.state.z, physics.state.x);
      if (trafficResult.collided && collisionCooldown <= 0) {
        collisionCooldown = 1.5;
        audioService.playAirBrake();
        onCollisionRef.current();
      }

      // Update bus physics with full dynamic fuel consumption parameters
      const isWet = weather === 'rainy' || weather === 'heavy_rain' || weather === 'snow';
      physics.update(
        delta,
        controlsRef.current,
        busRefs,
        trafficResult.collided,
        isWet,
        passengerCountRef.current,
        route.terrain,
        driverEcoBonusRef.current
      );

      // Track distance traveled
      totalDistanceMeters += Math.abs(physics.state.speed * delta);

      // Update road chunks, bus stop and fuel station detection
      const envResult = envManager.update(physics.state.z);

      // Weather particles & sun position
      _cameraTarget.set(physics.state.x, physics.state.y, physics.state.z);
      weatherSys.update(delta, _cameraTarget);

      // Camera positioning based on selected perspective
      const cMode = cameraViewRef.current;
      const busX = physics.state.x;
      const busY = physics.state.y;
      const busZ = physics.state.z;
      const heading = physics.state.heading;

      if (cMode === 'rear') {
        // High quality chase camera matching the BUSSID reference screenshot
        const dist = 10.8;
        const camHeight = 3.8;
        _desiredPos.set(
          busX - Math.sin(heading) * dist,
          busY + camHeight,
          busZ - Math.cos(heading) * dist
        );
        camera.position.lerp(_desiredPos, 0.2);
        _cameraTarget.set(
          busX + Math.sin(heading) * 12,
          busY + 1.85,
          busZ + Math.cos(heading) * 12
        );
        camera.lookAt(_cameraTarget);
      } else if (cMode === 'cockpit') {
        // Driver's eye view behind windshield and dashboard
        const eyeX = busX + Math.cos(heading) * 0.65 + Math.sin(heading) * 3.8;
        const eyeY = busY + 2.2;
        const eyeZ = busZ - Math.sin(heading) * 0.65 + Math.cos(heading) * 3.8;
        camera.position.set(eyeX, eyeY, eyeZ);
        _cameraTarget.set(
          eyeX + Math.sin(heading) * 15,
          eyeY - 0.2,
          eyeZ + Math.cos(heading) * 15
        );
        camera.lookAt(_cameraTarget);
      } else if (cMode === 'passenger') {
        // Seated inside middle passenger compartment looking out the window
        const eyeX = busX - Math.cos(heading) * 0.8;
        const eyeY = busY + 2.1;
        const eyeZ = busZ - Math.cos(heading) * 1.5;
        camera.position.set(eyeX, eyeY, eyeZ);
        _cameraTarget.set(
          eyeX + Math.sin(heading) * 10 - Math.cos(heading) * 4,
          eyeY,
          eyeZ + Math.cos(heading) * 10 + Math.sin(heading) * 4
        );
        camera.lookAt(_cameraTarget);
      } else if (cMode === 'front') {
        // Front bumper camera skimming the asphalt
        camera.position.set(
          busX + Math.sin(heading) * 6.2,
          busY + 1.1,
          busZ + Math.cos(heading) * 6.2
        );
        _cameraTarget.set(
          busX + Math.sin(heading) * 25,
          busY + 1.0,
          busZ + Math.cos(heading) * 25
        );
        camera.lookAt(_cameraTarget);
      } else if (cMode === 'side') {
        // Side 3/4 showcase camera tracking alongside the bus
        _desiredPos.set(
          busX - Math.cos(heading) * 6.8 - Math.sin(heading) * 3.0,
          busY + 3.2,
          busZ + Math.sin(heading) * 6.8 - Math.cos(heading) * 3.0
        );
        camera.position.lerp(_desiredPos, 0.15);
        _cameraTarget.set(
          busX + Math.sin(heading) * 2.0,
          busY + 2.0,
          busZ + Math.cos(heading) * 2.0
        );
        camera.lookAt(_cameraTarget);
      } else if (cMode === 'top') {
        // High top-down surveillance camera
        camera.position.set(busX, busY + 28, busZ - 10);
        _cameraTarget.set(busX, busY, busZ + 5);
        camera.lookAt(_cameraTarget);
      } else {
        // Cinematic slow revolving camera
        const time = clock.getElapsedTime() * 0.4;
        const radius = 18;
        camera.position.set(
          busX + Math.sin(time) * radius,
          busY + 6.5,
          busZ + Math.cos(time) * radius
        );
        _cameraTarget.set(busX, busY + 2.0, busZ);
        camera.lookAt(_cameraTarget);
      }

      // Update weather post-processing shader uniforms
      weatherPass.uniforms.uTime.value = clock.getElapsedTime();
      weatherPass.uniforms.uWeatherType.value = weatherTypeMap[weather] ?? 0;
      weatherPass.uniforms.uSpeed.value = Math.abs(physics.state.speedKmH);
      weatherPass.uniforms.uWipers.value = controlsRef.current.wipers ? 1.0 : 0.0;
      weatherPass.uniforms.uIntensity.value =
        graphicsQuality === 'ultra' ? 1.2 : graphicsQuality === 'high' ? 1.0 : graphicsQuality === 'medium' ? 0.75 : 0.5;

      // Render frame directly with native Three.js ACESFilmic tone mapping and PCFSoftShadowMap
      renderer.render(scene, camera);

      // Report full telemetry to React HUD
      onTripTelemetryRef.current({
        speedKmH: physics.state.speedKmH,
        distanceCoveredMeters: totalDistanceMeters,
        isAtBusStop: envResult.isAtBusStop,
        gearNumber: physics.state.gearNumber,
        fuelLiters: physics.state.fuelLiters,
        fuelCapacity: physics.state.fuelCapacity,
        consumptionRateLPer100Km: physics.state.consumptionRateLPer100Km,
        estimatedRangeKm: physics.state.estimatedRangeKm,
        isLowFuel: physics.state.isLowFuel,
        isNearFuelStation: envResult.isNearFuelStation,
        currentFuelStation: envResult.currentFuelStation,
        trafficDensity: trafficManager.currentDensity,
        activeTrafficCount: trafficManager.activeCount
      });

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    if (isSoftwareGl) {
      afterDraw(tick);
    } else {
      frameId = requestAnimationFrame(tick);
    }

    // Handle Window Resize
    const handleResize = () => {
      if (!mountRef.current) return;
      const newWidth = mountRef.current.clientWidth || window.innerWidth;
      const newHeight = mountRef.current.clientHeight || window.innerHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
      composer.setSize(newWidth, newHeight);
      weatherPass.uniforms.uResolution.value.set(newWidth, newHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      if (isSoftwareGl) {
        clearTimeout(frameId);
      } else {
        cancelAnimationFrame(frameId);
      }
      envManager.dispose();
      trafficManager.dispose();
      weatherSys.dispose();
      audioService.stopEngine();
      audioService.stopIndicator();
      composer.dispose();
      renderer.dispose();
      if (mountRef.current && renderer.domElement.parentNode === mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, [busConfig, route, weather, timeOfDay, graphicsQuality, initialFuel]);

  return <div ref={mountRef} className="absolute inset-0 w-full h-full overflow-hidden select-none" />;
};
