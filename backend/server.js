const express = require('express');
const cors = require('cors');
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const projectRoutes = require('./routes/projects');
const gamificationRoutes = require('./routes/gamification');
const notificationRoutes = require('./routes/notifications');
const codeRoutes = require('./routes/code');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
// Configure CORS to allow the separate frontend origin(s)
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
  : ['http://localhost:5173'];
app.use(
  cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
); // Allow requests from the configured frontend origin(s)
app.use(express.json()); // Parse JSON bodies

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Backend is running!' });
});

// Use routes
app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/projects', projectRoutes);
app.use('/gamification', gamificationRoutes);
app.use('/notifications', notificationRoutes);
app.use('/code', codeRoutes);

// Optional: serve built frontend only when explicitly enabled
if (process.env.SERVE_STATIC === 'true') {
  const distPath = path.join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
