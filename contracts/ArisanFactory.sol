// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./ArisanGroup.sol";

/**
 * @title ArisanFactory
 * @author ArisanChain Team
 * @notice Factory contract untuk membuat instance ArisanGroup baru.
 *         Menyimpan daftar semua grup yang pernah dibuat.
 */
contract ArisanFactory {
    // ======================== Constants ========================

    /// @notice Versi kontrak factory
    string public constant VERSION = "1.0.0";

    // ======================== State Variables ========================

    /// @notice Daftar semua grup arisan yang pernah dibuat
    address[] public groups;

    /// @notice Mapping organizer → daftar grup yang dibuat
    mapping(address => address[]) public organizerGroups;

    // ======================== Events ========================

    event GroupCreated(
        address indexed groupAddress,
        address indexed organizer,
        address token,
        uint256 contributionAmount,
        uint256 depositAmount,
        uint256 maxMembers,
        uint256 roundDuration
    );

    // ======================== Functions ========================

    /**
     * @notice Buat grup arisan baru dengan parameter yang ditentukan.
     * @param _token Address stablecoin yang digunakan (MockUSDT di testnet)
     * @param _contributionAmount Nominal kontribusi per ronde
     * @param _depositAmount Deposit jaminan yang harus dibayar saat join (harus >= _contributionAmount)
     * @param _maxMembers Jumlah anggota dalam grup (minimal 2)
     * @param _roundDuration Durasi setiap ronde dalam detik
     * @return groupAddress Address kontrak ArisanGroup yang baru dibuat
     */
    function createGroup(
        address _token,
        uint256 _contributionAmount,
        uint256 _depositAmount,
        uint256 _maxMembers,
        uint256 _roundDuration
    ) external returns (address groupAddress) {
        ArisanGroup group = new ArisanGroup(
            msg.sender,
            _token,
            _contributionAmount,
            _depositAmount,
            _maxMembers,
            _roundDuration
        );

        groupAddress = address(group);
        groups.push(groupAddress);
        organizerGroups[msg.sender].push(groupAddress);

        emit GroupCreated(
            groupAddress,
            msg.sender,
            _token,
            _contributionAmount,
            _depositAmount,
            _maxMembers,
            _roundDuration
        );
    }

    // ======================== View Functions ========================

    /// @notice Return semua grup arisan yang pernah dibuat.
    function getGroups() external view returns (address[] memory) {
        return groups;
    }

    /// @notice Return jumlah total grup arisan.
    function getGroupCount() external view returns (uint256) {
        return groups.length;
    }

    /// @notice Return daftar grup yang dibuat oleh organizer tertentu.
    function getGroupsByOrganizer(address _organizer) external view returns (address[] memory) {
        return organizerGroups[_organizer];
    }

    /// @notice Return versi kontrak factory.
    function version() external pure returns (string memory) {
        return VERSION;
    }
}

