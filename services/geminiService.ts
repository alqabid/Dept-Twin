import { GoogleGenAI, Type, Modality } from "@google/genai";
import { CountryProfile, PolicyOption, SimulationResponse, EconomicIndicators } from "../types";

const parseJson = (text: string) => {
    try {
        return JSON.parse(text);
    } catch (e) {
        // Fallback cleanup if markdown code blocks remain
        const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleaned);
    }
}

const getApiKey = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API Key not found");
    }
    return apiKey;
}

export const runSimulation = async (
  country: CountryProfile,
  policy: PolicyOption,
  customParams?: string
): Promise<SimulationResponse> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });

  const currentYear = new Date().getFullYear();
  
  const prompt = `
    You are an advanced economic simulation engine for African markets.
    Perform a 5-year 'Digital Twin' simulation for ${country.name}.
    
    Current Baseline Data (${currentYear}):
    - GDP Growth: ${country.currentStats.gdpGrowth}%
    - Debt-to-GDP: ${country.currentStats.debtToGdp}%
    - Inflation: ${country.currentStats.inflation}%
    - Forex Reserves: $${country.currentStats.reserves} Billion
    - Crisis Probability: ${country.currentStats.crisisProbability}%
    
    The user wants to apply the following policy/shock:
    Policy: "${policy.title}"
    Details: ${policy.description}
    ${customParams ? `Additional Context: ${customParams}` : ""}

    Generate a realistic 5-year economic projection based on this policy. 
    
    CRITICAL POLITICAL ECONOMY INSTRUCTION:
    In your "aiAnalysis", you MUST consider the political feasibility. 
    - Identify the likely ruling party or political climate in ${country.name} (e.g., election cycles).
    - Analyze how voters or opposition parties might react to "${policy.title}".
    - Mention specific political risks (e.g., protests, parliamentary gridlock).

    Also provide 3 specific actionable recommendations.
  `;

  const schema = {
    type: Type.OBJECT,
    properties: {
      scenarioName: { type: Type.STRING },
      projections: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            year: { type: Type.INTEGER },
            gdpGrowth: { type: Type.NUMBER },
            debtToGdp: { type: Type.NUMBER },
            inflation: { type: Type.NUMBER },
            reserves: { type: Type.NUMBER },
            fiscalDeficit: { type: Type.NUMBER },
            crisisProbability: { type: Type.NUMBER },
          },
          required: ["year", "gdpGrowth", "debtToGdp", "inflation", "reserves", "fiscalDeficit", "crisisProbability"]
        },
      },
      aiAnalysis: { type: Type.STRING },
      recommendations: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    },
    required: ["scenarioName", "projections", "aiAnalysis", "recommendations"]
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.4,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    return parseJson(text) as SimulationResponse;

  } catch (error) {
    console.error("Simulation failed:", error);
    throw error;
  }
};

export const getTutorInsight = async (
    country: CountryProfile,
    currentStats: EconomicIndicators,
    isProjection: boolean,
    policyName?: string
): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });

    const prompt = `
        You are a Senior Chief Economist presenting to the Cabinet.
        
        Context:
        - Country: ${country.name}
        - Year: ${currentStats.year}
        - Key Stats: Debt/GDP ${currentStats.debtToGdp}%, Inflation ${currentStats.inflation}%, Growth ${currentStats.gdpGrowth}%.
        - Scenario: ${isProjection ? `Projected outcome of policy: "${policyName}"` : "Historical/Current Baseline"}.

        Task:
        Provide a high-level briefing on the economic outlook.
        
        CRITICAL REQUIREMENTS:
        1. USE GOOGLE SEARCH to find the current ruling political party in ${country.name}, the current Finance Minister, and any recent major economic news (e.g., IMF visits, Eurobond buybacks, protests).
        2. Integrate this real-world political context into your analysis. Mention the party names or specific ministers if relevant to the policy success.
        3. Explain the numbers clearly but professionally.
        4. Tone: Formal, authoritative, presentation-style. Do NOT use patronizing terms like "dear child". Speak as if you are addressing peers or government officials.
        5. Structure: Start with "Honorable members..." or "Distinguished colleagues..." or a direct professional opening.
        
        Length: 3-5 sentences. Keep it punchy and insightful.
    `;

    try {
        // Attempt with Google Search first
        try {
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: {
                    tools: [{ googleSearch: {} }], // Enable search for real-time political info
                    temperature: 0.7,
                }
            });
            return response.text || "I am currently unable to access the latest market data.";
        } catch (searchError) {
            console.warn("Search grounding failed, falling back to standard generation:", searchError);
            // Fallback without tools to avoid crashing if search is blocked/unavailable
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: {
                    temperature: 0.7,
                }
            });
            return response.text || "I am currently unable to access the latest market data.";
        }
    } catch (error) {
        console.error("Tutor error:", error);
        return "System offline. Unable to retrieve political context at this moment.";
    }
}

export const generateTutorAudio = async (text: string, voiceName: string = 'Charon'): Promise<string | undefined> => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: voiceName }
                    }
                }
            }
        });

        const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        return audioData;
    } catch (error) {
        console.error("Audio generation error:", error);
        return undefined;
    }
}