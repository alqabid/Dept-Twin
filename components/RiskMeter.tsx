import React from 'react';

interface RiskMeterProps {
  value: number; // 0-100
  label: string;
}

const RiskMeter: React.FC<RiskMeterProps> = ({ value, label }) => {
  // Determine color based on risk
  const getColor = (val: number) => {
    if (val < 40) return 'text-emerald-500 stroke-emerald-500';
    if (val < 70) return 'text-amber-500 stroke-amber-500';
    return 'text-rose-500 stroke-rose-500';
  };

  const getLabel = (val: number) => {
      if (val < 40) return 'Stable';
      if (val < 70) return 'Elevated Risk';
      return 'Critical Distress';
  }

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center py-4">
      <div className="relative w-32 h-32">
        {/* Background Circle */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="64"
            cy="64"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-slate-200"
          />
          {/* Progress Circle */}
          <circle
            cx="64"
            cy="64"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={`transition-all duration-1000 ease-out ${getColor(value)}`}
          />
        </svg>
        <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center">
          <span className={`text-2xl font-bold ${getColor(value).split(' ')[0]}`}>{value}%</span>
          <span className="text-xs text-slate-500 uppercase">Prob.</span>
        </div>
      </div>
      <div className="text-center mt-2">
        <h4 className="text-sm font-semibold text-slate-700">{label}</h4>
        <p className={`text-xs font-bold mt-1 ${getColor(value).split(' ')[0]}`}>{getLabel(value)}</p>
      </div>
    </div>
  );
};

export default RiskMeter;