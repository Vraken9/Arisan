import React, { useState } from 'react';
import { X, PlusCircle, Loader2, Info, CheckCircle2 } from 'lucide-react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from '../config/contracts';
import { getFactoryContract, getBrowserProviderAndSigner } from '../utils/web3';

export default function CreateGroupModal({ isOpen, onClose, onGroupCreated }) {
  const [contribution, setContribution] = useState('100');
  const [deposit, setDeposit] = useState('100');
  const [maxMembers, setMaxMembers] = useState('3');
  const [duration, setDuration] = useState('86400'); // 24 hours in seconds
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const potPerRound = Number(contribution || 0) * Number(maxMembers || 0);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError(null);

    const numContribution = parseFloat(contribution);
    const numDeposit = parseFloat(deposit);
    const numMembers = parseInt(maxMembers);

    if (numDeposit < numContribution) {
      setError('Deposit jaminan harus lebih besar atau sama dengan nominal kontribusi per ronde!');
      return;
    }

    if (numMembers < 2) {
      setError('Jumlah anggota minimal 2 orang.');
      return;
    }

    setLoading(true);

    try {
      const { signer } = await getBrowserProviderAndSigner();
      const factory = getFactoryContract(signer);

      const tokenAddress = CONTRACT_ADDRESSES.MockUSDT;
      const contributionWei = ethers.parseEther(contribution.toString());
      const depositWei = ethers.parseEther(deposit.toString());
      const roundDurationSec = BigInt(duration);

      const tx = await factory.createGroup(
        tokenAddress,
        contributionWei,
        depositWei,
        numMembers,
        roundDurationSec
      );

      const receipt = await tx.wait();

      // Find GroupCreated event to get the newly created group address
      let newGroupAddress = null;
      for (const log of receipt.logs) {
        try {
          const parsed = factory.interface.parseLog(log);
          if (parsed && parsed.name === 'GroupCreated') {
            newGroupAddress = parsed.args[0];
            break;
          }
        } catch (err) {
          // ignore non-matching logs
        }
      }

      if (onGroupCreated) {
        onGroupCreated(newGroupAddress, receipt.hash);
      }
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.reason || err.message || 'Gagal membuat grup arisan. Pastikan transaksi disetujui di MetaMask.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
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
              background: 'var(--bnb-gold-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#000',
            }}>
              <PlusCircle size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>
                Buat Grup Arisan Baru
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Deploy smart contract ArisanGroup independen on-chain
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

        {/* Form Body */}
        <form onSubmit={handleCreate} style={{ padding: '24px' }}>
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

          {/* Grid inputs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">
                <span>Kontribusi / Ronde</span>
                <span style={{ color: 'var(--bnb-gold)', fontSize: '0.75rem' }}>mUSDT</span>
              </label>
              <input
                type="number"
                className="form-input"
                value={contribution}
                onChange={(e) => {
                  setContribution(e.target.value);
                  if (parseFloat(deposit) < parseFloat(e.target.value)) {
                    setDeposit(e.target.value);
                  }
                }}
                min="1"
                step="any"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <span>Deposit Jaminan</span>
                <span style={{ color: 'var(--success)', fontSize: '0.75rem' }}>Harus &ge; Kontribusi</span>
              </label>
              <input
                type="number"
                className="form-input"
                value={deposit}
                onChange={(e) => setDeposit(e.target.value)}
                min={contribution}
                step="any"
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Jumlah Anggota</label>
              <input
                type="number"
                className="form-input"
                value={maxMembers}
                onChange={(e) => setMaxMembers(e.target.value)}
                min="2"
                max="50"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Durasi Setiap Ronde</label>
              <select
                className="form-input"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                style={{ background: '#090d16', color: '#fff', cursor: 'pointer' }}
              >
                <option value="600">10 Menit (Demo Cepat)</option>
                <option value="3600">1 Jam</option>
                <option value="86400">24 Jam (Standar)</option>
                <option value="604800">7 Hari (Mingguan)</option>
              </select>
            </div>
          </div>

          {/* Simulation Box */}
          <div style={{
            background: 'rgba(240, 185, 11, 0.05)',
            border: '1px solid rgba(240, 185, 11, 0.2)',
            borderRadius: '12px',
            padding: '16px',
            marginTop: '6px',
            marginBottom: '22px',
          }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--bnb-gold)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Info size={14} /> Simulasi Arisan
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.82rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Total Pot Pemenang:</span>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: '#fff' }}>
                  {potPerRound} mUSDT / ronde
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Total Jaminan Terkunci:</span>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--success)' }}>
                  {Number(deposit || 0) * Number(maxMembers || 0)} mUSDT
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ minWidth: '160px' }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Mendeploy...</span>
                </>
              ) : (
                <>
                  <PlusCircle size={16} />
                  <span>Deploy Grup Baru</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
