"use client";

import { AnimatePresence, motion } from "framer-motion";

export default function Preloader({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="preloader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            background: "#05030a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-mono"
            style={{
              fontSize: "0.7rem",
              letterSpacing: "0.45em",
              color: "#8a7ba8",
              textTransform: "uppercase",
            }}
          >
            <span>Tymor</span>
            <motion.span
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              style={{ marginLeft: "0.6em", color: "#5fe9ff" }}
            >
              entering
            </motion.span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
