import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { StoreProvider } from '@/store/StoreContext';
import { AuthProvider } from '@/store/AuthContext';
import { UIProvider } from '@/store/UIContext';
import { ToastProvider } from '@/components/ui/Toast';
import { ConfirmProvider } from '@/components/ui/ConfirmDialog';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthGate } from '@/components/AuthGate';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element #root not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <StoreProvider>
          <AuthProvider>
            <ToastProvider>
              <ConfirmProvider>
                <AuthGate>
                  <UIProvider>
                    <App />
                  </UIProvider>
                </AuthGate>
              </ConfirmProvider>
            </ToastProvider>
          </AuthProvider>
        </StoreProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
);
