import React from 'react';
import { 
  Wallet, 
  Droplets, 
  PlusCircle, 
  ExternalLink, 
  Check, 
  Copy, 
  Layers, 
  AlertCircle 
} from 'lucide-react';
import { shortenAddress } from '../utils/web3';

export default function Navbar({
  account,
  bnbBalance,
  usdtBalance,
  isCorrectNetwork,
  onConnect,
  onSwitchNetwork,
  onOpenCreateModal,
  onOpenFaucetModal,
}) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    if (!account) return;
    navigator.clipboard.writeText(account);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'rgba(7, 9, 14, 0.85)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-subtle)',
      padding: '14px 28px',
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '20px',
        flexWrap: 'wrap',
      }}>
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'var(--bnb-gold-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 18px rgba(240, 185, 11, 0.35)',
          }}>
            <Layers size={24} color="#000" strokeWidth={2.4} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>
                Arisan<span style={{ color: 'var(--bnb-gold)' }}>Chain</span>
              </span>
              <span style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '6px',
                background: 'rgba(240, 185, 11, 0.15)',
                color: 'var(--bnb-gold)',
                border: '1px solid rgba(240, 185, 11, 0.3)',
              }}>
                BSC TESTNET
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Trustless On-Chain Rotating Savings
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Faucet Button (Opsi B) */}
          <button 
            className="btn btn-faucet"
            onClick={onOpenFaucetModal}
            title="Dapatkan Mock USDT gratis untuk mencoba aplikasi"
          >
            <Droplets size={16} />
            <span>Faucet mUSDT</span>
          </button>

          {/* Create Group Button */}
          <button 
            className="btn btn-primary"
            onClick={onOpenCreateModal}
          >
            <PlusCircle size={17} />
            <span>Buat Grup Baru</span>
          </button>

          {/* Network Alert or Switcher */}
          {account && !isCorrectNetwork && (
            <button 
              className="btn btn-danger"
              onClick={onSwitchNetwork}
            >
              <AlertCircle size={16} />
              <span>Pindah ke BSC Testnet</span>
            </button>
          )}

          {/* Wallet Button */}
          {!account ? (
            <button 
              className="btn btn-secondary"
              onClick={onConnect}
              style={{ border: '1px solid var(--bnb-gold)', color: 'var(--bnb-gold)' }}
            >
              <Wallet size={16} />
              <span>Connect Wallet</span>
            </button>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'rgba(16, 22, 35, 0.9)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '6px 14px',
            }}>
              {/* Balances */}
              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--bnb-gold)' }}>
                  {Number(usdtBalance).toLocaleString('id-ID', { maximumFractionDigits: 1 })} mUSDT
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {Number(bnbBalance).toFixed(4)} tBNB
                </span>
              </div>

              {/* Account Address pill */}
              <button
                onClick={handleCopy}
                title="Klik untuk menyalin alamat wallet"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  color: 'var(--text-main)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                <div className="pulse-dot" style={{ color: 'var(--success)' }} />
                <span>{shortenAddress(account, 4)}</span>
                {copied ? <Check size={14} color="var(--success)" /> : <Copy size={14} color="var(--text-dim)" />}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
