export default function LoadingSkeleton({ rows = 3, className = "" }) {
  return (
    <div className={`space-y-5 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="card-static animate-pulse"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl" />
            <div className="flex-1 space-y-3">
              <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-100 rounded-lg w-1/3" />
              <div className="h-3 bg-gradient-to-r from-gray-100 to-gray-50 rounded-lg w-1/2" />
            </div>
          </div>
          <div className="mt-5 space-y-3">
            <div className="h-3 bg-gradient-to-r from-gray-100 to-gray-50 rounded-lg w-full" />
            <div className="h-3 bg-gradient-to-r from-gray-100 to-gray-50 rounded-lg w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
