# 🎨 ArisanChain — Frontend Plan, Deployment Guide & Demo Video Storyboard

## Daftar Isi

1. [Overview: Kenapa Perlu Frontend?](#1-overview)
2. [Arsitektur Frontend](#2-arsitektur-frontend)
3. [Desain UI — Halaman per Halaman](#3-desain-ui)
4. [Alur Deployment End-to-End (Kontrak + Frontend)](#4-alur-deployment)
5. [Cara Membuat & Mint Token MockUSDT](#5-cara-mint-token)
6. [Cara Menggunakan Produk dengan Multiple Wallet](#6-cara-menggunakan-produk)
7. [Storyboard Video Demo](#7-storyboard-video-demo)
8. [Tips Recording & Tools](#8-tips-recording)
9. [Timeline](#9-timeline)

---

## 1. Overview

### Kenapa Frontend Penting?

| Tanpa Frontend | Dengan Frontend |
|---|---|
| Juri harus buka BscScan → cari kontrak → klik "Write Contract" | Juri buka website → klik tombol → langsung paham |
| Terlihat seperti project "setengah jadi" | Terlihat seperti produk nyata yang siap pakai |
| Sulit menjelaskan flow arisan | Flow arisan terlihat jelas secara visual |

### Teknologi yang Digunakan

| Teknologi | Alasan |
|---|---|
| **HTML + CSS + JavaScript** | Simpel, tidak perlu install framework, cepat dibuat |
| **ethers.js** | Library untuk interaksi dengan smart contract dari browser |
| **MetaMask** | Wallet browser untuk menandatangani transaksi |
| **Vercel** | Hosting gratis, deploy dalam 5 menit |

> [!NOTE]
> Kita **TIDAK** pakai React/Next.js/Flutter. Cukup HTML biasa + JavaScript. Ini sudah cukup impresif dan jauh lebih cepat dibuat.

---

## 2. Arsitektur Frontend

```
frontend/
├── index.html          # Landing page + Connect Wallet
├── create.html         # Halaman buat grup arisan baru
├── group.html          # Halaman detail grup (join, commit, contribute, dll)
├── css/
│   └── style.css       # Semua styling
├── js/
│   ├── app.js          # Logic utama (connect wallet, load contracts)
│   ├── contracts.js    # ABI & addresses kontrak
│   ├── create.js       # Logic halaman create
│   └── group.js        # Logic halaman group detail
└── assets/
    └── logo.png        # Logo ArisanChain
```

### Bagaimana Frontend Terhubung ke Smart Contract?

```
┌─────────────┐     ┌──────────────┐     ┌────────────────┐
│   Browser    │────▶│   MetaMask   │────▶│  BSC Testnet   │
│  (HTML/JS)   │     │   (Wallet)   │     │ (Smart Contract)│
│              │◀────│              │◀────│                │
│  ethers.js   │     │  Sign & Send │     │  ArisanGroup   │
└─────────────┘     └──────────────┘     └────────────────┘
```

**Penjelasan sederhana:**
1. User buka website → klik "Connect Wallet" → MetaMask muncul
2. User klik "Join Arisan" → MetaMask minta approve token + tanda tangan
3. Transaksi dikirim ke BSC Testnet → smart contract memproses
4. Website membaca hasil dari smart contract → tampilkan di UI

---

## 3. Desain UI — Halaman per Halaman

### Halaman 1: Landing Page (`index.html`)

**Apa yang ditampilkan:**
- Logo & nama "ArisanChain"
- Tagline: "Arisan On-Chain yang Trustless"
- Tombol **"Connect Wallet"** (besar, mencolok)
- Setelah connected: tampilkan address wallet & saldo tBNB
- Tombol **"Buat Arisan Baru"** dan **"Gabung Arisan"**
- Daftar grup arisan yang sudah ada (dari ArisanFactory)

**Fitur:**
- Auto-detect apakah MetaMask terinstall
- Auto-detect apakah sudah di network BSC Testnet
- Jika salah network → tombol "Switch to BSC Testnet"

---

### Halaman 2: Buat Grup Baru (`create.html`)

**Form input:**
- Jumlah anggota (dropdown: 2, 3, 4, 5)
- Nominal kontribusi per ronde (input angka, misal: 100 mUSDT)
- Deposit jaminan (otomatis = kontribusi, bisa diubah asal >=)
- Durasi per ronde (dropdown: 1 jam, 6 jam, 1 hari, 7 hari)
- Tombol **"Buat Grup Arisan"**

**Setelah klik:**
- MetaMask muncul → user konfirmasi transaksi
- Loading spinner
- Sukses → tampilkan address grup + link untuk share ke anggota lain

---

### Halaman 3: Detail Grup (`group.html?address=0x...`)

**Ini halaman utama untuk demo.** Menampilkan semua aktivitas grup:

#### Section A: Info Grup
- Status: OPEN / COMMITTING / REVEALING / ACTIVE / COMPLETED
- Jumlah anggota: 2/3
- Kontribusi per ronde: 100 mUSDT
- Deposit: 100 mUSDT
- Ronde saat ini: 1/3

#### Section B: Daftar Anggota
- Tabel: Address | Status Deposit | Ronde Kontribusi | Giliran Payout

#### Section C: Aksi (berubah sesuai state)

| State | Tombol yang Muncul |
|-------|-------------------|
| OPEN | **"Gabung Arisan"** (approve + join) |
| COMMITTING | **"Submit Commit"** (input secret number) |
| REVEALING | **"Reveal Secret"** (input secret yang sama) |
| ACTIVE | **"Bayar Kontribusi"** (approve + contribute) |
| ACTIVE (lewat deadline) | **"Slash Defaulter"** (pilih member) |
| COMPLETED | **"Ambil Deposit"** (return deposit) |

#### Section D: Riwayat Transaksi
- List event on-chain: siapa bayar, siapa terima, siapa di-slash

---

## 4. Alur Deployment End-to-End

### Ini urutan LENGKAP dari awal sampai bisa digunakan:

```
TAHAP 1: Deploy Smart Contract ke BSC Testnet
    ↓
TAHAP 2: Catat semua contract addresses
    ↓
TAHAP 3: Masukkan addresses ke frontend (contracts.js)
    ↓
TAHAP 4: Deploy frontend ke Vercel (gratis)
    ↓
TAHAP 5: Buka website → Connect Wallet → Gunakan!
```

### TAHAP 1: Deploy Smart Contract

```bash
# Di terminal, jalankan:
npm run deploy:testnet
```

**Apa yang terjadi:**
1. Script mengirim transaksi deploy MockUSDT ke BSC Testnet
2. Script mengirim transaksi deploy ArisanFactory
3. Script membuat contoh ArisanGroup melalui Factory
4. Semua addresses disimpan di `deployment.json`
5. Di console muncul link BscScan untuk setiap kontrak

**Yang dibutuhkan:** Wallet utama harus punya minimal ~0.05 tBNB untuk gas fee.

### TAHAP 2: Catat Contract Addresses

Setelah deploy, file `deployment.json` akan berisi:
```json
{
  "contracts": {
    "MockUSDT": "0x1234...",
    "ArisanFactory": "0x5678...",
    "ArisanGroup": "0xabcd..."
  }
}
```

### TAHAP 3: Masukkan ke Frontend

Copy addresses dari `deployment.json` ke file `frontend/js/contracts.js`. Saya akan buatkan file ini otomatis.

### TAHAP 4: Deploy Frontend ke Vercel

1. Push project ke GitHub
2. Buka [vercel.com](https://vercel.com) → Login dengan GitHub
3. Klik **"New Project"** → pilih repo `arisan-chain`
4. Set **Root Directory** ke `frontend`
5. Klik **"Deploy"**
6. Dalam 1-2 menit, website live di `https://arisan-chain.vercel.app`

### TAHAP 5: Gunakan!

Buka website → Connect MetaMask → mulai arisan!

---

## 5. Cara Membuat & Mint Token MockUSDT

### Pertanyaan: "Di mana saya buat token untuk demo?"

**Jawaban:** Token MockUSDT sudah OTOMATIS dibuat saat kamu deploy di Tahap 1. Kamu tidak perlu buat terpisah.

### Cara Mint Token ke Wallet (agar bisa dipakai arisan):

**Opsi A: Lewat BscScan (setelah kontrak di-deploy & di-verify)**

1. Buka `https://testnet.bscscan.com/address/{MOCKUSDT_ADDRESS}`
2. Klik tab **"Write Contract"**
3. Klik **"Connect to Web3"** → connect MetaMask
4. Cari fungsi **`mint`**
5. Isi:
   - `to`: address wallet yang mau di-mint (paste address dari MetaMask)
   - `amount`: `100000000000000000000000` (= 100,000 token dengan 18 decimals)
6. Klik **"Write"** → confirm di MetaMask
7. ✅ Token muncul di wallet!

> [!TIP]
> Ulangi untuk setiap wallet yang ikut arisan. Setiap wallet butuh minimal: deposit (100) + kontribusi per ronde (100) × jumlah ronde (3) = **400 mUSDT**.

**Opsi B: Lewat UI (jika kita tambahkan tombol Mint di frontend)**

Kita akan tambahkan tombol **"Mint Test Token"** di UI supaya lebih mudah untuk demo.

**Opsi C: Lewat Script (paling mudah untuk persiapan)**

```bash
npx hardhat run scripts/mint-tokens.js --network bscTestnet
```

Saya akan buatkan script ini yang otomatis mint token ke semua wallet.

---

## 6. Cara Menggunakan Produk dengan Multiple Wallet

### Masalah: "Bagaimana 3 orang berbeda ikut arisan kalau saya cuma satu orang?"

**Jawaban:** Kamu pakai **1 browser, 1 MetaMask, tapi switch antar account.**

### Langkah-langkah:

#### Fase 1: Persiapan (sebelum recording)
1. Buka MetaMask → pastikan ada 3 accounts:
   - Account 1 = Organizer (wallet Euby, punya tBNB)
   - Demo Member 1
   - Demo Member 2
2. Mint MockUSDT ke ketiga wallet (lewat BscScan atau script)
3. Pastikan ketiga wallet punya sedikit tBNB (untuk gas fee)

#### Fase 2: Simulasi Arisan (saat recording)

**Switch wallet di MetaMask:**
1. Klik ikon MetaMask di browser
2. Klik **ikon profil** (kiri atas)
3. Pilih account yang ingin digunakan
4. Website otomatis detect pergantian wallet

**Flow demo:**

```
👤 Account 1 (Organizer):
   → Connect Wallet → Buat Grup Arisan → Copy link grup

👤 Account 1: Gabung Arisan (approve + join)
   [Switch ke Account 2 di MetaMask]
👤 Account 2: Gabung Arisan (approve + join)
   [Switch ke Account 3 di MetaMask]
👤 Account 3: Gabung Arisan (approve + join)
   → Grup PENUH → otomatis masuk fase COMMITTING

👤 Account 1: Submit Commit (masukkan angka rahasia, misal: 42)
👤 Account 2: Submit Commit (masukkan angka rahasia, misal: 777)
👤 Account 3: Submit Commit (masukkan angka rahasia, misal: 12345)
   → Semua sudah commit → masuk fase REVEALING

👤 Account 1: Reveal Secret (masukkan angka yang sama: 42)
👤 Account 2: Reveal Secret (777)
👤 Account 3: Reveal Secret (12345)
   → Urutan giliran ditentukan!

📋 Urutan: Account 2 → Account 1 → Account 3

━━━ Ronde 1 (Skenario Normal) ━━━
👤 Account 1: Bayar Kontribusi 100 mUSDT
👤 Account 2: Bayar Kontribusi 100 mUSDT
👤 Account 3: Bayar Kontribusi 100 mUSDT
   → Account 2 otomatis terima 300 mUSDT! 🎉

━━━ Ronde 2 (Skenario Gagal Bayar) ━━━
👤 Account 1: Bayar Kontribusi 100 mUSDT
👤 Account 3: Bayar Kontribusi 100 mUSDT
❌ Account 2: TIDAK bayar (simulasi kabur)
   [Tunggu deadline lewat]
👤 Account 1: Klik "Slash Defaulter" → pilih Account 2
   → Deposit Account 2 dipotong 100 mUSDT
   → Account 1 terima payout! 🎉
```

---

## 7. Storyboard Video Demo

### Format Video
- **Durasi:** 8-12 menit
- **Resolusi:** 1920x1080 (Full HD)
- **Bahasa:** Indonesia (sesuai hackathon)
- **Format:** Screen recording + voice over

### Scene-by-Scene:

---

#### 🎬 Scene 1: Intro (30 detik)
**Tampilkan:** Slide judul / landing page
**Narasi:**
> "Halo, ini adalah ArisanChain — solusi arisan on-chain yang trustless di BNB Smart Chain. Kami menyelesaikan masalah kepercayaan dalam arisan konvensional menggunakan smart contract."

---

#### 🎬 Scene 2: Masalah & Solusi (1 menit)
**Tampilkan:** Slide masalah arisan konvensional
**Narasi:**
> "Arisan konvensional punya beberapa masalah: anggota bisa kabur setelah menerima giliran, urutan bisa dimanipulasi bendahara, dan tidak ada pencatatan resmi. ArisanChain menyelesaikan ini semua dengan smart contract."

---

#### 🎬 Scene 3: Connect Wallet (30 detik)
**Tampilkan:** Buka website → klik Connect Wallet → MetaMask popup
**Narasi:**
> "Pengguna cukup connect wallet MetaMask mereka. Website otomatis mendeteksi jaringan BSC Testnet."

---

#### 🎬 Scene 4: Buat Grup Arisan (1 menit)
**Tampilkan:** Klik "Buat Arisan" → isi form → confirm di MetaMask
**Narasi:**
> "Organizer membuat grup arisan baru. Dia menentukan jumlah anggota, nominal kontribusi per ronde, dan durasi per ronde. Semua parameter tersimpan on-chain."

---

#### 🎬 Scene 5: Anggota Bergabung (2 menit)
**Tampilkan:** Switch wallet 3x → masing-masing klik "Gabung" → approve & join
**Narasi:**
> "Setiap anggota bergabung dengan membayar deposit jaminan. Deposit ini disimpan oleh smart contract sebagai jaminan — bukan oleh satu orang. Ketika semua anggota sudah bergabung, grup otomatis masuk fase penentuan urutan."

---

#### 🎬 Scene 6: Commit-Reveal (2 menit)
**Tampilkan:** Masing-masing wallet submit commit → reveal
**Narasi:**
> "Urutan giliran ditentukan melalui mekanisme commit-reveal yang trustless. Setiap anggota memilih angka rahasia, lalu di-reveal bersama-sama. Smart contract menggabungkan semua angka untuk menentukan urutan yang adil — tidak ada yang bisa memanipulasi."

---

#### 🎬 Scene 7: Ronde Normal — Skenario 1 (1.5 menit)
**Tampilkan:** Semua wallet kontribusi → payout otomatis
**Narasi:**
> "Di ronde pertama, semua anggota membayar kontribusi tepat waktu. Smart contract otomatis mencairkan total dana ke penerima giliran. Tidak perlu bendahara, tidak perlu percaya siapa pun."

**Tunjukkan:** Saldo penerima bertambah di UI

---

#### 🎬 Scene 8: Gagal Bayar — Skenario 2 (2 menit)
**Tampilkan:** Satu wallet tidak bayar → slash → payout tetap jalan
**Narasi:**
> "Di ronde kedua, kita simulasikan skenario terburuk: anggota yang sudah menerima giliran tidak mau bayar. Setelah deadline lewat, siapa pun bisa meng-slash deposit-nya. Dana yang di-slash digunakan untuk menutup kekurangan, sehingga penerima giliran berikutnya tetap aman."

**Tunjukkan:** Deposit defaulter berkurang, payout tetap terkirim

---

#### 🎬 Scene 9: Verifikasi di BscScan (1 menit)
**Tampilkan:** Buka BscScan → tunjukkan kontrak terverifikasi → event logs
**Narasi:**
> "Semua transaksi tercatat on-chain dan bisa diverifikasi oleh siapa saja di BscScan. Kontrak kami sudah terverifikasi, source code terbuka, dan semua event ter-log secara transparan."

---

#### 🎬 Scene 10: Penutup & Roadmap (30 detik)
**Tampilkan:** Slide roadmap + tech stack
**Narasi:**
> "ArisanChain dibangun dengan Solidity, Hardhat, dan OpenZeppelin di BNB Smart Chain. Roadmap kami meliputi integrasi off-ramp, upgrade ke Chainlink VRF, dan multi-grup dashboard. Terima kasih!"

---

## 8. Tips Recording & Tools

### Tools yang Direkomendasikan

| Tool | Kegunaan | Harga |
|------|----------|-------|
| **OBS Studio** | Screen recording + audio | Gratis |
| **Loom** | Screen recording + webcam | Gratis (5 min) |
| **ScreenPal** | Screen recording | Gratis |
| **Canva** | Buat slide intro/outro | Gratis |

### Tips Recording

1. **Persiapkan semuanya sebelum record:**
   - Semua wallet sudah punya token & tBNB
   - Website sudah live dan bisa diakses
   - MetaMask sudah setup 3 accounts
   - Tutup semua tab/notifikasi yang tidak relevan

2. **Gunakan script narasi:**
   - Tulis narasi lengkap sebelum record
   - Latihan 1-2x sebelum record final
   
3. **Record dalam segmen:**
   - Jangan record 10 menit sekaligus
   - Record per scene, edit gabungkan nanti

4. **Resolusi layar:**
   - Set browser zoom ke 110-125% agar text terlihat besar
   - Full screen browser, hide bookmark bar

5. **Jangan terlalu cepat:**
   - Beri jeda 2-3 detik setelah setiap aksi penting
   - Juri butuh waktu untuk memahami apa yang terjadi

---

## 9. Timeline

| Hari | Aktivitas | Durasi |
|------|-----------|--------|
| **Hari 1** | Deploy kontrak ke BSC Testnet + Verifikasi BscScan | 1-2 jam |
| **Hari 1** | Buat frontend (HTML/CSS/JS) — semua halaman | 4-6 jam |
| **Hari 2** | Testing frontend dengan kontrak di testnet | 1-2 jam |
| **Hari 2** | Deploy frontend ke Vercel | 30 menit |
| **Hari 2** | Persiapan demo (mint token, setup wallets) | 30 menit |
| **Hari 2** | Record video demo | 1-2 jam |
| **Hari 2** | Edit video + submit | 1 jam |

**Total estimasi: 8-14 jam (2 hari kerja)**

---

## ✅ Langkah Selanjutnya

Setelah plan ini disetujui, saya akan:

1. **Deploy kontrak ke BSC Testnet** + verifikasi di BscScan
2. **Buat script mint-tokens.js** untuk persiapan demo
3. **Buat seluruh frontend** (4 file HTML + CSS + JS)
4. **Test end-to-end** pastikan frontend + kontrak berfungsi
5. **Bantu deploy frontend ke Vercel**

> [!IMPORTANT]
> **Urutan yang benar:**
> Deploy Kontrak DULU → baru buat frontend (karena frontend butuh contract addresses)
>
> Tapi saya bisa mulai buat frontend secara paralel menggunakan addresses dari local testing, lalu update ke addresses testnet nanti.
