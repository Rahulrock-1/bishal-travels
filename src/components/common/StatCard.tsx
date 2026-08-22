import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  color?: 'emerald' | 'blue' | 'amber' | 'purple' | 'slate';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'emerald',
  onClick,
}) => {
  const colorStyles = {
    emerald: {
      bg: 'bg-emerald-500/10 text-emerald-600 border-emerald-200/50',
      iconBg: 'bg-emerald-50 text-emerald-600',
      border: 'hover:border-emerald-300',
    },
    blue: {
      bg: 'bg-blue-500/10 text-blue-600 border-blue-200/50',
      iconBg: 'bg-blue-50 text-blue-600',
      border: 'hover:border-blue-300',
    },
    amber: {
      bg: 'bg-amber-500/10 text-amber-600 border-amber-200/50',
      iconBg: 'bg-amber-50 text-amber-600',
      border: 'hover:border-amber-300',
    },
    purple: {
      bg: 'bg-purple-500/10 text-purple-600 border-purple-200/50',
      iconBg: 'bg-purple-50 text-purple-600',
      border: 'hover:border-purple-300',
    },
    slate: {
      bg: 'bg-slate-500/10 text-slate-600 border-slate-200/50',
      iconBg: 'bg-slate-100 text-slate-700',
      border: 'hover:border-slate-300',
    },
  }[color];

  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:shadow-md ' + colorStyles.border : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </span>
        <div className={`p-2.5 rounded-lg ${colorStyles.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      
      <div className="mt-3">
        <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
          {value}
        </div>
        
        {(subtitle || trend) && (
          <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
            {trend && (
              <span className={`font-semibold ${trend.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                {trend.value}
              </span>
            )}
            {subtitle && <span>{subtitle}</span>}
          </div>
        )}
      </div>
    </div>
  );
};
