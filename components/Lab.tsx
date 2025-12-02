import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Star, Zap, Hammer, ChevronRight, Shield, Timer, Crosshair, TrendingUp, AlertCircle } from 'lucide-react';
import * as Constants from '../constants';
import { TowerType, UpgradeState } from '../types';

interface StatRowProps {
  icon: React.ReactNode;
  label: string;
  current: React.ReactNode;
  next?: React.ReactNode;
  color: string;
  inverse?: boolean;
}

const StatRow: React.FC<StatRowProps> = ({ icon, label, current, next, color, inverse }) => {
    // Helper to avoid displaying "undefined un" when nextStats is null
    const isValidNext = next && (typeof next !== 'string' || !next.includes('undefined'));

    return (
        <div className="flex items-center justify-between bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
            <div className={`flex items-center font-bold ${color}`}>
                <div className="mr-2 opacity-80">{icon}</div>
                <span className="text-xs uppercase tracking-wide">{label}</span>
            </div>
            <div className="flex items-center font-mono font-bold text-white">
                <span className="text-lg">{current}</span>
                {isValidNext && next !== current && (
                    <>
                        <div className="mx-2 text-slate-600">➔</div>
                        <span className="text-lg text-green-400">{next}</span>
                    </>
                )}
            </div>
        </div>
    );
};

interface LabProps {
  onBack: () => void;
  stars: number;
  upgradeLevels: UpgradeState;
  onPurchase: (type: TowerType) => boolean;
}

export const Lab: React.FC<LabProps> = ({ onBack, stars, upgradeLevels, onPurchase }) => {
  const [selectedTower, setSelectedTower] = useState<TowerType | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // --- AUDIO & MUSIC REFS ---
  const audioCtxRef = useRef<AudioContext | null>(null);
  const musicRef = useRef<{ isPlaying: boolean; nextNoteTime: number; step: number; timerId: number | null }>({
      isPlaying: false, nextNoteTime: 0, step: 0, timerId: null
  });

  // --- INITIALIZE AUDIO ---
  const initAudio = () => {
    if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume().catch(() => {});
    }
    return audioCtxRef.current;
  };

  // --- MUSIC LOGIC (Relaxed Workshop Theme) ---
  useEffect(() => {
      const ctx = initAudio();
      if (ctx && ctx.state === 'running') {
          startMusic();
      }

      // Cleanup on unmount
      return () => stopMusic();
  }, []);

  const startMusic = () => {
      if (!audioCtxRef.current) initAudio();
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      
      if (!musicRef.current.isPlaying) {
          musicRef.current.isPlaying = true;
          musicRef.current.step = 0;
          musicRef.current.nextNoteTime = ctx.currentTime + 0.1;
          scheduler();
      }
  };

  const stopMusic = () => {
      musicRef.current.isPlaying = false;
      if (musicRef.current.timerId) window.clearTimeout(musicRef.current.timerId);
  };

  const scheduler = () => {
      if (!musicRef.current.isPlaying) return;
      const ctx = audioCtxRef.current;
      if (!ctx) return;

      const scheduleAheadTime = 0.1;
      while (musicRef.current.nextNoteTime < ctx.currentTime + scheduleAheadTime) {
          playMusicStep(musicRef.current.step, musicRef.current.nextNoteTime);
          
          // Tempo: Slow & Thoughtful (~90 BPM)
          // 16th notes
          const secondsPerBeat = 60.0 / 90.0;
          const secondsPer16th = secondsPerBeat / 4;
          
          musicRef.current.nextNoteTime += secondsPer16th;
          musicRef.current.step = (musicRef.current.step + 1) % 64; // 4 bars loop
      }
      musicRef.current.timerId = window.setTimeout(scheduler, 25);
  };

  const playMusicStep = (step: number, time: number) => {
      const ctx = audioCtxRef.current;
      if (!ctx) return;

      // Helper: Simple Envelope Tone
      const playTone = (freq: number, type: 'sine'|'triangle'|'square', vol: number, dur: number, attack=0.01) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = type;
          osc.frequency.value = freq;
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          gain.gain.setValueAtTime(0, time);
          gain.gain.linearRampToValueAtTime(vol, time + attack);
          gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
          
          osc.start(time);
          osc.stop(time + dur + 0.1);
      };

      // 1. GENTLE TICKING (The "Clock/Machine" Rhythm)
      if (step % 2 === 0) { // Every 8th note
          // Short, high tick
          playTone(2000, 'square', 0.01, 0.01, 0.001); 
      }
      if (step % 16 === 0) { // First beat accent
          playTone(800, 'triangle', 0.02, 0.05, 0.005);
      }

      // 2. SOFT SYNTH PLUCKS (Arpeggio - C Major 7 / A Minor 9)
      // Sequence of notes that sounds "smart" and "curious"
      const arpSequence: {[key: number]: number} = {
          0: 261.63,  // C4
          4: 329.63,  // E4
          8: 392.00,  // G4
          12: 493.88, // B4
          
          16: 220.00, // A3
          20: 261.63, // C4
          24: 329.63, // E4
          28: 392.00, // G4

          32: 349.23, // F4
          36: 440.00, // A4
          40: 523.25, // C5
          44: 349.23, // F4

          48: 196.00, // G3
          52: 246.94, // B3
          56: 293.66, // D4
          60: 392.00, // G4
      };

      if (arpSequence[step]) {
          playTone(arpSequence[step], 'sine', 0.1, 0.3, 0.02);
      }

      // 3. DIGITAL BEEPS (Random computer noises)
      // Occasional bleeps
      if (Math.random() > 0.85 && step % 4 !== 0) {
          const bleepFreq = 800 + Math.random() * 800; // High pitch
          playTone(bleepFreq, 'sine', 0.03, 0.05, 0.001);
      }

      // 4. BASS PAD (Warm undercurrent)
      if (step % 16 === 0) {
          const root = step < 32 ? 130.81 : (step < 48 ? 174.61 : 98.00); // C3 ... F3 ... G2
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.value = root;
          
          // Low pass filter simulation (tone is naturally mellow on triangle, but let's keep it soft)
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          gain.gain.setValueAtTime(0, time);
          gain.gain.linearRampToValueAtTime(0.08, time + 0.5);
          gain.gain.linearRampToValueAtTime(0, time + 2.5); // Long sustain
          
          osc.start(time);
          osc.stop(time + 2.5);
      }
  };

  // --- UI Sound Effects ---
  const playSound = (type: 'SUCCESS' | 'ERROR') => {
      try {
        if (!audioCtxRef.current) initAudio();
        const ctx = audioCtxRef.current!;
        if (ctx.state === 'suspended') ctx.resume();

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        const t = ctx.currentTime;
        if (type === 'SUCCESS') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(400, t);
            osc.frequency.exponentialRampToValueAtTime(800, t + 0.1);
            gain.gain.setValueAtTime(0.1, t);
            gain.gain.linearRampToValueAtTime(0, t + 0.3);
            osc.start(t); osc.stop(t + 0.3);
        } else {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, t);
            osc.frequency.linearRampToValueAtTime(100, t + 0.2);
            gain.gain.setValueAtTime(0.1, t);
            gain.gain.linearRampToValueAtTime(0, t + 0.2);
            osc.start(t); osc.stop(t + 0.2);
        }
      } catch(e) {}
  };

  const handleUpgradeClick = (type: TowerType) => {
    const success = onPurchase(type);
    if (success) {
        playSound('SUCCESS');
    } else {
        playSound('ERROR');
        setMessage("Estrelas insuficientes!");
        setTimeout(() => setMessage(null), 2000);
    }
  };

  // Funções de exibição de stats usando a nova config
  const getDisplayStats = (type: TowerType, level: number) => {
    const config = Constants.getTowerStats(type, level);
    return {
      damage: config.damage,
      range: type === 'ROBOT' || type === 'ENERGY' ? '-' : config.rangeInCells,
      cooldown: config.cooldown,
      hp: config.hp || '-',
      production: config.production || '-',
      speed: config.speed ? Math.round(config.speed * 100) : '-', // Mostrar speed como inteiro relativo
      knockback: config.knockback ? Math.round(config.knockback / 11) + ' cel' : '-' // Converter % para células aprox
    };
  };

  const currentLevel = selectedTower ? upgradeLevels[selectedTower] : 1;
  const isMaxLevel = currentLevel >= 3;
  const nextLevel = isMaxLevel ? 3 : currentLevel + 1;
  
  const currentStats = selectedTower ? getDisplayStats(selectedTower, currentLevel) : null;
  const nextStats = selectedTower && !isMaxLevel ? getDisplayStats(selectedTower, nextLevel) : null;
  
  const upgradeCost = (!isMaxLevel && selectedTower) ? Constants.UPGRADE_COSTS[nextLevel as 2|3] : 0;
  const canAfford = stars >= upgradeCost;

  return (
    <div className="w-full h-full bg-slate-900 font-sans flex flex-col relative overflow-hidden select-none" onClick={() => initAudio()}>
        
        {/* Background "Blueprint" */}
        <div className="absolute inset-0 z-0 opacity-10" 
             style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
        </div>

        {/* --- BARRA SUPERIOR --- */}
        <div className="relative z-10 h-20 bg-slate-800 border-b-4 border-slate-700 shadow-lg flex items-center justify-between px-6 shrink-0">
            <div className="flex items-center">
                <button onClick={onBack} className="p-3 bg-slate-700 hover:bg-slate-600 rounded-2xl mr-4 text-white transition-all active:scale-95 border-b-4 border-slate-900 active:border-b-0 active:translate-y-1">
                    <ArrowLeft size={28} />
                </button>
                <div>
                    <h2 className="text-2xl md:text-3xl font-black text-white italic tracking-wide drop-shadow-md">
                        LABORATÓRIO
                    </h2>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Oficina de Upgrades</span>
                </div>
            </div>

            {/* Moedas */}
            <div className="flex items-center bg-slate-900/90 px-5 py-2 rounded-xl border-2 border-slate-600 shadow-inner">
                <Star className="text-yellow-400 fill-yellow-400 mr-3 animate-pulse" size={28} />
                <div className="flex flex-col items-end leading-none">
                    <span className="text-3xl font-black text-white">{stars}</span>
                    <span className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest">Estrelas</span>
                </div>
            </div>
        </div>

        {/* --- ÁREA PRINCIPAL --- */}
        <div className="relative z-10 flex-1 flex overflow-hidden p-6 gap-6">
            
            {/* LISTA */}
            <div className="w-1/2 flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar">
                {(Object.keys(Constants.TOWER_TYPES) as TowerType[]).map((type) => {
                    const towerBase = Constants.TOWER_TYPES[type];
                    const level = upgradeLevels[type];
                    const isSelected = selectedTower === type;

                    return (
                        <button 
                            key={type}
                            onClick={() => { setSelectedTower(type); setMessage(null); }}
                            className={`
                                group relative w-full flex items-center p-3 rounded-2xl border-2 transition-all duration-200
                                ${isSelected 
                                    ? 'bg-slate-700 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.3)] translate-x-2' 
                                    : 'bg-slate-800 border-slate-600 hover:bg-slate-750 hover:border-slate-500'}
                            `}
                        >
                            <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-600 text-white font-black text-sm flex items-center justify-center rounded-full border-2 border-white shadow-md z-10">
                                {level}
                            </div>
                            <div className="w-20 h-20 bg-slate-900 rounded-xl p-2 flex items-center justify-center border border-slate-700 mr-4 shrink-0 relative overflow-hidden">
                                <div className={`absolute inset-0 opacity-20 ${towerBase.color.replace('bg-', 'bg-')}`}></div>
                                <img src={towerBase.image} alt={towerBase.name} className="w-full h-full object-contain relative z-10" />
                            </div>
                            <div className="flex-1 text-left">
                                <h3 className={`font-bold text-lg leading-tight ${isSelected ? 'text-yellow-400' : 'text-white'}`}>
                                    {towerBase.name}
                                </h3>
                                <div className="text-xs text-slate-400 font-mono mt-1">Nível Atual: {level}</div>
                            </div>
                            {isSelected && <ChevronRight className="text-yellow-400 animate-bounce-horizontal" size={24} />}
                        </button>
                    );
                })}
            </div>

            {/* DETALHES */}
            <div className="w-1/2 bg-slate-800 rounded-3xl border-4 border-slate-700 shadow-2xl relative overflow-hidden flex flex-col">
                {selectedTower ? (
                    <>
                        <div className="bg-slate-900/50 p-6 flex flex-col items-center border-b border-slate-700 relative">
                             {/* Toast Message */}
                             {message && (
                                <div className="absolute top-4 bg-red-500 text-white px-4 py-2 rounded-full font-bold shadow-lg animate-bounce flex items-center z-50">
                                    <AlertCircle size={16} className="mr-2"/> {message}
                                </div>
                             )}

                             <div className="relative w-24 h-24 mb-2 animate-float">
                                <img src={Constants.TOWER_TYPES[selectedTower].image} className="w-full h-full object-contain drop-shadow-2xl relative z-10" />
                             </div>
                             <h2 className="text-xl font-black text-white text-center leading-none mb-1">
                                {Constants.TOWER_TYPES[selectedTower].name}
                             </h2>
                             <span className="bg-slate-700 px-3 py-1 rounded-full text-xs font-bold text-yellow-400 border border-yellow-400/30">
                                {isMaxLevel ? "NÍVEL MÁXIMO" : `NÍVEL ${currentLevel} ➔ ${nextLevel}`}
                             </span>
                        </div>

                        <div className="flex-1 p-6 flex flex-col justify-center space-y-3">
                            {selectedTower === 'ENERGY' ? (
                                <StatRow icon={<Zap size={18}/>} label="Produção" current={currentStats?.production + ' un'} next={nextStats ? nextStats.production + ' un' : undefined} color="text-yellow-400" />
                            ) : (
                                <StatRow icon={<Crosshair size={18}/>} label="Dano" current={currentStats?.damage} next={nextStats?.damage} color="text-red-400" />
                            )}
                            
                            {selectedTower === 'TURBO' ? (
                                <StatRow icon={<TrendingUp size={18}/>} label="Empurrão" current={currentStats?.knockback} next={nextStats?.knockback} color="text-blue-400" />
                            ) : (
                                (currentStats?.range !== '-' && <StatRow icon={<TrendingUp size={18}/>} label="Alcance" current={currentStats?.range} next={nextStats?.range} color="text-blue-400" />)
                            )}

                            {currentStats?.hp !== '-' && (
                                <StatRow icon={<Shield size={18}/>} label="Vida (HP)" current={currentStats?.hp} next={nextStats?.hp} color="text-green-400" />
                            )}
                            
                            {currentStats?.speed !== '-' && (
                                <StatRow icon={<TrendingUp size={18}/>} label="Velocidade" current={currentStats?.speed} next={nextStats?.speed} color="text-cyan-400" />
                            )}

                            <StatRow icon={<Timer size={18}/>} label="Recarga (ms)" current={currentStats?.cooldown} next={nextStats?.cooldown} color="text-orange-400" inverse />
                        </div>

                        <div className="p-6 bg-slate-900 border-t border-slate-700">
                            {isMaxLevel ? (
                                <div className="w-full py-4 rounded-2xl font-black text-xl bg-slate-800 text-slate-500 border border-slate-700 text-center uppercase">
                                    Totalmente Melhorado
                                </div>
                            ) : (
                                <button 
                                    onClick={() => handleUpgradeClick(selectedTower)}
                                    disabled={!canAfford}
                                    className={`
                                        w-full py-4 rounded-2xl font-black text-xl shadow-lg border-b-4 transition-all flex items-center justify-center group
                                        ${canAfford 
                                            ? 'bg-green-500 border-green-700 text-white hover:bg-green-400 active:border-b-0 active:translate-y-1' 
                                            : 'bg-slate-700 border-slate-900 text-slate-500 cursor-not-allowed grayscale'}
                                    `}
                                >
                                    <Hammer className={`mr-2 ${canAfford ? 'group-hover:rotate-12 transition-transform' : ''}`} />
                                    <div className="flex flex-col items-center">
                                        <span className="leading-none">UPGRADE</span>
                                        <div className="flex items-center text-sm font-bold mt-1 opacity-90">
                                            <Star size={12} fill="currentColor" className="mr-1" />
                                            {upgradeCost}
                                        </div>
                                    </div>
                                </button>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 p-8 text-center">
                        <Hammer size={64} className="mb-4 opacity-20" />
                        <h3 className="text-xl font-bold mb-2">Selecione um Aspirador</h3>
                    </div>
                )}
            </div>
        </div>
        <style>{`
            .custom-scrollbar::-webkit-scrollbar { width: 6px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
            @keyframes bounce-horizontal { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(4px); } }
            .animate-bounce-horizontal { animation: bounce-horizontal 1s infinite; }
            @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
            .animate-float { animation: float 3s ease-in-out infinite; }
        `}</style>
    </div>
  );
};