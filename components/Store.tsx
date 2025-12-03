import React, { useState, useRef } from 'react';
import { ArrowLeft, Palette, Sparkles, Package, Gift, Check, Tv, Music, Monitor, MousePointer2, Star, X, ShoppingCart, Shirt } from 'lucide-react';
import { StoreCategory, EquippedItems } from '../types';

interface StoreProps {
  onBack: () => void;
  poeiraCoins: number;
  stars: number;
  ownedItems: number[];
  equippedItems: EquippedItems;
  onPurchase: (id: number, cost: number, currency: 'COINS'|'STARS', isConsumable: boolean, categoryToEquip?: StoreCategory) => boolean;
  onExchangeStars: (starCost: number, coinReward: number) => boolean;
  onEquip: (category: StoreCategory, id: number) => boolean;
  onWatchAd: () => void;
}

interface Product {
    id: number;
    name: string;
    description?: string;
    price: number;
    currency: 'COINS' | 'STARS';
    rewardAmount?: number;
    image: React.ReactNode;
    consumable?: boolean;
    color: string;
}

export const Store: React.FC<StoreProps> = ({ 
    onBack, poeiraCoins, stars, ownedItems, equippedItems,
    onPurchase, onExchangeStars, onEquip, onWatchAd 
}) => {
  const [activeTab, setActiveTab] = useState<StoreCategory>('SKINS');
  const [feedback, setFeedback] = useState<{msg: string, type: 'success'|'error'} | null>(null);
  const [adLoading, setAdLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playStoreSound = (type: 'SELECT' | 'BUY' | 'EQUIP' | 'ERROR') => {
    try {
        if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();
        const ctx = audioCtxRef.current;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = ctx.currentTime;
        osc.connect(gain); gain.connect(ctx.destination);

        if (type === 'SELECT') {
            osc.frequency.setValueAtTime(300, t); osc.frequency.exponentialRampToValueAtTime(500, t + 0.05);
            gain.gain.setValueAtTime(0.05, t); gain.gain.linearRampToValueAtTime(0, t + 0.1);
            osc.start(t); osc.stop(t + 0.1);
        } else if (type === 'BUY') {
            osc.type = 'square'; osc.frequency.setValueAtTime(600, t); osc.frequency.linearRampToValueAtTime(1200, t + 0.1);
            gain.gain.setValueAtTime(0.1, t); gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
            osc.start(t); osc.stop(t + 0.4);
        } else if (type === 'EQUIP') {
            osc.type = 'sawtooth'; osc.frequency.setValueAtTime(200, t); osc.frequency.linearRampToValueAtTime(600, t + 0.15);
            gain.gain.setValueAtTime(0.05, t); gain.gain.linearRampToValueAtTime(0, t + 0.2);
            osc.start(t); osc.stop(t + 0.2);
        } else if (type === 'ERROR') {
            osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, t); osc.frequency.linearRampToValueAtTime(100, t + 0.15);
            gain.gain.setValueAtTime(0.1, t); gain.gain.linearRampToValueAtTime(0, t + 0.15);
            osc.start(t); osc.stop(t + 0.15);
        }
    } catch(e) {}
  };

  const items: Record<StoreCategory, Product[]> = {
      'SKINS': [
          { id: 1, name: 'Aspirador Neon', price: 50, currency: 'COINS', color: 'bg-slate-900', description: 'Brilha no escuro!', image: <div className="w-16 h-16 rounded-full border-4 border-cyan-400 shadow-[0_0_15px_#22d3ee] flex items-center justify-center text-3xl">💡</div> },
          { id: 2, name: 'Mega Asp. Chrome', price: 75, currency: 'COINS', color: 'bg-gray-300', description: 'Acabamento metálico.', image: <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-400 border-4 border-gray-500 shadow-lg flex items-center justify-center text-3xl">🤖</div> },
          { id: 3, name: 'Robô Futurista', price: 60, currency: 'COINS', color: 'bg-indigo-900', description: 'LEDs RGB Gamer.', image: <div className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 p-1"><div className="w-full h-full bg-black rounded-full flex items-center justify-center text-2xl">😎</div></div> },
      ],
      'EFEITOS': [
          { id: 4, name: 'Sucção Estrelas', price: 40, currency: 'COINS', color: 'bg-yellow-100', description: 'Partículas estelares.', image: <div className="text-4xl animate-pulse">✨</div> },
          { id: 5, name: 'Sucção Corações', price: 40, currency: 'COINS', color: 'bg-pink-100', description: 'Espalhe amor.', image: <div className="text-4xl animate-bounce">💖</div> },
          { id: 6, name: 'Poeira Dourada', price: 55, currency: 'COINS', color: 'bg-amber-100', description: 'VFX de morte especial.', image: <div className="text-4xl">🌫️✨</div> },
      ],
      'PACOTES': [
          { id: 7, name: 'Pack Pequeno', price: 10, currency: 'STARS', rewardAmount: 50, consumable: true, color: 'bg-orange-100', description: 'Troque Estrelas por Moedas.', image: <div className="relative"><Package size={48} className="text-orange-600" /><div className="absolute -bottom-2 -right-2 bg-yellow-400 text-xs font-bold px-1 rounded border border-black">+50</div></div> },
          { id: 8, name: 'Pack Médio', price: 20, currency: 'STARS', rewardAmount: 120, consumable: true, color: 'bg-blue-100', description: 'Melhor custo-benefício.', image: <div className="relative"><Package size={56} className="text-blue-600" /><div className="absolute -bottom-2 -right-2 bg-yellow-400 text-xs font-bold px-1 rounded border border-black">+120</div></div> },
          { id: 9, name: 'Pack Grande', price: 40, currency: 'STARS', rewardAmount: 300, consumable: true, color: 'bg-purple-100', description: 'Estoque cheio!', image: <div className="relative"><Package size={64} className="text-purple-600" /><div className="absolute -bottom-2 -right-2 bg-yellow-400 text-xs font-bold px-1 rounded border border-black">+300</div></div> },
      ],
      'EXTRAS': [
          { id: 10, name: 'Tema do Sótão', price: 30, currency: 'COINS', color: 'bg-teal-100', description: 'Nova música de fundo.', image: <Music size={40} className="text-teal-600" /> },
          { id: 11, name: 'Sala Arrumada', price: 20, currency: 'COINS', color: 'bg-emerald-100', description: 'Novo cenário de batalha.', image: <Monitor size={40} className="text-emerald-600" /> },
          { id: 12, name: 'Cursor Vassoura', price: 15, currency: 'COINS', color: 'bg-rose-100', description: 'Substitui a seta do mouse.', image: <MousePointer2 size={40} className="text-rose-600" /> },
      ]
  };

  const handleProductClick = (product: Product) => {
      playStoreSound('SELECT');
      const isOwned = ownedItems.includes(product.id);
      if (product.consumable || !isOwned) setSelectedProduct(product);
      else if (isOwned) handleEquip(product);
  };

  const confirmPurchase = () => {
      if (!selectedProduct) return;
      let success = false;
      if (selectedProduct.currency === 'STARS' && selectedProduct.rewardAmount) success = onExchangeStars(selectedProduct.price, selectedProduct.rewardAmount);
      else {
          const categoryToEquip = !selectedProduct.consumable ? activeTab : undefined;
          success = onPurchase(selectedProduct.id, selectedProduct.price, selectedProduct.currency, !!selectedProduct.consumable, categoryToEquip);
      }
      if (success) { playStoreSound('BUY'); showFeedback("Compra realizada!", 'success'); }
      else { playStoreSound('ERROR'); const currencyName = selectedProduct.currency === 'STARS' ? 'Estrelas' : 'PoeiraCoins'; showFeedback(`${currencyName} insuficientes!`, 'error'); }
      setSelectedProduct(null);
  };

  const handleEquip = (product: Product) => {
      if (!ownedItems.includes(product.id)) return;
      onEquip(activeTab, product.id);
      playStoreSound('EQUIP');
  };

  const handleAdClick = () => {
      if(adLoading) return;
      playStoreSound('SELECT');
      setAdLoading(true);
      setTimeout(() => { onWatchAd(); showFeedback("+5 PoeiraCoins!", 'success'); setAdLoading(false); playStoreSound('BUY'); }, 1500);
  };

  const showFeedback = (msg: string, type: 'success' | 'error') => { setFeedback({ msg, type }); setTimeout(() => setFeedback(null), 2000); };

  return (
    <div className="w-full h-full bg-[#fdf6e3] font-sans flex flex-col relative overflow-hidden select-none">
        {feedback && (<div className={`absolute top-24 left-1/2 transform -translate-x-1/2 z-[60] px-6 py-3 rounded-full font-black text-white shadow-xl animate-bounce ${feedback.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>{feedback.msg}</div>)}

        {selectedProduct && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
                <div className="bg-white rounded-3xl border-4 border-slate-800 shadow-[0_10px_0_rgba(0,0,0,0.3)] w-full max-w-sm overflow-hidden transform scale-100 transition-all">
                    <div className="bg-slate-100 p-6 flex flex-col items-center border-b-2 border-slate-200">
                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest mb-4">Confirmar Compra</h3>
                        <div className="w-24 h-24 mb-4 flex items-center justify-center animate-bounce-slow">{selectedProduct.image}</div>
                        <h2 className="text-2xl font-black text-slate-800 text-center leading-none mb-1">{selectedProduct.name}</h2>
                        <p className="text-slate-500 font-bold text-sm">{selectedProduct.description}</p>
                    </div>
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6 bg-slate-50 p-3 rounded-xl border border-slate-200">
                            <span className="font-bold text-slate-500 uppercase text-xs">Preço:</span>
                            <div className="flex items-center text-2xl font-black">{selectedProduct.currency === 'STARS' ? <Star size={24} className="text-yellow-400 fill-yellow-400 mr-2"/> : <span className="mr-2">🪙</span>}<span className={selectedProduct.currency === 'STARS' ? 'text-yellow-600' : 'text-slate-800'}>{selectedProduct.price}</span></div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setSelectedProduct(null)} className="flex-1 py-4 rounded-xl font-black text-slate-500 border-b-4 border-slate-300 bg-slate-200 active:border-b-0 active:translate-y-1 transition-all">CANCELAR</button>
                            <button onClick={confirmPurchase} className="flex-1 py-4 rounded-xl font-black text-white border-b-4 border-green-700 bg-green-500 active:border-b-0 active:translate-y-1 transition-all shadow-lg flex items-center justify-center"><ShoppingCart size={20} className="mr-2"/> COMPRAR</button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* --- CABEÇALHO --- */}
        <div className="h-auto md:h-24 bg-white border-b-8 border-orange-200 flex flex-col md:flex-row items-center justify-between p-2 md:px-6 z-20 shadow-sm relative">
             <div className="flex items-center w-full md:w-auto justify-between mb-2 md:mb-0">
                <div className="flex items-center">
                    <button onClick={onBack} className="p-2 md:p-3 bg-orange-500 rounded-2xl mr-4 text-white border-b-4 border-orange-700 active:border-b-0 active:translate-y-1 shadow-lg">
                        <ArrowLeft size={24} strokeWidth={3} />
                    </button>
                    <div className="flex flex-col">
                        <h2 className="text-xl md:text-3xl font-black text-orange-500 italic tracking-tighter drop-shadow-sm leading-none">LOJA</h2>
                        <span className="text-xs font-bold text-orange-300 uppercase tracking-widest hidden md:block">Gaste suas moedas aqui!</span>
                    </div>
                </div>
                {/* Mobile Currency Display */}
                <div className="flex md:hidden items-center bg-yellow-400 px-3 py-1 rounded-full border-2 border-yellow-500 shadow-inner">
                    <span className="text-lg mr-1">🪙</span>
                    <span className="text-lg font-black text-yellow-900">{poeiraCoins}</span>
                </div>
             </div>

             <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto justify-end">
                 {activeTab === 'PACOTES' && (<div className="flex items-center bg-slate-800 px-2 py-1 rounded-full border-2 border-slate-600"><Star size={14} className="text-yellow-400 fill-yellow-400 mr-1"/><span className="text-white font-bold text-sm">{stars}</span></div>)}
                 <button onClick={handleAdClick} disabled={adLoading} className={`flex items-center bg-purple-600 px-2 md:px-3 py-1 md:py-2 rounded-xl border-b-4 border-purple-800 active:border-b-0 active:translate-y-1 transition-all text-white ${adLoading ? 'opacity-70' : 'shadow-lg'}`}>
                     <div className="mr-1 md:mr-2 animate-pulse">{adLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Tv size={16} />}</div>
                     <div className="flex flex-col leading-none items-start"><span className="text-[9px] font-bold opacity-80 uppercase">Ads</span><span className="text-xs font-black">+5 🪙</span></div>
                 </button>
                 {/* Desktop Currency Display */}
                 <div className="hidden md:flex items-center bg-yellow-400 px-4 py-2 rounded-full border-4 border-yellow-500 shadow-inner">
                     <div className="w-10 h-10 bg-yellow-300 rounded-full border-2 border-yellow-600 flex items-center justify-center mr-2 shadow-sm"><span className="text-2xl">🪙</span></div>
                     <div className="flex flex-col items-end leading-none"><span className="text-2xl font-black text-yellow-900">{poeiraCoins}</span></div>
                 </div>
             </div>
        </div>

        {/* --- ABAS --- */}
        <div className="flex justify-start md:justify-center space-x-2 mt-2 md:mt-8 px-4 z-10 relative overflow-x-auto pb-2 custom-scrollbar">
            <TabButton label="Skins" icon={<Palette size={18}/>} active={activeTab === 'SKINS'} onClick={() => { setActiveTab('SKINS'); playStoreSound('SELECT'); }} color="bg-rose-500" />
            <TabButton label="Efeitos" icon={<Sparkles size={18}/>} active={activeTab === 'EFEITOS'} onClick={() => { setActiveTab('EFEITOS'); playStoreSound('SELECT'); }} color="bg-violet-500" />
            <TabButton label="Pacotes" icon={<Package size={18}/>} active={activeTab === 'PACOTES'} onClick={() => { setActiveTab('PACOTES'); playStoreSound('SELECT'); }} color="bg-amber-500" />
            <TabButton label="Extras" icon={<Gift size={18}/>} active={activeTab === 'EXTRAS'} onClick={() => { setActiveTab('EXTRAS'); playStoreSound('SELECT'); }} color="bg-emerald-500" />
        </div>

        {/* --- ÁREA PRINCIPAL --- */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 relative z-0 mt-2 custom-scrollbar">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 pb-20">
                {items[activeTab].map((product) => {
                    const isOwned = ownedItems.includes(product.id);
                    let isEquipped = false;
                    if (activeTab === 'SKINS') isEquipped = equippedItems.SKINS === product.id;
                    else if (activeTab === 'EFEITOS') isEquipped = equippedItems.EFEITOS === product.id;
                    else if (activeTab === 'EXTRAS') {
                        if (product.id === 10) isEquipped = equippedItems.MUSIC === product.id;
                        if (product.id === 11) isEquipped = equippedItems.BACKGROUND === product.id;
                        if (product.id === 12) isEquipped = equippedItems.CURSOR === product.id;
                    }
                    const isConsumable = !!product.consumable;
                    const isStarCost = product.currency === 'STARS';
                    let btnText = "COMPRAR";
                    let btnIcon = isStarCost ? <Star size={16} className="mr-1 fill-yellow-400"/> : <span className="mr-1">🪙</span>;
                    let btnClass = isStarCost ? "bg-blue-600 border-blue-800 text-white" : "bg-green-500 border-green-700 text-white";
                    let isDisabled = false;
                    if (!isConsumable && isOwned) {
                        if (isEquipped) { btnText = "USANDO"; btnIcon = <Check size={16} className="mr-1" />; btnClass = "bg-yellow-400 border-yellow-600 text-yellow-900"; isDisabled = true; } 
                        else { btnText = "EQUIPAR"; btnIcon = <Shirt size={16} className="mr-1" />; btnClass = "bg-cyan-500 border-cyan-700 text-white"; }
                    }
                    return (
                        <div key={product.id} className="relative group touch-manipulation">
                            <div className={`${product.color} h-48 md:h-64 rounded-3xl border-4 border-white shadow-xl flex flex-col items-center p-3 md:p-4 relative overflow-hidden`}>
                                {isOwned && !isConsumable && (<div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full shadow-md z-10"><Check size={14} strokeWidth={4} /></div>)}
                                <div className="flex-1 flex items-center justify-center transform transition-transform duration-300">{product.image}</div>
                                <div className="w-full text-center mb-2">
                                    <h3 className={`font-black text-sm md:text-lg leading-tight ${[1, 3].includes(product.id) ? 'text-white' : 'text-slate-800'}`}>{product.name}</h3>
                                    <p className={`hidden md:block text-[10px] font-bold opacity-70 leading-tight mt-1 ${[1, 3].includes(product.id) ? 'text-white' : 'text-slate-600'}`}>{product.description}</p>
                                </div>
                                <button onClick={() => handleProductClick(product)} disabled={isDisabled} className={`w-full py-2 md:py-2 rounded-xl font-black text-xs md:text-sm shadow-md border-b-4 transition-all active:border-b-0 active:translate-y-1 flex items-center justify-center ${btnClass}`}>
                                    {btnIcon} {isOwned && !isConsumable && !isEquipped ? btnText : (isEquipped ? btnText : (<span>{product.price}</span>))}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
        <style>{`
            .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.05); }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
            .animate-bounce-slow { animation: bounce 2s infinite; }
            .animate-fade-in { animation: fadeIn 0.2s ease-out; }
            @keyframes fadeIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        `}</style>
    </div>
  );
};

const TabButton = ({ label, icon, active, onClick, color }: any) => (
    <button onClick={onClick} className={`flex items-center px-3 md:px-4 py-2 md:py-3 rounded-t-2xl font-black text-xs md:text-sm transition-all whitespace-nowrap ${active ? `${color} text-white shadow-lg transform -translate-y-1` : 'bg-slate-200 text-slate-500'}`}>
        <span className="mr-1 md:mr-2">{icon}</span>{label}
    </button>
);