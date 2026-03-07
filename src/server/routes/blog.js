import { Router } from 'express';
import { blogPosts } from '../data.js';

const router = Router();

// GET /api/blog — all posts (content stripped for list performance)
router.get('/', (req, res) => {
  const posts = blogPosts.map(({ content, ...rest }) => rest);
  res.json(posts);
});

// GET /api/blog/:id — single post with full content
router.get('/:id', (req, res) => {
  const post = blogPosts.find(p => p.id === req.params.id);
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }
  res.json(post);
});

export default router;