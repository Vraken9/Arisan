import { ethers } from "ethers";
import {
  NETWORK_CONFIG,
  CONTRACT_ADDRESSES,
  MOCK_USDT_ABI,
  ARISAN_FACTORY_ABI,
  ARISAN_GROUP_ABI,
} from "../config/contracts";

/**
 * Fallback read-only provider (BSC Testnet public RPC)
 */
export function getReadOnlyProvider() {
  return new ethers.JsonRpcProvider(NETWORK_CONFIG.rpcUrls[0], {
    chainId: NETWORK_CONFIG.chainId,
    name: "bscTestnet",
  });
}

/**
 * Get Browser Provider & Signer from window.ethereum
 */
export async function getBrowserProviderAndSigner() {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask atau Web3 Wallet tidak ditemukan! Silakan instal ekstensi MetaMask.");
  }
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  return { provider, signer };
}

/**
 * Request wallet connection
 */
export async function connectWallet() {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask tidak ditemukan. Silakan pasang ekstensi MetaMask di browser Anda.");
  }

  const accounts = await window.ethereum.request({
    method: "eth_requestAccounts",
  });

  if (!accounts || accounts.length === 0) {
    throw new Error("Tidak ada akun yang dipilih.");
  }

  // Check and switch network if necessary
  await ensureBscTestnetNetwork();

  const { provider, signer } = await getBrowserProviderAndSigner();
  const address = await signer.getAddress();
  const balanceWei = await provider.getBalance(address);
  const balanceEth = ethers.formatEther(balanceWei);

  return {
    address,
    balanceEth,
    signer,
    provider,
  };
}

/**
 * Ensure user is on BSC Testnet (Chain ID: 97)
 */
export async function ensureBscTestnetNetwork() {
  if (typeof window === "undefined" || !window.ethereum) return;

  const currentChainId = await window.ethereum.request({ method: "eth_chainId" });
  if (currentChainId === NETWORK_CONFIG.chainIdHex) {
    return true;
  }

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: NETWORK_CONFIG.chainIdHex }],
    });
    return true;
  } catch (switchError) {
    // Error code 4902 means the chain has not been added to MetaMask
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: NETWORK_CONFIG.chainIdHex,
              chainName: NETWORK_CONFIG.chainName,
              nativeCurrency: NETWORK_CONFIG.nativeCurrency,
              rpcUrls: NETWORK_CONFIG.rpcUrls,
              blockExplorerUrls: NETWORK_CONFIG.blockExplorerUrls,
            },
          ],
        });
        return true;
      } catch (addError) {
        throw new Error("Gagal menambahkan jaringan BSC Testnet ke MetaMask.");
      }
    }
    throw new Error("Harap ganti jaringan MetaMask ke BNB Smart Chain Testnet.");
  }
}

/**
 * Get MockUSDT Contract instance
 */
export function getMockUSDTContract(signerOrProvider) {
  return new ethers.Contract(
    CONTRACT_ADDRESSES.MockUSDT,
    MOCK_USDT_ABI,
    signerOrProvider
  );
}

/**
 * Get ArisanFactory Contract instance
 */
export function getFactoryContract(signerOrProvider) {
  return new ethers.Contract(
    CONTRACT_ADDRESSES.ArisanFactory,
    ARISAN_FACTORY_ABI,
    signerOrProvider
  );
}

/**
 * Get ArisanGroup Contract instance
 */
export function getGroupContract(groupAddress, signerOrProvider) {
  return new ethers.Contract(
    groupAddress,
    ARISAN_GROUP_ABI,
    signerOrProvider
  );
}

/**
 * Mint MockUSDT tokens (Faucet - Opsi B)
 */
export async function mintMockUSDT(recipientAddress, amountStr = "1000") {
  const { signer } = await getBrowserProviderAndSigner();
  const tokenContract = getMockUSDTContract(signer);
  const amountWei = ethers.parseEther(amountStr);
  const tx = await tokenContract.mint(recipientAddress, amountWei);
  return tx.wait();
}

/**
 * Fetch MockUSDT balance
 */
export async function getMockUSDTBalance(accountAddress, providerOrSigner) {
  try {
    const tokenContract = getMockUSDTContract(providerOrSigner || getReadOnlyProvider());
    const balance = await tokenContract.balanceOf(accountAddress);
    return ethers.formatEther(balance);
  } catch (error) {
    console.error("Error fetching mUSDT balance:", error);
    return "0.0";
  }
}

/**
 * Compute commitment hash for ArisanGroup commit-reveal
 * hash = keccak256(abi.encodePacked(uint256 secret, address member))
 */
export function computeCommitmentHash(secretBigInt, memberAddress) {
  return ethers.solidityPackedKeccak256(
    ["uint256", "address"],
    [secretBigInt.toString(), memberAddress]
  );
}

/**
 * Generate a cryptographically secure random uint256
 */
export function generateRandomSecret() {
  const randomBytes = ethers.randomBytes(32);
  const hex = ethers.hexlify(randomBytes);
  return BigInt(hex);
}

/**
 * Helper to shorten addresses
 */
export function shortenAddress(address, chars = 4) {
  if (!address) return "";
  return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
}

/**
 * Format timestamp to localized readable string
 */
export function formatTimestamp(timestampSec) {
  if (!timestampSec || Number(timestampSec) === 0) return "-";
  const date = new Date(Number(timestampSec) * 1000);
  return date.toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function formatDuration(seconds) {
  const s = Number(seconds);
  if (isNaN(s) || s <= 0) return "24 Jam";
  if (s < 60) return `${s} Detik`;
  if (s < 3600) return `${Math.round(s / 60)} Menit`;
  if (s < 86400) return `${Math.round(s / 3600)} Jam`;
  return `${Math.round(s / 86400)} Hari`;
}

