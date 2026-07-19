"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { AnimatedBackground } from "@/components/auth/AnimatedBackground";

const stages = ["Qualify", "Analyze", "Propose", "Negotiate", "Won"];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-[1fr_480px] bg-[color:var(--color-paper)]">

      {/* LEFT PANEL */}
      <div className="hidden lg:flex relative overflow-hidden px-20 py-16 flex-col justify-between surface-ledger">
        <AnimatedBackground />

        {/* Animated Glow */}
        <motion.div
          className="absolute left-[-120px] top-[25%] w-[500px] h-[500px] rounded-full bg-blue-500/20 blur-[120px]"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.45, 0.2],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Floating Particles */}
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-blue-400"
            style={{
              width: 4,
              height: 4,
              left: `${8 + i * 8}%`,
              top: `${15 + (i % 5) * 14}%`,
            }}
            animate={{
              y: [0, -25, 0],
              opacity: [0.25, 1, 0.25],
            }}
            transition={{
              duration: 2 + i * 0.4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}

        {/* Logo (Desktop Layout) */}
        <div className="relative z-20 w-[230px] h-[100px]">
          <Image
            src="/logo.png"
            alt="AI CRM"
            fill
            priority
            sizes="230px"
            className="object-contain object-left"
          />
        </div>

        {/* Hero */}
        <motion.div
          className="relative z-20 max-w-xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.8,
          }}
        >
          <h1 className="font-display text-6xl font-semibold leading-[1.05] tracking-tight text-white">
            Every deal.
            <br />
            Every customer.
            <br />
            <span className="text-[color:var(--color-signal)]">
              One intelligent CRM.
            </span>
          </h1>

          <p className="mt-8 text-lg leading-8 text-white/65 max-w-lg">
            AI-powered pipeline management, forecasting, automation,
            customer intelligence, and executive insights built for
            modern sales teams.
          </p>
        </motion.div>

        {/* Pipeline */}
        <motion.div
          className="relative z-20 max-w-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: .5 }}
        >
          <div className="relative h-[2px] bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-orange-400 to-transparent"
              animate={{
                x: ["-150%", "600%"],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          </div>

          <div className="flex justify-between mt-6">
            {stages.map((stage, index) => (
              <motion.div
                key={stage}
                className="flex flex-col items-center gap-3"
                animate={{
                  scale: [1, 1.35, 1],
                  opacity: [0.45, 1, 0.45],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: index * .35,
                }}
              >
                <div className="w-3 h-3 rounded-full bg-[color:var(--color-signal)] shadow-lg shadow-orange-500/50" />
                <span className="text-[11px] uppercase tracking-[0.18em] text-white/60">
                  {stage}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* RIGHT PANEL */}
      <div className="relative flex flex-col items-center justify-center px-8 py-16">
        <div
          className="absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(circle at top, rgba(37,99,235,.08), transparent 55%)",
          }}
        />

        {/* Logo Container (Mobile/Tablet fallback) */}
        <div className="lg:hidden mb-8 relative z-10 w-[180px] h-[46px] self-start">
          <Image
            src="/logo.png"
            alt="AI CRM"
            fill
            priority
            sizes="180px"
            className="object-contain object-left"
          />
        </div>

        <motion.div
          className="relative z-10 w-full max-w-sm"
          initial={{ opacity: 0, x: 25 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            duration: .6,
          }}
        >
          {children}
        </motion.div>
      </div>

    </div>
  );
}