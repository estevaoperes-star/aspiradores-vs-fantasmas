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
    // Em caso de erro React, tentamos remover o loader para mostrar o erro na tela
    if ((window as any).finishLoading) (window as any).finishLoading();
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-slate-900 text-white p-8 font-sans z-50 relative">
          <div className="bg-red-900/20 p-6 rounded-xl border-2 border-red-500 max-w-2xl w-full">
            <h1 className="text-2xl font-bold text-red-500 mb-2">Erro de Execução</h1>
            <p className="text-gray-300 mb-4">O jogo encontrou um problema inesperado.</p>
            <div className="bg-black p-4 rounded border border-gray-700 overflow-auto text-xs font-mono text-red-300 mb-4 max-h-64">
               {this.state.error?.toString() || "Erro desconhecido"}
            </div>
            <button 
                onClick={() => {
                    localStorage.clear();
                    window.location.reload();
                }} 
                className="px-6 py-2 bg-red-600 hover:bg-red-500 rounded font-bold transition-colors text-white"
            >
                Resetar e Recarregar
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

console.log("Iniciando Renderização React...");

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

// Sinalização imediata pós-agendamento (Backup)
requestAnimationFrame(() => {
    if ((window as any).finishLoading) (window as any).finishLoading();
});