import React, { useState, useEffect } from 'react';
import { GameScene } from './components/GameScene';
import { MainMenu } from './components/MainMenu';
import { LevelSelect } from './components/LevelSelect';
import { Lab } from './components/Lab';
import { Store } from './components/Store';
import { Options } from './components/Options';
import { SceneName, UpgradeState, TowerType, EquippedItems, StoreCategory } from './types';
import * as Constants from './constants';

const App: React.FC = () => {
  // --- SEGURANÇA DE INICIALIZAÇÃO ---
  // Sinaliza ao index.html que o React montou o App com sucesso.
  useEffect(() => {
      console.log("[App] Componente App montado. Sinalizando fim do carregamento.");
      // Pequeno delay para garantir que o render visual ocorreu
      const timer = setTimeout(() => {
          if ((window as any).finishLoading) {
              (window as any).finishLoading();
          } else {
              // Fallback caso a função global não exista
              const loader = document.getElementById('loading-overlay');
              if (loader) { 
                  loader.style.opacity = '0'; 
                  setTimeout(() => loader.style.display = 'none', 500);
              }
          }
      }, 100);
      return () => clearTimeout(timer);
  }, []);

  // --- Global Persistence State ---
  const [currentScene, setCurrentScene] = useState<SceneName>('MENU_PRINCIPAL');
  const [selectedLevelId, setSelectedLevelId] = useState<number>(1);
  
  // Moeda Global (Estrelas - Gameplay)
  const [stars, setStars] = useState<number>(() => {
    try {
        const saved = localStorage.getItem('avf_stars');
        return saved ? parseInt(saved, 10) : 100;
    } catch { return 100; }
  });

  // Moeda da Loja (PoeiraCoins - Cosméticos)
  const [poeiraCoins, setPoeiraCoins] = useState<number>(() => {
    try {
        const saved = localStorage.getItem('avf_poeiracoins');
        return saved ? parseInt(saved, 10) : 0; 
    } catch { return 0; }
  });

  // Inventário de Itens Comprados (IDs)
  const [ownedItems, setOwnedItems] = useState<number[]>(() => {
    try {
        const saved = localStorage.getItem('avf_owned_items');
        return saved ? JSON.parse(saved) : []; 
    } catch { return []; }
  });

  // Itens Equipados
  const [equippedItems, setEquippedItems] = useState<EquippedItems>(() => {
    const saved = localStorage.getItem('avf_equipped_items');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            return {
                SKINS: parsed.SKINS || null,
                EFEITOS: parsed.EFEITOS || null,
                MUSIC: parsed.MUSIC || (parsed.EXTRAS === 10 ? 10 : null),
                BACKGROUND: parsed.BACKGROUND || (parsed.EXTRAS === 11 ? 11 : null),
                CURSOR: parsed.CURSOR || (parsed.EXTRAS === 12 ? 12 : null)
            };
        } catch (e) {
            return { SKINS: null, EFEITOS: null, MUSIC: null, BACKGROUND: null, CURSOR: null };
        }
    }
    return { SKINS: null, EFEITOS: null, MUSIC: null, BACKGROUND: null, CURSOR: null };
  });

  // Níveis dos Aspiradores
  const [upgradeLevels, setUpgradeLevels] = useState<UpgradeState>(() => {
    try {
        const saved = localStorage.getItem('avf_upgrades');
        return saved ? JSON.parse(saved) : {
            BASIC: 1, TURBO: 1, ROBOT: 1, ENERGY: 1, MEGA: 1
        };
    } catch {
        return { BASIC: 1, TURBO: 1, ROBOT: 1, ENERGY: 1, MEGA: 1 };
    }
  });

  // Verificação de Integridade
  useEffect(() => {
    setEquippedItems(prev => {
        const next = { ...prev };
        let changed = false;
        if (next.SKINS && !ownedItems.includes(next.SKINS)) { next.SKINS = null; changed = true; }
        if (next.EFEITOS && !ownedItems.includes(next.EFEITOS)) { next.EFEITOS = null; changed = true; }
        if (next.MUSIC && !ownedItems.includes(next.MUSIC)) { next.MUSIC = null; changed = true; }
        if (next.BACKGROUND && !ownedItems.includes(next.BACKGROUND)) { next.BACKGROUND = null; changed = true; }
        if (next.CURSOR && !ownedItems.includes(next.CURSOR)) { next.CURSOR = null; changed = true; }
        return changed ? next : prev;
    });
  }, [ownedItems]);

  useEffect(() => { localStorage.setItem('avf_stars', stars.toString()); }, [stars]);
  useEffect(() => { localStorage.setItem('avf_poeiracoins', poeiraCoins.toString()); }, [poeiraCoins]);
  useEffect(() => { localStorage.setItem('avf_owned_items', JSON.stringify(ownedItems)); }, [ownedItems]);
  useEffect(() => { localStorage.setItem('avf_equipped_items', JSON.stringify(equippedItems)); }, [equippedItems]);
  useEffect(() => { localStorage.setItem('avf_upgrades', JSON.stringify(upgradeLevels)); }, [upgradeLevels]);

  const handleLevelComplete = (lives: number, maxLives: number) => {
      // Recompensa baseada na performance
      let starReward = 10; 
      if (lives === maxLives) starReward = 30; // 3 estrelas
      else if (lives >= maxLives / 2) starReward = 20; // 2 estrelas

      // Bônus da fase
      const levelBonus = selectedLevelId * 5;
      const totalStars = starReward + levelBonus;
      
      setStars(prev => prev + totalStars);
      
      // Pequena chance de ganhar PoeiraCoin jogando
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
                  // Auto-equip if category provided
                  if (categoryToEquip) {
                      handleEquipItem(categoryToEquip, id);
                  }
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

  const handleWatchAd = () => {
      setPoeiraCoins(prev => prev + 5);
  };

  return (
    <div className={`w-full h-full bg-slate-900 text-white ${equippedItems.CURSOR === 12 ? 'cursor-none' : ''}`}>
      {equippedItems.CURSOR === 12 && (
          <div className="fixed pointer-events-none z-[9999]" 
               style={{ 
                   left: 0, top: 0, 
                   transform: 'translate(var(--cursor-x), var(--cursor-y))',
                   width: '32px', height: '32px'
               }}
               ref={(el) => {
                   if(el) {
                       window.addEventListener('mousemove', (e) => {
                           el.style.setProperty('--cursor-x', `${e.clientX}px`);
                           el.style.setProperty('--cursor-y', `${e.clientY}px`);
                       });
                   }
               }}
          >
              🧹
          </div>
      )}

      {currentScene === 'MENU_PRINCIPAL' && (
        <MainMenu onNavigate={setCurrentScene} />
      )}
      
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

      {currentScene === 'OPCOES' && (
          <Options onBack={() => setCurrentScene('MENU_PRINCIPAL')} />
      )}
    </div>
  );
};

export default App;