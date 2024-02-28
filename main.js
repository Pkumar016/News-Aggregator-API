const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;


let users = [];

// Secret key for JWT
const JWT_SECRET = 'nasdfnlksdnflknslkdflksfndlksnd';


// Middleware for verifying JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.sendStatus(401).json("Unauthorized Error");
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403).json("Cannot authorized the request");
    req.user = user;
    next();
  });
};


//POST User registration
app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    users.push({ username, password: hashedPassword, preferences: [] });
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});


//POST User login
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = users.find(user => user.username === username);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    const token = jwt.sign({ username }, JWT_SECRET);
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});


//GET user preferences
app.get('/preferences', authenticateToken, (req, res) => {
  const user = users.find(user => user.username === req.user.username);
  res.json({ preferences: user.preferences });
});


//PUT update user preferences
app.put('/preferences', authenticateToken, (req, res) => {
  const { preferences } = req.body;
  if (!preferences || !Array.isArray(preferences)) {
    return res.status(400).json({ error: 'Invalid preferences format' });
  }
  const userIndex = users.findIndex(user => user.username === req.user.username);
  users[userIndex].preferences = preferences;
  res.json({ message: 'Preferences updated successfully' });
});


//GET Fetch news articles based on user preferences
app.get('/news', authenticateToken, async (req, res) => {
    const user = users.find(user => user.username === req.user.username);
    const preferences = user.preferences.join(',');
    try {
      const response = await axios.get(`https://newsapi.org/v2/top-headlines?category=${preferences}&apiKey=your_api_key`);
      res.json({ news: response.data.articles });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch news articles' });
    }
});


// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
});


// Start the server
app.listen(PORT, () => {
  console.log("Piyush, Your Server has started");
});