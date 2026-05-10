import React, { useState, useEffect } from 'react';
import './index.css';

function Admin() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  
  // Form State
  const [formData, setFormData] = useState({ id: null, name: '', price: '', image: '' });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setProducts(data || []);
      setStatus('');
    } catch (error) {
      console.error('Error fetching products:', error);
      setStatus('Failed to load products. Check Vercel Postgres connection.');
    }
    setLoading(false);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Saving...');

    try {
      if (formData.id) {
        // Update existing
        const response = await fetch('/api/products', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `Update failed with status ${response.status}`);
        }
        setStatus('Product updated successfully!');
      } else {
        // Insert new
        const response = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: formData.name, price: formData.price, image: formData.image }),
        });
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `Insert failed with status ${response.status}`);
        }
        setStatus('Product added successfully!');
      }
      resetForm();
      fetchProducts();
    } catch (error) {
      console.error(error);
      setStatus(`Error saving: ${error.message}`);
    }
  };

  const handleEdit = (product) => {
    setFormData(product);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    
    setStatus('Deleting...');
    try {
      const response = await fetch(`/api/products?id=${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Delete failed with status ${response.status}`);
      }
      
      setStatus('Product deleted successfully!');
      fetchProducts();
    } catch (error) {
      console.error(error);
      setStatus(`Error deleting: ${error.message}`);
    }
  };

  const resetForm = () => {
    setFormData({ id: null, name: '', price: '', image: '' });
  };

  return (
    <div className="container" style={{ maxWidth: '800px' }}>
      <header>
        <h1 className="title">Admin Dashboard</h1>
        <a href="/" className="btn-wallet">Back to Store</a>
      </header>

      {status && <div className="status-bar" style={{ borderColor: status.includes('Error') || status.includes('Failed') ? '#ef4444' : '#10b981' }}>{status}</div>}

      <div className="product-card" style={{ marginBottom: '2rem', textAlign: 'left' }}>
        <h2>{formData.id ? 'Edit Product' : 'Add New Product'}</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
          <div>
            <label>Product Name</label>
            <input 
              type="text" name="name" value={formData.name} onChange={handleInputChange} required
              style={{ width: '100%', padding: '0.8rem', borderRadius: '4px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
            />
          </div>
          <div>
            <label>Price (USDC)</label>
            <input 
              type="number" name="price" value={formData.price} onChange={handleInputChange} required
              style={{ width: '100%', padding: '0.8rem', borderRadius: '4px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
            />
          </div>
          <div>
            <label>Image URL (e.g. /images/product1.png or http...)</label>
            <input 
              type="text" name="image" value={formData.image} onChange={handleInputChange} required
              style={{ width: '100%', padding: '0.8rem', borderRadius: '4px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button type="submit" className="btn-pay">{formData.id ? 'Update Product' : 'Add Product'}</button>
            {formData.id && <button type="button" onClick={resetForm} className="btn-wallet">Cancel</button>}
          </div>
        </form>
      </div>

      <h2>Product List</h2>
      {loading ? <p>Loading products...</p> : (
        <table style={{ width: '100%', marginTop: '1rem', borderCollapse: 'collapse', background: 'rgba(30, 41, 59, 0.7)', borderRadius: '8px', overflow: 'hidden' }}>
          <thead>
            <tr style={{ background: 'rgba(0,0,0,0.3)', textAlign: 'left' }}>
              <th style={{ padding: '1rem' }}>ID</th>
              <th style={{ padding: '1rem' }}>Name</th>
              <th style={{ padding: '1rem' }}>Price</th>
              <th style={{ padding: '1rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '1rem' }}>{p.id}</td>
                <td style={{ padding: '1rem' }}>{p.name}</td>
                <td style={{ padding: '1rem' }}>{p.price} USDC</td>
                <td style={{ padding: '1rem' }}>
                  <button onClick={() => handleEdit(p)} style={{ marginRight: '0.5rem', background: '#3b82f6', border: 'none', color: 'white', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer' }}>Edit</button>
                  <button onClick={() => handleDelete(p.id)} style={{ background: '#ef4444', border: 'none', color: 'white', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer' }}>Delete</button>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan="4" style={{ padding: '1rem', textAlign: 'center' }}>No products found in Database.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Admin;
