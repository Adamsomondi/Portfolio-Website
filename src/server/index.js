import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import projectsRouter from './routes/projects.js';
import blogRouter     from './routes/blog.js';
import profileRouter  from './routes/profile.js';
import contactRouter  from './routes/contact.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app  = express();
const PORT = process.env.PORT || 5000;

// ── CORS ── allows production + all Vercel preview URLs + localhost
const allowedOrigins = [
  'https://portfolioxwebsite.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  /^https:\/\/portfoliowebsite.*\.vercel\.app$/,
];

app.use(cors({
  origin: (origin, callback) => {
    // allow server-to-server or curl requests with no origin
    if (!origin) return callback(null, true);

    const allowed = allowedOrigins.some(o =>
      typeof o === 'string' ? o === origin : o.test(origin)
    );

    if (allowed) {
      callback(null, true);
    } else {
      console.error(`❌ CORS blocked: ${origin}`);
      callback(new Error(`CORS policy blocked origin: ${origin}`));
    }
  },
  credentials: true,
}));

app.use(express.json());

app.use('/api/projects', projectsRouter);
app.use('/api/blog',     blogRouter);
app.use('/api/profile',  profileRouter);
app.use('/api/contact',  contactRouter);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`✅  API running on port ${PORT}`);
});