import React from 'react';

export default function LoadingSkeleton({ type = 'card', count = 3 }) {
  const items = Array.from({ length: count });

  if (type === 'card') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm animate-pulse space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-slate-200 rounded-xl" />
                <div className="space-y-2">
                  <div className="h-4 w-28 bg-slate-200 rounded" />
                  <div className="h-3 w-36 bg-slate-100 rounded" />
                </div>
              </div>
              <div className="h-6 w-20 bg-slate-200 rounded-full" />
            </div>
            <div className="h-14 bg-slate-100 rounded-xl" />
            <div className="flex gap-2 pt-2">
              <div className="h-9 flex-1 bg-slate-200 rounded-xl" />
              <div className="h-9 flex-1 bg-slate-200 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className="w-full bg-white rounded-2xl border border-slate-100 p-6 shadow-sm animate-pulse space-y-4">
        <div className="h-8 w-48 bg-slate-200 rounded mb-4" />
        {items.map((_, i) => (
          <div key={i} className="flex items-center justify-between py-3 border-b border-slate-100">
            <div className="h-4 w-32 bg-slate-200 rounded" />
            <div className="h-4 w-24 bg-slate-100 rounded" />
            <div className="h-4 w-20 bg-slate-200 rounded" />
            <div className="h-4 w-16 bg-slate-100 rounded" />
          </div>
        ))}
      </div>
    );
  }

  // Generic box skeleton
  return (
    <div className="w-full h-48 bg-slate-100 rounded-2xl animate-pulse flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#C1123F] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
