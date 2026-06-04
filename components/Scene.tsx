"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { FluidSim } from "./FluidSim";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type SceneProps = {
  onReady?: () => void;
  start?: boolean;
};

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

/*
  UNIFIED MASTER SHADER
  ---------------------
  A single fullscreen composite drives the whole cinematic, staged by the
  scroll-driven uTransition (0 -> 1):

    Stage A  (0.00 - 0.50)  Wide hero: landscape + animated sky flares +
                            far person. Camera pushes toward the eye anchor.
    Stage B  (0.40 - 0.62)  Crossfade into the high-res macro eye texture,
                            continuing to zoom toward the pupil.
    Stage C  (0.60 - 1.00)  Radial pupil warp; the new-world texture
                            materializes out of the expanding black pupil.

  A subtle cursor ripple (displacement + faint cyan/violet tint) stays active
  across every stage. Everything is one pass, DPR capped, to run cool.
*/
const fragmentShader = /* glsl */ `
  precision highp float;

  varying vec2 vUv;

  uniform float uTime;
  uniform vec2  uResolution;
  uniform vec2  uMouse;
  uniform vec2  uMouseVel;
  uniform float uProgress;       // intro fade 0 -> 1
  uniform float uTransition;     // scroll 0 -> 1
  uniform float uWarpIntensity;  // pupil warp scalar
  uniform sampler2D uVelocity;   // Navier-Stokes velocity field (FluidSim)
  uniform float uDispScale;      // refraction strength
  uniform float uVelScale;       // velocity -> energy mapping
  uniform float uBlurScale;      // directional blur scale

  uniform sampler2D uLandscape;
  uniform sampler2D uHuman;       // profile view
  uniform sampler2D uHumanFront;  // forward view
  uniform sampler2D uEye;
  uniform sampler2D uNewWorld;
  uniform float uHasHuman;
  uniform float uHasFront;
  uniform float uLandAspect;
  uniform float uEyeAspect;
  uniform float uNewWorldAspect;
  uniform float uHumanAspect;
  uniform float uHumanFrontAspect;
  uniform vec2  uPersonCenter;
  uniform float uPersonHeight;
  uniform vec2  uEyeAnchor;

  // background-size: cover mapping
  vec2 coverUv(vec2 uv, float texAspect, float scrAspect) {
    float r = scrAspect / texAspect;
    vec2 scale = r > 1.0 ? vec2(1.0, 1.0 / r) : vec2(r, 1.0);
    return (uv - 0.5) * scale + 0.5;
  }

  vec4 sampleLayer(sampler2D tex, vec2 uv, vec2 center, vec2 scale, float has) {
    if (has < 0.5) return vec4(0.0);
    vec2 luv = (uv - center) / scale + 0.5;
    if (luv.x < 0.0 || luv.x > 1.0 || luv.y < 0.0 || luv.y > 1.0) return vec4(0.0);
    return texture2D(tex, luv);
  }

  // Helper for single strand computation
  vec3 getStrand(vec2 uv, float t, float fi, float amp, float speedMult, vec3 colPink, vec3 colPurple) {
    // 1. Compute center curve of the ribbon swoop (starts high at y ≈ 0.94, curves down to y ≈ 0.65 on the right)
    float centerCurve = mix(0.65, 0.94, pow(1.0 - uv.x, 1.4));
    
    // 2. Compute spread factor (starts at 0.5 on the left, widens to 1.4 on the right)
    float spread = mix(0.50, 1.40, uv.x);
    
    // 3. Compute base Y position for this specific strand index 'fi'
    float yBase = centerCurve + (fi - 2.0) * 0.022 * spread;
    
    // 4. Wave amplitude scales with the spread factor
    float currentAmp = amp * mix(0.5, 1.25, uv.x);
    
    // Wave with lower frequency (wide waves) and organic weave
    float freq = 3.2 + fi * 0.3;
    float wave = sin(uv.x * freq - t * speedMult + fi * 1.2) * currentAmp
               + cos(uv.x * (freq * 0.45) + t * (0.5 * speedMult) - fi * 1.7) * (currentAmp * 0.6);
               
    // Very subtle secondary wave for slight organic variance (no harsh jaggedness)
    wave += sin(uv.x * 12.0 + t * 2.0 + fi * 0.8) * (currentAmp * 0.05);
    
    float dist = uv.y - (yBase + wave);
    
    // Significantly increased base thickness to make strands look like wide flares rather than thin wires
    float width = (0.016 + 0.006 * sin(uv.x * 3.0 + t * 1.0 + fi * 2.0)) * spread;
    
    // Core intensity (sharp) + soft glow envelope (medium) + wide ambient glow (soft)
    // To make the white core very thin, we use a much smaller width (width * 0.15) for the core step
    float core = smoothstep(width * 0.15, 0.0, abs(dist));
    float glow = smoothstep(width * 1.5, 0.0, abs(dist));
    float ambient = smoothstep(width * 5.0, 0.0, abs(dist));
    
    // High-frequency energy ripples inside the strand (makes the light shimmer)
    float ripple = sin(uv.x * 50.0 - t * 15.0 + fi * 3.2) * 0.5 + 0.5;
    
    // Soft blend of core, glow and ambient intensities (lowered values to be less bright and more transparent)
    float intensity = core * 0.30 + glow * 0.45 + ambient * 0.25;
    intensity *= 0.80 + 0.20 * ripple;
    
    // Iridescent shifting colors along the length (vivid violet, royal purple, and electric indigo tones)
    float colorShift = sin(uv.x * 2.5 - t * 0.5 + fi * 1.1) * 0.5 + 0.5;
    vec3 strandColor = mix(colPink, colPurple, colorShift);
    
    // Extremely subtle, thin core white to prevent the flare from looking like a bright white laser
    vec3 coreWhite = vec3(0.96, 0.92, 1.0) * (core * core * core) * 0.18;
    
    return strandColor * intensity + coreWhite;
  }

  // Animated sky light-flares (procedural — no asset).
  vec3 flareColor(vec2 uv) {
    float t = uTime * 0.15; // speed of the ribbon flow
    
    // More Purple palette (saturated orchid purple and deep royal violet)
    vec3 colorPink = vec3(0.78, 0.22, 0.98);   // Vibrant Orchid Purple
    vec3 colorPurple = vec3(0.38, 0.04, 0.88); // Deep Royal Violet
    
    // Add a broad ambient background glow along the swoop curve to glue the strands together (softened intensity)
    float centerCurve = mix(0.65, 0.94, pow(1.0 - uv.x, 1.4));
    float distToCenter = uv.y - centerCurve;
    float ambientGlow = smoothstep(0.18, 0.0, abs(distToCenter));
    vec3 acc = (colorPink * 0.04 + colorPurple * 0.02) * (ambientGlow * ambientGlow);
    
    // Accumulate the 5 weaving colored strands manually (dynamic swoop and spread)
    acc += getStrand(uv, t, 0.0, 0.055, 1.5, colorPink, colorPurple);
    acc += getStrand(uv, t, 1.0, 0.058, 1.6, colorPink, colorPurple);
    acc += getStrand(uv, t, 2.0, 0.061, 1.7, colorPink, colorPurple);
    acc += getStrand(uv, t, 3.0, 0.058, 1.8, colorPink, colorPurple);
    acc += getStrand(uv, t, 4.0, 0.055, 1.9, colorPink, colorPurple);
    
    // Overall brightness/opacity scaling (reduced from 0.80 to 0.45 to match sidewave's soft glow opacity)
    return acc * 0.45;
  }

  // Returns rgb in .xyz and the human coverage (alpha) in .w.
  // uvZoom is the zoomed texture UV; uvScreen is the viewport UV for the sky ribbon.
  vec4 heroColor(vec2 uvZoom, vec2 uvScreen, float aspect) {
    vec2 lUv = coverUv(uvZoom, uLandAspect, aspect);
    vec3 col = texture2D(uLandscape, lUv).rgb;

    // Sky mask: prevent wave dips from fading by expanding transition range to [0.40, 0.55]
    float sky = smoothstep(0.40, 0.55, uvScreen.y);
    col += flareColor(uvScreen) * sky;

    // Turn cross-dissolve: profile -> front, calibrated mid-zoom so it reads
    // as the man physically turning his head toward the viewer (not a blink).
    float turn = smoothstep(0.08, 0.42, uTransition);
    turn = turn * turn * (3.0 - 2.0 * turn); // extra smootherstep easing

    // Subtle positional shift sells the posture change during the dissolve.
    vec2 nudge = vec2(0.012 * (1.0 - turn), 0.0);

    vec2 scaleP = vec2((uPersonHeight * uHumanAspect) / aspect, uPersonHeight);
    vec4 prof = sampleLayer(uHuman, uvZoom + nudge, uPersonCenter, scaleP, uHasHuman);

    vec2 scaleF = vec2((uPersonHeight * uHumanFrontAspect) / aspect, uPersonHeight);
    vec4 front = sampleLayer(uHumanFront, uvZoom, uPersonCenter, scaleF, uHasFront);

    // Blend the two poses (rgb AND alpha) for a seamless cross-dissolve.
    vec3 hcol = mix(prof.rgb, front.rgb, turn);
    float ha = mix(prof.a, front.a, turn);

    col = mix(col, hcol, ha);
    return vec4(col, ha);
  }

  void main() {
    float aspect = uResolution.x / uResolution.y;

    // ---- real fluid velocity field (Navier-Stokes, FluidSim) ----------
    // The solver gives a divergence-free velocity field that SWIRLS and
    // SPREADS smoothly (pressure projection), so disturbances flow & trail
    // instead of popping. We REFRACT the background with it: every colour
    // you see is the landscape itself, dragged by the fluid.
    vec2 vel = texture2D(uVelocity, vUv).xy;
    float vmag = length(vel);
    // deadzone: ignore tiny residual velocity so the image is CLEAN when idle,
    // but low enough that the small cursor splat actually registers.
    float gate = smoothstep(0.2, 4.0, vmag);
    vel *= gate;
    vmag *= gate;
    float energy = clamp(vmag * uVelScale, 0.0, 1.0);
    vec2 disp = vel * uDispScale;       // small geometric refraction (uv space)
    vec2 uv = vUv + disp;               // used by later stages (eye/newworld)

    // ---- Stage A: hero + camera push, refracted with chromatic split --
    float pPush = smoothstep(0.0, 0.5, uTransition);
    float zoomA = mix(1.0, 7.0, pPush);
    vec2 camUv = uEyeAnchor + (vUv - uEyeAnchor) / zoomA;

    // ---- directional glass-blur & chromatic dispersion split -----------
    // We blur the background along the fluid velocity vector to simulate a thick
    // liquid-glass magnification trail, with a subtle chromatic dispersion split.
    vec2 vdirN = vmag > 1e-4 ? vel / vmag : vec2(0.0);
    vec2 caOff = vdirN * energy * 0.005;             // extremely subtle premium color split
    
    vec2 blurStep = vel * uBlurScale;
    
    // Center tap with chromatic split:
    vec2 uvZoom_0 = camUv + disp;
    vec2 uvScreen_0 = vUv + disp;
    
    vec3 centerCol = vec3(
      heroColor(uvZoom_0 + caOff, uvScreen_0 + caOff, aspect).r,
      heroColor(uvZoom_0,         uvScreen_0,         aspect).g,
      heroColor(uvZoom_0 - caOff, uvScreen_0 - caOff, aspect).b
    );

    vec3 col = vec3(0.0);
    // 3-tap Gaussian directional blur along the flow vector (weights sum to 1.0)
    col += heroColor(uvZoom_0 - blurStep, uvScreen_0 - blurStep, aspect).rgb * 0.25;
    col += centerCol * 0.50;
    col += heroColor(uvZoom_0 + blurStep, uvScreen_0 + blurStep, aspect).rgb * 0.25;
    
    float humanMask = heroColor(uvZoom_0, uvScreen_0, aspect).w;

    // ---- Stage B: crossfade into macro eye, zoom to pupil --------------
    float eyeMix = smoothstep(0.45, 0.62, uTransition);
    float pEye = smoothstep(0.55, 1.0, uTransition);
    float zoomE = mix(1.0, 5.5, pEye);
    vec2 eyeUv = coverUv(0.5 + (uv - 0.5) / zoomE, uEyeAspect, aspect);
    vec3 eyeCol = texture2D(uEye, eyeUv).rgb;
    col = mix(col, eyeCol, eyeMix);

    // ---- Stage C: pupil warp + new-world reveal ------------------------
    float pWarp = smoothstep(0.6, 1.0, uTransition);
    vec2 c = uv - 0.5;
    float rad = length(c);
    vec2 warped = uv + normalize(c + 1e-5) *
                  sin(rad * 9.0 - uTime * 1.5) * 0.03 * pWarp * uWarpIntensity;
    vec2 nwUv = coverUv(warped, uNewWorldAspect, aspect);
    vec3 nw = texture2D(uNewWorld, nwUv).rgb;

    float eyeLum = dot(eyeCol, vec3(0.3333));
    float pupilWindow = smoothstep(0.18, 0.0, eyeLum) * pWarp; // dark pupil -> portal
    float takeover = smoothstep(0.9, 1.0, uTransition);
    float nwMix = clamp(max(pupilWindow * 1.5, takeover), 0.0, 1.0);
    col = mix(col, nw, nwMix);

    // ---- intro fade from black -----------------------------------------
    col *= smoothstep(0.0, 1.0, uProgress);

    // ---- grain ----------------------------------------------------------
    float grain = fract(sin(dot(vUv * uResolution, vec2(12.9898, 78.233))) * 43758.5453);
    col += (grain - 0.5) * 0.015;

    gl_FragColor = vec4(col, 1.0);
  }
`;

export default function Scene({ onReady, start }: SceneProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const startRef = useRef<boolean>(!!start);

  useEffect(() => {
    startRef.current = !!start;
  }, [start]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
      powerPreference: "high-performance",
    });
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5); // perf guardrail
    renderer.setPixelRatio(dpr);

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const scene = new THREE.Scene();

    const uniforms = {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uMouseVel: { value: new THREE.Vector2(0, 0) },
      uProgress: { value: 0 },
      uTransition: { value: 0 },
      uWarpIntensity: { value: 1.0 },
      uVelocity: { value: null as THREE.Texture | null },
      uDispScale: { value: 0.0005 },
      uVelScale: { value: 0.06 },
      uBlurScale: { value: 0.00015 },
      uLandscape: { value: null as THREE.Texture | null },
      uHuman: { value: null as THREE.Texture | null },
      uHumanFront: { value: null as THREE.Texture | null },
      uEye: { value: null as THREE.Texture | null },
      uNewWorld: { value: null as THREE.Texture | null },
      uHasHuman: { value: 0 },
      uHasFront: { value: 0 },
      uLandAspect: { value: 1.778 },
      uEyeAspect: { value: 1.0 },
      uNewWorldAspect: { value: 1.778 },
      uHumanAspect: { value: 0.582 },
      uHumanFrontAspect: { value: 0.582 },
      uPersonCenter: { value: new THREE.Vector2(0.5, 0.38) },
      uPersonHeight: { value: 0.14 },
      uEyeAnchor: { value: new THREE.Vector2(0.5, 0.42) },
    };

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      depthTest: false,
      depthWrite: false,
    });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(quad);

    // ---- real Navier-Stokes fluid solver -------------------------------
    const fluid = new FluidSim(renderer);
    uniforms.uVelocity.value = fluid.velocityTexture;

    // ---- asset ingestion -------------------------------------------------
    const loader = new THREE.TextureLoader();
    const loadInto = (
      url: string,
      key: "uLandscape" | "uHuman" | "uHumanFront" | "uEye" | "uNewWorld",
      onAspect?: (a: number) => void,
    ) => {
      loader.load(
        url,
        (tex) => {
          if (tex.image && onAspect) onAspect(tex.image.width / tex.image.height);
          uniforms[key].value = tex;
          if (key === "uHuman") uniforms.uHasHuman.value = 1;
          if (key === "uHumanFront") uniforms.uHasFront.value = 1;
        },
        undefined,
        () => console.warn(`[Tymor] ${url} missing in /public`),
      );
    };
    loadInto("/landscape.webp", "uLandscape", (a) => (uniforms.uLandAspect.value = a));
    loadInto("/realistic-human.webp", "uHuman", (a) => (uniforms.uHumanAspect.value = a));
    loadInto(
      "/realistic-human-front-view.webp",
      "uHumanFront",
      (a) => (uniforms.uHumanFrontAspect.value = a),
    );
    loadInto("/human-eye-macro.webp", "uEye", (a) => (uniforms.uEyeAspect.value = a));
    loadInto("/new-world-bg.webp", "uNewWorld", (a) => (uniforms.uNewWorldAspect.value = a));

    // ---- sizing ----------------------------------------------------------
    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      renderer.setSize(w, h, false);
      uniforms.uResolution.value.set(w * dpr, h * dpr);
      fluid.resize(w, h);
    };
    resize();
    window.addEventListener("resize", resize);

    // ---- pointer ---------------------------------------------------------
    const targetMouse = new THREE.Vector2(0.5, 0.5);
    const lastMouse = new THREE.Vector2(0.5, 0.5);
    const targetVel = new THREE.Vector2(0, 0);
    // Pending splat injected into the fluid on the next frame.
    const splatQueue: { x: number; y: number; dx: number; dy: number }[] = [];
    let pointerInit = false;
    const setFromClient = (cx: number, cy: number) => {
      const x = cx / window.innerWidth;
      const y = 1.0 - cy / window.innerHeight;
      if (pointerInit) {
        const dx = x - lastMouse.x;
        const dy = y - lastMouse.y;
        if (dx !== 0 || dy !== 0) splatQueue.push({ x, y, dx, dy });
      }
      pointerInit = true;
      targetVel.set(x - lastMouse.x, y - lastMouse.y);
      lastMouse.set(x, y);
      targetMouse.set(x, y);
    };
    const onPointerMove = (e: PointerEvent) => setFromClient(e.clientX, e.clientY);
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    // ---- touchpad/trackpad pinch-to-zoom mapping to window scroll -------
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        window.scrollBy({
          top: -e.deltaY * 2.5,
          behavior: "auto",
        });
      }
    };
    window.addEventListener("wheel", handleWheel, { passive: false });

    // ---- GSAP ScrollTrigger transition timeline -------------------------
    let targetTransition = 0;
    const st = ScrollTrigger.create({
      start: 0,
      end: () => ScrollTrigger.maxScroll(window),
      scrub: true,
      onUpdate: (self) => {
        targetTransition = self.progress;
      },
    });
    // Recompute scroll bounds after layout settles.
    const refreshId = window.setTimeout(() => ScrollTrigger.refresh(), 300);

    // ---- intro -----------------------------------------------------------
    let introStart = 0;
    const INTRO_MS = 1600;

    // ---- render loop -----------------------------------------------------
    let raf = 0;
    let firstFrame = true;
    const clock = new THREE.Clock();

    const tick = () => {
      const dt = clock.getDelta();
      uniforms.uTime.value += dt;

      uniforms.uMouse.value.lerp(targetMouse, 0.12);
      uniforms.uMouseVel.value.lerp(targetVel, 0.15);
      targetVel.multiplyScalar(0.9);
      uniforms.uMouseVel.value.multiplyScalar(0.96);

      // Smooth the scroll-driven transition.
      uniforms.uTransition.value += (targetTransition - uniforms.uTransition.value) * 0.08;

      // ---- Navier-Stokes fluid solve ----------------------------------
      // Inject any pointer movement as momentum, then step the solver.
      for (let i = 0; i < splatQueue.length; i++) {
        const s = splatQueue[i];
        fluid.splat(s.x, s.y, s.dx, s.dy);
      }
      splatQueue.length = 0;
      fluid.update(dt);
      uniforms.uVelocity.value = fluid.velocityTexture;

      if (startRef.current) {
        if (introStart === 0) introStart = performance.now();
        const tNorm = Math.min((performance.now() - introStart) / INTRO_MS, 1);
        uniforms.uProgress.value = tNorm < 0.5
          ? 4 * tNorm * tNorm * tNorm
          : 1 - Math.pow(-2 * tNorm + 2, 3) / 2;
      }

      renderer.render(scene, camera);

      if (firstFrame) {
        firstFrame = false;
        onReady?.();
      }
      raf = requestAnimationFrame(tick);
    };
    tick();

    // ---- cleanup ---------------------------------------------------------
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(refreshId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("wheel", handleWheel);
      st.kill();
      quad.geometry.dispose();
      material.dispose();
      fluid.dispose();
      uniforms.uLandscape.value?.dispose();
      uniforms.uHuman.value?.dispose();
      uniforms.uHumanFront.value?.dispose();
      uniforms.uEye.value?.dispose();
      uniforms.uNewWorld.value?.dispose();
      renderer.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 1,
        display: "block",
        pointerEvents: "none",
      }}
    />
  );
}
