import React from 'react';

const colorThemes = {
  blue: {
    bg: 'bg-blue-50',
    iconBg: 'bg-blue-500',
    text: 'text-blue-600',
    border: 'border-blue-100',
    glow: 'group-hover:ring-blue-200',
  },
  green: {
    bg: 'bg-emerald-50',
    iconBg: 'bg-emerald-500',
    text: 'text-emerald-600',
    border: 'border-emerald-100',
    glow: 'group-hover:ring-emerald-200',
  },
  purple: {
    bg: 'bg-purple-50',
    iconBg: 'bg-purple-500',
    text: 'text-purple-600',
    border: 'border-purple-100',
    glow: 'group-hover:ring-purple-200',
  },
  orange: {
    bg: 'bg-amber-50',
    iconBg: 'bg-amber-500',
    text: 'text-amber-600',
    border: 'border-amber-100',
    glow: 'group-hover:ring-amber-200',
  },
  teal: {
    bg: 'bg-teal-50',
    iconBg: 'bg-teal-500',
    text: 'text-teal-600',
    border: 'border-teal-100',
    glow: 'group-hover:ring-teal-200',
  },
  indigo: {
    bg: 'bg-indigo-50',
    iconBg: 'bg-indigo-600',
    text: 'text-indigo-600',
    border: 'border-indigo-100',
    glow: 'group-hover:ring-indigo-200',
  },
};

const StatsCard = ({ title, value, icon: Icon, color = 'indigo', description }) => {
  const theme = colorThemes[color] || colorThemes.indigo;

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl bg-white p-6 shadow-xs border ${theme.border} transition-all duration-200 hover:shadow-md hover:-translate-y-0.5`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-500 tracking-wide">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-slate-800">
              {value !== undefined && value !== null ? value : '-'}
            </span>
          </div>
          {description && (
            <p className="mt-1 text-xs text-slate-400 font-normal">{description}</p>
          )}
        </div>

        {Icon && (
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${theme.bg} ${theme.text} transition-transform duration-200 group-hover:scale-110`}
          >
            <Icon size={24} strokeWidth={2.2} />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
