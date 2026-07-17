import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import { AppProvider } from './context/AppContext';
import { ToastProvider } from './context/ToastContext';
import './index.css';

// HashRouter (não BrowserRouter) é proposital: o GitHub Pages não tem como
// redirecionar rotas desconhecidas para o index.html, então rotas "limpas"
// quebram com F5 ou link direto. Com hash (#/pagina) tudo continua
// funcionando porque o servidor sempre entrega o mesmo index.html.
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <ToastProvider>
        <AppProvider>
          <App />
        </AppProvider>
      </ToastProvider>
    </HashRouter>
  </React.StrictMode>
);
