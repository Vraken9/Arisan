const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("=== ArisanChain Deployment ===");
  console.log("Deployer:", deployer.address);
  console.log("Balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "BNB");
  console.log("Network:", hre.network.name);
  console.log("");

  // ---- 1. Deploy MockUSDT ----
  console.log("1. Deploying MockUSDT...");
  const MockUSDT = await hre.ethers.getContractFactory("MockUSDT");
  const mockUSDT = await MockUSDT.deploy();
  await mockUSDT.waitForDeployment();
  const mockUSDTAddress = await mockUSDT.getAddress();
  console.log("   ✅ MockUSDT deployed at:", mockUSDTAddress);
  console.log("");

  // ---- 2. Deploy ArisanFactory ----
  console.log("2. Deploying ArisanFactory...");
  const ArisanFactory = await hre.ethers.getContractFactory("ArisanFactory");
  const factory = await ArisanFactory.deploy();
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("   ✅ ArisanFactory deployed at:", factoryAddress);
  console.log("");

  // ---- 3. Buat contoh ArisanGroup melalui Factory ----
  console.log("3. Creating example ArisanGroup via Factory...");
  const contributionAmount = hre.ethers.parseEther("100"); // 100 mUSDT
  const depositAmount = hre.ethers.parseEther("100");      // 100 mUSDT deposit (>= contribution)
  const maxMembers = 3;
  const roundDuration = 86400; // 1 hari (24 jam)

  const tx = await factory.createGroup(
    mockUSDTAddress,
    contributionAmount,
    depositAmount,
    maxMembers,
    roundDuration
  );
  const receipt = await tx.wait();

  // Parse event untuk mendapatkan address grup
  const groupCreatedEvent = receipt.logs.find(log => {
    try {
      return factory.interface.parseLog(log)?.name === "GroupCreated";
    } catch (e) { return false; }
  });

  let groupAddress;
  if (groupCreatedEvent) {
    const parsed = factory.interface.parseLog(groupCreatedEvent);
    groupAddress = parsed.args.groupAddress;
  } else {
    const groups = await factory.getGroups();
    groupAddress = groups[groups.length - 1];
  }
  console.log("   ✅ ArisanGroup created at:", groupAddress);
  console.log("");

  // ---- Save Deployed Addresses ----
  const deploymentData = {
    network: hre.network.name,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    contracts: {
      MockUSDT: mockUSDTAddress,
      ArisanFactory: factoryAddress,
      ArisanGroup: groupAddress,
    },
    parameters: {
      contributionAmount: "100 mUSDT",
      depositAmount: "100 mUSDT",
      maxMembers: maxMembers,
      roundDuration: `${roundDuration} seconds (${roundDuration / 3600} hours)`,
    },
  };

  const deploymentPath = path.join(__dirname, "..", "deployment.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentData, null, 2));
  console.log("📁 Addresses saved to deployment.json");
  console.log("");

  // ---- Summary ----
  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║           Deployment Summary                     ║");
  console.log("╚══════════════════════════════════════════════════╝");
  console.log("Network:        ", hre.network.name);
  console.log("MockUSDT:       ", mockUSDTAddress);
  console.log("ArisanFactory:  ", factoryAddress);
  console.log("ArisanGroup:    ", groupAddress);
  console.log("");

  // ---- Verification Commands ----
  console.log("=== Verification Commands ===");
  console.log(`npx hardhat verify --network bscTestnet ${mockUSDTAddress}`);
  console.log(`npx hardhat verify --network bscTestnet ${factoryAddress}`);
  console.log("");

  // ---- BscScan Links ----
  if (hre.network.name === "bscTestnet") {
    console.log("=== BscScan Links ===");
    console.log(`MockUSDT:      https://testnet.bscscan.com/address/${mockUSDTAddress}`);
    console.log(`ArisanFactory: https://testnet.bscscan.com/address/${factoryAddress}`);
    console.log(`ArisanGroup:   https://testnet.bscscan.com/address/${groupAddress}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
