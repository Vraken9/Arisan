import React from 'react';
import { ShieldCheck, Users, Coins, Sparkles } from 'lucide-react';

export default function StatsBanner({ totalGroups, totalMembers, totalTvl }) {
  return (
    <div style={{
      maxWidth: '1280px',
      margin: '28px auto 0',
      padding: '0 24px',
    }}>
      {/* Hero Welcome Pitch */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(22, 31, 50, 0.7) 0%, rgba(13, 18, 29, 0.8) 100%)',
        border: '1px solid rgba(240, 185, 11, 0.25)',
        borderRadius: '20px',
        padding: '32px 36px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '24px',
        boxShadow: 'var(--shadow-lg), 0 0 50px rgba(240, 185, 11, 0.05)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Subtle Ambient Lighting */}
        <div style={{
          position: 'absolute',
          top: '-60px',
          right: '-60px',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: 'rgba(240, 185, 11, 0.12)',
          filter: 'blur(50px)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: '640px', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(240, 185, 11, 0.1)',
            border: '1px solid rgba(240, 185, 11, 0.3)',
            borderRadius: '20px',
            padding: '4px 12px',
            marginBottom: '14px',
          }}>
            <Sparkles size={14} color="var(--bnb-gold)" />
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--bnb-gold)', letterSpacing: '0.04em' }}>
              INDONESIA WEB3 HACKATHON 2026
            </span>
          </div>
          <h1 style={{
            fontSize: '2.1rem',
            fontWeight: 800,
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
            marginBottom: '12px',
            color: '#fff',
          }}>
            Arisan Tradisional Kini <span style={{ color: 'var(--bnb-gold)' }}>100% Trustless</span> di BNB Chain
          </h1>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
            Solusi inovatif mendigitalkan arisan Indonesia dengan jaminan <strong>Deposit Anti-Kabur (Auto-Slash)</strong> dan penentuan urutan giliran yang adil melalui <strong>Commit-Reveal On-Chain</strong>.
          </p>
        </div>

        {/* 3 Metric Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '14px',
          width: '100%',
          maxWidth: '520px',
          zIndex: 1,
        }}>
          {/* Card 1 */}
          <div className="glass-panel" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--bnb-gold)', marginBottom: '6px' }}>
              <Coins size={18} />
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>Total Grup</span>
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff' }}>
              {totalGroups}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--success)' }}>
              ● Terdaftar di Factory
            </div>
          </div>

          {/* Card 2 */}
          <div className="glass-panel" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--cyan)', marginBottom: '6px' }}>
              <Users size={18} />
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>Anggota Arisan</span>
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff' }}>
              {totalMembers}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--cyan)' }}>
              ● On-Chain Wallets
            </div>
          </div>

          {/* Card 3 */}
          <div className="glass-panel" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)', marginBottom: '6px' }}>
              <ShieldCheck size={18} />
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>Keamanan</span>
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--success)', marginTop: '4px' }}>
              100% Trustless
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              ● Jaminan Deposit Penuh
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
