import { sql } from '@vercel/postgres';

export default async function handler(request, response) {
  try {
    // GET: Fetch all orders (for Admin Dashboard)
    if (request.method === 'GET') {
      const { rows } = await sql`
        SELECT * FROM orders 
        ORDER BY created_at DESC;
      `;
      return response.status(200).json(rows);
    }
    
    // POST: Create a new order (from Store checkout)
    if (request.method === 'POST') {
      const { buyer_wallet, product_id, product_name, price, shipping_name, shipping_address, tx_hash } = request.body;
      
      if (!buyer_wallet || !product_id || !shipping_name || !shipping_address || !tx_hash) {
        return response.status(400).json({ error: 'Missing required order details' });
      }

      await sql`
        INSERT INTO orders (buyer_wallet, product_id, product_name, price, shipping_name, shipping_address, tx_hash, status) 
        VALUES (${buyer_wallet}, ${product_id}, ${product_name}, ${price}, ${shipping_name}, ${shipping_address}, ${tx_hash}, 'Pending');
      `;
      
      return response.status(201).json({ message: 'Order created successfully' });
    }

    // PUT: Update order status (from Admin Dashboard)
    if (request.method === 'PUT') {
      const { id, status } = request.body;
      
      if (!id || !status) {
        return response.status(400).json({ error: 'Missing order ID or status' });
      }

      await sql`
        UPDATE orders 
        SET status = ${status} 
        WHERE id = ${id};
      `;
      
      return response.status(200).json({ message: 'Order status updated successfully' });
    }

    // Method not allowed
    return response.status(405).json({ error: 'Method not allowed' });
    
  } catch (error) {
    console.error('API Error:', error);
    return response.status(500).json({ error: error.message });
  }
}
