import React, { useEffect } from 'react';

const Notification = ({ message, type = 'error', onClose, duration }) => {
  useEffect(() => {
    if (duration && onClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const isError = type === 'error';
  return (
    <div style={{
      background: isError ? '#fdecea' : '#e6ffed',
      color: isError ? '#b71c1c' : '#256029',
      border: `1px solid ${isError ? '#f5c6cb' : '#b7eb8f'}`,
      padding: '12px 20px',
      borderRadius: 4,
      marginBottom: 16,
      position: 'relative',
      zIndex: 1000,
      maxWidth: 400
    }}>
      {message}
      {onClose && (
        <button onClick={onClose} style={{
          position: 'absolute', right: 8, top: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'inherit'
        }}>×</button>
      )}
    </div>
  );
};

export default Notification;