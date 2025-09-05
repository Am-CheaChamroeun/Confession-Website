const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_urq53hBQXNFY@ep-morning-wind-adhbox58-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  ssl: {
    rejectUnauthorized: false
  },
  max: 20,
  connectionTimeoutMillis: 30000,
  idleTimeoutMillis: 30000
});

async function initDatabase() {
  try {
    const client = await pool.connect();
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS confessions (
        id SERIAL PRIMARY KEY,
        confession_id VARCHAR(255) UNIQUE NOT NULL,
        confession TEXT NOT NULL,
        category VARCHAR(50),
        recipient VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    client.release();
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

async function saveConfession(confessionData) {
  try {
    const client = await pool.connect();
    
    const query = `
      INSERT INTO confessions (confession_id, confession, category, recipient, created_at)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const values = [
      confessionData.id,
      confessionData.confession,
      confessionData.category || 'uncategorized',
      confessionData.recipient || 'B Kosal',
      new Date(confessionData.timestamp)
    ];
    
    const result = await client.query(query, values);
    client.release();
    
    return result.rows[0];
  } catch (error) {
    console.error('Error saving confession:', error);
    throw error;
  }
}

async function getConfessions(limit = 50) {
  try {
    const client = await pool.connect();
    
    const query = `
      SELECT confession_id as id, confession, category, recipient, created_at as timestamp
      FROM confessions
      ORDER BY created_at DESC
      LIMIT $1
    `;
    
    const result = await client.query(query, [limit]);
    client.release();
    
    return result.rows;
  } catch (error) {
    console.error('Error fetching confessions:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  await initDatabase();

  if (req.method === 'POST') {
    try {
      const { id, confession, category, recipient, timestamp } = req.body;
      
      if (!confession || confession.trim().length === 0) {
        return res.status(400).json({
          error: 'Please write your confession before submitting'
        });
      }
      
      const confessionData = {
        id: id || `confession_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        confession: confession.trim(),
        category: category || 'uncategorized',
        recipient: recipient || 'B Kosal',
        timestamp: timestamp || new Date().toISOString()
      };
      
      const savedConfession = await saveConfession(confessionData);
      
      res.status(201).json({
        success: true,
        confession: savedConfession
      });
      
    } catch (error) {
      console.error('Error saving confession:', error);
      res.status(500).json({
        error: 'Failed to save confession. Please try again.'
      });
    }
  } else if (req.method === 'GET') {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const confessions = await getConfessions(limit);
      
      res.json({
        success: true,
        confessions: confessions
      });
      
    } catch (error) {
      console.error('Error fetching confessions:', error);
      res.status(500).json({
        error: 'Failed to fetch confessions'
      });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}