export interface EconomicIndicators {
  year: number;
  gdpGrowth: number; // Percentage
  debtToGdp: number; // Percentage
  inflation: number; // Percentage
  reserves: number; // Billions USD
  fiscalDeficit: number; // Percentage of GDP
  crisisProbability: number; // 0-100
}

export interface CountryProfile {
  id: string;
  name: string;
  currency: string;
  flagEmoji: string;
  currentStats: EconomicIndicators;
  description: string;
}

export enum PolicyCategory {
  FISCAL = "Fiscal Reform",
  MONETARY = "Monetary Policy",
  DEBT = "Debt Management",
  STRUCTURAL = "Structural Reform"
}

export interface PolicyOption {
  id: string;
  title: string;
  description: string;
  category: PolicyCategory;
  intensity: string; // e.g., "High", "Medium"
}

export interface SimulationResponse {
  scenarioName: string;
  projections: EconomicIndicators[];
  aiAnalysis: string;
  recommendations: string[];
}
