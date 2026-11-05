import { Router } from 'express';
import { getHealth, createBoard, getBoard, saveBoard } from '../controllers/boardController.js';

const router = Router();

// Health check endpoint
router.get('/health', getHealth);

// Board REST API endpoints
router.post('/boards', createBoard);
router.get('/boards/:id', getBoard);
router.put('/boards/:id', saveBoard);

export default router;
