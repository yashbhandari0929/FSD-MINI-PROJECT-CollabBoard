import { Whiteboard } from '../models/Whiteboard.js';
import { isDbConnected, getDbStatus } from '../config/database.js';
import { validateRoomId, sanitizeUserName } from '../utils/validation.js';

// Resilient in-memory fallback store when MongoDB is not connected
export const inMemoryBoards = new Map();

/**
 * Returns server and database health status
 */
export const getHealth = async (req, res) => {
  const db = getDbStatus();
  return res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    database: {
      connected: db.isConnected,
      status: db.status,
      uri: db.uri,
      mode: db.isConnected ? 'MongoDB Persistent' : 'In-Memory Fallback (Local)'
    },
    activeMemoryBoardsCount: inMemoryBoards.size
  });
};

/**
 * Create a new whiteboard
 */
export const createBoard = async (req, res, next) => {
  try {
    let { roomId, title, userName } = req.body;

    if (!roomId) {
      // Generate a clean random room ID: e.g. "board-a1b2c3d4"
      const randomSuffix = Math.random().toString(36).substring(2, 10);
      roomId = `board-${randomSuffix}`;
    }

    const validRoomId = validateRoomId(roomId);
    if (!validRoomId) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Room ID. Room IDs must be 3-64 characters alphanumeric, hyphens, or underscores.'
      });
    }

    const cleanTitle = (title || 'Untitled Whiteboard').trim().slice(0, 100);
    const cleanUser = sanitizeUserName(userName);

    if (isDbConnected()) {
      let existing = await Whiteboard.findOne({ roomId: validRoomId });
      if (!existing) {
        existing = await Whiteboard.create({
          roomId: validRoomId,
          title: cleanTitle,
          elements: [],
          creatorSessionId: req.sessionID || cleanUser
        });
      }
      return res.status(201).json({
        success: true,
        board: {
          roomId: existing.roomId,
          title: existing.title,
          elementsCount: existing.elements.length,
          createdAt: existing.createdAt
        }
      });
    } else {
      // In-memory fallback
      if (!inMemoryBoards.has(validRoomId)) {
        inMemoryBoards.set(validRoomId, {
          roomId: validRoomId,
          title: cleanTitle,
          elements: [],
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      const board = inMemoryBoards.get(validRoomId);
      return res.status(201).json({
        success: true,
        fallbackMode: true,
        board: {
          roomId: board.roomId,
          title: board.title,
          elementsCount: board.elements.length,
          createdAt: board.createdAt
        }
      });
    }
  } catch (err) {
    next(err);
  }
};

/**
 * Retrieve a whiteboard by roomId
 */
export const getBoard = async (req, res, next) => {
  try {
    const validRoomId = validateRoomId(req.params.id);
    if (!validRoomId) {
      return res.status(400).json({ success: false, error: 'Invalid Room ID format.' });
    }

    if (isDbConnected()) {
      let board = await Whiteboard.findOne({ roomId: validRoomId });
      if (!board) {
        // Auto-create blank board on first access so sharing any link works smoothly
        board = await Whiteboard.create({
          roomId: validRoomId,
          title: `Board ${validRoomId}`,
          elements: []
        });
      }
      return res.status(200).json({
        success: true,
        board: {
          roomId: board.roomId,
          title: board.title,
          elements: board.elements,
          version: board.version,
          createdAt: board.createdAt,
          updatedAt: board.updatedAt
        }
      });
    } else {
      if (!inMemoryBoards.has(validRoomId)) {
        inMemoryBoards.set(validRoomId, {
          roomId: validRoomId,
          title: `Board ${validRoomId}`,
          elements: [],
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      const board = inMemoryBoards.get(validRoomId);
      return res.status(200).json({
        success: true,
        fallbackMode: true,
        board: {
          roomId: board.roomId,
          title: board.title,
          elements: board.elements,
          version: 1,
          createdAt: board.createdAt,
          updatedAt: board.updatedAt
        }
      });
    }
  } catch (err) {
    next(err);
  }
};

/**
 * Persist whiteboard elements via HTTP PUT
 */
export const saveBoard = async (req, res, next) => {
  try {
    const validRoomId = validateRoomId(req.params.id);
    if (!validRoomId) {
      return res.status(400).json({ success: false, error: 'Invalid Room ID.' });
    }

    const { elements, title } = req.body;
    if (!Array.isArray(elements)) {
      return res.status(400).json({ success: false, error: 'Elements must be an array.' });
    }

    if (isDbConnected()) {
      const updateData = { elements, updatedAt: new Date() };
      if (title) updateData.title = title.slice(0, 100);

      const updated = await Whiteboard.findOneAndUpdate(
        { roomId: validRoomId },
        { $set: updateData },
        { new: true, upsert: true }
      );

      return res.status(200).json({
        success: true,
        savedTo: 'mongodb',
        board: {
          roomId: updated.roomId,
          title: updated.title,
          elementsCount: updated.elements.length,
          updatedAt: updated.updatedAt
        }
      });
    } else {
      const existing = inMemoryBoards.get(validRoomId) || {
        roomId: validRoomId,
        title: title || `Board ${validRoomId}`,
        createdAt: new Date()
      };
      existing.elements = elements;
      if (title) existing.title = title.slice(0, 100);
      existing.updatedAt = new Date();
      inMemoryBoards.set(validRoomId, existing);

      return res.status(200).json({
        success: true,
        savedTo: 'in-memory',
        notice: 'Saved to in-memory store. Connect MongoDB for persistent storage.',
        board: {
          roomId: existing.roomId,
          title: existing.title,
          elementsCount: existing.elements.length,
          updatedAt: existing.updatedAt
        }
      });
    }
  } catch (err) {
    next(err);
  }
};
