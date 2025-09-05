const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { initDatabase, saveConfession, getConfessions } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;


app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static('.'));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: {
    error: 'Too many requests, please try again later.'
  }
});

app.use('/api/', limiter);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/api/confessions', async (req, res) => {
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
});

app.get('/api/confessions', async (req, res) => {
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
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

async function startServer() {
  try {
    await initDatabase();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📝 Confession website available at http://localhost:${PORT}`);
      console.log(`🔗 API endpoints:`);
      console.log(`   POST http://localhost:${PORT}/api/confessions`);
      console.log(`   GET  http://localhost:${PORT}/api/confessions`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();