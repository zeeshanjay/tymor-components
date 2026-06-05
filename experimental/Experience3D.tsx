"use client";

import { useCallback, useEffect, useState } from "react";
import Scene3D from "./Scene3D";
import Preloader from "../components/Preloader";
import Nav from "../components/Nav";
import Hero from "../components/Hero";

export default function Experience3D() {
  const [ready, setReady] = useState(false); // WebGL scene ready
  const [started, setStarted] = useState(false); // Gateway preloader lifted
  const [uiShow, setUiShow] = useState(false); // UI overlays revealed

  const handleReady = useCallback(() => setReady(true), []);

  // Once the GL context has painted, begin the gate reveal intro animation
  useEffect(() => {
    if (!ready) return;
    const begin = setTimeout(() => setStarted(true), 250);
    const reveal = setTimeout(() => setUiShow(true), 250 + 1800);
    return () => {
      clearTimeout(begin);
      clearTimeout(reveal);
    };
  }, [ready]);

  return (
    <main style={{ background: "#090412", width: "100%", height: "100%" }}>
      {/* 3D Scene: fixed to viewport — scroll moves camera, not this div */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 10,
          pointerEvents: "none",
        }}
      >
        {/* Render the procedural deformed terrain, morphing blob, and character cutout */}
        <Scene3D onReady={handleReady} start={started} />

        {/* Foreground scroll cue overlay */}
        <Hero show={uiShow} />
      </div>

      {/* Interactive Navigation Elements (fixed overlays) */}
      <Nav show={uiShow} />

      {/* gateway preloader */}
      <Preloader visible={!started} />

      {/* Scroll track driving the camera zoom forward in Scene3D */}
      <div style={{ height: "600vh" }} aria-hidden />
    </main>
  );
}
