import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import app from './app.js';
import { connectDB } from './config/database.js';
import { setupSocketHandlers } from './sockets/socketHandlers.js';

dotenv.config();

const PORT = process.env.PORT || 5005;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const server = http.createServer(app);

// Socket.IO Server Configuration
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // Allow local development and cross-tab/LAN connections
      callback(null, true);
    },
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  maxHttpBufferSize: 5e6 // 5MB limit for draw packets
});

// Attach WebSocket Handlers
setupSocketHandlers(io);

// Start server
async function startServer() {
  // Connect to MongoDB (or enable fallback)
  await connectDB();

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n======================================================`);
    console.log(`  🚀 CollabBoard Server running on port ${PORT}`);
    console.log(`  📡 WebSocket Server attached and ready`);
    console.log(`  🔗 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`  🎨 Client URL:   ${CLIENT_URL}`);
    console.log(`======================================================\n`);
  });
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[Server] Gracefully shutting down...');
  server.close(() => {
    console.log('[Server] HTTP and Socket server closed.');
    process.exit(0);
  });
});

startServer();
