import { Whiteboard } from '../models/Whiteboard.js';
import { isDbConnected } from '../config/database.js';
import { inMemoryBoards } from '../controllers/boardController.js';
import { validateRoomId, sanitizeUserName, validateElement } from '../utils/validation.js';

// In-memory room management for fast real-time sync
// roomState Map: roomId -> {
//   elements: Array<Element>,
//   redoStack: Array<Element>,
//   users: Map<socketId, { socketId, userId, userName, color, cursor: {x,y} }>,
//   saveTimeout: NodeJS.Timeout | null
// }
const rooms = new Map();

// Helper to assign vibrant colors to collaborators
const USER_COLORS = [
  '#4f46e5', // Indigo
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#ef4444', // Red
  '#14b8a6'  // Teal
];

function getRandomColor() {
  return USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];
}

/**
 * Initialize or retrieve room state in memory
 */
async function getOrInitRoom(roomId) {
  if (rooms.has(roomId)) {
    return rooms.get(roomId);
  }

  // Load initial elements from DB or in-memory board store
  let initialElements = [];
  try {
    if (isDbConnected()) {
      const board = await Whiteboard.findOne({ roomId });
      if (board && Array.isArray(board.elements)) {
        initialElements = board.elements;
      }
    } else {
      const memBoard = inMemoryBoards.get(roomId);
      if (memBoard && Array.isArray(memBoard.elements)) {
        initialElements = memBoard.elements;
      }
    }
  } catch (err) {
    console.error(`[Socket] Error loading initial elements for ${roomId}:`, err.message);
  }

  const roomData = {
    elements: [...initialElements],
    redoStack: [],
    users: new Map(),
    saveTimeout: null
  };

  rooms.set(roomId, roomData);
  return roomData;
}

/**
 * Debounced persistence to MongoDB or fallback
 */
function scheduleAutoSave(roomId) {
  const room = rooms.get(roomId);
  if (!room) return;

  if (room.saveTimeout) {
    clearTimeout(room.saveTimeout);
  }

  room.saveTimeout = setTimeout(async () => {
    try {
      if (isDbConnected()) {
        await Whiteboard.findOneAndUpdate(
          { roomId },
          { $set: { elements: room.elements, updatedAt: new Date() } },
          { upsert: true }
        );
        console.log(`[AutoSave] Room ${roomId} synced to MongoDB (${room.elements.length} elements).`);
      } else {
        const mem = inMemoryBoards.get(roomId) || { roomId, title: `Board ${roomId}`, createdAt: new Date() };
        mem.elements = [...room.elements];
        mem.updatedAt = new Date();
        inMemoryBoards.set(roomId, mem);
      }
    } catch (err) {
      console.error(`[AutoSave Error] Failed saving room ${roomId}:`, err.message);
    }
  }, 2000); // 2 second debounce
}

/**
 * Setup Socket.IO handlers
 */
export function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    let currentRoomId = null;
    let currentUserId = null;
    let currentUserName = null;

    // Join Room Event
    socket.on('room:join', async (payload, callback) => {
      try {
        const { roomId: rawRoomId, userName: rawUserName, userId: rawUserId } = payload || {};
        const roomId = validateRoomId(rawRoomId);

        if (!roomId) {
          if (typeof callback === 'function') {
            callback({ success: false, error: 'Invalid Room ID.' });
          }
          return;
        }

        const userName = sanitizeUserName(rawUserName);
        const userId = rawUserId || socket.id;
        const userColor = getRandomColor();

        currentRoomId = roomId;
        currentUserId = userId;
        currentUserName = userName;

        socket.join(roomId);

        const room = await getOrInitRoom(roomId);

        const userData = {
          socketId: socket.id,
          userId,
          userName,
          color: userColor,
          cursor: null
        };
        room.users.set(socket.id, userData);

        // Prepare list of active users in the room
        const activeUsers = Array.from(room.users.values());

        // Send initial room state to the newly joined user
        socket.emit('room:state', {
          roomId,
          elements: room.elements,
          users: activeUsers,
          currentUser: userData
        });

        // Broadcast to other users in room that someone joined
        socket.to(roomId).emit('room:user-joined', {
          user: userData,
          users: activeUsers
        });

        if (typeof callback === 'function') {
          callback({ success: true, user: userData });
        }
      } catch (err) {
        console.error('[Socket Join Error]:', err);
        if (typeof callback === 'function') {
          callback({ success: false, error: 'Failed to join room.' });
        }
      }
    });

    // Real-Time Drawing Operation
    socket.on('draw:operation', (element) => {
      if (!currentRoomId || !rooms.has(currentRoomId)) return;
      if (!validateElement(element)) return;

      const room = rooms.get(currentRoomId);

      // Attach user metadata
      element.userId = currentUserId;
      element.userName = currentUserName;

      room.elements.push(element);
      room.redoStack = []; // Clear redo stack on new operation

      // Broadcast to other clients in this specific room only
      socket.to(currentRoomId).emit('draw:remote-operation', element);

      // Debounce save to database
      scheduleAutoSave(currentRoomId);
    });

    // Ephemeral Cursor Movement (throttled on client side)
    socket.on('cursor:move', (position) => {
      if (!currentRoomId || !rooms.has(currentRoomId)) return;
      if (!position || typeof position.x !== 'number' || typeof position.y !== 'number') return;

      const room = rooms.get(currentRoomId);
      const user = room.users.get(socket.id);
      if (user) {
        user.cursor = { x: position.x, y: position.y };
        socket.to(currentRoomId).emit('cursor:remote-move', {
          socketId: socket.id,
          userId: currentUserId,
          userName: currentUserName,
          color: user.color,
          position: user.cursor
        });
      }
    });

    // Undo Operation
    socket.on('draw:undo', () => {
      if (!currentRoomId || !rooms.has(currentRoomId)) return;
      const room = rooms.get(currentRoomId);

      if (room.elements.length > 0) {
        const popped = room.elements.pop();
        room.redoStack.push(popped);

        // Broadcast updated elements to all users in room including sender
        io.in(currentRoomId).emit('draw:sync-elements', {
          elements: room.elements
        });

        scheduleAutoSave(currentRoomId);
      }
    });

    // Redo Operation
    socket.on('draw:redo', () => {
      if (!currentRoomId || !rooms.has(currentRoomId)) return;
      const room = rooms.get(currentRoomId);

      if (room.redoStack.length > 0) {
        const restored = room.redoStack.pop();
        room.elements.push(restored);

        // Broadcast updated elements to all users in room including sender
        io.in(currentRoomId).emit('draw:sync-elements', {
          elements: room.elements
        });

        scheduleAutoSave(currentRoomId);
      }
    });

    // Clear Canvas
    socket.on('draw:clear', () => {
      if (!currentRoomId || !rooms.has(currentRoomId)) return;
      const room = rooms.get(currentRoomId);

      // Archive previous elements into redo stack so clear can theoretically be undone
      room.redoStack = [...room.elements];
      room.elements = [];

      io.in(currentRoomId).emit('draw:sync-elements', {
        elements: []
      });

      scheduleAutoSave(currentRoomId);
    });

    // Manual Save Request
    socket.on('board:save', async (data, callback) => {
      if (!currentRoomId || !rooms.has(currentRoomId)) return;
      const room = rooms.get(currentRoomId);

      try {
        if (isDbConnected()) {
          await Whiteboard.findOneAndUpdate(
            { roomId: currentRoomId },
            { $set: { elements: room.elements, updatedAt: new Date() } },
            { upsert: true }
          );
          if (typeof callback === 'function') callback({ success: true, target: 'MongoDB' });
        } else {
          const mem = inMemoryBoards.get(currentRoomId) || { roomId: currentRoomId, title: `Board ${currentRoomId}`, createdAt: new Date() };
          mem.elements = [...room.elements];
          mem.updatedAt = new Date();
          inMemoryBoards.set(currentRoomId, mem);
          if (typeof callback === 'function') callback({ success: true, target: 'In-Memory (Local)' });
        }

        io.in(currentRoomId).emit('board:saved', {
          timestamp: new Date().toISOString()
        });
      } catch (err) {
        if (typeof callback === 'function') callback({ success: false, error: err.message });
      }
    });

    // Disconnect handling
    socket.on('disconnect', () => {
      if (currentRoomId && rooms.has(currentRoomId)) {
        const room = rooms.get(currentRoomId);
        room.users.delete(socket.id);

        const remainingUsers = Array.from(room.users.values());

        // Notify other room users
        socket.to(currentRoomId).emit('room:user-left', {
          socketId: socket.id,
          userName: currentUserName,
          users: remainingUsers
        });

        // If room is now empty, immediately trigger final save
        if (room.users.size === 0) {
          scheduleAutoSave(currentRoomId);
        }
      }
    });
  });
}
