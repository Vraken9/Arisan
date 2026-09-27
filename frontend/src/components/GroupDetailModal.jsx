import React, { useState, useEffect } from 'react';
import { 
  X, 
  ExternalLink, 
  Users, 
  Clock, 
  ShieldCheck, 
  Award, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Sparkles, 
  KeyRound, 
  ArrowRight,
  TrendingUp,
  Coins,
  AlertTriangle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ethers } from 'ethers';
import { GROUP_STATE_MAP, CONTRACT_ADDRESSES } from '../config/contracts';
import { 
  getGroupContract, 
  getMockUSDTContract, 
  getBrowserProviderAndSigner, 
  getReadOnlyProvider,
  shortenAddress, 
  formatDuration, 
  formatTimestamp,
  generateRandomSecret, 
  computeCommitmentHash 
} from '../utils/web3';

export default function GroupDetailModal({ 
  groupAddress, 
  isOpen, 
  onClose, 
  currentAccount, 
  onTxSuccess 
}) {
  const [groupData, setGroupData] = useState(null);
  const [memberInfo, setMemberInfo] = useState(null);
  const [payoutOrder, setPayoutOrder] = useState([]);
  const [roundContributors, setRoundContributors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionStatus, setActionStatus] = useState('');
  const [error, setError] = useState(null);

  // Fetch full live group data
  const loadGroupDetails = async () => {
    if (!groupAddress) return;
    try {
      let provider;
      try {
        const res = await getBrowserProviderAndSigner();
        provider = res.provider;
      } catch (e) {
        provider = getReadOnlyProvider();
      }
      const group = getGroupContract(groupAddress, provider);

      const info = await group.getGroupInfo();
      const order = await group.getPayoutOrder();

      const round = Number(info.currentRound);
      let contributors = [];
      try {
        contributors = await group.getRoundContributors(round);
      } catch (e) {
        contributors = [];
      }

      let memberObj = null;
      if (currentAccount) {
        try {
          const m = await group.getMemberInfo(currentAccount);
          memberObj = {
            isMember: m.isMember,
            hasReceivedPayout: m.hasReceivedPayout,
            depositPaid: ethers.formatEther(m.depositPaid),
            roundsContributed: Number(m.roundsContributed),
            payoutRound: Number(m.payoutRound),
            hasCommitted: m.hasCommitted,
            hasRevealed: m.hasRevealed,
          };
        } catch (e) {
          memberObj = null;
        }
      }

      setGroupData({
        address: groupAddress,
        organizer: info.organizer,
        token: info.token,
        contributionAmount: ethers.formatEther(info.contributionAmount),
        depositAmount: ethers.formatEther(info.depositAmount),
        maxMembers: Number(info.maxMembers),
        currentMembers: Number(info.currentMembers),
        currentRound: Number(info.currentRound),
        totalRounds: Number(info.totalRounds),
        roundDeadline: Number(info.roundDeadline),
        state: Number(info.state),
      });

      setPayoutOrder(order);
      setRoundContributors(contributors.map(c => c.toLowerCase()));
      setMemberInfo(memberObj);
    } catch (err) {
      console.error("Error loading group details:", err);
      setError("Gagal memuat detail grup arisan dari blockchain.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && groupAddress) {
      setLoading(true);
      loadGroupDetails();
      const interval = setInterval(loadGroupDetails, 8000);
      return () => clearInterval(interval);
    }
  }, [isOpen, groupAddress, currentAccount]);

  if (!isOpen) return null;

  // Fire celebratory fireworks
  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#F0B90B', '#0ECB81', '#00F0FF', '#FFFFFF'],
    });
  };

  // ACTION 1: Join & Deposit
  const handleJoin = async () => {
    if (!currentAccount) return;
    setError(null);
    setActionLoading(true);
    setActionStatus('Memeriksa izin token (Approve)...');

    try {
      const { signer } = await getBrowserProviderAndSigner();
      const tokenContract = getMockUSDTContract(signer);
      const group = getGroupContract(groupAddress, signer);

      const depositWei = ethers.parseEther(groupData.depositAmount);

      // Check current allowance
      const allowance = await tokenContract.allowance(currentAccount, groupAddress);
      if (allowance < depositWei) {
        setActionStatus('Menyetujui penggunaan token mUSDT...');
        const approveTx = await tokenContract.approve(groupAddress, depositWei);
        await approveTx.wait();
      }

      setActionStatus('Bergabung ke grup arisan...');
      const joinTx = await group.join();
      const receipt = await joinTx.wait();

      if (onTxSuccess) onTxSuccess('Berhasil Bergabung!', receipt.hash);
      await loadGroupDetails();
    } catch (err) {
      console.error(err);
      setError(err.reason || err.message || 'Gagal bergabung ke grup arisan.');
    } finally {
      setActionLoading(false);
      setActionStatus('');
    }
  };

  // ACTION 2: Commit Random Secret
  const handleCommit = async () => {
    if (!currentAccount) return;
    setError(null);
    setActionLoading(true);
    setActionStatus('Membuat secret acak & menghitung hash...');

    try {
      const { signer } = await getBrowserProviderAndSigner();
      const group = getGroupContract(groupAddress, signer);

      const secret = generateRandomSecret();
      // Save secret securely in localStorage for this wallet and group
      const storageKey = `arisan_secret_${groupAddress.toLowerCase()}_${currentAccount.toLowerCase()}`;
      localStorage.setItem(storageKey, secret.toString());

      const hash = computeCommitmentHash(secret, currentAccount);

      setActionStatus('Mengirim commit hash ke smart contract...');
      const tx = await group.commitOrder(hash);
      const receipt = await tx.wait();

      if (onTxSuccess) onTxSuccess('Commit Berhasil Dikirim!', receipt.hash);
      await loadGroupDetails();
    } catch (err) {
      console.error(err);
      setError(err.reason || err.message || 'Gagal mengirim commit hash.');
    } finally {
      setActionLoading(false);
      setActionStatus('');
    }
  };

  // ACTION 3: Reveal Secret
  const handleReveal = async () => {
    if (!currentAccount) return;
    setError(null);
    setActionLoading(true);
    setActionStatus('Membaca secret rahasia...');

    try {
      const storageKey = `arisan_secret_${groupAddress.toLowerCase()}_${currentAccount.toLowerCase()}`;
      let secretStr = localStorage.getItem(storageKey);

      if (!secretStr) {
        secretStr = window.prompt('Masukkan angka secret yang Anda simpan saat commit:');
        if (!secretStr) {
          setActionLoading(false);
          return;
        }
      }

      const { signer } = await getBrowserProviderAndSigner();
      const group = getGroupContract(groupAddress, signer);

      setActionStatus('Mengirim reveal ke smart contract...');
      const tx = await group.revealOrder(BigInt(secretStr));
      const receipt = await tx.wait();

      if (onTxSuccess) onTxSuccess('Secret Berhasil Di-Reveal!', receipt.hash);
      await loadGroupDetails();
    } catch (err) {
      console.error(err);
      setError(err.reason || err.message || 'Gagal melakukan reveal secret.');
    } finally {
      setActionLoading(false);
      setActionStatus('');
    }
  };

  // ACTION 4: Pay Round Contribution
  const handleContribute = async () => {
    if (!currentAccount) return;
    setError(null);
    setActionLoading(true);
    setActionStatus('Memeriksa izin token (Approve)...');

    try {
      const { signer } = await getBrowserProviderAndSigner();
      const tokenContract = getMockUSDTContract(signer);
      const group = getGroupContract(groupAddress, signer);

      const contributionWei = ethers.parseEther(groupData.contributionAmount);

      const allowance = await tokenContract.allowance(currentAccount, groupAddress);
      if (allowance < contributionWei) {
        setActionStatus('Menyetujui kontribusi mUSDT...');
        const approveTx = await tokenContract.approve(groupAddress, contributionWei);
        await approveTx.wait();
      }

      setActionStatus('Menyetor kontribusi ronde...');
      const tx = await group.contribute();
      const receipt = await tx.wait();

      if (onTxSuccess) onTxSuccess('Kontribusi Berhasil Disetor!', receipt.hash);
      await loadGroupDetails();
    } catch (err) {
      console.error(err);
      setError(err.reason || err.message || 'Gagal menyetor kontribusi.');
    } finally {
      setActionLoading(false);
      setActionStatus('');
    }
  };

  // ACTION 5: Claim Payout
  const handleClaimPayout = async () => {
    if (!currentAccount) return;
    setError(null);
    setActionLoading(true);
    setActionStatus('Mengklaim pencairan dana ronde...');

    try {
      const { signer } = await getBrowserProviderAndSigner();
      const group = getGroupContract(groupAddress, signer);

      const tx = await group.claimPayout();
      const receipt = await tx.wait();

      triggerConfetti();
      if (onTxSuccess) onTxSuccess('🎉 Payout Berhasil Dicairkan!', receipt.hash);
      await loadGroupDetails();
    } catch (err) {
      console.error(err);
      setError(err.reason || err.message || 'Gagal mengklaim pencairan arisan.');
    } finally {
      setActionLoading(false);
      setActionStatus('');
    }
  };

  // ACTION 6: Return Deposit
  const handleReturnDeposit = async () => {
    if (!currentAccount) return;
    setError(null);
    setActionLoading(true);
    setActionStatus('Menarik kembali deposit jaminan...');

    try {
      const { signer } = await getBrowserProviderAndSigner();
      const group = getGroupContract(groupAddress, signer);

      const tx = await group.returnDeposit();
      const receipt = await tx.wait();

      if (onTxSuccess) onTxSuccess('Deposit Berhasil Dikembalikan!', receipt.hash);
      await loadGroupDetails();
    } catch (err) {
      console.error(err);
      setError(err.reason || err.message || 'Gagal menarik deposit.');
    } finally {
      setActionLoading(false);
      setActionStatus('');
    }
  };

  // ACTION 7: Slash Defaulter
  const handleSlash = async (defaulterAddress) => {
    if (!currentAccount) return;
    setError(null);
    setActionLoading(true);
    setActionStatus(`Menyita deposit jaminan ${shortenAddress(defaulterAddress, 3)}...`);

    try {
      const { signer } = await getBrowserProviderAndSigner();
      const group = getGroupContract(groupAddress, signer);

      const tx = await group.slashDefaulter(defaulterAddress);
      const receipt = await tx.wait();

      if (onTxSuccess) onTxSuccess('⚡ Defaulter Berhasil Di-Slash!', receipt.hash);
      await loadGroupDetails();
    } catch (err) {
      console.error(err);
      setError(err.reason || err.message || 'Gagal mengeksekusi slash. Pastikan batas waktu (deadline) ronde telah terlewati.');
    } finally {
      setActionLoading(false);
      setActionStatus('');
    }
  };

  const stateMeta = groupData ? (GROUP_STATE_MAP[groupData.state] || { label: 'Unknown', color: 'neutral' }) : {};
  const currentRecipient = payoutOrder && payoutOrder.length > groupData?.currentRound ? payoutOrder[groupData.currentRound] : null;
  const isCurrentRecipient = currentRecipient && currentAccount && currentRecipient.toLowerCase() === currentAccount.toLowerCase();
  const hasUserContributedThisRound = currentAccount && roundContributors.includes(currentAccount.toLowerCase());
  const potAmount = groupData ? Number(groupData.contributionAmount) * groupData.maxMembers : 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: '800px', width: '92%' }}
      >
        {/* Header */}
        <div style={{
          padding: '24px 28px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(10, 14, 23, 0.95)',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span className={`badge badge-${stateMeta.color}`}>
                <span className="pulse-dot" />
                {stateMeta.label}
              </span>
              <a
                href={`https://testnet.bscscan.com/address/${groupAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: 'var(--bnb-gold)',
                  fontSize: '0.8rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  textDecoration: 'none',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {shortenAddress(groupAddress, 4)} <ExternalLink size={13} />
              </a>
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
              Ruang Arisan #{shortenAddress(groupAddress, 2).replace('0x', '')}
            </h2>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: 'none',
              borderRadius: '8px',
              color: 'var(--text-dim)',
              cursor: 'pointer',
              padding: '6px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '28px' }}>
          {error && (
            <div style={{
              background: 'var(--danger-bg)',
              border: '1px solid rgba(246, 70, 93, 0.3)',
              borderRadius: '12px',
              padding: '14px',
              marginBottom: '20px',
              fontSize: '0.85rem',
              color: '#ff8a9a',
            }}>
              {error}
            </div>
          )}

          {loading || !groupData ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <Loader2 size={36} className="animate-spin" color="var(--bnb-gold)" style={{ margin: '0 auto 16px' }} />
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Memuat data ruang arisan on-chain...
              </div>
            </div>
          ) : (
            <>
              {/* Financial & Status Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: '14px',
                marginBottom: '24px',
              }}>
                <div className="glass-panel" style={{ padding: '16px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Total Pot Pemenang
                  </div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--bnb-gold)' }}>
                    {potAmount} mUSDT
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                    {groupData.contributionAmount} mUSDT × {groupData.maxMembers}
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: '16px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Deposit Jaminan
                  </div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--success)' }}>
                    {groupData.depositAmount} mUSDT
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                    Jaminan Anti-Kabur
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: '16px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Ronde Berjalan
                  </div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff' }}>
                    {groupData.currentRound + 1} / {groupData.totalRounds}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                    Durasi: {formatDuration(groupData.roundDuration)}
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: '16px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Penerima Ronde Ini
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>
                    {currentRecipient ? (isCurrentRecipient ? '🎉 Anda!' : shortenAddress(currentRecipient, 3)) : 'Belum Diacak'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                    {groupData.state === 3 ? 'Giliran aktif' : 'Menunggu acak'}
                  </div>
                </div>
              </div>

              {/* TIMELINE: Payout Order (Hasil Commit-Reveal) */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.35)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '24px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Award size={18} color="var(--bnb-gold)" />
                    Urutan Giliran Pemenang (Commit-Reveal Fair Ordering)
                  </h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    {payoutOrder.length > 0 ? '✅ Urutan Terkunci On-Chain' : '⏳ Belum Reveal'}
                  </span>
                </div>

                {payoutOrder.length === 0 ? (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '10px 0' }}>
                    Urutan penerima giliran akan ditentukan secara adil & terdesentralisasi setelah semua anggota melakukan Commit-Reveal secret angka acak mereka.
                  </div>
                ) : (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    overflowX: 'auto',
                    paddingBottom: '8px',
                  }}>
                    {payoutOrder.map((recipient, idx) => {
                      const isDone = idx < groupData.currentRound;
                      const isCurrent = idx === groupData.currentRound && groupData.state === 3;
                      const isUser = currentAccount && recipient.toLowerCase() === currentAccount.toLowerCase();

                      return (
                        <div
                          key={idx}
                          style={{
                            flex: '1',
                            minWidth: '150px',
                            background: isCurrent ? 'rgba(240, 185, 11, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                            border: `1px solid ${isCurrent ? 'var(--bnb-gold)' : isDone ? 'rgba(14, 203, 129, 0.4)' : 'var(--border-subtle)'}`,
                            borderRadius: '12px',
                            padding: '12px 14px',
                            position: 'relative',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isCurrent ? 'var(--bnb-gold)' : 'var(--text-dim)' }}>
                              RONDE {idx + 1}
                            </span>
                            {isDone ? (
                              <CheckCircle2 size={15} color="var(--success)" />
                            ) : isCurrent ? (
                              <span className="pulse-dot" style={{ color: 'var(--bnb-gold)' }} />
                            ) : null}
                          </div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>
                            {shortenAddress(recipient, 3)}
                          </div>
                          {isUser && (
                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--bnb-gold)', marginTop: '4px' }}>
                              ★ Wallet Anda
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ACTION CENTER (Kontekstual sesuai state dan peran) */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(240, 185, 11, 0.08) 0%, rgba(14, 203, 129, 0.05) 100%)',
                border: '1px solid rgba(240, 185, 11, 0.25)',
                borderRadius: '16px',
                padding: '24px',
                textAlign: 'center',
              }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
                  Aksi Anda Saat Ini
                </h4>

                {/* State 0: OPEN */}
                {groupData.state === 0 && (
                  <div>
                    {!memberInfo?.isMember ? (
                      <div>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                          Grup ini sedang membuka pendaftaran ({groupData.currentMembers}/{groupData.maxMembers} Anggota).
                          Bayar deposit jaminan sebesar <strong>{groupData.depositAmount} mUSDT</strong> untuk bergabung.
                        </p>
                        <button
                          className="btn btn-primary"
                          onClick={handleJoin}
                          disabled={actionLoading}
                          style={{ padding: '12px 28px', fontSize: '1rem' }}
                        >
                          {actionLoading ? (
                            <>
                              <Loader2 size={18} className="animate-spin" />
                              <span>{actionStatus}</span>
                            </>
                          ) : (
                            <>
                              <ShieldCheck size={18} />
                              <span>Join Grup & Setor Jaminan</span>
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      <div style={{ color: 'var(--success)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <CheckCircle2 size={18} />
                        <span>Anda telah bergabung! Menunggu anggota lain terkumpul ({groupData.currentMembers}/{groupData.maxMembers}).</span>
                      </div>
                    )}
                  </div>
                )}

                {/* State 1: COMMITTING */}
                {groupData.state === 1 && (
                  <div>
                    {memberInfo?.isMember && !memberInfo?.hasCommitted ? (
                      <div>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                          Seluruh anggota telah terkumpul! Klik tombol di bawah untuk membuat angka rahasia otomatis dan mengirim commit hash ke smart contract.
                        </p>
                        <button
                          className="btn btn-primary"
                          onClick={handleCommit}
                          disabled={actionLoading}
                          style={{ padding: '12px 28px', fontSize: '1rem' }}
                        >
                          {actionLoading ? (
                            <>
                              <Loader2 size={18} className="animate-spin" />
                              <span>{actionStatus}</span>
                            </>
                          ) : (
                            <>
                              <KeyRound size={18} />
                              <span>Generate & Submit Commit Hash</span>
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      <div style={{ color: 'var(--bnb-gold)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <CheckCircle2 size={18} />
                        <span>Commit Hash Anda telah terdaftar on-chain. Menunggu anggota lain melakukan commit.</span>
                      </div>
                    )}
                  </div>
                )}

                {/* State 2: REVEALING */}
                {groupData.state === 2 && (
                  <div>
                    {memberInfo?.isMember && !memberInfo?.hasRevealed ? (
                      <div>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                          Fase Reveal! Buka angka rahasia Anda agar smart contract dapat mengunci urutan arisan secara adil.
                        </p>
                        <button
                          className="btn btn-primary"
                          onClick={handleReveal}
                          disabled={actionLoading}
                          style={{ padding: '12px 28px', fontSize: '1rem' }}
                        >
                          {actionLoading ? (
                            <>
                              <Loader2 size={18} className="animate-spin" />
                              <span>{actionStatus}</span>
                            </>
                          ) : (
                            <>
                              <Sparkles size={18} />
                              <span>Reveal Secret & Kunci Urutan</span>
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      <div style={{ color: 'var(--cyan)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <CheckCircle2 size={18} />
                        <span>Secret Anda berhasil di-reveal. Menunggu anggota lain selesai reveal.</span>
                      </div>
                    )}
                  </div>
                )}

                {/* State 3: ACTIVE */}
                {groupData.state === 3 && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
                      {/* Contribute Button */}
                      {memberInfo?.isMember && !hasUserContributedThisRound && (
                        <button
                          className="btn btn-primary"
                          onClick={handleContribute}
                          disabled={actionLoading}
                          style={{ padding: '12px 24px' }}
                        >
                          {actionLoading ? (
                            <>
                              <Loader2 size={18} className="animate-spin" />
                              <span>{actionStatus}</span>
                            </>
                          ) : (
                            <>
                              <Coins size={18} />
                              <span>Bayar Kontribusi ({groupData.contributionAmount} mUSDT)</span>
                            </>
                          )}
                        </button>
                      )}

                      {/* Claim Payout Button */}
                      {(isCurrentRecipient || roundContributors.length === groupData.maxMembers) && (
                        <button
                          className="btn btn-success"
                          onClick={handleClaimPayout}
                          disabled={actionLoading}
                          style={{ padding: '12px 24px' }}
                        >
                          {actionLoading ? (
                            <>
                              <Loader2 size={18} className="animate-spin" />
                              <span>{actionStatus}</span>
                            </>
                          ) : (
                            <>
                              <Award size={18} />
                              <span>Klaim Payout Ronde ({potAmount} mUSDT)</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {memberInfo?.isMember && hasUserContributedThisRound && (
                      <div style={{ color: 'var(--success)', fontWeight: 600, marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <CheckCircle2 size={16} /> Anda sudah membayar kontribusi untuk Ronde {groupData.currentRound + 1}!
                      </div>
                    )}

                    {/* Defaulter / Slash Section */}
                    {(() => {
                      const unpayedMembers = payoutOrder.filter(addr => !roundContributors.includes(addr.toLowerCase()));
                      const nowSec = Math.floor(Date.now() / 1000);
                      const isDeadlinePassed = groupData.roundDeadline > 0 && nowSec > groupData.roundDeadline;

                      if (unpayedMembers.length === 0) return null;

                      return (
                        <div style={{
                          marginTop: '20px',
                          padding: '16px',
                          borderRadius: '12px',
                          background: isDeadlinePassed ? 'rgba(246, 70, 93, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                          border: `1px solid ${isDeadlinePassed ? 'rgba(246, 70, 93, 0.35)' : 'var(--border-subtle)'}`,
                          textAlign: 'left'
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            color: isDeadlinePassed ? 'var(--danger)' : 'var(--warning)',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            marginBottom: '8px'
                          }}>
                            <AlertTriangle size={18} />
                            <span>
                              {isDeadlinePassed 
                                ? 'Peringatan: Anggota Gagal Bayar (Lewat Deadline)!' 
                                : `Tenggat Waktu Ronde: ${formatTimestamp(groupData.roundDeadline)}`}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '12px', lineHeight: '1.4' }}>
                            {isDeadlinePassed 
                              ? 'Batas waktu kontribusi ronde telah habis. Anda dapat mengeksekusi Slash Defaulter untuk menyita deposit jaminan milik anggota yang belum bayar demi melunasi ronde penerima:'
                              : `Terdapat ${unpayedMembers.length} anggota yang belum menyetor kontribusi ronde ini. Jika deadline habis dan anggota belum bayar, tombol Slash Defaulter akan aktif otomatis di sini untuk menyita uang jaminan mereka.`}
                          </p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {unpayedMembers.map((unpayedAddr) => (
                              <div key={unpayedAddr} style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                background: 'rgba(0, 0, 0, 0.3)',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                fontSize: '0.85rem'
                              }}>
                                <span style={{ fontFamily: 'var(--font-mono)', color: '#fff' }}>
                                  {shortenAddress(unpayedAddr, 4)}
                                </span>
                                {isDeadlinePassed ? (
                                  <button
                                    className="btn btn-danger"
                                    onClick={() => handleSlash(unpayedAddr)}
                                    disabled={actionLoading}
                                    style={{ padding: '6px 14px', fontSize: '0.8rem', fontWeight: 700 }}
                                  >
                                    ⚡ Eksekusi Slash Defaulter
                                  </button>
                                ) : (
                                  <span style={{ color: 'var(--warning)', fontSize: '0.78rem', fontStyle: 'italic' }}>
                                    ⏳ Menunggu Pembayaran
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* State 4: COMPLETED */}
                {groupData.state === 4 && (
                  <div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                      🎉 Seluruh ronde arisan telah selesai! Anggota yang tidak pernah gagal bayar berhak menarik kembali deposit jaminan penuh.
                    </p>
                    {memberInfo?.isMember && (
                      <button
                        className="btn btn-primary"
                        onClick={handleReturnDeposit}
                        disabled={actionLoading}
                        style={{ padding: '12px 28px' }}
                      >
                        {actionLoading ? (
                          <>
                            <Loader2 size={18} className="animate-spin" />
                            <span>{actionStatus}</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck size={18} />
                            <span>Tarik Kembali Deposit ({groupData.depositAmount} mUSDT)</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
