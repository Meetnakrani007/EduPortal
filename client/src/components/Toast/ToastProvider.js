import React, { createContext, useContext, useCallback, useState, useRef, useEffect } from 'react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const remove = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const show = useCallback((type, message, duration = 2000) => {
    const id = ++idRef.current;
    setToasts(prev => [...prev, { id, type, message }]);
    if (duration > 0) {
      setTimeout(() => remove(id), duration);
    }
    return id;
  }, [remove]);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={remove} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

const ToastViewport = ({ toasts, onDismiss }) => {
  return (
    <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
      {toasts.map(t => (
        <ToastCard key={t.id} type={t.type} onDismiss={() => onDismiss(t.id)}>
          {t.message}
        </ToastCard>
      ))}
    </div>
  );
};

const ToastCard = ({ type, children, onDismiss }) => {
  const [mount, setMount] = useState(false);
  useEffect(() => {
    const r = requestAnimationFrame(() => setMount(true));
    return () => cancelAnimationFrame(r);
  }, []);

  const bg = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#2563eb';

  return (
    <div
      role="status"
      onClick={onDismiss}
      style={{
        minWidth: 260,
        maxWidth: 420,
        color: '#fff',
        background: bg,
        borderRadius: 10,
        padding: '10px 14px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
        cursor: 'pointer',
        transform: `translateY(${mount ? 0 : -20}px)`,
        opacity: mount ? 1 : 0,
        transition: 'transform 200ms ease, opacity 200ms ease'
      }}
    >
      {children}
    </div>
  );
};
