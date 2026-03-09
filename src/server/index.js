import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import projectsRouter from './routes/projects.js';
import blogRouter     from './routes/blog.js';
import profileRouter  from './routes/profile.js';
import contactRouter  from './routes/contact.js';   // ← add this

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CLIENT_URL || 'https://portfolio-website-vdab.onrender.com' }));
app.use(express.json());

app.use('/api/projects', projectsRouter);
app.use('/api/blog',     blogRouter);
app.use('/api/profile',  profileRouter);
app.use('/api/contact',  contactRouter);            // ← add this

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`✅  API running → https://portfolio-website-vdab.onrender.com:${PORT}`);
});