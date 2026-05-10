import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './index.css';

const CONTRACT_ADDRESS = "0xfeD90595f09942405e5786810f8d68dACa507538";
const USDC_ADDRESS = "0xb8DC5c827a3934cbC15Eac7b85fADC00ca91B5BD";

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
  
  // Checkout Modal State
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [shippingName, setShippingName] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");

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

  const handleCheckoutClick = (product) => {
    if (!account) {
      setStatus("Please connect your wallet first!");
      return;
    }
    setSelectedProduct(product);
    setShowCheckout(true);
  };

  const handlePay = async (e) => {
    e.preventDefault();
    if (!account || !selectedProduct) return;
    
    setShowCheckout(false);
    setLoadingId(selectedProduct.id);
    setStatus("Initiating Payment...");

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const usdcContract = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, signer);
      const paymentContract = new ethers.Contract(CONTRACT_ADDRESS, PAYMENT_PROCESSOR_ABI, signer);

      // Convert price to USDC units (6 decimals)
      const amountInUnits = ethers.parseUnits(selectedProduct.price.toString(), 6);
      
      setStatus("Step 1: Please approve USDC spending in MetaMask...");
      const approveTx = await usdcContract.approve(CONTRACT_ADDRESS, amountInUnits);
      
      setStatus("Step 1: Waiting for approval confirmation on blockchain...");
      await approveTx.wait();

      setStatus("Step 2: Please confirm the payment in MetaMask...");
      const payTx = await paymentContract.pay(selectedProduct.id, amountInUnits);
      
      setStatus("Step 2: Waiting for payment confirmation...");
      const receipt = await payTx.wait();

      setStatus("Saving order details...");
      
      // Save order to Database
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyer_wallet: account,
          product_id: selectedProduct.id,
          product_name: selectedProduct.name,
          price: selectedProduct.price,
          shipping_name: shippingName,
          shipping_address: shippingAddress,
          tx_hash: receipt.hash
        })
      });

      setStatus(`Payment Successful! Order saved. (Tx: ${receipt.hash.slice(0,10)}...)`);
      setShippingName("");
      setShippingAddress("");
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
                onClick={() => handleCheckoutClick(p)}
                disabled={loadingId !== null}
              >
                {loadingId === p.id ? 'Processing...' : 'Buy Now'}
              </button>
            </div>
          ))}
          {products.length === 0 && <p style={{ gridColumn: '1/-1', textAlign: 'center' }}>No products available.</p>}
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckout && selectedProduct && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="product-card" style={{ width: '90%', maxWidth: '500px', padding: '2rem' }}>
            <h2>Checkout: {selectedProduct.name}</h2>
            <p style={{ margin: '1rem 0', color: '#10b981', fontSize: '1.2rem' }}>Total: {selectedProduct.price} USDC</p>
            <form onSubmit={handlePay} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label>Full Name</label>
                <input 
                  type="text" required value={shippingName} onChange={e => setShippingName(e.target.value)}
                  style={{ width: '100%', padding: '0.8rem', marginTop: '0.5rem', borderRadius: '4px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                />
              </div>
              <div>
                <label>Shipping Address (or Email for Digital)</label>
                <textarea 
                  required rows="3" value={shippingAddress} onChange={e => setShippingAddress(e.target.value)}
                  style={{ width: '100%', padding: '0.8rem', marginTop: '0.5rem', borderRadius: '4px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontFamily: 'inherit' }}
                ></textarea>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className="btn-pay" style={{ flex: 1 }}>Pay with MetaMask</button>
                <button type="button" className="btn-wallet" onClick={() => setShowCheckout(false)} style={{ background: '#ef4444' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Store;
