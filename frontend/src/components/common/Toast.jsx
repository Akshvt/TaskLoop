import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const BORDER_COLOR = {
    success: '#00C896',
    warning: '#F4A836',
    error:   '#EF4444',
  };

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}>
        {toasts.map(toast => (
          <div
            key={toast.id}
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderLeft: `4px solid ${BORDER_COLOR[toast.type] || BORDER_COLOR.success}`,
              borderRadius: '6px',
              padding: '14px 18px',
              minWidth: '260px',
              maxWidth: '360px',
              fontFamily: '"Inter", sans-serif',
              fontSize: '14px',
              color: 'var(--color-text-primary)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              animation: 'slideInToast 0.2s ease',
            }}
          >
            {toast.message}
          </div>
        ))}
      </div>
      <style>{`
        @keyframes slideInToast {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
