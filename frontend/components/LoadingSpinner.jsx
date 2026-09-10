"use client";

export default function LoadingSpinner({ size = "md", text = "" }) {
  const sizeClasses = {
    sm: "h-5 w-5 border-2",
    md: "h-8 w-8 border-[3px]",
    lg: "h-12 w-12 border-4",
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20">
      <div className="relative">
        <div
          className={`animate-spin rounded-full border-primary-200 border-t-primary-600 ${sizeClasses[size]}`}
        />
        <div
          className={`absolute inset-0 animate-spin rounded-full border-transparent border-t-primary-400 ${sizeClasses[size]}`}
          style={{ animationDuration: "1.5s", animationDirection: "reverse" }}
        />
      </div>
      {text && (
        <p className="text-sm font-medium text-gray-500 animate-pulse">{text}</p>
      )}
    </div>
  );
}
