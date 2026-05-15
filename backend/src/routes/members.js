import express from 'express';
import { supabase } from '../db.js';
import { authenticate, requireWriteAccess } from '../middleware/auth.js';

export const membersRouter = express.Router();

const allowedProducts = ['photocard'];

function isDuplicateWhatsappError(error) {
  return error?.code === '23505' || error?.message?.toLowerCase().includes('whatsapp');
}

membersRouter.get('/', authenticate, async (req, res) => {
  const search = String(req.query.search || '').trim();

  let query = supabase
    .from('members')
    .select('id, name, whatsapp_number, created_at, updated_at')
    .order('created_at', { ascending: false });

  if (search) {
    const escapedSearch = search.replace(/[%_,]/g, '\\$&');
    query = query.or(`name.ilike.%${escapedSearch}%,whatsapp_number.ilike.%${escapedSearch}%`);
  }

  const { data, error } = await query;

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  res.json(data);
});

membersRouter.post('/', authenticate, requireWriteAccess, async (req, res) => {
  const { name, whatsappNumber } = req.body;
  const trimmedWhatsapp = whatsappNumber?.trim();

  if (!name || !trimmedWhatsapp) {
    return res.status(400).json({ message: 'Nama dan nomor WA wajib diisi.' });
  }

  const { data: existingMember, error: existingError } = await supabase
    .from('members')
    .select('id')
    .eq('whatsapp_number', trimmedWhatsapp)
    .maybeSingle();

  if (existingError) {
    return res.status(500).json({ message: existingError.message });
  }

  if (existingMember) {
    return res.status(409).json({ message: 'Nomor WA sudah digunakan oleh anggota lain.' });
  }

  const { data, error } = await supabase
    .from('members')
    .insert({
      name: name.trim(),
      whatsapp_number: trimmedWhatsapp,
      created_by: req.user.id
    })
    .select('id, name, whatsapp_number, created_at, updated_at')
    .single();

  if (error) {
    if (isDuplicateWhatsappError(error)) {
      return res.status(409).json({ message: 'Nomor WA sudah digunakan oleh anggota lain.' });
    }

    return res.status(500).json({ message: error.message });
  }

  res.status(201).json(data);
});

membersRouter.put('/:memberId', authenticate, requireWriteAccess, async (req, res) => {
  const { memberId } = req.params;
  const { name, whatsappNumber } = req.body;
  const trimmedWhatsapp = whatsappNumber?.trim();

  if (!name || !trimmedWhatsapp) {
    return res.status(400).json({ message: 'Nama dan nomor WA wajib diisi.' });
  }

  const { data: existingMember, error: existingError } = await supabase
    .from('members')
    .select('id')
    .eq('whatsapp_number', trimmedWhatsapp)
    .neq('id', memberId)
    .maybeSingle();

  if (existingError) {
    return res.status(500).json({ message: existingError.message });
  }

  if (existingMember) {
    return res.status(409).json({ message: 'Nomor WA sudah digunakan oleh anggota lain.' });
  }

  const { data, error } = await supabase
    .from('members')
    .update({
      name: name.trim(),
      whatsapp_number: trimmedWhatsapp
    })
    .eq('id', memberId)
    .select('id, name, whatsapp_number, created_at, updated_at')
    .single();

  if (error) {
    if (isDuplicateWhatsappError(error)) {
      return res.status(409).json({ message: 'Nomor WA sudah digunakan oleh anggota lain.' });
    }

    return res.status(500).json({ message: error.message });
  }

  res.json(data);
});

membersRouter.delete('/:memberId', authenticate, requireWriteAccess, async (req, res) => {
  const { memberId } = req.params;

  const { error } = await supabase.from('members').delete().eq('id', memberId);

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  res.status(204).send();
});

membersRouter.get('/:memberId/transactions', authenticate, async (req, res) => {
  const { memberId } = req.params;

  const { data, error } = await supabase
    .from('member_transactions')
    .select('id, member_id, product_type, product_name, country, quantity, unit_price, payment_status, notes, created_at')
    .eq('member_id', memberId)
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  res.json(data);
});

membersRouter.post('/:memberId/transactions', authenticate, requireWriteAccess, async (req, res) => {
  const { memberId } = req.params;
  const { productName, quantity, unitPrice, notes } = req.body;
  const parsedQuantity = Number(quantity || 1);
  const parsedUnitPrice = Number(unitPrice || 0);

  if (!productName || !Number.isInteger(parsedQuantity) || parsedQuantity < 1 || parsedUnitPrice < 0) {
    return res.status(400).json({ message: 'Nama photocard, qty, dan harga wajib diisi dengan benar.' });
  }

  const { data, error } = await supabase
    .from('member_transactions')
    .insert({
      member_id: memberId,
      product_type: allowedProducts[0],
      product_name: productName.trim(),
      country: 'korea',
      quantity: parsedQuantity,
      unit_price: parsedUnitPrice,
      payment_status: 'dp',
      notes: notes?.trim() || null,
      created_by: req.user.id
    })
    .select('id, member_id, product_type, product_name, country, quantity, unit_price, payment_status, notes, created_at')
    .single();

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  res.status(201).json(data);
});
