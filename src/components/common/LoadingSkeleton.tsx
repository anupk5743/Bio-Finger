import React from 'react';

export const TableLoadingSkeleton: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 5,
  cols = 5,
}) => {
  return (
    <div className="w-full animate-pulse p-4 space-y-3">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center space-x-4 py-2 border-b border-slate-100">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="h-4 bg-slate-200 rounded flex-1"></div>
          ))}
        </div>
      ))}
    </div>
  );
};
