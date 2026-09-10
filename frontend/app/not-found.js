"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Page not found</h2>
        <p className="text-gray-500">The page you are looking for does not exist.</p>
        <Link
          href="/login"
          className="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors inline-block"
        >
          Go to Login
        </Link>
      </div>
    </div>
  );
}
