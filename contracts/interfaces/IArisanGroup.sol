// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IArisanGroup
 * @author ArisanChain Team
 * @notice Interface untuk kontrak ArisanGroup — arisan on-chain yang trustless.
 */
interface IArisanGroup {
    // ======================== Enums ========================

    enum GroupState {
        OPEN,        // Menunggu anggota bergabung
        COMMITTING,  // Fase commit hash untuk penentuan urutan
        REVEALING,   // Fase reveal secret
        ACTIVE,      // Arisan berjalan (ronde kontribusi & pencairan)
        COMPLETED,   // Semua ronde selesai
        CANCELLED    // Grup dibatalkan / emergency
    }

    // ======================== Structs ========================

    struct GroupInfo {
        address organizer;
        address token;
        uint256 contributionAmount;
        uint256 depositAmount;
        uint256 maxMembers;
        uint256 currentMembers;
        uint256 currentRound;
        uint256 totalRounds;
        uint256 roundDeadline;
        GroupState state;
    }

    struct MemberInfo {
        bool isMember;
        bool hasReceivedPayout;
        uint256 depositPaid;
        uint256 roundsContributed;
        uint256 payoutRound; // Ronde di mana anggota ini menerima giliran
        bool hasCommitted;
        bool hasRevealed;
    }

    // ======================== Custom Errors ========================

    error InvalidState(GroupState expected, GroupState actual);
    error NotMember(address caller);
    error AlreadyJoined(address member);
    error GroupFull(uint256 maxMembers);
    error ZeroAddress();
    error InvalidAmount(string param);
    error DepositTooLow(uint256 deposit, uint256 contribution);
    error MinTwoMembers();
    error AlreadyCommitted(address member);
    error EmptyHash();
    error NotCommitted(address member);
    error AlreadyRevealed(address member);
    error InvalidReveal(address member);
    error AllRoundsCompleted();
    error AlreadyContributed(address member, uint256 round);
    error RoundDeadlinePassed(uint256 deadline, uint256 currentTime);
    error RoundStillActive(uint256 deadline, uint256 currentTime);
    error PayoutAlreadyClaimed(uint256 round);
    error NotPayoutRecipient(address caller, address expected);
    error NoDepositToSlash(address member);
    error MemberAlreadyContributed(address member, uint256 round);
    error NoDepositToReturn(address member);
    error NothingToWithdraw(address member);
    error TimelockNotExpired(uint256 unlockTime, uint256 currentTime);

    // ======================== Events ========================

    event MemberJoined(address indexed member, uint256 depositAmount);
    event CommitSubmitted(address indexed member);
    event RevealSubmitted(address indexed member);
    event OrderFinalized(address[] order);
    event RoundStarted(uint256 indexed round, address indexed recipient, uint256 deadline);
    event ContributionMade(address indexed member, uint256 indexed round, uint256 amount);
    event PayoutClaimed(address indexed recipient, uint256 indexed round, uint256 amount);
    event MemberSlashed(address indexed member, uint256 slashedAmount, uint256 indexed round);
    event DepositReturned(address indexed member, uint256 amount);
    event GroupCompleted();
    event EmergencyWithdraw(address indexed member, uint256 amount);

    // ======================== Functions ========================

    function join() external;
    function commitOrder(bytes32 hash) external;
    function revealOrder(uint256 secret) external;
    function contribute() external;
    function claimPayout() external;
    function slashDefaulter(address member) external;
    function returnDeposit() external;
    function emergencyWithdraw() external;

    // ======================== View Functions ========================

    function getGroupInfo() external view returns (GroupInfo memory);
    function getMemberInfo(address member) external view returns (MemberInfo memory);
    function getPayoutOrder() external view returns (address[] memory);
    function getRoundContributors(uint256 round) external view returns (address[] memory);
    function hasContributed(address member, uint256 round) external view returns (bool);
    function version() external pure returns (string memory);
}
