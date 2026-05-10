// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockUSDC is ERC20 {
    constructor() ERC20("Mock USDC", "USDC") {
        // Mint 1,000,000 Mock USDC to the deployer for testing
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }

    // Public mint function for testing purposes (faucet)
    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }

    // USDC uses 6 decimals typically
    function decimals() public view virtual override returns (uint8) {
        return 6;
    }
}
