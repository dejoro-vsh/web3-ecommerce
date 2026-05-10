const hre = require("hardhat");

async function main() {
  console.log("Starting deployment on network:", hre.network.name);

  const [deployer] = await hre.ethers.getSigners();
  if (!deployer) {
    throw new Error("No deployer account found. Did you set PRIVATE_KEY in environment variables?");
  }
  console.log("Deploying contracts with the account:", deployer.address);

  // 1. Deploy MockUSDC
  console.log("\nDeploying MockUSDC...");
  const MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy();
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  console.log("MockUSDC deployed to:", usdcAddress);

  // 2. Deploy PaymentProcessor
  console.log("\nDeploying PaymentProcessor...");
  const PaymentProcessor = await hre.ethers.getContractFactory("PaymentProcessor");
  const paymentProcessor = await PaymentProcessor.deploy(usdcAddress);
  await paymentProcessor.waitForDeployment();
  const paymentProcessorAddress = await paymentProcessor.getAddress();
  console.log("PaymentProcessor deployed to:", paymentProcessorAddress);

  console.log("\n✅ Deployment Complete!");
  console.log("======================================");
  console.log("MockUSDC Address:", usdcAddress);
  console.log("PaymentProcessor Address:", paymentProcessorAddress);
  console.log("======================================");
  console.log("IMPORTANT: Copy these addresses and update them in store-frontend/src/Store.jsx");
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
