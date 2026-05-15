import express from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { supabase } from '../db.js';

export const authRouter = express.Router();

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

authRouter.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username dan password wajib diisi.' });
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('id, name, username, password_hash, role')
    .eq('username', username)
    .maybeSingle();

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  if (!user || hashPassword(password) !== user.password_hash) {
    return res.status(401).json({ message: 'Username atau password salah.' });
  }

  const payload = {
    id: user.id,
    name: user.name,
    username: user.username,
    role: user.role
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });

  res.json({ token, user: payload });
});
