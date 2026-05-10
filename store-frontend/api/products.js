import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const { rows } = await sql`SELECT * FROM products ORDER BY id ASC`;
      return res.status(200).json(rows);
    } 
    
    if (req.method === 'POST') {
      const { name, price, image, is_active } = req.body;
      const activeStatus = is_active !== undefined ? is_active : true;
      const { rows } = await sql`
        INSERT INTO products (name, price, image, is_active) 
        VALUES (${name}, ${price}, ${image}, ${activeStatus}) 
        RETURNING *;
      `;
      return res.status(201).json(rows[0]);
    }

    if (req.method === 'PUT') {
      const { id, name, price, image, is_active } = req.body;
      const activeStatus = is_active !== undefined ? is_active : true;
      const { rows } = await sql`
        UPDATE products 
        SET name = ${name}, price = ${price}, image = ${image}, is_active = ${activeStatus}
        WHERE id = ${id} 
        RETURNING *;
      `;
      return res.status(200).json(rows[0]);
    }

    if (req.method === 'DELETE') {
      // Vercel parses query string parameters automatically
      const { id } = req.query;
      await sql`DELETE FROM products WHERE id = ${id}`;
      return res.status(200).json({ success: true });
    }

    // Method Not Allowed
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error) {
    console.error('Database Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
