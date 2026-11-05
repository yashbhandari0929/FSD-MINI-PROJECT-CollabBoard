import { Router } from 'express';
import {
  getHealth,
  createBoard,
  getBoard,
  saveBoard,
  syncBoard,
  addOperation,
  undoOperation,
  clearBoardElements
} from '../controllers/boardController.js';

const router = Router();

// Health check endpoint
router.get('/health', getHealth);

// Board REST API endpoints
router.post('/boards', createBoard);
router.get('/boards/:id', getBoard);
router.put('/boards/:id', saveBoard);

// Real-time synchronization & presence endpoints (HTTP real-time fallback)
router.post('/boards/:id/sync', syncBoard);
router.post('/boards/:id/operation', addOperation);
router.post('/boards/:id/undo', undoOperation);
router.post('/boards/:id/clear', clearBoardElements);

export default router;
