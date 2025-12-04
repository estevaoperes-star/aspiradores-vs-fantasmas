import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Zap, Heart, Pause, ArrowLeft, Trash2, Play, ChevronRight, Home, RotateCcw, Skull, Ghost, RefreshCw, Star, AlertCircle, CheckCircle, Lightbulb } from 'lucide-react';
import { GameStatus, Ghost as GhostType, Tower, Projectile, Particle, TowerType, UpgradeState, EquippedItems } from '../types';
import * as Constants from '../constants';

interface GameSceneProps {
    levelId: number;
    onBackToMenu: () => void;
    upgradeLevels: UpgradeState;
    equippedItems: EquippedItems;
    onLevelComplete: (lives: number, maxLives: number) => number;
    onNextLevel: () => void;
}

// --- CONFIGURAÇÃO DE ANIMAÇÕES ---
const HUD_TRANSITION = "transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1)"; 

// --- SUB-COMPONENTS DE UI ---

const NotificationToast = ({ message, type }: { message: string, type: 'info' | 'warning' | 'success' }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        requestAnimationFrame(() => setVisible(true));
    }, []);

    const colors = {
        info: 'bg-blue-600/90 text-white border-blue-400/50',
        warning: 'bg-red-500/90 text-white border-red-400/50',
        success: 'bg-green-500/90 text-white border-green-400/50'
    };

    return (
        <div className={`absolute top-[10%] left-1/2 -translate-x-1/2 z-[70] px-6 py-3 rounded-full backdrop-blur-md shadow-xl border-t border-white/20 flex items-center gap-3 ${colors[type]} transition-all duration-300 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {type === 'warning' && <AlertCircle size={20} className="animate-pulse"/>}
            {type === 'success' && <CheckCircle size={20} className="animate-bounce-short"/>}
            {type === 'info' && <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>}
            <span className="font-bold tracking-wide text-sm md:text-base shadow-sm">{message}</span>
        </div>
    );
};

// --- MODAL DE VITÓRIA ---
const VictoryModal = ({ lives, maxLives, earnedStars, onNext, onMenu, onReplay, levelId, isLastLevel }: any) => {
    const [displayStars, setDisplayStars] = useState(0);
    
    useEffect(() => {
        let start = 0;
        const increment = earnedStars / 50;
        const timer = setInterval(() => {
            start += increment;
            if (start >= earnedStars) {
                setDisplayStars(earnedStars);
                clearInterval(timer);
            } else {
                setDisplayStars(Math.floor(start));
            }
        }, 20);
        return () => clearInterval(timer);
    }, [earnedStars]);

    const starsCount = lives === maxLives ? 3 : (lives >= 1 ? 2 : 1);

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md animate-fade-in p-4 overflow-hidden">
            <div className="bg-white rounded-[2rem] p-8 w-full max-w-md text-center shadow-2xl relative transform scale-100 animate-pop-in border-4 border-yellow-400">
                <div className="mb-6">
                    <h2 className="text-4xl md:text-5xl font-black text-slate-800 mb-1 tracking-tight">VITÓRIA!</h2>
                    <p className="text-slate-500 font-medium text-sm md:text-base">Fase {levelId} concluída</p>
                </div>

                <div className="flex justify-center gap-4 mb-8">
                    {[1, 2, 3].map(i => (
                        <Star 
                            key={i}
                            size={56} 
                            className={`transform transition-all duration-500 ${i <= starsCount ? 'text-yellow-400 fill-yellow-400 drop-shadow-md scale-100' : 'text-slate-200 fill-slate-200 scale-90'}`} 
                            style={{ transitionDelay: `${i * 150}ms` }}
                        />
                    ))}
                </div>
                
                <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-100">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Recompensa</span>
                    <div className="text-3xl font-black text-yellow-500 flex items-center justify-center mt-1">
                        +{displayStars} <Star size={24} className="ml-2 fill-current"/>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    {!isLastLevel ? (
                        <button onClick={onNext} className="w-full h-16 bg-green-500 hover:bg-green-600 text-white font-black rounded-2xl border-b-4 border-green-700 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center text-lg shadow-lg">
                            PRÓXIMA FASE <ChevronRight size={24} className="ml-2" strokeWidth={3}/>
                        </button>
                    ) : (
                        <div className="bg-purple-100 text-purple-600 p-4 rounded-xl font-bold">Jogo Concluído!</div>
                    )}

                    <div className="flex gap-3">
                        <button onClick={onReplay} className="flex-1 h-14 bg-blue-500 hover:bg-blue-600 text-white font-black rounded-xl border-b-4 border-blue-700 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center">
                            <RotateCcw size={20} className="mr-2" strokeWidth={3}/> REPETIR
                        </button>
                        <button onClick={onMenu} className="flex-1 h-14 bg-slate-200 hover:bg-slate-300 text-slate-600 font-black rounded-xl border-b-4 border-slate-400 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center">
                            <Home size={20} className="mr-2" strokeWidth={3}/> MENU
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- MODAL DE DERROTA ---
const DefeatModal = ({ onRetry, onMenu }: any) => {
    const tips = [
        "Robôs bloqueiam o caminho dos fantasmas.",
        "Use o Turbo Fan para empurrar inimigos para trás.",
        "Atualize suas torres para causar mais dano.",
        "Aspiradores de Energia são essenciais no início."
    ];
    const tip = tips[Math.floor(Math.random() * tips.length)];

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-md animate-fade-in p-4">
            <div className="bg-white rounded-[2rem] p-8 w-full max-w-md text-center shadow-2xl relative animate-shake border-4 border-red-500">
                <div className="mb-6">
                    <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-red-200">
                        <Skull size={48} className="text-red-500" />
                    </div>
                    <h2 className="text-4xl font-black text-slate-800 mb-1">DERROTA</h2>
                    <p className="text-slate-500 font-bold">Os fantasmas venceram...</p>
                </div>

                <div className="bg-blue-50 p-4 rounded-xl mb-8 border-l-4 border-blue-400 text-left flex items-start">
                    <Lightbulb className="text-blue-400 shrink-0 mr-3" size={20}/>
                    <div>
                        <span className="text-xs font-black text-blue-400 uppercase tracking-widest block mb-1">Dica</span>
                        <p className="text-sm text-slate-600 font-medium leading-tight">{tip}</p>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <button onClick={onRetry} className="w-full h-16 bg-blue-500 hover:bg-blue-600 text-white font-black rounded-2xl border-b-4 border-blue-700 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center text-lg shadow-lg">
                        <RefreshCw size={24} className="mr-2" strokeWidth={3} /> TENTAR DE NOVO
                    </button>
                    <button onClick={onMenu} className="w-full h-14 bg-slate-200 hover:bg-slate-300 text-slate-600 font-black rounded-xl border-b-4 border-slate-400 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center">
                        <Home size={20} className="mr-2" strokeWidth={3}/> SAIR
                    </button>
                </div>
            </div>
        </div>
    );
};

export const GameScene: React.FC<GameSceneProps> = ({ levelId, onBackToMenu, upgradeLevels, equippedItems, onLevelComplete, onNextLevel }) => {
  // --- Game Config ---
  const levelConfig = Constants.LEVELS.find(l => l.id === levelId) || Constants.LEVELS[0];

  // --- Game State ---
  const [status, setStatus] = useState<GameStatus>('PLAYING');
  const [energy, setEnergy] = useState(levelConfig.initialEnergy);
  const [lives, setLives] = useState(Constants.INITIAL_LIVES);
  const [uiGhostsDefeated, setUiGhostsDefeated] = useState(0);
  const [ghostsSpawned, setGhostsSpawned] = useState(0);
  const [selectedTowerType, setSelectedTowerType] = useState<TowerType>('BASIC');
  const [isRemoving, setIsRemoving] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [earnedStars, setEarnedStars] = useState(0);
  
  // --- Animation States ---
  const [energyBump, setEnergyBump] = useState(false);
  const [livesShake, setLivesShake] = useState(false);
  const prevEnergy = useRef(energy);
  const prevLives = useRef(lives);

  // --- Logic Refs ---
  const ghostsSpawnedRef = useRef(0);
  const ghostsDefeatedRef = useRef(0);
  const towersRef = useRef<Tower[]>([]);
  const ghostsRef = useRef<GhostType[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  
  const [notification, setNotification] = useState<{msg: string, type: 'info'|'warning'|'success'} | null>(null);

  // Loop Control
  const lastTimeRef = useRef<number>(0);
  const spawnTimerRef = useRef<number>(0);
  const lastEnergyTickRef = useRef<number>(0);
  const requestRef = useRef<number>(0);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const musicRef = useRef<{ isPlaying: boolean; nextNoteTime: number; step: number; timerId: number | null }>({
      isPlaying: false, nextNoteTime: 0, step: 0, timerId: null
  });

  const isHudVisible = status === 'PLAYING' && !isPaused;

  useEffect(() => {
    startGame();
    setTimeout(() => showNotification(`Fase ${levelId} Iniciada!`, 'info'), 500);
    return () => {
        cancelAnimationFrame(requestRef.current);
        stopMusic();
    };
  }, [levelId]);

  useEffect(() => {
      if (status === 'PLAYING' && !isPaused) {
          if (audioContextRef.current && audioContextRef.current.state === 'running') startMusic();
      } else {
          stopMusic();
      }
  }, [status, isPaused]);

  // --- MICRO-INTERACTIONS ---
  useEffect(() => {
    if (energy > prevEnergy.current) {
        setEnergyBump(true);
        setTimeout(() => setEnergyBump(false), 120);
    }
    prevEnergy.current = energy;
  }, [energy]);

  useEffect(() => {
    if (lives < prevLives.current) {
        setLivesShake(true);
        setTimeout(() => setLivesShake(false), 300);
    }
    prevLives.current = lives;
  }, [lives]);

  const showNotification = (msg: string, type: 'info'|'warning'|'success' = 'info') => {
      setNotification({ msg, type });
      setTimeout(() => setNotification(null), 2500);
  };

  const startGame = () => {
    setStatus('PLAYING');
    setIsPaused(false);
    setEarnedStars(0);
    setEnergy(levelConfig.initialEnergy); 
    setLives(Constants.INITIAL_LIVES);
    setUiGhostsDefeated(0);
    setGhostsSpawned(0);
    
    ghostsSpawnedRef.current = 0;
    ghostsDefeatedRef.current = 0;
    towersRef.current = [];
    ghostsRef.current = [];
    projectilesRef.current = [];
    particlesRef.current = [];
    
    lastTimeRef.current = performance.now();
    spawnTimerRef.current = 0;
    lastEnergyTickRef.current = 0;
    
    cancelAnimationFrame(requestRef.current);
    requestRef.current = requestAnimationFrame(loop);
    
    initAudio(); 
  };

  const initAudio = () => {
    if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (audioContextRef.current.state === 'suspended') audioContextRef.current.resume().catch(() => {});
    return audioContextRef.current;
  };

  const startMusic = () => {
      if (!audioContextRef.current || musicRef.current.isPlaying) return;
      musicRef.current.isPlaying = true;
      musicRef.current.step = 0;
      musicRef.current.nextNoteTime = audioContextRef.current.currentTime + 0.1;
      scheduler();
  };

  const stopMusic = () => {
      musicRef.current.isPlaying = false;
      if (musicRef.current.timerId) { window.clearTimeout(musicRef.current.timerId); musicRef.current.timerId = null; }
  };

  const scheduler = () => {
      if (!musicRef.current.isPlaying || !audioContextRef.current) return;
      const ctx = audioContextRef.current;
      while (musicRef.current.nextNoteTime < ctx.currentTime + 0.1) {
          playMusicStep(musicRef.current.step, musicRef.current.nextNoteTime);
          const bpm = equippedItems.MUSIC === 10 ? 140 : 120;
          musicRef.current.nextNoteTime += (60.0 / bpm) / 4;
          musicRef.current.step = (musicRef.current.step + 1) % 64; 
      }
      musicRef.current.timerId = window.setTimeout(scheduler, 25);
  };

  const playMusicStep = (step: number, time: number) => {
     const ctx = audioContextRef.current;
     if (!ctx) return;
     const osc = ctx.createOscillator();
     const gain = ctx.createGain();
     osc.connect(gain); gain.connect(ctx.destination);
     if (step % 8 === 0) {
         osc.frequency.setValueAtTime(100, time);
         gain.gain.setValueAtTime(0.05, time); gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
         osc.start(time); osc.stop(time + 0.1);
     }
  };

  const playSound = (type: 'SHOOT' | 'HIT' | 'BUILD' | 'ERROR' | 'VICTORY' | 'GAME_OVER' | 'SELECT' | 'WAVE' | 'LIFE_LOST' | 'GHOST_SPAWN' | 'GHOST_DEATH') => {
      const ctx = initAudio();
      if (!ctx) return;
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      
      switch (type) {
          case 'SHOOT': osc.type = 'triangle'; osc.frequency.setValueAtTime(400, t); osc.frequency.exponentialRampToValueAtTime(200, t + 0.1); gain.gain.setValueAtTime(0.05, t); gain.gain.linearRampToValueAtTime(0, t + 0.1); osc.start(t); osc.stop(t + 0.1); break;
          case 'HIT': osc.type = 'square'; osc.frequency.setValueAtTime(150, t); osc.frequency.exponentialRampToValueAtTime(100, t + 0.05); gain.gain.setValueAtTime(0.05, t); gain.gain.linearRampToValueAtTime(0, t + 0.05); osc.start(t); osc.stop(t + 0.05); break;
          case 'BUILD': osc.type = 'sine'; osc.frequency.setValueAtTime(600, t); osc.frequency.exponentialRampToValueAtTime(800, t + 0.1); gain.gain.setValueAtTime(0.1, t); gain.gain.linearRampToValueAtTime(0, t + 0.1); osc.start(t); osc.stop(t + 0.1); break;
          case 'SELECT': osc.type = 'sine'; osc.frequency.setValueAtTime(800, t); osc.frequency.exponentialRampToValueAtTime(1000, t + 0.05); gain.gain.setValueAtTime(0.05, t); gain.gain.linearRampToValueAtTime(0, t + 0.05); osc.start(t); osc.stop(t + 0.05); break;
          case 'ERROR': osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, t); osc.frequency.exponentialRampToValueAtTime(100, t + 0.2); gain.gain.setValueAtTime(0.1, t); gain.gain.linearRampToValueAtTime(0, t + 0.2); osc.start(t); osc.stop(t + 0.2); break;
          case 'LIFE_LOST': osc.type = 'sawtooth'; osc.frequency.setValueAtTime(200, t); osc.frequency.linearRampToValueAtTime(100, t + 0.3); gain.gain.setValueAtTime(0.2, t); gain.gain.linearRampToValueAtTime(0, t + 0.3); osc.start(t); osc.stop(t + 0.3); break;
          case 'GHOST_SPAWN': osc.type = 'sine'; osc.frequency.setValueAtTime(200, t); osc.frequency.linearRampToValueAtTime(250, t + 0.2); gain.gain.setValueAtTime(0, t); gain.gain.linearRampToValueAtTime(0.05, t + 0.1); gain.gain.linearRampToValueAtTime(0, t + 0.2); osc.start(t); osc.stop(t + 0.2); break;
          case 'GHOST_DEATH': osc.type = 'triangle'; osc.frequency.setValueAtTime(200, t); osc.frequency.exponentialRampToValueAtTime(50, t + 0.2); gain.gain.setValueAtTime(0.1, t); gain.gain.linearRampToValueAtTime(0, t + 0.2); osc.start(t); osc.stop(t + 0.2); break;
          case 'VICTORY': [523, 659, 783, 1046].forEach((f, i) => { const o = ctx.createOscillator(); const g = ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.frequency.value = f; g.gain.setValueAtTime(0, t+i*0.1); g.gain.linearRampToValueAtTime(0.1, t+i*0.1+0.05); g.gain.linearRampToValueAtTime(0, t+i*0.1+0.3); o.start(t+i*0.1); o.stop(t+i*0.1+0.3); }); break;
          case 'GAME_OVER': [440, 392, 349, 311].forEach((f, i) => { const o = ctx.createOscillator(); const g = ctx.createGain(); o.type = 'sawtooth'; o.connect(g); g.connect(ctx.destination); o.frequency.value = f; g.gain.setValueAtTime(0.1, t+i*0.3); g.gain.linearRampToValueAtTime(0, t+i*0.3+0.4); o.start(t+i*0.3); o.stop(t+i*0.3+0.4); }); break;
      }
  };

  const loop = useCallback((time: number) => {
    try {
        if (status !== 'PLAYING' || isPaused) {
            lastTimeRef.current = time;
            requestRef.current = requestAnimationFrame(loop);
            return;
        }
        const dt = time - lastTimeRef.current;
        lastTimeRef.current = time;
        updateGameLogic(dt, time);
        requestRef.current = requestAnimationFrame(loop);
    } catch (e) { console.error("Loop Error", e); }
  }, [status, isPaused]);

  const updateGameLogic = (dt: number, time: number) => {
      // 1. Passive Energy
      if (time - lastEnergyTickRef.current > Constants.PASSIVE_ENERGY_TICK_MS) {
          setEnergy(e => Math.min(e + Constants.PASSIVE_ENERGY_AMOUNT, 9999));
          lastEnergyTickRef.current = time;
      }

      // 2. Spawning Logic
      spawnTimerRef.current += dt;
      if (spawnTimerRef.current > levelConfig.spawnRateMs && ghostsSpawnedRef.current < levelConfig.totalGhosts) {
          spawnGhost();
          spawnTimerRef.current = 0;
      }

      // 3. Towers Logic
      towersRef.current.forEach(tower => {
          const stats = Constants.getTowerStats(tower.type, tower.level);
          if (tower.type === 'ENERGY') {
              if (time - tower.lastActionTime > stats.cooldown) {
                  setEnergy(prev => prev + (stats.production || 5));
                  spawnParticle(tower.col * Constants.CELL_WIDTH_PERCENT + 5, (tower.row * 20) + 5, 'TEXT', `+${stats.production}`, '#fbbf24');
                  tower.lastActionTime = time;
              }
          } else if (tower.type !== 'ROBOT') {
              if (time - tower.lastActionTime > stats.cooldown) {
                  // Filter valid targets (ALIVE ghosts only)
                  const target = ghostsRef.current.filter(g => g.status === 'ALIVE' && g.row === tower.row && g.x > (tower.col * Constants.CELL_WIDTH_PERCENT)).sort((a, b) => a.x - b.x)[0];
                  if (target) {
                      const distCells = (target.x / Constants.CELL_WIDTH_PERCENT) - tower.col;
                      if (distCells <= stats.rangeInCells) {
                          fireProjectile(tower, stats.damage, stats.knockback || 0);
                          tower.lastActionTime = time;
                      }
                  }
              }
          }
      });

      // 4. Projectiles Logic
      projectilesRef.current.forEach(p => { p.x += p.speed * (dt / 16); });
      projectilesRef.current = projectilesRef.current.filter(p => p.x < 105);

      // 5. Ghosts Logic (Move, Animation, Collision)
      ghostsRef.current.forEach(g => {
          // Update Animation Timer
          g.animTimer += dt;

          if (g.status === 'ALIVE') {
              const robotInCell = towersRef.current.find(t => t.type === 'ROBOT' && t.row === g.row && Math.abs((t.col * Constants.CELL_WIDTH_PERCENT) - g.x) < 5);
              let moveSpeed = g.speed;
              if (robotInCell) {
                  moveSpeed = 0; 
                  if (Math.random() > 0.95) { g.hp -= 0.5; g.lastHitTime = time; spawnParticle(g.x, (g.row * 20) + 10, 'CIRCLE', '', '#ef4444'); }
                  if (Math.random() > 0.98) {
                       robotInCell.hp -= 2;
                       if (robotInCell.hp <= 0) { towersRef.current = towersRef.current.filter(t => t.id !== robotInCell.id); spawnParticle(robotInCell.col * Constants.CELL_WIDTH_PERCENT, robotInCell.row * 20, 'RING', '', '#94a3b8'); }
                  }
              }
              if (!g.isFrozen) g.x -= moveSpeed * (dt / 16);

              // Check for Leak
              if (g.x <= 0) {
                  g.status = 'LEAKING';
                  g.animTimer = 0;
                  setLives(prev => { 
                      const newLives = prev - 1; 
                      if (newLives <= 0) handleDefeat(); 
                      return newLives; 
                  });
                  playSound('LIFE_LOST');
              }
          }
      });

      // Remove ghosts that finished dying/leaking
      ghostsRef.current = ghostsRef.current.filter(g => {
          if (g.status === 'DYING' && g.animTimer > 500) return false;
          if (g.status === 'LEAKING' && g.animTimer > 400) return false;
          return true;
      });

      // 6. Projectile vs Ghost Collision
      projectilesRef.current.forEach(p => {
          // Hit only ALIVE ghosts
          const hitGhost = ghostsRef.current.find(g => g.status === 'ALIVE' && g.row === p.row && Math.abs(g.x - p.x) < Constants.PROJECTILE_HITBOX_W);
          if (hitGhost) {
              hitGhost.hp -= p.damage; 
              hitGhost.x += p.knockback; 
              hitGhost.lastHitTime = time;
              p.x = 200; // Remove projectile
              spawnParticle(hitGhost.x, (hitGhost.row * 20) + 10, 'CIRCLE', '', '#60a5fa');
              playSound('HIT');
              if (hitGhost.hp <= 0) handleGhostDeath(hitGhost);
          }
      });
      projectilesRef.current = projectilesRef.current.filter(p => p.x < 150);

      // 7. Particles
      particlesRef.current.forEach(p => { p.life -= dt; p.x += (p.vx || 0); p.y += (p.vy || 0); });
      particlesRef.current = particlesRef.current.filter(p => p.life > 0);

      // 8. Victory Condition
      const allGhostsSpawned = ghostsSpawnedRef.current >= levelConfig.totalGhosts;
      const noGhostsRemaining = ghostsRef.current.length === 0;
      if (allGhostsSpawned && noGhostsRemaining && status === 'PLAYING') handleVictory();
  };

  const spawnGhost = () => {
      const row = Math.floor(Math.random() * Constants.GRID_ROWS);
      const allowedTypes = levelConfig.allowedGhosts;
      const typeKey = allowedTypes[Math.floor(Math.random() * allowedTypes.length)];
      const config = Constants.GHOST_VARIANTS[typeKey];
      ghostsRef.current.push({
          id: Math.random().toString(36), row, x: 100, type: typeKey as any,
          speed: config.speed * levelConfig.speedMultiplier, 
          hp: config.hp * levelConfig.hpMultiplier, 
          maxHp: config.hp * levelConfig.hpMultiplier,
          status: 'ALIVE',
          animTimer: 0,
          lastHitTime: 0
      });
      ghostsSpawnedRef.current += 1;
      setGhostsSpawned(ghostsSpawnedRef.current);
      playSound('GHOST_SPAWN');
  };

  const fireProjectile = (tower: Tower, damage: number, knockback: number) => {
      const type = tower.type === 'MEGA' ? 'BEAM' : (tower.type === 'TURBO' ? 'WIND' : 'PLASMA');
      projectilesRef.current.push({
          id: Math.random().toString(), type, row: tower.row, x: (tower.col * Constants.CELL_WIDTH_PERCENT) + 5,
          speed: 1.0, damage, knockback
      });
      playSound('SHOOT');
  };

  const spawnParticle = (x: number, y: number, type: 'CIRCLE'|'RING'|'TEXT', text: string, color: string) => {
      particlesRef.current.push({ id: Math.random().toString(), x, y, color, life: 1000, type, text, vx: (Math.random() - 0.5) * 0.1, vy: -0.1 });
  };

  const handleGhostDeath = (ghost: GhostType) => {
      // Don't remove immediately, start death animation
      ghost.status = 'DYING';
      ghost.animTimer = 0;
      
      setEnergy(prev => prev + Constants.ENERGY_PER_KILL);
      ghostsDefeatedRef.current += 1;
      setUiGhostsDefeated(ghostsDefeatedRef.current);
      spawnParticle(ghost.x, (ghost.row * 20) + 10, 'TEXT', `+${Constants.ENERGY_PER_KILL}`, '#fbbf24');
      playSound('GHOST_DEATH');
      
      // Explosion particles
      for(let i=0; i<5; i++) {
        spawnParticle(ghost.x, (ghost.row * 20) + 10, 'CIRCLE', '', '#fff');
      }
  };

  const handleVictory = () => { 
      if (status === 'VICTORY') return; 
      cancelAnimationFrame(requestRef.current);
      setStatus('VICTORY'); 
      playSound('VICTORY'); 
      const stars = onLevelComplete(lives, Constants.INITIAL_LIVES);
      setEarnedStars(stars);
  };

  const handleDefeat = () => { 
      if (status === 'DEFEAT') return; 
      cancelAnimationFrame(requestRef.current);
      setStatus('DEFEAT'); 
      playSound('GAME_OVER');
  };

  const handleGridClick = (r: number, c: number) => {
      if (status !== 'PLAYING' || isPaused) return;
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') audioContextRef.current.resume().catch(() => {});

      const existingTower = towersRef.current.find(t => t.row === r && t.col === c);
      if (isRemoving) {
          if (existingTower) {
              towersRef.current = towersRef.current.filter(t => t.id !== existingTower.id);
              spawnParticle(c * Constants.CELL_WIDTH_PERCENT + 5, r * 20 + 5, 'RING', '', '#ef4444');
              setEnergy(prev => prev + Math.floor(Constants.TOWER_TYPES[existingTower.type].cost * 0.5)); 
              playSound('BUILD'); setIsRemoving(false);
          }
          return;
      }
      if (existingTower) return;
      const towerConfig = Constants.TOWER_TYPES[selectedTowerType];
      if (energy >= towerConfig.cost) {
          const level = upgradeLevels[selectedTowerType];
          const stats = Constants.getTowerStats(selectedTowerType, level);
          towersRef.current.push({
              id: Math.random().toString(), row: r, col: c, type: selectedTowerType, lastActionTime: lastTimeRef.current,
              hp: stats.maxHp || 100, maxHp: stats.maxHp || 100, level: level, offset: 0
          });
          setEnergy(prev => prev - towerConfig.cost);
          playSound('BUILD'); spawnParticle(c * Constants.CELL_WIDTH_PERCENT + 5, r * 20 + 5, 'RING', '', '#fff');
      } else {
          playSound('ERROR'); 
          showNotification('Energia Insuficiente!', 'warning');
      }
  };

  const getBackgroundStyle = () => {
      const bgImage = Constants.getLevelBackground(levelId);
      const isCustomBg = equippedItems.BACKGROUND === 11;
      return { 
          backgroundImage: `url(${isCustomBg ? Constants.BG_LEVEL_4 : bgImage})`, 
          backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat'
      };
  };

  const calculateWave = () => {
      const progress = ghostsSpawnedRef.current / levelConfig.totalGhosts;
      if (progress < 0.33) return 1;
      if (progress < 0.66) return 2;
      return 3;
  };

  return (
    <div className="w-full h-full flex flex-col relative select-none font-sans overflow-hidden bg-slate-900" onClick={() => initAudio()}>
      
      {/* --- 1. TOP HUD (Fixo no Fluxo, Sem Sobreposição) --- */}
      <header className="flex-none h-20 md:h-24 bg-white/10 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-4 md:px-8 shadow-lg z-50 relative">
          
          {/* Left Stats */}
          <div className="flex gap-4 md:gap-6 items-center">
              {/* Energy */}
              <div className="flex flex-col md:flex-row md:items-center">
                  <div className={`flex items-center gap-2 transform transition-transform duration-150 ${energyBump ? 'scale-110' : 'scale-100'}`}>
                      <div className={`p-2 rounded-xl shadow-lg transition-colors ${energy >= 50 ? 'bg-green-500' : (energy >= 25 ? 'bg-yellow-500' : 'bg-red-500')}`}>
                          <Zap size={20} className="text-white fill-white" />
                      </div>
                      <div>
                          <span className="block text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">Energia</span>
                          <span className="block text-xl md:text-2xl font-black text-white leading-none tabular-nums">{Math.floor(energy)}</span>
                      </div>
                  </div>
              </div>

              {/* Lives */}
              <div className="flex flex-col md:flex-row md:items-center">
                  <div className={`flex items-center gap-2 transform transition-transform duration-150 ${livesShake ? 'translate-x-1 rotate-6' : 'translate-x-0'}`}>
                      <div className={`p-2 bg-rose-500 rounded-xl shadow-lg ${livesShake ? 'animate-shake' : ''}`}>
                           <Heart size={20} className="text-white fill-white" />
                      </div>
                      <div>
                           <span className="block text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">Vidas</span>
                           <span className={`block text-xl md:text-2xl font-black text-white leading-none tabular-nums ${livesShake ? 'text-red-400' : ''}`}>{lives}</span>
                      </div>
                  </div>
              </div>
          </div>

          {/* Center Info */}
          <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center top-3 md:top-4 pointer-events-none">
               <div className="bg-slate-900/50 px-4 py-1 rounded-full border border-white/10 backdrop-blur-sm mb-1 shadow-md">
                   <span className="text-xs md:text-sm font-black text-blue-300 uppercase tracking-widest">Onda {calculateWave()}</span>
               </div>
               <span className="text-sm md:text-base font-bold text-slate-300 drop-shadow-md">{uiGhostsDefeated} <span className="opacity-50">/</span> {levelConfig.totalGhosts}</span>
          </div>

          {/* Right Pause */}
          <button 
              onClick={() => { setIsPaused(!isPaused); playSound('SELECT'); }}
              className={`w-12 h-12 md:w-14 md:h-14 bg-slate-800 hover:bg-slate-700 rounded-2xl border-2 border-slate-600 flex items-center justify-center transition-all shadow-lg hover:scale-105 active:scale-90 duration-200`}
          >
              <Pause size={24} className="text-white fill-white" />
          </button>
      </header>

      {/* --- 2. GAME AREA (Flex-1: Ocupa o Resto) --- */}
      <main className="flex-1 relative w-full overflow-hidden z-10" style={getBackgroundStyle()}>
          {/* NOTIFICATIONS INSIDE GAME AREA */}
          {notification && <NotificationToast message={notification.msg} type={notification.type} />}

          {/* GAME GRID & ENTITIES */}
          <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${Constants.GRID_COLS}, 1fr)`, gridTemplateRows: `repeat(${Constants.GRID_ROWS}, 1fr)` }}>
              {Array.from({ length: Constants.GRID_ROWS * Constants.GRID_COLS }).map((_, i) => {
                  const r = Math.floor(i / Constants.GRID_COLS);
                  const c = i % Constants.GRID_COLS;
                  return (
                      <div key={i} onClick={() => handleGridClick(r, c)} className="w-full h-full relative z-20"></div>
                  );
              })}
          </div>

          {/* RENDERING ENTITIES (ABSOLUTE within MAIN) */}
          <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
               {/* TOWERS */}
               {towersRef.current.map(tower => {
                    const conf = Constants.TOWER_TYPES[tower.type];
                    const skinFilter = equippedItems.SKINS === 1 ? 'hue-rotate(180deg) brightness(1.5)' : (equippedItems.SKINS === 2 ? 'grayscale(100%) contrast(1.2)' : 'none');
                    return (
                        <div key={tower.id} className="absolute transition-all duration-200"
                             style={{ top: `${(tower.row / Constants.GRID_ROWS) * 100}%`, left: `${(tower.col * Constants.CELL_WIDTH_PERCENT)}%`, width: `${Constants.CELL_WIDTH_PERCENT}%`, height: `${100 / Constants.GRID_ROWS}%`, padding: '4px' }}>
                            <div className="w-full h-full relative flex items-center justify-center animate-pop-in">
                                 <img src={conf.image} alt={conf.name} className="w-full h-full object-contain drop-shadow-md" style={{ filter: skinFilter }} />
                                 <div className="absolute -top-1 -right-1 bg-slate-800 text-[10px] text-white w-5 h-5 rounded-full flex items-center justify-center border-2 border-white font-bold">{tower.level}</div>
                                 {tower.type === 'ROBOT' && (<div className="absolute bottom-0 w-full h-1 bg-red-900 rounded-full overflow-hidden border border-white/20"><div className="h-full bg-green-500" style={{ width: `${(tower.hp / tower.maxHp) * 100}%` }}></div></div>)}
                            </div>
                        </div>
                    );
               })}
               
               {/* GHOSTS WITH ANIMATIONS */}
               {ghostsRef.current.map(ghost => {
                    const conf = Constants.GHOST_VARIANTS[ghost.type];
                    let animClass = 'animate-ghost-float'; // Default IDLE
                    if (ghost.status === 'DYING') animClass = 'animate-ghost-die';
                    if (ghost.status === 'LEAKING') animClass = 'animate-ghost-leak';
                    
                    const isHit = (performance.now() - ghost.lastHitTime) < 150;
                    const hitStyle = isHit ? { filter: 'brightness(10) sepia(1) hue-rotate(-50deg) saturate(5)' } : {};

                    let duration = '2s';
                    if (ghost.type === 'MEDROSO') duration = '0.5s'; 
                    if (ghost.type === 'SONOLENTO') duration = '3s';

                    return (
                        <div key={ghost.id} className={`absolute will-change-transform z-30 transition-transform duration-100 ${ghost.status === 'ALIVE' ? 'animate-ghost-spawn' : ''}`}
                             style={{ 
                                 top: `${(ghost.row / Constants.GRID_ROWS) * 100}%`, 
                                 left: `${ghost.x}%`, 
                                 width: `${Constants.CELL_WIDTH_PERCENT}%`, 
                                 height: `${100 / Constants.GRID_ROWS}%`, 
                                 transform: `translateX(-50%) scaleX(-1)`, 
                                 opacity: ghost.status === 'ALIVE' ? 1 : (ghost.status === 'DYING' ? 0.8 : 1)
                             }}>
                             <div className="w-full h-full relative p-2 flex items-center justify-center">
                                 {ghost.status === 'ALIVE' && (
                                    <div className="absolute bottom-2 w-1/2 h-2 bg-black/20 rounded-full blur-[2px] animate-pulse"></div>
                                 )}
                                 <div className={`w-full h-full ${animClass}`} style={{ animationDuration: duration }}>
                                     <img src={conf.image} className="w-full h-full object-contain drop-shadow-lg" style={hitStyle} />
                                     {ghost.type === 'POEIRA' && ghost.status === 'ALIVE' && (
                                         <div className="absolute inset-0 flex items-center justify-center overflow-visible">
                                             <div className="w-full h-full bg-stone-500/20 rounded-full blur-xl animate-pulse"></div>
                                         </div>
                                     )}
                                 </div>
                                 {ghost.status === 'ALIVE' && (
                                     <div className="absolute top-1 left-1/2 -translate-x-1/2 w-10 h-1 bg-black/50 rounded-full overflow-hidden border border-white/20">
                                         <div className="h-full bg-purple-500" style={{ width: `${(ghost.hp / ghost.maxHp) * 100}%` }}></div>
                                     </div>
                                 )}
                             </div>
                        </div>
                    );
               })}

               {/* PROJECTILES */}
               {projectilesRef.current.map(proj => (
                   <div key={proj.id} className="absolute w-3 h-3 md:w-4 md:h-4 bg-yellow-300 rounded-full shadow-[0_0_10px_#fde047] z-30" style={{ top: `${(proj.row * 20) + 10}%`, left: `${proj.x}%`, transform: 'translate(-50%, -50%)' }}></div>
               ))}
               
               {/* PARTICLES */}
               {particlesRef.current.map(p => (
                   <div key={p.id} className="absolute font-bold text-xs md:text-sm pointer-events-none z-40 shadow-sm whitespace-nowrap" style={{ top: `${p.y}%`, left: `${p.x}%`, color: p.color, opacity: p.life / 500, transform: `scale(${p.life / 1000})` }}>
                       {p.type === 'TEXT' ? p.text : (p.type === 'RING' ? <div className="w-8 h-8 rounded-full border-4 border-current animate-ping"></div> : <div className="w-2 h-2 rounded-full bg-current shadow-[0_0_5px_currentColor]"></div>)}
                   </div>
               ))}
          </div>
      </main>

      {/* --- 3. BOTTOM HUD (Fixo no Fluxo, Sem Sobreposição) --- */}
      <footer className="flex-none h-24 md:h-32 bg-white/10 backdrop-blur-xl border-t border-white/10 flex items-center justify-center pb-2 px-4 shadow-[0_-5px_20px_rgba(0,0,0,0.2)] z-50 relative">
         <div className="flex gap-2 md:gap-6 items-center w-full max-w-4xl justify-center overflow-x-auto no-scrollbar py-2">
            {(Object.keys(Constants.TOWER_TYPES) as TowerType[]).map((type) => {
                const conf = Constants.TOWER_TYPES[type];
                const isSelected = selectedTowerType === type && !isRemoving;
                const canAfford = energy >= conf.cost;
                return (
                    <button 
                        key={type} 
                        onClick={() => { setSelectedTowerType(type); setIsRemoving(false); playSound('SELECT'); }}
                        className={`
                            relative group w-16 h-16 md:w-24 md:h-24 rounded-2xl md:rounded-3xl transition-all duration-300 flex flex-col items-center justify-center shrink-0
                            ${isSelected 
                                ? 'bg-white shadow-[0_0_20px_rgba(255,255,255,0.4)] scale-110 z-10 -translate-y-2' 
                                : (canAfford ? 'bg-slate-800/80 hover:bg-slate-700 hover:-translate-y-1' : 'bg-slate-900/50 opacity-50 grayscale')
                            }
                        `}
                    >
                        <div className={`absolute -top-2 -right-2 w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-[10px] md:text-xs font-black border-2 z-20 transition-transform ${canAfford ? 'bg-yellow-400 text-slate-900 border-white scale-100' : 'bg-red-500 text-white border-red-700 scale-90'}`}>
                            {conf.cost}
                        </div>
                        <div className="w-10 h-10 md:w-16 md:h-16 flex items-center justify-center">
                             <img src={conf.image} className={`w-full h-full object-contain drop-shadow-xl transition-transform duration-300 ${isSelected ? 'scale-110' : ''}`} />
                        </div>
                    </button>
                )
            })}
            
            <div className="w-[1px] h-12 bg-white/20 mx-2"></div>
            
            <button 
                onClick={() => { setIsRemoving(!isRemoving); playSound('SELECT'); }}
                className={`w-16 h-16 md:w-24 md:h-24 rounded-2xl md:rounded-3xl flex flex-col items-center justify-center transition-all duration-300 shrink-0 ${isRemoving ? 'bg-red-500 text-white shadow-lg scale-110 -translate-y-2' : 'bg-slate-800/80 text-red-400 hover:bg-slate-700 hover:-translate-y-1'}`}
            >
                <Trash2 size={24} className="md:w-8 md:h-8" strokeWidth={3} />
                <span className="text-[9px] md:text-[10px] font-black mt-1 uppercase">Vender</span>
            </button>
         </div>
      </footer>

      {/* --- MODALS (Overlays) --- */}
      {isPaused && status === 'PLAYING' && (
          <div className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center animate-fade-in p-4">
              <div className="bg-white rounded-3xl border-4 border-slate-200 p-8 w-full max-w-sm text-center shadow-2xl transform scale-100 transition-transform duration-300 ease-out">
                  <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-orange-200">
                      <Pause size={40} className="text-orange-500 fill-orange-500" />
                  </div>
                  <h2 className="text-3xl font-black text-slate-800 mb-2">PAUSADO</h2>
                  <div className="flex flex-col gap-3 mt-6">
                      <button onClick={() => setIsPaused(false)} className="w-full py-4 bg-green-500 hover:bg-green-400 text-white font-black rounded-xl border-b-4 border-green-700 active:border-b-0 active:translate-y-1 transition-all">CONTINUAR</button>
                      <button onClick={startGame} className="w-full py-4 bg-blue-500 hover:bg-blue-400 text-white font-black rounded-xl border-b-4 border-blue-700 active:border-b-0 active:translate-y-1 transition-all">REINICIAR</button>
                      <button onClick={onBackToMenu} className="w-full py-4 bg-slate-200 hover:bg-slate-300 text-slate-600 font-black rounded-xl border-b-4 border-slate-400 active:border-b-0 active:translate-y-1 transition-all">SAIR</button>
                  </div>
              </div>
          </div>
      )}

      {status === 'VICTORY' && (
          <VictoryModal 
             lives={lives} 
             maxLives={Constants.INITIAL_LIVES}
             earnedStars={earnedStars}
             levelId={levelId}
             isLastLevel={levelId >= Constants.LEVELS.length}
             onNext={() => { playSound('SELECT'); onNextLevel(); }}
             onReplay={() => { playSound('SELECT'); startGame(); }}
             onMenu={() => { playSound('SELECT'); onBackToMenu(); }}
          />
      )}

      {status === 'DEFEAT' && (
          <DefeatModal 
             onRetry={() => { playSound('SELECT'); startGame(); }}
             onMenu={() => { playSound('SELECT'); onBackToMenu(); }}
          />
      )}

      <style>{`
        @keyframes pop-in { 0% { transform: scale(0); } 80% { transform: scale(1.1); } 100% { transform: scale(1); } }
        .animate-pop-in { animation: pop-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
        .animate-shake { animation: shake 0.3s ease-in-out; }
        @keyframes bounce-short { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .animate-bounce-short { animation: bounce-short 0.5s ease-out; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        /* --- GHOST ANIMATIONS --- */
        
        /* 1. SPAWN (Elastic Entry) */
        @keyframes ghost-spawn {
            0% { transform: translateX(-50%) scaleX(-1) scale(0) translateY(20px); opacity: 0; }
            60% { transform: translateX(-50%) scaleX(-1) scale(1.1) translateY(-5px); opacity: 1; }
            100% { transform: translateX(-50%) scaleX(-1) scale(1) translateY(0); opacity: 1; }
        }
        .animate-ghost-spawn { animation: ghost-spawn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }

        /* 2. IDLE / MOVE (Floating) */
        @keyframes ghost-float {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            50% { transform: translateY(-6px) rotate(2deg); }
        }
        .animate-ghost-float { animation: ghost-float 2s ease-in-out infinite; }

        /* 3. DEATH (Implosion & Fade) */
        @keyframes ghost-die {
            0% { transform: scale(1) rotate(0deg); opacity: 1; filter: grayscale(0); }
            40% { transform: scale(1.2) rotate(-5deg); opacity: 0.8; filter: grayscale(1); }
            100% { transform: scale(0) rotate(180deg); opacity: 0; }
        }
        .animate-ghost-die { animation: ghost-die 0.5s ease-in forwards; }

        /* 4. LEAK (Exit to Left) */
        @keyframes ghost-leak {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.2) translateY(-10px); opacity: 0.8; }
            100% { transform: scale(0.5) translateY(-50px) translateX(-50px); opacity: 0; }
        }
        .animate-ghost-leak { animation: ghost-leak 0.4s ease-in forwards; }

      `}</style>
    </div>
  );
};