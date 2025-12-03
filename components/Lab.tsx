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
    const isValidNext = next && (typeof next !== 'string' || !next.includes('undefined'));
    return (
        <div className="flex items-center justify-between bg-slate-900/50 p-2 md:p-3 rounded-xl border border-slate-700/50">
            <div className={`flex items-center font-bold ${color}`}>
                <div className="mr-2 opacity-80">{icon}</div>
                <span className="text-[10px] md:text-xs uppercase tracking-wide">{label}</span>
            </div>
            <div className="flex items-center font-mono font-bold text-white text-sm md:text-lg">
                <span>{current}</span>
                {isValidNext && next !== current && (<><div className="mx-2 text-slate-600">➔</div><span className="text-green-400">{next}</span></>)}
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
  const audioCtxRef = useRef<AudioContext | null>(null);
  const musicRef = useRef<{ isPlaying: boolean; nextNoteTime: number; step: number; timerId: number | null }>({ isPlaying: false, nextNoteTime: 0, step: 0, timerId: null });

  const initAudio = () => {
    if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume().catch(() => {});
    return audioCtxRef.current;
  };

  useEffect(() => {
      const ctx = initAudio();
      if (ctx && ctx.state === 'running') startMusic();
      return () => stopMusic();
  }, []);

  const startMusic = () => {
      if (!audioCtxRef.current) initAudio();
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (!musicRef.current.isPlaying) { musicRef.current.isPlaying = true; musicRef.current.step = 0; musicRef.current.nextNoteTime = ctx.currentTime + 0.1; scheduler(); }
  };

  const stopMusic = () => { musicRef.current.isPlaying = false; if (musicRef.current.timerId) window.clearTimeout(musicRef.current.timerId); };

  const scheduler = () => {
      if (!musicRef.current.isPlaying) return;
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      const scheduleAheadTime = 0.1;
      while (musicRef.current.nextNoteTime < ctx.currentTime + scheduleAheadTime) {
          playMusicStep(musicRef.current.step, musicRef.current.nextNoteTime);
          const secondsPerBeat = 60.0 / 90.0;
          const secondsPer16th = secondsPerBeat / 4;
          musicRef.current.nextNoteTime += secondsPer16th;
          musicRef.current.step = (musicRef.current.step + 1) % 64; 
      }
      musicRef.current.timerId = window.setTimeout(scheduler, 25);
  };

  const playMusicStep = (step: number, time: number) => {
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      const playTone = (freq: number, type: 'sine'|'triangle'|'square', vol: number, dur: number, attack=0.01) => {
          const osc = ctx.createOscillator(); const gain = ctx.createGain();
          osc.type = type; osc.frequency.value = freq; osc.connect(gain); gain.connect(ctx.destination);
          gain.gain.setValueAtTime(0, time); gain.gain.linearRampToValueAtTime(vol, time + attack); gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
          osc.start(time); osc.stop(time + dur + 0.1);
      };
      if (step % 2 === 0) playTone(2000, 'square', 0.01, 0.01, 0.001); 
      if (step % 16 === 0) playTone(800, 'triangle', 0.02, 0.05, 0.005);
      const arpSequence: {[key: number]: number} = { 0: 261.63, 4: 329.63, 8: 392.00, 12: 493.88, 16: 220.00, 20: 261.63, 24: 329.63, 28: 392.00, 32: 349.23, 36: 440.00, 40: 523.25, 44: 349.23, 48: 196.00, 52: 246.94, 56: 293.66, 60: 392.00 };
      if (arpSequence[step]) playTone(arpSequence[step], 'sine', 0.1, 0.3, 0.02);
      if (Math.random() > 0.85 && step % 4 !== 0) { const bleepFreq = 800 + Math.random() * 800; playTone(bleepFreq, 'sine', 0.03, 0.05, 0.001); }
      if (step % 16 === 0) {
          const root = step < 32 ? 130.81 : (step < 48 ? 174.61 : 98.00); 
          const osc = ctx.createOscillator(); const gain = ctx.createGain(); osc.type = 'triangle'; osc.frequency.value = root; osc.connect(gain); gain.connect(ctx.destination);
          gain.gain.setValueAtTime(0, time); gain.gain.linearRampToValueAtTime(0.08, time + 0.5); gain.gain.linearRampToValueAtTime(0, time + 2.5); 
          osc.start(time); osc.stop(time + 2.5);
      }
  };

  const playSound = (type: 'SUCCESS' | 'ERROR') => {
      try {
        if (!audioCtxRef.current) initAudio();
        const ctx = audioCtxRef.current!;
        if (ctx.state === 'suspended') ctx.resume();
        const osc = ctx.createOscillator(); const gain = ctx.createGain(); osc.connect(gain); gain.connect(ctx.destination);
        const t = ctx.currentTime;
        if (type === 'SUCCESS') { osc.type = 'sine'; osc.frequency.setValueAtTime(400, t); osc.frequency.exponentialRampToValueAtTime(800, t + 0.1); gain.gain.setValueAtTime(0.1, t); gain.gain.linearRampToValueAtTime(0, t + 0.3); osc.start(t); osc.stop(t + 0.3); } 
        else { osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, t); osc.frequency.linearRampToValueAtTime(100, t + 0.2); gain.gain.setValueAtTime(0.1, t); gain.gain.linearRampToValueAtTime(0, t + 0.2); osc.start(t); osc.stop(t + 0.2); }
      } catch(e) {}
  };

  const handleUpgradeClick = (type: TowerType) => {
    const success = onPurchase(type);
    if (success) playSound('SUCCESS');
    else { playSound('ERROR'); setMessage("Estrelas insuficientes!"); setTimeout(() => setMessage(null), 2000); }
  };

  const getDisplayStats = (type: TowerType, level: number) => {
    const config = Constants.getTowerStats(type, level);
    return {
      damage: config.damage,
      range: type === 'ROBOT' || type === 'ENERGY' ? '-' : config.rangeInCells,
      cooldown: config.cooldown,
      hp: config.hp || '-',
      production: config.production || '-',
      speed: config.speed ? Math.round(config.speed * 100) : '-', 
      knockback: config.knockback ? Math.round(config.knockback / 11) + ' cel' : '-' 
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
        <div className="absolute inset-0 z-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

        {/* --- BARRA SUPERIOR --- */}
        <div className="relative z-10 h-16 md:h-20 bg-slate-800 border-b-4 border-slate-700 shadow-lg flex items-center justify-between px-4 md:px-6 shrink-0">
            <div className="flex items-center">
                <button onClick={onBack} className="p-2 md:p-3 bg-slate-700 hover:bg-slate-600 rounded-2xl mr-4 text-white transition-all active:scale-95 border-b-4 border-slate-900 active:border-b-0 active:translate-y-1">
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h2 className="text-xl md:text-3xl font-black text-white italic tracking-wide drop-shadow-md">LABORATÓRIO</h2>
                    <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest hidden md:block">Oficina de Upgrades</span>
                </div>
            </div>
            <div className="flex items-center bg-slate-900/90 px-3 md:px-5 py-2 rounded-xl border-2 border-slate-600 shadow-inner">
                <Star className="text-yellow-400 fill-yellow-400 mr-2 md:mr-3 animate-pulse" size={20} />
                <div className="flex flex-col items-end leading-none"><span className="text-2xl md:text-3xl font-black text-white">{stars}</span><span className="text-[9px] md:text-[10px] font-bold text-yellow-500 uppercase tracking-widest">Estrelas</span></div>
            </div>
        </div>

        {/* --- ÁREA PRINCIPAL --- */}
        <div className="relative z-10 flex-1 flex flex-col md:flex-row overflow-hidden p-4 md:p-6 gap-4 md:gap-6">
            
            {/* LISTA DE TORRES */}
            <div className="w-full md:w-1/2 flex flex-row md:flex-col gap-2 md:gap-3 overflow-x-auto md:overflow-y-auto pr-0 md:pr-2 custom-scrollbar pb-2 md:pb-0 h-32 md:h-auto shrink-0 md:shrink">
                {(Object.keys(Constants.TOWER_TYPES) as TowerType[]).map((type) => {
                    const towerBase = Constants.TOWER_TYPES[type];
                    const level = upgradeLevels[type];
                    const isSelected = selectedTower === type;
                    return (
                        <button key={type} onClick={() => { setSelectedTower(type); setMessage(null); }}
                            className={`group relative min-w-[200px] md:min-w-0 md:w-full flex items-center p-2 md:p-3 rounded-2xl border-2 transition-all duration-200 ${isSelected ? 'bg-slate-700 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.3)] md:translate-x-2' : 'bg-slate-800 border-slate-600'}`}>
                            <div className="absolute -top-2 -right-2 w-6 h-6 md:w-8 md:h-8 bg-blue-600 text-white font-black text-xs md:text-sm flex items-center justify-center rounded-full border-2 border-white shadow-md z-10">{level}</div>
                            <div className="w-12 h-12 md:w-20 md:h-20 bg-slate-900 rounded-xl p-2 flex items-center justify-center border border-slate-700 mr-3 md:mr-4 shrink-0 relative overflow-hidden">
                                <div className={`absolute inset-0 opacity-20 ${towerBase.color.replace('bg-', 'bg-')}`}></div>
                                <img src={towerBase.image} alt={towerBase.name} className="w-full h-full object-contain relative z-10" />
                            </div>
                            <div className="flex-1 text-left"><h3 className={`font-bold text-sm md:text-lg leading-tight ${isSelected ? 'text-yellow-400' : 'text-white'}`}>{towerBase.name}</h3><div className="text-[10px] md:text-xs text-slate-400 font-mono mt-1">Nível: {level}</div></div>
                        </button>
                    );
                })}
            </div>

            {/* DETALHES DA TORRE SELECIONADA */}
            <div className="w-full md:w-1/2 bg-slate-800 rounded-3xl border-4 border-slate-700 shadow-2xl relative overflow-hidden flex flex-col h-full">
                {selectedTower ? (
                    <>
                        <div className="bg-slate-900/50 p-4 flex items-center border-b border-slate-700 relative">
                             {message && (<div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-full font-bold shadow-lg animate-bounce flex items-center z-50 whitespace-nowrap"><AlertCircle size={16} className="mr-2"/> {message}</div>)}
                             <div className="w-12 h-12 md:w-24 md:h-24 mr-4 animate-float"><img src={Constants.TOWER_TYPES[selectedTower].image} className="w-full h-full object-contain drop-shadow-2xl" /></div>
                             <div>
                                 <h2 className="text-lg md:text-xl font-black text-white leading-none mb-1">{Constants.TOWER_TYPES[selectedTower].name}</h2>
                                 <span className="bg-slate-700 px-2 py-0.5 rounded-full text-[10px] font-bold text-yellow-400 border border-yellow-400/30">{isMaxLevel ? "NÍVEL MÁXIMO" : `NÍVEL ${currentLevel} ➔ ${nextLevel}`}</span>
                             </div>
                        </div>

                        <div className="flex-1 p-4 md:p-6 flex flex-col justify-center space-y-2 overflow-y-auto">
                            {selectedTower === 'ENERGY' ? (<StatRow icon={<Zap size={18}/>} label="Produção" current={currentStats?.production} next={nextStats?.production} color="text-yellow-400" />) : (<StatRow icon={<Crosshair size={18}/>} label="Dano" current={currentStats?.damage} next={nextStats?.damage} color="text-red-400" />)}
                            {selectedTower === 'TURBO' ? (<StatRow icon={<TrendingUp size={18}/>} label="Empurrão" current={currentStats?.knockback} next={nextStats?.knockback} color="text-blue-400" />) : ((currentStats?.range !== '-' && <StatRow icon={<TrendingUp size={18}/>} label="Alcance" current={currentStats?.range} next={nextStats?.range} color="text-blue-400" />))}
                            {currentStats?.hp !== '-' && (<StatRow icon={<Shield size={18}/>} label="Vida" current={currentStats?.hp} next={nextStats?.hp} color="text-green-400" />)}
                            {currentStats?.speed !== '-' && (<StatRow icon={<TrendingUp size={18}/>} label="Velocidade" current={currentStats?.speed} next={nextStats?.speed} color="text-cyan-400" />)}
                            <StatRow icon={<Timer size={18}/>} label="Recarga" current={currentStats?.cooldown} next={nextStats?.cooldown} color="text-orange-400" inverse />
                        </div>

                        <div className="p-4 bg-slate-900 border-t border-slate-700">
                            {isMaxLevel ? (
                                <div className="w-full py-3 rounded-2xl font-black text-lg bg-slate-800 text-slate-500 border border-slate-700 text-center uppercase">Totalmente Melhorado</div>
                            ) : (
                                <button onClick={() => handleUpgradeClick(selectedTower)} disabled={!canAfford} className={`w-full py-3 rounded-2xl font-black text-lg shadow-lg border-b-4 transition-all flex items-center justify-center group ${canAfford ? 'bg-green-500 border-green-700 text-white hover:bg-green-400 active:border-b-0 active:translate-y-1' : 'bg-slate-700 border-slate-900 text-slate-500 cursor-not-allowed grayscale'}`}>
                                    <Hammer className={`mr-2 ${canAfford ? 'group-hover:rotate-12 transition-transform' : ''}`} />
                                    <div className="flex flex-col items-center"><span className="leading-none">UPGRADE</span><div className="flex items-center text-xs font-bold mt-0.5 opacity-90"><Star size={10} fill="currentColor" className="mr-1" />{upgradeCost}</div></div>
                                </button>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 p-8 text-center"><Hammer size={64} className="mb-4 opacity-20" /><h3 className="text-lg font-bold">Selecione um Aspirador</h3></div>
                )}
            </div>
        </div>
        <style>{`
            .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
            @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
            .animate-float { animation: float 3s ease-in-out infinite; }
        `}</style>
    </div>
  );
};