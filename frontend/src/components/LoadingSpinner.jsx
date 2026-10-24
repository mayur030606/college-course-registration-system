import React from 'react';
import { Loader2 } from 'lucide-react';

const sizeMap = {
  sm: 'w-4 h-4 text-sm',
  md: 'w-8 h-8 text-base',
  lg: 'w-12 h-12 text-lg',
};

const iconSizes = {
  sm: 16,
  md: 32,
  lg: 48,
};

const LoadingSpinner = ({ size = 'md', fullPage = false, text = 'Loading...' }) => {
  const content = (
    <div className="flex flex-col items-center justify-center gap-3 p-4">
      <Loader2
        size={iconSizes[size] || 32}
        className="animate-spin text-indigo-600"
      />
      {text && (
        <p className="text-slate-500 font-medium text-sm animate-pulse">
          {text}
        </p>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs">
        <div className="bg-white p-6 rounded-2xl shadow-xl flex flex-col items-center">
          {content}
        </div>
      </div>
    );
  }

  return content;
};

export default LoadingSpinner;
