import React from 'react';
import { ArrowLeft, Map, Star, Lock } from 'lucide-react';
import * as Constants from '../constants';
import { SceneName } from '../types';

interface LevelSelectProps {
  onBack: () => void;
  onSelectLevel: (levelId: number) => void;
}

export const LevelSelect: React.FC<LevelSelectProps> = ({ onBack, onSelectLevel }) => {
  return (
    <div className="w-full h-full bg-slate-900 font-sans flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-700 flex items-center bg-slate-800 shadow-md">
            <button onClick={onBack} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-xl mr-4 text-white transition-colors">
                <ArrowLeft size={24} />
            </button>
            <h2 className="text-2xl font-bold text-white flex items-center">
                <Map className="mr-3 text-blue-400" /> Seleção de Fases
            </h2>
        </div>

        {/* Level Grid */}
        <div className="flex-1 p-8 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Constants.LEVELS.map((level, index) => (
                    <button 
                        key={level.id}
                        onClick={() => onSelectLevel(level.id)}
                        className="bg-slate-800 rounded-2xl p-6 border-2 border-slate-600 hover:border-blue-400 hover:bg-slate-750 transition-all group text-left relative overflow-hidden shadow-xl"
                    >
                        {/* Level Thumbnail Placeholder */}
                        <div className="h-32 bg-slate-900 rounded-xl mb-4 flex items-center justify-center border border-slate-700 group-hover:border-blue-500/50">
                            <span className="text-5xl font-black text-slate-700 group-hover:text-blue-500/30 transition-colors">{level.id}</span>
                        </div>
                        
                        <div className="flex justify-between items-end">
                            <div>
                                <h3 className="text-xl font-bold text-white mb-1">Fase {level.id}</h3>
                                <span className="text-sm text-green-400 font-mono px-2 py-0.5 bg-green-900/30 rounded border border-green-900/50">
                                    {level.difficulty}
                                </span>
                            </div>
                            <div className="flex text-yellow-500">
                                <Star size={16} fill="currentColor" />
                                <Star size={16} fill="currentColor" />
                                <Star size={16} className="text-slate-600" />
                            </div>
                        </div>
                    </button>
                ))}

                {/* Locked Levels Placeholders */}
                {[2, 3].map(lvl => (
                    <div key={lvl} className="bg-slate-800/50 rounded-2xl p-6 border-2 border-slate-700/50 flex flex-col items-center justify-center text-slate-500 cursor-not-allowed">
                        <Lock size={48} className="mb-4 opacity-50" />
                        <h3 className="text-xl font-bold">Fase {lvl}</h3>
                        <span className="text-sm">Bloqueado</span>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};
