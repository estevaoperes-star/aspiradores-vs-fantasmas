import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log("Index.tsx executing...");

const removeLoader = () => {
    const loader = document.getElementById('loading-overlay');
    if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => {
            loader.style.display = 'none';
        }, 500);
    }
};

const rootElement = document.getElementById('root');
if (!rootElement) {
    throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// Renderização Simples e Direta
try {
    root.render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
    
    // Sinaliza sucesso imediatamente após agendar o render
    console.log("Render scheduled.");
    requestAnimationFrame(() => {
        setTimeout(removeLoader, 100);
    });
} catch (e: any) {
    console.error("Render failed:", e);
    const loader = document.getElementById('loading-overlay');
    if(loader) loader.innerHTML = `<div style="color:red;padding:20px">Render Error: ${e.message}</div>`;
}