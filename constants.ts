
import { TowerType, GhostType, LevelConfig } from "./types";

export const GRID_ROWS = 5;
export const GRID_COLS = 9;
export const CELL_WIDTH_PERCENT = 100 / GRID_COLS; // ~11.11%

export const INITIAL_LIVES = 3;

export const ENERGY_PER_KILL = 15;
export const PASSIVE_ENERGY_TICK_MS = 2000;
export const PASSIVE_ENERGY_AMOUNT = 1; // Balanceado: 1 unidade a cada 2s

// Physics & Collision Constants
export const PROJECTILE_HITBOX_W = 3; // % width
export const ROBOT_HITBOX_W = 6; // % width (Physical body)
export const GHOST_HITBOX_W = 6; // % width
export const ROBOT_PUSH_FORCE = 0.05; // How much robot pushes ghost per frame

// Configuração de Preços de Upgrade (Global)
export const UPGRADE_COSTS = {
  2: 20, // Nível 1 -> 2
  3: 45  // Nível 2 -> 3
};

// --- SVG ASSETS GENERATOR (SAFE MODE) ---
// Codifica SVG para Base64 seguro para Data URI
const toBase64 = (str: string) => {
    try {
        return window.btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, 
            (match, p1) => String.fromCharCode(parseInt(p1, 16))
        ));
    } catch (e) {
        console.error("SVG Encoding Failed:", e);
        // Fallback placeholder
        return window.btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#FF00FF"/></svg>');
    }
};

const createSvgUrl = (svgContent: string) => `data:image/svg+xml;base64,${toBase64(svgContent)}`;

// --- FILTROS E ESTILOS COMPARTILHADOS (Injetados em cada SVG) ---
const commonDefs = `
<defs>
    <!-- Sombra suave para objetos flutuantes -->
    <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
        <feOffset dx="0" dy="4" result="offsetblur"/>
        <feComponentTransfer>
            <feFuncA type="linear" slope="0.3"/>
        </feComponentTransfer>
        <feMerge> 
            <feMergeNode in="offsetblur"/>
            <feMergeNode in="SourceGraphic"/> 
        </feMerge>
    </filter>
    
    <!-- Brilho Plástico (Specular) -->
    <radialGradient id="plasticShine" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stop-color="#fff" stop-opacity="0.9"/>
        <stop offset="20%" stop-color="#fff" stop-opacity="0.4"/>
        <stop offset="100%" stop-color="#fff" stop-opacity="0"/>
    </radialGradient>

    <!-- Olho Cartoon -->
    <g id="toonEye">
        <circle cx="0" cy="0" r="12" fill="#fff" stroke="#000" stroke-width="0.5"/>
        <circle cx="2" cy="0" r="6" fill="#333"/>
        <circle cx="4" cy="-2" r="2.5" fill="#fff"/>
    </g>
</defs>
`;

// ==========================================================================================
// 1. BACKGROUNDS (CENÁRIOS 3D CARTOON)
// ==========================================================================================

const bgBase = (content: string, colorTop: string, colorBot: string) => `
<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 1600 900" preserveAspectRatio="none">
  <defs>
    <linearGradient id="wallGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${colorTop}"/>
        <stop offset="100%" stop-color="${colorBot}"/>
    </linearGradient>
    <filter id="softBlur"><feGaussianBlur stdDeviation="3"/></filter>
  </defs>
  <rect width="1600" height="900" fill="url(#wallGrad)"/>
  ${content}
  <!-- Vinheta de iluminação global -->
  <radialGradient id="vignette" cx="50%" cy="50%" r="75%">
    <stop offset="70%" stop-color="#000" stop-opacity="0"/>
    <stop offset="100%" stop-color="#000" stop-opacity="0.3"/>
  </radialGradient>
  <rect width="1600" height="900" fill="url(#vignette)" style="pointer-events:none; mix-blend-mode: multiply;"/>
</svg>`;

// FASE 1: SALA DE ESTAR (Azul bebê, aconchegante, piso de madeira)
const svgBgLevel1 = bgBase(`
  <!-- Chão -->
  <path d="M0,400 L1600,400 L1600,900 L0,900 Z" fill="#E8D4A2"/>
  <path d="M0,400 L1600,400 L1600,420 L0,420 Z" fill="#D4C08E"/> <!-- Rodapé chão -->
  
  <!-- Detalhes Fundo -->
  <rect x="200" y="150" width="120" height="160" rx="5" fill="#FFF" opacity="0.5"/> <!-- Janela fake -->
  <rect x="210" y="160" width="100" height="140" rx="2" fill="#CDE"/>
  
  <rect x="1200" y="200" width="100" height="120" rx="2" fill="#FFF" opacity="0.3"/> <!-- Quadro -->
  
  <!-- Móveis 'Blur' no fundo -->
  <ellipse cx="400" cy="700" rx="300" ry="80" fill="#000" opacity="0.1" filter="url(#softBlur)"/>
  <path d="M1200,450 L1400,450 L1450,600 L1150,600 Z" fill="#FCA5A5" opacity="0.8"/> <!-- Sofá shape -->
`, "#EFF6FF", "#BFDBFE");

// FASE 2: COZINHA (Amarelo pastel, ladrilhos)
const svgBgLevel2 = bgBase(`
  <!-- Chão Xadrez -->
  <pattern id="checker" x="0" y="0" width="100" height="50" patternUnits="userSpaceOnUse">
      <rect width="50" height="50" fill="#FFF"/>
      <rect x="50" width="50" height="50" fill="#E2E8F0"/>
  </pattern>
  <path d="M0,350 L1600,350 L1600,900 L0,900 Z" fill="url(#checker)"/>
  
  <!-- Bancada Fundo -->
  <rect x="0" y="300" width="1600" height="50" fill="#CBD5E1"/>
  <rect x="200" y="100" width="300" height="200" fill="#FFF" rx="10"/> <!-- Geladeira -->
  <rect x="210" y="110" width="280" height="80" fill="#F1F5F9" rx="5"/>
  
  <!-- Armários -->
  <rect x="600" y="50" width="800" height="150" fill="#FEF3C7" rx="5"/>
`, "#FFFBEB", "#FDE68A");

// FASE 3: CORREDOR (Roxo suave, tapete longo)
const svgBgLevel3 = bgBase(`
  <!-- Chão Madeira Escura -->
  <path d="M0,380 L1600,380 L1600,900 L0,900 Z" fill="#78350F"/>
  <!-- Tapete -->
  <path d="M0,450 L1600,450 L1600,850 L0,850 Z" fill="#BE185D" opacity="0.8"/>
  <path d="M0,460 L1600,460 L1600,840 L0,840 Z" fill="#9D174D"/>
  
  <!-- Portas ao fundo -->
  <rect x="300" y="150" width="150" height="230" fill="#5F3825"/>
  <rect x="1150" y="150" width="150" height="230" fill="#5F3825"/>
`, "#F3E8FF", "#D8B4FE");

// FASE 4: QUARTO (Azul noturno, brinquedos)
const svgBgLevel4 = bgBase(`
  <!-- Chão Carpete -->
  <path d="M0,400 L1600,400 L1600,900 L0,900 Z" fill="#1E293B"/>
  
  <!-- Cama -->
  <path d="M100,500 L500,500 L550,700 L50,700 Z" fill="#3B82F6"/>
  <ellipse cx="300" cy="500" rx="100" ry="40" fill="#60A5FA"/>
  
  <!-- Estrelas na parede -->
  <circle cx="800" cy="100" r="5" fill="#FEF08A" opacity="0.6"/>
  <circle cx="1200" cy="200" r="8" fill="#FEF08A" opacity="0.6"/>
  <circle cx="600" cy="250" r="4" fill="#FEF08A" opacity="0.6"/>
`, "#172554", "#1E40AF");

// FASE 5: SÓTÃO (Marrom, madeira velha, poeira)
const svgBgLevel5 = bgBase(`
  <!-- Chão Madeira Velha -->
  <path d="M0,300 L1600,300 L1600,900 L0,900 Z" fill="#451A03"/>
  
  <!-- Vigas -->
  <path d="M200,0 L100,300 L150,300 L250,0 Z" fill="#281203"/>
  <path d="M1400,0 L1500,300 L1450,300 L1350,0 Z" fill="#281203"/>
  
  <!-- Janela Redonda -->
  <circle cx="800" cy="150" r="80" fill="#1E293B"/>
  <path d="M800,70 L800,230" stroke="#000" stroke-width="8"/>
  <path d="M720,150 L880,150" stroke="#000" stroke-width="8"/>
  
  <!-- Partículas de poeira -->
  <circle cx="500" cy="500" r="2" fill="#FFF" opacity="0.3"/>
  <circle cx="900" cy="600" r="3" fill="#FFF" opacity="0.2"/>
`, "#451A03", "#78350F");

export const BG_LEVEL_1 = createSvgUrl(svgBgLevel1);
export const BG_LEVEL_2 = createSvgUrl(svgBgLevel2);
export const BG_LEVEL_3 = createSvgUrl(svgBgLevel3);
export const BG_LEVEL_4 = createSvgUrl(svgBgLevel4);
export const BG_LEVEL_5 = createSvgUrl(svgBgLevel5);
export const BG_MAIN_MENU = BG_LEVEL_1; 

// ==========================================================================================
// 2. ASPIRADORES (TOWERS) - ESTILO PIXAR 3D
// ==========================================================================================

// Base para Aspiradores (Corpo + Rosto)
const vacuumBase = (colorBody: string, colorDark: string, colorAccent: string, extraDetails: string) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    ${commonDefs}
    <g filter="url(#dropShadow)">
        <!-- Corpo Principal (Esfera achatada) -->
        <ellipse cx="50" cy="65" rx="35" ry="25" fill="${colorDark}"/> <!-- Sombra base -->
        <circle cx="50" cy="55" r="30" fill="url(#bodyGrad)"/>
        
        <defs>
            <radialGradient id="bodyGrad" cx="30%" cy="30%" r="80%">
                <stop offset="0%" stop-color="${colorAccent}"/> <!-- Highlight -->
                <stop offset="50%" stop-color="${colorBody}"/> <!-- Main Color -->
                <stop offset="100%" stop-color="${colorDark}"/> <!-- Shadow -->
            </radialGradient>
        </defs>
        
        <!-- Brilho Plástico -->
        <circle cx="50" cy="55" r="28" fill="url(#plasticShine)" opacity="0.6"/>
        
        <!-- Rosto -->
        <g transform="translate(0, 5)">
            <use href="#toonEye" x="40" y="50" transform="scale(1.2)"/>
            <use href="#toonEye" x="60" y="50" transform="scale(1.2)"/>
        </g>
        
        ${extraDetails}
    </g>
</svg>`;

// ASPIRADOR BÁSICO (Azul, simples, mangueira preta)
const svgTowerBasic = vacuumBase("#3B82F6", "#1E3A8A", "#60A5FA", `
    <!-- Mangueira -->
    <path d="M75,50 Q90,40 90,20" fill="none" stroke="#1E293B" stroke-width="6" stroke-linecap="round"/>
    <ellipse cx="90" cy="20" rx="6" ry="3" fill="#000"/>
`);

// ASPIRADOR TURBO (Laranja, ventilador visível)
const svgTowerTurbo = vacuumBase("#F97316", "#9A3412", "#FDBA74", `
    <!-- Turbina Traseira -->
    <path d="M20,55 L10,45 L10,65 Z" fill="#9A3412"/>
    <path d="M80,55 L90,45 L90,65 Z" fill="#9A3412"/>
    <!-- Detalhe 'Racing' -->
    <path d="M40,35 L60,35 L55,25 L45,25 Z" fill="#FFF" opacity="0.8"/>
`);

// ROBÔ (Roomba style, achatado)
const svgTowerRobot = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    ${commonDefs}
    <g filter="url(#dropShadow)">
        <!-- Disco Base -->
        <ellipse cx="50" cy="70" rx="40" ry="15" fill="#1E293B"/>
        <ellipse cx="50" cy="65" rx="40" ry="15" fill="#475569"/>
        <ellipse cx="50" cy="62" rx="35" ry="12" fill="#94A3B8"/>
        
        <!-- Luz/Olho do Robô -->
        <ellipse cx="50" cy="60" rx="10" ry="5" fill="#10B981"/>
        <circle cx="50" cy="60" r="3" fill="#A7F3D0" filter="url(#dropShadow)"/>
        
        <!-- Antena -->
        <line x1="50" y1="60" x2="50" y2="40" stroke="#000" stroke-width="2"/>
        <circle cx="50" cy="40" r="3" fill="#EF4444"/>
    </g>
</svg>`;

// GERADOR (Amarelo, bobina)
const svgTowerEnergy = vacuumBase("#EAB308", "#854D0E", "#FEF08A", `
    <!-- Bobina Tesla em cima -->
    <rect x="45" y="10" width="10" height="20" fill="#A16207"/>
    <circle cx="50" cy="10" r="6" fill="#FEF08A"/>
    <!-- Raios -->
    <path d="M40,20 L30,30 M60,20 L70,30" stroke="#FEF08A" stroke-width="2"/>
`);

// MEGA VORTEX (Roxo, funil gigante)
const svgTowerMega = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    ${commonDefs}
    <g filter="url(#dropShadow)">
        <!-- Base -->
        <rect x="30" y="60" width="40" height="20" rx="5" fill="#5B21B6"/>
        <!-- Funil -->
        <path d="M30,60 L10,20 L90,20 L70,60 Z" fill="url(#megaGrad)"/>
        <defs>
            <linearGradient id="megaGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#7C3AED"/>
                <stop offset="50%" stop-color="#A78BFA"/>
                <stop offset="100%" stop-color="#7C3AED"/>
            </linearGradient>
        </defs>
        <!-- Vortex Interior -->
        <ellipse cx="50" cy="20" rx="40" ry="10" fill="#2E1065"/>
        <ellipse cx="50" cy="20" rx="30" ry="7" fill="#4C1D95"/>
        <ellipse cx="50" cy="20" rx="15" ry="3" fill="#000"/>
        
        <!-- Olhos bravos -->
        <g transform="translate(0, 30)">
             <path d="M35,45 Q40,55 45,45" stroke="#000" stroke-width="2" fill="none"/> 
             <circle cx="35" cy="50" r="3" fill="#FFF"/>
             <circle cx="65" cy="50" r="3" fill="#FFF"/>
        </g>
    </g>
</svg>`;

export const TOWER_TYPES: Record<TowerType, { name: string; cost: number; color: string; image: string }> = {
    BASIC: { name: 'Aspirador Básico', cost: 25, color: 'bg-blue-500', image: createSvgUrl(svgTowerBasic) },
    TURBO: { name: 'Turbo Fan', cost: 35, color: 'bg-orange-500', image: createSvgUrl(svgTowerTurbo) },
    ROBOT: { name: 'Robô Varredor', cost: 40, color: 'bg-slate-500', image: createSvgUrl(svgTowerRobot) },
    ENERGY: { name: 'Aspirador de Energia', cost: 45, color: 'bg-yellow-500', image: createSvgUrl(svgTowerEnergy) },
    MEGA: { name: 'Mega Aspirador 3000', cost: 60, color: 'bg-purple-500', image: createSvgUrl(svgTowerMega) }
};

// ==========================================================================================
// 3. FANTASMAS (ENEMIES) - ESTILO CASPER/LUIGI'S MANSION
// ==========================================================================================

const ghostBase = (colorMain: string, colorLight: string, eyes: string, extras: string = "") => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <defs>
        <filter id="ghostGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feComposite in="SourceGraphic" in2="blur" operator="over"/>
        </filter>
        <linearGradient id="gGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="${colorLight}" stop-opacity="0.9"/>
            <stop offset="100%" stop-color="${colorMain}" stop-opacity="0.6"/>
        </linearGradient>
    </defs>
    <g filter="url(#ghostGlow)">
        <!-- Cauda Flutuante -->
        <path d="M20,90 Q20,20 50,20 Q80,20 80,90 Q65,80 50,90 Q35,80 20,90" fill="url(#gGrad)" stroke="${colorMain}" stroke-width="1"/>
        
        <!-- Braços -->
        <ellipse cx="25" cy="55" rx="8" ry="5" fill="${colorLight}" opacity="0.8"/>
        <ellipse cx="75" cy="55" rx="8" ry="5" fill="${colorLight}" opacity="0.8"/>
        
        ${eyes}
        ${extras}
    </g>
</svg>`;

// FANTASMA TRAVESSO (Azul claro, língua para fora)
const svgGhostTravesso = ghostBase("#3B82F6", "#DBEAFE", `
    <circle cx="35" cy="45" r="5" fill="#FFF"/> <circle cx="37" cy="45" r="2" fill="#000"/>
    <circle cx="65" cy="45" r="5" fill="#FFF"/> <circle cx="63" cy="45" r="2" fill="#000"/>
    <path d="M40,60 Q50,70 60,60" fill="none" stroke="#000" stroke-width="2"/>
    <path d="M48,65 Q50,75 52,65" fill="#F87171"/> <!-- Língua -->
`);

// FANTASMA MEDROSO (Ciano/Verde Água, olhos arregalados, suando)
const svgGhostMedroso = ghostBase("#06B6D4", "#CFFAFE", `
    <circle cx="35" cy="45" r="7" fill="#FFF"/> <circle cx="35" cy="45" r="1" fill="#000"/>
    <circle cx="65" cy="45" r="7" fill="#FFF"/> <circle cx="65" cy="45" r="1" fill="#000"/>
    <ellipse cx="50" cy="65" rx="5" ry="8" fill="#000"/> <!-- Boca aberta susto -->
`, `<circle cx="20" cy="30" r="3" fill="#A5F3FC" opacity="0.6"/>`); // Gota de suor

// FANTASMA SONOLENTO (Verde, pálpebras caídas)
const svgGhostSonolento = ghostBase("#10B981", "#D1FAE5", `
    <path d="M30,45 L40,45" stroke="#000" stroke-width="2"/> <!-- Olho fechado -->
    <path d="M60,45 L70,45" stroke="#000" stroke-width="2"/>
    <circle cx="50" cy="60" r="3" fill="#000" opacity="0.5"/> <!-- Boca O -->
`, `<text x="70" y="30" font-family="sans-serif" font-weight="bold" font-size="14" fill="#FFF">Z</text>`);

// FANTASMA POEIRA (Marrom/Cinza, particulado)
const svgGhostPoeira = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <defs>
        <radialGradient id="dustGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#A8A29E"/>
            <stop offset="100%" stop-color="#57534E" stop-opacity="0.8"/>
        </radialGradient>
    </defs>
    <!-- Corpo Nuvem -->
    <circle cx="50" cy="50" r="30" fill="url(#dustGrad)"/>
    <circle cx="30" cy="40" r="15" fill="url(#dustGrad)"/>
    <circle cx="70" cy="40" r="15" fill="url(#dustGrad)"/>
    <circle cx="40" cy="70" r="15" fill="url(#dustGrad)"/>
    <circle cx="60" cy="70" r="15" fill="url(#dustGrad)"/>
    
    <!-- Rosto Sujo -->
    <circle cx="35" cy="45" r="4" fill="#000"/>
    <circle cx="65" cy="45" r="4" fill="#000"/>
    <path d="M40,65 Q50,55 60,65" fill="none" stroke="#000" stroke-width="2"/>
    
    <!-- Partículas orbitando -->
    <circle cx="20" cy="20" r="2" fill="#D6D3D1"/>
    <circle cx="80" cy="80" r="3" fill="#D6D3D1"/>
</svg>`;

// STATS BALANCEADOS
export const GHOST_VARIANTS: Record<string, { name: string; speed: number; hp: number; image: string }> = {
    'TRAVESSO': { name: 'Travesso', speed: 0.05, hp: 50, image: createSvgUrl(svgGhostTravesso) },
    'MEDROSO': { name: 'Medroso', speed: 0.12, hp: 25, image: createSvgUrl(svgGhostMedroso) },
    'SONOLENTO': { name: 'Sonolento', speed: 0.02, hp: 150, image: createSvgUrl(svgGhostSonolento) },
    'POEIRA': { name: 'Rei Poeira', speed: 0.04, hp: 300, image: createSvgUrl(svgGhostPoeira) }
};

// --- GERAÇÃO DE NÍVEIS (1 a 5) ---
const generateLevels = (): LevelConfig[] => {
    const levels: LevelConfig[] = [];
    const baseSpawnRate = 3000;

    for (let i = 1; i <= 5; i++) {
        const levelIndex = i - 1; // 0 a 4

        // 1. OBJETIVO: 20, 30, 40, 50, 60
        const totalGhosts = 20 + (levelIndex * 10);
        
        // 2. ENERGIA INICIAL: 50, 75, 100, 125, 150
        const initialEnergy = 50 + (levelIndex * 25);

        // 3. VELOCIDADE: Base + 10% por nível (1.0, 1.1, 1.2, 1.3, 1.4)
        const speedMultiplier = 1.0 + (levelIndex * 0.1);

        // 4. VIDA: Base + 20% por nível (1.0, 1.2, 1.4, 1.6, 1.8)
        const hpMultiplier = 1.0 + (levelIndex * 0.2);

        // 5. SPAWN RATE: Reduzir 5% do tempo por nível
        // Nível 1: 3000ms
        // Nível 2: 2850ms ...
        const spawnRateMs = baseSpawnRate * (1 - (levelIndex * 0.05));

        // Desbloqueio de Fantasmas
        let allowedGhosts: GhostType[] = ['TRAVESSO'];
        if (i >= 2) allowedGhosts.push('MEDROSO');
        if (i >= 3) allowedGhosts.push('SONOLENTO');
        if (i >= 4) allowedGhosts.push('POEIRA');

        let difficultyLabel = 'Normal';
        if (i === 1) difficultyLabel = 'Fácil';
        if (i === 2) difficultyLabel = 'Médio';
        if (i === 3) difficultyLabel = 'Difícil';
        if (i === 4) difficultyLabel = 'Muito Difícil';
        if (i === 5) difficultyLabel = 'Extremo';

        levels.push({
            id: i,
            difficulty: difficultyLabel,
            totalGhosts: totalGhosts,
            spawnRateMs: spawnRateMs,
            allowedGhosts: allowedGhosts,
            hpMultiplier: parseFloat(hpMultiplier.toFixed(2)),
            speedMultiplier: parseFloat(speedMultiplier.toFixed(2)),
            initialEnergy: initialEnergy
        });
    }
    return levels;
};

export const LEVELS: LevelConfig[] = generateLevels();

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
