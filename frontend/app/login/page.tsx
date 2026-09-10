"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import LoginForm from "@/components/LoginForm";
import Hero3DVisual from "@/components/Hero3DVisual";
import { isAuthenticated, getRoleRedirect } from "@/lib/auth";
import { Sparkles, ChevronRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated()) {
      const stored = localStorage.getItem("user");
      if (stored) {
        try {
          const user = JSON.parse(stored);
          if (user?.role) {
            router.replace(getRoleRedirect(user.role as "admin" | "candidate"));
            return;
          }
        } catch {
          localStorage.removeItem("user");
        }
      }
    }
  }, [router]);

  return (
    <div className="min-h-screen w-full relative bg-[#0B1020] text-[#F7F7FF] flex flex-col justify-between overflow-x-hidden select-none">
      
      {/* Background Soft Atmospheric Gradient Blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-[#8B7CFF]/10 blur-[130px] animate-pulse" style={{ animationDuration: "8s" }} />
        <div className="absolute bottom-[-10%] right-[-5%] w-[550px] h-[550px] rounded-full bg-[#65DDF5]/10 blur-[140px] animate-pulse" style={{ animationDuration: "10s" }} />
        <div className="absolute top-[40%] left-[35%] w-[400px] h-[400px] rounded-full bg-[#B8B4FF]/5 blur-[120px]" />
      </div>

      {/* Top Minimal Navigation Bar */}
      <header className="relative z-30 w-full px-6 sm:px-12 py-4 flex items-center justify-between border-b border-white/5 bg-[#0B1020]/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#8B7CFF] to-[#65DDF5] p-[1px]">
            <div className="w-full h-full rounded-[11px] bg-[#11182B] flex items-center justify-center">
              <Sparkles size={18} className="text-[#65DDF5]" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-[#F7F7FF] tracking-tight">Project Portal</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#8B7CFF]/15 text-[#B8B4FF] border border-[#8B7CFF]/30">
              v2.0 Next-Gen
            </span>
          </div>
        </div>

        <div className="flex items-center gap-5 text-xs text-[#A9B1C7]">
          <span className="hidden sm:flex items-center gap-1.5 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#65DDF5] animate-pulse" />
            System Operational
          </span>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[#F7F7FF] text-xs transition-colors"
          >
            Documentation
          </a>
        </div>
      </header>

      {/* Main Split-Screen Layout */}
      <main className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-8 py-8 lg:py-12 flex-1 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* LEFT COLUMN: Clean Project Portal Intro + 3D Visual */}
          <div className="lg:col-span-7 flex flex-col justify-center gap-6 text-center lg:text-left">
            
            {/* Small Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#8B7CFF]/30 bg-[#8B7CFF]/10 backdrop-blur-md w-fit mx-auto lg:mx-0">
              <span className="w-2 h-2 rounded-full bg-[#65DDF5]" />
              <span className="text-xs font-semibold text-[#B8B4FF]">Mentorship Workspace</span>
              <ChevronRight size={14} className="text-[#A9B1C7]" />
            </div>

            {/* Main Heading & Description */}
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-black text-[#F7F7FF] tracking-tight leading-[1.1]">
                Build. Submit. <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#8B7CFF] via-[#B8B4FF] to-[#65DDF5]">Grow.</span>
              </h1>
              <p className="mt-3 text-sm sm:text-base text-[#A9B1C7] leading-relaxed max-w-lg mx-auto lg:mx-0 font-normal">
                A simple workspace for candidates and mentors to manage projects, reviews, and feedback.
              </p>
            </div>

            {/* ONE Elegant Floating 3D Visual */}
            <div className="w-full flex justify-center lg:justify-start my-2">
              <Hero3DVisual />
            </div>
          </div>

          {/* RIGHT COLUMN: Completely Static Login Card */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end w-full">
            <LoginForm />
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="relative z-20 w-full py-4 px-6 sm:px-12 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs text-[#A9B1C7] gap-2 bg-[#0B1020]/80 backdrop-blur-md">
        <p>© 2026 Project Portal. Designed for professional student mentorship.</p>
        <div className="flex items-center gap-4 text-[11px]">
          <span className="hover:text-[#F7F7FF] transition-colors cursor-pointer">Security</span>
          <span>•</span>
          <span className="hover:text-[#F7F7FF] transition-colors cursor-pointer">Privacy</span>
          <span>•</span>
          <span className="hover:text-[#F7F7FF] transition-colors cursor-pointer">Terms</span>
        </div>
      </footer>
    </div>
  );
}
