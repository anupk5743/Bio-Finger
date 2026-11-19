import React from 'react';

interface StatusBadgeProps {
  status: 'ACTIVE' | 'INACTIVE' | string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const isActive = status?.toUpperCase() === 'ACTIVE';

  return (
    <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
      <span
        className={`w-2.5 h-2.5 rounded-full ${isActive ? 'bg-emerald-500 ring-2 ring-emerald-100' : 'bg-red-500 ring-2 ring-red-100'
          }`}
      />
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
};
