import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Zap, Heart, Pause, ArrowLeft, Trash2, Play, PartyPopper, Skull } from 'lucide-react';
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

export const GameScene: React.FC<GameSceneProps> = ({ levelId, onBackToMenu, upgradeLevels, equippedItems, onLevelComplete, onNextLevel }) => {
  // --- Game State ---
  const [status, setStatus] = useState<GameStatus>('PLAYING');
  const [energy, setEnergy] = useState(Constants.INITIAL_ENERGY);
  const [lives, setLives] = useState(Constants.INITIAL_LIVES);
  const [ghostsDefeated, setGhostsDefeated] = useState(0);
  const [selectedTowerType, setSelectedTowerType] = useState<TowerType>('BASIC');
  const [isRemoving, setIsRemoving] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showVictory, setShowVictory] = useState(false);
  const [showDefeat, setShowDefeat] = useState(false);
  
  // Entities Refs (Mutable for Performance in Game Loop)
  const towersRef = useRef<Tower[]>([]);
  const ghostsRef = useRef<GhostType[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  
  // State for Rendering (Synced with Refs)
  const [renderTrigger, setRenderTrigger] = useState(0);

  // Loop Control
  const lastTimeRef = useRef<number>(0);
  const spawnTimerRef = useRef<number>(0);
  const lastEnergyTickRef = useRef<number>(0);
  const requestRef = useRef<number>(0);
  
  // --- AUDIO REFS ---
  const audioContextRef = useRef<AudioContext | null>(null);
  const musicRef = useRef<{ isPlaying: boolean; nextNoteTime: number; step: number; timerId: number | null }>({
      isPlaying: false, nextNoteTime: 0, step: 0, timerId: null
  });

  // --- INITIALIZATION ---
  useEffect(() => {
    startGame();
    return () => {
        cancelAnimationFrame(requestRef.current);
        stopMusic();
    };
  }, [levelId]);

  // Controle da Música baseado no estado do jogo
  useEffect(() => {
      if (status === 'PLAYING' && !isPaused) {
          // Tenta iniciar se o contexto já estiver permitido
          if (audioContextRef.current && audioContextRef.current.state === 'running') {
              startMusic();
          }
      } else {
          stopMusic();
      }
  }, [status, isPaused]);

  const startGame = () => {
    setStatus('PLAYING');
    setIsPaused(false);
    setShowVictory(false);
    setShowDefeat(false);
    setEnergy(Constants.INITIAL_ENERGY);
    setLives(Constants.INITIAL_LIVES);
    setGhostsDefeated(0);
    
    // Reset Entities
    towersRef.current = [];
    ghostsRef.current = [];
    projectilesRef.current = [];
    particlesRef.current = [];
    
    // Reset Timers
    lastTimeRef.current = performance.now();
    spawnTimerRef.current = 0;
    lastEnergyTickRef.current = 0;
    
    // Start Loop
    requestRef.current = requestAnimationFrame(loop);
    
    // Tenta iniciar música
    initAudio(); 
  };

  // --- AUDIO SYSTEM ---
  const initAudio = () => {
    if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume().then(() => {
            if (status === 'PLAYING' && !isPaused) startMusic();
        }).catch(() => {});
    }
    return audioContextRef.current;
  };

  const startMusic = () => {
      const ctx = audioContextRef.current;
      if (!ctx) return;
      if (musicRef.current.isPlaying) return;

      musicRef.current.isPlaying = true;
      musicRef.current.step = 0;
      musicRef.current.nextNoteTime = ctx.currentTime + 0.1;
      scheduler();
  };

  const stopMusic = () => {
      musicRef.current.isPlaying = false;
      if (musicRef.current.timerId) {
          window.clearTimeout(musicRef.current.timerId);
          musicRef.current.timerId = null;
      }
  };

  const scheduler = () => {
      if (!musicRef.current.isPlaying) return;
      const ctx = audioContextRef.current;
      if (!ctx) return;
      const scheduleAheadTime = 0.1;
      const lookahead = 25.0; 
      try {
          while (musicRef.current.nextNoteTime < ctx.currentTime + scheduleAheadTime) {
              playMusicStep(musicRef.current.step, musicRef.current.nextNoteTime);
              const bpm = equippedItems.MUSIC === 10 ? 140 : 120;
              const secondsPerBeat = 60.0 / bpm;
              const secondsPer16th = secondsPerBeat / 4;
              musicRef.current.nextNoteTime += secondsPer16th;
              musicRef.current.step = (musicRef.current.step + 1) % 64; 
          }
          musicRef.current.timerId = window.setTimeout(scheduler, lookahead);
      } catch(e) {
          console.warn("Audio scheduler error", e);
          stopMusic();
      }
  };

  const playMusicStep = (step: number, time: number) => {
      const ctx = audioContextRef.current;
      if (!ctx) return;
      const isAltMusic = equippedItems.MUSIC === 10;
      const rootBase = isAltMusic ? 196.00 : 261.63; 
      const playTone = (freq: number, type: 'sine'|'square'|'triangle'|'sawtooth', vol: number, dur: number) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = type;
          osc.frequency.setValueAtTime(freq, time);
          osc.connect(gain);
          gain.connect(ctx.destination);
          gain.gain.setValueAtTime(0, time);
          gain.gain.linearRampToValueAtTime(vol, time + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
          osc.start(time);
          osc.stop(time + dur + 0.1);
      };
      if (step % 4 === 0) {
          let freq = rootBase / 2; 
          if (step >= 16 && step < 32) freq *= 1.334; 
          if (step >= 32 && step < 48) freq *= 1.5; 
          playTone(freq, 'triangle', 0.15, 0.2);
          playTone(freq/2, 'sine', 0.2, 0.2); 
      }
      if (step % 8 === 0) {
          playTone(60, 'sine', 0.3, 0.1);
          const osc = ctx.createOscillator(); 
          const g = ctx.createGain();
          osc.frequency.setValueAtTime(150, time);
          osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.1);
          g.gain.setValueAtTime(0.2, time);
          g.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
          osc.connect(g); g.connect(ctx.destination);
          osc.start(time); osc.stop(time + 0.1);
      }
      if (step % 16 === 8) {
          playTone(800, 'square', 0.05, 0.05);
          playTone(1200, 'sawtooth', 0.05, 0.05);
      }
      if (step % 2 === 0) playTone(4000 + Math.random()*1000, 'square', 0.02, 0.01);
      const scale = isAltMusic ? [196.00, 233.08, 261.63, 293.66, 311.13, 392.00] : [261.63, 311.13, 349.23, 392.00, 466.16, 523.25]; 
      if (step % 2 === 0) {
          const index = (step / 2) % scale.length;
          const octave = Math.random() > 0.8 ? 2 : 1;
          const rhythmMask = [1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 0, 1]; 
          if (rhythmMask[step % 16]) playTone(scale[index] * octave, 'sine', 0.1, 0.1);
      }
  };

  const playSound = (type: 'SHOOT' | 'HIT' | 'BUILD' | 'ERROR' | 'VICTORY' | 'GAME_OVER' | 'SELECT') => {
      const ctx = initAudio();
      if (!ctx) return;
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      switch (type) {
          case 'SHOOT': osc.type = 'triangle'; osc.frequency.setValueAtTime(400, t); osc.frequency.exponentialRampToValueAtTime(200, t + 0.1); gain.gain.setValueAtTime(0.1, t); gain.gain.linearRampToValueAtTime(0, t + 0.1); osc.start(t); osc.stop(t + 0.1); break;
          case 'HIT': osc.type = 'square'; osc.frequency.setValueAtTime(150, t); osc.frequency.exponentialRampToValueAtTime(100, t + 0.05); gain.gain.setValueAtTime(0.05, t); gain.gain.linearRampToValueAtTime(0, t + 0.05); osc.start(t); osc.stop(t + 0.05); break;
          case 'BUILD': osc.type = 'sine'; osc.frequency.setValueAtTime(300, t); osc.frequency.exponentialRampToValueAtTime(600, t + 0.2); gain.gain.setValueAtTime(0.1, t); gain.gain.linearRampToValueAtTime(0, t + 0.2); osc.start(t); osc.stop(t + 0.2); break;
          case 'SELECT': osc.type = 'sine'; osc.frequency.setValueAtTime(600, t); osc.frequency.exponentialRampToValueAtTime(800, t + 0.1); gain.gain.setValueAtTime(0.05, t); gain.gain.linearRampToValueAtTime(0, t + 0.1); osc.start(t); osc.stop(t + 0.1); break;
          case 'ERROR': osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, t); osc.frequency.exponentialRampToValueAtTime(100, t + 0.2); gain.gain.setValueAtTime(0.1, t); gain.gain.linearRampToValueAtTime(0, t + 0.2); osc.start(t); osc.stop(t + 0.2); break;
          case 'VICTORY': [400, 500, 600, 800].forEach((freq, i) => { const o = ctx.createOscillator(); const g = ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.frequency.value = freq; g.gain.setValueAtTime(0.1, t + i*0.1); g.gain.linearRampToValueAtTime(0, t + i*0.1 + 0.2); o.start(t + i*0.1); o.stop(t + i*0.1 + 0.2); }); break;
      }
  };

  // --- GAME LOOP ---
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
        setRenderTrigger(prev => prev + 1);
        requestRef.current = requestAnimationFrame(loop);
    } catch (e) { console.error("Loop Error", e); }
  }, [status, isPaused]);

  const updateGameLogic = (dt: number, time: number) => {
      if (time - lastEnergyTickRef.current > Constants.PASSIVE_ENERGY_TICK_MS) {
          setEnergy(e => Math.min(e + Constants.PASSIVE_ENERGY_AMOUNT, 9999));
          lastEnergyTickRef.current = time;
      }
      spawnTimerRef.current += dt;
      let spawnRate = Constants.GHOST_SPAWN_RATE_MS / (1 + (levelId * 0.2)); 
      if (spawnTimerRef.current > spawnRate && ghostsRef.current.length < 50 && ghostsDefeated < Constants.TOTAL_GHOSTS_TO_WIN) {
          spawnGhost();
          spawnTimerRef.current = 0;
      }
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
                  const target = ghostsRef.current.filter(g => g.row === tower.row && g.x > (tower.col * Constants.CELL_WIDTH_PERCENT)).sort((a, b) => a.x - b.x)[0];
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
      projectilesRef.current.forEach(p => { p.x += p.speed * (dt / 16); });
      projectilesRef.current = projectilesRef.current.filter(p => p.x < 105);
      ghostsRef.current.forEach(g => {
          const robotInCell = towersRef.current.find(t => t.type === 'ROBOT' && t.row === g.row && Math.abs((t.col * Constants.CELL_WIDTH_PERCENT) - g.x) < 5);
          let moveSpeed = g.speed;
          if (robotInCell) {
              moveSpeed = 0; 
              if (Math.random() > 0.95) { g.hp -= 0.5; spawnParticle(g.x, (g.row * 20) + 10, 'CIRCLE', '', '#ef4444'); }
              if (Math.random() > 0.98) {
                   robotInCell.hp -= 2;
                   if (robotInCell.hp <= 0) { towersRef.current = towersRef.current.filter(t => t.id !== robotInCell.id); spawnParticle(robotInCell.col * Constants.CELL_WIDTH_PERCENT, robotInCell.row * 20, 'RING', '', '#94a3b8'); }
              }
          }
          if (!g.isFrozen) g.x -= moveSpeed * (dt / 16);
          else if (Math.random() > 0.99) g.isFrozen = false;
      });
      projectilesRef.current.forEach(p => {
          const hitGhost = ghostsRef.current.find(g => g.row === p.row && Math.abs(g.x - p.x) < Constants.PROJECTILE_HITBOX_W);
          if (hitGhost) {
              hitGhost.hp -= p.damage; hitGhost.x += p.knockback; p.x = 200; 
              spawnParticle(hitGhost.x, (hitGhost.row * 20) + 10, 'CIRCLE', '', '#60a5fa');
              playSound('HIT');
              if (hitGhost.hp <= 0) handleGhostDeath(hitGhost);
          }
      });
      projectilesRef.current = projectilesRef.current.filter(p => p.x < 150);
      const leaked = ghostsRef.current.filter(g => g.x <= 0);
      if (leaked.length > 0) {
          setLives(prev => { const newLives = prev - leaked.length; if (newLives <= 0) handleDefeat(); return newLives; });
          playSound('ERROR');
          ghostsRef.current = ghostsRef.current.filter(g => g.x > 0);
      }
      particlesRef.current.forEach(p => { p.life -= dt; p.x += (p.vx || 0); p.y += (p.vy || 0); });
      particlesRef.current = particlesRef.current.filter(p => p.life > 0);
      if (ghostsDefeated >= Constants.TOTAL_GHOSTS_TO_WIN && ghostsRef.current.length === 0) handleVictory();
  };

  // --- ACTIONS ---
  const spawnGhost = () => {
      const row = Math.floor(Math.random() * Constants.GRID_ROWS);
      const types: GhostType['type'][] = ['TRAVESSO', 'MEDROSO', 'SONOLENTO', 'POEIRA'];
      const maxIndex = Math.min(types.length - 1, Math.max(0, levelId - 1)); 
      const typeKey = types[Math.floor(Math.random() * (maxIndex + 1))];
      const config = Constants.GHOST_VARIANTS[typeKey];
      ghostsRef.current.push({
          id: Math.random().toString(36), row, x: 100, type: typeKey as any,
          speed: config.speed * (1 + (levelId * 0.1)), hp: config.hp * (1 + (levelId * 0.1)), maxHp: config.hp * (1 + (levelId * 0.1)),
      });
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
      setEnergy(prev => prev + Constants.ENERGY_PER_KILL);
      setGhostsDefeated(prev => prev + 1);
      spawnParticle(ghost.x, (ghost.row * 20) + 10, 'TEXT', `+${Constants.ENERGY_PER_KILL}`, '#fbbf24');
      ghostsRef.current = ghostsRef.current.filter(g => g.id !== ghost.id);
  };

  const handleVictory = () => { if (status === 'VICTORY') return; setStatus('VICTORY'); setShowVictory(true); playSound('VICTORY'); };
  const handleDefeat = () => { if (status === 'DEFEAT') return; setStatus('DEFEAT'); setShowDefeat(true); };

  const handleGridClick = (r: number, c: number) => {
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume().then(() => { if (status === 'PLAYING' && !isPaused) startMusic(); }).catch(() => {});
      }
      if (status !== 'PLAYING' || isPaused) return;
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
          playSound('ERROR'); spawnParticle(c * Constants.CELL_WIDTH_PERCENT + 5, r * 20 + 5, 'TEXT', 'Sem Energia!', '#ef4444');
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

  return (
    <div className={`w-full h-full relative select-none flex flex-col font-sans overflow-hidden`} style={getBackgroundStyle()} onClick={() => initAudio()}>
      
      {/* --- HUD HEADER COMPACTO PARA MOBILE --- */}
      <div className="h-12 md:h-16 flex items-center justify-between px-2 md:px-4 z-30 border-b shrink-0 bg-slate-900/90 border-slate-700 text-white shadow-lg">
        <div className="flex items-center space-x-2 md:space-x-6">
          <button onClick={onBackToMenu} className="p-1 md:p-2 rounded-full hover:bg-slate-700 transition-colors border border-slate-600">
              <ArrowLeft size={18} />
          </button>
          
          <div className="flex items-center bg-slate-800 px-2 md:px-3 py-1 rounded-lg border border-slate-600">
            <Zap className="mr-1 md:mr-2 text-yellow-400 fill-yellow-400" size={16} />
            <span className="font-mono font-bold text-lg md:text-xl text-yellow-100">{Math.floor(energy)}</span>
          </div>

          <div className="flex items-center bg-slate-800 px-2 md:px-3 py-1 rounded-lg border border-slate-600">
            <Heart className="mr-1 md:mr-2 text-red-500 fill-red-500" size={16} />
            <span className="font-mono font-bold text-lg md:text-xl text-red-100">{lives}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 md:space-x-4">
            <div className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-slate-400">
                Fantasmas: <span className="text-white text-sm md:text-base ml-1">{ghostsDefeated} / {Constants.TOTAL_GHOSTS_TO_WIN}</span>
            </div>
            
            <button 
                onClick={() => setIsPaused(!isPaused)}
                className={`p-2 rounded-full ${isPaused ? 'bg-yellow-500 text-black animate-pulse' : 'bg-slate-700 text-white'} border border-slate-500`}
            >
                {isPaused ? <Play size={18} fill="currentColor"/> : <Pause size={18} fill="currentColor"/>}
            </button>
        </div>
      </div>

      {/* --- GAME BOARD (TOUCH ACTION NONE para prevenir zoom) --- */}
      <div className="flex-1 relative overflow-hidden" style={{ touchAction: 'none' }}>
        {/* GRID LAYER */}
        <div className="absolute inset-0 grid z-10" style={{ gridTemplateColumns: `repeat(${Constants.GRID_COLS}, 1fr)`, gridTemplateRows: `repeat(${Constants.GRID_ROWS}, 1fr)` }}>
          {Array.from({ length: Constants.GRID_ROWS * Constants.GRID_COLS }).map((_, i) => {
             const r = Math.floor(i / Constants.GRID_COLS);
             const c = i % Constants.GRID_COLS;
             const isDark = (r + c) % 2 === 1;
             return (
                 <div 
                    key={i} 
                    onClick={() => handleGridClick(r, c)}
                    className={`w-full h-full border-r border-b border-white/5 ${isDark ? 'bg-black/10' : 'bg-transparent'} relative`}
                 ></div>
             );
          })}
        </div>

        {/* ENTITY LAYER */}
        <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
            {towersRef.current.map(tower => {
                const conf = Constants.TOWER_TYPES[tower.type];
                const skinFilter = equippedItems.SKINS === 1 ? 'hue-rotate(180deg) brightness(1.5)' : (equippedItems.SKINS === 2 ? 'grayscale(100%) contrast(1.2)' : 'none');
                return (
                    <div key={tower.id} className="absolute transition-all duration-200"
                         style={{ top: `${(tower.row / Constants.GRID_ROWS) * 100}%`, left: `${(tower.col * Constants.CELL_WIDTH_PERCENT)}%`, width: `${Constants.CELL_WIDTH_PERCENT}%`, height: `${100 / Constants.GRID_ROWS}%`, padding: '4px' }}>
                        <div className="w-full h-full relative flex items-center justify-center animate-[popIn_0.3s_ease-out]">
                             <img src={conf.image} alt={conf.name} className="w-full h-full object-contain drop-shadow-md" style={{ filter: skinFilter }} />
                             <div className="absolute -top-1 -right-1 bg-slate-800 text-[10px] text-white w-4 h-4 rounded-full flex items-center justify-center border border-white">{tower.level}</div>
                             {tower.type === 'ROBOT' && (<div className="absolute bottom-0 w-full h-1 bg-red-900 rounded-full overflow-hidden"><div className="h-full bg-green-500" style={{ width: `${(tower.hp / tower.maxHp) * 100}%` }}></div></div>)}
                        </div>
                    </div>
                );
            })}
            {ghostsRef.current.map(ghost => {
                const conf = Constants.GHOST_VARIANTS[ghost.type];
                const isFlipped = true; 
                return (
                    <div key={ghost.id} className="absolute transition-transform will-change-transform"
                         style={{ top: `${(ghost.row / Constants.GRID_ROWS) * 100}%`, left: `${ghost.x}%`, width: `${Constants.CELL_WIDTH_PERCENT}%`, height: `${100 / Constants.GRID_ROWS}%`, transform: `translateX(-50%) ${isFlipped ? 'scaleX(1)' : 'scaleX(-1)'}` }}>
                         <div className="w-full h-full relative p-2">
                             <img src={conf.image} className="w-full h-full object-contain drop-shadow-lg opacity-90" />
                             <div className="absolute top-1 left-2 right-2 h-1 bg-black/50 rounded-full overflow-hidden"><div className="h-full bg-purple-500" style={{ width: `${(ghost.hp / ghost.maxHp) * 100}%` }}></div></div>
                         </div>
                    </div>
                );
            })}
            {projectilesRef.current.map(proj => (
                <div key={proj.id} className="absolute w-4 h-4 bg-cyan-400 rounded-full blur-[2px] shadow-[0_0_10px_cyan]"
                     style={{ top: `${(proj.row / Constants.GRID_ROWS) * 100 + 10}%`, left: `${proj.x}%`, transition: 'none' }} />
            ))}
            {particlesRef.current.map(p => (
                <div key={p.id} className="absolute pointer-events-none" style={{ left: `${p.x}%`, top: `${p.y}%`, opacity: p.life / 1000 }}>
                     {p.type === 'TEXT' ? (<span className="font-black text-lg drop-shadow-md" style={{ color: p.color }}>{p.text}</span>) : (<div className="w-4 h-4 rounded-full animate-ping" style={{ backgroundColor: p.color }}></div>)}
                </div>
            ))}
        </div>

        {/* OVERLAYS */}
        {isPaused && !showVictory && !showDefeat && (<div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center"><h1 className="text-4xl font-black text-white tracking-widest uppercase drop-shadow-xl animate-pulse">Pausado</h1></div>)}
        {showVictory && (
            <div className="absolute inset-0 bg-blue-900/90 z-[60] flex flex-col items-center justify-center animate-fade-in p-8 text-center">
                <PartyPopper size={64} className="text-yellow-400 mb-4 animate-bounce" />
                <h2 className="text-4xl md:text-5xl font-black text-white mb-2 text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600">VITÓRIA!</h2>
                <div className="flex gap-4 mt-8">
                    <button onClick={onBackToMenu} className="px-6 py-4 bg-slate-700 rounded-2xl font-bold text-white border-b-4 border-slate-900 active:border-b-0 active:translate-y-1">Menu</button>
                    <button onClick={() => { onLevelComplete(lives, Constants.INITIAL_LIVES); onNextLevel(); }} className="px-6 py-4 bg-green-500 rounded-2xl font-bold text-white border-b-4 border-green-700 active:border-b-0 active:translate-y-1 animate-pulse">Próxima</button>
                </div>
            </div>
        )}
        {showDefeat && (
            <div className="absolute inset-0 bg-red-900/90 z-[60] flex flex-col items-center justify-center animate-fade-in p-8 text-center">
                <Skull size={64} className="text-slate-200 mb-4 animate-pulse" />
                <h2 className="text-4xl md:text-5xl font-black text-white mb-2">DERROTA</h2>
                <div className="flex gap-4 mt-8">
                    <button onClick={onBackToMenu} className="px-6 py-4 bg-slate-700 rounded-2xl font-bold text-white border-b-4 border-slate-900 active:border-b-0 active:translate-y-1">Sair</button>
                    <button onClick={startGame} className="px-6 py-4 bg-yellow-500 rounded-2xl font-bold text-black border-b-4 border-yellow-700 active:border-b-0 active:translate-y-1">Tentar Novamente</button>
                </div>
            </div>
        )}
      </div>

      {/* --- FOOTER CONTROLS COM SCROLL SUAVE PARA MOBILE --- */}
      <div className="h-24 md:h-28 bg-slate-800 border-t-4 border-slate-700 shrink-0 z-40 flex items-center px-2 md:px-4 space-x-2 overflow-x-auto custom-scrollbar safe-area-pb">
           <button 
               onClick={() => { setIsRemoving(!isRemoving); playSound('SELECT'); }}
               className={`h-20 w-20 shrink-0 rounded-2xl border-b-4 flex flex-col items-center justify-center transition-all ${isRemoving ? 'bg-red-500 border-red-700 text-white translate-y-1 border-b-0' : 'bg-slate-700 border-slate-900 text-slate-400'}`}
           >
               <Trash2 size={24} className="mb-1" />
               <span className="text-[10px] font-bold uppercase">Vender</span>
           </button>
           <div className="w-[1px] h-16 bg-slate-600 mx-2"></div>
           {(Object.keys(Constants.TOWER_TYPES) as TowerType[]).map((type) => {
               const conf = Constants.TOWER_TYPES[type];
               const isSelected = selectedTowerType === type && !isRemoving;
               const canAfford = energy >= conf.cost;
               return (
                   <button 
                       key={type}
                       onClick={() => { setSelectedTowerType(type); setIsRemoving(false); playSound('SELECT'); }}
                       className={`
                           relative group h-20 w-24 shrink-0 rounded-2xl border-b-4 flex flex-col items-center justify-center transition-all
                           ${isSelected ? 'bg-blue-600 border-blue-800 ring-2 ring-yellow-400 ring-offset-2 ring-offset-slate-800 translate-y-1 border-b-0' : (canAfford ? 'bg-slate-700 border-slate-900' : 'bg-slate-800 border-slate-900 opacity-50')}
                       `}
                   >
                       <div className="absolute top-1 right-1 flex items-center bg-black/50 px-1.5 rounded text-[10px] font-bold text-yellow-400"><Zap size={10} className="mr-0.5 fill-yellow-400"/> {conf.cost}</div>
                       <img src={conf.image} className="w-10 h-10 object-contain drop-shadow-sm mb-1" />
                       <span className={`text-[10px] font-bold uppercase leading-none ${isSelected ? 'text-white' : 'text-slate-400'}`}>{conf.name.split(' ')[0]}</span>
                   </button>
               );
           })}
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 4px; }
        @keyframes popIn { 0% { transform: scale(0); } 80% { transform: scale(1.1); } 100% { transform: scale(1); } }
      `}</style>
    </div>
  );
};