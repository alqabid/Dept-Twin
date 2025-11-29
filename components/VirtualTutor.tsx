import React, { useState, useEffect, useRef } from 'react';
import { Volume2, X, Loader2, Bot, Sparkles, Settings2, Play, Square, Mic } from 'lucide-react';
import { EconomicIndicators, CountryProfile } from '../types';
import { getTutorInsight, generateTutorAudio } from '../services/geminiService';

interface VirtualTutorProps {
  country: CountryProfile;
  currentStats: EconomicIndicators;
  isProjection: boolean;
  policyName?: string;
}

// Map friendly names to Gemini API voice names
const VOICE_OPTIONS = [
    { id: 'Charon', label: 'Senior Analyst (Deep/Calm)', desc: 'Best for presentations' },
    { id: 'Fenrir', label: 'Executive (Bold)', desc: 'Assertive and strong' },
    { id: 'Kore', label: 'News Anchor (Clear)', desc: 'Precise and detailed' },
    { id: 'Puck', label: 'Narrator (Neutral)', desc: 'Standard storytelling' },
];

const VirtualTutor: React.FC<VirtualTutorProps> = ({ country, currentStats, isProjection, policyName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [insight, setInsight] = useState<string>("");
  const [loadingStep, setLoadingStep] = useState<'idle' | 'analyzing' | 'generating_audio'>('idle');
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('Charon'); // Default to Deep/Wise
  
  // Audio Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);

  useEffect(() => {
    // Cleanup audio on unmount
    return () => {
      stopAudio();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Reset insight when context changes drastically
  useEffect(() => {
    setInsight("");
    stopAudio();
    audioBufferRef.current = null;
  }, [country.id, isProjection, policyName]);

  const handleExplain = async () => {
    if (!isOpen) setIsOpen(true);
    stopAudio();
    
    // Step 1: Get Text Insight
    setLoadingStep('analyzing');
    try {
      const text = await getTutorInsight(country, currentStats, isProjection, policyName);
      setInsight(text);
      
      // Step 2: Generate Audio
      setLoadingStep('generating_audio');
      const audioData = await generateTutorAudio(text, selectedVoice);
      
      if (audioData) {
        await processAndPlayAudio(audioData);
      }
      setLoadingStep('idle');
      
    } catch (error) {
      console.error("Tutor sequence failed", error);
      setLoadingStep('idle');
      setInsight(insight || "I apologize, I am unable to connect to the audio service right now.");
    }
  };

  const processAndPlayAudio = async (base64String: string) => {
      try {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        
        // Decode base64
        const binaryString = atob(base64String);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        // Convert PCM to AudioBuffer
        // Gemini sends raw PCM 24kHz. We need to convert it to float32 for AudioContext
        // NOTE: The example implies raw PCM Int16. Let's decode manually.
        const int16Data = new Int16Array(bytes.buffer);
        const float32Data = new Float32Array(int16Data.length);
        for (let i = 0; i < int16Data.length; i++) {
            float32Data[i] = int16Data[i] / 32768.0;
        }
        
        const buffer = audioContextRef.current.createBuffer(1, float32Data.length, 24000);
        buffer.getChannelData(0).set(float32Data);
        audioBufferRef.current = buffer;

        playBuffer(buffer);
      } catch (e) {
          console.error("Audio processing failed", e);
      }
  };

  const playBuffer = (buffer: AudioBuffer) => {
      if (!audioContextRef.current) return;
      
      stopAudio();
      
      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContextRef.current.destination);
      source.onended = () => setIsPlaying(false);
      
      sourceNodeRef.current = source;
      source.start();
      setIsPlaying(true);
  };

  const stopAudio = () => {
      if (sourceNodeRef.current) {
          try {
              sourceNodeRef.current.stop();
          } catch (e) {
              // Ignore errors if already stopped
          }
          sourceNodeRef.current = null;
      }
      setIsPlaying(false);
  };

  const handleReplay = () => {
      if (audioBufferRef.current) {
          playBuffer(audioBufferRef.current);
      } else if (insight) {
          // If we have text but lost audio, regenerate
           handleExplain();
      }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 pointer-events-none">
      
      {/* Tutor Bubble */}
      {isOpen && (
        <div className="bg-white rounded-2xl shadow-2xl border border-red-100 p-5 w-80 mb-2 pointer-events-auto animate-in slide-in-from-bottom-10 fade-in duration-300 relative font-sans">
            <button 
                onClick={() => { setIsOpen(false); stopAudio(); }}
                className="absolute top-2 right-2 text-slate-300 hover:text-slate-600 transition-colors"
            >
                <X size={16} />
            </button>
            
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-colors duration-500 ${isPlaying ? 'bg-red-100' : 'bg-slate-100'}`}>
                    <Mic size={24} className={isPlaying ? 'text-red-600' : 'text-slate-600'} />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                        Strategic Briefing
                        {isPlaying && (
                            <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                        )}
                    </h3>
                    
                    {/* Voice Selector */}
                    <div className="relative mt-1 group">
                         <div className="flex items-center gap-1 text-xs text-slate-500 cursor-pointer hover:text-red-600 transition-colors">
                             <Settings2 size={10} />
                             <span>Voice: {VOICE_OPTIONS.find(v => v.id === selectedVoice)?.label}</span>
                         </div>
                         <select 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            value={selectedVoice}
                            onChange={(e) => setSelectedVoice(e.target.value)}
                         >
                             {VOICE_OPTIONS.map(v => (
                                 <option key={v.id} value={v.id}>{v.label} - {v.desc}</option>
                             ))}
                         </select>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="bg-slate-50 rounded-lg border border-slate-100 p-3 mb-4 min-h-[80px] max-h-[200px] overflow-y-auto custom-scrollbar">
                {loadingStep === 'analyzing' ? (
                     <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2 py-4">
                        <Loader2 size={20} className="animate-spin text-red-500" />
                        <span className="text-xs font-medium">Gathering political intelligence...</span>
                    </div>
                ) : loadingStep === 'generating_audio' ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2 py-4">
                        <Loader2 size={20} className="animate-spin text-red-500" />
                        <span className="text-xs font-medium">Preparing briefing...</span>
                    </div>
                ) : (
                    <p className="text-sm text-slate-700 leading-relaxed font-medium">
                        {insight || "I am ready to analyze the current economic situation for you."}
                    </p>
                )}
            </div>

            {/* Controls */}
            <div className="flex gap-2">
                {isPlaying ? (
                    <button 
                        onClick={stopAudio}
                        className="flex-1 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-red-200"
                    >
                        <Square size={14} fill="currentColor" /> Stop Briefing
                    </button>
                ) : (
                     <button 
                        onClick={handleReplay}
                        disabled={loadingStep !== 'idle' || !insight}
                        className={`flex-1 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors ${
                            loadingStep !== 'idle' || !insight 
                            ? 'bg-slate-100 text-slate-300' 
                            : 'bg-slate-800 hover:bg-slate-900 text-white'
                        }`}
                    >
                        <Play size={14} fill="currentColor" /> {insight ? 'Replay Audio' : 'Start Briefing'}
                    </button>
                )}
            </div>
        </div>
      )}

      {/* Main Trigger Button */}
      <button 
        onClick={handleExplain}
        disabled={loadingStep !== 'idle'}
        className={`pointer-events-auto p-4 rounded-full shadow-lg flex items-center gap-2 transition-all transform hover:scale-105 active:scale-95 group ${
            loadingStep !== 'idle' ? 'bg-slate-700 cursor-wait' : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-red-500/30'
        }`}
      >
        <div className="relative">
            {loadingStep !== 'idle' ? (
                <Loader2 size={24} className="animate-spin text-white/50" />
            ) : (
                <Bot size={24} />
            )}
            {loadingStep === 'idle' && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                </span>
            )}
        </div>
        <span className="font-bold pr-2 hidden group-hover:block whitespace-nowrap animate-in fade-in slide-in-from-right-2 duration-200">
            Analysis Briefing
        </span>
      </button>

    </div>
  );
};

export default VirtualTutor;