import { CountryProfile, PolicyCategory, PolicyOption } from "./types";

export const COUNTRIES: CountryProfile[] = [
  {
    id: "GH",
    name: "Ghana",
    currency: "GHS",
    flagEmoji: "🇬🇭",
    description: "West African economy managing high debt service costs and inflation volatility.",
    currentStats: {
      year: 2025,
      gdpGrowth: 3.2,
      debtToGdp: 69.4,
      inflation: 18.5,
      reserves: 6.2,
      fiscalDeficit: 4.1,
      crisisProbability: 61
    }
  },
  {
    id: "KE",
    name: "Kenya",
    currency: "KES",
    flagEmoji: "🇰🇪",
    description: "East African hub balancing infrastructure loans with export growth.",
    currentStats: {
      year: 2025,
      gdpGrowth: 5.4,
      debtToGdp: 67.1,
      inflation: 5.8,
      reserves: 7.5,
      fiscalDeficit: 3.5,
      crisisProbability: 55
    }
  },
  {
    id: "NG",
    name: "Nigeria",
    currency: "NGN",
    flagEmoji: "🇳🇬",
    description: "Largest economy in Africa, facing FX liquidity challenges and oil dependency.",
    currentStats: {
      year: 2025,
      gdpGrowth: 3.4,
      debtToGdp: 41.2,
      inflation: 24.5,
      reserves: 34.1,
      fiscalDeficit: 4.8,
      crisisProbability: 68
    }
  }
];

export const POLICIES: PolicyOption[] = [
  {
    id: "eurobond",
    title: "Issue $3B Eurobond",
    description: "Issue a sovereign bond on international markets at 9.5% yield to shore up reserves.",
    category: PolicyCategory.DEBT,
    intensity: "High"
  },
  {
    id: "imf_bailout",
    title: "IMF Extended Credit Facility",
    description: "Secure $3B concessional loan with conditionalities on spending cuts and tax reforms.",
    category: PolicyCategory.STRUCTURAL,
    intensity: "Medium"
  },
  {
    id: "tax_digital",
    title: "Digital Tax Reform",
    description: "Increase digital services tax by 5% and enforce strict compliance via AI monitoring.",
    category: PolicyCategory.FISCAL,
    intensity: "Medium"
  },
  {
    id: "green_swap",
    title: "Debt-for-Nature Swap",
    description: "Exchange $1B of commercial debt for conservation commitments and green bonds.",
    category: PolicyCategory.DEBT,
    intensity: "Low"
  },
  {
    id: "remove_subsidy",
    title: "Remove Fuel Subsidies",
    description: "Complete removal of petrol and electricity subsidies to reduce fiscal deficit.",
    category: PolicyCategory.FISCAL,
    intensity: "High"
  },
  {
    id: "export_diversify",
    title: "Agro-Processing Export Drive",
    description: "Subsidize local manufacturing to shift from raw material exports to finished goods.",
    category: PolicyCategory.STRUCTURAL,
    intensity: "High"
  }
];