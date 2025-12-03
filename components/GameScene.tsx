import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Zap, Heart, Pause, ArrowLeft, Trash2, Shield, Play, RotateCcw, PartyPopper, Skull, XCircle } from 'lucide-react';
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
  const audioContextRef = useRef<AudioContext | null>(null);

  // --- INITIALIZATION ---
  useEffect(() => {
    startGame();
    return () => cancelAnimationFrame(requestRef.current);
  }, [levelId]);

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
  };

  // --- AUDIO SYSTEM ---
  const initAudio = () => {
    if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume().catch(() => {});
    }
    return audioContextRef.current;
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
          case 'SHOOT':
              osc.type = 'triangle';
              osc.frequency.setValueAtTime(400, t);
              osc.frequency.exponentialRampToValueAtTime(200, t + 0.1);
              gain.gain.setValueAtTime(0.1, t);
              gain.gain.linearRampToValueAtTime(0, t + 0.1);
              osc.start(t); osc.stop(t + 0.1);
              break;
          case 'HIT':
              osc.type = 'square';
              osc.frequency.setValueAtTime(150, t);
              osc.frequency.exponentialRampToValueAtTime(100, t + 0.05);
              gain.gain.setValueAtTime(0.05, t);
              gain.gain.linearRampToValueAtTime(0, t + 0.05);
              osc.start(t); osc.stop(t + 0.05);
              break;
          case 'BUILD':
              osc.type = 'sine';
              osc.frequency.setValueAtTime(300, t);
              osc.frequency.exponentialRampToValueAtTime(600, t + 0.2);
              gain.gain.setValueAtTime(0.1, t);
              gain.gain.linearRampToValueAtTime(0, t + 0.2);
              osc.start(t); osc.stop(t + 0.2);
              break;
          case 'SELECT':
              osc.type = 'sine';
              osc.frequency.setValueAtTime(600, t);
              osc.frequency.exponentialRampToValueAtTime(800, t + 0.1);
              gain.gain.setValueAtTime(0.05, t);
              gain.gain.linearRampToValueAtTime(0, t + 0.1);
              osc.start(t); osc.stop(t + 0.1);
              break;
          case 'ERROR':
              osc.type = 'sawtooth';
              osc.frequency.setValueAtTime(150, t);
              osc.frequency.exponentialRampToValueAtTime(100, t + 0.2);
              gain.gain.setValueAtTime(0.1, t);
              gain.gain.linearRampToValueAtTime(0, t + 0.2);
              osc.start(t); osc.stop(t + 0.2);
              break;
          case 'VICTORY':
              // Simple Arpeggio
              [400, 500, 600, 800].forEach((freq, i) => {
                  const o = ctx.createOscillator();
                  const g = ctx.createGain();
                  o.connect(g); g.connect(ctx.destination);
                  o.frequency.value = freq;
                  g.gain.setValueAtTime(0.1, t + i*0.1);
                  g.gain.linearRampToValueAtTime(0, t + i*0.1 + 0.2);
                  o.start(t + i*0.1); o.stop(t + i*0.1 + 0.2);
              });
              break;
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
        
        // Trigger Render
        setRenderTrigger(prev => prev + 1);
        
        requestRef.current = requestAnimationFrame(loop);
    } catch (e) {
        console.error("Loop Error", e);
    }
  }, [status, isPaused]);

  const updateGameLogic = (dt: number, time: number) => {
      // 1. Passive Energy
      if (time - lastEnergyTickRef.current > Constants.PASSIVE_ENERGY_TICK_MS) {
          setEnergy(e => Math.min(e + Constants.PASSIVE_ENERGY_AMOUNT, 9999));
          lastEnergyTickRef.current = time;
      }

      // 2. Spawn Ghosts
      spawnTimerRef.current += dt;
      let spawnRate = Constants.GHOST_SPAWN_RATE_MS / (1 + (levelId * 0.2)); // Harder levels spawn faster
      if (spawnTimerRef.current > spawnRate && ghostsRef.current.length < 50 && ghostsDefeated < Constants.TOTAL_GHOSTS_TO_WIN) {
          spawnGhost();
          spawnTimerRef.current = 0;
      }

      // 3. Update Towers (Shooting & Energy)
      towersRef.current.forEach(tower => {
          const stats = Constants.getTowerStats(tower.type, tower.level);
          
          if (tower.type === 'ENERGY') {
              if (time - tower.lastActionTime > stats.cooldown) {
                  setEnergy(prev => prev + (stats.production || 5));
                  spawnParticle(tower.col * Constants.CELL_WIDTH_PERCENT + 5, (tower.row * 20) + 5, 'TEXT', `+${stats.production}`, '#fbbf24');
                  tower.lastActionTime = time;
              }
          } else if (tower.type === 'ROBOT') {
              // Robot Logic handled in collision
          } else {
              // SHOOTERS
              if (time - tower.lastActionTime > stats.cooldown) {
                  // Find target in row
                  const target = ghostsRef.current
                      .filter(g => g.row === tower.row && g.x > (tower.col * Constants.CELL_WIDTH_PERCENT))
                      .sort((a, b) => a.x - b.x)[0]; // Closest one
                  
                  // Check range
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

      // 4. Move Projectiles
      projectilesRef.current.forEach(p => {
          p.x += p.speed * (dt / 16);
      });
      // Remove off-screen
      projectilesRef.current = projectilesRef.current.filter(p => p.x < 105);

      // 5. Move Ghosts
      ghostsRef.current.forEach(g => {
          // Check for Robot collision
          const robotInCell = towersRef.current.find(t => t.type === 'ROBOT' && t.row === g.row && Math.abs((t.col * Constants.CELL_WIDTH_PERCENT) - g.x) < 5);
          
          let moveSpeed = g.speed;
          if (robotInCell) {
              moveSpeed = 0; // Blocked by robot
              // Robot deals damage to ghost (thorns)
              if (Math.random() > 0.95) {
                   g.hp -= 0.5;
                   spawnParticle(g.x, (g.row * 20) + 10, 'CIRCLE', '', '#ef4444');
              }
              // Ghost deals damage to robot
              if (Math.random() > 0.98) {
                   robotInCell.hp -= 2;
                   if (robotInCell.hp <= 0) {
                       towersRef.current = towersRef.current.filter(t => t.id !== robotInCell.id);
                       spawnParticle(robotInCell.col * Constants.CELL_WIDTH_PERCENT, robotInCell.row * 20, 'RING', '', '#94a3b8');
                   }
              }
          }

          if (!g.isFrozen) {
              g.x -= moveSpeed * (dt / 16);
          } else {
               // Unfreeze chance or timer could go here
               if (Math.random() > 0.99) g.isFrozen = false;
          }
      });

      // 6. Projectile Collisions
      projectilesRef.current.forEach(p => {
          const hitGhost = ghostsRef.current.find(g => 
              g.row === p.row && 
              Math.abs(g.x - p.x) < Constants.PROJECTILE_HITBOX_W
          );

          if (hitGhost) {
              hitGhost.hp -= p.damage;
              hitGhost.x += p.knockback; // Knockback
              p.x = 200; // Mark for removal
              spawnParticle(hitGhost.x, (hitGhost.row * 20) + 10, 'CIRCLE', '', '#60a5fa');
              playSound('HIT');

              if (hitGhost.hp <= 0) {
                 handleGhostDeath(hitGhost);
              }
          }
      });
      projectilesRef.current = projectilesRef.current.filter(p => p.x < 150);

      // 7. Base Collision (Game Over check)
      const leaked = ghostsRef.current.filter(g => g.x <= 0);
      if (leaked.length > 0) {
          setLives(prev => {
              const newLives = prev - leaked.length;
              if (newLives <= 0) handleDefeat();
              return newLives;
          });
          playSound('ERROR');
          // Remove leaked ghosts
          ghostsRef.current = ghostsRef.current.filter(g => g.x > 0);
      }

      // 8. Particles
      particlesRef.current.forEach(p => {
          p.life -= dt;
          p.x += (p.vx || 0);
          p.y += (p.vy || 0);
      });
      particlesRef.current = particlesRef.current.filter(p => p.life > 0);

      // 9. Win Condition
      if (ghostsDefeated >= Constants.TOTAL_GHOSTS_TO_WIN && ghostsRef.current.length === 0) {
          handleVictory();
      }
  };

  // --- ACTIONS ---

  const spawnGhost = () => {
      const row = Math.floor(Math.random() * Constants.GRID_ROWS);
      // Diffculty scaling
      const types: GhostType['type'][] = ['TRAVESSO', 'MEDROSO', 'SONOLENTO', 'POEIRA'];
      // Unlock harder ghosts based on level
      const maxIndex = Math.min(types.length - 1, Math.max(0, levelId - 1)); 
      const typeKey = types[Math.floor(Math.random() * (maxIndex + 1))];
      const config = Constants.GHOST_VARIANTS[typeKey];

      ghostsRef.current.push({
          id: Math.random().toString(36),
          row,
          x: 100,
          type: typeKey as any,
          speed: config.speed * (1 + (levelId * 0.1)),
          hp: config.hp * (1 + (levelId * 0.1)),
          maxHp: config.hp * (1 + (levelId * 0.1)),
      });
  };

  const fireProjectile = (tower: Tower, damage: number, knockback: number) => {
      const type = tower.type === 'MEGA' ? 'BEAM' : (tower.type === 'TURBO' ? 'WIND' : 'PLASMA');
      projectilesRef.current.push({
          id: Math.random().toString(),
          type,
          row: tower.row,
          x: (tower.col * Constants.CELL_WIDTH_PERCENT) + 5,
          speed: 1.0, // Projectile speed
          damage,
          knockback
      });
      playSound('SHOOT');
  };

  const spawnParticle = (x: number, y: number, type: 'CIRCLE'|'RING'|'TEXT', text: string, color: string) => {
      particlesRef.current.push({
          id: Math.random().toString(),
          x,
          y,
          color,
          life: 1000,
          type,
          text,
          vx: (Math.random() - 0.5) * 0.1,
          vy: -0.1 // Float up
      });
  };

  const handleGhostDeath = (ghost: GhostType) => {
      setEnergy(prev => prev + Constants.ENERGY_PER_KILL);
      setGhostsDefeated(prev => prev + 1);
      spawnParticle(ghost.x, (ghost.row * 20) + 10, 'TEXT', `+${Constants.ENERGY_PER_KILL}`, '#fbbf24');
      // Remove ghost
      ghostsRef.current = ghostsRef.current.filter(g => g.id !== ghost.id);
  };

  const handleVictory = () => {
      if (status === 'VICTORY') return;
      setStatus('VICTORY');
      setShowVictory(true);
      playSound('VICTORY');
  };

  const handleDefeat = () => {
      if (status === 'DEFEAT') return;
      setStatus('DEFEAT');
      setShowDefeat(true);
  };

  const handleGridClick = (r: number, c: number) => {
      if (status !== 'PLAYING' || isPaused) return;

      const existingTower = towersRef.current.find(t => t.row === r && t.col === c);

      if (isRemoving) {
          if (existingTower) {
              towersRef.current = towersRef.current.filter(t => t.id !== existingTower.id);
              spawnParticle(c * Constants.CELL_WIDTH_PERCENT + 5, r * 20 + 5, 'RING', '', '#ef4444');
              setEnergy(prev => prev + Math.floor(Constants.TOWER_TYPES[existingTower.type].cost * 0.5)); // Refund 50%
              playSound('BUILD');
              setIsRemoving(false);
          }
          return;
      }

      if (existingTower) {
          // Select existing? For now just beep
          return;
      }

      const towerConfig = Constants.TOWER_TYPES[selectedTowerType];
      if (energy >= towerConfig.cost) {
          const level = upgradeLevels[selectedTowerType];
          const stats = Constants.getTowerStats(selectedTowerType, level);

          towersRef.current.push({
              id: Math.random().toString(),
              row: r,
              col: c,
              type: selectedTowerType,
              lastActionTime: lastTimeRef.current,
              hp: stats.maxHp || 100,
              maxHp: stats.maxHp || 100,
              level: level,
              offset: 0
          });
          setEnergy(prev => prev - towerConfig.cost);
          playSound('BUILD');
          spawnParticle(c * Constants.CELL_WIDTH_PERCENT + 5, r * 20 + 5, 'RING', '', '#fff');
      } else {
          playSound('ERROR');
          spawnParticle(c * Constants.CELL_WIDTH_PERCENT + 5, r * 20 + 5, 'TEXT', 'Sem Energia!', '#ef4444');
      }
  };

  // --- RENDER HELPERS ---
  const getBackgroundStyle = () => {
      const bgImage = Constants.getLevelBackground(levelId);
      const isCustomBg = equippedItems.BACKGROUND === 11;
      return { 
          backgroundImage: `url(${isCustomBg ? Constants.BG_LEVEL_4 : bgImage})`, // Example override
          backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat'
      };
  };

  return (
    <div className={`w-full h-full relative select-none flex flex-col font-sans overflow-hidden`} style={getBackgroundStyle()} onClick={initAudio}>
      
      {/* --- HUD HEADER --- */}
      <div className="h-16 flex items-center justify-between px-4 z-30 border-b shrink-0 bg-slate-900/90 border-slate-700 text-white shadow-lg">
        <div className="flex items-center space-x-6">
          <button onClick={onBackToMenu} className="p-2 rounded-full hover:bg-slate-700 transition-colors border border-slate-600">
              <ArrowLeft size={20} />
          </button>
          
          <div className="flex items-center bg-slate-800 px-3 py-1 rounded-lg border border-slate-600">
            <Zap className="mr-2 text-yellow-400 fill-yellow-400" size={20} />
            <span className="font-mono font-bold text-xl text-yellow-100">{Math.floor(energy)}</span>
          </div>

          <div className="flex items-center bg-slate-800 px-3 py-1 rounded-lg border border-slate-600">
            <Heart className="mr-2 text-red-500 fill-red-500" size={20} />
            <span className="font-mono font-bold text-xl text-red-100">{lives}</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Fantasmas: <span className="text-white text-base ml-1">{ghostsDefeated} / {Constants.TOTAL_GHOSTS_TO_WIN}</span>
            </div>
            
            <button 
                onClick={() => setIsPaused(!isPaused)}
                className={`p-2 rounded-full ${isPaused ? 'bg-yellow-500 text-black animate-pulse' : 'bg-slate-700 text-white'} border border-slate-500`}
            >
                {isPaused ? <Play size={20} fill="currentColor"/> : <Pause size={20} fill="currentColor"/>}
            </button>
        </div>
      </div>

      {/* --- GAME BOARD --- */}
      <div className="flex-1 relative overflow-hidden cursor-crosshair">
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
                    className={`w-full h-full border-r border-b border-white/5 ${isDark ? 'bg-black/10' : 'bg-transparent'} hover:bg-white/20 transition-colors relative`}
                 >
                     {/* Debug or Selection Highlight could go here */}
                 </div>
             );
          })}
        </div>

        {/* ENTITY LAYER */}
        <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
            {/* 1. TOWERS */}
            {towersRef.current.map(tower => {
                const conf = Constants.TOWER_TYPES[tower.type];
                const skinFilter = equippedItems.SKINS === 1 ? 'hue-rotate(180deg) brightness(1.5)' : (equippedItems.SKINS === 2 ? 'grayscale(100%) contrast(1.2)' : 'none');
                
                return (
                    <div key={tower.id} className="absolute transition-all duration-200"
                         style={{ 
                             top: `${(tower.row / Constants.GRID_ROWS) * 100}%`, 
                             left: `${(tower.col * Constants.CELL_WIDTH_PERCENT)}%`,
                             width: `${Constants.CELL_WIDTH_PERCENT}%`,
                             height: `${100 / Constants.GRID_ROWS}%`,
                             padding: '4px'
                         }}>
                        <div className="w-full h-full relative flex items-center justify-center animate-[popIn_0.3s_ease-out]">
                             <img src={conf.image} alt={conf.name} className="w-full h-full object-contain drop-shadow-md" style={{ filter: skinFilter }} />
                             
                             {/* Level Badge */}
                             <div className="absolute -top-1 -right-1 bg-slate-800 text-[10px] text-white w-4 h-4 rounded-full flex items-center justify-center border border-white">
                                {tower.level}
                             </div>
                             
                             {/* HP Bar for Robots */}
                             {tower.type === 'ROBOT' && (
                                 <div className="absolute bottom-0 w-full h-1 bg-red-900 rounded-full overflow-hidden">
                                     <div className="h-full bg-green-500" style={{ width: `${(tower.hp / tower.maxHp) * 100}%` }}></div>
                                 </div>
                             )}
                        </div>
                    </div>
                );
            })}

            {/* 2. GHOSTS */}
            {ghostsRef.current.map(ghost => {
                const conf = Constants.GHOST_VARIANTS[ghost.type];
                const isFlipped = true; // Ghosts face left usually
                
                return (
                    <div key={ghost.id} className="absolute transition-transform will-change-transform"
                         style={{
                             top: `${(ghost.row / Constants.GRID_ROWS) * 100}%`,
                             left: `${ghost.x}%`,
                             width: `${Constants.CELL_WIDTH_PERCENT}%`,
                             height: `${100 / Constants.GRID_ROWS}%`,
                             transform: `translateX(-50%) ${isFlipped ? 'scaleX(1)' : 'scaleX(-1)'}`, // Adjust facing
                         }}>
                         <div className="w-full h-full relative p-2">
                             <img src={conf.image} className="w-full h-full object-contain drop-shadow-lg opacity-90" />
                             {/* HP Bar */}
                             <div className="absolute top-1 left-2 right-2 h-1 bg-black/50 rounded-full overflow-hidden">
                                 <div className="h-full bg-purple-500" style={{ width: `${(ghost.hp / ghost.maxHp) * 100}%` }}></div>
                             </div>
                         </div>
                    </div>
                );
            })}

            {/* 3. PROJECTILES */}
            {projectilesRef.current.map(proj => (
                <div key={proj.id} className="absolute w-4 h-4 bg-cyan-400 rounded-full blur-[2px] shadow-[0_0_10px_cyan]"
                     style={{
                         top: `${(proj.row / Constants.GRID_ROWS) * 100 + 10}%`, // Centered in row roughly
                         left: `${proj.x}%`,
                         transition: 'none'
                     }}
                />
            ))}

            {/* 4. PARTICLES */}
            {particlesRef.current.map(p => (
                <div key={p.id} className="absolute pointer-events-none"
                     style={{ left: `${p.x}%`, top: `${p.y}%`, opacity: p.life / 1000 }}>
                     {p.type === 'TEXT' ? (
                         <span className="font-black text-lg drop-shadow-md" style={{ color: p.color }}>{p.text}</span>
                     ) : (
                         <div className="w-4 h-4 rounded-full animate-ping" style={{ backgroundColor: p.color }}></div>
                     )}
                </div>
            ))}
        </div>

        {/* PAUSE OVERLAY */}
        {isPaused && !showVictory && !showDefeat && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
                <h1 className="text-4xl font-black text-white tracking-widest uppercase drop-shadow-xl animate-pulse">Pausado</h1>
            </div>
        )}

        {/* VICTORY OVERLAY */}
        {showVictory && (
            <div className="absolute inset-0 bg-blue-900/90 z-[60] flex flex-col items-center justify-center animate-fade-in p-8 text-center">
                <PartyPopper size={64} className="text-yellow-400 mb-4 animate-bounce" />
                <h2 className="text-5xl font-black text-white mb-2 text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600">VITÓRIA!</h2>
                <p className="text-blue-200 text-lg mb-8 font-bold">Casa limpa com sucesso!</p>
                <div className="flex gap-4">
                    <button onClick={onBackToMenu} className="px-8 py-3 bg-slate-700 rounded-2xl font-bold text-white border-b-4 border-slate-900 active:border-b-0 active:translate-y-1">Menu</button>
                    <button onClick={() => { onLevelComplete(lives, Constants.INITIAL_LIVES); onNextLevel(); }} className="px-8 py-3 bg-green-500 rounded-2xl font-bold text-white border-b-4 border-green-700 active:border-b-0 active:translate-y-1 animate-pulse">Próxima Fase</button>
                </div>
            </div>
        )}

        {/* DEFEAT OVERLAY */}
        {showDefeat && (
            <div className="absolute inset-0 bg-red-900/90 z-[60] flex flex-col items-center justify-center animate-fade-in p-8 text-center">
                <Skull size={64} className="text-slate-200 mb-4 animate-pulse" />
                <h2 className="text-5xl font-black text-white mb-2">DERROTA</h2>
                <p className="text-red-200 text-lg mb-8 font-bold">Os fantasmas dominaram tudo...</p>
                <div className="flex gap-4">
                    <button onClick={onBackToMenu} className="px-8 py-3 bg-slate-700 rounded-2xl font-bold text-white border-b-4 border-slate-900 active:border-b-0 active:translate-y-1">Desistir</button>
                    <button onClick={startGame} className="px-8 py-3 bg-yellow-500 rounded-2xl font-bold text-black border-b-4 border-yellow-700 active:border-b-0 active:translate-y-1">Tentar Novamente</button>
                </div>
            </div>
        )}
      </div>

      {/* --- FOOTER CONTROLS --- */}
      <div className="h-28 bg-slate-800 border-t-4 border-slate-700 shrink-0 z-40 flex items-center px-4 space-x-2 overflow-x-auto custom-scrollbar">
           
           {/* Remove Tool */}
           <button 
               onClick={() => { setIsRemoving(!isRemoving); playSound('SELECT'); }}
               className={`h-20 w-20 shrink-0 rounded-2xl border-b-4 flex flex-col items-center justify-center transition-all ${isRemoving ? 'bg-red-500 border-red-700 text-white translate-y-1 border-b-0' : 'bg-slate-700 border-slate-900 text-slate-400 hover:bg-slate-600'}`}
           >
               <Trash2 size={24} className="mb-1" />
               <span className="text-[10px] font-bold uppercase">Vender</span>
           </button>

           <div className="w-[1px] h-16 bg-slate-600 mx-2"></div>

           {/* Tower Cards */}
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
                           ${isSelected 
                               ? 'bg-blue-600 border-blue-800 ring-2 ring-yellow-400 ring-offset-2 ring-offset-slate-800 translate-y-1 border-b-0' 
                               : (canAfford ? 'bg-slate-700 border-slate-900 hover:bg-slate-600' : 'bg-slate-800 border-slate-900 opacity-50 cursor-not-allowed')}
                       `}
                   >
                       <div className="absolute top-1 right-1 flex items-center bg-black/50 px-1.5 rounded text-[10px] font-bold text-yellow-400">
                           <Zap size={10} className="mr-0.5 fill-yellow-400"/> {conf.cost}
                       </div>
                       
                       <img src={conf.image} className="w-10 h-10 object-contain drop-shadow-sm mb-1" />
                       <span className={`text-[10px] font-bold uppercase leading-none ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                           {conf.name.split(' ')[0]}
                       </span>
                   </button>
               );
           })}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 4px; }
        @keyframes popIn { 0% { transform: scale(0); } 80% { transform: scale(1.1); } 100% { transform: scale(1); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
};