import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, ExternalLink, X } from 'lucide-react';

export default function Toast({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      zIndex: 2000,
      maxWidth: '420px',
      width: '100%',
      pointerEvents: 'none',
    }}>
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isWarning = toast.type === 'warning';

        const borderColor = isSuccess ? 'var(--success)' : isError ? 'var(--danger)' : isWarning ? 'var(--warning)' : 'var(--info)';
        const bgIcon = isSuccess ? <CheckCircle2 size={20} color="var(--success)" /> :
                       isError ? <XCircle size={20} color="var(--danger)" /> :
                       isWarning ? <AlertTriangle size={20} color="var(--warning)" /> :
                       <Info size={20} color="#60a5fa" />;

        return (
          <div
            key={toast.id}
            style={{
              pointerEvents: 'auto',
              background: '#0d131f',
              border: `1px solid ${borderColor}`,
              borderLeft: `5px solid ${borderColor}`,
              borderRadius: '12px',
              padding: '14px 16px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              animation: 'slideUp 0.25s ease-out',
            }}
          >
            <div style={{ flexShrink: 0, marginTop: '2px' }}>{bgIcon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '4px' }}>
                {toast.title}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.4', wordBreak: 'break-word' }}>
                {toast.message}
              </div>
              {toast.txHash && (
                <a
                  href={`https://testnet.bscscan.com/tx/${toast.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: 'var(--bnb-gold)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    marginTop: '6px',
                    textDecoration: 'none',
                  }}
                >
                  Lihat di BscScan <ExternalLink size={12} />
                </a>
              )}
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-dim)',
                cursor: 'pointer',
                padding: '2px',
                flexShrink: 0,
              }}
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
