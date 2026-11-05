import mongoose from 'mongoose';

export const dbState = {
  isConnected: false,
  status: 'disconnected',
  uri: '',
  error: null
};

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/collabboard';
  dbState.uri = uri.replace(/\/\/.*@/, '//***:***@'); // mask credentials if present

  try {
    // Attempt connection with a short timeout so app startup is not blocked if Mongo is offline
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 3000
    });

    dbState.isConnected = true;
    dbState.status = 'connected';
    dbState.error = null;
    console.log(`[MongoDB] Connected successfully to ${dbState.uri}`);
  } catch (err) {
    dbState.isConnected = false;
    dbState.status = 'disconnected';
    dbState.error = err.message;
    console.warn(`[MongoDB Warning] Could not connect to MongoDB at ${dbState.uri}: ${err.message}`);
    console.warn(`[MongoDB Notice] The application will use the resilient In-Memory Store fallback.`);
    console.warn(`[MongoDB Setup] To persist permanently across server restarts, supply a working MONGODB_URI (e.g. MongoDB Atlas or local MongoDB service).`);
  }

  // Handle runtime disconnects
  mongoose.connection.on('disconnected', () => {
    dbState.isConnected = false;
    dbState.status = 'disconnected';
    console.warn('[MongoDB] Connection lost. Operating in fallback mode.');
  });

  mongoose.connection.on('reconnected', () => {
    dbState.isConnected = true;
    dbState.status = 'connected';
    console.log('[MongoDB] Reconnected successfully.');
  });
};

export const isDbConnected = () => dbState.isConnected;
export const getDbStatus = () => ({ ...dbState });
