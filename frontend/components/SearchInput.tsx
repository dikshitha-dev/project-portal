"use client";

import React, { forwardRef } from "react";
import { Search, X } from "lucide-react";

export interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  onClear?: () => void;
}

const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ value, onChange, onClear, placeholder = "Search...", className = "", ...props }, ref) => {
    const hasValue = value !== undefined && value !== null && String(value).length > 0;

    return (
      <div className="relative flex items-center w-full">
        <Search
          size={18}
          className="absolute left-3.5 pointer-events-none text-[#64748B] flex-shrink-0"
        />

        <input
          ref={ref}
          type="text"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full pl-10 pr-10 py-2.5 text-base font-medium rounded-[14px] border border-[#D1D5DB] placeholder:text-[#94A3B8] transition-all duration-200 outline-none focus:border-[#7C3AED] focus:ring-4 focus:ring-[#7C4DFF]/18 ${className}`}
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

        {hasValue && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 p-1 rounded-lg text-[#64748B] hover:text-[#111827] hover:bg-gray-100 transition-colors"
            title="Clear search"
          >
            <X size={16} />
          </button>
        )}
      </div>
    );
  }
);

SearchInput.displayName = "SearchInput";

export default SearchInput;
