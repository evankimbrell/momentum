import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true });

import express from 'express';
import cors from 'cors';

import peopleRouter from './routes/people';
import interactionsRouter from './routes/interactions';
import followupsRouter from './routes/followups';
import aiRouter from './routes/ai';

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/people', peopleRouter);
app.use('/api/people/:personId/interactions', interactionsRouter);
app.use('/api/followups', followupsRouter);
app.use('/api/ai', aiRouter);

app.get('/health', (_req, res) => res.json({ ok: true }));

// Serve static frontend if client/dist exists (production build)
const staticPath = path.join(__dirname, '../../client/dist');
if (fs.existsSync(staticPath)) {
  console.log('Serving static files from:', staticPath);
  app.use(express.static(staticPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'));
  });
} else {
  console.log('No client/dist found — API-only mode');
}

// Global error handler so async throws return 500 instead of hanging
// eslint-disable-next-line @typescript-eslint/no-explicit-any
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: err.message ?? 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Momentum server running on http://localhost:${PORT}`);
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('DATABASE_URL set:', !!process.env.DATABASE_URL);
  console.log('ANTHROPIC_API_KEY set:', !!process.env.ANTHROPIC_API_KEY);
});
