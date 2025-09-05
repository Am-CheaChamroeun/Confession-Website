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
    
    console.log('Database initialized successfully');
    client.release();
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
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

module.exports = {
  pool,
  initDatabase,
  saveConfession,
  getConfessions
};