import React, { useState, useEffect } from 'react';
import { GameScene } from './components/GameScene';
import { MainMenu } from './components/MainMenu';
import { LevelSelect } from './components/LevelSelect';
import { Lab } from './components/Lab';
import { Store } from './components/Store';
import { Options } from './components/Options';
import { SceneName, UpgradeState, TowerType, EquippedItems, StoreCategory } from './types';
import * as Constants from './constants';

// Interface global para o Debug
declare global {
    interface Window {
        DEBUG_BOOT: boolean;
        reportBootStep: (step: string, status: 'PENDING' | 'OK' | 'ERROR') => void;
        finishLoading: () => void;
    }
}

const App: React.FC = () => {
  // --- Global Persistence State ---
  const [currentScene, setCurrentScene] = useState<SceneName>('MENU_PRINCIPAL');
  const [selectedLevelId, setSelectedLevelId] = useState<number>(1);
  
  // Safe Initializers (Previnem crash no mount se localStorage estiver corrompido)
  const [stars, setStars] = useState<number>(() => safeIntInit('avf_stars', 100));
  const [poeiraCoins, setPoeiraCoins] = useState<number>(() => safeIntInit('avf_poeiracoins', 0));
  const [ownedItems, setOwnedItems] = useState<number[]>(() => safeJsonInit('avf_owned_items', []));
  const [upgradeLevels, setUpgradeLevels] = useState<UpgradeState>(() => safeJsonInit('avf_upgrades', { BASIC: 1, TURBO: 1, ROBOT: 1, ENERGY: 1, MEGA: 1 }));
  
  // Equip items init needs specific logic
  const [equippedItems, setEquippedItems] = useState<EquippedItems>(() => {
    try {
        const saved = localStorage.getItem('avf_equipped_items');
        if (saved) return JSON.parse(saved);
    } catch (e) { console.warn(e); }
    return { SKINS: null, EFEITOS: null, MUSIC: null, BACKGROUND: null, CURSOR: null };
  });

  // --- FUNÇÃO DE BOOT UNIFICADA ---
  const startAspiradoresVsFantasmas = async () => {
    try {
        if(window.reportBootStep) window.reportBootStep('React: Start Boot', 'PENDING');

        // 1. Verificar Assets Essenciais (Simulado, pois são SVGs inline)
        if(window.reportBootStep) window.reportBootStep('Assets Check', 'PENDING');
        // Apenas garantimos que as constantes carregaram
        if (!Constants.TOWER_TYPES || !Constants.LEVELS) {
            throw new Error("Critical Game Constants Missing");
        }
        if(window.reportBootStep) window.reportBootStep('Assets Check', 'OK');

        // 2. Configurar Estado Inicial
        if(window.reportBootStep) window.reportBootStep('State Init', 'OK');

        // 3. Simular "Network" Check (Não bloqueante)
        // Mesmo que falhe, não para o jogo.
        const networkCheck = new Promise((resolve) => setTimeout(resolve, 500));
        networkCheck.then(() => {
            if(window.reportBootStep) window.reportBootStep('Network (Background)', 'OK');
        });

        // 4. Finalizar
        console.log("[BOOT] Cena inicial pronta, removendo loading.");
        if(window.reportBootStep) window.reportBootStep('Boot Sequence', 'OK');
        
        // Chama a função global para remover o HTML overlay
        if (window.finishLoading) window.finishLoading();

    } catch (e: any) {
        console.error("[BOOT] Erro ao iniciar o jogo:", e);
        if(window.reportBootStep) window.reportBootStep('Boot Error: ' + e.message, 'ERROR');
        // Mesmo com erro, tentamos liberar a tela para mostrar o ErrorBoundary ou menu
        if (window.finishLoading) window.finishLoading();
    }
  };

  useEffect(() => {
      // Chama o boot ao montar o componente
      startAspiradoresVsFantasmas();
  }, []);

  // --- Effects de Persistência ---
  useEffect(() => { localStorage.setItem('avf_stars', stars.toString()); }, [stars]);
  useEffect(() => { localStorage.setItem('avf_poeiracoins', poeiraCoins.toString()); }, [poeiraCoins]);
  useEffect(() => { localStorage.setItem('avf_owned_items', JSON.stringify(ownedItems)); }, [ownedItems]);
  useEffect(() => { localStorage.setItem('avf_equipped_items', JSON.stringify(equippedItems)); }, [equippedItems]);
  useEffect(() => { localStorage.setItem('avf_upgrades', JSON.stringify(upgradeLevels)); }, [upgradeLevels]);

  // Integridade do Equipamento
  useEffect(() => {
    setEquippedItems(prev => {
        const next = { ...prev };
        let changed = false;
        // Se o item não está mais nos ownedItems (raro, mas possível em updates), desequipa
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

  // --- Handlers do Jogo ---

  const handleLevelComplete = (lives: number, maxLives: number) => {
      let starReward = 10; 
      if (lives === maxLives) starReward = 30; 
      else if (lives >= maxLives / 2) starReward = 20;

      const levelBonus = selectedLevelId * 5;
      const totalStars = starReward + levelBonus;
      
      setStars(prev => prev + totalStars);
      if (Math.random() > 0.7) setPoeiraCoins(prev => prev + 1);
      return totalStars;
  };

  const handleNextLevel = () => {
    const nextLevel = selectedLevelId + 1;
    if (nextLevel <= Constants.LEVELS.length) {
        setSelectedLevelId(nextLevel);
        setCurrentScene('GAME');
    } else {
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
    <div className={`w-full h-full bg-slate-900 text-white ${equippedItems.CURSOR === 12 ? 'cursor-none' : ''}`}>
      {equippedItems.CURSOR === 12 && (
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
    </div>
  );
};

// --- Helpers de Inicialização Segura ---
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

export default App;