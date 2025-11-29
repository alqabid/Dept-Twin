import React from 'react';
import { Activity, BarChart3, Globe, Layers, Settings, ShieldAlert } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onConfigClick: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, onConfigClick }) => {
  const navItems = [
    { id: 'digital-twin', label: 'Digital Twin', icon: <Activity size={20} /> },
    { id: 'macro-data', label: 'Macro Data', icon: <BarChart3 size={20} /> },
    { id: 'scenarios', label: 'Scenarios', icon: <Layers size={20} /> },
    { id: 'risk-radar', label: 'Risk Radar', icon: <ShieldAlert size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col hidden md:flex shadow-sm z-10">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center shadow-md shadow-red-200">
              <Globe className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">DebtTwin<span className="text-red-500">.ai</span></span>
          </div>
          <p className="text-xs text-slate-500 uppercase tracking-widest mt-2 font-semibold">Africa Edition</p>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 
                ${activeTab === item.id 
                  ? 'bg-red-50 text-red-600 border border-red-100 shadow-sm' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={onConfigClick}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all"
          >
            <Settings size={20} />
            <span>System Config</span>
          </button>
          <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-xs text-slate-500 font-semibold">Model Engine</p>
            <p className="text-sm font-mono text-red-500">Gemini 2.5 Flash</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-slate-50 relative scroll-smooth">
        {children}
      </main>
    </div>
  );
};

export default Layout;