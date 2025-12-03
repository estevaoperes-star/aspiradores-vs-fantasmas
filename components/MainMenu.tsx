import React, { useState, useEffect, useRef } from 'react';
import { Play, Map, FlaskConical, Settings, LogOut, Ghost, Zap, ShoppingBag } from 'lucide-react';
import { SceneName } from '../types';
import { BG_MAIN_MENU } from '../constants';

interface MainMenuProps {
  onNavigate: (scene: SceneName) => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onNavigate }) => {
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  
  // Ref para controle da música
  const musicRef = useRef<{ isPlaying: boolean; nextNoteTime: number; step: number; timerId: number | null }>({
      isPlaying: false, nextNoteTime: 0, step: 0, timerId: null
  });

  // --- Inicialização de Áudio Segura ---
  const initAudio = () => {
    try {
        if (!audioCtxRef.current) {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContextClass) {
                audioCtxRef.current = new AudioContextClass();
            }
        }
        if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume().catch(() => {});
        }
        return audioCtxRef.current;
    } catch (e) {
        console.warn("Audio initialization failed:", e);
        return null;
    }
  };

  useEffect(() => {
    const ctx = initAudio();
    if (ctx && ctx.state === 'running') startMusic();

    const unlockAudio = () => {
        const ctx = initAudio();
        if (ctx) {
            if (ctx.state === 'suspended') ctx.resume().catch(() => {});
            if (!musicRef.current.isPlaying) startMusic();
        }
        window.removeEventListener('click', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
        window.removeEventListener('touchstart', unlockAudio);
    };

    window.addEventListener('click', unlockAudio);
    window.addEventListener('keydown', unlockAudio);
    window.addEventListener('touchstart', unlockAudio);

    return () => {
        stopMusic();
        window.removeEventListener('click', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
        window.removeEventListener('touchstart', unlockAudio);
    };
  }, []);

  const startMusic = () => {
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (musicRef.current.isPlaying) return;

      try {
          musicRef.current.isPlaying = true;
          musicRef.current.step = 0;
          musicRef.current.nextNoteTime = ctx.currentTime + 0.1;
          scheduler();
      } catch (e) { console.warn("Error starting music:", e); }
  };

  const stopMusic = () => {
      musicRef.current.isPlaying = false;
      if (musicRef.current.timerId) window.clearTimeout(musicRef.current.timerId);
  };

  const scheduler = () => {
      if (!musicRef.current.isPlaying) return;
      const ctx = audioCtxRef.current;
      if (!ctx) return;

      const lookahead = 0.1; 
      const scheduleAheadTime = 0.1; 

      try {
          while (musicRef.current.nextNoteTime < ctx.currentTime + scheduleAheadTime) {
              playMusicStep(musicRef.current.step, musicRef.current.nextNoteTime);
              const secondsPerBeat = 60.0 / 110.0;
              const secondsPer16th = secondsPerBeat / 4;
              musicRef.current.nextNoteTime += secondsPer16th;
              musicRef.current.step = (musicRef.current.step + 1) % 64; 
          }
          musicRef.current.timerId = window.setTimeout(scheduler, 25);
      } catch(e) { stopMusic(); }
  };

  const playMusicStep = (step: number, time: number) => {
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      const playTone = (freq: number, type: 'sine'|'triangle'|'square'|'sawtooth', vol: number, dur: number, attack = 0.01) => {
          try {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = type;
              osc.frequency.setValueAtTime(freq, time);
              osc.connect(gain);
              gain.connect(ctx.destination);
              gain.gain.setValueAtTime(0, time);
              gain.gain.linearRampToValueAtTime(vol, time + attack);
              gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
              osc.start(time);
              osc.stop(time + dur + 0.1);
          } catch(e) {}
      };

      const melody: {[key: number]: number} = { 0: 783.99, 4: 659.25, 8: 523.25, 12: 659.25, 14: 783.99, 16: 880.00, 20: 783.99, 24: 659.25, 28: 587.33, 32: 523.25, 36: 659.25, 40: 698.46, 44: 880.00, 48: 1046.50, 52: 783.99, 56: 659.25, 60: 523.25 };
      if (melody[step]) { playTone(melody[step], 'sine', 0.15, 0.4); playTone(melody[step]*2, 'sine', 0.05, 0.2); }
      if (step % 16 === 0 || step % 16 === 8) { const root = (step < 32) ? 261.63 : (step < 48 ? 349.23 : 392.00); playTone(root, 'triangle', 0.05, 0.3, 0.02); }
      if (step % 8 === 0) playTone(150, 'sine', 0.2, 0.1, 0.001); 
      if (step % 4 === 2) playTone(8000, 'square', 0.02, 0.03, 0.001);
  };

  const playClickSound = () => {
    try {
      const ctx = initAudio();
      if (!ctx) return;
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, t);
      osc.frequency.exponentialRampToValueAtTime(600, t + 0.1);
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.15);
    } catch (e) { console.warn("Audio error", e); }
  };

  const handleNavigate = (scene: SceneName) => {
    playClickSound();
    setTimeout(() => { onNavigate(scene); }, 150);
  };

  const handleExit = () => {
    try { window.close(); } catch(e) {}
    window.location.href = "about:blank";
  };

  return (
    <div className="w-full h-full relative overflow-hidden font-sans select-none flex flex-col">
      <div className="absolute inset-0 z-0 bg-cover bg-center" style={{ backgroundImage: `url(${BG_MAIN_MENU})` }}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none"></div>
      </div>

      <div className="relative z-10 w-full h-full flex flex-col md:flex-row items-center justify-center p-4" onClick={() => { if(audioCtxRef.current?.state === 'suspended') audioCtxRef.current.resume().catch(() => {}); }}>
        
        {/* LOGO SECTION - TOP (Mobile) / LEFT (Desktop) */}
        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-lg mx-auto transform hover:scale-105 transition-transform duration-500 cursor-default mb-4 md:mb-0">
            <div className="absolute bg-white/30 backdrop-blur-sm rounded-full w-64 md:w-80 h-32 md:h-40 -z-10 blur-xl"></div>
            
            <div className="relative scale-75 md:scale-100 origin-center">
                <h1 className="text-5xl md:text-6xl font-black text-white drop-shadow-[0_5px_0_rgba(0,0,0,0.5)] tracking-tighter text-center leading-none"
                    style={{ WebkitTextStroke: '2px #0f172a' }}>
                    <span className="text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-orange-500 block transform -rotate-2">
                        ASPIRADORES
                    </span>
                </h1>
                
                <div className="flex items-center justify-center my-1 relative">
                     <div className="absolute w-full h-1 bg-black/20 rounded-full"></div>
                     <span className="relative z-10 bg-red-500 text-white font-black text-xl px-3 py-1 rounded-full border-2 border-white shadow-lg transform rotate-3">
                        VS
                     </span>
                </div>

                <h2 className="text-5xl md:text-6xl font-black text-white drop-shadow-[0_5px_0_rgba(0,0,0,0.5)] tracking-tighter text-center leading-none"
                    style={{ WebkitTextStroke: '2px #0f172a' }}>
                    <span className="text-transparent bg-clip-text bg-gradient-to-b from-cyan-300 to-blue-600 block transform rotate-1">
                        FANTASMAS
                    </span>
                </h2>

                <Ghost className="absolute -right-8 -top-4 text-purple-400 w-10 h-10 animate-bounce drop-shadow-lg" style={{ animationDuration: '3s' }} />
                <Zap className="absolute -left-6 bottom-0 text-yellow-400 w-8 h-8 animate-pulse drop-shadow-lg" />
            </div>
        </div>

        {/* BUTTONS SECTION - BOTTOM (Mobile) / RIGHT (Desktop) */}
        <div className="flex-1 flex flex-col justify-center items-center w-full max-w-md space-y-3 pb-4">
            
            <MenuButton 
                onClick={() => handleNavigate('GAME')} 
                bgColor="bg-green-500" 
                borderColor="border-green-700"
                icon={<Play size={32} fill="currentColor" />}
                label="JOGAR"
                subLabel="Começar a limpar!"
                delay="0ms"
                main
            />

            <div className="flex w-full gap-2">
                <MenuButton 
                    onClick={() => handleNavigate('SELECAO_FASES')} 
                    bgColor="bg-blue-500" 
                    borderColor="border-blue-700"
                    icon={<Map size={24} />}
                    label="FASES"
                    delay="100ms"
                    small
                />
                 <MenuButton 
                    onClick={() => handleNavigate('LOJA')} 
                    bgColor="bg-pink-500" 
                    borderColor="border-pink-700"
                    icon={<ShoppingBag size={24} />}
                    label="LOJA"
                    delay="150ms"
                    small
                />
            </div>

            <MenuButton 
                onClick={() => handleNavigate('LABORATORIO')} 
                bgColor="bg-purple-500" 
                borderColor="border-purple-700"
                icon={<FlaskConical size={24} />}
                label="LABORATÓRIO"
                delay="200ms"
            />

            <div className="flex w-full gap-3">
                <MenuButton 
                    onClick={() => handleNavigate('OPCOES')} 
                    bgColor="bg-orange-500" 
                    borderColor="border-orange-700"
                    icon={<Settings size={24} />}
                    label="OPÇÕES"
                    delay="300ms"
                    small
                />

                <MenuButton 
                    onClick={() => { playClickSound(); setShowExitConfirm(true); }} 
                    bgColor="bg-slate-600" 
                    borderColor="border-slate-800"
                    icon={<LogOut size={24} />}
                    label="SAIR"
                    delay="400ms"
                    small
                />
            </div>
        </div>

        <div className="absolute bottom-2 left-2 text-slate-500/80 font-bold text-xs">v1.2.0 Mobile Optimized</div>
      </div>

      {showExitConfirm && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white border-4 border-slate-700 rounded-3xl p-6 w-full max-w-xs text-center shadow-[0_10px_0_rgba(0,0,0,0.2)]">
                <h3 className="text-2xl font-black text-slate-800 mb-2">JÁ VAI?</h3>
                <p className="text-slate-500 font-bold mb-6">A casa ainda está suja!</p>
                <div className="flex gap-4">
                    <button onClick={() => { playClickSound(); setShowExitConfirm(false); }} className="flex-1 py-4 bg-slate-200 border-b-4 border-slate-400 rounded-2xl text-slate-600 font-black active:border-b-0 active:translate-y-1 transition-all">VOLTAR</button>
                    <button onClick={handleExit} className="flex-1 py-4 bg-red-500 border-b-4 border-red-700 rounded-2xl text-white font-black active:border-b-0 active:translate-y-1 transition-all">SAIR</button>
                </div>
            </div>
        </div>
      )}

      <style>{`
        @keyframes popIn {
            0% { transform: scale(0.5); opacity: 0; }
            80% { transform: scale(1.05); opacity: 1; }
            100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

interface MenuBtnProps {
    onClick: () => void;
    bgColor: string;
    borderColor: string;
    icon: React.ReactNode;
    label: string;
    subLabel?: string;
    delay: string;
    main?: boolean;
    small?: boolean;
}

const MenuButton: React.FC<MenuBtnProps> = ({ onClick, bgColor, borderColor, icon, label, subLabel, delay, main, small }) => (
    <button 
        onClick={onClick}
        className={`
            group relative 
            ${small ? 'flex-1 h-14 md:h-16' : 'w-full'}
            ${main ? 'h-20 md:h-24 mb-2' : (small ? '' : 'h-16')}
            ${bgColor} 
            rounded-2xl
            border-b-[6px] md:border-b-[8px] ${borderColor}
            flex items-center justify-center 
            text-white shadow-xl transition-all duration-100
            active:border-b-0 active:translate-y-[6px] active:shadow-none
            hover:brightness-110
            touch-manipulation
        `}
        style={{ animation: `popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) backwards ${delay}` }}
    >
        <div className={`
            absolute left-4 
            ${small ? 'relative left-0 mr-2 md:mr-3' : ''}
            drop-shadow-md group-hover:scale-110 transition-transform
        `}>
            {icon}
        </div>
        
        <div className={`flex flex-col items-start ${small ? 'items-center md:items-start' : 'pl-10 md:pl-12'}`}>
            <span className={`font-black tracking-wide drop-shadow-md leading-none ${main ? 'text-2xl md:text-4xl' : (small ? 'text-lg md:text-xl' : 'text-xl md:text-2xl')}`}>
                {label}
            </span>
            {subLabel && !small && (
                <span className="text-[10px] md:text-xs font-bold text-white/80 uppercase tracking-widest bg-black/10 px-2 rounded-full mt-1">
                    {subLabel}
                </span>
            )}
        </div>
        <div className="absolute top-0 right-0 left-0 h-[40%] bg-gradient-to-b from-white/20 to-transparent rounded-t-2xl pointer-events-none"></div>
    </button>
);