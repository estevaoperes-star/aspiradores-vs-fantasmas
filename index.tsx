import React, { Component, ReactNode, Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';

// Carregamento preguiçoso do App
const App = lazy(() => import('./App'));

// Definição Mínima de Tipos Globais
declare global {
    interface Window {
        mountGameApp: () => void;
    }
}

// --- ERROR BOUNDARY SIMPLIFICADO ---
interface Props { children: ReactNode; }
interface State { hasError: boolean; }

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("Game Error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-slate-900 text-white p-6">
           <h2 className="text-xl font-bold text-red-400 mb-4">Algo deu errado.</h2>
           <button 
             onClick={() => window.location.reload()} 
             className="px-6 py-3 bg-blue-600 rounded-lg font-bold hover:bg-blue-500 transition-colors"
           >
             Reiniciar Jogo
           </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ==============================================================
// FUNÇÃO DE MONTAGEM
// ==============================================================
let rootInstance: ReactDOM.Root | null = null;

export function mountAspiradoresVsFantasmas() {
    try {
        let rootElement = document.getElementById('game-root');
        
        // Robustez: cria o container se não existir (raro em prod, mas seguro)
        if (!rootElement) {
            rootElement = document.createElement('div');
            rootElement.id = 'game-root';
            document.body.appendChild(rootElement);
        }

        if (rootInstance) return;

        rootInstance = ReactDOM.createRoot(rootElement);
        
        rootInstance.render(
          <React.StrictMode>
            <ErrorBoundary>
              <Suspense fallback={null}>
                <App />
              </Suspense>
            </ErrorBoundary>
          </React.StrictMode>
        );

    } catch (e) {
        console.error("Mount Failed:", e);
    }
}

// Expõe para o window (caso necessário por scripts externos) e inicia
(window as any).mountGameApp = mountAspiradoresVsFantasmas;
mountAspiradoresVsFantasmas();