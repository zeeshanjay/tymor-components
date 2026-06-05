"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function Nav({ show }: { show: boolean }) {
  const [glitch, setGlitch] = useState(false);
  const [glitchColor, setGlitchColor] = useState("#ffffff");
  const [glitchX, setGlitchX] = useState(0);
  const [activeSection, setActiveSection] = useState(0);
  const [hoveredSection, setHoveredSection] = useState<number | null>(null);
  const sections = ["INTRO", "SOLUTIONS", "INDUSTRIES"];

  useEffect(() => {
    const handleScroll = () => {
      // Keep it locked on the first section (INTRO) even when scrolling, per user request.
      setActiveSection(0);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (idx: number) => {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    let targetScroll = 0;
    if (idx === 1) {
      targetScroll = scrollHeight * 0.50; // SOLUTIONS section (crossfade stage)
    } else if (idx === 2) {
      targetScroll = scrollHeight; // ENGINE section (pupil warp stage)
    }
    window.scrollTo({
      top: targetScroll,
      behavior: "smooth"
    });
  };

  useEffect(() => {
    const triggerGlitch = () => {
      // Start glitch phase
      setGlitch(true);
      
      // Select a random vivid glitch color (neon cyan, magenta, purple, lilac)
      const colors = ["#ff00ff", "#00ffff", "#7c4dff", "#a020f0"];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      setGlitchColor(randomColor);
      setGlitchX(Math.random() > 0.5 ? 3 : -3);

      // Flickering steps
      setTimeout(() => {
        setGlitchX(0);
        setGlitchColor("#ffffff");
      }, 70);

      setTimeout(() => {
        setGlitchX(Math.random() > 0.5 ? 2 : -2);
        setGlitchColor(randomColor);
      }, 140);

      // Return to normal white
      setTimeout(() => {
        setGlitch(false);
        setGlitchColor("#ffffff");
        setGlitchX(0);
      }, 240);
    };

    // Glitch trigger interval (every 4.5s)
    const interval = setInterval(triggerGlitch, 4500);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Top Header Navigation */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={show ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 30,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "26px 34px",
          pointerEvents: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="TYMOR"
            style={{
              height: "24px",
              width: "auto",
              display: "block",
            }}
          />
        </div>

        <button
          aria-label="Open menu"
          className="font-mono"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 12px", // Smaller, elegant Menu button
            borderRadius: "4px",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            background: "rgba(10, 6, 18, 0.45)",
            backdropFilter: "blur(8px)",
            fontSize: "0.62rem", // Proportional small font size
            fontWeight: 700,
            letterSpacing: "0.22em",
            color: "#ffffff",
            textTransform: "uppercase",
            cursor: "pointer",
          }}
        >
          Menu
          <span
            style={{
              width: 4.5, // Small white dot
              height: 4.5,
              borderRadius: "50%",
              background: "#ffffff",
            }}
          />
        </button>
      </motion.header>

      {/* Right side vertical guide line + DEMO button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={show ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: "fixed",
          right: "24px", // Perfectly aligns the line center (24px + 20px = 44px) with the Menu button's white dot
          top: "100px",
          bottom: 0,
          width: "40px",
          zIndex: 30,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        {/* Top guide line */}
        <div
          style={{
            width: "1px",
            flex: 1,
            background: "linear-gradient(to bottom, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.1) 20%, rgba(255, 255, 255, 0.1))",
          }}
        />

        {/* Vertical Demo button with periodic glitch (rotated sideways, thin, rectangular) */}
        <button
          aria-label="System demo"
          className="font-mono"
          style={{
            pointerEvents: "auto",
            margin: "12px 0",
            background: glitchColor,
            color: glitch ? "#ffffff" : "#05030a",
            border: glitch ? "1px solid rgba(255, 255, 255, 0.8)" : "none",
            boxShadow: glitch ? `0 0 15px ${glitchColor}` : "none",
            width: "20px", // Fixed thin width to remove side gaps
            padding: "12px 0", // No horizontal padding, height controlled by vertical padding
            fontSize: "0.62rem", // Proportional small text size
            fontWeight: 800,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            borderRadius: "2px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            writingMode: "vertical-rl",
            whiteSpace: "nowrap", // Prevent letters from wrapping/stacking upright
            transform: `rotate(180deg) translateX(${glitchX}px)`, // Rotated on its side, reading upward
            transition: glitch ? "none" : "background-color 0.2s, color 0.2s, transform 0.2s, box-shadow 0.2s",
            cursor: "pointer",
          }}
        >
          Demo
        </button>

        {/* Bottom guide line */}
        <div
          style={{
            width: "1px",
            flex: 1,
            background: "linear-gradient(to top, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.1) 20%, rgba(255, 255, 255, 0.1))",
          }}
        />
      </motion.div>

      {/* Left-side vertical navigation bar */}
      <div
        style={{
          position: "fixed",
          left: "34px",
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 30,
          pointerEvents: "none",
        }}
      >
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={show ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          style={{
            display: "flex",
            alignItems: "center",
          }}
        >
          {/* The Vertical Line Container */}
          <div
            style={{
              position: "relative",
              width: "12px",
              height: "220px",
              display: "flex",
              justifyContent: "center",
              marginRight: "14px", // Smaller spacing between line and boxes, matching sidewave
            }}
          >
            {/* The main thin guide line */}
            <div
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                width: "1px",
                background: "rgba(255, 255, 255, 0.12)",
              }}
            />

            {/* Highlighted active segment (animates position smoothly) */}
            <motion.div
              animate={{
                y: activeSection * 42, // SECTION_HEIGHT (18px) + SECTION_GAP (24px) = 42px
              }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
              style={{
                position: "absolute",
                top: "52px", // Centered relative to buttons container offset
                width: "2px",
                height: "32px", // Snug height for the active line segment
                background: "#ffffff",
                boxShadow: "0 0 10px rgba(255, 255, 255, 0.3)",
              }}
            />

            {/* Highlighted active marker dot (animates position smoothly) */}
            <motion.div
              animate={{
                y: activeSection * 42,
              }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
              style={{
                position: "absolute",
                top: "65px", // Centered relative to buttons container offset
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#ffffff",
                boxShadow: "0 0 8px #ffffff",
              }}
            />
          </div>

          {/* Section Labels */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "24px", // Increased gap for more whitespace
              alignItems: "flex-start",
              pointerEvents: "auto",
            }}
          >
            {sections.map((sec, idx) => {
              const isActive = activeSection === idx;
              const isHovered = hoveredSection === idx;
              return (
                <button
                  key={sec}
                  onClick={() => scrollToSection(idx)}
                  onMouseEnter={() => setHoveredSection(idx)}
                  onMouseLeave={() => setHoveredSection(null)}
                  className="font-mono"
                  style={{
                    height: "18px", // Smaller height wrapping words tightly
                    padding: "0 8px",
                    fontSize: "0.50rem", // Smaller elegant font size
                    fontWeight: 700,
                    letterSpacing: "0.24em", // Increased letter-spacing
                    borderRadius: "2px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    border: isActive
                      ? "1px solid #ffffff"
                      : isHovered
                      ? "1px solid rgba(255, 255, 255, 0.35)"
                      : "1px solid rgba(255, 255, 255, 0.12)",
                    background: isActive
                      ? "#ffffff"
                      : isHovered
                      ? "rgba(255, 255, 255, 0.08)"
                      : "rgba(10, 6, 18, 0.45)",
                    color: isActive
                      ? "#05030a"
                      : isHovered
                      ? "#ffffff"
                      : "rgba(255, 255, 255, 0.45)",
                    backdropFilter: isActive ? "none" : "blur(8px)",
                    transition: "background-color 0.25s, color 0.25s, border-color 0.25s, box-shadow 0.25s",
                    boxShadow: isActive ? "0 0 15px rgba(255, 255, 255, 0.15)" : "none",
                  }}
                >
                  {sec}
                </button>
              );
            })}
          </div>
        </motion.div>
      </div>
    </>
  );
}
