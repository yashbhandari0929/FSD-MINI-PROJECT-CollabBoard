import { Router } from 'express';
import {
  register,
  login,
  saveUserSnapshot,
  getUserSnapshots,
  deleteUserSnapshot
} from '../controllers/authController.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/snapshots', saveUserSnapshot);
router.get('/snapshots', getUserSnapshots);
router.delete('/snapshots', deleteUserSnapshot);

export default router;
