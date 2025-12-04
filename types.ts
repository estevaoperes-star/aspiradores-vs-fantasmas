
export type GameStatus = 'MENU' | 'PLAYING' | 'VICTORY' | 'DEFEAT';

export type SceneName = 'MENU_PRINCIPAL' | 'GAME' | 'SELECAO_FASES' | 'LABORATORIO' | 'LOJA' | 'OPCOES';

export type TowerType = 'BASIC' | 'TURBO' | 'ROBOT' | 'ENERGY' | 'MEGA';

export type GhostType = 'TRAVESSO' | 'MEDROSO' | 'SONOLENTO' | 'POEIRA';

export type TowerLevel = 1 | 2 | 3;

export type UpgradeState = Record<TowerType, TowerLevel>;

// --- NOVOS TIPOS PARA A LOJA ---
export type StoreCategory = 'SKINS' | 'EFEITOS' | 'PACOTES' | 'EXTRAS';

export interface EquippedItems {
  SKINS: number | null;      // Slot para Skins
  EFEITOS: number | null;    // Slot para Efeitos de Partícula
  MUSIC: number | null;      // Slot para Música (Extra ID 10)
  BACKGROUND: number | null; // Slot para Cenário (Extra ID 11)
  CURSOR: number | null;     // Slot para Cursor (Extra ID 12)
}

export interface Position {
  row: number; // 0-4
  col: number; // 0-8
}

export interface Ghost {
  id: string;
  row: number;
  x: number; // Percentage 0-100
  type: GhostType;
  speed: number;
  hp: number;
  maxHp: number;
  isFrozen?: boolean;
}

export interface Tower {
  id: string;
  row: number;
  col: number;
  type: TowerType;
  lastActionTime: number; // Used for shooting or generating energy
  hp: number; // For Robot
  maxHp: number;
  offset: number; // For Robot movement (percentage relative to cell)
  level: number; // Nível atual da torre
}

export interface Projectile {
  id: string;
  type: 'PLASMA' | 'WIND' | 'BEAM';
  row: number;
  x: number; // Percentage 0-100
  speed: number;
  damage: number;
  knockback: number; // How much it pushes back
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  color: string;
  life: number;
  vx?: number;
  vy?: number;
  type?: 'CIRCLE' | 'RING' | 'TEXT';
  size?: number;
  text?: string;
}

// Configuração de Dificuldade por Nível
export interface LevelConfig {
  id: number;
  difficulty: string;
  totalGhosts: number;       // Quantos fantasmas para vencer
  spawnRateMs: number;       // Frequência de aparição
  allowedGhosts: GhostType[]; // Quais tipos aparecem nesta fase
  hpMultiplier: number;      // Multiplicador de vida dos inimigos
  speedMultiplier: number;   // Multiplicador de velocidade
  initialEnergy: number;     // Energia inicial específica da fase
}
