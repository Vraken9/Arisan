import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import Navbar from './components/Navbar';
import StatsBanner from './components/StatsBanner';
import GroupList from './components/GroupList';
import CreateGroupModal from './components/CreateGroupModal';
import FaucetModal from './components/FaucetModal';
import GroupDetailModal from './components/GroupDetailModal';
import Toast from './components/Toast';
import { 
  NETWORK_CONFIG, 
  CONTRACT_ADDRESSES, 
  ARISAN_FACTORY_ABI, 
  ARISAN_GROUP_ABI 
} from './config/contracts';
import { 
  connectWallet, 
  ensureBscTestnetNetwork, 
  getReadOnlyProvider, 
  getMockUSDTBalance, 
  shortenAddress 
} from './utils/web3';
import { ExternalLink, ShieldCheck, Code2 } from 'lucide-react';

export default function App() {
  const [account, setAccount] = useState(null);
  const [bnbBalance, setBnbBalance] = useState('0');
  const [usdtBalance, setUsdtBalance] = useState('0');
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(true);

  const [groups, setGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [selectedGroupAddress, setSelectedGroupAddress] = useState(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isFaucetModalOpen, setIsFaucetModalOpen] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Toast Helpers
  const addToast = (title, message, type = 'info', txHash = null) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, title, message, type, txHash }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 7000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Wallet Connection
  const handleConnectWallet = async () => {
    try {
      const data = await connectWallet();
      setAccount(data.address);
      setBnbBalance(data.balanceEth);
      setIsCorrectNetwork(true);

      const usdt = await getMockUSDTBalance(data.address, data.provider);
      setUsdtBalance(usdt);

      addToast('Wallet Terhubung', `Terhubung dengan ${shortenAddress(data.address, 4)}`, 'success');
    } catch (err) {
      console.error(err);
      addToast('Koneksi Gagal', err.message || 'Gagal menghubungkan MetaMask.', 'error');
    }
  };

  const handleSwitchNetwork = async () => {
    try {
      await ensureBscTestnetNetwork();
      setIsCorrectNetwork(true);
      addToast('Jaringan Berhasil Diganti', 'Sekarang berada di BNB Smart Chain Testnet.', 'success');
    } catch (err) {
      addToast('Ganti Jaringan Gagal', err.message, 'error');
    }
  };

  // Refresh Balances
  const refreshBalances = async (addr = account) => {
    if (!addr || !window.ethereum) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const bnbWei = await provider.getBalance(addr);
      setBnbBalance(ethers.formatEther(bnbWei));
      const usdt = await getMockUSDTBalance(addr, provider);
      setUsdtBalance(usdt);
    } catch (e) {
      console.error('Error refreshing balances:', e);
    }
  };

  // Fetch all groups from Factory & individual Group contracts
  const fetchAllGroups = async () => {
    setLoadingGroups(true);
    try {
      const provider = getReadOnlyProvider();
      const factory = new ethers.Contract(CONTRACT_ADDRESSES.ArisanFactory, ARISAN_FACTORY_ABI, provider);

      // Get list of group addresses
      let groupAddresses = [];
      try {
        groupAddresses = await factory.getGroups();
      } catch (e) {
        console.warn('Fallback to initial example group:', e);
        groupAddresses = [CONTRACT_ADDRESSES.InitialExampleGroup];
      }

      // If empty, ensure example group from deployment.json is included
      if (groupAddresses.length === 0 && CONTRACT_ADDRESSES.InitialExampleGroup) {
        groupAddresses = [CONTRACT_ADDRESSES.InitialExampleGroup];
      }

      const loadedGroups = [];
      for (const addr of groupAddresses) {
        try {
          const groupContract = new ethers.Contract(addr, ARISAN_GROUP_ABI, provider);
          const info = await groupContract.getGroupInfo();
          
          let memberList = [];
          try {
            const count = Number(info.currentMembers);
            for (let i = 0; i < count; i++) {
              const memAddr = await groupContract.members(i);
              memberList.push(memAddr);
            }
          } catch (e) {
            // ignore member retrieval errors
          }

          let duration = 86400;
          try {
            duration = Number(await groupContract.roundDuration());
          } catch (e) {
            duration = 86400;
          }

          loadedGroups.push({
            address: addr,
            organizer: info.organizer,
            token: info.token,
            contributionAmount: ethers.formatEther(info.contributionAmount),
            depositAmount: ethers.formatEther(info.depositAmount),
            maxMembers: Number(info.maxMembers),
            currentMembers: Number(info.currentMembers),
            currentRound: Number(info.currentRound),
            totalRounds: Number(info.totalRounds),
            roundDeadline: Number(info.roundDeadline),
            roundDuration: duration,
            state: Number(info.state),
            memberList,
          });
        } catch (err) {
          console.error(`Error loading group ${addr}:`, err);
        }
      }

      setGroups(loadedGroups);
    } catch (err) {
      console.error('Error fetching groups:', err);
    } finally {
      setLoadingGroups(false);
    }
  };

  // MetaMask Event Listeners (Auto-detect account switch for smooth multi-wallet demo)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          refreshBalances(accounts[0]);
          addToast('Akun Berganti', `Sekarang menggunakan ${shortenAddress(accounts[0], 4)}`, 'info');
        } else {
          setAccount(null);
          setBnbBalance('0');
          setUsdtBalance('0');
        }
      };

      const handleChainChanged = (chainIdHex) => {
        if (chainIdHex === NETWORK_CONFIG.chainIdHex) {
          setIsCorrectNetwork(true);
        } else {
          setIsCorrectNetwork(false);
        }
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      // Check current chain
      window.ethereum.request({ method: 'eth_chainId' }).then((hex) => {
        setIsCorrectNetwork(hex === NETWORK_CONFIG.chainIdHex);
      });

      // Auto-connect if already authorized
      window.ethereum.request({ method: 'eth_accounts' }).then((accs) => {
        if (accs && accs.length > 0) {
          setAccount(accs[0]);
          refreshBalances(accs[0]);
        }
      });

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchAllGroups();
  }, []);

  // Compute TVL & Member metrics
  const totalMembers = groups.reduce((acc, g) => acc + g.currentMembers, 0);
  const totalTvl = groups.reduce((acc, g) => acc + (g.currentMembers * Number(g.depositAmount)), 0);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navbar */}
      <Navbar
        account={account}
        bnbBalance={bnbBalance}
        usdtBalance={usdtBalance}
        isCorrectNetwork={isCorrectNetwork}
        onConnect={handleConnectWallet}
        onSwitchNetwork={handleSwitchNetwork}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onOpenFaucetModal={() => setIsFaucetModalOpen(true)}
      />

      {/* Main Content Area */}
      <main style={{ flex: 1 }}>
        <StatsBanner
          totalGroups={groups.length}
          totalMembers={totalMembers}
          totalTvl={totalTvl}
        />

        <GroupList
          groups={groups}
          loading={loadingGroups}
          currentAccount={account}
          onSelectGroup={(addr) => setSelectedGroupAddress(addr)}
          onRefresh={fetchAllGroups}
        />
      </main>

      {/* Footer */}
      <footer style={{
        background: 'rgba(5, 7, 11, 0.95)',
        borderTop: '1px solid var(--border-subtle)',
        padding: '36px 24px',
        marginTop: 'auto',
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px',
        }}>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>
              Arisan<span style={{ color: 'var(--bnb-gold)' }}>Chain</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Proyek Submission — <strong>Indonesia Web3 Hackathon 2026</strong>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '0.82rem' }}>
            <a
              href="https://github.com/Vraken9/Arisan"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: 'var(--text-muted)',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
              GitHub Repository
            </a>
            <a
              href={`https://testnet.bscscan.com/address/${CONTRACT_ADDRESSES.ArisanFactory}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: 'var(--bnb-gold)',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              Factory di BscScan <ExternalLink size={13} />
            </a>
          </div>
        </div>
      </footer>

      {/* Modals & Overlays */}
      <CreateGroupModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onGroupCreated={(newAddr, hash) => {
          addToast('Grup Baru Berhasil Dibuat!', 'Kontrak ArisanGroup baru telah aktif di BSC Testnet.', 'success', hash);
          fetchAllGroups();
          refreshBalances();
        }}
      />

      <FaucetModal
        isOpen={isFaucetModalOpen}
        onClose={() => setIsFaucetModalOpen(false)}
        currentAccount={account}
        onMintSuccess={(hash) => {
          addToast('Faucet Berhasil', '1,000 mUSDT telah ditambahkan ke wallet Anda.', 'success', hash);
          refreshBalances();
        }}
      />

      <GroupDetailModal
        groupAddress={selectedGroupAddress}
        isOpen={Boolean(selectedGroupAddress)}
        onClose={() => setSelectedGroupAddress(null)}
        currentAccount={account}
        onTxSuccess={(title, hash) => {
          addToast(title, 'Transaksi berhasil dikonfirmasi di blockchain.', 'success', hash);
          fetchAllGroups();
          refreshBalances();
        }}
      />

      {/* Toast Stack */}
      <Toast toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
