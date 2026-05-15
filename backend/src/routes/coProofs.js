import express from 'express';
import multer from 'multer';
import path from 'path';
import { coProofBucket, supabase } from '../db.js';
import { authenticate, requireWriteAccess } from '../middleware/auth.js';

const allowedCountries = ['korea', 'jepang', 'china', 'thailand'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('File harus berupa gambar.'));
    }

    cb(null, true);
  }
});

export const coProofsRouter = express.Router();

coProofsRouter.get('/', authenticate, async (_req, res) => {
  const { data, error } = await supabase
    .from('co_proofs')
    .select('id, batch, country, image_path, original_filename, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  res.json(data);
});

coProofsRouter.post(
  '/',
  authenticate,
  requireWriteAccess,
  upload.single('image'),
  async (req, res) => {
    const { batch, country } = req.body;

    if (!batch || !country || !allowedCountries.includes(country)) {
      return res.status(400).json({ message: 'Batch dan negara wajib diisi dengan benar.' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Gambar bukti CO wajib diupload.' });
    }

    const ext = path.extname(req.file.originalname) || '.jpg';
    const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    const storagePath = `${country}/${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from(coProofBucket)
      .upload(storagePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false
      });

    if (uploadError) {
      return res.status(500).json({ message: uploadError.message });
    }

    const { data: publicData } = supabase.storage.from(coProofBucket).getPublicUrl(storagePath);

    const { data, error } = await supabase
      .from('co_proofs')
      .insert({
        batch: batch.trim(),
        country,
        image_path: publicData.publicUrl,
        storage_path: storagePath,
        original_filename: req.file.originalname,
        uploaded_by: req.user.id
      })
      .select('id, batch, country, image_path, original_filename, created_at')
      .single();

    if (error) {
      await supabase.storage.from(coProofBucket).remove([storagePath]);
      return res.status(500).json({ message: error.message });
    }

    res.status(201).json(data);
  }
);
