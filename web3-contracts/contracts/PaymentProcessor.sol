// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract PaymentProcessor {
    address public owner;
    IERC20 public usdcToken;

    event PaymentReceived(uint256 indexed orderId, uint256 amount, address indexed buyer);

    constructor(address _usdcTokenAddress) {
        owner = msg.sender;
        usdcToken = IERC20(_usdcTokenAddress);
    }

    // Function to pay for an order using USDC
    function pay(uint256 orderId, uint256 amount) external {
        require(amount > 0, "Amount must be greater than zero");

        // Transfer USDC from the buyer to this contract (or directly to the owner)
        // Note: The buyer MUST have approved this contract to spend their USDC beforehand
        bool success = usdcToken.transferFrom(msg.sender, owner, amount);
        require(success, "USDC transfer failed");

        // Emit an event that the backend can listen to
        emit PaymentReceived(orderId, amount, msg.sender);
    }

    // Emergency withdrawal in case tokens get stuck in the contract
    function withdrawTokens(address tokenAddress) external {
        require(msg.sender == owner, "Only owner can withdraw");
        IERC20 token = IERC20(tokenAddress);
        uint256 balance = token.balanceOf(address(this));
        token.transfer(owner, balance);
    }
}
