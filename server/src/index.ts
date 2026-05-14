import dotenv from 'dotenv';
import path from 'path';
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

// Serve static frontend in production
if (process.env.NODE_ENV === 'production') {
  const staticPath = path.join(__dirname, '../../client/dist');
  app.use(express.static(staticPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Momentum server running on http://localhost:${PORT}`);
});
