import React from 'react';
import { Users, Clock, ArrowRight, ExternalLink, ShieldCheck, Award } from 'lucide-react';
import { GROUP_STATE_MAP } from '../config/contracts';
import { shortenAddress, formatDuration } from '../utils/web3';

export default function GroupCard({ group, onSelectGroup }) {
  const stateMeta = GROUP_STATE_MAP[group.state] || { label: 'Unknown', color: 'neutral' };
  const memberPercent = Math.min(100, Math.round((group.currentMembers / group.maxMembers) * 100));

  return (
    <div
      className="glass-panel"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '24px',
        position: 'relative',
        cursor: 'pointer',
      }}
      onClick={() => onSelectGroup(group.address)}
    >
      {/* Card Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <span className={`badge badge-${stateMeta.color}`}>
            <span className="pulse-dot" />
            {stateMeta.label}
          </span>
          <a
            href={`https://testnet.bscscan.com/address/${group.address}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.75rem',
              color: 'var(--text-dim)',
              textDecoration: 'none',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {shortenAddress(group.address, 4)}
            <ExternalLink size={12} />
          </a>
        </div>

        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
          Arisan #{shortenAddress(group.address, 2).replace('0x', '')}
        </h3>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Organizer: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>{shortenAddress(group.organizer, 3)}</span>
        </p>

        {/* Member Progress Bar */}
        <div style={{ marginBottom: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '6px' }}>
            <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Users size={14} /> Anggota Terdaftar
            </span>
            <span style={{ fontWeight: 700, color: '#fff' }}>
              {group.currentMembers} / {group.maxMembers}
            </span>
          </div>
          <div style={{
            width: '100%',
            height: '6px',
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${memberPercent}%`,
              height: '100%',
              background: 'var(--bnb-gold-gradient)',
              borderRadius: '10px',
              transition: 'width 0.4s ease',
            }} />
          </div>
        </div>

        {/* Financial Details Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px',
          background: 'rgba(0, 0, 0, 0.25)',
          padding: '12px',
          borderRadius: '10px',
          marginBottom: '18px',
        }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Kontribusi / Ronde</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--bnb-gold)' }}>
              {group.contributionAmount} mUSDT
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Deposit Jaminan</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--success)' }}>
              {group.depositAmount} mUSDT
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Durasi Ronde</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={12} color="var(--text-dim)" />
              {formatDuration(group.roundDuration)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Status Ronde</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Award size={12} color="var(--bnb-gold)" />
              Ronde {group.currentRound + 1} / {group.totalRounds}
            </div>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <button
        className="btn btn-secondary"
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          borderColor: 'rgba(240, 185, 11, 0.3)',
          color: 'var(--bnb-gold)',
          fontWeight: 700,
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelectGroup(group.address);
        }}
      >
        <span>Masuk Ruang Arisan</span>
        <ArrowRight size={16} />
      </button>
    </div>
  );
}
