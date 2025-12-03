import React, { ErrorInfo, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// --- ERROR BOUNDARY ---
// Impede que um erro em um componente quebre toda a aplicação (Tela Branca/Preta)
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
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-slate-900 text-white p-8 font-sans">
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

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);