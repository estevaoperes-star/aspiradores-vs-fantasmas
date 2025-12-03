import React, { Component, ErrorInfo, ReactNode, Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';

console.log("[INDEX.TSX] Módulo carregado. Preparando montagem.");

// Carregamento preguiçoso do App
const App = lazy(() => import('./App'));

// Definição de Tipos Globais para TypeScript
declare global {
    interface Window {
        mountGameApp: () => void; // A variável que o Boot procura
        reportBootStep: (step: string, status: 'PENDING' | 'OK' | 'ERROR') => void;
    }
}

// --- ERROR BOUNDARY ---
interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

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
    if (window.reportBootStep) {
        window.reportBootStep("CRASH: " + error.message.substring(0, 15), "ERROR");
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-slate-900 text-white p-8 z-[10000] relative">
           <h1 className="text-2xl font-bold text-red-500 mb-2">Erro Fatal no Jogo</h1>
           <div className="bg-black/50 p-4 rounded text-xs font-mono border border-red-800">
              {this.state.error?.toString()}
           </div>
           <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-blue-600 rounded font-bold">Recarregar</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ==============================================================
// 2) FUNÇÃO ÚNICA DE MONTAGEM DO JOGO
// ==============================================================
let rootInstance: ReactDOM.Root | null = null;

export function mountAspiradoresVsFantasmas() {
    try {
        if (window.reportBootStep) window.reportBootStep('mountAspiradoresVsFantasmas Called', 'OK');
        
        // 1. Garantir que exista um container (criar se não existir)
        let rootElement = document.getElementById('game-root');
        if (!rootElement) {
            console.warn("Container #game-root não encontrado. Criando automaticamente.");
            rootElement = document.createElement('div');
            rootElement.id = 'game-root';
            document.body.appendChild(rootElement);
        }

        // 2. Verificar se já está montado para evitar duplicidade
        if (rootInstance) {
             console.warn("React já foi inicializado. Ignorando nova montagem.");
             if (window.reportBootStep) window.reportBootStep('React Already Mounted', 'OK');
             return;
        }

        // 3. Inicializar React nesse container
        if (window.reportBootStep) window.reportBootStep('Creating React Root', 'PENDING');
        rootInstance = ReactDOM.createRoot(rootElement);
        
        // 4. Renderizar a cena inicial
        rootInstance.render(
          <React.StrictMode>
            <ErrorBoundary>
              <Suspense fallback={
                  <div className="flex flex-col items-center justify-center h-screen w-full bg-slate-900 text-cyan-400 font-bold font-mono">
                      <div className="text-xl animate-pulse mb-4">CARREGANDO MOTOR...</div>
                      <div className="w-48 h-1 bg-slate-800 rounded overflow-hidden">
                          <div className="h-full bg-cyan-500 animate-[width_2s_ease-in-out_infinite]" style={{width: '50%'}}></div>
                      </div>
                  </div>
              }>
                <App />
              </Suspense>
            </ErrorBoundary>
          </React.StrictMode>
        );

        if (window.reportBootStep) window.reportBootStep('React Render Triggered', 'OK');

    } catch (e: any) {
        console.error("Critical Mount Error:", e);
        if (window.reportBootStep) window.reportBootStep('Mount Exception', 'ERROR');
        
        // Fallback visual de erro
        const rootElement = document.getElementById('game-root');
        if (rootElement) {
            rootElement.innerHTML = `<div style="color:red; padding:20px; font-family:monospace; background: black;">
                FATAL BOOT ERROR: ${e.message}<br/>
                Por favor, recarregue a página.
            </div>`;
        }
    }
}

// ==============================================================
// CONEXÃO COM O BOOT (Index.html)
// ==============================================================

// Atribui a função à variável que o index.html espera encontrar
(window as any).mountGameApp = mountAspiradoresVsFantasmas;
console.log("[INDEX.TSX] window.mountGameApp conectada com sucesso.");

// Reporta sucesso do carregamento do script
if (window.reportBootStep) window.reportBootStep('Index Script Executed', 'OK');

// Tenta iniciar imediatamente (Auto-boot)
mountAspiradoresVsFantasmas();