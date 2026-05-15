import express from 'express';
import crypto from 'crypto';
import { supabase } from '../db.js';
import { authenticate, requireSuperAdmin } from '../middleware/auth.js';

export const adminRouter = express.Router();
const allowedRoles = ['guest', 'admin', 'super_admin'];

function mapPermission(permission) {
  return {
    id: permission.id,
    key: permission.permission_key,
    label: permission.label,
    description: permission.description,
    guest: permission.guest_enabled,
    admin: permission.admin_enabled,
    created_at: permission.created_at,
    updated_at: permission.updated_at
  };
}

function buildPermissionKey(label) {
  return String(label || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 90);
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

adminRouter.get('/users', authenticate, requireSuperAdmin, async (_req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, username, role, created_at, updated_at')
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  res.json(data);
});

adminRouter.post('/users', authenticate, requireSuperAdmin, async (req, res) => {
  const { name, username, password, role } = req.body;

  if (!name?.trim() || !username?.trim() || !password || !allowedRoles.includes(role)) {
    return res.status(400).json({ message: 'Nama, username, password, dan role wajib diisi.' });
  }

  const { data, error } = await supabase
    .from('users')
    .insert({
      name: name.trim(),
      username: username.trim(),
      password_hash: hashPassword(password),
      role
    })
    .select('id, name, username, role, created_at, updated_at')
    .single();

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  res.status(201).json(data);
});

adminRouter.put('/users/:userId', authenticate, requireSuperAdmin, async (req, res) => {
  const { userId } = req.params;
  const { name, username, password, role } = req.body;

  if (!name?.trim() || !username?.trim() || !allowedRoles.includes(role)) {
    return res.status(400).json({ message: 'Nama, username, dan role wajib diisi.' });
  }

  const payload = {
    name: name.trim(),
    username: username.trim(),
    role
  };

  if (password) {
    payload.password_hash = hashPassword(password);
  }

  const { data, error } = await supabase
    .from('users')
    .update(payload)
    .eq('id', userId)
    .select('id, name, username, role, created_at, updated_at')
    .single();

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  res.json(data);
});

adminRouter.delete('/users/:userId', authenticate, requireSuperAdmin, async (req, res) => {
  const { userId } = req.params;

  if (userId === req.user.id) {
    return res.status(400).json({ message: 'User yang sedang login tidak bisa dihapus.' });
  }

  const { error } = await supabase.from('users').delete().eq('id', userId);

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  res.status(204).send();
});

adminRouter.get('/role-permissions', authenticate, requireSuperAdmin, async (_req, res) => {
  const { data, error } = await supabase
    .from('role_permissions')
    .select('id, permission_key, label, description, guest_enabled, admin_enabled, created_at, updated_at')
    .order('created_at', { ascending: true });

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  res.json(data.map(mapPermission));
});

adminRouter.post('/role-permissions', authenticate, requireSuperAdmin, async (req, res) => {
  const { label, description, guest, admin } = req.body;
  const permissionKey = buildPermissionKey(label);

  if (!permissionKey || !label?.trim() || !description?.trim()) {
    return res.status(400).json({ message: 'Nama permission dan deskripsi wajib diisi.' });
  }

  const { data, error } = await supabase
    .from('role_permissions')
    .insert({
      permission_key: permissionKey,
      label: label.trim(),
      description: description.trim(),
      guest_enabled: Boolean(guest),
      admin_enabled: Boolean(admin),
      created_by: req.user.id
    })
    .select('id, permission_key, label, description, guest_enabled, admin_enabled, created_at, updated_at')
    .single();

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  res.status(201).json(mapPermission(data));
});

adminRouter.put('/role-permissions/:permissionId', authenticate, requireSuperAdmin, async (req, res) => {
  const { permissionId } = req.params;
  const { label, description, guest, admin } = req.body;

  if (!label?.trim() || !description?.trim()) {
    return res.status(400).json({ message: 'Nama permission dan deskripsi wajib diisi.' });
  }

  const { data, error } = await supabase
    .from('role_permissions')
    .update({
      label: label.trim(),
      description: description.trim(),
      guest_enabled: Boolean(guest),
      admin_enabled: Boolean(admin)
    })
    .eq('id', permissionId)
    .select('id, permission_key, label, description, guest_enabled, admin_enabled, created_at, updated_at')
    .single();

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  res.json(mapPermission(data));
});

adminRouter.post('/clean-database', authenticate, requireSuperAdmin, async (_req, res) => {
  const deletions = [
    supabase.from('member_transactions').delete().not('id', 'is', null),
    supabase.from('recap_batches').delete().not('id', 'is', null),
    supabase.from('members').delete().not('id', 'is', null)
  ];

  const results = await Promise.all(deletions);
  const error = results.find((result) => result.error)?.error;

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  res.json({ message: 'Database operasional berhasil dibersihkan.' });
});
