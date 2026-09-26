// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockUSDT
 * @notice Mock stablecoin untuk testing ArisanChain di testnet.
 *         Siapapun bisa mint token ini — hanya untuk development & demo.
 */
contract MockUSDT is ERC20 {
    uint8 private constant _DECIMALS = 18;

    constructor() ERC20("Mock USDT", "mUSDT") {
        // Mint 1,000,000 token ke deployer untuk setup awal
        _mint(msg.sender, 1_000_000 * 10 ** _DECIMALS);
    }

    /**
     * @notice Mint token ke address manapun. Publik, tanpa batasan — hanya untuk testnet.
     * @param to Address penerima
     * @param amount Jumlah token (dalam wei, 18 decimals)
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function decimals() public pure override returns (uint8) {
        return _DECIMALS;
    }
}
