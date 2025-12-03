
import { TowerType, GhostType } from "./types";

export const GRID_ROWS = 5;
export const GRID_COLS = 9;
export const CELL_WIDTH_PERCENT = 100 / GRID_COLS; // ~11.11%

export const INITIAL_ENERGY = 50;
export const INITIAL_LIVES = 3;

export const GHOST_SPAWN_RATE_MS = 2500;
export const ENERGY_PER_KILL = 15;
export const PASSIVE_ENERGY_TICK_MS = 2000;
export const PASSIVE_ENERGY_AMOUNT = 5;

// Physics & Collision Constants
export const PROJECTILE_HITBOX_W = 3; // % width
export const ROBOT_HITBOX_W = 6; // % width (Physical body)
export const GHOST_HITBOX_W = 6; // % width
export const ROBOT_PUSH_FORCE = 0.05; // How much robot pushes ghost per frame

// Winning condition
export const TOTAL_GHOSTS_TO_WIN = 20;

// Configuração de Preços de Upgrade (Global)
export const UPGRADE_COSTS = {
  2: 20, // Nível 1 -> 2
  3: 45  // Nível 2 -> 3
};

// --- SVG ASSETS GENERATOR (SAFE MODE) ---
const toBase64 = (str: string) => {
    try {
        return window.btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, 
            (match, p1) => String.fromCharCode(parseInt(p1, 16))
        ));
    } catch (e) {
        console.error("SVG Encoding Failed:", e);
        // Retorna um quadrado magenta de erro se falhar a conversão
        return window.btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#FF00FF"/></svg>');
    }
};

const createSvgUrl = (svgContent: string) => `data:image/svg+xml;base64,${toBase64(svgContent)}`;

// --- BACKGROUNDS (FASES 1 a 5) ---
const svgBgLevel1 = `
<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 1600 900" preserveAspectRatio="none">
  <defs>
    <pattern id="woodFloor" x="0" y="0" width="1600" height="80" patternUnits="userSpaceOnUse">
      <rect width="1600" height="80" fill="#FEFCE8"/>
      <line x1="0" y1="78" x2="1600" y2="78" stroke="#FEF08A" stroke-width="2" opacity="0.6"/>
    </pattern>
    <filter id="soft3D">
      <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
      <feOffset dx="2" dy="4" result="offsetblur"/>
      <feMerge> 
        <feMergeNode in="offsetblur"/>
        <feMergeNode in="SourceGraphic"/> 
      </feMerge>
    </filter>
    <radialGradient id="sunLight" cx="50%" cy="0%" r="80%">
        <stop offset="0%" stop-color="#FFF" stop-opacity="0.4"/>
        <stop offset="100%" stop-color="#FFF" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect x="0" y="0" width="1600" height="900" fill="#CFFAFE"/>
  <rect x="0" y="120" width="1600" height="780" fill="url(#woodFloor)"/>
  <rect x="0" y="120" width="1600" height="15" fill="#ECFEFF"/>
  <rect x="0" y="135" width="1600" height="5" fill="#FFF"/>
  <g transform="translate(800, 100)" filter="url(#soft3D)">
    <circle cx="0" cy="0" r="70" fill="#FEF9C3" stroke="#FDE047" stroke-width="8"/>
    <circle cx="0" cy="0" r="60" fill="#E0F2FE"/>
    <rect x="-60" y="-4" width="120" height="8" fill="#FDE047"/>
    <rect x="-4" y="-60" width="8" height="120" fill="#FDE047"/>
    <path d="M-40,-30 Q-20,-50 0,-40" fill="none" stroke="#FFF" stroke-width="4" opacity="0.6" stroke-linecap="round"/>
  </g>
  <path d="M800,170 L600,900 L1000,900 Z" fill="url(#sunLight)" style="mix-blend-mode: overlay; pointer-events: none;"/>
  <g transform="translate(1300, 100)" filter="url(#soft3D)">
     <rect x="-80" y="0" width="160" height="10" rx="5" fill="#FEF3C7"/>
     <g transform="translate(-40, -45)">
        <rect x="0" y="0" width="40" height="45" fill="#FDE68A" rx="2" stroke="#FBBF24" stroke-width="2"/>
        <circle cx="20" cy="22" r="10" fill="#F59E0B"/>
     </g>
     <g transform="translate(30, -25)">
        <path d="M0,25 L5,10 L25,10 L30,25 Z" fill="#E5E7EB"/>
        <ellipse cx="15" cy="5" rx="8" ry="12" fill="#86EFAC"/>
     </g>
  </g>
  <g transform="translate(800, 220)" filter="url(#soft3D)">
     <rect x="-250" y="-80" width="500" height="120" rx="50" fill="#7DD3FC"/>
     <rect x="-220" y="-10" width="210" height="90" rx="20" fill="#BAE6FD"/>
     <rect x="10" y="-10" width="210" height="90" rx="20" fill="#BAE6FD"/>
     <path d="M-250,-20 Q-280,30 -250,70 L-220,70 L-220,-20 Z" fill="#38BDF8"/>
     <path d="M250,-20 Q280,30 250,70 L220,70 L220,-20 Z" fill="#38BDF8"/>
  </g>
  <ellipse cx="800" cy="550" rx="400" ry="220" fill="#FFF" opacity="0.6"/>
  <ellipse cx="800" cy="550" rx="350" ry="180" fill="#FCE7F3" opacity="0.5"/>
  <g transform="translate(1350, 650) rotate(-15)" filter="url(#soft3D)">
      <path d="M0,-40 L20,0 L20,30 L0,30 L-20,30 L-20,0 Z" fill="#6EE7B7"/>
      <circle cx="0" cy="-15" r="10" fill="#D1FAE5"/>
      <path d="M-20,30 L-30,50 L-10,30" fill="#34D399"/>
      <path d="M20,30 L30,50 L10,30" fill="#34D399"/>
  </g>
  <g transform="translate(250, 600) rotate(10)" filter="url(#soft3D)">
     <circle cx="0" cy="0" r="35" fill="#F9A8D4"/>
     <circle cx="-28" cy="-28" r="12" fill="#F9A8D4"/>
     <circle cx="28" cy="-28" r="12" fill="#F9A8D4"/>
     <circle cx="0" cy="45" r="30" fill="#F9A8D4"/>
     <circle cx="0" cy="5" r="10" fill="#FFF"/>
     <circle cx="0" cy="2" r="3" fill="#000"/>
     <circle cx="-10" cy="-5" r="3" fill="#000"/>
     <circle cx="10" cy="-5" r="3" fill="#000"/>
  </g>
  <g transform="translate(400, 750) rotate(-5)" filter="url(#soft3D)">
     <rect x="-30" y="-30" width="60" height="60" rx="8" fill="#FDE047"/>
     <circle cx="-10" cy="-5" r="3" fill="#000" opacity="0.6"/>
     <circle cx="10" cy="-5" r="3" fill="#000" opacity="0.6"/>
     <path d="M-5,10 Q0,15 5,10" fill="none" stroke="#000" stroke-width="2" opacity="0.6"/>
  </g>
</svg>`;

const svgBgLevel2 = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 1600 900"><rect width="1600" height="900" fill="#FFE4C4"/><text x="800" y="450" font-size="50" text-anchor="middle">CORREDOR</text></svg>`;
const svgBgLevel3 = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 1600 900"><rect width="1600" height="900" fill="#ECFEFF"/><text x="800" y="450" font-size="50" text-anchor="middle">BANHEIRO</text></svg>`;
const svgBgLevel4 = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 1600 900"><rect width="1600" height="900" fill="#F5D0FE"/><text x="800" y="450" font-size="50" text-anchor="middle">QUARTO</text></svg>`;
const svgBgLevel5 = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 1600 900"><rect width="1600" height="900" fill="#451A03"/><text x="800" y="450" font-size="50" text-anchor="middle">SÓTÃO</text></svg>`;

export const BG_LEVEL_1 = createSvgUrl(svgBgLevel1);
export const BG_LEVEL_2 = createSvgUrl(svgBgLevel2);
export const BG_LEVEL_3 = createSvgUrl(svgBgLevel3);
export const BG_LEVEL_4 = createSvgUrl(svgBgLevel4);
export const BG_LEVEL_5 = createSvgUrl(svgBgLevel5);
export const BG_MAIN_MENU = BG_LEVEL_1; 

// --- TOWER ASSETS ---
const svgTowerBasic = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="#06b6d4"/><rect x="40" y="10" width="20" height="40" fill="#155e75"/></svg>`;
const svgTowerTurbo = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="#f59e0b"/><rect x="45" y="5" width="10" height="50" fill="#78350f"/></svg>`;
const svgTowerRobot = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="35" fill="#64748b"/><rect x="20" y="40" width="60" height="20" fill="#1e293b"/></svg>`;
const svgTowerEnergy = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="30" y="20" width="40" height="60" fill="#eab308"/><path d="M50 30 L60 50 L40 50 Z" fill="#fff"/></svg>`;
const svgTowerMega = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="20" y="20" width="60" height="60" fill="#7c3aed"/><circle cx="50" cy="50" r="20" fill="#4c1d95"/></svg>`;

export const TOWER_TYPES: Record<TowerType, { name: string; cost: number; color: string; image: string }> = {
    BASIC: { name: 'Aspirador Básico', cost: 30, color: 'bg-blue-500', image: createSvgUrl(svgTowerBasic) },
    TURBO: { name: 'Turbo Fan', cost: 50, color: 'bg-orange-500', image: createSvgUrl(svgTowerTurbo) },
    ROBOT: { name: 'Robô Limpador', cost: 40, color: 'bg-green-500', image: createSvgUrl(svgTowerRobot) },
    ENERGY: { name: 'Gerador', cost: 60, color: 'bg-yellow-500', image: createSvgUrl(svgTowerEnergy) },
    MEGA: { name: 'Mega Vortex', cost: 100, color: 'bg-purple-500', image: createSvgUrl(svgTowerMega) }
};

// --- GHOST ASSETS ---
const svgGhostTravesso = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M20 90 Q20 20 50 20 Q80 20 80 90" fill="#bae6fd"/><circle cx="35" cy="45" r="5"/><circle cx="65" cy="45" r="5"/></svg>`;
const svgGhostMedroso = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M25 90 Q25 30 50 30 Q75 30 75 90" fill="#67e8f9"/><circle cx="40" cy="50" r="2"/><circle cx="60" cy="50" r="2"/></svg>`;
const svgGhostSonolento = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M20 90 Q20 30 50 30 Q80 30 80 90" fill="#6ee7b7"/><path d="M30 50 L50 50" stroke="#000"/><path d="M60 50 L80 50" stroke="#000"/></svg>`;
const svgGhostPoeira = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="#d6d3d1"/><circle cx="35" cy="45" r="3"/><circle cx="65" cy="45" r="3"/></svg>`;

export const GHOST_VARIANTS: Record<string, { name: string; speed: number; hp: number; image: string }> = {
    'TRAVESSO': { name: 'Travesso', speed: 0.06, hp: 50, image: createSvgUrl(svgGhostTravesso) },
    'MEDROSO': { name: 'Medroso', speed: 0.1, hp: 30, image: createSvgUrl(svgGhostMedroso) },
    'SONOLENTO': { name: 'Sonolento', speed: 0.03, hp: 100, image: createSvgUrl(svgGhostSonolento) },
    'POEIRA': { name: 'Rei Poeira', speed: 0.05, hp: 60, image: createSvgUrl(svgGhostPoeira) }
};

export const LEVELS = [
    { id: 1, difficulty: 'Fácil' },
    { id: 2, difficulty: 'Médio' },
    { id: 3, difficulty: 'Difícil' },
    { id: 4, difficulty: 'Muito Difícil' },
    { id: 5, difficulty: 'Pesadelo' }
];

export const getTowerStats = (type: TowerType, level: number) => {
    let damage = 0;
    let cooldown = 1000;
    let rangeInCells = 3;
    let hp: number | undefined;
    let production: number | undefined;
    let knockback: number | undefined;
    let speed: number | undefined;

    switch (type) {
        case 'BASIC':
            damage = 10 + (level - 1) * 5;
            cooldown = Math.max(200, 1000 - (level - 1) * 100);
            rangeInCells = 3;
            break;
        case 'TURBO':
            damage = 5 + (level - 1) * 3;
            cooldown = 200; 
            rangeInCells = 2;
            knockback = 5 + (level - 1) * 2;
            break;
        case 'ROBOT':
            damage = 20 + (level - 1) * 10;
            cooldown = 0;
            hp = 100 + (level - 1) * 50;
            speed = 0.2 + (level - 1) * 0.1;
            rangeInCells = 0;
            break;
        case 'ENERGY':
            damage = 0;
            cooldown = Math.max(2000, 5000 - (level - 1) * 500);
            production = 10 + (level - 1) * 5;
            rangeInCells = 0;
            break;
        case 'MEGA':
            damage = 50 + (level - 1) * 25;
            cooldown = 2000;
            rangeInCells = 4;
            break;
    }

    return { damage, cooldown, rangeInCells, hp, maxHp: hp, production, knockback, speed };
};

export const getLevelBackground = (levelId: number) => {
    switch(levelId) {
        case 1: return BG_LEVEL_1;
        case 2: return BG_LEVEL_2;
        case 3: return BG_LEVEL_3;
        case 4: return BG_LEVEL_4;
        case 5: return BG_LEVEL_5;
        default: return BG_LEVEL_1;
    }
};
