"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import {
  terrainVertexShader,
  terrainFragmentShader,
  skyVertexShader,
  skyFragmentShader,
} from "./shaders";

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
// Camera Z travel range: scroll from top (Z_START) to bottom (Z_END)
const Z_START = 90;   // camera far back showing full desert
const Z_END   = 45;   // camera stops mid-way (decreased travel distance)

// Directional light direction (shining forward into the screen)
const LIGHT_DIR = new THREE.Vector3(-0.5, -0.6, -0.6).normalize();

// Sidewave dark palette
const COLOR_RIDGE  = new THREE.Color("#6c3ebd"); // vibrant light purple
const COLOR_VALLEY = new THREE.Color("#15092b"); // dark violet-purple
const FOG_COLOR    = new THREE.Color("#412275"); // beautiful purple fog matching horizon

type Scene3DProps = { onReady?: () => void; start?: boolean };

export default function Scene3D({ onReady }: Scene3DProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  useEffect(() => {
    window.addEventListener("error",              (e) => setErrorText(e.message));
    window.addEventListener("unhandledrejection", (e) => setErrorText(String(e.reason)));
    if (!canvasRef.current) return;

    // ── RENDERER ──────────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    const dpr = Math.min(window.devicePixelRatio, 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    // Background matches fog — deep midnight violet
    renderer.setClearColor(FOG_COLOR, 1);

    // ── SCENE + FOG ───────────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.background = FOG_COLOR;
    scene.fog = new THREE.Fog(FOG_COLOR, 60, 260);

    // ── CAMERA ───────────────────────────────────────────────────────────────
    let worldMaxY = 3.5;       // updated after GLB loads
    let currentCamY = 8.0;     // camera height, updated dynamically
    let currentLookAtY = 6.0;  // lookAt height, updated dynamically

    const camera = new THREE.PerspectiveCamera(
      62,
      window.innerWidth / window.innerHeight,
      0.05,
      6000
    );
    camera.position.set(0, currentCamY, Z_START);
    camera.lookAt(0, 5.0, Z_START - 160);

    // ── RAYCASTER FOR GROUND HEIGHT ──────────────────────────────────────────
    let terrainMesh: THREE.Mesh | null = null;
    const raycaster = new THREE.Raycaster();
    const downVec = new THREE.Vector3(0, -1, 0);

    const getTerrainHeight = (x: number, z: number): number => {
      if (!terrainMesh) return 0;
      const cx = Math.max(Math.min(x, 128), -128);
      const cz = Math.max(Math.min(z, 128), -128);
      raycaster.set(new THREE.Vector3(cx, 1000, cz), downVec);
      const intersects = raycaster.intersectObject(terrainMesh);
      if (intersects.length > 0) {
        return intersects[0].point.y;
      }
      return 0;
    };

    // ── SKY PLANE ─────────────────────────────────────────────────────────────
    const skyGeo = new THREE.PlaneGeometry(4000, 2000);
    const skyMat = new THREE.ShaderMaterial({
      vertexShader:   skyVertexShader,
      fragmentShader: skyFragmentShader,
      uniforms: { uTime: { value: 0 } },
      depthWrite: false,
    });
    const skyMesh = new THREE.Mesh(skyGeo, skyMat);
    skyMesh.position.set(0, 200, -1000);
    scene.add(skyMesh);

    // ── TERRAIN MATERIAL ──────────────────────────────────────────────────────
    const terrainMat = new THREE.ShaderMaterial({
      vertexShader:   terrainVertexShader,
      fragmentShader: terrainFragmentShader,
      uniforms: {
        uTime:       { value: 0 },
        uWorldMaxY:  { value: worldMaxY },
        uColorRidge: { value: COLOR_RIDGE.clone() },
        uColorValley:{ value: COLOR_VALLEY.clone() },
        uFogColor:   { value: FOG_COLOR.clone() },
        // Directional light: from position (10,2,-10) toward origin
        uLightDir:   { value: LIGHT_DIR.clone() },
      },
      depthWrite: true,
      side: THREE.DoubleSide,
    });

    // ── LOAD GLB ──────────────────────────────────────────────────────────────
    new GLTFLoader().load(
      "/landscape.glb",
      (gltf) => {
        // XZ: wide desert floor. Y: tall enough for mountain silhouettes.
        gltf.scene.scale.set(130, 32.0, 130);
        gltf.scene.updateMatrixWorld(true);

        const box  = new THREE.Box3().setFromObject(gltf.scene);
        const size = box.getSize(new THREE.Vector3());
        const min  = box.min;

        console.log("GLB bounds → Min:", box.min, "Max:", box.max);

        // Centre XZ, lift valley floor to Y = 0, and shift forward +45.0 on Z to bring mountains closer
        gltf.scene.position.set(
          -(min.x + size.x / 2),
          -min.y,
          -(min.z + size.z / 2) + 45.0
        );
        gltf.scene.updateMatrixWorld(true);

        gltf.scene.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.material = terrainMat;
            terrainMesh = child;
          }
        });

        worldMaxY = box.max.y - min.y;
        terrainMat.uniforms.uWorldMaxY.value = worldMaxY;

        // Snap initial camera and lookAt heights to ground
        const initGroundY = getTerrainHeight(0, Z_START);
        currentCamY = initGroundY + 9.5;
        camera.position.set(0, currentCamY, Z_START);

        const initLookY = getTerrainHeight(0, Z_START - 110);
        currentLookAtY = initLookY + 5.5;
        camera.lookAt(0, currentLookAtY, Z_START - 160);

        scene.add(gltf.scene);
        onReady?.();
      },
      undefined,
      (err) => console.error("[GLB]", err)
    );

    // ── SCROLL → CAMERA Z ────────────────────────────────────────────────────
    // targetZ is set by the scroll listener and lerped toward each frame.
    // Formula: targetZ = initialZ - scrollY * scrollSpeed
    // This means: the more you scroll down, the further forward the camera moves.
    const scrollSpeed = 0.08;  // units of Z per pixel of scroll
    const easeFactor  = 0.05;  // lower = smoother glide (0.05 ≈ 20-frame ease)
    let   targetCamZ  = Z_START; // starts at Z_START (camera far back)

    const onScroll = () => {
      // Subtract scrollY*speed from the initial Z — camera pushes forward on scroll
      const rawZ = Z_START - window.scrollY * scrollSpeed;
      // Clamp so camera never travels past Z_END (prevents phasing through terrain)
      targetCamZ = Math.max(rawZ, Z_END);
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    // ── RESIZE ────────────────────────────────────────────────────────────────
    const resize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight, false);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", resize);

    // ── MOUSE (subtle parallax only) ──────────────────────────────────────────
    const mouse  = new THREE.Vector2(0, 0);
    const mTgt   = new THREE.Vector2(0, 0);
    window.addEventListener("mousemove", (e: MouseEvent) => {
      mTgt.set(
        (e.clientX / window.innerWidth)  * 2 - 1,
        (e.clientY / window.innerHeight) * 2 - 1
      );
    }, { passive: true });

    // ── RENDER LOOP ───────────────────────────────────────────────────────────
    let raf = 0;
    const clock = new THREE.Clock();

    const tick = () => {
      const dt = clock.getDelta();
      const t  = clock.getElapsedTime();

      skyMat.uniforms.uTime.value     = t;
      terrainMat.uniforms.uTime.value = t;

      // Smooth mouse lag
      mouse.lerp(mTgt, 0.04);

      // ── CAMERA TRAVEL ──────────────────────────────────────────────────────
      camera.position.z += (targetCamZ - camera.position.z) * easeFactor;
      
      const targetX = mouse.x * 0.40;
      camera.position.x += (targetX - camera.position.x) * 0.05;

      // Dynamic Y ground-clamping
      const groundY = getTerrainHeight(camera.position.x, camera.position.z);
      const targetY = groundY + 9.5; // fly 9.5 units above ground
      currentCamY += (targetY - currentCamY) * 0.08;
      camera.position.y = currentCamY;

      // Dynamic LookAt Y
      const lookAheadZ = camera.position.z - 110;
      const lookAheadY = getTerrainHeight(mouse.x * 0.25, lookAheadZ);
      const targetLookY = lookAheadY + 5.5;
      currentLookAtY += (targetLookY - currentLookAtY) * 0.08;

      camera.lookAt(
        mouse.x * 0.25,
        currentLookAtY - mouse.y * 0.12,
        camera.position.z - 160
      );

      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    // ── CLEANUP ───────────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll",  onScroll);
      window.removeEventListener("resize",  resize);
      skyGeo.dispose(); skyMat.dispose();
      scene.traverse((c) => { if (c instanceof THREE.Mesh) c.geometry.dispose(); });
      terrainMat.dispose();
      renderer.dispose();
    };
  }, [onReady]);

  return (
    <>
      {errorText && (
        <div style={{
          position:"fixed", top:10, left:10, right:10, zIndex:99999,
          background:"rgba(200,30,30,0.93)", color:"#fff", padding:"16px",
          fontFamily:"monospace", fontSize:"12px", borderRadius:"8px",
          whiteSpace:"pre-wrap", wordBreak:"break-all",
        }}>
          <strong>⚠ Error — </strong>{errorText}
        </div>
      )}
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
    </>
  );
}
