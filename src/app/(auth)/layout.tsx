// src/app/(auth)/layout.tsx

"use client";

import { motion } from "framer-motion";
import { AnimatedBackground } from "@/components/auth/AnimatedBackground";

const stages = ["Qualify", "Analyze", "Propose", "Negotiate", "Won"];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_480px] bg-[color:var(--color-paper)]">
      {/* বাম পাশ — Ledger Panel */}
      <div className="hidden lg:flex flex-col justify-between surface-ledger px-16 py-14 relative overflow-hidden">
        <AnimatedBackground />

        <motion.div
          className="relative z-10"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="font-display text-2xl font-semibold tracking-tight flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-[color:var(--color-signal)] flex items-center justify-center text-white text-sm font-bold">
              A
            </span>
            AI CRM
          </span>
        </motion.div>

        <motion.div
          className="relative z-10 max-w-md"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
        >
          <p className="font-display text-4xl leading-tight font-medium mb-6">
            Every deal, every customer, every signal {" "}
            <span className="text-[color:var(--color-signal)]">in one ledger.</span>
          </p>
          <p className="text-[color:var(--color-hairline)] text-sm leading-relaxed">
            Pipeline tracking, AI-driven forecasts, and executive intelligence
            built for teams who close deals, not just log them.
          </p>
        </motion.div>

        {/* Pipeline Rail — animated */}
        <motion.div
          className="relative z-10 flex items-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          {stages.map((stage, i) => (
            <div key={stage} className="flex items-center gap-3">
              <div className="flex flex-col items-center gap-2">
                <motion.div
                  className="w-2.5 h-2.5 rounded-full relative"
                  style={{
                    backgroundColor: i === 4 ? "var(--color-rising)" : "var(--color-signal)",
                  }}
                  animate={
                    i === 4
                      ? {
                          boxShadow: [
                            "0 0 0px rgba(62,124,90,0.6)",
                            "0 0 12px rgba(62,124,90,0.6)",
                            "0 0 0px rgba(62,124,90,0.6)",
                          ],
                        }
                      : {}
                  }
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="text-[10px] uppercase tracking-wider text-[color:var(--color-hairline)]">
                  {stage}
                </span>
              </div>
              {i < 4 && <div className="w-8 h-px bg-[color:var(--color-hairline-dark)]" />}
            </div>
          ))}
        </motion.div>
      </div>

      {/* ডান পাশ — Form Panel */}
      <div className="flex items-center justify-center px-6 py-12 relative">
        <div
          className="absolute inset-0 opacity-[0.5]"
          style={{
            background:
              "radial-gradient(600px circle at 50% 0%, rgba(201,122,61,0.06), transparent 60%)",
          }}
        />
        <motion.div
          className="w-full max-w-sm relative z-10"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}