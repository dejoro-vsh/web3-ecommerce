import React, { useState } from 'react';
import { ethers } from 'ethers';
import './index.css';

const CONTRACT_ADDRESS = "0xYourPaymentProcessorContractAddress"; // Will be filled after deploying to Testnet
const USDC_ADDRESS = "0xYourMockUSDCAddress"; // Will be filled after deploying to Testnet

// Minimal ABIs for testing
const ERC20_ABI = [
  "function approve(address spender, uint256 amount) public returns (bool)"
];
const PAYMENT_PROCESSOR_ABI = [
  "function pay(uint256 orderId, uint256 amount) public"
];

const products = [
  { id: 1, name: "CyberVR Headset Pro", price: 299, image: "/images/product1.png" },
  { id: 2, name: "HoloMech Keyboard", price: 149, image: "/images/product2.png" },
  { id: 3, name: "Quantum Energy Core", price: 499, image: "/images/product3.png" },
  { id: 4, name: "Neural Gauntlet X", price: 899, image: "/images/product4.png" },
];

function App() {
  const [account, setAccount] = useState("");
  const [status, setStatus] = useState("");
  const [loadingId, setLoadingId] = useState(null);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
        setStatus("Wallet Connected Successfully");
      } catch (error) {
        setStatus("Failed to connect wallet");
      }
    } else {
      setStatus("Please install MetaMask!");
    }
  };

  const handlePay = async (productId, price) => {
    if (!account) {
      setStatus("Please connect your wallet first!");
      return;
    }
    
    setLoadingId(productId);
    setStatus("Initiating Payment...");

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // ==========================================
      // REAL SMART CONTRACT FLOW (Commented out until deployed)
      // ==========================================
      /*
      const usdcContract = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, signer);
      const paymentContract = new ethers.Contract(CONTRACT_ADDRESS, PAYMENT_PROCESSOR_ABI, signer);
      
      // 1. Approve USDC spend
      setStatus("Please confirm the Approve transaction in MetaMask...");
      const amount = ethers.parseUnits(price.toString(), 6); // Assuming USDC has 6 decimals
      const approveTx = await usdcContract.approve(CONTRACT_ADDRESS, amount);
      await approveTx.wait();
      
      // 2. Pay via Smart Contract
      setStatus("Please confirm the Payment transaction in MetaMask...");
      const orderId = Math.floor(Math.random() * 10000); // Random order ID
      const payTx = await paymentContract.pay(orderId, amount);
      await payTx.wait();
      */
      
      // ==========================================
      // SIMULATED FLOW FOR VERCEL DEMO
      // ==========================================
      setStatus("Please confirm the transaction in MetaMask...");
      
      // We simulate a 0-value transaction to yourself just to show the MetaMask signing window works
      const tx = await signer.sendTransaction({
        to: account,
        value: 0
      });
      
      setStatus("Waiting for blockchain confirmation...");
      await tx.wait();

      setStatus(`Payment Successful for Product #${productId}!`);
    } catch (error) {
      console.error(error);
      setStatus("Payment Failed or Cancelled by User");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="container">
      <header>
        <h1 className="title">WEB3 STORE</h1>
        {account ? (
          <button className="btn-wallet connected">Connected: {account.slice(0, 6)}...{account.slice(-4)}</button>
        ) : (
          <button className="btn-wallet" onClick={connectWallet}>Connect MetaMask</button>
        )}
      </header>
      
      {status && <div className="status-bar">{status}</div>}

      <div className="product-grid">
        {products.map((p) => (
          <div key={p.id} className="product-card">
            <img src={p.image} alt={p.name} className="product-image" />
            <h2 className="product-name">{p.name}</h2>
            <p className="product-price">{p.price} USDC</p>
            <button 
              className={`btn-pay ${loadingId === p.id ? 'loading' : ''}`}
              onClick={() => handlePay(p.id, p.price)}
              disabled={loadingId !== null}
            >
              {loadingId === p.id ? 'Processing...' : 'Pay with USDC'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
