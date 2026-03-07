import { Router } from 'express';
import { projects } from '../data.js';

const router = Router();

// GET /api/projects — all projects
router.get('/', (req, res) => {
  res.json(projects);
});

// GET /api/projects/featured — featured only
router.get('/featured', (req, res) => {
  res.json(projects.filter(p => p.featured));
});

// GET /api/projects/:id — single project
router.get('/:id', (req, res) => {
  const project = projects.find(p => p.id === req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  res.json(project);
});

export default router;