"use client";

import React, { forwardRef } from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, icon, rightElement, className = "", id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-semibold text-[#111827] select-none"
          >
            {label}
            {props.required && <span className="text-[#EF4444] ml-1">*</span>}
          </label>
        )}

        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-[#64748B]">
              {icon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={`w-full px-4 py-2.5 text-base font-medium rounded-[14px] border placeholder:text-[#94A3B8] transition-all duration-200 outline-none ${
              icon ? "pl-11" : ""
            } ${rightElement ? "pr-11" : ""} ${
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
              boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
            }}
            {...props}
          />

          {rightElement && (
            <div className="absolute right-3.5 flex items-center">
              {rightElement}
            </div>
          )}
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

Input.displayName = "Input";

export default Input;
