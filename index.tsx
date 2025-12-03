import React, { Component, ErrorInfo, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// --- ERROR BOUNDARY ---
interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("React Error Boundary caught:", error, errorInfo);
    
    // 1. Reportar ao Painel de Debug
    if (window.reportBootStep) {
        window.reportBootStep("React Crash: " + error.message.substring(0, 20), "ERROR");
    }

    // 2. Tentar remover o loader para que o usuário veja a mensagem de erro
    // Forçamos via estilo direto para garantir
    const loader = document.getElementById('loading-overlay');
    if (loader) {
        loader.style.display = 'none';
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-slate-900 text-white p-8 font-sans z-[10000] relative">
          <div className="bg-red-900/20 p-6 rounded-xl border-2 border-red-500 max-w-2xl w-full text-center">
            <h1 className="text-2xl font-bold text-red-500 mb-2">Erro Fatal</h1>
            <p className="text-gray-300 mb-4">O jogo não conseguiu iniciar.</p>
            <div className="bg-black p-4 rounded border border-gray-700 overflow-auto text-xs font-mono text-red-300 mb-4 max-h-64 text-left">
               {this.state.error?.toString() || "Erro desconhecido"}
            </div>
            <button 
                onClick={() => {
                    localStorage.clear();
                    window.location.reload();
                }} 
                className="px-6 py-3 bg-red-600 hover:bg-red-500 rounded font-bold transition-colors text-white uppercase tracking-widest"
            >
                Resetar Dados e Recarregar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
    throw new Error("Could not find root element to mount to");
}

if(window.reportBootStep) window.reportBootStep('ReactDOM Render', 'PENDING');

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

if(window.reportBootStep) window.reportBootStep('ReactDOM Render', 'OK');

// Backup para sinalização imediata
requestAnimationFrame(() => {
    // Isso roda depois que o React agendou a renderização inicial
    if(window.reportBootStep) window.reportBootStep('RAF Check', 'OK');
});