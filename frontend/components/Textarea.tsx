"use client";

import React, { forwardRef, useEffect, useRef } from "react";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  autoResize?: boolean;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, autoResize = true, className = "", id, onChange, ...props }, forwardedRef) => {
    const internalRef = useRef<HTMLTextAreaElement | null>(null);
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    const setRefs = (element: HTMLTextAreaElement | null) => {
      internalRef.current = element;
      if (typeof forwardedRef === "function") {
        forwardedRef(element);
      } else if (forwardedRef) {
        (forwardedRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = element;
      }
    };

    const adjustHeight = () => {
      const el = internalRef.current;
      if (autoResize && el) {
        el.style.height = "auto";
        el.style.height = `${Math.max(el.scrollHeight, 100)}px`;
      }
    };

    useEffect(() => {
      adjustHeight();
    }, [props.value]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (autoResize) {
        adjustHeight();
      }
      if (onChange) {
        onChange(e);
      }
    };

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-semibold text-[#111827] select-none"
          >
            {label}
            {props.required && <span className="text-[#EF4444] ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          <textarea
            ref={setRefs}
            id={textareaId}
            onChange={handleChange}
            className={`w-full px-4 py-3 text-base font-medium rounded-[14px] border placeholder:text-[#94A3B8] transition-all duration-200 outline-none ${
              error
                ? "border-[#EF4444] focus:border-[#EF4444] focus:ring-4 focus:ring-[#EF4444]/15"
                : "border-[#D1D5DB] focus:border-[#7C3AED] focus:ring-4 focus:ring-[#7C4DFF]/18"
            } ${className}`}
            style={{
              backgroundColor: "#FFFFFF",
              color: "#111827",
              caretColor: "#7C3AED",
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: "16px",
              fontWeight: 500,
              lineHeight: 1.6,
              boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
            }}
            {...props}
          />
        </div>

        {error ? (
          <p className="text-xs font-medium text-[#EF4444]">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-[#64748B]">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export default Textarea;
