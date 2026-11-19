import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  subBadgeText?: string;
  subBadgeType?: 'green' | 'pink' | 'neutral';
  icon: LucideIcon;
  iconBgColor: string; // e.g., 'bg-[#5b52f9]', 'bg-[#00c5dc]', etc.
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subBadgeText,
  subBadgeType = 'green',
  icon: Icon,
  iconBgColor,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`bg-white rounded-2xl p-7 border border-slate-200/80 shadow-sm relative overflow-hidden transition-all duration-200 ${
        onClick
          ? 'cursor-pointer hover:shadow-lg hover:border-brand-primary/40 hover:-translate-y-1 active:translate-y-0'
          : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-800 tracking-tight">{title}</h3>
          <p className="text-4xl font-extrabold text-slate-900 mt-2.5">{value}</p>
        </div>

        <div className={`w-14 h-14 rounded-full ${iconBgColor} flex items-center justify-center text-white shadow-md flex-shrink-0`}>
          <Icon className="w-7 h-7" />
        </div>
      </div>

      {subBadgeText && (
        <div className="mt-5 flex items-center">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold ${
              subBadgeType === 'green'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                : subBadgeType === 'pink'
                ? 'bg-rose-50 text-rose-700 border border-rose-100'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            {subBadgeText}
          </span>
        </div>
      )}
    </div>
  );
};
