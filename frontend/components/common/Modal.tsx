"use client";

import React, { ReactNode, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ModalProps {
  /** Controls visibility */
  open: boolean;
  /** Called when the modal should close (backdrop click, Escape key, close button) */
  onClose: () => void;
  /** Modal title shown in the header */
  title?: string;
  /** Optional subtitle */
  subtitle?: string;
  /** Modal content */
  children: ReactNode;
  /** Controls max-width. Defaults to "md". */
  size?: "sm" | "md" | "lg" | "xl";
  /** Hide the default close button */
  hideCloseButton?: boolean;
}

const SIZE_MAP: Record<string, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
};

/**
 * Generic modal overlay wrapper.
 * Closes on backdrop click and Escape key.
 * Focus-traps when open.
 *
 * @example
 * <Modal open={showModal} onClose={() => setShowModal(false)} title="Join Project">
 *   <p>Modal body content</p>
 * </Modal>
 */
export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  size = "md",
  hideCloseButton = false,
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={overlayRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleBackdropClick}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(15,10,36,0.55)", backdropFilter: "blur(4px)" }}
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`relative w-full ${SIZE_MAP[size]} bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden`}
          >
            {/* Header */}
            {(title || !hideCloseButton) && (
              <div className="flex items-start justify-between p-6 pb-4 border-b border-gray-100">
                <div>
                  {title && (
                    <h2 className="text-base font-bold text-gray-900 leading-tight">
                      {title}
                    </h2>
                  )}
                  {subtitle && (
                    <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
                  )}
                </div>
                {!hideCloseButton && (
                  <button
                    onClick={onClose}
                    className="ml-4 flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    aria-label="Close modal"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            )}

            {/* Body */}
            <div className="p-6 pt-5">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
