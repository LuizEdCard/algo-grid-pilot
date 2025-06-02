import React, { useEffect, useState } from 'react';

/**
 * Painel de erros globais para debug visual no frontend.
 * Exibe erros JS e promessas não tratadas capturados em window.
 */
const GlobalErrorPanel: React.FC = () => {
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      setErrors((prev) => [...prev, `Erro JS: ${event.message}`]);
    };
    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      setErrors((prev) => [...prev, `Promise não tratada: ${event.reason}`]);
    };
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onUnhandledRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
  }, []);

  if (errors.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      width: '100vw',
      background: 'rgba(200,0,0,0.9)',
      color: 'white',
      zIndex: 9999,
      fontSize: 14,
      padding: 8,
      maxHeight: '30vh',
      overflowY: 'auto',
    }}>
      <strong>Erros Globais:</strong>
      <ul style={{ margin: 0, paddingLeft: 16 }}>
        {errors.map((err, i) => <li key={i}>{err}</li>)}
      </ul>
    </div>
  );
};

export default GlobalErrorPanel;
