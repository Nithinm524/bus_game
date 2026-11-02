import * as THREE from 'three';

export const WeatherPostShader = {
  name: 'WeatherPostShader',
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0.0 },
    uWeatherType: { value: 0 }, // 0: sunny, 1: rainy, 2: heavy_rain, 3: snow, 4: foggy, 5: desert
    uIntensity: { value: 1.0 },
    uSpeed: { value: 0.0 }, // km/h
    uWipers: { value: 0.0 }, // 1.0 when wipers on
    uResolution: { value: new THREE.Vector2(1920, 1080) }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform int uWeatherType;
    uniform float uIntensity;
    uniform float uSpeed;
    uniform float uWipers;
    uniform vec2 uResolution;

    varying vec2 vUv;

    // Pseudo-random hash
    float hash21(vec2 p) {
      p = fract(p * vec2(234.34, 435.345));
      p += dot(p, p + 34.23);
      return fract(p.x * p.y);
    }

    // 2D noise
    float noise2d(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      float a = hash21(i);
      float b = hash21(i + vec2(1.0, 0.0));
      float c = hash21(i + vec2(0.0, 1.0));
      float d = hash21(i + vec2(1.0, 1.0));
      return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }

    // Wiper blade mask calculation for windshield arc
    float getWiperMask(vec2 uv) {
      if (uWipers < 0.2) return 0.0;
      // Wiper pivot point near bottom center
      vec2 pivot = vec2(0.5, -0.15);
      vec2 d = uv - pivot;
      float dist = length(d);
      float angle = atan(d.y, d.x);
      
      // Wiper sweeps between approx 0.35 and 2.8 radians
      float sweepTime = uTime * 3.2;
      float bladeAngle = mix(0.4, 2.7, abs(sin(sweepTime)));
      
      // Distance from the moving wiper blade line
      float angleDiff = abs(angle - bladeAngle);
      float bladeLine = smoothstep(0.06, 0.005, angleDiff) * smoothstep(0.95, 0.1, dist);
      
      // Cleaned arc zone trail
      float inWiperArc = step(0.1, dist) * step(dist, 0.9) * step(0.35, angle) * step(angle, 2.75);
      return bladeLine * 0.8 + inWiperArc * 0.45;
    }

    // Render falling rain streaks and droplets
    void renderRain(inout vec4 color, vec2 uv, float intensity, bool isHeavy) {
      float speedFactor = uSpeed * 0.012;
      float angle = 0.12 + speedFactor * 0.15;
      
      // Transform UV for angled rain streaks
      mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
      vec2 rainUv = rot * (uv * vec2(uResolution.x / uResolution.y, 1.0));
      
      // Multi-layer rain streaks
      float streakFallSpeed = isHeavy ? 16.0 : 12.0;
      float rainLayers = 0.0;
      
      // Layer 1: Fine fast streaks
      vec2 uv1 = rainUv * vec2(120.0, 6.0) + vec2(0.0, uTime * streakFallSpeed);
      vec2 id1 = floor(uv1);
      float h1 = hash21(id1);
      if (h1 > (isHeavy ? 0.82 : 0.90)) {
        float fY = fract(uv1.y);
        float fX = abs(fract(uv1.x) - 0.5);
        float streak = smoothstep(0.35, 0.0, fX) * smoothstep(0.0, 0.15, fY) * smoothstep(1.0, 0.3, fY);
        rainLayers += streak * 0.4;
      }

      // Layer 2: Medium streaks
      vec2 uv2 = rainUv * vec2(60.0, 3.5) + vec2(15.2, uTime * (streakFallSpeed * 0.85));
      vec2 id2 = floor(uv2);
      float h2 = hash21(id2);
      if (h2 > (isHeavy ? 0.84 : 0.92)) {
        float fY2 = fract(uv2.y);
        float fX2 = abs(fract(uv2.x) - 0.5);
        float streak2 = smoothstep(0.3, 0.0, fX2) * smoothstep(0.0, 0.2, fY2) * smoothstep(1.0, 0.4, fY2);
        rainLayers += streak2 * 0.6;
      }

      // Layer 3: Glass water bead droplets & slight refraction
      vec2 dropUv = uv * vec2(28.0, 16.0);
      vec2 dropId = floor(dropUv);
      float dropHash = hash21(dropId);
      float dropletMask = 0.0;
      if (dropHash > 0.88) {
        vec2 dropFract = fract(dropUv) - 0.5;
        // Droplet tear shape running down
        float runOffset = mod(uTime * 0.8 + dropHash * 5.0, 2.0);
        dropFract.y += runOffset * 0.2;
        float dist = length(dropFract);
        dropletMask = smoothstep(0.22, 0.05, dist);
      }

      // Wiper clearing
      float wiper = getWiperMask(uv);
      rainLayers *= (1.0 - wiper * 0.7);
      dropletMask *= (1.0 - wiper * 0.9);

      // Refract background slightly through beads
      if (dropletMask > 0.05) {
        vec2 refractOffset = vec2(sin(uTime * 3.0 + uv.y * 30.0), cos(uTime * 3.0 + uv.x * 30.0)) * 0.008 * dropletMask;
        color = texture2D(tDiffuse, uv + refractOffset);
      }

      // Rain color blend & specular sheen
      vec3 rainColor = vec3(0.85, 0.92, 1.0);
      color.rgb += rainLayers * rainColor * intensity;
      color.rgb += dropletMask * 0.15 * rainColor;

      // Heavy monsoon mist & thunder flash
      if (isHeavy) {
        // Distant mist haze
        float mist = noise2d(uv * 3.0 + vec2(uTime * 0.2, 0.0)) * 0.14;
        color.rgb = mix(color.rgb, vec3(0.55, 0.6, 0.65), mist * intensity);

        // Thunder flash (intermittent realistic flicker)
        float flashCycle = sin(uTime * 0.8);
        if (flashCycle > 0.982) {
          float flashFlicker = sin(uTime * 45.0) * 0.5 + 0.5;
          color.rgb += vec3(0.3, 0.35, 0.45) * flashFlicker * intensity;
        }
      }
    }

    // Render fluttering snowflakes
    void renderSnow(inout vec4 color, vec2 uv, float intensity) {
      float aspect = uResolution.x / uResolution.y;
      vec2 snowUv = uv * vec2(aspect, 1.0);
      
      float snowAccum = 0.0;
      // 3 Layers of depth for snowflakes
      for (int i = 1; i <= 3; i++) {
        float fi = float(i);
        float scale = 14.0 * fi;
        float fallSpeed = 0.7 + fi * 0.45;
        
        vec2 p = snowUv * scale;
        // Sinusoidal wind flutter
        p.x += sin(uTime * 1.5 + p.y * 0.6 + fi * 2.1) * 0.35 + (uSpeed * 0.005 * fi);
        p.y += uTime * fallSpeed;
        
        vec2 id = floor(p);
        float h = hash21(id);
        if (h > 0.76) {
          vec2 f = fract(p) - 0.5;
          float dist = length(f);
          float flake = smoothstep(0.24, 0.02, dist);
          snowAccum += flake * (0.35 + fi * 0.2);
        }
      }

      // Soft white snow glow and cool mountain atmosphere
      vec3 snowCol = vec3(0.96, 0.98, 1.0);
      color.rgb += snowAccum * snowCol * intensity;
      // Slight cool frost vignette on edges
      float frostVignette = length((uv - 0.5) * 1.3);
      color.rgb = mix(color.rgb, vec3(0.8, 0.9, 1.0), smoothstep(0.8, 1.4, frostVignette) * 0.18 * intensity);
    }

    // Render atmospheric valley mist & ghat mountain fog
    void renderFog(inout vec4 color, vec2 uv, float intensity) {
      // Natural depth fog: thicker in middle ground and valleys
      float fogBase = smoothstep(0.95, 0.2, uv.y) * 0.45 + 0.25;
      
      // Moving billows of mountain mist
      vec2 mistCoord = uv * vec2(2.5, 1.8) + vec2(uTime * 0.06, uTime * 0.02);
      float mist1 = noise2d(mistCoord);
      float mist2 = noise2d(mistCoord * 2.2 - vec2(uTime * 0.04, 0.0));
      float billow = (mist1 * 0.6 + mist2 * 0.4);

      float totalFog = clamp((fogBase + billow * 0.35) * intensity * 0.75, 0.0, 0.85);
      
      // Soft ghat fog color (pearly grey with subtle golden ambient scatter)
      vec3 fogColor = vec3(0.72, 0.76, 0.80);
      color.rgb = mix(color.rgb, fogColor, totalFog);
    }

    // Render Thar desert heat shimmer & golden dust
    void renderDesert(inout vec4 color, vec2 uv, float intensity) {
      // Heat wave shimmer mirage over hot asphalt (lower half of screen)
      float roadZone = smoothstep(0.8, 0.35, uv.y) * smoothstep(0.05, 0.3, uv.y);
      if (roadZone > 0.02) {
        float wave = sin(uv.y * 70.0 + uTime * 9.0) * sin(uv.x * 40.0 + uTime * 5.0);
        vec2 shimmerUv = uv + vec2(wave * 0.003 * roadZone * intensity, 0.0);
        color = texture2D(tDiffuse, shimmerUv);
      }

      // Drifting fine desert sand particles
      vec2 sandUv = uv * vec2(uResolution.x / uResolution.y, 1.0) * 35.0;
      sandUv.x -= uTime * (4.5 + uSpeed * 0.03);
      sandUv.y += sin(uTime * 2.0 + sandUv.x * 0.2) * 0.5;
      vec2 sandId = floor(sandUv);
      float sh = hash21(sandId);
      if (sh > 0.94) {
        vec2 sf = fract(sandUv) - 0.5;
        float sandDot = smoothstep(0.2, 0.02, length(sf));
        color.rgb += sandDot * vec3(0.85, 0.7, 0.45) * 0.35 * intensity;
      }

      // Warm golden desert ambiance
      color.rgb = mix(color.rgb, color.rgb * vec3(1.1, 0.98, 0.85), 0.25 * intensity);
    }

    // Render sunny highway heat shimmer & golden warmth
    void renderSunny(inout vec4 color, vec2 uv, float intensity) {
      // Mild asphalt heat ripple on horizon
      float horizonZone = smoothstep(0.42, 0.52, uv.y) * smoothstep(0.65, 0.52, uv.y);
      if (horizonZone > 0.05) {
        float shimmer = sin(uv.y * 90.0 + uTime * 8.0) * 0.0015 * horizonZone * intensity;
        color = texture2D(tDiffuse, uv + vec2(shimmer, 0.0));
      }
      // Rich vibrant contrast
      color.rgb = pow(color.rgb, vec3(0.97));
    }

    void main() {
      vec4 baseColor = texture2D(tDiffuse, vUv);
      vec4 color = baseColor;

      // Dynamically branch based on current weather condition
      if (uWeatherType == 1) {
        // Rainy (standard rain)
        renderRain(color, vUv, uIntensity, false);
      } else if (uWeatherType == 2) {
        // Heavy Monsoon Rain with Thunder & Wind
        renderRain(color, vUv, uIntensity * 1.3, true);
      } else if (uWeatherType == 3) {
        // Snow (Himalayas)
        renderSnow(color, vUv, uIntensity);
      } else if (uWeatherType == 4) {
        // Foggy (Western Ghats / Mountain Passes)
        renderFog(color, vUv, uIntensity);
      } else if (uWeatherType == 5) {
        // Desert (Rajasthan / Thar)
        renderDesert(color, vUv, uIntensity);
      } else {
        // Sunny (Clear Day)
        renderSunny(color, vUv, uIntensity);
      }

      gl_FragColor = color;
    }
  `
};
