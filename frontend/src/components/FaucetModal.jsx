import React, { useState } from 'react';
import { Droplets, X, Check, Loader2, ExternalLink, ShieldCheck } from 'lucide-react';
import { mintMockUSDT } from '../utils/web3';

export default function FaucetModal({ isOpen, onClose, currentAccount, onMintSuccess }) {
  const [amount, setAmount] = useState('1000');
  const [recipient, setRecipient] = useState(currentAccount || '');
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [error, setError] = useState(null);

  React.useEffect(() => {
    if (currentAccount && !recipient) {
      setRecipient(currentAccount);
    }
  }, [currentAccount]);

  if (!isOpen) return null;

  const handleMint = async (e) => {
    e.preventDefault();
    if (!recipient) {
      setError('Harap masukkan alamat penerima token.');
      return;
    }
    setError(null);
    setLoading(true);
    setTxHash(null);

    try {
      const receipt = await mintMockUSDT(recipient, amount);
      setTxHash(receipt.hash);
      if (onMintSuccess) onMintSuccess(receipt.hash);
    } catch (err) {
      console.error(err);
      setError(err.reason || err.message || 'Gagal melakukan mint token. Pastikan MetaMask terhubung ke BSC Testnet.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        {/* Modal Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(240, 185, 11, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--bnb-gold)',
            }}>
              <Droplets size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
                Testnet Token Faucet (mUSDT)
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Mint token percobaan gratis untuk mencoba arisan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-dim)',
              cursor: 'pointer',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleMint} style={{ padding: '24px' }}>
          {error && (
            <div style={{
              background: 'var(--danger-bg)',
              border: '1px solid rgba(246, 70, 93, 0.3)',
              borderRadius: '10px',
              padding: '12px',
              marginBottom: '18px',
              fontSize: '0.85rem',
              color: '#ff8a9a',
            }}>
              {error}
            </div>
          )}

          {txHash && (
            <div style={{
              background: 'var(--success-bg)',
              border: '1px solid rgba(14, 203, 129, 0.3)',
              borderRadius: '10px',
              padding: '14px',
              marginBottom: '18px',
              fontSize: '0.85rem',
              color: 'var(--success)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                <Check size={18} /> Berhasil Mint {amount} mUSDT!
              </div>
              <a
                href={`https://testnet.bscscan.com/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: 'var(--bnb-gold)',
                  marginTop: '6px',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  textDecoration: 'none',
                }}
              >
                Lihat transaksi di BscScan <ExternalLink size={12} />
              </a>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">
              <span>Alamat Wallet Penerima</span>
              {currentAccount && (
                <button
                  type="button"
                  onClick={() => setRecipient(currentAccount)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--bnb-gold)',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Gunakan Wallet Saya
                </button>
              )}
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="0x..."
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              required
              style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Nominal Token (mUSDT)</label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              {['500', '1000', '5000'].map((preset) => (
                <button
                  type="button"
                  key={preset}
                  className="btn btn-secondary"
                  onClick={() => setAmount(preset)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    fontSize: '0.82rem',
                    borderColor: amount === preset ? 'var(--bnb-gold)' : 'var(--border-subtle)',
                    color: amount === preset ? 'var(--bnb-gold)' : 'var(--text-muted)',
                  }}
                >
                  +{preset}
                </button>
              ))}
            </div>
            <input
              type="number"
              className="form-input"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1"
              max="50000"
              required
            />
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '10px',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '20px',
            border: '1px solid var(--border-subtle)',
          }}>
            <ShieldCheck size={18} color="var(--bnb-gold)" />
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              Token MockUSDT ini adalah token simulasi di BSC Testnet yang tidak memiliki nilai finansial nyata, khusus untuk tujuan pengujian & demo hackathon.
            </span>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Tutup
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ minWidth: '150px' }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <Droplets size={16} />
                  <span>Mint {amount} mUSDT</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
