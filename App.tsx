import React, { useState, useEffect, useMemo } from 'react';
import Layout from './components/Layout';
import { COUNTRIES, POLICIES } from './constants';
import { CountryProfile, PolicyOption, SimulationResponse, EconomicIndicators } from './types';
import { runSimulation } from './services/geminiService';
import { DebtChart, MacroChart, ReservesChart } from './components/SimulationCharts';
import RiskMeter from './components/RiskMeter';
import VirtualTutor from './components/VirtualTutor';
import { ArrowRight, Bot, ChevronDown, Clock, Cpu, FileText, Info, Loader2, Play, TrendingUp, AlertTriangle, CheckCircle2, X, Sliders } from 'lucide-react';

// Initial placeholder for simulation result
const EMPTY_SIMULATION: SimulationResponse = {
  scenarioName: "Baseline",
  projections: [],
  aiAnalysis: "Select a policy to generate an AI impact analysis.",
  recommendations: []
};

// System Config Type
interface SystemConfig {
    aiCreativity: number; // 0.0 to 1.0 (Temperature)
    riskSensitivity: 'Conservative' | 'Standard' | 'Aggressive';
    showConfidenceIntervals: boolean;
}

function App() {
  const [activeTab, setActiveTab] = useState('digital-twin');
  const [selectedCountry, setSelectedCountry] = useState<CountryProfile>(COUNTRIES[0]);
  const [selectedPolicy, setSelectedPolicy] = useState<PolicyOption | null>(null);
  const [customParams, setCustomParams] = useState<string>("");
  const [simulationResult, setSimulationResult] = useState<SimulationResponse>(EMPTY_SIMULATION);
  const [isSimulating, setIsSimulating] = useState(false);
  const [historicalData, setHistoricalData] = useState<EconomicIndicators[]>([]);
  
  // Year Selector State
  const [selectedYear, setSelectedYear] = useState<number>(2025);

  // System Config State
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
      aiCreativity: 0.4,
      riskSensitivity: 'Standard',
      showConfidenceIntervals: false
  });

  // Reset simulation and history when country changes
  useEffect(() => {
    // Generate mock historical data (previous 3 years) based on 2025 base
    const current = selectedCountry.currentStats; // 2025
    const history = [
      { ...current, year: current.year - 2, debtToGdp: Math.max(0, current.debtToGdp - 4.5), reserves: current.reserves + 1.2, gdpGrowth: current.gdpGrowth + 0.5 },
      { ...current, year: current.year - 1, debtToGdp: Math.max(0, current.debtToGdp - 1.8), reserves: current.reserves + 0.5, gdpGrowth: current.gdpGrowth - 0.2 },
      current
    ];
    setHistoricalData(history);
    setSimulationResult(EMPTY_SIMULATION);
    setSelectedPolicy(null);
    setSelectedYear(current.year);
  }, [selectedCountry]);

  // Handle Simulation
  const handleSimulate = async () => {
    if (!selectedPolicy) return;
    
    setIsSimulating(true);
    try {
      // Pass config params if needed (mocked influence by just string for now if API allowed)
      // For now, we rely on the service default but could pass temperature in real app
      const result = await runSimulation(selectedCountry, selectedPolicy, customParams);
      setSimulationResult(result);
      // Auto-select the last year of projection to show impact
      if (result.projections.length > 0) {
        setSelectedYear(result.projections[result.projections.length - 1].year);
      }
      // Switch to Digital Twin tab if not already active to see results
      setActiveTab('digital-twin');
    } catch (error) {
      alert("Simulation failed. Please check API Key or try again.");
    } finally {
      setIsSimulating(false);
    }
  };

  // Merge History + Projections into a single timeline
  const timeSeriesData = useMemo(() => {
    const combined = [...historicalData];
    
    if (simulationResult.projections.length > 0) {
        simulationResult.projections.forEach(proj => {
            // If year exists in history, replace it (unlikely but good for safety), else add
            const index = combined.findIndex(d => d.year === proj.year);
            if (index >= 0) {
                combined[index] = proj;
            } else {
                combined.push(proj);
            }
        });
    }
    return combined.sort((a, b) => a.year - b.year);
  }, [historicalData, simulationResult]);

  // Get stats for the currently selected year
  const statsForYear = useMemo(() => {
      return timeSeriesData.find(d => d.year === selectedYear) || selectedCountry.currentStats;
  }, [timeSeriesData, selectedYear, selectedCountry]);

  // Helper to determine if the selected year is a projection
  const isProjection = selectedYear > selectedCountry.currentStats.year;

  return (
    <Layout 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        onConfigClick={() => setIsConfigOpen(true)}
    >
      {/* Header Bar */}
      <header className="bg-white/80 border-b border-slate-200 p-6 sticky top-0 z-20 backdrop-blur-md">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span className="text-3xl">{selectedCountry.flagEmoji}</span>
              {selectedCountry.name} <span className="text-slate-400 font-light">Digital Twin</span>
            </h1>
            <p className="text-slate-500 text-sm mt-1">{selectedCountry.description}</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
             {/* Year Selector */}
             <div className="bg-slate-100 p-1 rounded-lg border border-slate-200 flex items-center gap-1 overflow-x-auto max-w-full">
                {timeSeriesData.map(d => (
                    <button
                        key={d.year}
                        onClick={() => setSelectedYear(d.year)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all whitespace-nowrap ${
                            selectedYear === d.year 
                            ? (d.year > selectedCountry.currentStats.year ? 'bg-red-600 text-white shadow-md shadow-red-500/20' : 'bg-slate-800 text-white')
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
                        }`}
                    >
                        {d.year}
                        {d.year === selectedCountry.currentStats.year && <span className="ml-1 opacity-50">•</span>}
                    </button>
                ))}
             </div>

             {/* Country Switcher */}
             <div className="relative group z-30">
                <button className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 shadow-sm transition-colors text-sm font-medium text-slate-700">
                    <span>Switch Country</span>
                    <ChevronDown size={16} />
                </button>
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden hidden group-hover:block">
                    {COUNTRIES.map(c => (
                        <button 
                            key={c.id} 
                            onClick={() => setSelectedCountry(c)}
                            className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-2 text-sm text-slate-700 border-b border-slate-50 last:border-0"
                        >
                            <span>{c.flagEmoji}</span>
                            {c.name}
                        </button>
                    ))}
                </div>
             </div>
          </div>
        </div>
      </header>

      <div className="p-6">
        
        {/* VIEW: DIGITAL TWIN (Main Dashboard) */}
        {activeTab === 'digital-twin' && (
            <div className="grid grid-cols-12 gap-6 animate-in fade-in duration-500">
                
                {/* Left Column: Input & Snapshot */}
                <div className="col-span-12 lg:col-span-4 space-y-6">
                    
                    {/* Snapshot Card */}
                    <div className={`rounded-xl border p-5 transition-colors duration-500 ${isProjection ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className={`text-sm font-semibold uppercase tracking-wider flex items-center gap-2 ${isProjection ? 'text-red-700' : 'text-slate-500'}`}>
                                <Clock size={16} className={isProjection ? "text-red-500" : "text-slate-400"} />
                                {isProjection ? "Projected State" : "Historical Snapshot"} ({selectedYear})
                            </h3>
                            {isProjection && <span className="text-xs bg-white text-red-600 px-2 py-1 rounded border border-red-200 font-bold shadow-sm">SIMULATION</span>}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <StatBox label="GDP Growth" value={`${statsForYear.gdpGrowth}%`} />
                            <StatBox label="Inflation" value={`${statsForYear.inflation}%`} color={statsForYear.inflation > 10 ? "text-amber-600" : "text-emerald-600"} />
                            <StatBox label="Debt/GDP" value={`${statsForYear.debtToGdp}%`} color={statsForYear.debtToGdp > 70 ? "text-rose-600" : "text-slate-900"} />
                            <StatBox label="Reserves" value={`$${statsForYear.reserves}B`} color={statsForYear.reserves < 5 ? "text-rose-600" : "text-emerald-600"} />
                        </div>
                        {isProjection && (
                             <div className="mt-4 pt-4 border-t border-red-200 text-xs text-red-700 flex items-start gap-2">
                                <Info size={14} className="mt-0.5 shrink-0 text-red-500" />
                                <p>These values are generated by AI based on the "{selectedPolicy?.title}" scenario.</p>
                             </div>
                        )}
                    </div>

                    {/* Policy Input */}
                    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Cpu className="text-red-500" size={20} />
                            Policy Simulator
                        </h2>
                        
                        <div className="space-y-3">
                            <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Select Intervention</label>
                            <div className="grid gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {POLICIES.map(policy => (
                                    <button
                                        key={policy.id}
                                        onClick={() => setSelectedPolicy(policy)}
                                        className={`p-3 rounded-lg border text-left transition-all ${selectedPolicy?.id === policy.id ? 'bg-red-50 border-red-500 text-red-900 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-white'}`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-semibold text-sm">{policy.title}</span>
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${
                                                policy.category === 'Debt Management' ? 'border-rose-200 bg-rose-50 text-rose-700' : 
                                                policy.category === 'Fiscal Reform' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' :
                                                'border-amber-200 bg-amber-50 text-amber-700'
                                            }`}>{policy.category}</span>
                                        </div>
                                        <p className="text-xs opacity-80 line-clamp-2">{policy.description}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mt-4">
                            <label className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-2 block">Custom Parameter Tweaks (Optional)</label>
                            <textarea 
                                value={customParams}
                                onChange={(e) => setCustomParams(e.target.value)}
                                placeholder="e.g., Assume oil prices drop by 20% in 2026..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-700 focus:outline-none focus:border-red-500 h-24 resize-none transition-all"
                            />
                        </div>

                        <button 
                            onClick={handleSimulate}
                            disabled={!selectedPolicy || isSimulating}
                            className={`w-full mt-6 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${
                                !selectedPolicy || isSimulating ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' : 'bg-gradient-to-r from-red-600 to-rose-600 text-white hover:from-red-500 hover:to-rose-500 shadow-red-500/30'
                            }`}
                        >
                            {isSimulating ? <Loader2 className="animate-spin" /> : <Play size={18} fill="currentColor" />}
                            {isSimulating ? 'Processing Simulation...' : 'Run Simulation'}
                        </button>
                    </div>
                </div>

                {/* Right Column: Results */}
                <div className="col-span-12 lg:col-span-8 space-y-6">
                    {/* Risk & Analysis Header */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col items-center justify-center relative overflow-hidden shadow-sm">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 opacity-50"></div>
                            <RiskMeter value={statsForYear.crisisProbability} label="Crisis Probability" />
                        </div>
                        
                        <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 p-6 flex flex-col shadow-sm">
                            <div className="flex items-center gap-2 mb-3">
                                <Bot className="text-red-500" size={24} />
                                <h3 className="text-lg font-bold text-slate-900">AI Policy Advisor</h3>
                            </div>
                            
                            {simulationResult.projections.length > 0 ? (
                                <div className="space-y-4 animate-in fade-in duration-500">
                                    <p className="text-slate-600 text-sm leading-relaxed border-l-4 border-red-500 pl-4 bg-slate-50 py-2 pr-2 rounded-r">
                                        {simulationResult.aiAnalysis}
                                    </p>
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Strategic Recommendations</h4>
                                        <ul className="space-y-2">
                                            {simulationResult.recommendations.map((rec, i) => (
                                                <li key={i} className="flex items-start gap-2 text-sm text-slate-700 bg-slate-50 p-2 rounded border border-slate-100">
                                                    <div className="mt-1 min-w-[16px]"><ArrowRight size={14} className="text-emerald-500" /></div>
                                                    {rec}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                                    <TrendingUp size={40} className="mb-2 opacity-30" />
                                    <p className="text-sm">Run a simulation to generate AI insights.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Chart Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ChartCard title="Debt Sustainability Outlook (5 Years)">
                            <DebtChart data={timeSeriesData} />
                        </ChartCard>
                        <ChartCard title="Inflation & Growth Correlation">
                            <MacroChart data={timeSeriesData} />
                        </ChartCard>
                        <ChartCard title="FX Reserves Projection">
                            <ReservesChart data={timeSeriesData} />
                        </ChartCard>
                        
                        {/* Data Table */}
                        <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col h-[300px] shadow-sm">
                            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <FileText size={16} className="text-slate-400" />
                                Impact Summary
                            </h3>
                            <div className="flex-1 overflow-auto custom-scrollbar">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0 z-10">
                                        <tr>
                                            <th className="px-3 py-2 rounded-l-md">Year</th>
                                            <th className="px-3 py-2">Debt %</th>
                                            <th className="px-3 py-2 rounded-r-md">Deficit %</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {timeSeriesData.map(d => (
                                            <tr key={d.year} className={`hover:bg-slate-50 transition-colors ${d.year === selectedYear ? 'bg-red-50' : ''}`}>
                                                <td className="px-3 py-2 font-mono text-slate-600">
                                                    {d.year}
                                                    {d.year > selectedCountry.currentStats.year && <span className="text-red-500 ml-1">*</span>}
                                                </td>
                                                <td className={`px-3 py-2 font-medium ${d.debtToGdp > 70 ? 'text-rose-600' : 'text-slate-700'}`}>
                                                    {d.debtToGdp}%
                                                </td>
                                                <td className="px-3 py-2 text-slate-700">{d.fiscalDeficit}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* VIEW: MACRO DATA */}
        {activeTab === 'macro-data' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <TrendingUp className="text-red-500" />
                        Macroeconomic Deep Dive
                    </h2>
                    <div className="grid grid-cols-1 gap-8">
                         <div className="h-80">
                            <h3 className="text-slate-500 text-sm mb-2 uppercase font-semibold">Debt Trajectory</h3>
                            <DebtChart data={timeSeriesData} />
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="h-64">
                                <h3 className="text-slate-500 text-sm mb-2 uppercase font-semibold">Economic Fundamentals</h3>
                                <MacroChart data={timeSeriesData} />
                            </div>
                            <div className="h-64">
                                <h3 className="text-slate-500 text-sm mb-2 uppercase font-semibold">Liquidity & Reserves</h3>
                                <ReservesChart data={timeSeriesData} />
                            </div>
                         </div>
                    </div>
                </div>
            </div>
        )}

        {/* VIEW: SCENARIOS */}
        {activeTab === 'scenarios' && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {POLICIES.map(policy => (
                    <div key={policy.id} className="bg-white rounded-xl border border-slate-200 p-6 hover:border-red-300 hover:shadow-lg transition-all cursor-pointer group shadow-sm" onClick={() => { setSelectedPolicy(policy); setActiveTab('digital-twin'); }}>
                        <div className="flex justify-between items-start mb-4">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                policy.intensity === 'High' ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'
                            }`}>
                                <Cpu size={20} />
                            </div>
                            <span className="text-xs font-bold px-2 py-1 rounded bg-slate-50 text-slate-500 border border-slate-200">{policy.category}</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-red-600 transition-colors">{policy.title}</h3>
                        <p className="text-slate-500 text-sm mb-4">{policy.description}</p>
                        <div className="flex items-center text-xs font-medium text-slate-400 gap-2">
                            <span>Intensity:</span>
                            <span className={policy.intensity === 'High' ? 'text-rose-500' : 'text-slate-600'}>{policy.intensity}</span>
                        </div>
                        <button className="w-full mt-4 py-2 rounded bg-slate-100 hover:bg-red-600 hover:text-white text-slate-600 text-sm font-medium transition-colors">
                            Load Scenario
                        </button>
                    </div>
                ))}
             </div>
        )}

        {/* VIEW: RISK RADAR */}
        {activeTab === 'risk-radar' && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in zoom-in-95 duration-500">
                <div className="relative">
                    <div className="absolute inset-0 bg-red-500 blur-[100px] opacity-10 rounded-full"></div>
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center relative z-10 max-w-2xl w-full shadow-xl">
                        <h2 className="text-2xl font-bold text-slate-900 mb-8">Sovereign Risk Radar</h2>
                        <div className="flex justify-center mb-8">
                            <div className="scale-150">
                                <RiskMeter value={statsForYear.crisisProbability} label="Current Risk Level" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-left mt-8">
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                                <h4 className="text-slate-500 text-sm font-bold uppercase mb-2 flex items-center gap-2">
                                    <AlertTriangle size={16} className="text-amber-500"/> Risk Factors
                                </h4>
                                <ul className="space-y-2 text-sm text-slate-700">
                                    <li>• High external debt service</li>
                                    <li>• Currency volatility exposure</li>
                                    <li>• Import dependency</li>
                                </ul>
                            </div>
                             <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                                <h4 className="text-slate-500 text-sm font-bold uppercase mb-2 flex items-center gap-2">
                                    <CheckCircle2 size={16} className="text-emerald-500"/> Mitigants
                                </h4>
                                <ul className="space-y-2 text-sm text-slate-700">
                                    <li>• Strong institutional framework</li>
                                    <li>• Digitizing tax revenue</li>
                                    <li>• Growing tech sector</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </div>

      {/* Virtual Tutor Component */}
      <VirtualTutor 
          country={selectedCountry}
          currentStats={statsForYear}
          isProjection={isProjection}
          policyName={selectedPolicy?.title}
      />

      {/* System Config Modal */}
      {isConfigOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 relative">
                  <button 
                    onClick={() => setIsConfigOpen(false)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-900"
                  >
                      <X size={20} />
                  </button>
                  
                  <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-slate-100 rounded-lg">
                          <Sliders className="text-slate-900" size={24} />
                      </div>
                      <div>
                          <h2 className="text-xl font-bold text-slate-900">System Configuration</h2>
                          <p className="text-sm text-slate-500">Tune the Digital Twin Parameters</p>
                      </div>
                  </div>

                  <div className="space-y-6">
                      <div>
                          <div className="flex justify-between mb-2">
                              <label className="text-sm font-semibold text-slate-700">AI Model Creativity (Temp)</label>
                              <span className="text-sm font-mono text-red-500">{systemConfig.aiCreativity}</span>
                          </div>
                          <input 
                            type="range" 
                            min="0" max="1" step="0.1"
                            value={systemConfig.aiCreativity}
                            onChange={(e) => setSystemConfig({...systemConfig, aiCreativity: parseFloat(e.target.value)})}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-600"
                          />
                          <p className="text-xs text-slate-500 mt-1">Lower values produce more conservative, analytical projections.</p>
                      </div>

                      <div>
                          <label className="text-sm font-semibold text-slate-700 mb-2 block">Risk Sensitivity Model</label>
                          <div className="grid grid-cols-3 gap-2">
                              {['Conservative', 'Standard', 'Aggressive'].map((mode) => (
                                  <button
                                    key={mode}
                                    onClick={() => setSystemConfig({...systemConfig, riskSensitivity: mode as any})}
                                    className={`py-2 px-1 rounded border text-xs font-medium transition-all ${
                                        systemConfig.riskSensitivity === mode 
                                        ? 'bg-red-50 border-red-500 text-red-700' 
                                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                    }`}
                                  >
                                      {mode}
                                  </button>
                              ))}
                          </div>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                          <span className="text-sm font-medium text-slate-700">Show Confidence Intervals</span>
                          <button 
                            onClick={() => setSystemConfig({...systemConfig, showConfidenceIntervals: !systemConfig.showConfidenceIntervals})}
                            className={`w-10 h-6 rounded-full transition-colors relative ${systemConfig.showConfidenceIntervals ? 'bg-red-500' : 'bg-slate-300'}`}
                          >
                              <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${systemConfig.showConfidenceIntervals ? 'translate-x-4' : ''}`} />
                          </button>
                      </div>
                  </div>

                  <div className="mt-8 pt-4 border-t border-slate-100 flex justify-end">
                      <button 
                        onClick={() => setIsConfigOpen(false)}
                        className="px-6 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10"
                      >
                          Save Changes
                      </button>
                  </div>
              </div>
          </div>
      )}
    </Layout>
  );
}

const StatBox = ({ label, value, color = "text-slate-900" }: { label: string, value: string, color?: string }) => (
    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
        <p className="text-xs text-slate-500 uppercase font-semibold mb-1">{label}</p>
        <p className={`text-xl font-bold font-mono tracking-tight ${color}`}>{value}</p>
    </div>
);

const ChartCard = ({ title, children }: { title: string, children?: React.ReactNode }) => (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm h-[300px] flex flex-col">
        <h3 className="text-sm font-semibold text-slate-700 mb-4 shrink-0">{title}</h3>
        <div className="flex-1 min-h-0">
            {children}
        </div>
    </div>
);

export default App;