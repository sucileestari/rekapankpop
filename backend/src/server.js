import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authRouter } from './routes/auth.js';
import { membersRouter } from './routes/members.js';
import { coProofsRouter } from './routes/coProofs.js';
import { recapsRouter } from './routes/recaps.js';
import { adminRouter } from './routes/admin.js';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 4000);
const allowedOrigins = new Set([
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5175'
]);

function isAllowedDevOrigin(origin) {
  return /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin) || /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:\d+$/.test(origin);
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin) || isAllowedDevOrigin(origin)) {
        return callback(null, true);
      }

      callback(new Error(`Origin ${origin} tidak diizinkan oleh CORS.`));
    }
  })
);
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRouter);
app.use('/api/members', membersRouter);
app.use('/api/recaps', recapsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/co-proofs', coProofsRouter);

app.use((err, _req, res, _next) => {
  res.status(400).json({ message: err.message || 'Terjadi kesalahan.' });
});

export default app;