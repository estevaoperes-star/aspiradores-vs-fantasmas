import React, { Component, ErrorInfo, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// --- REMOÇÃO FORÇADA DO LOADER ---
// Executa imediatamente antes mesmo do React montar
const removeLoader = () => {
    const loader = document.getElementById('loading-overlay');
    if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => {
            loader.style.display = 'none';
            loader.classList.add('hidden-force');
        }, 500);
    }
};

// --- ERROR BOUNDARY ---
interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    // Se der erro, garante que o loader sumiu para mostrar o erro
    removeLoader();
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-slate-900 text-white p-8 font-sans z-50 relative">
          <h1 className="text-3xl font-bold text-red-500 mb-4">Ops! Algo deu errado.</h1>
          <p className="mb-4 text-gray-300">Ocorreu um erro na renderização do jogo.</p>
          <div className="bg-black p-4 rounded border border-gray-700 w-full max-w-2xl overflow-auto text-xs font-mono text-red-300">
             {this.state.error?.toString()}
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded font-bold transition-colors"
          >
            Recarregar Jogo
          </button>
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

// Inicializa React
const root = ReactDOM.createRoot(rootElement);

// Tenta renderizar
try {
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>
    );
    
    // Remove o loader logo após o comando de render
    // (Não espera o App montar, assume sucesso se chegou aqui)
    requestAnimationFrame(() => {
        setTimeout(removeLoader, 100); 
    });

} catch (e) {
    console.error("CRITICAL RENDER FAILURE", e);
    // Fallback manual se o React.render explodir
    const rootEl = document.getElementById('root');
    if (rootEl) rootEl.innerHTML = '<div style="color:red; padding:20px">Critical Engine Failure. Check Console.</div>';
    removeLoader();
}