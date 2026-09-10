"use client";

import { FileText } from "lucide-react";
import Textarea from "./Textarea";

interface ReflectionBoxProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const GUIDES = [
  "What did you learn this week?",
  "Challenges faced",
  "How did you solve them?",
  "Progress completed",
];

const PLACEHOLDER =
  "What did you learn?\nWhat challenges did you face?\nHow did you solve them?\nWhat progress did you complete?";

export default function ReflectionBox({
  value,
  onChange,
  disabled = false,
}: ReflectionBoxProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label htmlFor="reflection" className="label mb-0 flex items-center gap-1.5">
          <FileText size={14} className="text-primary-500" />
          Weekly Reflection
        </label>
        <span className="text-xs text-gray-400 font-medium">{value.length} characters</span>
      </div>

      <Textarea
        id="reflection"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={7}
        placeholder={PLACEHOLDER}
        disabled={disabled}
      />

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {GUIDES.map((guide) => (
          <button
            key={guide}
            type="button"
            onClick={() => {
              const current = value.trim();
              onChange(current ? `${current}\n- ${guide}` : `- ${guide}`);
            }}
            disabled={disabled}
            className="text-left text-xs text-primary-600 hover:text-primary-700 bg-primary-50/60 hover:bg-primary-100/80 rounded-xl px-3 py-2 transition-all duration-200 font-medium disabled:opacity-50"
          >
            + {guide}
          </button>
        ))}
      </div>
    </div>
  );
}
