import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { StoreProvider } from '@/store/StoreContext';
import { UIProvider } from '@/store/UIContext';
import { ToastProvider } from '@/components/ui/Toast';
import { ConfirmProvider } from '@/components/ui/ConfirmDialog';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element #root not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter>
      <StoreProvider>
        <ToastProvider>
          <ConfirmProvider>
            <UIProvider>
              <App />
            </UIProvider>
          </ConfirmProvider>
        </ToastProvider>
      </StoreProvider>
    </BrowserRouter>
  </StrictMode>,
);
