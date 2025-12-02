
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CheckCircle, Zap, Heart, RefreshCw, XCircle, Wind, Target, Play, Pause, ArrowLeft, Music, Trash2, ArrowRight } from 'lucide-react';
import { GameStatus, Ghost as GhostType, Tower, Projectile, Particle, TowerType, GhostType as GhostVariant, UpgradeState, EquippedItems } from '../types';
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
  const [selectedTowerType, setSelectedTowerType] = useState<TowerType>('BASIC'); // Tipo selecionado para construir
  const [selectedTowerId, setSelectedTowerId] = useState<string | null>(null); // Torre selecionada no tabuleiro
  const [isRemoving, setIsRemoving] = useState(false); // NOVO: Modo de Remoção Ativo
  const [errorCell, setErrorCell] = useState<{r: number, c: number} | null>(null);
  const [coinsEarned, setCoinsEarned] = useState<number>(0);
  const [hasClaimedReward, setHasClaimedReward] = useState(false);
  
  const [isPaused, setIsPaused] = useState(false); 
  
  // Entities - Using State for Render, but we will manage them synchronously in loop
  const [towers, setTowers] = useState<Tower[]>([]);
  const [ghosts, setGhosts] = useState<GhostType[]>([]);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);

  // Refs for loop optimization & logic tracking
  const lastTimeRef = useRef<number>(0);
  const spawnTimerRef = useRef<number>(0);
  const energyTimerRef = useRef<number>(0);
  const ghostsSpawnedCountRef = useRef<number>(0);
  const requestRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);

  // --- MUSIC REFS ---
  const musicRef = useRef<{ isPlaying: boolean; nextNoteTime: number; step: number; timerId: number | null }>({ 
      isPlaying: false, nextNoteTime: 0, step: 0, timerId: null 
  });

  // --- HELPER: Visual Customization ---
  const getTowerStyle = (type: TowerType) => {
      const skinId = equippedItems.SKINS;
      let filter = '';
      let colorClass = Constants.TOWER_TYPES[type].color;

      if (skinId === 1) { // Neon
          filter = 'drop-shadow(0 0 5px cyan) hue-rotate(180deg) brightness(1.5)';
      } else if (skinId === 2) { // Chrome
          filter = 'grayscale(100%) contrast(150%) brightness(120%) drop-shadow(0 2px 2px rgba(0,0,0,0.5))';
      } else if (skinId === 3) { // Robot Rainbow
          filter = 'hue-rotate(0deg)'; 
      }
      return { filter, colorClass };
  };

  const getParticleColorForGhost = () => {
      return equippedItems.EFEITOS === 6 ? '#FBBF24' : '#A855F7';
  };

  // --- Core Game Functions ---

  const initAudio = () => {
    if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume().catch(e => console.error("Audio resume failed", e));
    }
  };

  // --- MUSIC GENERATION (PROCEDURAL) ---
  useEffect(() => {
      // Toggle Music based on game status
      const shouldPlay = status === 'PLAYING' && !isPaused;
      
      if (shouldPlay && !musicRef.current.isPlaying) {
          startMusic();
      } else if (!shouldPlay && musicRef.current.isPlaying) {
          stopMusic();
      }
      
      return () => stopMusic();
  }, [status, isPaused]);

  const startMusic = () => {
      if (!audioContextRef.current) initAudio();
      const ctx = audioContextRef.current;
      if (!ctx) return;

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
      const ctx = audioContextRef.current;
      if (!ctx) return;

      // Lookahead: 0.1s
      while (musicRef.current.nextNoteTime < ctx.currentTime + 0.1) {
          playMusicStep(musicRef.current.step, musicRef.current.nextNoteTime);
          musicRef.current.step = (musicRef.current.step + 1) % 32; // 32 step loop (4 bars of 8th notes)
          musicRef.current.nextNoteTime += 0.20; // Tempo: ~150 BPM (0.2s per 8th note)
      }
      musicRef.current.timerId = window.setTimeout(scheduler, 25);
  };

  const playMusicStep = (step: number, time: number) => {
      const ctx = audioContextRef.current;
      if (!ctx) return;

      const playTone = (freq: number, type: 'sine'|'triangle'|'square', vol: number, dur: number) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = type;
          osc.frequency.value = freq;
          osc.connect(gain);
          gain.connect(ctx.destination);
          gain.gain.setValueAtTime(vol, time);
          gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
          osc.start(time);
          osc.stop(time + dur);
      };

      const playNoise = (vol: number, dur: number) => {
          const osc = ctx.createOscillator(); // Approximate noise with random freq square
          const gain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(Math.random() * 500 + 200, time);
          osc.connect(gain);
          gain.connect(ctx.destination);
          gain.gain.setValueAtTime(vol * 0.3, time);
          gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
          osc.start(time);
          osc.stop(time + dur);
      };

      // MELODY (Playful Sine/Xylophone) - C Major
      const melody: {[key: number]: number} = {
          0: 523.25, 2: 659.25, 4: 783.99, 6: 880.00, // C E G A
          8: 783.99, 10: 659.25, 12: 523.25, // G E C
          16: 698.46, 18: 880.00, 20: 1046.50, 22: 880.00, // F A C A
          24: 783.99, 26: 659.25, 28: 523.25, 30: 392.00 // G E C G
      };
      if (melody[step]) playTone(melody[step], 'sine', 0.05, 0.3);

      // BASS (Ukulele/Pluck)
      const bass: {[key: number]: number} = {
          0: 261.63, 8: 196.00, 16: 349.23, 24: 196.00 // C G F G
      };
      if (bass[step]) playTone(bass[step], 'triangle', 0.06, 0.4);

      // DRUMS (Soft Percussion)
      if (step % 4 === 0) playNoise(0.02, 0.05); // Light Hi-hat
      if (step % 8 === 0) playTone(150, 'square', 0.03, 0.08); // Light Kick
      if (step % 16 === 8) playNoise(0.04, 0.1); // Light Snare/Clap
  };

  // --- UPDATED SOUND EFFECTS SYSTEM ---
  const playSound = (type: string) => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const t = ctx.currentTime;
    
    // Master Gain for SFX to prevent clipping
    const masterGain = ctx.createGain();
    masterGain.gain.value = 0.25;
    masterGain.connect(ctx.destination);

    try {
        if (type === 'BASIC_ATK') {
            // Light suction "whoop"
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(300, t);
            osc.frequency.exponentialRampToValueAtTime(800, t + 0.1);
            
            g.gain.setValueAtTime(0.5, t);
            g.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
            
            osc.connect(g);
            g.connect(masterGain);
            osc.start(t);
            osc.stop(t + 0.15);
        }
        else if (type === 'TURBO_ATK') {
            // "Foom!" Soft air ripple
            const bufferSize = ctx.sampleRate * 0.3;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for(let i=0; i<bufferSize; i++) data[i] = Math.random() * 2 - 1;

            const noise = ctx.createBufferSource();
            noise.buffer = buffer;

            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(300, t);
            filter.frequency.linearRampToValueAtTime(800, t + 0.1); // Gentle opening

            const nGain = ctx.createGain();
            nGain.gain.setValueAtTime(0.3, t);
            nGain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

            noise.connect(filter);
            filter.connect(nGain);
            nGain.connect(masterGain);
            noise.start(t);
        }
        else if (type === 'ENERGY_SPAWN') {
             // "Ping!" Sharp twinkle
             const osc = ctx.createOscillator();
             const g = ctx.createGain();
             osc.type = 'sine';
             osc.frequency.setValueAtTime(1200, t); // Higher pitch for sparkle
             
             g.gain.setValueAtTime(0, t);
             g.gain.linearRampToValueAtTime(0.15, t + 0.02);
             g.gain.exponentialRampToValueAtTime(0.001, t + 0.5); // Long decay
             
             osc.connect(g);
             g.connect(masterGain);
             osc.start(t);
             osc.stop(t + 0.5);
             
             // Sparkle Trail (Quick Arpeggio)
             const osc2 = ctx.createOscillator();
             const g2 = ctx.createGain();
             osc2.type = 'sine';
             osc2.frequency.setValueAtTime(1800, t + 0.1);
             g2.gain.setValueAtTime(0.05, t + 0.1);
             g2.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
             osc2.connect(g2);
             g2.connect(masterGain);
             osc2.start(t + 0.1); osc2.stop(t + 0.2);
        }
        else if (type === 'MEGA') {
             // Deep Vortex Charge
             const osc = ctx.createOscillator();
             const g = ctx.createGain();
             const lfo = ctx.createOscillator();
             const lfoGain = ctx.createGain();

             osc.type = 'sawtooth';
             osc.frequency.setValueAtTime(100, t);
             osc.frequency.linearRampToValueAtTime(50, t + 0.4); // Pitch down like suction

             lfo.frequency.value = 20; // Fast rumble
             lfoGain.gain.value = 20;
             lfo.connect(lfoGain);
             lfoGain.connect(osc.frequency);

             g.gain.setValueAtTime(0.15, t);
             g.gain.linearRampToValueAtTime(0, t + 0.4);
             
             osc.connect(g);
             g.connect(masterGain);
             osc.start(t); osc.stop(t+0.4);
             lfo.start(t); lfo.stop(t+0.4);
        }
        else if (type === 'ROBOT_HIT') {
             const osc = ctx.createOscillator();
             const g = ctx.createGain();
             osc.type = 'triangle';
             osc.frequency.setValueAtTime(200, t);
             osc.frequency.linearRampToValueAtTime(50, t + 0.2);
             
             g.gain.setValueAtTime(0.2, t);
             g.gain.linearRampToValueAtTime(0, t+0.2);
             osc.connect(g);
             g.connect(masterGain);
             osc.start(t);
             osc.stop(t+0.2);
        }
        // --- DEATH SOUNDS ---
        else if (type === 'DEATH_TRAVESSO') { // "Pwee!" Giggle Pop
             const osc = ctx.createOscillator();
             const g = ctx.createGain();
             osc.type = 'sine';
             // Pitch sweep Up then Down
             osc.frequency.setValueAtTime(400, t);
             osc.frequency.linearRampToValueAtTime(600, t + 0.1);
             osc.frequency.linearRampToValueAtTime(300, t + 0.2);
             
             g.gain.setValueAtTime(0.2, t);
             g.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
             
             osc.connect(g);
             g.connect(masterGain);
             osc.start(t); osc.stop(t+0.25);
        }
        else if (type === 'DEATH_MEDROSO') { // "Shaky Sigh"
             // Breath noise
             const bufferSize = ctx.sampleRate * 0.4;
             const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
             const data = buffer.getChannelData(0);
             for(let i=0; i<bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
             
             const noise = ctx.createBufferSource();
             noise.buffer = buffer;
             const nGain = ctx.createGain();
             
             // Tremolo (Shaky)
             const lfo = ctx.createOscillator();
             const lfoGain = ctx.createGain();
             lfo.frequency.value = 15; // Fast shake
             lfoGain.gain.value = 0.5;
             lfo.connect(lfoGain);
             lfoGain.connect(nGain.gain);

             const filter = ctx.createBiquadFilter();
             filter.type = 'highpass';
             filter.frequency.value = 800; // Airy sound
             
             nGain.gain.setValueAtTime(0.25, t);
             nGain.gain.exponentialRampToValueAtTime(0.01, t+0.4);
             
             noise.connect(filter);
             filter.connect(nGain);
             nGain.connect(masterGain);
             
             noise.start(t);
             lfo.start(t); lfo.stop(t+0.4);
        }
        else if (type === 'DEATH_SONOLENTO') { // "Sleep Pop"
             // Bubble Pop
             const osc = ctx.createOscillator();
             const g = ctx.createGain();
             osc.type = 'sine';
             osc.frequency.setValueAtTime(200, t);
             osc.frequency.linearRampToValueAtTime(400, t + 0.05);
             g.gain.setValueAtTime(0.3, t);
             g.gain.linearRampToValueAtTime(0, t + 0.1);
             osc.connect(g);
             g.connect(masterGain);
             osc.start(t); osc.stop(t + 0.1);
             
             // Soft Cloud Puff
             const bufferSize = ctx.sampleRate * 0.3;
             const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
             const data = buffer.getChannelData(0);
             for(let i=0; i<bufferSize; i++) data[i] = Math.random() * 2 - 1;
             
             const noise = ctx.createBufferSource();
             noise.buffer = buffer;
             const nGain = ctx.createGain();
             const filter = ctx.createBiquadFilter();
             filter.type = 'lowpass';
             filter.frequency.setValueAtTime(300, t); // Muffled
             
             nGain.gain.setValueAtTime(0.1, t);
             nGain.gain.exponentialRampToValueAtTime(0.001, t+0.3);
             
             noise.connect(filter);
             filter.connect(nGain);
             nGain.connect(masterGain);
             noise.start(t);
        }
        else if (type === 'DEATH_POEIRA') { // "Dust Poof"
             const bufferSize = ctx.sampleRate * 0.25;
             const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
             const data = buffer.getChannelData(0);
             for(let i=0; i<bufferSize; i++) data[i] = Math.random() * 2 - 1;
             
             const noise = ctx.createBufferSource();
             noise.buffer = buffer;
             const nGain = ctx.createGain();
             
             const filter = ctx.createBiquadFilter();
             filter.type = 'lowpass';
             filter.frequency.setValueAtTime(800, t);
             filter.frequency.linearRampToValueAtTime(100, t+0.2); // Sweep down
             
             nGain.gain.setValueAtTime(0.3, t);
             nGain.gain.exponentialRampToValueAtTime(0.01, t+0.2);
             
             noise.connect(filter);
             filter.connect(nGain);
             nGain.connect(masterGain);
             noise.start(t);
        }

        // --- GHOST REACTION SOUNDS (Hits) ---
        else if (type === 'GHOST_WOBBLE') { // Travesso Spawn
             const osc = ctx.createOscillator();
             const g = ctx.createGain();
             const lfo = ctx.createOscillator();
             const lfoGain = ctx.createGain();
             osc.type = 'sine';
             osc.frequency.setValueAtTime(500, t);
             lfo.frequency.setValueAtTime(6, t);
             lfoGain.gain.setValueAtTime(30, t);
             lfo.connect(lfoGain);
             lfoGain.connect(osc.frequency);
             g.gain.setValueAtTime(0.15, t);
             g.gain.linearRampToValueAtTime(0, t+0.6);
             osc.connect(g);
             g.connect(masterGain);
             osc.start(t); lfo.start(t); osc.stop(t+0.6); lfo.stop(t+0.6);
        }
        else if (type === 'GHOST_EEP') { // Medroso Hit
             const osc = ctx.createOscillator();
             const g = ctx.createGain();
             osc.type = 'triangle';
             osc.frequency.setValueAtTime(600, t);
             osc.frequency.exponentialRampToValueAtTime(900, t+0.1);
             const trem = ctx.createOscillator();
             const tremGain = ctx.createGain();
             trem.frequency.value = 15; tremGain.gain.value = 0.5;
             trem.connect(tremGain); tremGain.connect(g.gain);
             g.gain.setValueAtTime(0.1, t);
             g.gain.exponentialRampToValueAtTime(0.01, t+0.3);
             osc.connect(g); g.connect(masterGain);
             osc.start(t); trem.start(t); osc.stop(t+0.3); trem.stop(t+0.3);
        }
        else if (type === 'GHOST_SNORE') { // Sonolento Hit
             const osc = ctx.createOscillator();
             const g = ctx.createGain();
             osc.type = 'sine';
             osc.frequency.setValueAtTime(200, t);
             osc.frequency.linearRampToValueAtTime(100, t+0.3);
             g.gain.setValueAtTime(0.2, t);
             g.gain.exponentialRampToValueAtTime(0.01, t+0.5);
             osc.connect(g); g.connect(masterGain);
             osc.start(t); osc.stop(t+0.5);
        }
        else if (type === 'GHOST_BOO') { // Travesso Hit
             const osc = ctx.createOscillator();
             const g = ctx.createGain();
             osc.type = 'sine';
             osc.frequency.setValueAtTime(400, t);
             osc.frequency.linearRampToValueAtTime(300, t+0.15);
             g.gain.setValueAtTime(0.15, t);
             g.gain.exponentialRampToValueAtTime(0.01, t+0.2);
             osc.connect(g); g.connect(masterGain);
             osc.start(t); osc.stop(t+0.2);
        }
        else if (type === 'GHOST_POOF_HIT') { // Poeira Hit
             const bufferSize = ctx.sampleRate * 0.1;
             const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
             const data = buffer.getChannelData(0);
             for(let i=0; i<bufferSize; i++) data[i] = Math.random() * 2 - 1;
             const noise = ctx.createBufferSource();
             noise.buffer = buffer;
             const nGain = ctx.createGain();
             nGain.gain.setValueAtTime(0.1, t);
             nGain.gain.linearRampToValueAtTime(0, t+0.1);
             noise.connect(nGain); nGain.connect(masterGain);
             noise.start(t);
        }

        // --- NEW & REFINED UI/EVENT SOUNDS ---

        else if (type === 'VICTORY') { // "Fanfare"
             // Bright Arpeggio
             const notes = [523.25, 659.25, 783.99, 1046.50]; // C Major
             notes.forEach((freq, i) => {
                 const osc = ctx.createOscillator();
                 const g = ctx.createGain();
                 osc.type = 'square';
                 osc.frequency.value = freq;
                 const startTime = t + i * 0.1;
                 g.gain.setValueAtTime(0, startTime);
                 g.gain.linearRampToValueAtTime(0.1, startTime + 0.05);
                 g.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);
                 osc.connect(g); g.connect(masterGain);
                 osc.start(startTime); osc.stop(startTime + 0.4);
             });
             // Sparkles
             for(let i=0; i<10; i++) {
                 const osc = ctx.createOscillator();
                 const g = ctx.createGain();
                 osc.type = 'sine';
                 osc.frequency.value = 2000 + Math.random() * 2000;
                 const st = t + 0.4 + Math.random() * 0.5;
                 g.gain.setValueAtTime(0.05, st);
                 g.gain.exponentialRampToValueAtTime(0.001, st + 0.1);
                 osc.connect(g); g.connect(masterGain);
                 osc.start(st); osc.stop(st + 0.1);
             }
        }
        else if (type === 'DEFEAT') { // "Sad Trombone"
             // Wah-wah slide down
             const osc = ctx.createOscillator();
             const g = ctx.createGain();
             const filter = ctx.createBiquadFilter();
             osc.type = 'sawtooth';
             osc.frequency.setValueAtTime(196.00, t); // G3
             osc.frequency.linearRampToValueAtTime(130.81, t + 1.5); // Slide to C3
             const lfo = ctx.createOscillator();
             const lfoGain = ctx.createGain();
             lfo.frequency.value = 3; lfoGain.gain.value = 500;
             lfo.connect(lfoGain); lfoGain.connect(filter.frequency);
             filter.type = 'lowpass'; filter.Q.value = 5; filter.frequency.setValueAtTime(600, t);
             g.gain.setValueAtTime(0.2, t);
             g.gain.linearRampToValueAtTime(0, t + 1.5);
             osc.connect(filter); filter.connect(g); g.connect(masterGain);
             osc.start(t); lfo.start(t);
             osc.stop(t+1.5); lfo.stop(t+1.5);
        }
        else if (type === 'BUILD') { // "Escalating Whoosh + Chime"
             // Whoosh Up
             const bufferSize = ctx.sampleRate * 0.2;
             const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
             const data = buffer.getChannelData(0);
             for(let i=0; i<bufferSize; i++) data[i] = Math.random() * 2 - 1;
             const noise = ctx.createBufferSource();
             noise.buffer = buffer;
             const filter = ctx.createBiquadFilter();
             filter.type = 'bandpass'; filter.Q.value = 1;
             filter.frequency.setValueAtTime(200, t);
             filter.frequency.exponentialRampToValueAtTime(1500, t+0.2);
             const nGain = ctx.createGain();
             nGain.gain.setValueAtTime(0, t);
             nGain.gain.linearRampToValueAtTime(0.3, t+0.15);
             nGain.gain.linearRampToValueAtTime(0, t+0.2);
             noise.connect(filter); filter.connect(nGain); nGain.connect(masterGain);
             noise.start(t);

             // Chime
             const osc = ctx.createOscillator();
             const g = ctx.createGain();
             osc.type = 'sine';
             osc.frequency.setValueAtTime(1500, t+0.15);
             g.gain.setValueAtTime(0, t+0.15);
             g.gain.linearRampToValueAtTime(0.2, t+0.16);
             g.gain.exponentialRampToValueAtTime(0.001, t+0.5);
             osc.connect(g); g.connect(masterGain);
             osc.start(t+0.15); osc.stop(t+0.5);
        }
        else if (type === 'SELECT') { // "Bubble Pop"
             const osc = ctx.createOscillator();
             const g = ctx.createGain();
             osc.type = 'sine';
             osc.frequency.setValueAtTime(800, t);
             osc.frequency.exponentialRampToValueAtTime(300, t + 0.1);
             g.gain.setValueAtTime(0.1, t);
             g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
             osc.connect(g); g.connect(masterGain);
             osc.start(t); osc.stop(t+0.1);
        }
        else if (type === 'ERROR') { // "Muted Thud"
             const osc = ctx.createOscillator();
             const g = ctx.createGain();
             osc.type = 'triangle';
             osc.frequency.setValueAtTime(150, t);
             osc.frequency.linearRampToValueAtTime(50, t + 0.1);
             g.gain.setValueAtTime(0.2, t);
             g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
             osc.connect(g); g.connect(masterGain);
             osc.start(t); osc.stop(t+0.2);
        }
        else if (type === 'SELL') { // "Whoosh Down + Plop"
             // Whoosh Down
             const bufferSize = ctx.sampleRate * 0.2;
             const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
             const data = buffer.getChannelData(0);
             for(let i=0; i<bufferSize; i++) data[i] = Math.random() * 2 - 1;
             const noise = ctx.createBufferSource();
             noise.buffer = buffer;
             const filter = ctx.createBiquadFilter();
             filter.type = 'lowpass';
             filter.frequency.setValueAtTime(800, t);
             filter.frequency.linearRampToValueAtTime(100, t+0.2);
             const nGain = ctx.createGain();
             nGain.gain.setValueAtTime(0.2, t);
             nGain.gain.linearRampToValueAtTime(0, t+0.2);
             noise.connect(filter); filter.connect(nGain); nGain.connect(masterGain);
             noise.start(t);
             // Plop
             const osc = ctx.createOscillator();
             const g = ctx.createGain();
             osc.type = 'sine';
             osc.frequency.setValueAtTime(600, t + 0.15);
             osc.frequency.exponentialRampToValueAtTime(200, t + 0.25);
             g.gain.setValueAtTime(0, t + 0.15);
             g.gain.linearRampToValueAtTime(0.2, t + 0.16);
             g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
             osc.connect(g); g.connect(masterGain);
             osc.start(t + 0.15); osc.stop(t + 0.3);
        }
    } catch(e) { console.error(e); }
  };

  const startGame = () => {
    initAudio();
    setStatus('PLAYING');
    setIsPaused(false);
    setEnergy(Constants.INITIAL_ENERGY);
    setLives(Constants.INITIAL_LIVES);
    setHasClaimedReward(false);
    setCoinsEarned(0);
    setSelectedTowerId(null);
    setIsRemoving(false);
    
    setTowers([]); 
    setGhosts([]);
    setProjectiles([]);
    setParticles([]);
    setGhostsDefeated(0);
    ghostsSpawnedCountRef.current = 0;
    lastTimeRef.current = performance.now();
  };

  useEffect(() => {
      startGame();
  }, [levelId]); // Updated dependency to restart game on level change

  // --- TRIGGER STATUS SOUNDS ---
  useEffect(() => {
      if (status === 'VICTORY') playSound('VICTORY');
      if (status === 'DEFEAT') playSound('DEFEAT');
  }, [status]);

  useEffect(() => {
      if (status === 'VICTORY' && !hasClaimedReward) {
          const reward = onLevelComplete(lives, Constants.INITIAL_LIVES);
          setCoinsEarned(reward);
          setHasClaimedReward(true);
      }
  }, [status, lives, hasClaimedReward, onLevelComplete]);

  // Helper to create ghost object (pure)
  const createGhost = (row: number, type: GhostVariant) => {
      const config = Constants.GHOST_VARIANTS[type] || Constants.GHOST_VARIANTS['TRAVESSO'];
      return {
          id: Math.random().toString(36).substr(2, 9),
          row,
          x: 105, 
          type,
          speed: config.speed,
          hp: config.hp,
          maxHp: config.hp
      } as GhostType;
  };

  // Helper to create particles (pure)
  const createParticlesBatch = (row: number, x: number, color: string, count: number = 5) => {
      const batch = [];
      let pType: 'CIRCLE' | 'RING' | 'TEXT' = 'CIRCLE';
      let pText;

      if (equippedItems.EFEITOS === 4) { pType = 'TEXT'; pText = '✨'; } 
      else if (equippedItems.EFEITOS === 5) { pType = 'TEXT'; pText = '💖'; }

      for(let i=0; i<count; i++) {
          batch.push({
              id: Math.random().toString(),
              x: x + (Math.random() * 2 - 1),
              y: (row * 20 + 10) + (Math.random() * 4 - 2),
              color: color,
              life: 1.0,
              vx: (Math.random() - 0.5) * 0.5,
              vy: (Math.random() - 0.5) * 0.5,
              type: pType,
              text: pText
          });
      }
      return batch;
  };

  const manualActivateTower = (e: React.MouseEvent, tower: Tower) => {
    e.stopPropagation();
    if (status !== 'PLAYING' || isPaused || isRemoving) return;

    // Se clicar no botão turbo, seleciona a torre também
    setSelectedTowerId(tower.id);

    const config = Constants.getTowerStats(tower.type, tower.level);
    const now = performance.now();

    if (now - tower.lastActionTime < config.cooldown) return;

    // Update tower time
    setTowers(prev => prev.map(t => t.id === tower.id ? { ...t, lastActionTime: now } : t));

    if (tower.type === 'TURBO') {
        const towerBaseX = (tower.col * Constants.CELL_WIDTH_PERCENT);
        const startX = towerBaseX + (tower.offset || 0) + (Constants.CELL_WIDTH_PERCENT / 2); 
        const newProjectile: Projectile = {
             id: Math.random().toString(36).substr(2, 9), type: 'WIND',
             row: tower.row, x: startX, speed: 0.6,
             damage: config.damage, knockback: config.knockback || 0
        };
        setProjectiles(prev => [...prev, newProjectile]);
        
        playSound('TURBO_ATK'); // Som de Fwoosh

        const parts = createParticlesBatch(tower.row, (tower.col * Constants.CELL_WIDTH_PERCENT) + 5, '#CBD5E1', 8);
        setParticles(prev => [...prev, ...parts]);
    }
  };

  const handleGridClick = (row: number, col: number) => {
    if (status !== 'PLAYING' || isPaused) return;

    // CORREÇÃO: Garante que o audio resume no clique se estiver suspenso (autoplay policy)
    initAudio();

    const existingTower = towers.find(t => t.row === row && t.col === col);

    // --- MODO REMOÇÃO / VENDA ---
    if (isRemoving) {
        if (existingTower) {
            // Vender/Remover Torre
            const baseConfig = Constants.TOWER_TYPES[existingTower.type];
            setEnergy(prev => prev + baseConfig.cost); // Reembolsa custo total
            setTowers(prev => prev.filter(t => t.id !== existingTower.id));
            
            // Efeitos Visuais
            const tX = (existingTower.col * Constants.CELL_WIDTH_PERCENT) + (Constants.CELL_WIDTH_PERCENT/2);
            setParticles(prev => [...prev, ...createParticlesBatch(existingTower.row, tX, '#EF4444', 8)]);
            playSound('SELL');
            
            // Desativa modo de remoção após uso (para evitar acidentes)
            setIsRemoving(false);
            setSelectedTowerId(null);
        } else {
            // Clicou no vazio, cancela modo de remoção
            setIsRemoving(false);
        }
        return;
    }

    // --- MODO SELEÇÃO ---
    if (existingTower) {
        setSelectedTowerId(existingTower.id);
        playSound('SELECT');
        return;
    }

    // --- MODO CONSTRUÇÃO ---
    // Se clicou no vazio, tenta construir a torre selecionada na barra
    const baseConfig = Constants.TOWER_TYPES[selectedTowerType];
    const level = upgradeLevels[selectedTowerType];
    const fullConfig = Constants.getTowerStats(selectedTowerType, level);

    if (energy >= baseConfig.cost) {
      setEnergy(prev => prev - baseConfig.cost);
      
      const newTower: Tower = {
        id: Math.random().toString(36).substr(2, 9),
        row, col, type: selectedTowerType, level: level,
        lastActionTime: performance.now(),
        hp: selectedTowerType === 'ROBOT' ? fullConfig.hp : 1,
        maxHp: selectedTowerType === 'ROBOT' ? fullConfig.hp : 1,
        offset: 0
      };
      
      setTowers(prev => [...prev, newTower]);
      const parts = createParticlesBatch(row, (col * Constants.CELL_WIDTH_PERCENT) + (Constants.CELL_WIDTH_PERCENT/2), '#60A5FA'); 
      setParticles(prev => [...prev, ...parts]);
      setSelectedTowerId(null); // Limpa seleção ao construir
      playSound('BUILD'); // Som de Construção
    } else {
        // Feedback de falta de energia
        playSound('ERROR');
        setSelectedTowerId(null); // Limpa seleção se clicou fora
    }
  };

  // --- SYNCHRONOUS GAME LOOP ---
  const loop = useCallback((time: number) => {
    if (status !== 'PLAYING') return;

    if (isPaused) {
        lastTimeRef.current = time;
        requestRef.current = requestAnimationFrame(loop);
        return;
    }

    if (lastTimeRef.current === 0) lastTimeRef.current = time;
    const deltaTime = time - lastTimeRef.current;
    lastTimeRef.current = time;
    const dt = deltaTime / 16; 

    // Local Variables for Next Frame (Synchronous Logic)
    let nextGhosts = [...ghosts];
    let nextProjectiles = [...projectiles];
    let nextTowers = [...towers];
    let nextParticles = [...particles];
    let currentEnergy = energy;
    let currentLives = lives;
    let currentKills = ghostsDefeated;
    let victoryTrigger = false;
    let defeatTrigger = false;

    // 1. Spawning
    spawnTimerRef.current += deltaTime;
    if (spawnTimerRef.current > Constants.GHOST_SPAWN_RATE_MS) {
        if (ghostsSpawnedCountRef.current < Constants.TOTAL_GHOSTS_TO_WIN) {
            const row = Math.floor(Math.random() * Constants.GRID_ROWS);
            let type: GhostVariant = 'TRAVESSO';
            const progress = ghostsSpawnedCountRef.current;
            if (progress > 15) type = Math.random() > 0.5 ? 'POEIRA' : 'SONOLENTO';
            else if (progress > 10) type = Math.random() > 0.5 ? 'SONOLENTO' : 'MEDROSO';
            else if (progress > 5) type = Math.random() > 0.6 ? 'MEDROSO' : 'TRAVESSO';

            nextGhosts.push(createGhost(row, type));
            ghostsSpawnedCountRef.current++;

            // SOUND: Spawn Sound based on Type (Random chance to not spam)
            if (Math.random() > 0.7) {
                if (type === 'TRAVESSO') playSound('GHOST_WOBBLE');
                else if (type === 'SONOLENTO') playSound('GHOST_SNORE');
            }
        }
        spawnTimerRef.current = 0;
    }

    // 2. Energy
    energyTimerRef.current += deltaTime;
    if (energyTimerRef.current > Constants.PASSIVE_ENERGY_TICK_MS) {
        currentEnergy += Constants.PASSIVE_ENERGY_AMOUNT;
        energyTimerRef.current = 0;
    }

    // 3. Tower Action
    const now = time;
    for (const tower of nextTowers) {
        const config = Constants.getTowerStats(tower.type, tower.level);
        
        // Robot Movement
        if (tower.type === 'ROBOT') {
            tower.offset += config.speed * dt;
        } 
        // Energy Generation
        else if (tower.type === 'ENERGY') {
            if (now - tower.lastActionTime >= config.cooldown) {
                currentEnergy += config.production;
                tower.lastActionTime = now;
                const tX = (tower.col * Constants.CELL_WIDTH_PERCENT) + (Constants.CELL_WIDTH_PERCENT/2);
                nextParticles.push({ id: Math.random().toString(), x: tX, y: (tower.row * 20 + 10), color: '#a3e635', life: 1.0, type: 'RING' });
                
                playSound('ENERGY_SPAWN'); // Som de Magia
            }
        } 
        // Shooting
        else {
            if (now - tower.lastActionTime >= config.cooldown) {
                const rangePercent = config.rangeInCells * Constants.CELL_WIDTH_PERCENT;
                const towerX = (tower.col * Constants.CELL_WIDTH_PERCENT) + (Constants.CELL_WIDTH_PERCENT/2);
                
                const hasTarget = nextGhosts.some(g => g.row === tower.row && g.x > towerX && g.x < towerX + rangePercent);

                if (hasTarget) {
                    let pType: 'PLASMA' | 'WIND' | 'BEAM' = 'PLASMA';
                    if (tower.type === 'TURBO') pType = 'WIND';
                    if (tower.type === 'MEGA') pType = 'BEAM';
                    
                    const startX = towerX + (tower.offset || 0);
                    nextProjectiles.push({
                         id: Math.random().toString(36).substr(2, 9),
                         type: pType, row: tower.row, x: startX,
                         speed: pType === 'BEAM' ? 1.5 : (pType === 'WIND' ? 0.6 : 0.5),
                         damage: config.damage, knockback: config.knockback || 0
                    });

                    // Som de Ataque baseado no tipo
                    if (tower.type === 'BASIC') playSound('BASIC_ATK');
                    else if (tower.type === 'TURBO') playSound('TURBO_ATK');
                    else if (tower.type === 'MEGA') playSound('MEGA');

                    tower.lastActionTime = now;
                }
            }
        }
    }

    // 4. Projectile Movement & Collision (DESTRUCTION LOGIC)
    for (let i = nextProjectiles.length - 1; i >= 0; i--) {
        const proj = nextProjectiles[i];
        proj.x += proj.speed * dt;
        
        let hit = false;
        // Check collision against ghosts
        for (let j = nextGhosts.length - 1; j >= 0; j--) {
            const g = nextGhosts[j];
            if (g.row === proj.row) {
                const dist = Math.abs(g.x - proj.x);
                if (dist < (Constants.GHOST_HITBOX_W/2 + Constants.PROJECTILE_HITBOX_W/2)) {
                    // HIT!
                    g.hp -= proj.damage;
                    g.x += proj.knockback || 0;
                    hit = true;
                    
                    // VFX
                    let pColor = '#FFFFFF';
                    if (proj.type === 'WIND') pColor = '#CBD5E1';
                    if (proj.type === 'BEAM') pColor = '#A855F7';
                    nextParticles.push(...createParticlesBatch(g.row, g.x, pColor, 3));
                    
                    // SOUND: Specific Hit Sound by Ghost Type (Throttled random)
                    if (Math.random() > 0.5) {
                        if (g.type === 'TRAVESSO') playSound('GHOST_BOO');
                        else if (g.type === 'MEDROSO') playSound('GHOST_EEP');
                        else if (g.type === 'SONOLENTO') playSound('GHOST_SNORE');
                        else if (g.type === 'POEIRA') playSound('GHOST_POOF_HIT');
                    }
                    
                    break; // Stop checking ghosts for this projectile
                }
            }
        }

        // Remove projectile if it hit something OR went off screen
        if (hit || proj.x > 105) {
            nextProjectiles.splice(i, 1);
        }
    }

    // 5. Ghost Movement & Cleanup
    for (let i = nextGhosts.length - 1; i >= 0; i--) {
        const ghost = nextGhosts[i];
        let moveSpeed = ghost.speed * dt;

        // Robot Collision
        for (const t of nextTowers) {
             if (t.type === 'ROBOT' && t.row === ghost.row) {
                 const robotConfig = Constants.getTowerStats(t.type, t.level);
                 const robotX = (t.col * Constants.CELL_WIDTH_PERCENT) + t.offset;
                 if (Math.abs(ghost.x - robotX) < Constants.ROBOT_HITBOX_W) {
                     ghost.hp -= robotConfig.damage * dt;
                     t.hp -= 0.05 * dt;
                     ghost.x += Constants.ROBOT_PUSH_FORCE * dt;
                     moveSpeed = 0;

                     // Som de colisão do robô (chance de 5% por frame para não saturar)
                     if (Math.random() < 0.05) playSound('ROBOT_HIT');
                 }
             }
        }

        ghost.x -= moveSpeed;

        if (ghost.hp <= 0) {
            currentEnergy += Constants.ENERGY_PER_KILL;
            currentKills++;
            nextParticles.push(...createParticlesBatch(ghost.row, ghost.x, getParticleColorForGhost(), 8));
            
            // SOUND: Death Sound based on type
            if (ghost.type === 'TRAVESSO') playSound('DEATH_TRAVESSO');
            else if (ghost.type === 'MEDROSO') playSound('DEATH_MEDROSO');
            else if (ghost.type === 'SONOLENTO') playSound('DEATH_SONOLENTO');
            else if (ghost.type === 'POEIRA') playSound('DEATH_POEIRA');

            nextGhosts.splice(i, 1);
        } else if (ghost.x <= 0) {
            currentLives--;
            if (currentLives <= 0) defeatTrigger = true;
            nextParticles.push(...createParticlesBatch(ghost.row, 0, '#EF4444', 10));
            // SOUND: Lose Life (Generic Error/Bad Sound)
            playSound('ERROR');
            nextGhosts.splice(i, 1);
        }
    }

    // 6. Cleanup Towers (Dead Robots/Offscreen Robots)
    nextTowers = nextTowers.filter(t => {
        if (t.type === 'ROBOT') {
            const currentX = (t.col * Constants.CELL_WIDTH_PERCENT) + t.offset;
            // Se um robô morrer e estiver selecionado, limpa a seleção
            if ((t.hp <= 0 || currentX > 100) && t.id === selectedTowerId) {
                // Warning: state update in loop needs care, but here we can just let it persist until next render
            }
            return t.hp > 0 && currentX <= 100;
        }
        return true;
    });

    // 7. Particles
    nextParticles = nextParticles.map(p => ({
        ...p, life: p.life - 0.05, x: p.x + (p.vx || 0), y: p.y + (p.vy || 0)
    })).filter(p => p.life > 0);

    // 8. Victory Check
    if (nextGhosts.length === 0 && ghostsSpawnedCountRef.current >= Constants.TOTAL_GHOSTS_TO_WIN) {
        victoryTrigger = true;
    }

    // --- APPLY STATE ---
    setGhosts(nextGhosts);
    setProjectiles(nextProjectiles);
    setTowers(nextTowers);
    setParticles(nextParticles);
    setEnergy(currentEnergy);
    setLives(currentLives);
    setGhostsDefeated(currentKills);

    if (victoryTrigger) setStatus('VICTORY');
    if (defeatTrigger) setStatus('DEFEAT');

    requestRef.current = requestAnimationFrame(loop);
  }, [status, isPaused, ghosts, projectiles, towers, particles, energy, lives, ghostsDefeated, equippedItems, upgradeLevels, onLevelComplete, selectedTowerId, isRemoving]); 

  useEffect(() => {
    requestRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [loop]);

  const renderGrid = () => {
    const cells = [];
    for (let r = 0; r < Constants.GRID_ROWS; r++) {
      for (let c = 0; c < Constants.GRID_COLS; c++) {
        const isDark = (r + c) % 2 === 1;
        const isError = errorCell?.r === r && errorCell?.c === c;
        const isCleanRoom = equippedItems.BACKGROUND === 11;
        
        // Se a célula contém a torre selecionada, destacamos
        const towerInCell = towers.find(t => t.row === r && t.col === c);
        const isSelected = towerInCell && towerInCell.id === selectedTowerId;

        let bgClass = isCleanRoom ? (isDark ? 'bg-emerald-900/10' : 'bg-transparent') : (isDark ? 'bg-black/10' : 'bg-transparent');
        
        if (isSelected) {
            bgClass = 'bg-white/20 shadow-[inset_0_0_20px_rgba(255,255,255,0.3)]'; 
        }

        // Highlight visual quando modo de remoção está ativo e existe torre
        if (isRemoving && towerInCell) {
            bgClass = 'bg-red-500/30 animate-pulse';
        }

        cells.push(
          <div
            key={`${r}-${c}`}
            onClick={() => handleGridClick(r, c)}
            className={`w-full h-full border-r border-b ${isCleanRoom ? 'border-emerald-500/10' : 'border-black/5'} ${bgClass} ${isError ? 'bg-red-500/50 animate-pulse' : ''} cursor-pointer relative group flex items-center justify-center transition-colors duration-100`}
          >
             {status === 'PLAYING' && !towerInCell && !isRemoving && (
                <div className="absolute inset-0 opacity-0 group-hover:opacity-60 transition-opacity flex items-center justify-center pointer-events-none">
                    <img src={Constants.TOWER_TYPES[selectedTowerType].image} className="w-[80%] h-[80%] object-contain opacity-50 grayscale" alt="Preview"/>
                    <div className="absolute top-1 right-1 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-[10px] font-bold text-white border border-white">
                        {upgradeLevels[selectedTowerType]}
                    </div>
                </div>
             )}
             {isSelected && !isRemoving && (
                 <div className="absolute inset-0 border-2 border-white animate-pulse rounded-lg pointer-events-none z-10"></div>
             )}
             {isRemoving && towerInCell && (
                 <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
                     <Trash2 className="text-white drop-shadow-md opacity-80" size={24} />
                 </div>
             )}
          </div>
        );
      }
    }
    return cells;
  };

  const getBackgroundStyle = () => {
      if (equippedItems.BACKGROUND === 11) {
          return { background: 'linear-gradient(to bottom, #ecfccb 0%, #dcfce7 100%)' };
      }
      const bgImage = Constants.getLevelBackground(levelId);
      return { 
          backgroundImage: `url(${bgImage})`, 
          backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat'
      };
  };

  return (
    <div 
        className={`w-full h-full relative select-none flex flex-col font-sans ${isRemoving ? 'cursor-not-allowed' : ''}`} 
        style={getBackgroundStyle()}
        onClick={initAudio} // Fallback para autoplay policy
    >
      <style>{`
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
        @keyframes breathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
        @keyframes wobble { 0% { transform: rotate(0deg); } 25% { transform: rotate(-3deg); } 75% { transform: rotate(3deg); } 100% { transform: rotate(0deg); } }
        @keyframes rainbow { 0% { filter: hue-rotate(0deg); } 100% { filter: hue-rotate(360deg); } }
        .anim-float { animation: float 3s ease-in-out infinite; }
        .anim-breathe { animation: breathe 4s ease-in-out infinite; }
        .anim-wobble { animation: wobble 0.5s linear infinite; }
        .anim-rainbow { animation: rainbow 2s linear infinite; }
      `}</style>

      {/* --- HUD --- */}
      <div className={`h-16 flex items-center justify-between px-4 z-30 border-b shrink-0 ${equippedItems.BACKGROUND === 11 ? 'bg-white/50 border-emerald-500/20 text-slate-800' : 'bg-slate-900/90 border-slate-700 text-white'}`}>
        <div className="flex items-center space-x-4">
          <button onClick={onBackToMenu} className={`p-2 rounded-full transition-colors ${equippedItems.BACKGROUND === 11 ? 'hover:bg-white text-slate-800' : 'hover:bg-slate-700 text-white'}`}>
              <ArrowLeft size={24} />
          </button>
          <div className="flex items-center text-yellow-400 font-bold text-xl drop-shadow-md">
            <Zap className={`mr-2 ${equippedItems.BACKGROUND === 11 ? 'text-yellow-600 fill-yellow-500' : 'fill-yellow-400'}`} />
            <span>{Math.floor(energy)}</span>
            <span className="text-xs text-yellow-600 ml-1">(+1/s)</span>
          </div>
          <div className="flex items-center text-red-400 font-bold text-xl drop-shadow-md ml-4">
            <Heart className={`mr-2 ${equippedItems.BACKGROUND === 11 ? 'text-red-500 fill-red-500' : 'fill-red-400'}`} />
            <span>{lives}</span>
          </div>
          <div className="hidden sm:flex items-center bg-black/30 px-3 py-1 rounded-full border border-white/10 ml-4">
             <span className="text-xs font-bold text-gray-300 uppercase mr-1">Fase</span>
             <span className="text-sm font-black text-white">{levelId}</span>
          </div>
          {equippedItems.MUSIC === 10 && (
              <div className="hidden sm:flex items-center text-purple-400 font-bold text-xs ml-4 animate-pulse">
                  <Music className="mr-1" size={16} /> <span>Tema Sótão</span>
              </div>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
             {status === 'PLAYING' && (
               <>
                 <div className={`text-sm hidden sm:block font-mono px-2 py-1 rounded ${equippedItems.BACKGROUND === 11 ? 'text-slate-600 bg-white/50' : 'text-gray-400 bg-slate-800'}`}>
                    Fantasmas: {ghostsDefeated}/{Constants.TOTAL_GHOSTS_TO_WIN}
                 </div>
                 <button onClick={() => setIsPaused(!isPaused)} className={`p-2 rounded hover:bg-slate-600 text-white transition-colors ${isPaused ? 'bg-yellow-600' : 'bg-slate-700'}`}>
                   {isPaused ? <Play size={20} fill="currentColor" /> : <Pause size={20} fill="currentColor" />}
                 </button>
               </>
             )}
        </div>
      </div>

      {/* --- GAME BOARD --- */}
      <div className="flex-1 relative overflow-hidden" onClick={() => { if(selectedTowerId) setSelectedTowerId(null); }}>
        <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-r from-red-600/50 to-transparent z-10 border-l-4 border-red-600" />
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-black/30 z-0 flex flex-col justify-center items-center">
            <span className="text-xs text-gray-600 rotate-90 whitespace-nowrap">ENTRADA</span>
        </div>
        <div className="absolute inset-0 grid z-10" style={{ gridTemplateColumns: `repeat(${Constants.GRID_COLS}, 1fr)`, gridTemplateRows: `repeat(${Constants.GRID_ROWS}, 1fr)` }}>
          {renderGrid()}
        </div>

        {/* --- ENTITIES LAYER --- */}
        <div className="absolute inset-0 pointer-events-none z-30">
            {towers.map(tower => {
                const config = Constants.getTowerStats(tower.type, tower.level);
                const visual = getTowerStyle(tower.type);
                const leftPos = tower.type === 'ROBOT' 
                    ? (tower.col * Constants.CELL_WIDTH_PERCENT) + (tower.offset || 0)
                    : (tower.col * Constants.CELL_WIDTH_PERCENT);
                let animClass = 'anim-breathe';
                if (tower.type === 'ROBOT') animClass = 'anim-wobble origin-bottom';
                if (tower.type === 'ENERGY') animClass = 'anim-breathe origin-center';
                if (equippedItems.SKINS === 3) animClass += ' anim-rainbow';

                const isReady = performance.now() - tower.lastActionTime >= config.cooldown;
                const isSelected = tower.id === selectedTowerId;

                return (
                    <div key={tower.id} className="absolute flex items-center justify-center transition-transform duration-300" style={{ top: `${(tower.row / Constants.GRID_ROWS) * 100}%`, left: `${leftPos}%`, width: `${Constants.CELL_WIDTH_PERCENT}%`, height: `${100 / Constants.GRID_ROWS}%`, }}>
                        
                        {/* Range Indicator for Selected Tower (Only if not Removing) */}
                        {isSelected && !isRemoving && config.rangeInCells > 0 && tower.type !== 'ROBOT' && tower.type !== 'ENERGY' && (
                            <div className="absolute rounded-full border-2 border-white/50 bg-white/10 animate-pulse pointer-events-none" 
                                 style={{ 
                                     width: `${config.rangeInCells * 200}%`, 
                                     height: `${config.rangeInCells * (200 * (Constants.GRID_COLS/Constants.GRID_ROWS))}%`,
                                     minWidth: '200px', minHeight: '200px',
                                     transform: 'scale(1)',
                                     zIndex: -1 
                                 }} 
                            />
                        )}

                        <div className={`relative w-full h-full flex items-center justify-center ${animClass}`}>
                             <div className={`absolute w-3/4 h-3/4 rounded-full opacity-20 ${visual.colorClass.replace('bg-', 'bg-')}`} style={{ filter: visual.filter }}></div>
                             <img src={Constants.TOWER_TYPES[tower.type].image} alt={Constants.TOWER_TYPES[tower.type].name} className={`relative z-10 w-[90%] h-[90%] object-contain drop-shadow-2xl ${tower.type === 'ROBOT' ? 'scale-90' : 'scale-100'} ${tower.type === 'MEGA' ? 'scale-110' : ''}`} style={{ filter: visual.filter }} />
                            
                            <div className="absolute top-0 right-0 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-[8px] font-bold text-white border border-white z-20">
                                {tower.level}
                            </div>

                            {tower.type === 'TURBO' && !isRemoving && (
                                <button onClick={(e) => manualActivateTower(e, tower)} disabled={!isReady} className={`absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center z-40 shadow-lg border border-white/30 pointer-events-auto transition-all ${isReady ? 'bg-blue-500 hover:bg-blue-400 hover:scale-110 text-white animate-pulse' : 'bg-slate-700 text-slate-500 cursor-not-allowed grayscale'}`}>
                                    <Wind size={12} fill={isReady ? "currentColor" : "none"} />
                                </button>
                            )}
                            {tower.type === 'ROBOT' && (
                                <div className="absolute -bottom-2 w-10 h-1 bg-gray-700 rounded overflow-hidden border border-black/50 z-20">
                                    <div className="h-full bg-green-400" style={{width: `${(tower.hp/config.hp!)*100}%`}} />
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}

            {ghosts.map(ghost => {
                const config = Constants.GHOST_VARIANTS[ghost.type] || Constants.GHOST_VARIANTS['TRAVESSO'];
                return (
                    <div key={ghost.id} className="absolute flex items-center justify-center transition-all duration-100" style={{ top: `${(ghost.row / Constants.GRID_ROWS) * 100}%`, left: `${ghost.x}%`, width: `${Constants.CELL_WIDTH_PERCENT}%`, height: `${100 / Constants.GRID_ROWS}%`, transform: 'translateX(-50%)' }}>
                        <div className="relative flex flex-col items-center w-full h-full justify-center anim-float">
                            <div className="absolute w-3/4 h-3/4 bg-white/10 rounded-full blur-sm"></div>
                            <img src={config.image} alt={config.name} className={`relative z-10 object-contain drop-shadow-lg ${ghost.type === 'POEIRA' ? 'w-full h-full' : 'w-[80%] h-[80%]'} ${ghost.type === 'SONOLENTO' ? 'opacity-90' : ''}`} />
                            <div className="w-8 h-1 bg-gray-700 rounded-full overflow-hidden mt-1 absolute -bottom-1 z-20">
                                <div className="h-full bg-red-500 transition-all duration-200" style={{ width: `${(ghost.hp / ghost.maxHp) * 100}%` }} />
                            </div>
                        </div>
                    </div>
                );
            })}

            {projectiles.map(proj => {
                 let color = 'bg-cyan-400';
                 let shape = 'rounded-full w-3 h-3';
                 let shadow = 'shadow-[0_0_10px_rgba(34,211,238,0.8)]';
                 if (proj.type === 'WIND') { color = 'bg-white/50'; shape = 'w-6 h-6 rounded-full blur-sm'; shadow = ''; } 
                 else if (proj.type === 'BEAM') { color = 'bg-purple-500'; shape = 'w-8 h-2 rounded'; shadow = 'shadow-[0_0_15px_rgba(168,85,247,0.8)]'; }
                 return (
                    <div key={proj.id} className={`absolute ${shape} ${color} ${shadow}`} style={{ top: `${(proj.row / Constants.GRID_ROWS) * 100 + 10}%`, left: `${proj.x}%`, transform: 'translate(-50%, -50%)' }} />
                 );
            })}

            {particles.map(p => {
                if (p.type === 'RING') {
                    const scale = (2.0 - p.life) * 2;
                    return ( <div key={p.id} className="absolute border-2 rounded-full pointer-events-none" style={{ top: `${(p.y / (Constants.GRID_ROWS * 20)) * 100}%`, left: `${p.x}%`, borderColor: p.color, opacity: p.life, width: '40px', height: '40px', transform: `translate(-50%, -50%) scale(${scale})` }} /> );
                }
                if (p.type === 'TEXT') {
                     return ( <div key={p.id} className="absolute font-bold text-xs pointer-events-none drop-shadow-md" style={{ top: `${(p.y / (Constants.GRID_ROWS * 20)) * 100}%`, left: `${p.x}%`, color: p.color, opacity: p.life > 1.0 ? 1 : p.life, transform: `translate(-50%, -50%)` }}>{p.text}</div> );
                }
                return ( <div key={p.id} className="absolute w-1 h-1 rounded-full pointer-events-none" style={{ top: `${(p.y / (Constants.GRID_ROWS * 20)) * 100}%`, left: `${p.x}%`, backgroundColor: p.color, opacity: p.life, transform: `scale(${p.life})` }} /> );
            })}
        </div>
      </div>

      {/* --- TOWER SELECTION BAR & REMOVE TOOL --- */}
      <div className={`h-24 border-t flex items-center justify-between px-2 shrink-0 z-40 ${equippedItems.BACKGROUND === 11 ? 'bg-white/80 border-emerald-500/20' : 'bg-slate-800 border-slate-700'}`}>
          
          {/* Towers List */}
          <div className="flex space-x-2 overflow-x-auto flex-1 items-center">
            {(Object.keys(Constants.TOWER_TYPES) as TowerType[]).map(type => {
                const baseConfig = Constants.TOWER_TYPES[type];
                const isSelected = selectedTowerType === type && !isRemoving;
                const canAfford = energy >= baseConfig.cost;
                const visual = getTowerStyle(type);

                return (
                    <button key={type} onClick={(e) => { e.stopPropagation(); setSelectedTowerType(type); setIsRemoving(false); setSelectedTowerId(null); }} disabled={(!canAfford && !isSelected) || isPaused} className={`relative flex flex-col items-center justify-center p-2 rounded-lg w-20 h-20 transition-all shrink-0 ${isSelected ? 'bg-slate-600 ring-2 ring-yellow-400 scale-105' : 'bg-slate-700 hover:bg-slate-600'} ${(!canAfford && !isSelected) || isPaused ? 'opacity-50 grayscale cursor-not-allowed' : 'cursor-pointer'}`}>
                        <div className={`w-12 h-12 flex items-center justify-center mb-1`}>
                            <img src={baseConfig.image} alt={baseConfig.name} className="w-full h-full object-contain" style={{ filter: visual.filter }} />
                        </div>
                        <span className="text-[10px] font-bold text-gray-300 uppercase leading-none mb-1">{baseConfig.name}</span>
                        <div className="flex items-center text-yellow-400 text-xs font-bold"><Zap size={10} className="mr-0.5" />{baseConfig.cost}</div>
                        
                        <div className="absolute top-1 right-1 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center text-[8px] font-bold text-white border border-white/30">
                            {upgradeLevels[type]}
                        </div>
                    </button>
                );
            })}
          </div>

          {/* Separator */}
          <div className="w-px h-16 bg-white/10 mx-2"></div>

          {/* Remove Tool Button */}
          <button 
            onClick={(e) => { e.stopPropagation(); setIsRemoving(!isRemoving); setSelectedTowerId(null); }}
            disabled={isPaused}
            className={`w-20 h-20 rounded-lg flex flex-col items-center justify-center transition-all border-2 
                ${isRemoving 
                    ? 'bg-red-600 border-red-400 scale-105 shadow-[0_0_15px_rgba(239,68,68,0.6)] animate-pulse' 
                    : 'bg-slate-800 border-slate-700 hover:bg-red-900/50 hover:border-red-500/50'}`}
          >
              <Trash2 size={24} className={isRemoving ? "text-white" : "text-gray-400"} />
              <span className={`text-[9px] font-bold mt-1 uppercase leading-none ${isRemoving ? 'text-white' : 'text-gray-400'}`}>
                  {isRemoving ? 'CANCELAR' : 'REMOVER'}
              </span>
          </button>

      </div>

      {/* --- OVERLAYS --- */}
      {status !== 'PLAYING' && (
        <div className="absolute inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-8 backdrop-blur-sm">
            {status === 'VICTORY' && (
                <>
                    <CheckCircle className="w-16 h-16 text-green-500 mb-2" />
                    <h2 className="text-4xl font-bold text-white mb-2">Casa Limpa!</h2>
                    <p className="text-gray-300 mb-6">Nenhum fantasma sobrou.</p>
                    <div className="bg-slate-800 rounded-xl px-6 py-4 border border-slate-600 mb-8 flex items-center space-x-3 shadow-xl transform scale-110">
                        <div className="w-12 h-12 bg-yellow-400 rounded-full border-4 border-yellow-600 flex items-center justify-center text-2xl animate-bounce">🪙</div>
                        <div className="flex flex-col">
                             <span className="text-sm text-yellow-400 font-bold uppercase">Recompensa</span>
                             <span className="text-3xl font-black text-white">+{coinsEarned}</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-3">
                        {levelId < Constants.LEVELS.length && (
                            <button 
                                onClick={() => { playSound('SELECT'); onNextLevel(); }} 
                                className="px-8 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-bold text-lg shadow-lg hover:scale-105 transition-all flex items-center justify-center border-b-4 border-blue-800 active:border-b-0 active:translate-y-1"
                            >
                                <ArrowRight size={24} className="mr-2" /> Próxima Fase
                            </button>
                        )}
                        <button 
                            onClick={startGame} 
                            className="px-8 py-3 bg-green-600 hover:bg-green-500 rounded-lg text-white font-bold text-lg shadow-lg hover:scale-105 transition-all flex items-center justify-center border-b-4 border-green-800 active:border-b-0 active:translate-y-1"
                        >
                            <RefreshCw size={20} className="mr-2" /> Jogar Novamente
                        </button>
                    </div>
                </>
            )}
            {status === 'DEFEAT' && (
                <>
                    <XCircle className="w-24 h-24 text-red-500 mb-4" />
                    <h2 className="text-4xl font-bold text-white mb-2">A Casa Foi Bagunçada!</h2>
                    <p className="text-gray-300 mb-8">Os fantasmas venceram desta vez.</p>
                    <button onClick={startGame} className="px-8 py-3 bg-red-600 hover:bg-red-500 rounded-lg text-white font-bold text-lg shadow-lg hover:scale-105 transition-all flex items-center"><RefreshCw size={20} className="mr-2" />Tentar de Novo</button>
                </>
            )}
        </div>
      )}

      {status === 'PLAYING' && isPaused && (
        <div className="absolute inset-0 bg-black/50 z-40 flex items-center justify-center backdrop-blur-sm">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-4 tracking-widest">PAUSADO</h2>
                <div className="flex flex-col space-y-3">
                    <button onClick={() => setIsPaused(false)} className="px-8 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-bold shadow-lg">Continuar</button>
                    <button onClick={onBackToMenu} className="px-8 py-3 bg-red-600 hover:bg-red-500 rounded-lg text-white font-bold shadow-lg">Sair para Menu</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
