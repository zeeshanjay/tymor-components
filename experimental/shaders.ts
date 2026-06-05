/**
 * SHADERS — Sidewave dark palette
 * Deep Midnight Violet scene, cold electric indigo ridges, pure black valleys
 * Directional light for cinematic hill shading
 */

// ── TERRAIN VERTEX ────────────────────────────────────────────────────────────
export const terrainVertexShader = /* glsl */ `
  varying vec3  vWorldPos;
  varying vec3  vWorldNormal;

  // ── 2D NOISE FOR JAGGED MOUNTAIN GEOMETRY ──────────────────────────────────
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float getRidgeDisplacement(vec2 pos) {
    float value = 0.0;
    float amplitude = 0.55;
    float frequency = 0.045;
    for (int i = 0; i < 4; i++) {
      float n = noise(pos * frequency);
      // Ridged noise: absolute value creates sharp peaks
      float r = 1.0 - abs(n * 2.0 - 1.0);
      value += r * r * amplitude;
      frequency *= 2.3;
      amplitude *= 0.46;
    }
    return value * 15.5;
  }

  void main() {
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    
    // Mask displacement: Y = -0.25 is valley (mask = 0), Y = 0.18 is peak (mask = 1)
    float mask = smoothstep(-0.25, 0.18, position.y);
    
    // Displace peaks to add realistic ridged rock shapes, leaving the camera path flat
    float disp = getRidgeDisplacement(vWorldPos.xz * 0.36);
    vWorldPos.y += disp * mask;
    
    vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    gl_Position  = projectionMatrix * viewMatrix * vec4(vWorldPos, 1.0);
  }
`;

// ── TERRAIN FRAGMENT ──────────────────────────────────────────────────────────
// Directional light casts long cinematic shadows — peaks catch cold indigo,
// valleys drop to pure black. Fog blends to deep midnight violet.
export const terrainFragmentShader = /* glsl */ `
  precision highp float;

  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;

  uniform float uWorldMaxY;    // tallest ridge height in world units
  uniform vec3  uColorRidge;   // cold electric indigo (lit peaks)
  uniform vec3  uColorValley;  // total black (shadow valleys)
  uniform vec3  uFogColor;     // deep midnight violet
  uniform vec3  uLightDir;     // directional light direction (FROM light TO scene, normalized)
  uniform float uTime;         // elapsed time in seconds

  // ── 2D NOISE GENERATOR FOR SAND RIPPLES ────────────────────────────────────
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }

  // 4-octave Fractional Brownian Motion (FBM)
  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    vec2 shift = vec2(100.0);
    mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.50));
    for (int i = 0; i < 4; i++) {
      value += amplitude * noise(p);
      p = rot * p * 2.15 + shift;
      amplitude *= 0.47;
    }
    return value;
  }

  // Realistic wind-swept sand height function combining broad dunes and fine ripples
  float getSandHeight(vec2 pos) {
    // 1. Broad organic dunes
    float dunes = fbm(pos * 0.16) * 0.70;
    // 2. Wind-swept micro-ripples (anisotropically stretched along X-axis for wind effect)
    vec2 windUV = vec2(pos.x * 2.2, pos.y * 0.7);
    float windRipples = fbm(windUV) * 0.30;
    // 3. Ultra-fine micro-ripples (keeps the texture detailed and tactile when camera scrolls close)
    vec2 microUV = vec2(pos.x * 6.5, pos.y * 2.5);
    float microRipples = fbm(microUV) * 0.14;
    return dunes + windRipples + microRipples;
  }

  void main() {
    // ── BUMP MAPPED NORMAL PERTURBATION ──────────────────────────────────────
    // Construct local tangent space (TBN) from the base geometry normal
    vec3 N_base = normalize(vWorldNormal);
    vec3 up_vec = abs(N_base.y) < 0.999 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
    vec3 T_base = normalize(cross(up_vec, N_base));
    vec3 B_base = cross(N_base, T_base);
    mat3 tbn = mat3(T_base, B_base, N_base);

    // Calculate height gradient using the sand texture function
    vec2 st = vWorldPos.xz * 1.5;
    float eps = 0.02;
    float h = getSandHeight(st);
    float h_x = getSandHeight(st + vec2(eps, 0.0));
    float h_z = getSandHeight(st + vec2(0.0, eps));

    // Finite difference gradients
    float dh_dx = (h_x - h) / eps;
    float dh_dz = (h_z - h) / eps;

    // Local normal perturbed by noise slopes (scale determines roughness)
    vec3 localN = normalize(vec3(-dh_dx * 0.14, -dh_dz * 0.14, 1.0));
    
    // Transform perturbed normal back to world space
    vec3 N = normalize(tbn * localN);

    // ── DIRECTIONAL LIGHTING ──────────────────────────────────────────────────
    float NdotL = max(dot(N, -uLightDir), 0.0);

    // ── ELEVATION FACTOR ──────────────────────────────────────────────────────
    float elevNorm = clamp(vWorldPos.y / max(uWorldMaxY, 0.001), 0.0, 1.0);

    // ── SURFACE ILLUMINATION & GLOW ───────────────────────────────────────────
    // Valleys are deep and dark; peaks transition to rich indigo
    vec3 baseColor = mix(uColorValley, uColorRidge, smoothstep(0.0, 1.0, elevNorm));
    
    // Soft ambient to prevent pitch black valleys
    float ambient = 0.08;
    
    // Soft light-purple fill light from the opposite direction to paint shadows
    vec3 fillDir = normalize(vec3(0.6, 0.4, -0.6));
    float fillNdotL = max(dot(N, fillDir), 0.0);
    vec3 fillPurple = vec3(0.42, 0.22, 0.68); // soft light purple
    
    vec3 litColor = baseColor * (ambient + NdotL * 1.45) + fillPurple * fillNdotL * 0.55;

    // ── SKY RIBBON DYNAMIC REFLECTION ────────────────────────────────────────
    // Ribbon color shifts and waves over time, matching skyFragmentShader
    float waveCycle = sin(uTime * 0.14) * 0.5 + 0.5;
    vec3 ribbonColor = mix(vec3(0.85, 0.35, 0.88), vec3(0.48, 0.12, 0.85), waveCycle); // matches colPink / colPurple
    float ribbonInten = (0.75 + 0.25 * sin(uTime * 0.50)) * 0.52; // dimmed to match sky flare
    
    // Ribbon is a broad light source coming from top-left-back
    vec3 ribbonLightDir = normalize(vec3(-0.8, -0.6, 0.3));
    float ribbonNdotL = max(dot(N, -ribbonLightDir), 0.0);
    
    // Diffuse bounce + satin specular sheen on the ripples (wider and brighter reflections matching new width)
    vec3 ribbonDiff = ribbonColor * ribbonInten * ribbonNdotL * 0.55;
    vec3 H_ribbon = normalize(-ribbonLightDir + vec3(0.0, 1.0, 0.0));
    float ribbonSpec = pow(max(dot(N, H_ribbon), 0.0), 12.0); // softer shininess for broader reflection
    vec3 ribbonSpecCol = vec3(0.96, 0.84, 1.0); // glowing pink-white highlight matching core white
    
    vec3 ribbonReflection = ribbonDiff + ribbonSpecCol * ribbonSpec * ribbonInten * 0.65;
    litColor += ribbonReflection;

    // Specular Highlight (satin sheen on the sand ripples)
    vec3 H = normalize(-uLightDir + vec3(0.0, 1.0, 0.0));
    float spec = pow(max(dot(N, H), 0.0), 32.0);
    vec3 specColor = vec3(0.88, 0.38, 0.98); // vibrant electric violet-magenta
    litColor += specColor * spec * NdotL * 0.75;

    // Specular Crest (neon-pink edge lighting on mountain silhouettes)
    float crest = pow(1.0 - max(dot(N_base, vec3(0.0, 1.0, 0.0)), 0.0), 5.0) * NdotL;
    litColor += vec3(0.95, 0.45, 0.90) * crest * 0.45;

    // Glowing Peak highlight (illuminates the mountain tops in the distance)
    float peakRim = pow(max(dot(N_base, vec3(0.0, 1.0, 0.0)), 0.0), 2.0) * elevNorm;
    litColor += vec3(0.65, 0.45, 0.95) * peakRim * 0.30;

    // ── DISTANCE FOG (PUSHED BACK FOR DETAILS) ────────────────────────────────
    float dist = length(vWorldPos - cameraPosition);
    float fogAmt = smoothstep(110.0, 360.0, dist);
    vec3 final = mix(litColor, uFogColor, fogAmt * 0.88);

    // ── GROUND FOG (HEIGHT-BASED VALLEY MIST GLIMPSE) ─────────────────────────
    float groundFog = exp(-max(vWorldPos.y - 1.0, 0.0) * 0.08) * 0.42;
    vec3 fogGlow = uFogColor * 1.35;
    final = mix(final, fogGlow, groundFog * (1.0 - fogAmt * 0.5));

    // ── RIGHT-CORNER SUNSET VOLUMETRIC GLOW (FOG GOING UP) ────────────────────
    // Volumetric glow rising near right-far mountains (X = 100, Y = 10, Z = -110)
    float distToSunset = length(vWorldPos - vec3(100.0, 10.0, -110.0));
    float sunsetFog = exp(-distToSunset * 0.016) * 0.65;
    vec3 sunsetColor = vec3(0.92, 0.38, 0.58); // glowing warm pink-orange sunset
    final = mix(final, sunsetColor, sunsetFog * (1.0 - fogAmt * 0.4));

    gl_FragColor = vec4(final, 1.0);
  }
`;

// ── SKY VERTEX ────────────────────────────────────────────────────────────────
export const skyVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// ── SKY FRAGMENT ──────────────────────────────────────────────────────────────
// Deep midnight violet at zenith, faint cool indigo at horizon.
// No bright magenta. Matches the dark Sidewave interior palette.
export const skyFragmentShader = /* glsl */ `
  precision highp float;
  varying vec2  vUv;
  uniform float uTime;

  // Helper for single strand computation
  vec3 getStrand(vec2 uv, float t, float fi, float amp, float speedMult, vec3 colPink, vec3 colPurple) {
    // 1. Compute center curve of the ribbon swoop (starts high, curves down steeply to y ≈ 0.43 on the right)
    float centerCurve = mix(0.43, 1.15, pow(1.0 - uv.x, 3.2));
    
    // 2. Compute spread factor (starts at 0.60 on the left, widens to 1.50 on the right)
    float spread = mix(0.60, 1.50, uv.x);
    
    // 3. Compute base Y position for this specific strand index 'fi' (closer spacing to combine them more)
    float yBase = centerCurve + (fi - 1.5) * 0.024 * spread;
    
    // 4. Wave amplitude scales with the spread factor
    float currentAmp = amp * mix(0.4, 1.3, uv.x);
    
    // Left-to-right wave ripples
    float freq = 2.4 + fi * 0.25;
    float wave = sin(uv.x * freq + t * speedMult + fi * 1.2) * currentAmp
               + cos(uv.x * (freq * 0.45) - t * (0.5 * speedMult) - fi * 1.7) * (currentAmp * 0.6);
               
    wave += sin(uv.x * 10.0 - t * 1.5 + fi * 0.8) * (currentAmp * 0.04);
    
    float dist = uv.y - (yBase + wave);
    
    // Pinch and swell modulation on edges (different frequencies/phases per strand index 'fi')
    float pinchSwell = sin(uv.x * (4.5 + fi * 0.6) - t * 2.2 + fi * 1.5) * 0.5 + 0.5;
    float width = (0.052 + 0.038 * pinchSwell) * spread;
    
    // Core intensity (sharp) + soft glow envelope (medium) + wide ambient glow (soft)
    float core = smoothstep(width * 0.28, 0.0, abs(dist));
    float glow = smoothstep(width * 1.5, 0.0, abs(dist));
    float ambient = smoothstep(width * 3.8, 0.0, abs(dist));
    
    // Soft blend of core, glow and ambient intensities
    float intensity = core * 0.45 + glow * 0.40 + ambient * 0.15;
    
    // Normalized distance from center
    float dNorm = clamp(dist / width, -1.0, 1.0);
    
    // Gradient colors shifting along the length of the ribbon
    float colorShift = sin(uv.x * 2.0 + t * 0.6 + fi * 1.3) * 0.5 + 0.5;
    
    // Saturated purple base colors
    vec3 colDarkPurple = mix(vec3(0.18, 0.02, 0.40), colPurple * 0.38, colorShift); // dark purple side
    vec3 colRightSide  = mix(colPink * 0.85, colPurple * 1.15, colorShift);         // rich pink-purple side
    vec3 baseCol = mix(colDarkPurple, colRightSide, smoothstep(-0.85, 0.85, dNorm));
    
    // Minimal, subtle light purple glow on the edges (starts at 0.85 and has low intensity)
    float edgeLight = smoothstep(0.85, 1.0, abs(dNorm));
    vec3 colEdge = mix(colPink, vec3(0.92, 0.70, 0.98), colorShift);
    baseCol = mix(baseCol, colEdge, edgeLight * 0.38);
    
    // Mini moving white lines: Gaussian highlight pulse traveling from right to left along the ribbon path
    float pulseCenter = 1.3 - fract(t * 0.40 + fi * 0.15) * 1.6;
    float coreHighlight = smoothstep(width * 0.05, 0.0, abs(dist)); // extremely narrow line
    float highlightPulse = smoothstep(0.18, 0.0, abs(uv.x - pulseCenter)) * coreHighlight;
    
    vec3 finalColor = mix(baseCol, vec3(1.0, 0.99, 1.0), highlightPulse * 0.92);
    
    return finalColor * intensity;
  }

  // Animated sky light-flares (procedural)
  vec3 flareColor(vec2 uv, float time) {
    float t = time * 0.10;
    
    vec3 colPink  = vec3(0.85, 0.35, 0.88);
    vec3 colPurple = vec3(0.48, 0.12, 0.85);
    
    // Broad ambient background glow along the swoop curve
    float centerCurve = mix(0.43, 1.15, pow(1.0 - uv.x, 3.2));
    float distToCenter = uv.y - centerCurve;
    float ambientGlow = smoothstep(0.35, 0.0, abs(distToCenter));
    vec3 bgGlow = (colPink * 0.05 + colPurple * 0.02) * (ambientGlow * ambientGlow);
    
    // Combine 4 strands using max()
    vec3 strands = vec3(0.0);
    strands = max(strands, getStrand(uv, t, 0.0, 0.055, 1.2, colPink, colPurple));
    strands = max(strands, getStrand(uv, t, 1.0, 0.060, 1.3, colPink, colPurple));
    strands = max(strands, getStrand(uv, t, 2.0, 0.060, 1.4, colPink, colPurple));
    strands = max(strands, getStrand(uv, t, 3.0, 0.055, 1.5, colPink, colPurple));
    
    return bgGlow + strands * 0.95;
  }


  void main() {
    // Horizon: beautiful warm purple haze matching the fog
    vec3 horizon = vec3(0.48, 0.16, 0.58);  // vibrant purple-magenta
    // Zenith: rich deep midnight violet
    vec3 zenith  = vec3(0.10, 0.03, 0.22); // deep violet-purple

    vec3 color = mix(horizon, zenith, smoothstep(0.0, 1.0, vUv.y));

    // Sunset glow rising from the right-bottom corner (X = 1.0, Y = 0.0)
    float dToCorner = length(vUv - vec2(1.0, 0.0));
    float sunsetGlow = exp(-dToCorner * 1.8); // wider spread
    vec3 glowColor = vec3(0.95, 0.40, 0.65); // glowing warm pink-orange
    color += glowColor * sunsetGlow * 0.65;

    // Add the animated sky energy flares
    color += flareColor(vUv, uTime);

    gl_FragColor = vec4(color, 1.0);
  }
`;

// ── REFRACTION VERTEX (kept for future fluid restoration) ─────────────────────
export const refractVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

// ── REFRACTION FRAGMENT ───────────────────────────────────────────────────────
export const refractFragmentShader = /* glsl */ `
  precision highp float;
  varying vec2      vUv;
  uniform sampler2D uSceneTex;
  uniform sampler2D uVelocityTex;
  uniform float     uDispScale;

  void main() {
    vec2 vel  = texture2D(uVelocityTex, vUv).xy;
    vec2 edge = smoothstep(vec2(0.0), vec2(0.10), vUv)
              * (1.0 - smoothstep(vec2(0.90), vec2(1.0), vUv));
    vec2 uv2  = clamp(vUv + vel * uDispScale * edge.x * edge.y, 0.001, 0.999);
    gl_FragColor = vec4(texture2D(uSceneTex, uv2).rgb, 1.0);
  }
`;
