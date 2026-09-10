"use client";

import React, { ReactNode } from "react";
import { motion } from "framer-motion";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen text-[#111827]">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <motion.main
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex-1 p-8 min-h-[calc(100vh-57px)] text-[#111827]"
          style={{
            background:
              "linear-gradient(135deg, rgba(248,247,255,0.8) 0%, rgba(240,238,255,0.6) 50%, rgba(245,243,255,0.8) 100%)",
          }}
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
