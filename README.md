# 🏦 ArisanChain — Digitalisasi Arisan di BNB Chain

> Smart contract trustless untuk arisan on-chain. Dibangun untuk [Indonesia Web3 Hackathon 2026](https://hackathon.web3id).

## 📋 Tentang

ArisanChain mendigitalkan **arisan** — praktik simpan-pinjam bergilir masyarakat Indonesia — menjadi smart contract trustless di BNB Smart Chain. Seluruh proses kontribusi, penentuan giliran, dan pencairan dana berjalan **otomatis dan transparan** on-chain.

### Masalah yang Diselesaikan

| Masalah Arisan Konvensional | Solusi ArisanChain |
|---|---|
| Anggota kabur setelah terima giliran | Deposit jaminan + auto-slash |
| Urutan dimanipulasi bendahara | Commit-reveal on-chain (trustless) |
| Tidak ada pencatatan resmi | Semua tercatat sebagai event on-chain |
| Kepercayaan 100% ke satu orang | Smart contract menggantikan bendahara |

## 🏗️ Arsitektur

```
contracts/
├── ArisanFactory.sol      # Factory — buat grup arisan baru
├── ArisanGroup.sol        # Core logic arisan per grup
├── MockUSDT.sol           # Mock stablecoin untuk testnet
└── interfaces/
    └── IArisanGroup.sol   # Interface kontrak
```

### Flow

```
Anggota Join + Deposit → Commit-Reveal → Urutan Ditentukan → Kontribusi per Ronde → Payout Otomatis → Ulangi sampai semua menerima
```

## 🚀 Quick Start

### Prerequisites

- Node.js v18+
- npm

### Install

```bash
npm install
```

### Compile

```bash
npx hardhat compile
```

### Test

```bash
npx hardhat test
```

### Demo (Lokal)

```bash
npx hardhat run scripts/demo.js
```

### Menjalankan Frontend dApp (Vite + React)

Aplikasi Web3 frontend ArisanChain dibangun dengan Vite + React, Vanilla CSS Glassmorphism, dan Ethers.js v6.

```bash
# Menjalankan frontend dev server
npm run frontend
```

Buka browser di **`http://localhost:5173`**.
- Hubungkan MetaMask ke **BNB Smart Chain Testnet (Chain ID: 97)**.
- Gunakan tombol **"Faucet mUSDT"** di pojok kanan atas untuk klaim 1,000 mUSDT instan ke wallet Anda.
- Buat grup baru atau masuk ke grup yang sudah ada untuk mencoba ronde arisan.

### Deploy ke BSC Testnet

1. Copy `.env.example` menjadi `.env` dan isi private key + BscScan API key
2. Jalankan:

```bash
npx hardhat run scripts/deploy.js --network bscTestnet
```

3. Verifikasi kontrak:

```bash
npx hardhat verify --network bscTestnet <CONTRACT_ADDRESS>
```

## 📝 Smart Contract Addresses (BSC Testnet — Chain ID: 97)

| Kontrak | Address | BscScan Explorer |
|---------|---------|------------------|
| **MockUSDT** | `0x79F41C959e47276fD860242413d6fFcE9cad5eA2` | [Lihat di BscScan](https://testnet.bscscan.com/address/0x79F41C959e47276fD860242413d6fFcE9cad5eA2) |
| **ArisanFactory** | `0xDf76714269D68F78FF491BbDe2e3f331b9af434E` | [Lihat di BscScan](https://testnet.bscscan.com/address/0xDf76714269D68F78FF491BbDe2e3f331b9af434E) |
| **ArisanGroup** (contoh) | `0xADE66d006fA341cD5c3309DBf2e80fFAd719A7d8` | [Lihat di BscScan](https://testnet.bscscan.com/address/0xADE66d006fA341cD5c3309DBf2e80fFAd719A7d8) |

### Mint Test Tokens (MockUSDT)

Untuk mengisi saldo mock USDT ke wallet testing di BSC Testnet:
```bash
npx hardhat run scripts/mint-tokens.js --network bscTestnet
```

## 🧪 Skenario Demo

### Skenario 1 — Ronde Normal
Semua anggota kontribusi tepat waktu → kontrak otomatis cairkan dana ke penerima giliran.

### Skenario 2 — Gagal Bayar
Satu anggota yang sudah terima giliran tidak bayar → deposit dipotong otomatis → anggota lain tetap aman.

## 🛠️ Tech Stack

- **Solidity** ^0.8.24
- **Hardhat** — development framework
- **OpenZeppelin** — ReentrancyGuard, SafeERC20
- **BNB Smart Chain Testnet** — deployment target

## 👥 Tim

- **ArisanChain Team** — Indonesia Web3 Hackathon 2026

## 📄 Lisensi

MIT
