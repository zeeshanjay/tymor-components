"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import Scene from "./Scene";
import Preloader from "./Preloader";
import Nav from "./Nav";
import Hero from "./Hero";
import { gsap } from "gsap";

export default function Experience() {
  const [ready, setReady] = useState(false); // first WebGL frame rendered
  const [started, setStarted] = useState(false); // intro animation running
  const [uiShow, setUiShow] = useState(false); // UI revealed after intro

  const parallaxRef = useRef<HTMLDivElement | null>(null);

  const handleReady = useCallback(() => setReady(true), []);

  // Once the GL context has painted, begin the "push into the void" intro.
  useEffect(() => {
    if (!ready) return;
    const begin = setTimeout(() => setStarted(true), 250);
    const reveal = setTimeout(() => setUiShow(true), 250 + 1800);
    return () => {
      clearTimeout(begin);
      clearTimeout(reveal);
    };
  }, [ready]);

  // Reverse mouse parallax on the background canvas and hero overlays
  useEffect(() => {
    if (typeof window === "undefined" || !parallaxRef.current) return;

    const target = parallaxRef.current;
    
    // Scale up slightly so shifting it doesn't reveal edges
    gsap.set(target, { scale: 1.04 });

    // Set up GSAP quickTo functions for smooth rendering (slow, dreamy float)
    const xTo = gsap.quickTo(target, "x", { duration: 2.2, ease: "power2.out" });
    const yTo = gsap.quickTo(target, "y", { duration: 2.2, ease: "power2.out" });

    const maxMoveX = 12; // Subtle horizontal movement
    const maxMoveY = 8;  // Even subtler vertical movement to prevent blank screen lines
    const edgeZone = 140; // Distance in pixels from screen boundary where it starts returning to center

    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;

      // Normalized coordinates from the center (-1 to 1)
      const nx = (clientX - innerWidth / 2) / (innerWidth / 2);
      const ny = (clientY - innerHeight / 2) / (innerHeight / 2);

      // Smoothly fade out parallax displacement near window edges
      const minDistX = Math.min(clientX, innerWidth - clientX);
      const minDistY = Math.min(clientY, innerHeight - clientY);

      const factorX = Math.min(Math.max(minDistX / edgeZone, 0), 1);
      const factorY = Math.min(Math.max(minDistY / edgeZone, 0), 1);
      const edgeFactor = factorX * factorY; // 1 at center, drops smoothly to 0 at edges

      // Reverse Mouse Parallax with edge factor protection
      xTo(-nx * maxMoveX * edgeFactor);
      yTo(-ny * maxMoveY * edgeFactor);
    };

    const handleMouseLeave = () => {
      // Return smoothly to center when mouse leaves viewport
      xTo(0);
      yTo(0);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <main style={{ background: "#05030a", width: "100%", height: "100%" }}>
      {/* Parallax wrapper that shifts oppositely to the cursor */}
      <div
        ref={parallaxRef}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 10,
          pointerEvents: "none",
        }}
      >
        {/* Unified WebGL scene (z-index 1, receives the cursor). */}
        <Scene onReady={handleReady} start={started} />

        {/* Foreground overlays (pointer-events: none). */}
        <Hero show={uiShow} />
      </div>

      {/* Interactive minimal UI (does not shift, keeping navigation fixed). */}
      <Nav show={uiShow} />

      {/* Black gateway preloader; lifts as the scene materializes. */}
      <Preloader visible={!started} />

      {/* Scroll track that drives the eye -> new-world transition. */}
      <div style={{ height: "600vh" }} aria-hidden />
    </main>
  );
}
