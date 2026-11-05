import { User } from '../models/User.js';
import { isDbConnected } from '../config/database.js';
import crypto from 'crypto';

// In-memory fallback for users and personal snapshots
export const inMemoryUsers = new Map();

// Helper to hash password
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Register a new user
 */
export const register = async (req, res, next) => {
  try {
    const { email, name, password } = req.body;

    if (!email || !name || !password) {
      return res.status(400).json({ success: false, error: 'Email, name, and password are required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanName = name.trim().slice(0, 50);

    if (password.length < 4) {
      return res.status(400).json({ success: false, error: 'Password must be at least 4 characters.' });
    }

    const hashedPassword = hashPassword(password);

    if (isDbConnected()) {
      const existing = await User.findOne({ email: cleanEmail });
      if (existing) {
        return res.status(409).json({ success: false, error: 'User with this email already exists.' });
      }

      const user = await User.create({
        email: cleanEmail,
        name: cleanName,
        password: hashedPassword,
        savedBoards: []
      });

      return res.status(201).json({
        success: true,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          savedBoardsCount: user.savedBoards.length
        }
      });
    } else {
      if (inMemoryUsers.has(cleanEmail)) {
        return res.status(409).json({ success: false, error: 'User with this email already exists.' });
      }

      const newUser = {
        id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        email: cleanEmail,
        name: cleanName,
        password: hashedPassword,
        savedBoards: []
      };

      inMemoryUsers.set(cleanEmail, newUser);

      return res.status(201).json({
        success: true,
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          savedBoardsCount: 0
        }
      });
    }
  } catch (err) {
    next(err);
  }
};

/**
 * Log in with email and password
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const hashedPassword = hashPassword(password);

    if (isDbConnected()) {
      const user = await User.findOne({ email: cleanEmail });
      if (!user || user.password !== hashedPassword) {
        return res.status(401).json({ success: false, error: 'Invalid email or password.' });
      }

      return res.status(200).json({
        success: true,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          savedBoardsCount: user.savedBoards.length
        }
      });
    } else {
      const user = inMemoryUsers.get(cleanEmail);
      if (!user || user.password !== hashedPassword) {
        return res.status(401).json({ success: false, error: 'Invalid email or password.' });
      }

      return res.status(200).json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          savedBoardsCount: user.savedBoards.length
        }
      });
    }
  } catch (err) {
    next(err);
  }
};

/**
 * Save board snapshot to user's saved snapshots library
 */
export const saveUserSnapshot = async (req, res, next) => {
  try {
    const { email, roomId, title, elements, thumbnail } = req.body;

    if (!email || !roomId || !Array.isArray(elements)) {
      return res.status(400).json({ success: false, error: 'Email, roomId, and elements array are required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const snapshotItem = {
      id: `snap_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      roomId,
      title: (title || `Snapshot ${roomId}`).slice(0, 100),
      elements,
      thumbnail: thumbnail || '',
      savedAt: new Date()
    };

    if (isDbConnected()) {
      const user = await User.findOneAndUpdate(
        { email: cleanEmail },
        { $push: { savedBoards: { $each: [snapshotItem], $position: 0 } } },
        { new: true }
      );

      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found.' });
      }

      return res.status(200).json({
        success: true,
        snapshot: snapshotItem,
        totalSaved: user.savedBoards.length
      });
    } else {
      let user = inMemoryUsers.get(cleanEmail);
      if (!user) {
        // Auto-create guest profile for convenience
        user = {
          id: `usr_${Date.now()}`,
          email: cleanEmail,
          name: cleanEmail.split('@')[0],
          savedBoards: []
        };
        inMemoryUsers.set(cleanEmail, user);
      }

      user.savedBoards.unshift(snapshotItem);

      return res.status(200).json({
        success: true,
        snapshot: snapshotItem,
        totalSaved: user.savedBoards.length
      });
    }
  } catch (err) {
    next(err);
  }
};

/**
 * Get all saved snapshots for a user
 */
export const getUserSnapshots = async (req, res, next) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email query parameter is required.' });
    }

    const cleanEmail = email.toLowerCase().trim();

    if (isDbConnected()) {
      const user = await User.findOne({ email: cleanEmail }).select('savedBoards name email');
      if (!user) {
        return res.status(200).json({ success: true, savedBoards: [] });
      }
      return res.status(200).json({ success: true, savedBoards: user.savedBoards });
    } else {
      const user = inMemoryUsers.get(cleanEmail);
      return res.status(200).json({ success: true, savedBoards: user ? user.savedBoards : [] });
    }
  } catch (err) {
    next(err);
  }
};

/**
 * Delete a saved snapshot
 */
export const deleteUserSnapshot = async (req, res, next) => {
  try {
    const { email, snapshotId } = req.body;
    if (!email || !snapshotId) {
      return res.status(400).json({ success: false, error: 'Email and snapshotId are required.' });
    }

    const cleanEmail = email.toLowerCase().trim();

    if (isDbConnected()) {
      await User.updateOne({ email: cleanEmail }, { $pull: { savedBoards: { id: snapshotId } } });
      return res.status(200).json({ success: true });
    } else {
      const user = inMemoryUsers.get(cleanEmail);
      if (user && Array.isArray(user.savedBoards)) {
        user.savedBoards = user.savedBoards.filter((s) => s.id !== snapshotId);
      }
      return res.status(200).json({ success: true });
    }
  } catch (err) {
    next(err);
  }
};
