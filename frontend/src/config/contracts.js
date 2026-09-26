/**
 * Konfigurasi Smart Contract & Jaringan BNB Smart Chain Testnet
 * Alamat disinkronkan langsung dari deployment.json
 */

export const NETWORK_CONFIG = {
  chainId: 97,
  chainIdHex: "0x61",
  chainName: "BNB Smart Chain Testnet",
  nativeCurrency: {
    name: "tBNB",
    symbol: "tBNB",
    decimals: 18,
  },
  rpcUrls: [
    "https://data-seed-prebsc-1-s1.binance.org:8545",
    "https://bsc-testnet.public.blastapi.io",
  ],
  blockExplorerUrls: ["https://testnet.bscscan.com"],
};

export const CONTRACT_ADDRESSES = {
  MockUSDT: "0x79F41C959e47276fD860242413d6fFcE9cad5eA2",
  ArisanFactory: "0xDf76714269D68F78FF491BbDe2e3f331b9af434E",
  InitialExampleGroup: "0xADE66d006fA341cD5c3309DBf2e80fFAd719A7d8",
};

export const MOCK_USDT_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address account) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function mint(address to, uint256 amount)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];

export const ARISAN_FACTORY_ABI = [
  "function createGroup(address _token, uint256 _contributionAmount, uint256 _depositAmount, uint256 _maxMembers, uint256 _roundDuration) returns (address)",
  "function getGroups() view returns (address[])",
  "function getOrganizerGroups(address organizer) view returns (address[])",
  "function totalGroups() view returns (uint256)",
  "function isGroup(address) view returns (bool)",
  "function version() view returns (string)",
  "event GroupCreated(address indexed groupAddress, address indexed organizer, address token, uint256 contributionAmount, uint256 depositAmount, uint256 maxMembers, uint256 roundDuration)"
];

export const ARISAN_GROUP_ABI = [
  "function organizer() view returns (address)",
  "function token() view returns (address)",
  "function contributionAmount() view returns (uint256)",
  "function depositAmount() view returns (uint256)",
  "function maxMembers() view returns (uint256)",
  "function roundDuration() view returns (uint256)",
  "function state() view returns (uint8)",
  "function currentRound() view returns (uint256)",
  "function roundDeadline() view returns (uint256)",
  "function commitCount() view returns (uint256)",
  "function revealCount() view returns (uint256)",
  "function roundPayoutClaimed(uint256 round) view returns (bool)",
  "function members(uint256 index) view returns (address)",
  "function payoutOrder(uint256 index) view returns (address)",
  "function getGroupInfo() view returns (tuple(address organizer, address token, uint256 contributionAmount, uint256 depositAmount, uint256 maxMembers, uint256 currentMembers, uint256 currentRound, uint256 totalRounds, uint256 roundDeadline, uint8 state))",
  "function getMemberInfo(address member) view returns (tuple(bool isMember, bool hasReceivedPayout, uint256 depositPaid, uint256 roundsContributed, uint256 payoutRound, bool hasCommitted, bool hasRevealed))",
  "function getPayoutOrder() view returns (address[])",
  "function getRoundContributors(uint256 round) view returns (address[])",
  "function hasContributed(address member, uint256 round) view returns (bool)",
  "function version() pure returns (string)",
  "function join()",
  "function commitOrder(bytes32 hash)",
  "function revealOrder(uint256 secret)",
  "function contribute()",
  "function claimPayout()",
  "function slashDefaulter(address member)",
  "function returnDeposit()",
  "function emergencyWithdraw()",
  "event MemberJoined(address indexed member, uint256 depositAmount)",
  "event CommitSubmitted(address indexed member)",
  "event RevealSubmitted(address indexed member)",
  "event OrderFinalized(address[] order)",
  "event RoundStarted(uint256 indexed round, address indexed recipient, uint256 deadline)",
  "event ContributionMade(address indexed member, uint256 indexed round, uint256 amount)",
  "event PayoutClaimed(address indexed recipient, uint256 indexed round, uint256 amount)",
  "event MemberSlashed(address indexed member, uint256 slashedAmount, uint256 indexed round)",
  "event DepositReturned(address indexed member, uint256 amount)",
  "event GroupCompleted()"
];

export const GROUP_STATE_MAP = {
  0: { label: "Pendaftaran (OPEN)", color: "warning", key: "OPEN" },
  1: { label: "Commit Hash (COMMITTING)", color: "info", key: "COMMITTING" },
  2: { label: "Reveal Secret (REVEALING)", color: "secondary", key: "REVEALING" },
  3: { label: "Ronde Berjalan (ACTIVE)", color: "success", key: "ACTIVE" },
  4: { label: "Arisan Selesai (COMPLETED)", color: "neutral", key: "COMPLETED" },
  5: { label: "Dibatalkan (CANCELLED)", color: "danger", key: "CANCELLED" },
};
