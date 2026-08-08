const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Production Readiness & Secret Leak Audits
if (process.env.NODE_ENV === 'production') {
  if (!process.env.MONGODB_URI || process.env.MONGODB_URI.includes('127.0.0.1') || process.env.MONGODB_URI.includes('localhost')) {
    console.error('FATAL SECURITY ERROR: Insecure MONGODB_URI fallback cannot be used in production.');
    process.exit(1);
  }
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'supersecretkey') {
    console.error('FATAL SECURITY ERROR: Default JWT_SECRET fallback cannot be used in production.');
    process.exit(1);
  }
}

// Database Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/collab-editor';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB Connected successfully'))
  .catch((err) => console.error('MongoDB connection error:', err));

// REST API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api', require('./routes/workspace'));

// Setup Socket.io Event Handling
require('./socket')(io);

const fs = require('fs');
const clientDistPath = path.join(__dirname, '../client/dist');
const indexPath = path.join(clientDistPath, 'index.html');

if (fs.existsSync(indexPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res) => {
    res.sendFile(indexPath);
  });
} else {
  app.get('/', (req, res) => {
    res.json({ message: 'CodeCast API & Socket Server is running successfully!' });
  });
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
