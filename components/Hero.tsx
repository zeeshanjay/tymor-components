"use client";

import { useEffect, useRef, useState } from "react";
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

  const [isHovered, setIsHovered] = useState(false);

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
      {/* Scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={show ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 1, delay: 1.0 }}
        className="font-mono"
        style={{
          position: "absolute",
          bottom: "28px", // pushed lower
          textAlign: "center",
          fontSize: "0.65rem",
          letterSpacing: "0.12em",
          color: "#ffffff",
          textTransform: "uppercase",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          pointerEvents: "auto", // enable mouse interaction
        }}
      >
        <span style={{ fontSize: "0.58rem", opacity: 0.65, letterSpacing: "0.18em" }}>
          Scroll to discover
        </span>
        
        {/* Expanding button on hover */}
        <div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            margin: "12px auto 0",
            height: 48, // slightly larger
            borderRadius: 10,
            border: "1.2px solid rgba(255, 255, 255, 0.16)",
            background: "rgba(10, 6, 18, 0.65)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            padding: isHovered ? "0 6px 0 18px" : "0 6px",
            gap: isHovered ? "14px" : "0px",
            transition: "width 0.4s cubic-bezier(0.25, 1, 0.5, 1), padding 0.4s cubic-bezier(0.25, 1, 0.5, 1), gap 0.4s ease, border-color 0.3s",
            overflow: "hidden",
            width: isHovered ? "154px" : "48px",
            boxShadow: isHovered ? "0 0 15px rgba(255, 255, 255, 0.08)" : "none",
          }}
        >
          {/* Hover Text */}
          <span
            style={{
              fontSize: "0.58rem",
              fontWeight: 700,
              letterSpacing: "0.26em",
              color: "#ffffff",
              whiteSpace: "nowrap",
              opacity: isHovered ? 1 : 0,
              width: isHovered ? "auto" : 0,
              transition: "opacity 0.3s ease 0.05s, width 0.3s ease",
              display: "block",
            }}
          >
            REACH US
          </span>

          {/* Rounded square container with premium morphing circle */}
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 7,
              background: "rgba(0, 0, 0, 0.85)", // dark square
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg width="30" height="30" viewBox="0 0 100 100" style={{ display: "block" }}>
              <defs>
                <filter id="liquid-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3.5" result="blur" />
                  <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="2" result="noise">
                    <animate attributeName="baseFrequency" dur="10s" values="0.04;0.058;0.04" repeatCount="indefinite" />
                  </feTurbulence>
                  <feDisplacementMap in="SourceGraphic" in2="noise" scale="14" xChannelSelector="R" yChannelSelector="G" result="displaced" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="displaced" />
                  </feMerge>
                </filter>
              </defs>
              <style>{`
                @keyframes rotateRing {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}</style>
              <g filter="url(#liquid-glow)">
                <circle
                  cx="50"
                  cy="50"
                  r="32"
                  stroke="rgba(255, 255, 255, 0.88)"
                  strokeWidth="3.5"
                  fill="none"
                  strokeDasharray="95 55"
                  style={{
                    transformOrigin: '50px 50px',
                    animation: 'rotateRing 10s linear infinite',
                  }}
                />
              </g>
            </svg>
          </div>
        </div>
      </motion.div>


    </div>
  );
}
