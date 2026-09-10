"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { FolderGit2, Sparkles, CheckCircle2, Layers, Code2 } from "lucide-react";

export default function Hero3DVisual() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  // Mouse parallax motion values (subtle, soft)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 28, stiffness: 100, mass: 0.6 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  // Max tilt angle (subtle 8 deg)
  const rotateX = useTransform(smoothY, [-0.5, 0.5], [8, -8]);
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-8, 8]);
  const floatZ = useTransform(smoothY, [-0.5, 0.5], [10, -10]);

  // Secondary layer shift for depth
  const orbX = useTransform(smoothX, [-0.5, 0.5], [-15, 15]);
  const orbY = useTransform(smoothY, [-0.5, 0.5], [-12, 12]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full max-w-[460px] aspect-[4/3] flex items-center justify-center select-none py-4"
    >
      {/* Background Soft Lighting Glows */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-10">
        <div className="absolute w-64 h-64 rounded-full bg-[#8B7CFF]/15 blur-[80px]" />
        <div className="absolute w-52 h-52 rounded-full bg-[#65DDF5]/15 blur-[70px] translate-x-8 translate-y-6" />
      </div>

      {/* Main Floating 3D Graphic Container */}
      <motion.div
        style={{
          rotateX: mounted ? rotateX : 0,
          rotateY: mounted ? rotateY : 0,
          z: mounted ? floatZ : 0,
          transformStyle: "preserve-3d",
        }}
        animate={{
          y: [0, -10, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative w-[340px] h-[280px] rounded-[32px] bg-gradient-to-b from-[#162038]/90 via-[#11182B]/80 to-[#0E1526]/90 border border-white/10 backdrop-blur-2xl shadow-[0_30px_70px_rgba(0,0,0,0.4),0_0_40px_rgba(139,124,255,0.15)] flex flex-col justify-between p-6 overflow-hidden"
      >
        {/* Soft Ambient Inner Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-gradient-to-b from-[#65DDF5]/10 to-transparent blur-xl pointer-events-none" />

        {/* Card Header: Icon + Badge */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#8B7CFF] to-[#65DDF5] p-[1px] shadow-[0_0_20px_rgba(139,124,255,0.3)]">
              <div className="w-full h-full rounded-[15px] bg-[#11182B] flex items-center justify-center">
                <FolderGit2 size={20} className="text-[#65DDF5]" />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#F7F7FF]">Project Workspace</h3>
              <p className="text-[11px] text-[#A9B1C7]">Mentorship &amp; Feedback</p>
            </div>
          </div>

          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#8B7CFF]/15 border border-[#8B7CFF]/30 text-[#B8B4FF] text-[10px] font-semibold">
            <Sparkles size={11} className="text-[#65DDF5]" />
            <span>Active</span>
          </div>
        </div>

        {/* Floating Center Orb / Gem Graphic */}
        <motion.div
          style={{
            x: mounted ? orbX : 0,
            y: mounted ? orbY : 0,
          }}
          className="relative my-auto flex items-center justify-center py-2 z-10"
        >
          {/* Glass Orb Core */}
          <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-tr from-[#8B7CFF]/30 via-[#B8B4FF]/20 to-[#65DDF5]/30 border border-white/20 backdrop-blur-xl flex items-center justify-center shadow-[0_15px_35px_rgba(139,124,255,0.25)] group">
            {/* Inner Glowing Core */}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#8B7CFF] to-[#65DDF5] flex items-center justify-center shadow-[0_0_25px_rgba(101,221,245,0.4)]">
              <CheckCircle2 size={28} className="text-[#11182B]" />
            </div>

            {/* Orbiting Mini Badge 1 */}
            <div className="absolute -top-2 -right-3 px-2 py-0.5 rounded-full bg-[#11182B] border border-[#65DDF5]/40 text-[#65DDF5] text-[9px] font-bold shadow-md flex items-center gap-1">
              <Code2 size={10} />
              <span>Review Ready</span>
            </div>

            {/* Orbiting Mini Badge 2 */}
            <div className="absolute -bottom-2 -left-3 px-2 py-0.5 rounded-full bg-[#11182B] border border-[#8B7CFF]/40 text-[#B8B4FF] text-[9px] font-bold shadow-md flex items-center gap-1">
              <Layers size={10} />
              <span>v2.0 Workspace</span>
            </div>
          </div>
        </motion.div>

        {/* Card Footer: Progress Pill */}
        <div className="relative z-10 bg-[#0B1020]/60 border border-white/5 rounded-2xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#65DDF5] animate-pulse" />
            <span className="text-xs text-[#A9B1C7]">Submission Status</span>
          </div>
          <span className="text-xs font-semibold text-[#F7F7FF] bg-[#8B7CFF]/20 px-2 py-0.5 rounded-md border border-[#8B7CFF]/30">
            Verified
          </span>
        </div>
      </motion.div>
    </div>
  );
}
