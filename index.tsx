import React, { Component, ErrorInfo, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Interface global
declare global {
    interface Window {
        mountGame: () => void;
        reportBootStep: (step: string, status: 'PENDING' | 'OK' | 'ERROR') => void;
    }
}

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
    if (window.reportBootStep) {
        window.reportBootStep("CRASH: " + error.message.substring(0, 20), "ERROR");
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-slate-900 text-white p-8 font-sans z-[10000] relative">
           <h1 className="text-2xl font-bold text-red-500 mb-2">Erro Fatal de Renderização</h1>
           <p>{this.state.error?.toString()}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- FUNÇÃO DE MONTAGEM GLOBAL ---
let root: ReactDOM.Root | null = null;

window.mountGame = () => {
    try {
        if (window.reportBootStep) window.reportBootStep('Mount Game Triggered', 'OK');
        
        const rootElement = document.getElementById('root');
        if (!rootElement) {
            if (window.reportBootStep) window.reportBootStep('Root Element Missing', 'ERROR');
            return;
        }

        if (root) {
            // Já montado, não faz nada ou força update
             if (window.reportBootStep) window.reportBootStep('React Already Mounted', 'OK');
             return;
        }

        if (window.reportBootStep) window.reportBootStep('Creating React Root', 'PENDING');
        root = ReactDOM.createRoot(rootElement);
        
        root.render(
          <React.StrictMode>
            <ErrorBoundary>
              <App />
            </ErrorBoundary>
          </React.StrictMode>
        );

        if (window.reportBootStep) window.reportBootStep('React Render Call', 'OK');

    } catch (e: any) {
        console.error("Mount Error:", e);
        if (window.reportBootStep) window.reportBootStep('Mount Exception: ' + e.message, 'ERROR');
    }
};

// Tenta montar automaticamente ao carregar o script
if (window.reportBootStep) window.reportBootStep('Index Script Loaded', 'OK');
window.mountGame();