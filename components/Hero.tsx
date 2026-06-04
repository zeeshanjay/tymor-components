"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function Hero({ show }: { show: boolean }) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Fade the hero overlays out as the eye-transition begins.
  useEffect(() => {
    if (!rootRef.current) return;
    const ctx = gsap.context(() => {
      gsap.to(rootRef.current, {
        opacity: 0,
        ease: "none",
        scrollTrigger: {
          start: 0,
          end: () => window.innerHeight * 0.8,
          scrub: true,
        },
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={rootRef}
      className="no-pointer"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 20,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      {/* Landscape, person, flares + eye transition all render in the WebGL Scene. */}

      {/* Scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={show ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 1, delay: 1.0 }}
        className="font-mono"
        style={{
          position: "absolute",
          bottom: "48px",
          textAlign: "center",
          fontSize: "0.65rem",
          letterSpacing: "0.12em",
          color: "#ffffff",
          textTransform: "uppercase",
        }}
      >
        Scroll to discover
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          style={{
            margin: "14px auto 0",
            width: 30,
            height: 30,
            borderRadius: 8,
            border: "1px solid rgba(217,207,230,0.22)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ color: "#5fe9ff", fontSize: "0.7rem" }}>&#8595;</span>
        </motion.div>
      </motion.div>


    </div>
  );
}
