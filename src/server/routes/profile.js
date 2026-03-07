import { Router } from 'express';
import { profile } from '../data.js';

const router = Router();

// GET /api/profile
router.get('/', (req, res) => {
  res.json(profile);
});

export default router;