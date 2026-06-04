"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

type FluidBackgroundProps = {
  /** Fires once the first frame has rendered (used to dismiss the preloader). */
  onReady?: () => void;
  /** Set true to start the 2.5s "push into the void" intro animation. */
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
  PASS 1 — iridescent flowing field (rendered at half-res into an FBO).
  Ashima simplex noise -> fbm -> domain-warped advection.
  Mouse velocity injects a moving, colorful burst. Outputs:
    rgb = background iridescence
    a   = fluid "energy" (luminous band intensity) reused by the composite
          pass to drive the holographic trails that sweep over the assets.
*/
const fluidFragmentShader = /* glsl */ `
  precision highp float;

  varying vec2 vUv;

  uniform float uTime;
  uniform vec2  uResolution;
  uniform vec2  uMouse;     // 0..1, aspect-corrected
  uniform vec2  uMouseVel;  // smoothed velocity
  uniform float uProgress;  // 0 = far in the void, 1 = fully materialized

  // ---- Ashima 2D simplex noise ----------------------------------------
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                          + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy),
                            dot(x12.zw, x12.zw)), 0.0);
    m = m * m; m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * snoise(p);
      p *= 2.0;
      a *= 0.5;
    }
    return v;
  }

  // Inigo Quilez cosine palette -> iridescent cyan / violet / magenta
  vec3 palette(float t) {
    vec3 a = vec3(0.18, 0.10, 0.28);
    vec3 b = vec3(0.55, 0.45, 0.55);
    vec3 c = vec3(1.00, 1.00, 1.00);
    vec3 d = vec3(0.55, 0.85, 0.97); // phase -> cyan/violet/magenta
    return a + b * cos(6.28318 * (c * t + d));
  }

  void main() {
    vec2 uv = vUv;
    float aspect = uResolution.x / uResolution.y;

    // "push into the void": zoom from far (small features) -> close.
    float zoom = mix(2.2, 1.0, uProgress);
    vec2 p = (uv - 0.5) * zoom;
    p.x *= aspect;

    float t = uTime * 0.06;

    // Domain-warped advection for the flowing fluid feel.
    vec2 q = vec2(fbm(p + t), fbm(p + vec2(5.2, 1.3) - t));
    vec2 r = vec2(
      fbm(p + 1.7 * q + vec2(8.3, 2.8) + 0.15 * t),
      fbm(p + 1.7 * q + vec2(2.1, 9.2) - 0.12 * t)
    );

    // Mouse velocity injection -> moving colorful burst.
    // Map mouse into the same warped/zoomed space as p.
    vec2 mp = (uMouse - 0.5) * zoom;
    mp.x *= aspect;
    float speed = clamp(length(uMouseVel) * 9.0, 0.0, 1.0);
    float md = length(p - (mp + uMouseVel * 0.6));
    float burst = exp(-md * 3.2) * (0.25 + 0.9 * speed);
    r += uMouseVel * burst * 2.2;

    float f = fbm(p + 2.0 * r);

    // Build iridescent color from the field.
    float hue = 0.5 + 0.5 * f + 0.25 * r.x + 0.12 * t;
    vec3 col = palette(hue);

    // Fold in flowing brightness bands.
    float bands = smoothstep(-0.2, 0.9, f);
    col *= 0.35 + 0.9 * bands;

    // Deep violet/black base so highlights pop (matches reference tones).
    vec3 base = vec3(0.015, 0.008, 0.03);
    col = mix(base, col, smoothstep(-0.6, 0.8, f));

    // Mouse glow tint.
    col += palette(hue + 0.3) * burst * 0.8;

    // Vignette toward edges for cinematic framing.
    float vig = smoothstep(1.25, 0.25, length((uv - 0.5) * vec2(aspect, 1.0)));
    col *= mix(0.55, 1.0, vig);

    // Subtle film grain to avoid banding on dark gradients.
    float grain = fract(sin(dot(uv * uResolution, vec2(12.9898, 78.233))) * 43758.5453);
    col += (grain - 0.5) * 0.018;

    // Fluid energy -> luminous band intensity + cursor burst.
    float energy = clamp(bands * 0.7 + burst * 1.6, 0.0, 1.0);

    gl_FragColor = vec4(col, energy);
  }
`;

/*
  PASS 2 — full-res composite.
  Ingests the half-res fluid (uFluid), plus the two foreground asset textures
  as sampler2D uniforms. Assets render ON the fluid; then a screen-blend of
  Electric Cyan (#00E5FF) + Cosmic Violet (#7C4DFF) renders OVER the assets
  wherever cursor energy x fluid energy is high -> holographic liquid trails
  sweeping across the human's face / skin / clothing and the landscape.
*/
const compositeFragmentShader = /* glsl */ `
  precision highp float;

  varying vec2 vUv;

  uniform vec2  uResolution;
  uniform vec2  uMouse;
  uniform vec2  uMouseVel;
  uniform float uProgress;

  uniform sampler2D uFluid;
  uniform sampler2D uHuman;
  uniform sampler2D uLandscape;
  uniform float uHasHuman;
  uniform float uHasLandscape;
  uniform vec2  uHumanCenter;
  uniform vec2  uHumanScale;
  uniform vec2  uLandCenter;
  uniform vec2  uLandScale;

  vec3 screenBlend(vec3 a, vec3 b) { return 1.0 - (1.0 - a) * (1.0 - b); }

  // Sample an asset positioned by center/scale in screen-uv space.
  vec4 sampleLayer(sampler2D tex, vec2 uv, vec2 center, vec2 scale, float has) {
    if (has < 0.5) return vec4(0.0);
    vec2 luv = (uv - center) / scale + 0.5;
    if (luv.x < 0.0 || luv.x > 1.0 || luv.y < 0.0 || luv.y > 1.0) return vec4(0.0);
    return texture2D(tex, luv);
  }

  void main() {
    float aspect = uResolution.x / uResolution.y;

    vec4 fluid = texture2D(uFluid, vUv); // rgb = background, a = energy
    vec3 col = fluid.rgb;

    vec4 land = sampleLayer(uLandscape, vUv, uLandCenter, uLandScale, uHasLandscape);
    vec4 hum  = sampleLayer(uHuman, vUv, uHumanCenter, uHumanScale, uHasHuman);

    // Assets sit ON the fluid (slightly darkened so trails read as light).
    col = mix(col, land.rgb * 0.92, land.a);
    col = mix(col, hum.rgb * 0.92, hum.a);
    float assetA = max(land.a, hum.a);

    // Fluid light spills around / behind the silhouettes.
    col += fluid.rgb * 0.14 * assetA;

    // ---- Holographic fluid OVER the assets -----------------------------
    vec3 cyan   = vec3(0.0, 0.898, 1.0);   // #00E5FF
    vec3 violet = vec3(0.486, 0.302, 1.0); // #7C4DFF

    vec2 d = (vUv - uMouse) * vec2(aspect, 1.0);
    float dist = length(d);
    float speed = clamp(length(uMouseVel) * 9.0, 0.0, 1.0);
    float cursorEnergy = exp(-dist * 4.2) * (0.35 + 1.4 * speed);

    float trail = fluid.a;
    // Subtle constant flow over the surface + intense sweep under the cursor.
    float overlay = assetA * clamp((0.16 + cursorEnergy) * trail, 0.0, 1.2);

    vec3 ripple = mix(cyan, violet, clamp(trail, 0.0, 1.0));
    ripple = mix(ripple, fluid.rgb * 2.0, 0.35);
    col = screenBlend(col, ripple * overlay);

    // Intro materialization.
    col *= smoothstep(0.0, 1.0, uProgress);

    gl_FragColor = vec4(col, 1.0);
  }
`;

export default function FluidBackground({ onReady, start }: FluidBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const startRef = useRef<boolean>(!!start);

  // Keep latest `start` without re-running the heavy WebGL effect.
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
    // Perf guardrail: cap DPR at 1.5 to avoid GPU throttling / overheating.
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    renderer.setPixelRatio(dpr);

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // Downsample factor for the noise pass (runs the Simplex grid cool).
    const FLUID_SCALE = 0.5;
    const fluidRT = new THREE.WebGLRenderTarget(2, 2, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      depthBuffer: false,
      stencilBuffer: false,
    });

    // Shared, lerped uniforms (referenced by BOTH passes).
    const uTime = { value: 0 };
    const uResolution = { value: new THREE.Vector2(1, 1) };
    const uMouse = { value: new THREE.Vector2(0.5, 0.5) };
    const uMouseVel = { value: new THREE.Vector2(0, 0) };
    const uProgress = { value: 0 };

    // ---- PASS 1: fluid (half-res) ---------------------------------------
    const fluidScene = new THREE.Scene();
    const fluidMat = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader: fluidFragmentShader,
      uniforms: { uTime, uResolution, uMouse, uMouseVel, uProgress },
      depthTest: false,
      depthWrite: false,
    });
    const fluidQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), fluidMat);
    fluidScene.add(fluidQuad);

    // ---- PASS 2: composite (full-res) -----------------------------------
    const HUMAN_H = 0.52; // human height as fraction of screen height
    const LAND_H = 0.34;
    const humanCenterBase = new THREE.Vector2(0.5, 0.36);
    const landCenterBase = new THREE.Vector2(0.5, 0.15);
    let humanAspect = 0.582; // updated on texture load
    let landAspect = 3.43;

    const compositeUniforms = {
      uResolution,
      uMouse,
      uMouseVel,
      uProgress,
      uFluid: { value: fluidRT.texture },
      uHuman: { value: null as THREE.Texture | null },
      uLandscape: { value: null as THREE.Texture | null },
      uHasHuman: { value: 0 },
      uHasLandscape: { value: 0 },
      uHumanCenter: { value: humanCenterBase.clone() },
      uHumanScale: { value: new THREE.Vector2(0.3, HUMAN_H) },
      uLandCenter: { value: landCenterBase.clone() },
      uLandScale: { value: new THREE.Vector2(0.9, LAND_H) },
    };

    const scene = new THREE.Scene();
    const compositeMat = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader: compositeFragmentShader,
      uniforms: compositeUniforms,
      depthTest: false,
      depthWrite: false,
    });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), compositeMat);
    scene.add(quad);

    // Keep asset scales correct for the current screen aspect ratio.
    const computeScales = () => {
      const a = window.innerWidth / window.innerHeight;
      compositeUniforms.uHumanScale.value.set((HUMAN_H * humanAspect) / a, HUMAN_H);
      compositeUniforms.uLandScale.value.set((LAND_H * landAspect) / a, LAND_H);
    };

    // ---- asset ingestion via TextureLoader ------------------------------
    const loader = new THREE.TextureLoader();
    loader.load(
      "/realistic-human.webp",
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        if (tex.image) humanAspect = tex.image.width / tex.image.height;
        compositeUniforms.uHuman.value = tex;
        compositeUniforms.uHasHuman.value = 1;
        computeScales();
      },
      undefined,
      () => console.warn("[Tymor] /realistic-human.webp missing in /public — fluid renders alone."),
    );
    loader.load(
      "/landscape-surface.webp",
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        if (tex.image) landAspect = tex.image.width / tex.image.height;
        compositeUniforms.uLandscape.value = tex;
        compositeUniforms.uHasLandscape.value = 1;
        computeScales();
      },
      undefined,
      () => console.warn("[Tymor] /landscape-surface.webp missing in /public — fluid renders alone."),
    );

    // ---- sizing ----------------------------------------------------------
    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      renderer.setSize(w, h, false);
      uResolution.value.set(w * dpr, h * dpr);
      fluidRT.setSize(
        Math.max(2, Math.floor(w * dpr * FLUID_SCALE)),
        Math.max(2, Math.floor(h * dpr * FLUID_SCALE)),
      );
      computeScales();
    };
    resize();
    window.addEventListener("resize", resize);

    // ---- pointer (mouse + touch) ----------------------------------------
    const targetMouse = new THREE.Vector2(0.5, 0.5);
    const lastMouse = new THREE.Vector2(0.5, 0.5);
    const targetVel = new THREE.Vector2(0, 0);

    const setFromClient = (cx: number, cy: number) => {
      const x = cx / window.innerWidth;
      const y = 1.0 - cy / window.innerHeight; // flip to GL coords
      targetVel.set(x - lastMouse.x, y - lastMouse.y);
      lastMouse.set(x, y);
      targetMouse.set(x, y);
    };
    const onPointerMove = (e: PointerEvent) => setFromClient(e.clientX, e.clientY);
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    // ---- intro animation (2.5s ease) ------------------------------------
    let introStart = 0;
    const INTRO_MS = 2500;

    // ---- render loop -----------------------------------------------------
    let raf = 0;
    let firstFrame = true;
    const clock = new THREE.Clock();

    const tick = () => {
      const dt = clock.getDelta();
      uTime.value += dt;

      // Smooth mouse + decay velocity.
      uMouse.value.lerp(targetMouse, 0.12);
      uMouseVel.value.lerp(targetVel, 0.15);
      targetVel.multiplyScalar(0.9); // decay injected velocity
      uMouseVel.value.multiplyScalar(0.96);

      // Micro-damped parallax: nearer human shifts more than the landscape.
      const mx = uMouse.value.x - 0.5;
      const my = uMouse.value.y - 0.5;
      compositeUniforms.uHumanCenter.value.set(
        humanCenterBase.x + mx * 0.045,
        humanCenterBase.y + my * 0.028,
      );
      compositeUniforms.uLandCenter.value.set(
        landCenterBase.x + mx * 0.016,
        landCenterBase.y + my * 0.01,
      );

      // Drive intro progress.
      if (startRef.current) {
        if (introStart === 0) introStart = performance.now();
        const elapsed = performance.now() - introStart;
        const tNorm = Math.min(elapsed / INTRO_MS, 1);
        // easeInOutCubic
        const eased =
          tNorm < 0.5
            ? 4 * tNorm * tNorm * tNorm
            : 1 - Math.pow(-2 * tNorm + 2, 3) / 2;
        uProgress.value = eased;
      }

      // PASS 1 -> half-res fluid FBO, PASS 2 -> screen composite.
      renderer.setRenderTarget(fluidRT);
      renderer.render(fluidScene, camera);
      renderer.setRenderTarget(null);
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
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      fluidQuad.geometry.dispose();
      fluidMat.dispose();
      quad.geometry.dispose();
      compositeMat.dispose();
      fluidRT.dispose();
      compositeUniforms.uHuman.value?.dispose();
      compositeUniforms.uLandscape.value?.dispose();
      renderer.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 1,
        display: "block",
        pointerEvents: "auto",
      }}
    />
  );
}
