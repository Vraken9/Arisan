const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Mint MockUSDT tokens ke semua wallet yang ada di .env
 * 
 * Cara pakai:
 *   npx hardhat run scripts/mint-tokens.js --network bscTestnet
 * 
 * Pastikan deployment.json sudah ada (jalankan deploy.js dulu)
 */
async function main() {
  // Load deployment addresses
  const deploymentPath = path.join(__dirname, "..", "deployment.json");
  if (!fs.existsSync(deploymentPath)) {
    console.error("❌ deployment.json tidak ditemukan! Jalankan deploy.js terlebih dahulu.");
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const mockUSDTAddress = deployment.contracts.MockUSDT;

  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║      💰 ArisanChain — Mint Tokens Script 💰     ║");
  console.log("╚══════════════════════════════════════════════════╝");
  console.log("");
  console.log("MockUSDT Address:", mockUSDTAddress);
  console.log("Network:", hre.network.name);
  console.log("");

  // Get MockUSDT contract
  const MockUSDT = await hre.ethers.getContractFactory("MockUSDT");
  const mockUSDT = MockUSDT.attach(mockUSDTAddress);

  // Get all signers (wallets dari .env)
  const signers = await hre.ethers.getSigners();
  const mintAmount = hre.ethers.parseEther("10000"); // 10,000 mUSDT per wallet

  console.log("━━━ Minting 10,000 mUSDT ke setiap wallet ━━━");
  console.log("");

  for (let i = 0; i < signers.length; i++) {
    const wallet = signers[i];
    const label = i === 0 ? "Wallet Utama (Deployer)" : `Wallet Demo ${i}`;
    
    try {
      const tx = await mockUSDT.mint(wallet.address, mintAmount);
      await tx.wait();
      
      const balance = await mockUSDT.balanceOf(wallet.address);
      console.log(`✅ ${label}: ${wallet.address}`);
      console.log(`   Minted: 10,000 mUSDT | Total Balance: ${hre.ethers.formatEther(balance)} mUSDT`);
      console.log("");
    } catch (error) {
      console.log(`❌ ${label}: ${wallet.address}`);
      console.log(`   Error: ${error.message}`);
      console.log("");
    }
  }

  console.log("✅ Selesai! Semua wallet sudah punya mUSDT untuk demo.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Mint failed:", error);
    process.exit(1);
  });
