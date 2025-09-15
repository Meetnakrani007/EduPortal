import React from 'react';

export default function ConfirmModal({ open, title = 'Are you sure?', message = 'This action cannot be undone.', confirmText = 'Delete', cancelText = 'Cancel', onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div style={{ background: '#fff', borderRadius: 14, padding: 20, width: 'min(520px, 92%)', boxShadow: '0 30px 60px rgba(15,23,42,0.35)', border: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: 0, fontWeight: 800, color: '#0f172a' }}>{title}</h3>
        <p style={{ margin: '10px 0 16px 0', color: '#475569' }}>{message}</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onCancel} style={{ background: '#e2e8f0', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: 10, padding: '8px 14px', fontWeight: 700 }}>{cancelText}</button>
          <button onClick={onConfirm} style={{ background: '#ef4444', color: '#fff', border: '1px solid #dc2626', borderRadius: 12, padding: '8px 16px', fontWeight: 800, boxShadow: '0 10px 18px rgba(239,68,68,.25)' }}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}


