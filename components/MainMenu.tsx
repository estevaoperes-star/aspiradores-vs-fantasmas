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

  // --- Inicialização de Áudio ---
  const initAudio = () => {
    if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume().catch(() => {});
    }
    return audioCtxRef.current;
  };

  // --- Lógica da Música Procedural (Tema Aconchegante) ---
  useEffect(() => {
    // Tenta iniciar o áudio na montagem (pode ser bloqueado pelo navegador)
    const ctx = initAudio();
    if (ctx && ctx.state === 'running') {
        startMusic();
    }

    // Listener para desbloquear áudio na primeira interação
    const unlockAudio = () => {
        const ctx = initAudio();
        if (ctx.state === 'suspended') ctx.resume();
        if (!musicRef.current.isPlaying) startMusic();
        
        window.removeEventListener('click', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
    };

    window.addEventListener('click', unlockAudio);
    window.addEventListener('keydown', unlockAudio);

    return () => {
        stopMusic();
        window.removeEventListener('click', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
    };
  }, []);

  const startMusic = () => {
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (musicRef.current.isPlaying) return;

      musicRef.current.isPlaying = true;
      musicRef.current.step = 0;
      musicRef.current.nextNoteTime = ctx.currentTime + 0.1;
      scheduler();
  };

  const stopMusic = () => {
      musicRef.current.isPlaying = false;
      if (musicRef.current.timerId) window.clearTimeout(musicRef.current.timerId);
  };

  const scheduler = () => {
      if (!musicRef.current.isPlaying) return;
      const ctx = audioCtxRef.current;
      if (!ctx) return;

      const lookahead = 0.1; // 100ms
      const scheduleAheadTime = 0.1; 

      while (musicRef.current.nextNoteTime < ctx.currentTime + scheduleAheadTime) {
          playMusicStep(musicRef.current.step, musicRef.current.nextNoteTime);
          // Avança passo (Semicolcheia / 16th note)
          // Tempo: 110 BPM -> ~0.136s por 16th note
          const secondsPerBeat = 60.0 / 110.0;
          const secondsPer16th = secondsPerBeat / 4;
          
          musicRef.current.nextNoteTime += secondsPer16th;
          musicRef.current.step = (musicRef.current.step + 1) % 64; // Loop de 4 compassos (16 steps * 4)
      }
      musicRef.current.timerId = window.setTimeout(scheduler, 25);
  };

  const playMusicStep = (step: number, time: number) => {
      const ctx = audioCtxRef.current;
      if (!ctx) return;

      // Helper para tocar tons
      const playTone = (freq: number, type: 'sine'|'triangle'|'square'|'sawtooth', vol: number, dur: number, attack = 0.01) => {
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
      };

      const playNoise = (vol: number, dur: number) => {
          // Percussão simples (ruído filtrado) não é fácil nativamente sem buffer, 
          // usaremos oscilador de onda quadrada baixa e curta para "kick" e alta para "hat"
      };

      // --- INSTRUMENTOS ---

      // 1. GLOCKENSPIEL / SINOS (Melodia Feliz) - C Major Pentatonic
      // Steps principais: 0, 4, 8, 12...
      const melody: {[key: number]: number} = {
          0: 783.99, // G5
          4: 659.25, // E5
          8: 523.25, // C5
          12: 659.25, // E5
          14: 783.99, // G5 (syncopated)
          16: 880.00, // A5
          20: 783.99, // G5
          24: 659.25, // E5
          28: 587.33, // D5
          
          32: 523.25, // C5
          36: 659.25, // E5
          40: 698.46, // F5
          44: 880.00, // A5
          48: 1046.50, // C6
          52: 783.99, // G5
          56: 659.25, // E5
          60: 523.25, // C5
      };

      if (melody[step]) {
          // Glockenspiel: Sine, ataque rápido, sustain médio
          playTone(melody[step], 'sine', 0.15, 0.4);
          // Harmônico leve
          playTone(melody[step]*2, 'sine', 0.05, 0.2); 
      }

      // 2. UKULELE (Strumming/Acordes) - Backbeat
      // Toca nos tempos fortes (0, 8, 16...)
      const strum = (rootFreq: number) => {
          // Simula acorde maior (Raiz, 3a Maior, 5a)
          playTone(rootFreq, 'triangle', 0.05, 0.3, 0.02);
          playTone(rootFreq * 1.2599, 'triangle', 0.05, 0.3, 0.03); // ~Major 3rd
          playTone(rootFreq * 1.4983, 'triangle', 0.05, 0.3, 0.04); // ~5th
      };

      if (step % 16 === 0 || step % 16 === 8) { // A cada 2 beats
          const root = (step < 32) ? 261.63 : (step < 48 ? 349.23 : 392.00); // C ... F ... G
          strum(root);
      }

      // 3. PERCUSSÃO SUAVE (Kick e Shaker)
      if (step % 8 === 0) { // Kick
         playTone(150, 'sine', 0.2, 0.1, 0.001); // Boom suave
      }
      if (step % 4 === 2) { // Shaker/Hat
         // Usando onda quadrada alta e curta como shaker
         playTone(8000, 'square', 0.02, 0.03, 0.001);
      }
  };

  // --- Efeitos Sonoros de UI ---
  const playClickSound = () => {
    try {
      const ctx = initAudio();
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
    } catch (e) {
      console.error("Audio error", e);
    }
  };

  const handleNavigate = (scene: SceneName) => {
    playClickSound();
    // Pequeno delay para sentir o clique antes de trocar a cena
    setTimeout(() => {
        onNavigate(scene);
    }, 150);
  };

  const handleExit = () => {
    try { window.close(); } catch(e) {}
    window.location.href = "about:blank";
  };

  return (
    <div className="w-full h-full relative overflow-hidden font-sans select-none flex flex-col">
      
      {/* 1. FUNDO: SVG Otimizado */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${BG_MAIN_MENU})` }}
      >
        {/* Vinheta para focar no centro e melhorar legibilidade */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 pointer-events-none"></div>
      </div>

      {/* Camada de Conteúdo */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-between py-6 md:py-8" onClick={() => { if(audioCtxRef.current?.state === 'suspended') audioCtxRef.current.resume(); }}>
        
        {/* 2. TÍTULO / LOGO (Área Superior) */}
        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-lg mx-auto transform hover:scale-105 transition-transform duration-500 cursor-default">
            {/* Decoração atrás do logo */}
            <div className="absolute bg-white/30 backdrop-blur-sm rounded-full w-80 h-40 -z-10 blur-xl"></div>
            
            <div className="relative">
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

                {/* Ícones Decorativos Flutuantes */}
                <Ghost className="absolute -right-8 -top-4 text-purple-400 w-10 h-10 animate-bounce drop-shadow-lg" style={{ animationDuration: '3s' }} />
                <Zap className="absolute -left-6 bottom-0 text-yellow-400 w-8 h-8 animate-pulse drop-shadow-lg" />
            </div>
        </div>

        {/* 3. BOTÕES PRINCIPAIS (Área Central/Inferior) */}
        <div className="flex-1 flex flex-col justify-center items-center w-full space-y-3 pb-4">
            
            <MenuButton 
                onClick={() => handleNavigate('GAME')} 
                bgColor="bg-green-500" 
                borderColor="border-green-700"
                icon={<Play size={28} fill="currentColor" />}
                label="JOGAR"
                subLabel="Começar a limpar!"
                delay="0ms"
                main
            />

            <div className="flex w-[70%] max-w-[300px] gap-2">
                <MenuButton 
                    onClick={() => handleNavigate('SELECAO_FASES')} 
                    bgColor="bg-blue-500" 
                    borderColor="border-blue-700"
                    icon={<Map size={20} />}
                    label="FASES"
                    delay="100ms"
                    small
                />
                 <MenuButton 
                    onClick={() => handleNavigate('LOJA')} 
                    bgColor="bg-pink-500" 
                    borderColor="border-pink-700"
                    icon={<ShoppingBag size={20} />}
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

            <div className="flex w-[70%] max-w-[300px] gap-3">
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

        {/* Rodapé Pequeno */}
        <div className="text-slate-500/80 font-bold text-xs">v1.1.2 (Sound On)</div>
      </div>

      {/* Modal de Confirmação */}
      {showExitConfirm && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white border-4 border-slate-700 rounded-3xl p-6 w-full max-w-xs text-center shadow-[0_10px_0_rgba(0,0,0,0.2)] transform scale-100 transition-all">
                <h3 className="text-2xl font-black text-slate-800 mb-2">JÁ VAI?</h3>
                <p className="text-slate-500 font-bold mb-6">A casa ainda está suja!</p>
                <div className="flex gap-4">
                    <button 
                        onClick={() => { playClickSound(); setShowExitConfirm(false); }}
                        className="flex-1 py-3 bg-slate-200 border-b-4 border-slate-400 rounded-2xl text-slate-600 font-black active:border-b-0 active:translate-y-1 transition-all"
                    >
                        VOLTAR
                    </button>
                    <button 
                        onClick={handleExit}
                        className="flex-1 py-3 bg-red-500 border-b-4 border-red-700 rounded-2xl text-white font-black active:border-b-0 active:translate-y-1 transition-all"
                    >
                        SAIR
                    </button>
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

// Componente de Botão "Juicy" Personalizado
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
            ${small ? 'flex-1' : 'w-[70%] max-w-[300px]'}
            ${main ? 'h-20 mb-2' : 'h-14'}
            ${bgColor} 
            rounded-2xl md:rounded-3xl
            border-b-[6px] md:border-b-[8px] ${borderColor}
            flex items-center justify-center 
            text-white shadow-xl transition-all duration-100
            active:border-b-0 active:translate-y-[6px] active:shadow-none
            hover:brightness-110
        `}
        style={{ animation: `popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) backwards ${delay}` }}
    >
        {/* Ícone */}
        <div className={`
            absolute left-4 
            ${small ? 'relative left-0 mr-2' : ''}
            drop-shadow-md group-hover:scale-110 transition-transform
        `}>
            {icon}
        </div>
        
        {/* Texto */}
        <div className={`flex flex-col items-start ${small ? 'items-center' : 'pl-8'}`}>
            <span className={`font-black tracking-wide drop-shadow-md leading-none ${main ? 'text-2xl md:text-3xl' : 'text-lg md:text-xl'}`}>
                {label}
            </span>
            {subLabel && !small && (
                <span className="text-[10px] md:text-xs font-bold text-white/80 uppercase tracking-widest bg-black/10 px-2 rounded-full mt-1">
                    {subLabel}
                </span>
            )}
        </div>

        {/* Shine Effect (Brilho no topo) */}
        <div className="absolute top-0 right-0 left-0 h-[40%] bg-gradient-to-b from-white/20 to-transparent rounded-t-2xl md:rounded-t-3xl pointer-events-none"></div>
    </button>
);