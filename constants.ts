
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
// Custo para ir PARA o nível X
export const UPGRADE_COSTS = {
  2: 20, // Nível 1 -> 2
  3: 45  // Nível 2 -> 3
};

// --- SVG ASSETS GENERATOR ---
// Solução robusta para converter String UTF-8 (emojis, etc) para Base64
const toBase64 = (str: string) => {
    return window.btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, 
        (match, p1) => String.fromCharCode(parseInt(p1, 16))
    ));
};

const createSvgUrl = (svgContent: string) => `data:image/svg+xml;base64,${toBase64(svgContent)}`;

// --- BACKGROUNDS (FASES 1 a 5) ---
// CORREÇÃO DE PERSPECTIVA:
// O chão agora ocupa praticamente 100% da altura para garantir que a grade (GRID_ROWS=5)
// esteja sempre sobre uma superfície "caminhável", evitando a sensação de flutuar na parede.

// FASE 1: SALA DE ESTAR (Baseado na Referência: Sala Fofa 3D - Janela Redonda, Sofá Azul)
const svgBgLevel1 = `
<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 1600 900" preserveAspectRatio="none">
  <defs>
    <!-- Piso de Madeira Clara (Creme suave) -->
    <pattern id="woodFloor" x="0" y="0" width="1600" height="80" patternUnits="userSpaceOnUse">
      <rect width="1600" height="80" fill="#FEFCE8"/> <!-- Cream -->
      <line x1="0" y1="78" x2="1600" y2="78" stroke="#FEF08A" stroke-width="2" opacity="0.6"/>
    </pattern>
    
    <!-- Filtro para efeito 3D soft (Clay style) -->
    <filter id="soft3D">
      <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
      <feOffset dx="2" dy="4" result="offsetblur"/>
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.2"/>
      </feComponentTransfer>
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

  <!-- PAREDE (Fundo Azul Pastel) -->
  <rect x="0" y="0" width="1600" height="900" fill="#CFFAFE"/> <!-- Light Cyan -->

  <!-- CHÃO (Perspectiva Top-Down simulada) -->
  <rect x="0" y="120" width="1600" height="780" fill="url(#woodFloor)"/>
  
  <!-- Rodapé -->
  <rect x="0" y="120" width="1600" height="15" fill="#ECFEFF"/>
  <rect x="0" y="135" width="1600" height="5" fill="#FFF"/>

  <!-- JANELA REDONDA (Destaque Central) -->
  <g transform="translate(800, 100)" filter="url(#soft3D)">
    <!-- Moldura Externa -->
    <circle cx="0" cy="0" r="70" fill="#FEF9C3" stroke="#FDE047" stroke-width="8"/>
    <!-- Vidro/Céu -->
    <circle cx="0" cy="0" r="60" fill="#E0F2FE"/>
    <!-- Cruz da Janela -->
    <rect x="-60" y="-4" width="120" height="8" fill="#FDE047"/>
    <rect x="-4" y="-60" width="8" height="120" fill="#FDE047"/>
    <!-- Brilho no vidro -->
    <path d="M-40,-30 Q-20,-50 0,-40" fill="none" stroke="#FFF" stroke-width="4" opacity="0.6" stroke-linecap="round"/>
  </g>

  <!-- Luz do Sol entrando -->
  <path d="M800,170 L600,900 L1000,900 Z" fill="url(#sunLight)" style="mix-blend-mode: overlay; pointer-events: none;"/>

  <!-- PRATELEIRA (Direita) -->
  <g transform="translate(1300, 100)" filter="url(#soft3D)">
     <rect x="-80" y="0" width="160" height="10" rx="5" fill="#FEF3C7"/> <!-- Prateleira Creme -->
     
     <!-- Quadro com Sol (Igual referência) -->
     <g transform="translate(-40, -45)">
        <rect x="0" y="0" width="40" height="45" fill="#FDE68A" rx="2" stroke="#FBBF24" stroke-width="2"/>
        <circle cx="20" cy="22" r="10" fill="#F59E0B"/> <!-- Sol -->
        <circle cx="17" cy="20" r="1" fill="#FFF"/>
        <circle cx="23" cy="20" r="1" fill="#FFF"/>
        <path d="M17,25 Q20,28 23,25" fill="none" stroke="#FFF" stroke-width="1.5"/>
        <!-- Raios do sol -->
        <line x1="20" y1="8" x2="20" y2="10" stroke="#F59E0B" stroke-width="2"/>
        <line x1="20" y1="34" x2="20" y2="36" stroke="#F59E0B" stroke-width="2"/>
        <line x1="6" y1="22" x2="8" y2="22" stroke="#F59E0B" stroke-width="2"/>
        <line x1="32" y1="22" x2="34" y2="22" stroke="#F59E0B" stroke-width="2"/>
     </g>

     <!-- Vasinho de Planta (Igual referência) -->
     <g transform="translate(30, -25)">
        <path d="M0,25 L5,10 L25,10 L30,25 Z" fill="#E5E7EB"/> <!-- Vaso Branco -->
        <!-- Folhas Gordinhas -->
        <ellipse cx="15" cy="5" rx="8" ry="12" fill="#86EFAC"/>
        <ellipse cx="5" cy="10" rx="8" ry="10" fill="#86EFAC" transform="rotate(-30 5 10)"/>
        <ellipse cx="25" cy="10" rx="8" ry="10" fill="#86EFAC" transform="rotate(30 25 10)"/>
     </g>
  </g>

  <!-- SOFÁ AZUL (Central - Atrás da grid de jogo) -->
  <g transform="translate(800, 220)" filter="url(#soft3D)">
     <!-- Encosto arredondado -->
     <rect x="-250" y="-80" width="500" height="120" rx="50" fill="#7DD3FC"/>
     <!-- Assento (Dois almofadões gordinhos) -->
     <rect x="-220" y="-10" width="210" height="90" rx="20" fill="#BAE6FD"/>
     <rect x="10" y="-10" width="210" height="90" rx="20" fill="#BAE6FD"/>
     <!-- Braços -->
     <path d="M-250,-20 Q-280,30 -250,70 L-220,70 L-220,-20 Z" fill="#38BDF8"/>
     <path d="M250,-20 Q280,30 250,70 L220,70 L220,-20 Z" fill="#38BDF8"/>
  </g>

  <!-- TAPETE REDONDO (Baseado na referência) -->
  <ellipse cx="800" cy="550" rx="400" ry="220" fill="#FFF" opacity="0.6"/> <!-- Base Branca -->
  <ellipse cx="800" cy="550" rx="350" ry="180" fill="#FCE7F3" opacity="0.5"/> <!-- Interior Rosa -->

  <!-- BRINQUEDOS (Espalhados conforme referência) -->
  
  <!-- Foguete Verde (Canto Direito Baixo) -->
  <g transform="translate(1350, 650) rotate(-15)" filter="url(#soft3D)">
      <path d="M0,-40 L20,0 L20,30 L0,30 L-20,30 L-20,0 Z" fill="#6EE7B7"/> <!-- Corpo Verde -->
      <circle cx="0" cy="-15" r="10" fill="#D1FAE5"/> <!-- Janela -->
      <path d="M-20,30 L-30,50 L-10,30" fill="#34D399"/> <!-- Pé Esq -->
      <path d="M20,30 L30,50 L10,30" fill="#34D399"/> <!-- Pé Dir -->
  </g>

  <!-- Ursinho Rosa (Canto Esquerdo) -->
  <g transform="translate(250, 600) rotate(10)" filter="url(#soft3D)">
     <circle cx="0" cy="0" r="35" fill="#F9A8D4"/> <!-- Cabeça -->
     <circle cx="-28" cy="-28" r="12" fill="#F9A8D4"/> <!-- Orelha -->
     <circle cx="28" cy="-28" r="12" fill="#F9A8D4"/> <!-- Orelha -->
     <circle cx="0" cy="45" r="30" fill="#F9A8D4"/> <!-- Corpo -->
     <circle cx="0" cy="5" r="10" fill="#FFF"/> <!-- Focinho -->
     <circle cx="0" cy="2" r="3" fill="#000"/> <!-- Nariz -->
     <circle cx="-10" cy="-5" r="3" fill="#000"/> <!-- Olho -->
     <circle cx="10" cy="-5" r="3" fill="#000"/> <!-- Olho -->
  </g>

  <!-- Cubo Amarelo (Frente Esquerda) -->
  <g transform="translate(400, 750) rotate(-5)" filter="url(#soft3D)">
     <rect x="-30" y="-30" width="60" height="60" rx="8" fill="#FDE047"/>
     <!-- Carinha no cubo -->
     <circle cx="-10" cy="-5" r="3" fill="#000" opacity="0.6"/>
     <circle cx="10" cy="-5" r="3" fill="#000" opacity="0.6"/>
     <path d="M-5,10 Q0,15 5,10" fill="none" stroke="#000" stroke-width="2" opacity="0.6"/>
  </g>

</svg>`;

// FASE 2: CORREDOR (Perspectiva corrigida para Top-Down puro)
const svgBgLevel2 = `
<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 1600 900" preserveAspectRatio="none">
  <defs>
    <pattern id="woodPattern2" x="0" y="0" width="100" height="60" patternUnits="userSpaceOnUse">
      <rect width="100" height="60" fill="#FFE4C4"/>
      <line x1="0" y1="58" x2="100" y2="58" stroke="#DEB887" stroke-width="2"/>
      <line x1="0" y1="0" x2="0" y2="60" stroke="#DEB887" stroke-width="2" stroke-dasharray="5,5"/>
    </pattern>
  </defs>

  <!-- Chão Total (Ocupa 100% da tela para a grid funcionar) -->
  <rect x="0" y="0" width="1600" height="900" fill="url(#woodPattern2)"/>

  <!-- Rodapé (Apenas cosmético no topo) -->
  <rect x="0" y="0" width="1600" height="40" fill="#FFDAC1"/>
  <rect x="0" y="40" width="1600" height="10" fill="#FFF"/>

  <!-- Tapete Corredor -->
  <rect x="0" y="300" width="1600" height="300" fill="#FFF0F5" opacity="0.8"/>
  <path d="M0,300 L1600,300" stroke="#FFB6C1" stroke-width="6"/>
  <path d="M0,600 L1600,600" stroke="#FFB6C1" stroke-width="6"/>

  <!-- Vasos de Planta (Vistos de cima) -->
  <circle cx="60" cy="100" r="30" fill="#86EFAC" stroke="#22C55E" stroke-width="3"/>
  <circle cx="60" cy="100" r="10" fill="#22C55E"/>
  
  <circle cx="1540" cy="100" r="30" fill="#86EFAC" stroke="#22C55E" stroke-width="3"/>
  <circle cx="1540" cy="100" r="10" fill="#22C55E"/>
</svg>`;

// FASE 3: BANHEIRO
const svgBgLevel3 = `
<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 1600 900" preserveAspectRatio="none">
  <defs>
    <pattern id="bathTile" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
      <rect width="60" height="60" fill="#ECFEFF" stroke="#A5F3FC" stroke-width="2"/>
    </pattern>
  </defs>
  
  <rect x="0" y="0" width="1600" height="900" fill="url(#bathTile)"/>
  
  <!-- Rodapé -->
  <rect x="0" y="0" width="1600" height="30" fill="#CFFAFE"/>
  <line x1="0" y1="30" x2="1600" y2="30" stroke="#22D3EE" stroke-width="4"/>
  
  <!-- Tapetinho -->
  <rect x="700" y="400" width="200" height="140" rx="20" fill="#22D3EE" opacity="0.5"/>
  
  <!-- Bolhas flutuantes (Decoração) -->
  <circle cx="1400" cy="800" r="40" fill="#FFF" stroke="#BAE6FD" opacity="0.4"/>
  <circle cx="1450" cy="750" r="20" fill="#FFF" stroke="#BAE6FD" opacity="0.4"/>
</svg>`;

// FASE 4: QUARTO
const svgBgLevel4 = `
<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 1600 900" preserveAspectRatio="none">
  <rect x="0" y="0" width="1600" height="900" fill="#F5D0FE"/>
  
  <!-- Rodapé -->
  <rect x="0" y="0" width="1600" height="40" fill="#FCE7F3"/>
  <line x1="0" y1="40" x2="1600" y2="40" stroke="#F472B6" stroke-width="4"/>

  <!-- Tapete Gigante -->
  <rect x="100" y="150" width="1400" height="600" rx="40" fill="#FBCFE8" opacity="0.5"/>

  <!-- Estrelas no chão -->
  <text x="200" y="200" font-size="40" fill="#FCD34D" opacity="0.5">★</text>
  <text x="1400" y="800" font-size="30" fill="#FCD34D" opacity="0.5">★</text>
</svg>`;

// FASE 5: SÓTÃO
const svgBgLevel5 = `
<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 1600 900" preserveAspectRatio="none">
  <defs>
    <pattern id="oldWood" x="0" y="0" width="100" height="50" patternUnits="userSpaceOnUse">
      <rect width="100" height="50" fill="#451A03"/>
      <path d="M0,48 L100,48" stroke="#78350F" stroke-width="2"/>
    </pattern>
    <radialGradient id="lampGlow" cx="50%" cy="50%" r="60%">
      <stop offset="0%" stop-color="#FBBF24" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.8"/>
    </radialGradient>
  </defs>
  
  <rect x="0" y="0" width="1600" height="900" fill="url(#oldWood)"/>
  <rect width="1600" height="900" fill="url(#lampGlow)" style="mix-blend-mode: multiply;"/>

  <!-- Teias -->
  <path d="M0,0 L150,0 L0,150 Z" fill="#525252" opacity="0.5"/>
  <path d="M1600,0 L1450,0 L1600,150 Z" fill="#525252" opacity="0.5"/>
</svg>`;

export const BG_LEVEL_1 = createSvgUrl(svgBgLevel1);
export const BG_LEVEL_2 = createSvgUrl(svgBgLevel2);
export const BG_LEVEL_3 = createSvgUrl(svgBgLevel3);
export const BG_LEVEL_4 = createSvgUrl(svgBgLevel4);
export const BG_LEVEL_5 = createSvgUrl(svgBgLevel5);
export const BG_MAIN_MENU = BG_LEVEL_1; 

// --- TOWER ASSETS (REMASTERIZADOS) ---

// 1. BASIC (Azulzinho Fofo) - Tipo "Henry" mas azul
const svgTowerBasic = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <radialGradient id="bodyGradBasic" cx="30%" cy="30%" r="80%">
      <stop offset="0%" stop-color="#67E8F9"/> <!-- Cyan 300 -->
      <stop offset="100%" stop-color="#0891B2"/> <!-- Cyan 600 -->
    </radialGradient>
    <linearGradient id="hoseGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#94A3B8"/>
      <stop offset="50%" stop-color="#E2E8F0"/>
      <stop offset="100%" stop-color="#94A3B8"/>
    </linearGradient>
  </defs>
  
  <!-- Sombra do Chão -->
  <ellipse cx="50" cy="85" rx="35" ry="10" fill="#000" opacity="0.2"/>
  
  <!-- Rodinhas -->
  <circle cx="25" cy="80" r="10" fill="#1E293B"/>
  <circle cx="25" cy="80" r="4" fill="#475569"/>
  <circle cx="75" cy="80" r="10" fill="#1E293B"/>
  <circle cx="75" cy="80" r="4" fill="#475569"/>

  <!-- Mangueira (Curva atrás) -->
  <path d="M20 60 C 10 30, 40 10, 80 20" fill="none" stroke="url(#hoseGrad)" stroke-width="12" stroke-linecap="round"/>
  
  <!-- Corpo Principal -->
  <path d="M20 80 L80 80 Q90 80 90 60 L90 45 Q90 15 50 15 Q10 15 10 45 L10 60 Q10 80 20 80 Z" fill="url(#bodyGradBasic)" stroke="#164E63" stroke-width="2"/>
  
  <!-- Brilho no topo -->
  <ellipse cx="35" cy="30" rx="15" ry="8" fill="#FFF" opacity="0.4" transform="rotate(-20 35 30)"/>

  <!-- Rosto Fofo -->
  <circle cx="35" cy="50" r="6" fill="#164E63"/> <!-- Olho Esq -->
  <circle cx="37" cy="48" r="2" fill="#FFF"/>
  <circle cx="65" cy="50" r="6" fill="#164E63"/> <!-- Olho Dir -->
  <circle cx="67" cy="48" r="2" fill="#FFF"/>
  <path d="M45 60 Q50 65 55 60" fill="none" stroke="#164E63" stroke-width="3" stroke-linecap="round"/> <!-- Boca -->

  <!-- Base Bumper -->
  <path d="M12 75 Q 50 85 88 75" fill="none" stroke="#155E75" stroke-width="6" stroke-linecap="round" opacity="0.5"/>
  
  <!-- Bocal na ponta da mangueira (Flutuando) -->
  <g transform="translate(80, 20) rotate(15)">
      <rect x="-5" y="-5" width="20" height="15" fill="#334155" rx="2"/>
      <rect x="15" y="-8" width="8" height="21" fill="#475569" rx="1"/>
  </g>
</svg>`;

// 2. TURBO (Amarelo Potente) - Tipo Soprador
const svgTowerTurbo = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="turboBody" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FCD34D"/> <!-- Yellow 300 -->
      <stop offset="100%" stop-color="#F59E0B"/> <!-- Amber 500 -->
    </linearGradient>
    <linearGradient id="nozzleGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#22C55E"/>
      <stop offset="100%" stop-color="#15803D"/>
    </linearGradient>
  </defs>

  <!-- Sombra -->
  <ellipse cx="50" cy="85" rx="30" ry="8" fill="#000" opacity="0.2"/>

  <!-- Rodas Traseiras -->
  <circle cx="30" cy="80" r="12" fill="#1C1917"/>
  <circle cx="30" cy="80" r="5" fill="#44403C"/>
  <circle cx="70" cy="80" r="12" fill="#1C1917"/>
  <circle cx="70" cy="80" r="5" fill="#44403C"/>

  <!-- Corpo Principal (Bojudo) -->
  <path d="M20 75 L80 75 Q90 75 90 55 Q90 25 50 25 Q10 25 10 55 Q10 75 20 75 Z" fill="url(#turboBody)" stroke="#B45309" stroke-width="2"/>
  
  <!-- Pescoço Sanfonado -->
  <path d="M50 25 Q 60 10 80 15" fill="none" stroke="#166534" stroke-width="14" stroke-linecap="round"/>
  <path d="M50 25 Q 60 10 80 15" fill="none" stroke="#4ADE80" stroke-width="12" stroke-linecap="round" stroke-dasharray="4 4"/>

  <!-- Bocal (Trombeta Verde) -->
  <g transform="translate(80, 15) rotate(-20)">
      <path d="M0,0 L20,-15 L20,15 Z" fill="url(#nozzleGrad)" stroke="#14532D" stroke-width="1"/>
      <ellipse cx="20" cy="0" rx="5" ry="15" fill="#14532D"/> <!-- Buraco -->
  </g>

  <!-- Detalhes do Corpo -->
  <circle cx="25" cy="50" r="8" fill="#166534" stroke="#14532D" stroke-width="2"/> <!-- Botão 1 -->
  <circle cx="25" cy="68" r="6" fill="#166534" stroke="#14532D" stroke-width="2"/> <!-- Botão 2 -->
  
  <!-- Rosto -->
  <circle cx="55" cy="50" r="5" fill="#451A03"/>
  <circle cx="75" cy="50" r="5" fill="#451A03"/>
  <path d="M60 60 Q65 65 70 60" fill="none" stroke="#451A03" stroke-width="2" stroke-linecap="round"/>

  <!-- Brilho -->
  <path d="M35 35 Q 50 30 65 35" fill="none" stroke="#FFF" stroke-width="4" opacity="0.5" stroke-linecap="round"/>
</svg>`;

// 3. ROBOT (Roomba Style) - Cinza/Laranja Tech
const svgTowerRobot = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="robotMetal" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#E2E8F0"/>
      <stop offset="100%" stop-color="#94A3B8"/>
    </linearGradient>
  </defs>

  <!-- Sombra -->
  <ellipse cx="50" cy="85" rx="35" ry="5" fill="#000" opacity="0.2"/>

  <!-- Corpo Principal (Domo) -->
  <path d="M15 80 L85 80 L85 70 Q85 30 50 30 Q15 30 15 70 Z" fill="url(#robotMetal)" stroke="#475569" stroke-width="2"/>
  
  <!-- Faixa Preta Inferior -->
  <path d="M15 70 L85 70 L85 80 L15 80 Z" fill="#334155"/>

  <!-- Vassourinhas (Laranja) -->
  <g transform="translate(50, 80)">
    <path d="M-35,0 L-40,10 L-30,10 Z" fill="#F97316"/>
    <path d="M-25,0 L-30,10 L-20,10 Z" fill="#F97316"/>
    <path d="M-15,0 L-20,10 L-10,10 Z" fill="#F97316"/>
    <path d="M-5,0 L-10,10 L0,10 Z" fill="#F97316"/>
    <path d="M5,0 L0,10 L10,10 Z" fill="#F97316"/>
    <path d="M15,0 L10,10 L20,10 Z" fill="#F97316"/>
    <path d="M25,0 L20,10 L30,10 Z" fill="#F97316"/>
    <path d="M35,0 L30,10 L40,10 Z" fill="#F97316"/>
  </g>

  <!-- Antena / Sensor -->
  <rect x="46" y="20" width="8" height="15" fill="#F97316"/>
  <circle cx="50" cy="15" r="8" fill="#F97316" stroke="#C2410C" stroke-width="2"/>
  <circle cx="52" cy="13" r="3" fill="#FFF" opacity="0.6"/>

  <!-- Braços Mecânicos -->
  <path d="M15 60 Q 5 60 5 75" fill="none" stroke="#334155" stroke-width="8" stroke-linecap="round"/>
  <circle cx="5" cy="75" r="5" fill="#334155"/>
  
  <path d="M85 60 Q 95 60 95 75" fill="none" stroke="#334155" stroke-width="8" stroke-linecap="round"/>
  <circle cx="95" cy="75" r="5" fill="#334155"/>

  <!-- Rosto Kawaii -->
  <circle cx="38" cy="55" r="6" fill="#1E293B"/>
  <circle cx="40" cy="53" r="2" fill="#FFF"/>
  <circle cx="62" cy="55" r="6" fill="#1E293B"/>
  <circle cx="64" cy="53" r="2" fill="#FFF"/>
  <path d="M46 62 Q50 65 54 62" fill="none" stroke="#1E293B" stroke-width="2" stroke-linecap="round"/>

  <!-- Bochechas -->
  <circle cx="30" cy="60" r="4" fill="#FCA5A5" opacity="0.8"/>
  <circle cx="70" cy="60" r="4" fill="#FCA5A5" opacity="0.8"/>

  <!-- Brilho Domo -->
  <ellipse cx="35" cy="40" rx="10" ry="5" fill="#FFF" opacity="0.3" transform="rotate(-30 35 40)"/>
</svg>`;

// 4. ENERGY (Gerador/Bateria) - Amarelo Tech
const svgTowerEnergy = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="batteryBody" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#EAB308"/> <!-- Yellow 500 -->
      <stop offset="50%" stop-color="#FACC15"/> <!-- Yellow 400 -->
      <stop offset="100%" stop-color="#EAB308"/>
    </linearGradient>
  </defs>

  <!-- Sombra -->
  <ellipse cx="50" cy="90" rx="30" ry="5" fill="#000" opacity="0.2"/>

  <!-- Base -->
  <rect x="25" y="80" width="50" height="10" rx="2" fill="#422006"/>

  <!-- Corpo Pilha -->
  <rect x="30" y="25" width="40" height="60" rx="5" fill="url(#batteryBody)" stroke="#854D0E" stroke-width="2"/>
  
  <!-- Topo Conector -->
  <rect x="40" y="15" width="20" height="10" rx="2" fill="#A16207"/>
  <rect x="45" y="10" width="10" height="5" rx="1" fill="#CA8A04"/>

  <!-- Vidro / Display -->
  <rect x="35" y="35" width="30" height="40" rx="2" fill="#FEF9C3" stroke="#FDE047" stroke-width="1"/>
  
  <!-- Raio Ícone -->
  <path d="M50 40 L60 40 L50 55 L60 55 L40 70 L48 55 L38 55 Z" fill="#EAB308" stroke="#A16207" stroke-width="1"/>

  <!-- Bolhas de Energia (Animadas conceitualmente) -->
  <circle cx="40" cy="30" r="2" fill="#FFF" opacity="0.8"/>
  <circle cx="60" cy="75" r="2" fill="#FFF" opacity="0.8"/>
</svg>`;

// 5. MEGA (Boss Azul/Roxo) - O "Mega 3000"
const svgTowerMega = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="megaBody" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#2DD4BF"/> <!-- Teal 400 -->
      <stop offset="100%" stop-color="#0F766E"/> <!-- Teal 700 -->
    </linearGradient>
    <linearGradient id="goldPlate" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FCD34D"/>
      <stop offset="100%" stop-color="#D97706"/>
    </linearGradient>
  </defs>

  <!-- Sombra -->
  <ellipse cx="50" cy="90" rx="40" ry="8" fill="#000" opacity="0.2"/>

  <!-- Base (Rodapé Amarelo) -->
  <path d="M10 80 L90 80 Q95 80 95 90 L5 90 Q5 80 10 80 Z" fill="url(#goldPlate)" stroke="#B45309" stroke-width="2"/>

  <!-- Corpo Principal (Massivo) -->
  <path d="M15 80 L85 80 L85 40 Q85 10 50 10 Q15 10 15 40 Z" fill="url(#megaBody)" stroke="#115E59" stroke-width="3"/>

  <!-- Placa MEGA 3000 -->
  <rect x="25" y="55" width="50" height="20" rx="4" fill="#FDBA74" stroke="#C2410C" stroke-width="2"/>
  <text x="50" y="68" text-anchor="middle" font-family="Arial, sans-serif" font-weight="900" font-size="10" fill="#9A3412">MEGA</text>
  <text x="50" y="77" text-anchor="middle" font-family="Arial, sans-serif" font-weight="900" font-size="8" fill="#9A3412" letter-spacing="1">3000</text>

  <!-- Mangueira Grossa (Direita) -->
  <path d="M85 30 C 110 30, 110 60, 90 70" fill="none" stroke="#374151" stroke-width="12" stroke-linecap="round"/>
  <path d="M85 30 C 110 30, 110 60, 90 70" fill="none" stroke="#4B5563" stroke-width="10" stroke-linecap="round" stroke-dasharray="3 3"/>

  <!-- Bocal de Chão -->
  <path d="M60 85 L95 85 L100 95 L55 95 Z" fill="url(#goldPlate)" stroke="#B45309" stroke-width="2"/>

  <!-- Rosto Confiante -->
  <circle cx="35" cy="40" r="8" fill="#FFF"/>
  <circle cx="35" cy="40" r="4" fill="#000"/>
  <path d="M30 32 Q35 30 40 32" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round"/> <!-- Sobrancelha -->

  <circle cx="65" cy="40" r="8" fill="#FFF"/>
  <circle cx="65" cy="40" r="4" fill="#000"/>
  <path d="M60 32 Q65 30 70 32" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round"/> <!-- Sobrancelha -->

  <path d="M45 50 Q50 55 55 50" fill="none" stroke="#000" stroke-width="3" stroke-linecap="round"/> <!-- Sorriso -->

  <!-- Alça Superior -->
  <path d="M40 10 Q50 0 60 10" fill="none" stroke="#FCD34D" stroke-width="8" stroke-linecap="round"/>
</svg>`;

export const TOWER_TYPES: Record<TowerType, { name: string; cost: number; color: string; image: string }> = {
    BASIC: { name: 'Aspirador Básico', cost: 30, color: 'bg-blue-500', image: createSvgUrl(svgTowerBasic) },
    TURBO: { name: 'Turbo Fan', cost: 50, color: 'bg-orange-500', image: createSvgUrl(svgTowerTurbo) },
    ROBOT: { name: 'Robô Limpador', cost: 40, color: 'bg-green-500', image: createSvgUrl(svgTowerRobot) },
    ENERGY: { name: 'Gerador', cost: 60, color: 'bg-yellow-500', image: createSvgUrl(svgTowerEnergy) },
    MEGA: { name: 'Mega Vortex', cost: 100, color: 'bg-purple-500', image: createSvgUrl(svgTowerMega) }
};

// --- GHOST ASSETS (REMASTERIZADOS) ---

// 1. TRAVESSO (Cheeky/Naughty) - Baseado na imagem com língua para fora
const svgGhostTravesso = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <radialGradient id="ghostBodyTravesso" cx="40%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#E0F2FE"/> <!-- Lightest Blue -->
      <stop offset="100%" stop-color="#BAE6FD"/> <!-- Light Blue -->
    </radialGradient>
  </defs>
  
  <!-- Corpo -->
  <path d="M20 90 Q15 50 50 20 Q85 50 80 90 L70 85 L60 90 L50 85 L40 90 L30 85 L20 90" fill="url(#ghostBodyTravesso)" stroke="#0284C7" stroke-width="2"/>
  
  <!-- Braços -->
  <path d="M20 55 Q10 50 15 40" fill="none" stroke="#0284C7" stroke-width="3" stroke-linecap="round"/>
  <path d="M80 55 Q90 50 85 65" fill="none" stroke="#0284C7" stroke-width="3" stroke-linecap="round"/>

  <!-- Rosto -->
  <!-- Sobrancelhas bravas -->
  <path d="M30 35 Q40 40 45 38" fill="none" stroke="#0F172A" stroke-width="3" stroke-linecap="round"/>
  <path d="M70 35 Q60 40 55 38" fill="none" stroke="#0F172A" stroke-width="3" stroke-linecap="round"/>
  
  <!-- Olhos -->
  <ellipse cx="35" cy="45" rx="8" ry="10" fill="#FFF" stroke="#0F172A" stroke-width="1"/>
  <circle cx="37" cy="45" r="3" fill="#000"/>
  
  <ellipse cx="65" cy="45" rx="8" ry="10" fill="#FFF" stroke="#0F172A" stroke-width="1"/>
  <circle cx="63" cy="45" r="3" fill="#000"/>

  <!-- Bochechas -->
  <circle cx="25" cy="55" r="4" fill="#FDA4AF" opacity="0.6"/>
  <circle cx="75" cy="55" r="4" fill="#FDA4AF" opacity="0.6"/>

  <!-- Boca e Língua -->
  <path d="M40 60 Q50 65 60 60" fill="none" stroke="#0F172A" stroke-width="2"/> <!-- Sorriso superior -->
  <path d="M42 62 Q50 75 58 62" fill="#F87171" stroke="#991B1B" stroke-width="1"/> <!-- Língua -->
</svg>`;

// 2. MEDROSO (Scared) - Baseado na imagem com mãos no rosto
const svgGhostMedroso = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <radialGradient id="ghostBodyMedroso" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#CFFAFE"/> <!-- Cyan 100 -->
      <stop offset="100%" stop-color="#67E8F9"/> <!-- Cyan 300 -->
    </radialGradient>
  </defs>

  <!-- Corpo trêmulo -->
  <path d="M25 90 Q20 30 50 30 Q80 30 75 90 L65 85 L55 90 L45 85 L35 90 L25 90" fill="url(#ghostBodyMedroso)" stroke="#0891B2" stroke-width="2"/>

  <!-- Mãos no rosto -->
  <circle cx="30" cy="65" r="6" fill="#CFFAFE" stroke="#0891B2" stroke-width="2"/>
  <circle cx="70" cy="65" r="6" fill="#CFFAFE" stroke="#0891B2" stroke-width="2"/>

  <!-- Rosto -->
  <!-- Sobrancelhas preocupadas -->
  <path d="M35 40 Q40 35 45 40" fill="none" stroke="#0F172A" stroke-width="2" stroke-linecap="round"/>
  <path d="M65 40 Q60 35 55 40" fill="none" stroke="#0F172A" stroke-width="2" stroke-linecap="round"/>

  <!-- Olhos arregalados -->
  <circle cx="40" cy="50" r="7" fill="#FFF" stroke="#0F172A" stroke-width="1"/>
  <circle cx="40" cy="50" r="2" fill="#000"/>
  
  <circle cx="60" cy="50" r="7" fill="#FFF" stroke="#0F172A" stroke-width="1"/>
  <circle cx="60" cy="50" r="2" fill="#000"/>

  <!-- Boca gritando -->
  <ellipse cx="50" cy="65" rx="5" ry="8" fill="#374151"/>
  
  <!-- Gotas de suor -->
  <path d="M65 30 Q65 25 68 28 Q70 30 65 30" fill="#BAE6FD" stroke="#0EA5E9" stroke-width="1"/>
</svg>`;

// 3. SONOLENTO (Sleepy) - Baseado na imagem dormindo
const svgGhostSonolento = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <radialGradient id="ghostBodySono" cx="50%" cy="50%" r="60%">
      <stop offset="0%" stop-color="#D1FAE5"/> <!-- Emerald 100 -->
      <stop offset="100%" stop-color="#6EE7B7"/> <!-- Emerald 300 -->
    </radialGradient>
  </defs>

  <!-- Corpo relaxado -->
  <path d="M20 90 Q20 30 50 30 Q80 30 80 90 L70 85 L60 90 L50 85 L40 90 L30 85 L20 90" fill="url(#ghostBodySono)" stroke="#059669" stroke-width="2"/>

  <!-- Rosto -->
  <!-- Olhos fechados -->
  <path d="M35 55 Q40 60 45 55" fill="none" stroke="#064E3B" stroke-width="3" stroke-linecap="round"/>
  <path d="M55 55 Q60 60 65 55" fill="none" stroke="#064E3B" stroke-width="3" stroke-linecap="round"/>

  <!-- Boca (bolinha de baba ou aberta) -->
  <circle cx="50" cy="70" r="4" fill="#064E3B"/>
  
  <!-- Zzz -->
  <g transform="translate(70, 30)">
      <text x="0" y="0" font-family="Arial" font-weight="bold" font-size="20" fill="#064E3B" opacity="0.8">Z</text>
      <text x="15" y="-10" font-family="Arial" font-weight="bold" font-size="15" fill="#064E3B" opacity="0.6">z</text>
      <text x="25" y="-20" font-family="Arial" font-weight="bold" font-size="10" fill="#064E3B" opacity="0.4">z</text>
  </g>
</svg>`;

// 4. POEIRA (Dust/Dirty) - Baseado na imagem do fantasma bege com coroa (Rei Poeira?)
const svgGhostPoeira = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <radialGradient id="ghostBodyPoeira" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#FEF3C7"/> <!-- Amber 100 -->
      <stop offset="100%" stop-color="#D6D3D1"/> <!-- Stone 300 -->
    </radialGradient>
  </defs>

  <!-- Nuvem de poeira base -->
  <circle cx="30" cy="85" r="10" fill="#E7E5E4" opacity="0.6"/>
  <circle cx="50" cy="90" r="12" fill="#E7E5E4" opacity="0.6"/>
  <circle cx="70" cy="85" r="10" fill="#E7E5E4" opacity="0.6"/>

  <!-- Corpo -->
  <path d="M25 85 Q20 30 50 30 Q80 30 75 85" fill="url(#ghostBodyPoeira)" stroke="#78350F" stroke-width="2"/>

  <!-- Manchas de sujeira -->
  <circle cx="35" cy="60" r="3" fill="#A8A29E" opacity="0.5"/>
  <circle cx="65" cy="50" r="4" fill="#A8A29E" opacity="0.5"/>
  <circle cx="50" cy="75" r="2" fill="#A8A29E" opacity="0.5"/>

  <!-- Coroa -->
  <path d="M35 30 L35 15 L45 25 L50 10 L55 25 L65 15 L65 30 Z" fill="#FBBF24" stroke="#B45309" stroke-width="2"/>

  <!-- Rosto -->
  <!-- Sobrancelhas tristes/bravas -->
  <path d="M38 45 Q42 42 46 45" fill="none" stroke="#451A03" stroke-width="2"/>
  <path d="M54 45 Q58 42 62 45" fill="none" stroke="#451A03" stroke-width="2"/>

  <!-- Olhos -->
  <circle cx="42" cy="55" r="5" fill="#000"/>
  <circle cx="43" cy="54" r="1" fill="#FFF"/>
  <circle cx="58" cy="55" r="5" fill="#000"/>
  <circle cx="59" cy="54" r="1" fill="#FFF"/>

  <!-- Boca -->
  <path d="M45 68 Q50 65 55 68" fill="none" stroke="#451A03" stroke-width="2" stroke-linecap="round"/>
</svg>`;

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
    // Base stats
    let damage = 0;
    let cooldown = 1000;
    let rangeInCells = 3;
    let hp: number | undefined;
    let production: number | undefined;
    let knockback: number | undefined;
    let speed: number | undefined;

    const lvlMult = (val: number) => val * (1 + (level - 1) * 0.5); // +50% per level basic scaling

    switch (type) {
        case 'BASIC':
            damage = 10 + (level - 1) * 5;
            cooldown = Math.max(200, 1000 - (level - 1) * 100);
            rangeInCells = 3;
            break;
        case 'TURBO':
            damage = 5 + (level - 1) * 3;
            cooldown = 200; // Fast fire
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
