
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

  // Itens Equipados (Com migração de dados antigos se necessário)
  const [equippedItems, setEquippedItems] = useState<EquippedItems>(() => {
    const saved = localStorage.getItem('avf_equipped_items');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            // Migração/Fallback para estrutura nova se vier do formato antigo
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
            BASIC: 1,
            TURBO: 1,
            ROBOT: 1,
            ENERGY: 1,
            MEGA: 1
        };
    } catch {
        return { BASIC: 1, TURBO: 1, ROBOT: 1, ENERGY: 1, MEGA: 1 };
    }
  });

  // Verificação de Integridade (Garante que itens equipados são realmente do jogador)
  useEffect(() => {
    setEquippedItems(prev => {
        const next = { ...prev };
        let changed = false;

        // Verifica cada slot. Se o ID não estiver em ownedItems, desequipa.
        if (next.SKINS && !ownedItems.includes(next.SKINS)) { next.SKINS = null; changed = true; }
        if (next.EFEITOS && !ownedItems.includes(next.EFEITOS)) { next.EFEITOS = null; changed = true; }
        if (next.MUSIC && !ownedItems.includes(next.MUSIC)) { next.MUSIC = null; changed = true; }
        if (next.BACKGROUND && !ownedItems.includes(next.BACKGROUND)) { next.BACKGROUND = null; changed = true; }
        if (next.CURSOR && !ownedItems.includes(next.CURSOR)) { next.CURSOR = null; changed = true; }

        return changed ? next : prev;
    });
  }, [ownedItems]);

  // Salvar sempre que mudar (PERSISTÊNCIA AUTOMÁTICA)
  useEffect(() => {
    localStorage.setItem('avf_stars', stars.toString());
    localStorage.setItem('avf_poeiracoins', poeiraCoins.toString());
    localStorage.setItem('avf_upgrades', JSON.stringify(upgradeLevels));
    localStorage.setItem('avf_owned_items', JSON.stringify(ownedItems));
    localStorage.setItem('avf_equipped_items', JSON.stringify(equippedItems));
  }, [stars, poeiraCoins, upgradeLevels, ownedItems, equippedItems]);

  const navigateTo = (scene: SceneName) => {
    setCurrentScene(scene);
  };

  const handleSelectLevel = (levelId: number) => {
      setSelectedLevelId(levelId);
      navigateTo('GAME');
  };

  const handleNextLevel = () => {
      if (selectedLevelId < Constants.LEVELS.length) {
          setSelectedLevelId(prev => prev + 1);
          // O componente GameScene irá reiniciar automaticamente porque o levelId mudou
      } else {
          // Se já zerou tudo, volta para a seleção
          navigateTo('SELECAO_FASES');
      }
  };

  // Função para comprar upgrade (Lab)
  const handlePurchaseUpgrade = (type: TowerType) => {
    const currentLevel = upgradeLevels[type];
    if (currentLevel >= 3) return; // Max level

    const nextLevel = (currentLevel + 1);
    const cost = Constants.UPGRADE_COSTS[nextLevel as 2 | 3];

    if (stars >= cost) {
        setStars(prev => prev - cost);
        setUpgradeLevels(prev => ({
            ...prev,
            [type]: nextLevel
        }));
        return true; // Sucesso
    }
    return false; // Falha (sem dinheiro)
  };

  // Função para comprar item cosmético na Loja
  // Retorna 'success', 'insufficient_funds'
  const handleStorePurchase = (id: number, cost: number, currency: 'COINS' | 'STARS', isConsumable: boolean, categoryToEquip?: StoreCategory) => {
      if (currency === 'COINS') {
          if (poeiraCoins >= cost) {
              setPoeiraCoins(prev => prev - cost);
              if (!isConsumable) {
                  setOwnedItems(prev => [...prev, id]);
                  
                  // Auto-equip logic to avoid race condition of reading ownedItems immediately after
                  if (categoryToEquip) {
                      setEquippedItems(prev => {
                          const newState = { ...prev };
                          if (categoryToEquip === 'SKINS') newState.SKINS = id;
                          else if (categoryToEquip === 'EFEITOS') newState.EFEITOS = id;
                          else if (categoryToEquip === 'EXTRAS') {
                              if (id === 10) newState.MUSIC = id;
                              if (id === 11) newState.BACKGROUND = id;
                              if (id === 12) newState.CURSOR = id;
                          }
                          return newState;
                      });
                  }
              }
              return true;
          }
      } else {
          // Compra com Estrelas (Pacotes)
          if (stars >= cost) {
              setStars(prev => prev - cost);
              // Pacotes são consumíveis, não adicionamos ao ownedItems
              return true;
          }
      }
      return false;
  };

  // Função Específica para Pacotes (Estrelas -> Coins)
  const handleExchangeStars = (starCost: number, coinReward: number) => {
      if (stars >= starCost) {
          setStars(prev => prev - starCost);
          setPoeiraCoins(prev => prev + coinReward);
          return true;
      }
      return false;
  };

  // Equipar Item (Lógica de Slots)
  const handleEquipItem = (category: StoreCategory, id: number) => {
      if (!ownedItems.includes(id)) return false;

      setEquippedItems(prev => {
          const newState = { ...prev };
          
          if (category === 'SKINS') {
              // Se já estiver equipado, desequipa (toggle), senão equipa
              newState.SKINS = newState.SKINS === id ? null : id;
          } else if (category === 'EFEITOS') {
              newState.EFEITOS = newState.EFEITOS === id ? null : id;
          } else if (category === 'EXTRAS') {
              // Slots específicos para Extras com Toggle
              if (id === 10) newState.MUSIC = newState.MUSIC === id ? null : id;
              if (id === 11) newState.BACKGROUND = newState.BACKGROUND === id ? null : id;
              if (id === 12) newState.CURSOR = newState.CURSOR === id ? null : id;
          }
          return newState;
      });
      return true;
  };

  // Função chamada quando o jogador vence uma fase
  const handleLevelComplete = (remainingLives: number, maxLives: number) => {
    let reward = 10; // Base por completar
    if (remainingLives === maxLives) {
        reward += 20; // Bônus
    }
    setPoeiraCoins(prev => prev + reward);
    return reward; 
  };

  const handleWatchAd = () => {
    setPoeiraCoins(prev => prev + 5);
  };

  // --- Global Effects (Cursor) ---
  // Aplica o cursor personalizado se o item ID 12 estiver equipado no slot CURSOR
  const cursorStyle = equippedItems.CURSOR === 12 
    ? { cursor: "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIj48cGF0aCBkPSJNNCwyOCBMOCwyNCBNOCwyOCBMNCwyNCBNNiwzMiBMNiwyMCBMOCwxNiBMMjgsNCBNNiwyMCBMNCwxNiBMMjgsNCIiIHN0cm9rZT0iI2UzYTQ1MiIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSJub25lIi8+PC9zdmc+') 0 32, auto" } 
    : {};

  const renderScene = () => {
    switch (currentScene) {
      case 'MENU_PRINCIPAL':
        return <MainMenu onNavigate={navigateTo} />;
      
      case 'GAME':
        return (
            <GameScene 
                levelId={selectedLevelId}
                onBackToMenu={() => navigateTo('MENU_PRINCIPAL')} 
                upgradeLevels={upgradeLevels}
                equippedItems={equippedItems}
                onLevelComplete={handleLevelComplete}
                onNextLevel={handleNextLevel}
            />
        );
      
      case 'SELECAO_FASES':
        return <LevelSelect onBack={() => navigateTo('MENU_PRINCIPAL')} onSelectLevel={handleSelectLevel} />;
      
      case 'LABORATORIO':
        return (
            <Lab 
                onBack={() => navigateTo('MENU_PRINCIPAL')} 
                stars={stars}
                upgradeLevels={upgradeLevels}
                onPurchase={handlePurchaseUpgrade}
            />
        );

      case 'LOJA':
        return (
            <Store 
                onBack={() => navigateTo('MENU_PRINCIPAL')}
                poeiraCoins={poeiraCoins}
                stars={stars}
                ownedItems={ownedItems}
                equippedItems={equippedItems}
                onPurchase={handleStorePurchase}
                onExchangeStars={handleExchangeStars}
                onEquip={handleEquipItem}
                onWatchAd={handleWatchAd}
            />
        );
      
      case 'OPCOES':
        return <Options onBack={() => navigateTo('MENU_PRINCIPAL')} />;
      
      default:
        return <MainMenu onNavigate={navigateTo} />;
    }
  };

  return (
    <div className="w-screen h-screen flex justify-center items-center bg-zinc-900 text-white font-sans overflow-hidden" style={cursorStyle}>
      <div className="w-full h-full max-w-[1200px] max-h-[600px] aspect-video relative shadow-2xl overflow-hidden bg-slate-800 border-4 border-slate-700">
        {renderScene()}
      </div>
      
      <div className="fixed top-0 left-0 w-full h-full bg-black/90 z-[100] flex flex-col items-center justify-center p-8 text-center md:hidden landscape:hidden">
        <span className="text-4xl mb-4">📱➡️</span>
        <h2 className="text-xl font-bold text-yellow-400">Gire seu celular</h2>
        <p className="text-gray-300 mt-2">Este jogo foi desenhado para ser jogado na horizontal (Landscape).</p>
      </div>
    </div>
  );
};

export default App;
