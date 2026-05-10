import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './index.css';

const CONTRACT_ADDRESS = "0xYourPaymentProcessorContractAddress";
const USDC_ADDRESS = "0xYourMockUSDCAddress";

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) public returns (bool)"
];
const PAYMENT_PROCESSOR_ABI = [
  "function pay(uint256 orderId, uint256 amount) public"
];

function Store() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState("");
  const [status, setStatus] = useState("");
  const [loadingId, setLoadingId] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      // Fallback for demo if DB isn't connected yet
      setProducts([
        { id: 1, name: "Database Not Connected", price: 0, image: "/images/product1.png" }
      ]);
    }
    setLoading(false);
  };

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
      
      setStatus("Please confirm the transaction in MetaMask...");
      
      const tx = await signer.sendTransaction({
        to: account, // Mock transaction for testing
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
        <h1 className="title">YACOMMERCE</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {account ? (
            <button className="btn-wallet connected">Connected: {account.slice(0, 6)}...{account.slice(-4)}</button>
          ) : (
            <button className="btn-wallet" onClick={connectWallet}>Connect MetaMask</button>
          )}
          <a href="/admin" className="btn-wallet" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}>Admin Login</a>
        </div>
      </header>
      
      {status && <div className="status-bar">{status}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', marginTop: '3rem', fontSize: '1.5rem' }}>Loading products from Database...</div>
      ) : (
        <div className="product-grid">
          {products.filter(p => p.is_active !== false).map((p) => (
            <div key={p.id} className="product-card">
              <img src={p.image} alt={p.name} className="product-image" onError={(e)=>{e.target.src="/vite.svg"}} />
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
          {products.length === 0 && <p style={{ gridColumn: '1/-1', textAlign: 'center' }}>No products available.</p>}
        </div>
      )}
    </div>
  );
}

export default Store;
