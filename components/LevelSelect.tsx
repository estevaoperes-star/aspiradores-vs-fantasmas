
import React from 'react';
import { ArrowLeft, Map, Star, Lock } from 'lucide-react';
import * as Constants from '../constants';

interface LevelSelectProps {
  onBack: () => void;
  onSelectLevel: (levelId: number) => void;
  maxUnlockedLevel: number;
}

export const LevelSelect: React.FC<LevelSelectProps> = ({ onBack, onSelectLevel, maxUnlockedLevel }) => {
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
                {Constants.LEVELS.map((level) => {
                    const isLocked = level.id > maxUnlockedLevel;
                    return (
                        <button 
                            key={level.id}
                            onClick={() => !isLocked && onSelectLevel(level.id)}
                            disabled={isLocked}
                            className={`
                                rounded-2xl p-6 border-2 relative overflow-hidden shadow-xl text-left transition-all
                                ${isLocked 
                                    ? 'bg-slate-800/50 border-slate-700/50 cursor-not-allowed opacity-70' 
                                    : 'bg-slate-800 border-slate-600 hover:border-blue-400 hover:bg-slate-750 group'
                                }
                            `}
                        >
                            {isLocked ? (
                                <div className="h-32 bg-slate-900/50 rounded-xl mb-4 flex items-center justify-center border border-slate-700/50">
                                    <Lock size={48} className="text-slate-600" />
                                </div>
                            ) : (
                                <div className="h-32 bg-slate-900 rounded-xl mb-4 flex items-center justify-center border border-slate-700 group-hover:border-blue-500/50">
                                    <span className="text-5xl font-black text-slate-700 group-hover:text-blue-500/30 transition-colors">{level.id}</span>
                                </div>
                            )}
                            
                            <div className="flex justify-between items-end">
                                <div>
                                    <h3 className={`text-xl font-bold mb-1 ${isLocked ? 'text-slate-500' : 'text-white'}`}>Fase {level.id}</h3>
                                    <span className={`text-sm font-mono px-2 py-0.5 rounded border ${isLocked ? 'text-slate-600 border-slate-700 bg-slate-800' : 'text-green-400 bg-green-900/30 border-green-900/50'}`}>
                                        {level.difficulty}
                                    </span>
                                </div>
                                {!isLocked && (
                                    <div className="flex text-yellow-500">
                                        {/* Placeholder visual de estrelas por fase - futuramente pode ser dinâmico */}
                                        <Star size={16} fill="currentColor" />
                                        <Star size={16} fill="currentColor" />
                                        <Star size={16} className="text-slate-600" />
                                    </div>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    </div>
  );
};
