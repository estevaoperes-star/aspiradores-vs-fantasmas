import React, { useState } from 'react';
import { ArrowLeft, Settings, Volume2, Music, Monitor } from 'lucide-react';

interface OptionsProps {
  onBack: () => void;
}

export const Options: React.FC<OptionsProps> = ({ onBack }) => {
  const [sfxVol, setSfxVol] = useState(80);
  const [musicVol, setMusicVol] = useState(50);

  return (
    <div className="w-full h-full bg-slate-900 font-sans flex flex-col items-center justify-center">
        <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-2xl w-full max-w-md">
            
            <div className="flex items-center mb-8 border-b border-slate-700 pb-4">
                <button onClick={onBack} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg mr-4 text-white">
                    <ArrowLeft size={20} />
                </button>
                <h2 className="text-2xl font-bold text-white flex items-center">
                    <Settings className="mr-3 text-orange-400" /> Configurações
                </h2>
            </div>

            <div className="space-y-6">
                {/* Volume SFX */}
                <div>
                    <div className="flex justify-between text-gray-300 mb-2 font-bold">
                        <span className="flex items-center"><Volume2 size={18} className="mr-2"/> Efeitos Sonoros</span>
                        <span>{sfxVol}%</span>
                    </div>
                    <input 
                        type="range" 
                        min="0" max="100" 
                        value={sfxVol} 
                        onChange={(e) => setSfxVol(parseInt(e.target.value))}
                        className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    />
                </div>

                {/* Volume Music */}
                <div>
                    <div className="flex justify-between text-gray-300 mb-2 font-bold">
                        <span className="flex items-center"><Music size={18} className="mr-2"/> Música</span>
                        <span>{musicVol}%</span>
                    </div>
                    <input 
                        type="range" 
                        min="0" max="100" 
                        value={musicVol} 
                        onChange={(e) => setMusicVol(parseInt(e.target.value))}
                        className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                </div>

                {/* Graphics Quality */}
                <div className="pt-4 border-t border-slate-700">
                    <div className="flex items-center text-gray-300 mb-3 font-bold">
                        <Monitor size={18} className="mr-2"/> Gráficos
                    </div>
                    <div className="flex bg-slate-900 p-1 rounded-lg">
                        {['Baixo', 'Médio', 'Alto'].map((opt, i) => (
                            <button 
                                key={opt}
                                className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${i === 2 ? 'bg-slate-700 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            
            <div className="mt-8 text-center text-xs text-gray-600">
                v1.0.2 - Build 2024
            </div>
        </div>
    </div>
  );
};
