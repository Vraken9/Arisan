// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IArisanGroup.sol";

/**
 * @title ArisanGroup
 * @author ArisanChain Team
 * @notice Kontrak inti arisan on-chain — mengelola satu siklus arisan lengkap
 *         dari pendaftaran, penentuan urutan giliran (commit-reveal), kontribusi
 *         per ronde, pencairan otomatis, hingga penalti gagal bayar.
 *
 * @dev Flow:
 *   OPEN → anggota join + deposit
 *   COMMITTING → semua anggota commit hash
 *   REVEALING → semua anggota reveal secret → urutan ditentukan
 *   ACTIVE → kontribusi per ronde → pencairan otomatis
 *   COMPLETED → deposit dikembalikan ke anggota yang taat
 *
 * Security features:
 *   - ReentrancyGuard pada semua fungsi yang transfer token
 *   - SafeERC20 untuk transfer yang aman
 *   - Deposit >= Contribution untuk jaminan penuh
 *   - Emergency withdraw dengan timelock 7 hari
 *   - Custom errors untuk gas optimization
 */
contract ArisanGroup is IArisanGroup, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ======================== Constants ========================

    /// @notice Versi kontrak
    string public constant VERSION = "1.0.0";

    /// @notice Waktu tunggu sebelum emergency withdraw bisa dilakukan
    uint256 public constant EMERGENCY_TIMELOCK = 7 days;

    // ======================== State Variables ========================

    /// @notice Address pembuat grup arisan
    address public organizer;

    /// @notice Token ERC20 yang digunakan (stablecoin)
    IERC20 public token;

    /// @notice Nominal kontribusi yang harus dibayar setiap anggota per ronde
    uint256 public contributionAmount;

    /// @notice Deposit jaminan yang harus dibayar saat join (>= contributionAmount)
    uint256 public depositAmount;

    /// @notice Jumlah maksimal anggota dalam grup
    uint256 public maxMembers;

    /// @notice Durasi setiap ronde dalam detik
    uint256 public roundDuration;

    /// @notice State saat ini dari grup arisan
    GroupState public state;

    /// @notice Ronde saat ini (0-indexed)
    uint256 public currentRound;

    /// @notice Timestamp aktivitas terakhir (untuk emergency timelock)
    uint256 public lastActivityTimestamp;

    // Members
    address[] public members;
    mapping(address => MemberInfo) private _memberInfo;

    // Commit-reveal
    mapping(address => bytes32) public commits;
    uint256 public commitCount;
    uint256 public revealCount;
    mapping(address => uint256) public revealedSecrets;

    // Payout order (ditentukan setelah reveal)
    address[] public payoutOrder;

    // Round tracking
    uint256 public roundDeadline;
    mapping(uint256 => mapping(address => bool)) public roundContributions;
    mapping(uint256 => address[]) private _roundContributors;
    mapping(uint256 => bool) public roundPayoutClaimed;

    // ======================== Modifiers ========================

    /// @dev Memastikan kontrak dalam state yang diharapkan
    modifier onlyState(GroupState _state) {
        if (state != _state) revert InvalidState(_state, state);
        _;
    }

    /// @dev Memastikan caller adalah anggota terdaftar
    modifier onlyMember() {
        if (!_memberInfo[msg.sender].isMember) revert NotMember(msg.sender);
        _;
    }

    // ======================== Constructor ========================

    /**
     * @notice Inisialisasi grup arisan baru.
     * @param _organizer Address pembuat grup
     * @param _token Address stablecoin (MockUSDT di testnet)
     * @param _contributionAmount Nominal kontribusi per ronde
     * @param _depositAmount Deposit jaminan (harus >= _contributionAmount)
     * @param _maxMembers Jumlah maksimal anggota (minimal 2)
     * @param _roundDuration Durasi setiap ronde (dalam detik)
     */
    constructor(
        address _organizer,
        address _token,
        uint256 _contributionAmount,
        uint256 _depositAmount,
        uint256 _maxMembers,
        uint256 _roundDuration
    ) {
        if (_organizer == address(0)) revert ZeroAddress();
        if (_token == address(0)) revert ZeroAddress();
        if (_contributionAmount == 0) revert InvalidAmount("contribution");
        if (_depositAmount == 0) revert InvalidAmount("deposit");
        if (_maxMembers < 2) revert MinTwoMembers();
        if (_roundDuration == 0) revert InvalidAmount("roundDuration");
        if (_depositAmount < _contributionAmount) {
            revert DepositTooLow(_depositAmount, _contributionAmount);
        }

        organizer = _organizer;
        token = IERC20(_token);
        contributionAmount = _contributionAmount;
        depositAmount = _depositAmount;
        maxMembers = _maxMembers;
        roundDuration = _roundDuration;

        state = GroupState.OPEN;
        lastActivityTimestamp = block.timestamp;
    }

    // ======================== Core Functions ========================

    /**
     * @notice Bergabung ke grup arisan dengan membayar deposit jaminan.
     *         Caller harus `approve()` token terlebih dahulu sebesar `depositAmount`.
     * @dev State transition: OPEN → COMMITTING (otomatis jika grup penuh)
     */
    function join() external onlyState(GroupState.OPEN) nonReentrant {
        if (_memberInfo[msg.sender].isMember) revert AlreadyJoined(msg.sender);
        if (members.length >= maxMembers) revert GroupFull(maxMembers);

        // Transfer deposit dari anggota ke kontrak
        token.safeTransferFrom(msg.sender, address(this), depositAmount);

        // Register member
        members.push(msg.sender);
        _memberInfo[msg.sender] = MemberInfo({
            isMember: true,
            hasReceivedPayout: false,
            depositPaid: depositAmount,
            roundsContributed: 0,
            payoutRound: 0,
            hasCommitted: false,
            hasRevealed: false
        });

        lastActivityTimestamp = block.timestamp;
        emit MemberJoined(msg.sender, depositAmount);

        // Otomatis pindah ke fase COMMITTING jika grup sudah penuh
        if (members.length == maxMembers) {
            state = GroupState.COMMITTING;
        }
    }

    /**
     * @notice Submit commit hash untuk penentuan urutan giliran.
     * @dev hash = keccak256(abi.encodePacked(secret, msg.sender))
     *      dimana `secret` adalah uint256 random yang dipilih anggota.
     * @param hash Hash dari (secret + address pengirim)
     */
    function commitOrder(bytes32 hash) external onlyState(GroupState.COMMITTING) onlyMember {
        if (_memberInfo[msg.sender].hasCommitted) revert AlreadyCommitted(msg.sender);
        if (hash == bytes32(0)) revert EmptyHash();

        commits[msg.sender] = hash;
        _memberInfo[msg.sender].hasCommitted = true;
        commitCount++;

        lastActivityTimestamp = block.timestamp;
        emit CommitSubmitted(msg.sender);

        // Otomatis pindah ke fase REVEALING jika semua sudah commit
        if (commitCount == maxMembers) {
            state = GroupState.REVEALING;
        }
    }

    /**
     * @notice Reveal secret yang di-commit sebelumnya.
     *         Kontrak memverifikasi hash(secret, msg.sender) == commit.
     *         Setelah semua reveal, urutan giliran ditentukan otomatis.
     * @param secret Angka rahasia yang dipilih saat commit
     */
    function revealOrder(uint256 secret) external onlyState(GroupState.REVEALING) onlyMember {
        if (!_memberInfo[msg.sender].hasCommitted) revert NotCommitted(msg.sender);
        if (_memberInfo[msg.sender].hasRevealed) revert AlreadyRevealed(msg.sender);

        // Verifikasi hash
        bytes32 expectedHash = keccak256(abi.encodePacked(secret, msg.sender));
        if (expectedHash != commits[msg.sender]) revert InvalidReveal(msg.sender);

        revealedSecrets[msg.sender] = secret;
        _memberInfo[msg.sender].hasRevealed = true;
        revealCount++;

        lastActivityTimestamp = block.timestamp;
        emit RevealSubmitted(msg.sender);

        // Jika semua sudah reveal, tentukan urutan giliran
        if (revealCount == maxMembers) {
            _finalizeOrder();
        }
    }

    /**
     * @notice Kontribusi untuk ronde saat ini.
     *         Caller harus `approve()` token terlebih dahulu sebesar `contributionAmount`.
     * @dev Otomatis trigger pencairan jika semua anggota sudah kontribusi.
     */
    function contribute() external onlyState(GroupState.ACTIVE) onlyMember nonReentrant {
        if (currentRound >= maxMembers) revert AllRoundsCompleted();
        if (roundContributions[currentRound][msg.sender]) {
            revert AlreadyContributed(msg.sender, currentRound);
        }
        if (block.timestamp > roundDeadline) {
            revert RoundDeadlinePassed(roundDeadline, block.timestamp);
        }

        // Transfer kontribusi
        token.safeTransferFrom(msg.sender, address(this), contributionAmount);

        roundContributions[currentRound][msg.sender] = true;
        _roundContributors[currentRound].push(msg.sender);
        _memberInfo[msg.sender].roundsContributed++;

        lastActivityTimestamp = block.timestamp;
        emit ContributionMade(msg.sender, currentRound, contributionAmount);

        // Jika semua anggota sudah kontribusi ronde ini, otomatis cairkan
        if (_roundContributors[currentRound].length == maxMembers) {
            _processRoundPayout();
        }
    }

    /**
     * @notice Klaim payout untuk ronde saat ini setelah deadline lewat.
     *         Hanya bisa dipanggil oleh penerima giliran ronde ini.
     *         Digunakan bersama slashDefaulter() untuk menutup kekurangan dari defaulter.
     */
    function claimPayout() external onlyState(GroupState.ACTIVE) onlyMember nonReentrant {
        if (block.timestamp <= roundDeadline) {
            revert RoundStillActive(roundDeadline, block.timestamp);
        }
        if (roundPayoutClaimed[currentRound]) {
            revert PayoutAlreadyClaimed(currentRound);
        }

        address recipient = payoutOrder[currentRound];
        if (msg.sender != recipient) {
            revert NotPayoutRecipient(msg.sender, recipient);
        }

        _processRoundPayout();
    }

    /**
     * @notice Slash deposit anggota yang gagal bayar setelah deadline ronde lewat.
     *         Deposit yang dipotong digunakan untuk menutup kekurangan kontribusi.
     *         Bisa dipanggil oleh siapa saja (public enforcement).
     * @param member Address anggota yang gagal bayar
     */
    function slashDefaulter(address member) external onlyState(GroupState.ACTIVE) nonReentrant {
        if (block.timestamp <= roundDeadline) {
            revert RoundStillActive(roundDeadline, block.timestamp);
        }
        if (!_memberInfo[member].isMember) revert NotMember(member);
        if (roundContributions[currentRound][member]) {
            revert MemberAlreadyContributed(member, currentRound);
        }
        if (_memberInfo[member].depositPaid == 0) revert NoDepositToSlash(member);

        // Hitung jumlah yang di-slash (kontribusi yang seharusnya dibayar)
        uint256 slashAmount = contributionAmount;
        if (slashAmount > _memberInfo[member].depositPaid) {
            slashAmount = _memberInfo[member].depositPaid;
        }

        _memberInfo[member].depositPaid -= slashAmount;

        // Tandai sebagai sudah kontribusi (melalui slash)
        roundContributions[currentRound][member] = true;
        _roundContributors[currentRound].push(member);

        lastActivityTimestamp = block.timestamp;
        emit MemberSlashed(member, slashAmount, currentRound);

        // Jika setelah slash semua anggota sudah "kontribusi", proses payout
        if (_roundContributors[currentRound].length == maxMembers) {
            _processRoundPayout();
        }
    }

    /**
     * @notice Kembalikan deposit ke anggota yang taat setelah arisan selesai.
     * @dev Hanya bisa dipanggil di state COMPLETED.
     */
    function returnDeposit() external onlyState(GroupState.COMPLETED) onlyMember nonReentrant {
        uint256 deposit = _memberInfo[msg.sender].depositPaid;
        if (deposit == 0) revert NoDepositToReturn(msg.sender);

        _memberInfo[msg.sender].depositPaid = 0;
        token.safeTransfer(msg.sender, deposit);

        emit DepositReturned(msg.sender, deposit);
    }

    /**
     * @notice Emergency withdraw jika grup macet total.
     *         Bisa dipanggil setelah tidak ada aktivitas selama EMERGENCY_TIMELOCK (7 hari).
     *         Setiap anggota bisa menarik sisa deposit masing-masing.
     * @dev Mengubah state ke CANCELLED.
     */
    function emergencyWithdraw() external onlyMember nonReentrant {
        uint256 unlockTime = lastActivityTimestamp + EMERGENCY_TIMELOCK;
        if (block.timestamp <= unlockTime) {
            revert TimelockNotExpired(unlockTime, block.timestamp);
        }

        uint256 deposit = _memberInfo[msg.sender].depositPaid;
        if (deposit == 0) revert NothingToWithdraw(msg.sender);

        _memberInfo[msg.sender].depositPaid = 0;
        state = GroupState.CANCELLED;

        token.safeTransfer(msg.sender, deposit);

        emit EmergencyWithdraw(msg.sender, deposit);
    }

    // ======================== Internal Functions ========================

    /**
     * @dev Menentukan urutan giliran berdasarkan XOR semua secret,
     *      kemudian shuffle array anggota menggunakan Fisher-Yates algorithm.
     *      Algoritma ini trustless karena setiap anggota berkontribusi pada seed.
     */
    function _finalizeOrder() internal {
        // XOR semua secret menjadi satu seed
        uint256 combinedSeed = 0;
        for (uint256 i = 0; i < members.length; i++) {
            combinedSeed ^= revealedSecrets[members[i]];
        }

        // Buat copy array members untuk di-shuffle
        address[] memory order = new address[](members.length);
        for (uint256 i = 0; i < members.length; i++) {
            order[i] = members[i];
        }

        // Fisher-Yates shuffle menggunakan combined seed
        for (uint256 i = order.length - 1; i > 0; i--) {
            uint256 j = uint256(keccak256(abi.encodePacked(combinedSeed, i))) % (i + 1);
            // Swap
            address temp = order[i];
            order[i] = order[j];
            order[j] = temp;
        }

        // Simpan urutan final
        for (uint256 i = 0; i < order.length; i++) {
            payoutOrder.push(order[i]);
            _memberInfo[order[i]].payoutRound = i;
        }

        // Mulai ronde pertama
        state = GroupState.ACTIVE;
        currentRound = 0;
        roundDeadline = block.timestamp + roundDuration;

        emit OrderFinalized(order);
        emit RoundStarted(0, payoutOrder[0], roundDeadline);
    }

    /**
     * @dev Proses pencairan dana ronde saat ini ke penerima giliran,
     *      kemudian mulai ronde berikutnya atau selesaikan arisan.
     */
    function _processRoundPayout() internal {
        if (roundPayoutClaimed[currentRound]) revert PayoutAlreadyClaimed(currentRound);

        address recipient = payoutOrder[currentRound];
        uint256 payoutAmount = contributionAmount * maxMembers;

        // Cek apakah kontrak punya cukup dana (proteksi terhadap edge case)
        uint256 available = token.balanceOf(address(this)) - _totalDeposits();
        if (payoutAmount > available) {
            payoutAmount = available;
        }

        roundPayoutClaimed[currentRound] = true;
        _memberInfo[recipient].hasReceivedPayout = true;

        token.safeTransfer(recipient, payoutAmount);

        emit PayoutClaimed(recipient, currentRound, payoutAmount);

        // Pindah ke ronde berikutnya atau selesai
        currentRound++;
        if (currentRound >= maxMembers) {
            state = GroupState.COMPLETED;
            emit GroupCompleted();
        } else {
            roundDeadline = block.timestamp + roundDuration;
            emit RoundStarted(currentRound, payoutOrder[currentRound], roundDeadline);
        }

        lastActivityTimestamp = block.timestamp;
    }

    /**
     * @dev Hitung total deposit yang masih tersimpan di kontrak.
     * @return total Jumlah total deposit semua anggota
     */
    function _totalDeposits() internal view returns (uint256 total) {
        for (uint256 i = 0; i < members.length; i++) {
            total += _memberInfo[members[i]].depositPaid;
        }
    }

    // ======================== View Functions ========================

    /// @notice Return informasi lengkap grup arisan.
    function getGroupInfo() external view returns (GroupInfo memory) {
        return GroupInfo({
            organizer: organizer,
            token: address(token),
            contributionAmount: contributionAmount,
            depositAmount: depositAmount,
            maxMembers: maxMembers,
            currentMembers: members.length,
            currentRound: currentRound,
            totalRounds: maxMembers,
            roundDeadline: roundDeadline,
            state: state
        });
    }

    /// @notice Return informasi anggota tertentu.
    function getMemberInfo(address member) external view returns (MemberInfo memory) {
        return _memberInfo[member];
    }

    /// @notice Return urutan penerima giliran.
    function getPayoutOrder() external view returns (address[] memory) {
        return payoutOrder;
    }

    /// @notice Return daftar anggota yang sudah kontribusi di ronde tertentu.
    function getRoundContributors(uint256 round) external view returns (address[] memory) {
        return _roundContributors[round];
    }

    /// @notice Cek apakah anggota sudah kontribusi di ronde tertentu.
    function hasContributed(address member, uint256 round) external view returns (bool) {
        return roundContributions[round][member];
    }

    /// @notice Return daftar semua anggota.
    function getMembers() external view returns (address[] memory) {
        return members;
    }

    /// @notice Return jumlah anggota saat ini.
    function getMemberCount() external view returns (uint256) {
        return members.length;
    }

    /// @notice Return versi kontrak.
    function version() external pure returns (string memory) {
        return VERSION;
    }
}
