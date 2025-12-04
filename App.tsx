
import React, { useState, useEffect, useLayoutEffect } from 'react';
import { GameScene } from './components/GameScene';
import { MainMenu } from './components/MainMenu';
import { LevelSelect } from './components/LevelSelect';
import { Lab } from './components/Lab';
import { Store } from './components/Store';
import { Options } from './components/Options';
import { SceneName, UpgradeState, TowerType, EquippedItems, StoreCategory } from './types';
import * as Constants from './constants';
import { Smartphone, RotateCcw } from 'lucide-react';

declare global {
    interface Window {
        finishLoading: () => void;
    }
}

const App: React.FC = () => {
  const [currentScene, setCurrentScene] = useState<SceneName>('MENU_PRINCIPAL');
  const [selectedLevelId, setSelectedLevelId] = useState<number>(1);
  const [isMounted, setIsMounted] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);
  
  // Safe Initializers
  const [stars, setStars] = useState<number>(() => safeIntInit('avf_stars', 100));
  const [poeiraCoins, setPoeiraCoins] = useState<number>(() => safeIntInit('avf_poeiracoins', 0));
  const [ownedItems, setOwnedItems] = useState<number[]>(() => safeJsonInit('avf_owned_items', []));
  const [upgradeLevels, setUpgradeLevels] = useState<UpgradeState>(() => safeJsonInit('avf_upgrades', { BASIC: 1, TURBO: 1, ROBOT: 1, ENERGY: 1, MEGA: 1 }));
  const [maxUnlockedLevel, setMaxUnlockedLevel] = useState<number>(() => safeIntInit('avf_max_level', 1));
  
  const [equippedItems, setEquippedItems] = useState<EquippedItems>(() => {
    try {
        const saved = localStorage.getItem('avf_equipped_items');
        if (saved) return JSON.parse(saved);
    } catch (e) { }
    return { SKINS: null, EFEITOS: null, MUSIC: null, BACKGROUND: null, CURSOR: null };
  });

  // Sinaliza que o React montou e remove o loader
  useLayoutEffect(() => {
      setIsMounted(true);
      // Pequeno delay para garantir que o primeiro paint ocorreu
      setTimeout(() => {
          if (window.finishLoading) window.finishLoading();
      }, 100);
      
      checkOrientation();
      window.addEventListener('resize', checkOrientation);
      return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  const checkOrientation = () => {
      // Considera portrait se altura for maior que largura e largura for pequena (mobile)
      if (window.innerHeight > window.innerWidth && window.innerWidth < 768) {
          setIsPortrait(true);
      } else {
          setIsPortrait(false);
      }
  };

  // --- Effects de Persistência ---
  useEffect(() => { safeSetItem('avf_stars', stars.toString()); }, [stars]);
  useEffect(() => { safeSetItem('avf_poeiracoins', poeiraCoins.toString()); }, [poeiraCoins]);
  useEffect(() => { safeSetItem('avf_owned_items', JSON.stringify(ownedItems)); }, [ownedItems]);
  useEffect(() => { safeSetItem('avf_equipped_items', JSON.stringify(equippedItems)); }, [equippedItems]);
  useEffect(() => { safeSetItem('avf_upgrades', JSON.stringify(upgradeLevels)); }, [upgradeLevels]);
  useEffect(() => { safeSetItem('avf_max_level', maxUnlockedLevel.toString()); }, [maxUnlockedLevel]);

  // Integridade do Equipamento
  useEffect(() => {
    setEquippedItems(prev => {
        const next = { ...prev };
        let changed = false;
        (['SKINS', 'EFEITOS', 'MUSIC', 'BACKGROUND', 'CURSOR'] as const).forEach(key => {
            const id = next[key];
            if (id && !ownedItems.includes(id)) {
                next[key] = null;
                changed = true;
            }
        });
        return changed ? next : prev;
    });
  }, [ownedItems]);

  const handleLevelComplete = (lives: number, maxLives: number) => {
      let starReward = 10; 
      if (lives === maxLives) starReward = 30; 
      else if (lives >= maxLives / 2) starReward = 20;
      const levelBonus = selectedLevelId * 5;
      const totalStars = starReward + levelBonus;
      setStars(prev => prev + totalStars);
      if (Math.random() > 0.7) setPoeiraCoins(prev => prev + 1);

      // Desbloquear próximo nível se venceu o nível atual e ele for o último desbloqueado
      if (selectedLevelId === maxUnlockedLevel && maxUnlockedLevel < Constants.LEVELS.length) {
        setMaxUnlockedLevel(prev => prev + 1);
      }

      return totalStars;
  };

  const handleNextLevel = () => {
    const nextLevel = selectedLevelId + 1;
    if (nextLevel <= Constants.LEVELS.length) {
        setSelectedLevelId(nextLevel);
        setCurrentScene('GAME');
    } else {
        // Se já venceu a última fase, volta para seleção de fases
        setCurrentScene('SELECAO_FASES');
    }
  };

  const handlePurchaseUpgrade = (type: TowerType) => {
      const currentLevel = upgradeLevels[type];
      if (currentLevel >= 3) return false;
      const nextLevel = (currentLevel + 1) as 2 | 3;
      const cost = Constants.UPGRADE_COSTS[nextLevel];
      if (stars >= cost) {
          setStars(prev => prev - cost);
          setUpgradeLevels(prev => ({ ...prev, [type]: nextLevel }));
          return true;
      }
      return false;
  };

  const handleStorePurchase = (id: number, cost: number, currency: 'COINS'|'STARS', isConsumable: boolean, categoryToEquip?: StoreCategory) => {
      if (currency === 'STARS') {
          if (stars >= cost) {
              setStars(prev => prev - cost);
              if (!isConsumable) setOwnedItems(prev => [...prev, id]);
              return true;
          }
      } else {
          if (poeiraCoins >= cost) {
              setPoeiraCoins(prev => prev - cost);
              if (!isConsumable) {
                  setOwnedItems(prev => [...prev, id]);
                  if (categoryToEquip) handleEquipItem(categoryToEquip, id);
              }
              return true;
          }
      }
      return false;
  };

  const handleExchangeStars = (starCost: number, coinReward: number) => {
      if (stars >= starCost) {
          setStars(prev => prev - starCost);
          setPoeiraCoins(prev => prev + coinReward);
          return true;
      }
      return false;
  };

  const handleEquipItem = (category: StoreCategory, id: number) => {
      setEquippedItems(prev => {
          const next = { ...prev };
          if (category === 'SKINS') next.SKINS = id;
          if (category === 'EFEITOS') next.EFEITOS = id;
          if (category === 'EXTRAS') {
              if (id === 10) next.MUSIC = id;
              if (id === 11) next.BACKGROUND = id;
              if (id === 12) next.CURSOR = id;
          }
          return next;
      });
      return true;
  };

  const handleWatchAd = () => setPoeiraCoins(prev => prev + 5);

  return (
    <div className={`w-full h-full bg-slate-900 text-white relative z-0 overflow-hidden ${equippedItems.CURSOR === 12 && !('ontouchstart' in window) ? 'cursor-none' : ''}`}>
      {/* Estado visual enquanto React hidrata/monta */}
      {!isMounted && <div className="absolute inset-0 bg-slate-900 z-50"></div>}

      {/* Portrait Warning Overlay */}
      {isPortrait && (
          <div className="absolute inset-0 z-[10000] bg-slate-900 flex flex-col items-center justify-center p-8 text-center animate-fade-in">
              <div className="relative mb-8">
                <Smartphone size={64} className="text-slate-400 animate-pulse" />
                <RotateCcw size={32} className="absolute -right-4 -top-2 text-yellow-400 animate-spin-slow" />
              </div>
              <h2 className="text-2xl font-black text-white mb-2 uppercase">Gire seu dispositivo</h2>
              <p className="text-slate-400 font-bold">O jogo foi projetado para ser jogado na horizontal (paisagem).</p>
          </div>
      )}

      {/* Custom Cursor (Only for Mouse devices) */}
      {equippedItems.CURSOR === 12 && !('ontouchstart' in window) && (
          <div className="fixed pointer-events-none z-[9999]" 
               style={{ left: 0, top: 0, transform: 'translate(var(--cursor-x), var(--cursor-y))', width: '32px', height: '32px' }}
               ref={(el) => { if(el) window.addEventListener('mousemove', (e) => { el.style.setProperty('--cursor-x', `${e.clientX}px`); el.style.setProperty('--cursor-y', `${e.clientY}px`); }); }}
          >🧹</div>
      )}

      {currentScene === 'MENU_PRINCIPAL' && <MainMenu onNavigate={setCurrentScene} />}
      
      {currentScene === 'GAME' && (
        <GameScene 
            levelId={selectedLevelId} 
            onBackToMenu={() => setCurrentScene('MENU_PRINCIPAL')}
            upgradeLevels={upgradeLevels}
            equippedItems={equippedItems}
            onLevelComplete={handleLevelComplete}
            onNextLevel={handleNextLevel}
        />
      )}

      {currentScene === 'SELECAO_FASES' && (
        <LevelSelect 
            onBack={() => setCurrentScene('MENU_PRINCIPAL')} 
            onSelectLevel={(id) => { setSelectedLevelId(id); setCurrentScene('GAME'); }}
            maxUnlockedLevel={maxUnlockedLevel}
        />
      )}

      {currentScene === 'LABORATORIO' && (
        <Lab 
            onBack={() => setCurrentScene('MENU_PRINCIPAL')}
            stars={stars}
            upgradeLevels={upgradeLevels}
            onPurchase={handlePurchaseUpgrade}
        />
      )}

      {currentScene === 'LOJA' && (
        <Store 
            onBack={() => setCurrentScene('MENU_PRINCIPAL')}
            poeiraCoins={poeiraCoins}
            stars={stars}
            ownedItems={ownedItems}
            equippedItems={equippedItems}
            onPurchase={handleStorePurchase}
            onExchangeStars={handleExchangeStars}
            onEquip={handleEquipItem}
            onWatchAd={handleWatchAd}
        />
      )}

      {currentScene === 'OPCOES' && <Options onBack={() => setCurrentScene('MENU_PRINCIPAL')} />}

      <style>{`
        .animate-spin-slow { animation: spin 3s linear infinite; }
      `}</style>
    </div>
  );
};

function safeIntInit(key: string, defaultVal: number): number {
    try {
        const item = localStorage.getItem(key);
        return item ? parseInt(item, 10) : defaultVal;
    } catch { return defaultVal; }
}

function safeJsonInit(key: string, defaultVal: any): any {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultVal;
    } catch { return defaultVal; }
}

function safeSetItem(key: string, value: string) {
    try { localStorage.setItem(key, value); } catch(e) {}
}

export default App;
