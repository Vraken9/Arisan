import React, { useState } from 'react';
import { Search, Filter, Layers, RefreshCw } from 'lucide-react';
import GroupCard from './GroupCard';

export default function GroupList({ groups, loading, currentAccount, onSelectGroup, onRefresh }) {
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter logic
  const filteredGroups = groups.filter((g) => {
    // Search match
    const matchesSearch = g.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          g.organizer.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    // Tab filter
    if (activeTab === 'ALL') return true;
    if (activeTab === 'OPEN') return g.state === 0;
    if (activeTab === 'ACTIVE') return g.state === 3;
    if (activeTab === 'MY_GROUPS') {
      if (!currentAccount) return false;
      const isOrganizer = g.organizer.toLowerCase() === currentAccount.toLowerCase();
      const isMember = g.memberList && g.memberList.some(m => m.toLowerCase() === currentAccount.toLowerCase());
      return isOrganizer || isMember;
    }
    return true;
  });

  return (
    <section style={{
      maxWidth: '1280px',
      margin: '36px auto 60px',
      padding: '0 24px',
    }}>
      {/* Controls Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '24px',
      }}>
        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          background: 'rgba(16, 22, 35, 0.8)',
          padding: '4px',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)',
          overflowX: 'auto',
        }}>
          {[
            { id: 'ALL', label: 'Semua Grup' },
            { id: 'OPEN', label: 'Pendaftaran Terbuka' },
            { id: 'ACTIVE', label: 'Ronde Berjalan' },
            { id: 'MY_GROUPS', label: 'Grup Saya' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: activeTab === tab.id ? 'var(--bnb-gold)' : 'transparent',
                color: activeTab === tab.id ? '#000' : 'var(--text-muted)',
                fontWeight: activeTab === tab.id ? 700 : 500,
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Refresh */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ position: 'relative', width: '260px' }}>
            <Search size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Cari address grup..."
              className="form-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '36px', paddingRight: '12px', height: '40px', fontSize: '0.85rem' }}
            />
          </div>

          <button
            className="btn btn-secondary"
            onClick={onRefresh}
            title="Refresh daftar grup"
            style={{ padding: '10px', height: '40px' }}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Group Cards Grid */}
      {loading && groups.length === 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
          gap: '20px',
        }}>
          {[1, 2, 3].map((n) => (
            <div key={n} className="glass-panel" style={{ height: '280px', opacity: 0.5, animation: 'pulseAnimation 1.5s infinite ease-in-out' }} />
          ))}
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="glass-panel" style={{
          textAlign: 'center',
          padding: '60px 24px',
          color: 'var(--text-muted)',
        }}>
          <Layers size={48} color="var(--text-dim)" style={{ marginBottom: '16px' }} />
          <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '8px' }}>
            Tidak Ada Grup Ditemukan
          </h3>
          <p style={{ fontSize: '0.9rem', maxWidth: '440px', margin: '0 auto 20px' }}>
            {activeTab === 'MY_GROUPS' 
              ? 'Anda belum terdaftar atau membuat grup arisan dengan wallet ini.' 
              : 'Belum ada grup yang sesuai dengan filter atau kata kunci pencarian.'}
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
          gap: '20px',
        }}>
          {filteredGroups.map((group) => (
            <GroupCard
              key={group.address}
              group={group}
              onSelectGroup={onSelectGroup}
            />
          ))}
        </div>
      )}
    </section>
  );
}
