PRD: ArisanChain — Digitalisasi Arisan di BNB Chain
Dokumen: Product Requirements Document (PRD) Event: Indonesia Web3 Hackathon 2026 (Co-host: Binance Academy, BNB Chain, Coinvestasi — Mentor: Dev Web3 Jogja) Track: Consumer Apps / Finance & Commerce Versi: 1.0 Disusun oleh: Coba

1. Ringkasan Eksekutif
ArisanChain mendigitalkan arisan — praktik simpan-pinjam bergilir yang sudah lama dijalankan masyarakat Indonesia — menjadi smart contract trustless di BNB Smart Chain / opBNB. Alih-alih bergantung pada satu bendahara yang harus dipercaya penuh, seluruh proses kontribusi, penentuan giliran, dan pencairan dana berjalan otomatis dan transparan on-chain. Ini membuat arisan bisa dijalankan dengan aman oleh siapa pun, termasuk kelompok yang anggotanya belum saling kenal dekat — komunitas online, rekan kerja lintas kota, atau diaspora Indonesia di luar negeri.

2. Latar Belakang & Masalah
Arisan adalah instrumen keuangan sosial yang sangat umum di Indonesia: sekelompok orang menyetor jumlah tetap secara rutin, dan tiap ronde satu anggota menerima seluruh dana yang terkumpul, bergilir sampai semua anggota pernah menerima.

Masalah yang konsisten muncul dalam praktik arisan konvensional:

Masalah	Dampak
Anggota berhenti bayar setelah menerima giliran ("kabur")	Anggota yang belum menerima giliran dirugikan
Urutan giliran ditentukan/dimanipulasi bendahara	Favoritisme, hilangnya kepercayaan antar anggota
Tidak ada pencatatan resmi	Sengketa "siapa sudah bayar" hanya mengandalkan chat grup
Kepercayaan bertumpu 100% pada satu orang (bendahara)	Risiko dana dibawa lari, tanpa jalur pemulihan
Sulit melibatkan anggota yang belum saling kenal	Arisan online/lintas kota/diaspora jadi berisiko tinggi
Masalah-masalah di atas pada dasarnya adalah masalah kepercayaan dan koordinasi, bukan masalah yang membutuhkan regulasi finansial berat — sehingga cocok diselesaikan dengan smart contract, bukan lembaga keuangan konvensional.

3. Tujuan Produk
Menghilangkan kebutuhan satu pihak (bendahara) yang harus dipercaya penuh untuk memegang dana
Menjamin urutan giliran ditentukan secara adil dan tidak bisa dimanipulasi siapa pun, termasuk pembuat grup
Menyediakan pencatatan kontribusi dan pencairan yang transparan dan bisa diaudit siapa saja
Menyediakan mekanisme jaminan otomatis (deposit) untuk menutup risiko anggota gagal bayar
Memenuhi syarat teknis Indonesia Web3 Hackathon: smart contract terdeploy di BNB Smart Chain atau opBNB (testnet/mainnet), dengan contract address terverifikasi di BscScan
4. Target Pengguna
Anggota komunitas online / diaspora — ingin ikut arisan dengan orang yang belum sepenuhnya dikenal secara personal, butuh jaminan yang trustless
Kelompok yang sudah saling kenal (keluarga, rekan kantor) — tetap diuntungkan dari transparansi pencatatan dan otomatisasi pencairan
Organizer/pembuat grup — ingin menjalankan arisan tanpa menanggung beban tanggung jawab penuh sebagai "pemegang uang"
5. Lingkup Produk
Termasuk dalam scope (MVP hackathon):

Pembuatan grup arisan dengan parameter dasar (jumlah anggota, nominal kontribusi per ronde, durasi ronde)
Pendaftaran anggota dengan deposit jaminan
Kontribusi rutin dalam stablecoin testnet (USDT/BUSD testnet di BSC/opBNB)
Penentuan urutan giliran lewat commit-reveal scheme on-chain (trustless, tanpa oracle eksternal)
Pencairan otomatis ke penerima giliran begitu kontribusi ronde lengkap
Penalti otomatis (slashing deposit) untuk anggota yang gagal bayar setelah menerima giliran
Riwayat kontribusi & pencairan yang bisa dicek siapa saja di BscScan
Di luar scope (dicatat sebagai roadmap, bukan bagian MVP):

Konversi ke Rupiah asli / off-ramp ke rekening bank atau e-wallet — anggota cash-out sendiri lewat exchange masing-masing
Dukungan multi-mata uang selain stablecoin
Sistem reputasi lintas-grup atau credit scoring
Integrasi Chainlink VRF — dipertimbangkan sebagai upgrade lanjutan, bukan MVP, karena ketersediaannya yang stabil di opBNB masih perlu diverifikasi
6. Spesifikasi Fungsional
#	Fitur	Deskripsi	Prioritas
F1	Buat grup arisan	Organizer set jumlah anggota, nominal kontribusi, dan durasi per ronde	Wajib
F2	Pendaftaran anggota	Calon anggota join dengan approve stablecoin + kirim deposit jaminan	Wajib
F3	Kontribusi per ronde	Anggota kirim nominal tetap tiap ronde ke kontrak	Wajib
F4	Penentuan urutan giliran	Commit-reveal on-chain, tidak bisa dimanipulasi organizer maupun anggota	Wajib
F5	Pencairan otomatis	Kontrak kirim total dana ke penerima giliran begitu kontribusi ronde lengkap	Wajib
F6	Penalti gagal bayar	Deposit anggota yang nunggak dipotong otomatis untuk menutup kekurangan	Wajib
F7	Riwayat transparan	Semua kontribusi & pencairan tercatat sebagai event on-chain	Wajib
F8	Notifikasi jatuh tempo	Reminder di app saat mendekati tanggal kontribusi	Nice-to-have
7. Arsitektur Teknis
7.1 Lapisan On-Chain (BNB Smart Chain / opBNB Testnet)
ArisanFactory.sol — kontrak pabrik yang membuat instance grup arisan baru
ArisanGroup.sol — logic inti per grup: pendaftaran, kontribusi, commit-reveal, pencairan, penalti
7.2 Lapisan Off-Chain / Frontend
Aplikasi mobile Flutter (reuse stack dari FinAI: Flutter + Riverpod + GoRouter)
Koneksi wallet lewat WalletConnect
Notifikasi pengingat jatuh tempo kontribusi (lokal, tidak membutuhkan backend server)
7.3 Alur Tingkat Tinggi
Anggota → (approve + kontribusi) → ArisanGroup.sol → (commit-reveal seluruh anggota) → urutan giliran ditentukan → pencairan otomatis ke penerima ronde → ulangi sampai semua anggota menerima giliran

8. Alur Pengguna (User Flow)
Organizer buat grup baru lewat ArisanFactory.sol (set jumlah anggota, nominal, jangka waktu)
Calon anggota join dengan approve stablecoin + kirim deposit jaminan
Begitu grup penuh, seluruh anggota commit hash rahasia untuk penentuan urutan
Semua anggota reveal, kontrak menghitung urutan giliran final
Setiap ronde: anggota kontribusi nominal tetap
Begitu kontribusi ronde lengkap, kontrak otomatis mengirim total dana ke penerima giliran ronde itu
Ulangi ronde sampai semua anggota pernah menerima
Deposit jaminan dikembalikan ke anggota yang taat sampai akhir; dipotong untuk yang gagal bayar
9. Skenario Pengujian / Demo untuk Juri
Skenario 1 — Ronde Normal: Semua anggota kontribusi tepat waktu → kontrak otomatis cairkan dana ke penerima giliran → transaksi tercatat dan bisa dicek langsung di BscScan opBNB Testnet.

Skenario 2 — Gagal Bayar: Salah satu anggota yang sudah menerima giliran disimulasikan tidak membayar ronde berikutnya → kontrak otomatis memotong deposit jaminan anggota tersebut untuk menutup kekurangan → sisa anggota tetap menerima giliran sesuai jadwal tanpa intervensi manual.

10. Risiko & Tingkat Kesulitan Teknis
Komponen	Tingkat Kesulitan	Catatan
Kontribusi & pencairan otomatis	Mudah–medium	Pola standar, mirip payment splitter/tontine contract
Commit-reveal untuk urutan giliran	Medium	Perlu penanganan kasus anggota yang tidak reveal
Deposit & slashing	Mudah	Pola escrow standar
Ketersediaan Chainlink VRF di opBNB	Belum terverifikasi	MVP memakai commit-reveal, bukan VRF, untuk hindari dependensi eksternal yang belum pasti
11. Metrik Keberhasilan
Satu siklus penuh arisan (semua ronde) berhasil dijalankan end-to-end di testnet dalam waktu demo
Kontrak terverifikasi di BscScan opBNB Testnet dengan contract address yang valid
Skenario gagal bayar berhasil ditangani otomatis tanpa intervensi manual
12. Roadmap Lanjutan (Pasca-Hackathon)
Integrasi off-ramp nyata (kerja sama dengan PSP berlisensi) untuk pencairan langsung ke rekening bank/e-wallet
Upgrade randomness ke Chainlink VRF apabila sudah tersedia stabil di opBNB
Dukungan multi-grup dalam satu dashboard, sistem reputasi anggota lintas grup
13. Lampiran: Interface Kontrak Tingkat Tinggi
interface IArisanGroup {
    function join(bytes32 depositCommitment) external;
    function contribute(uint256 round) external;
    function commitOrder(bytes32 hash) external;
    function revealOrder(uint256 secret) external;
    function claimPayout(uint256 round) external;
    function slashDefaulter(address member) external;

    event MemberJoined(address member);
    event ContributionMade(address member, uint256 round);
    event PayoutClaimed(address recipient, uint256 round, uint256 amount);
    event MemberSlashed(address member, uint256 amount);
}