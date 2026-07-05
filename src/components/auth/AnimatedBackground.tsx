// src/components/auth/AnimatedBackground.tsx

"use client";

import { motion } from "framer-motion";

export function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full blur-[120px] opacity-40"
        style={{ background: "radial-gradient(circle, #C97A3D 0%, transparent 70%)" }}
        animate={{
          x: [0, 80, -40, 0],
          y: [0, -60, 40, 0],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        initial={{ top: "-10%", left: "-10%" }}
      />
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full blur-[100px] opacity-30"
        style={{ background: "radial-gradient(circle, #3E7C5A 0%, transparent 70%)" }}
        animate={{
          x: [0, -60, 50, 0],
          y: [0, 50, -30, 0],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        initial={{ bottom: "-10%", right: "-5%" }}
      />
      <motion.div
        className="absolute w-[300px] h-[300px] rounded-full blur-[90px] opacity-20"
        style={{ background: "radial-gradient(circle, #6B8CAE 0%, transparent 70%)" }}
        animate={{
          x: [0, 40, -20, 0],
          y: [0, -30, 20, 0],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        initial={{ top: "40%", left: "60%" }}
      />

      {/* Subtle grid overlay for depth/texture */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
    </div>
  );
}