const hre = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

/**
 * Demo Script — ArisanChain
 *
 * Menjalankan 2 skenario demo lengkap:
 *   Skenario 1: Ronde normal — semua anggota bayar, payout otomatis
 *   Skenario 2: Gagal bayar — satu anggota skip, deposit di-slash
 *
 * Cara jalankan:
 *   npx hardhat run scripts/demo.js
 */
async function main() {
  const [organizer, member1, member2] = await hre.ethers.getSigners();
  const accounts = [organizer, member1, member2];

  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║         🏦  ArisanChain — Demo Script  🏦        ║");
  console.log("╚══════════════════════════════════════════════════╝");
  console.log("");
  console.log("Organizer:", organizer.address);
  console.log("Member 1: ", member1.address);
  console.log("Member 2: ", member2.address);
  console.log("");

  // ============================
  // SETUP: Deploy contracts
  // ============================
  console.log("━━━ SETUP: Deploy Contracts ━━━");

  const MockUSDT = await hre.ethers.getContractFactory("MockUSDT");
  const mockUSDT = await MockUSDT.deploy();
  await mockUSDT.waitForDeployment();
  const tokenAddress = await mockUSDT.getAddress();
  console.log("✅ MockUSDT deployed:", tokenAddress);

  const ArisanFactory = await hre.ethers.getContractFactory("ArisanFactory");
  const factory = await ArisanFactory.deploy();
  await factory.waitForDeployment();
  console.log("✅ ArisanFactory deployed:", await factory.getAddress());

  // Mint tokens ke semua anggota
  const mintAmount = hre.ethers.parseEther("10000");
  for (const acc of accounts) {
    await mockUSDT.mint(acc.address, mintAmount);
  }
  console.log("✅ Minted 10,000 mUSDT ke setiap anggota");
  console.log("");

  // ============================
  // CREATE GROUP
  // ============================
  console.log("━━━ STEP 1: Buat Grup Arisan ━━━");

  const contributionAmount = hre.ethers.parseEther("100"); // 100 mUSDT per ronde
  const depositAmount = hre.ethers.parseEther("100");      // 100 mUSDT deposit (= contribution)
  const maxMembers = 3;
  const roundDuration = 86400; // 1 hari

  const tx = await factory.createGroup(
    tokenAddress,
    contributionAmount,
    depositAmount,
    maxMembers,
    roundDuration
  );
  const receipt = await tx.wait();

  const event = receipt.logs.find(log => {
    try { return factory.interface.parseLog(log)?.name === "GroupCreated"; }
    catch (e) { return false; }
  });
  const groupAddress = factory.interface.parseLog(event).args.groupAddress;

  const ArisanGroup = await hre.ethers.getContractFactory("ArisanGroup");
  const group = ArisanGroup.attach(groupAddress);

  console.log("✅ Grup arisan dibuat:", groupAddress);
  console.log("   Kontribusi per ronde: 100 mUSDT");
  console.log("   Deposit jaminan:      100 mUSDT");
  console.log("   Jumlah anggota:       3");
  console.log("   Versi kontrak:       ", await group.version());
  console.log("");

  // ============================
  // JOIN GROUP
  // ============================
  console.log("━━━ STEP 2: Anggota Bergabung ━━━");

  for (let i = 0; i < accounts.length; i++) {
    const acc = accounts[i];
    await mockUSDT.connect(acc).approve(groupAddress, depositAmount);
    await group.connect(acc).join();
    const label = i === 0 ? "Organizer" : `Member ${i}`;
    console.log(`✅ ${label} (${acc.address.slice(0, 8)}...) bergabung + deposit 100 mUSDT`);
  }

  let info = await group.getGroupInfo();
  console.log(`   State: ${stateToString(info.state)} | Members: ${info.currentMembers}/${info.maxMembers}`);
  console.log("");

  // ============================
  // COMMIT-REVEAL
  // ============================
  console.log("━━━ STEP 3: Commit-Reveal (Penentuan Urutan) ━━━");

  const secrets = [42n, 777n, 12345n];

  // Commit phase
  for (let i = 0; i < accounts.length; i++) {
    const hash = hre.ethers.solidityPackedKeccak256(
      ["uint256", "address"],
      [secrets[i], accounts[i].address]
    );
    await group.connect(accounts[i]).commitOrder(hash);
    const label = i === 0 ? "Organizer" : `Member ${i}`;
    console.log(`🔒 ${label} committed hash`);
  }

  // Reveal phase
  for (let i = 0; i < accounts.length; i++) {
    await group.connect(accounts[i]).revealOrder(secrets[i]);
    const label = i === 0 ? "Organizer" : `Member ${i}`;
    console.log(`🔓 ${label} revealed secret`);
  }

  const payoutOrder = await group.getPayoutOrder();
  console.log("");
  console.log("📋 Urutan giliran penerima:");
  for (let i = 0; i < payoutOrder.length; i++) {
    const label = getLabel(payoutOrder[i], accounts);
    console.log(`   Ronde ${i + 1}: ${label} (${payoutOrder[i].slice(0, 8)}...)`);
  }
  console.log("");

  // ============================
  // SKENARIO 1: Ronde Normal
  // ============================
  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║      📗 SKENARIO 1: Ronde Normal                ║");
  console.log("╚══════════════════════════════════════════════════╝");
  console.log("");

  console.log("━━━ Ronde 1: Semua anggota kontribusi ━━━");
  for (let i = 0; i < accounts.length; i++) {
    await mockUSDT.connect(accounts[i]).approve(groupAddress, contributionAmount);
    await group.connect(accounts[i]).contribute();
    const label = getLabel(accounts[i].address, accounts);
    console.log(`💰 ${label} kontribusi 100 mUSDT`);
  }

  const recipient0 = payoutOrder[0];
  const recipient0Label = getLabel(recipient0, accounts);
  const balance0After = await mockUSDT.balanceOf(recipient0);
  console.log(`\n🎉 Payout ronde 1: ${recipient0Label} menerima 300 mUSDT`);
  console.log(`   Saldo ${recipient0Label}: ${hre.ethers.formatEther(balance0After)} mUSDT`);
  console.log("");

  // ============================
  // SKENARIO 2: Gagal Bayar (Ronde 2)
  // ============================
  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║      📕 SKENARIO 2: Gagal Bayar + Slash         ║");
  console.log("╚══════════════════════════════════════════════════╝");
  console.log("");

  info = await group.getGroupInfo();
  console.log(`━━━ Ronde 2: Penerima = ${getLabel(payoutOrder[1], accounts)} ━━━`);

  const defaulterAddress = payoutOrder[0];
  const defaulterLabel = getLabel(defaulterAddress, accounts);

  for (let i = 0; i < accounts.length; i++) {
    if (accounts[i].address === defaulterAddress) {
      console.log(`❌ ${defaulterLabel} TIDAK kontribusi (simulasi gagal bayar)`);
      continue;
    }
    await mockUSDT.connect(accounts[i]).approve(groupAddress, contributionAmount);
    await group.connect(accounts[i]).contribute();
    const label = getLabel(accounts[i].address, accounts);
    console.log(`💰 ${label} kontribusi 100 mUSDT`);
  }

  console.log("\n⏩ Fast-forward melewati deadline ronde...");
  await hre.network.provider.send("evm_increaseTime", [86401]);
  await hre.network.provider.send("evm_mine");

  console.log(`⚡ Slashing deposit ${defaulterLabel}...`);
  await group.slashDefaulter(defaulterAddress);

  const defaulterInfo = await group.getMemberInfo(defaulterAddress);
  console.log(`   Sisa deposit ${defaulterLabel}: ${hre.ethers.formatEther(defaulterInfo.depositPaid)} mUSDT (dipotong 100 mUSDT)`);

  const recipient1 = payoutOrder[1];
  const recipient1Label = getLabel(recipient1, accounts);
  const balance1After = await mockUSDT.balanceOf(recipient1);
  console.log(`\n🎉 Payout ronde 2: ${recipient1Label} menerima dana (300 mUSDT)`);
  console.log(`   Saldo ${recipient1Label}: ${hre.ethers.formatEther(balance1After)} mUSDT`);
  console.log("");

  // ============================
  // STATUS AKHIR
  // ============================
  console.log("━━━ STATUS AKHIR ━━━");
  info = await group.getGroupInfo();
  console.log(`State: ${stateToString(info.state)} | Ronde selesai: ${info.currentRound}/${info.totalRounds}`);
  console.log("");

  for (let i = 0; i < accounts.length; i++) {
    const mInfo = await group.getMemberInfo(accounts[i].address);
    const balance = await mockUSDT.balanceOf(accounts[i].address);
    const label = getLabel(accounts[i].address, accounts);
    console.log(`${label}:`);
    console.log(`  Deposit tersisa: ${hre.ethers.formatEther(mInfo.depositPaid)} mUSDT`);
    console.log(`  Sudah terima payout: ${mInfo.hasReceivedPayout}`);
    console.log(`  Saldo wallet: ${hre.ethers.formatEther(balance)} mUSDT`);
  }

  console.log("\n✅ Demo selesai!");
}

function stateToString(state) {
  const states = ["OPEN", "COMMITTING", "REVEALING", "ACTIVE", "COMPLETED", "CANCELLED"];
  return states[Number(state)] || "UNKNOWN";
}

function getLabel(address, accounts) {
  if (address === accounts[0].address) return "Organizer";
  if (address === accounts[1].address) return "Member 1";
  if (address === accounts[2].address) return "Member 2";
  return address.slice(0, 8) + "...";
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Demo failed:", error);
    process.exit(1);
  });
