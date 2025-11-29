import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line } from 'recharts';
import { EconomicIndicators } from '../types';

interface SimulationChartsProps {
  data: EconomicIndicators[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 p-3 rounded shadow-xl text-slate-900">
        <p className="text-slate-900 font-bold mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm font-medium" style={{ color: entry.color }}>
            {entry.name}: {Number(entry.value).toFixed(1)}{entry.unit || ''}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const DebtChart: React.FC<SimulationChartsProps> = ({ data }) => (
  <ResponsiveContainer width="100%" height={250}>
    <AreaChart data={data}>
      <defs>
        <linearGradient id="colorDebt" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
          <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
      <XAxis dataKey="year" stroke="#64748b" tick={{ fontSize: 12 }} />
      <YAxis stroke="#64748b" tick={{ fontSize: 12 }} domain={['auto', 'auto']} />
      <Tooltip content={<CustomTooltip />} />
      <Area 
        type="monotone" 
        dataKey="debtToGdp" 
        name="Debt/GDP" 
        stroke="#ef4444" 
        fillOpacity={1} 
        fill="url(#colorDebt)" 
        unit="%"
        strokeWidth={2}
      />
    </AreaChart>
  </ResponsiveContainer>
);

export const MacroChart: React.FC<SimulationChartsProps> = ({ data }) => (
  <ResponsiveContainer width="100%" height={250}>
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
      <XAxis dataKey="year" stroke="#64748b" tick={{ fontSize: 12 }} />
      <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
      <Tooltip content={<CustomTooltip />} />
      <Line type="monotone" dataKey="inflation" name="Inflation" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} unit="%" />
      <Line type="monotone" dataKey="gdpGrowth" name="GDP Growth" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} unit="%" />
    </LineChart>
  </ResponsiveContainer>
);

export const ReservesChart: React.FC<SimulationChartsProps> = ({ data }) => (
  <ResponsiveContainer width="100%" height={250}>
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
      <XAxis dataKey="year" stroke="#64748b" tick={{ fontSize: 12 }} />
      <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
      <Tooltip content={<CustomTooltip />} cursor={{fill: '#f1f5f9'}}/>
      <Bar dataKey="reserves" name="FX Reserves ($B)" fill="#10b981" radius={[4, 4, 0, 0]} />
    </BarChart>
  </ResponsiveContainer>
);