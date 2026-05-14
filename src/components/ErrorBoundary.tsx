import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/** Storage key owned by StoreContext — kept in sync intentionally. */
const STORAGE_KEY = 'munshot-os-data-v1';

/**
 * Root error boundary. A render/runtime crash should never leave the user
 * staring at a blank page — show the error and offer recovery actions,
 * including clearing potentially-corrupt localStorage state.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Munshot OS crashed:', error, info.componentStack);
  }

  private reload = (): void => {
    window.location.reload();
  };

  private resetAndReload = (): void => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    window.location.reload();
  };

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily:
            'Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
          background:
            'radial-gradient(at 0% 0%, rgba(99,102,241,0.12) 0, transparent 50%), radial-gradient(at 100% 100%, rgba(236,72,153,0.10) 0, transparent 50%), #f8fafc',
        }}
      >
        <div
          style={{
            maxWidth: '560px',
            width: '100%',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '20px',
            boxShadow: '0 20px 60px -20px rgba(15,23,42,0.25)',
            padding: '32px',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '18px',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background:
                  'linear-gradient(135deg,#6366f1,#a855f7,#ec4899)',
              }}
            />
            <span style={{ fontWeight: 800, color: '#0f172a' }}>
              Munshot OS
            </span>
          </div>
          <h1
            style={{
              fontSize: '20px',
              fontWeight: 800,
              color: '#0f172a',
              margin: '0 0 8px',
            }}
          >
            Something went wrong
          </h1>
          <p
            style={{
              fontSize: '14px',
              color: '#64748b',
              margin: '0 0 16px',
              lineHeight: 1.6,
            }}
          >
            The dashboard hit an unexpected error and couldn’t render. Try
            reloading. If it keeps happening, clearing the locally-saved data
            will reset the app to the demo dataset.
          </p>
          <pre
            style={{
              fontSize: '12px',
              color: '#b91c1c',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '12px',
              padding: '12px',
              margin: '0 0 20px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              maxHeight: '180px',
              overflow: 'auto',
            }}
          >
            {error.message}
            {error.stack ? `\n\n${error.stack}` : ''}
          </pre>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={this.reload}
              style={{
                flex: 1,
                minWidth: '140px',
                padding: '10px 16px',
                borderRadius: '12px',
                border: 'none',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
                color: '#ffffff',
                background: 'linear-gradient(135deg,#4f46e5,#4338ca)',
              }}
            >
              Reload page
            </button>
            <button
              type="button"
              onClick={this.resetAndReload}
              style={{
                flex: 1,
                minWidth: '140px',
                padding: '10px 16px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
                color: '#475569',
                background: '#ffffff',
              }}
            >
              Clear saved data & reload
            </button>
          </div>
        </div>
      </div>
    );
  }
}
