import express from 'express';
import multer from 'multer';
import path from 'path';
import { paymentProofBucket, recapCategoryBucket, supabase } from '../db.js';
import { authenticate, requireSuperAdmin, requireWriteAccess } from '../middleware/auth.js';

export const recapsRouter = express.Router();

const allowedPayments = ['dp', 'pelunasan'];
const allowedReviewStatuses = ['approved', 'rejected'];
const allowedCategoryImageTypes = new Set(['image/jpeg', 'image/png', 'image/svg+xml']);
const transactionSelect = 'id, member_id, batch_id, product_name, country, quantity, unit_price, payment_status, dp_amount, dp_date, dp_proof_path, dp_proof_storage_path, dp_payment_status, settlement_amount, settlement_proof_path, settlement_proof_storage_path, settlement_payment_status, due_days, settlement_due_date, settled_at, notes, created_at, updated_at';
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!allowedCategoryImageTypes.has(file.mimetype)) {
      return cb(new Error('Format image harus JPG, JPEG, PNG, atau SVG.'));
    }

    cb(null, true);
  }
});

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function validateCountry(country, res) {
  if (!/^[a-z0-9-]+$/.test(country)) {
    res.status(400).json({ message: 'Category tidak valid.' });
    return false;
  }

  return true;
}

async function hydrateTransactions(transactions) {
  const memberIds = [...new Set(transactions.map((item) => item.member_id).filter(Boolean))];
  const batchIds = [...new Set(transactions.map((item) => item.batch_id).filter(Boolean))];

  const [membersResult, batchesResult] = await Promise.all([
    memberIds.length
      ? supabase.from('members').select('id, name, whatsapp_number').in('id', memberIds)
      : Promise.resolve({ data: [], error: null }),
    batchIds.length
      ? supabase.from('recap_batches').select('id, name, start_date, end_date').in('id', batchIds)
      : Promise.resolve({ data: [], error: null })
  ]);

  if (membersResult.error) {
    throw membersResult.error;
  }

  if (batchesResult.error) {
    throw batchesResult.error;
  }

  const memberMap = new Map(membersResult.data.map((member) => [member.id, member]));
  const batchMap = new Map(batchesResult.data.map((batch) => [batch.id, batch]));

  return transactions.map((transaction) => ({
    ...transaction,
    members: memberMap.get(transaction.member_id) || null,
    recap_batches: batchMap.get(transaction.batch_id) || null
  }));
}

async function uploadCategoryImage(country, file) {
  if (!file) {
    return { imagePath: null, storagePath: null };
  }

  const ext = path.extname(file.originalname) || '.jpg';
  const storagePath = `${country}/${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(recapCategoryBucket)
    .upload(storagePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data: publicData } = supabase.storage.from(recapCategoryBucket).getPublicUrl(storagePath);
  return { imagePath: publicData.publicUrl, storagePath };
}

async function uploadPaymentProof(country, transactionId, kind, file) {
  if (!file) {
    return { proofPath: null, storagePath: null };
  }

  const ext = path.extname(file.originalname) || '.png';
  const storagePath = `${country}/${transactionId}/${kind}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(paymentProofBucket)
    .upload(storagePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data: publicData } = supabase.storage.from(paymentProofBucket).getPublicUrl(storagePath);
  return { proofPath: publicData.publicUrl, storagePath };
}

recapsRouter.get('/categories', authenticate, async (_req, res) => {
  const { data, error } = await supabase
    .from('recap_categories')
    .select('id, name, slug, image_path, storage_path, original_filename, created_at')
    .order('created_at', { ascending: true });

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  res.json(data);
});

recapsRouter.post('/categories', authenticate, requireWriteAccess, upload.single('image'), async (req, res) => {
  const { name } = req.body;
  const slug = slugify(name);

  if (!name?.trim() || !slug) {
    return res.status(400).json({ message: 'Nama Rekapan wajib diisi.' });
  }

  try {
    const { imagePath, storagePath } = await uploadCategoryImage(slug, req.file);
    const { data, error } = await supabase
      .from('recap_categories')
      .insert({
        name: name.trim(),
        slug,
        image_path: imagePath,
        storage_path: storagePath,
        original_filename: req.file?.originalname || null,
        created_by: req.user.id
      })
      .select('id, name, slug, image_path, storage_path, original_filename, created_at')
      .single();

    if (error) {
      if (storagePath) {
        await supabase.storage.from(recapCategoryBucket).remove([storagePath]);
      }

      return res.status(500).json({ message: error.message });
    }

    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

recapsRouter.put('/categories/:categoryId', authenticate, requireWriteAccess, upload.single('image'), async (req, res) => {
  const { categoryId } = req.params;
  const { name } = req.body;
  const slug = slugify(name);

  if (!name?.trim() || !slug) {
    return res.status(400).json({ message: 'Nama Rekapan wajib diisi.' });
  }

  const { data: previous, error: previousError } = await supabase
    .from('recap_categories')
    .select('slug, storage_path')
    .eq('id', categoryId)
    .single();

  if (previousError) {
    return res.status(500).json({ message: previousError.message });
  }

  try {
    const uploaded = await uploadCategoryImage(slug, req.file);
    const updatePayload = {
      name: name.trim(),
      slug,
      original_filename: req.file?.originalname || undefined
    };

    if (req.file) {
      updatePayload.image_path = uploaded.imagePath;
      updatePayload.storage_path = uploaded.storagePath;
    }

    const { data, error } = await supabase
      .from('recap_categories')
      .update(updatePayload)
      .eq('id', categoryId)
      .select('id, name, slug, image_path, storage_path, original_filename, created_at')
      .single();

    if (error) {
      if (uploaded.storagePath) {
        await supabase.storage.from(recapCategoryBucket).remove([uploaded.storagePath]);
      }

      return res.status(500).json({ message: error.message });
    }

    if (previous.slug !== slug) {
      await Promise.all([
        supabase.from('recap_batches').update({ country: slug }).eq('country', previous.slug),
        supabase.from('member_transactions').update({ country: slug }).eq('country', previous.slug)
      ]);
    }

    if (req.file && previous.storage_path) {
      await supabase.storage.from(recapCategoryBucket).remove([previous.storage_path]);
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

recapsRouter.delete('/categories/:categoryId', authenticate, requireWriteAccess, async (req, res) => {
  const { categoryId } = req.params;

  const { data: category, error: categoryError } = await supabase
    .from('recap_categories')
    .select('slug, storage_path')
    .eq('id', categoryId)
    .single();

  if (categoryError) {
    return res.status(500).json({ message: categoryError.message });
  }

  const { error: transactionsError } = await supabase
    .from('member_transactions')
    .delete()
    .eq('country', category.slug);

  if (transactionsError) {
    return res.status(500).json({ message: transactionsError.message });
  }

  const { error: batchesError } = await supabase
    .from('recap_batches')
    .delete()
    .eq('country', category.slug);

  if (batchesError) {
    return res.status(500).json({ message: batchesError.message });
  }

  const { error: deleteError } = await supabase
    .from('recap_categories')
    .delete()
    .eq('id', categoryId);

  if (deleteError) {
    return res.status(500).json({ message: deleteError.message });
  }

  if (category.storage_path) {
    await supabase.storage.from(recapCategoryBucket).remove([category.storage_path]);
  }

  res.status(204).send();
});

recapsRouter.get('/:country/batches', authenticate, async (req, res) => {
  const { country } = req.params;

  if (!validateCountry(country, res)) {
    return;
  }

  const { data, error } = await supabase
    .from('recap_batches')
    .select('id, name, country, start_date, end_date, created_at')
    .eq('country', country)
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  res.json(data);
});

recapsRouter.post('/:country/batches', authenticate, requireWriteAccess, async (req, res) => {
  const { country } = req.params;
  const { name, startDate, endDate } = req.body;

  if (!validateCountry(country, res)) {
    return;
  }

  if (!name?.trim() || !startDate || !endDate) {
    return res.status(400).json({ message: 'Nama batch, tanggal from, dan tanggal to wajib diisi.' });
  }

  if (startDate > endDate) {
    return res.status(400).json({ message: 'Tanggal From tidak boleh lebih besar dari tanggal To.' });
  }

  const batchName = name.trim().toLowerCase().startsWith('batch') ? name.trim() : `Batch ${name.trim()}`;

  const { data, error } = await supabase
    .from('recap_batches')
    .insert({
      name: batchName,
      country,
      start_date: startDate,
      end_date: endDate,
      created_by: req.user.id
    })
    .select('id, name, country, start_date, end_date, created_at')
    .single();

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  res.status(201).json(data);
});

recapsRouter.delete('/:country/batches/:batchId', authenticate, requireWriteAccess, async (req, res) => {
  const { country, batchId } = req.params;

  if (!validateCountry(country, res)) {
    return;
  }

  const { error } = await supabase
    .from('recap_batches')
    .delete()
    .eq('id', batchId)
    .eq('country', country);

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  res.status(204).send();
});

recapsRouter.get('/:country/transactions', authenticate, async (req, res) => {
  const { country } = req.params;

  if (!validateCountry(country, res)) {
    return;
  }

  const { data, error } = await supabase
    .from('member_transactions')
    .select(transactionSelect)
    .eq('country', country)
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  try {
    res.json(await hydrateTransactions(data));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

recapsRouter.post('/:country/transactions', authenticate, requireWriteAccess, async (req, res) => {
  const { country } = req.params;
  const { memberId, batchId, productName, quantity, unitPrice, paymentStatus, dpAmount, dpDate, dueDays, settlementDueDate, settledAt, notes } = req.body;
  const parsedQuantity = Number(quantity || 1);
  const parsedUnitPrice = Number(unitPrice || 0);
  const parsedDpAmount = dpAmount ? Number(dpAmount) : 0;
  const parsedDueDays = dueDays ? Number(dueDays) : null;

  if (!validateCountry(country, res)) {
    return;
  }

  if (
    !memberId ||
    !batchId ||
    !productName?.trim() ||
    !Number.isInteger(parsedQuantity) ||
    parsedQuantity < 1 ||
    parsedUnitPrice < 0 ||
    !allowedPayments.includes(paymentStatus) ||
    (paymentStatus === 'dp' && parsedDpAmount < 0) ||
    ![3, 7].includes(parsedDueDays) ||
    !dpDate ||
    !settlementDueDate
  ) {
    return res.status(400).json({ message: 'Anggota, product, qty, price, dan payment wajib diisi dengan benar.' });
  }

  const { data, error } = await supabase
    .from('member_transactions')
    .insert({
      member_id: memberId,
      batch_id: batchId || null,
      product_type: 'photocard',
      product_name: productName.trim(),
      country,
      quantity: parsedQuantity,
      unit_price: parsedUnitPrice,
      payment_status: paymentStatus,
      dp_amount: parsedDpAmount || null,
      dp_date: dpDate,
      due_days: parsedDueDays,
      settlement_due_date: settlementDueDate,
      settled_at: paymentStatus === 'pelunasan' ? `${settledAt || new Date().toISOString().slice(0, 10)}T00:00:00.000Z` : null,
      notes: notes?.trim() || null,
      created_by: req.user.id
    })
    .select(transactionSelect)
    .single();

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  try {
    const [transaction] = await hydrateTransactions([data]);
    res.status(201).json(transaction);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

recapsRouter.put('/:country/transactions/:transactionId', authenticate, requireWriteAccess, async (req, res) => {
  const { country, transactionId } = req.params;
  const { memberId, batchId, productName, quantity, unitPrice, paymentStatus, dpAmount, dpDate, dueDays, settlementDueDate, settledAt, notes } = req.body;
  const parsedQuantity = Number(quantity || 1);
  const parsedUnitPrice = Number(unitPrice || 0);
  const parsedDpAmount = dpAmount ? Number(dpAmount) : 0;
  const parsedDueDays = dueDays ? Number(dueDays) : null;

  if (!validateCountry(country, res)) {
    return;
  }

  if (
    !memberId ||
    !batchId ||
    !productName?.trim() ||
    !Number.isInteger(parsedQuantity) ||
    parsedQuantity < 1 ||
    parsedUnitPrice < 0 ||
    !allowedPayments.includes(paymentStatus) ||
    (paymentStatus === 'dp' && parsedDpAmount < 0) ||
    ![3, 7].includes(parsedDueDays) ||
    !dpDate ||
    !settlementDueDate
  ) {
    return res.status(400).json({ message: 'Anggota, product, qty, price, dan payment wajib diisi dengan benar.' });
  }

  const { data, error } = await supabase
    .from('member_transactions')
    .update({
      member_id: memberId,
      batch_id: batchId || null,
      product_name: productName.trim(),
      quantity: parsedQuantity,
      unit_price: parsedUnitPrice,
      payment_status: paymentStatus,
      dp_amount: parsedDpAmount || null,
      dp_date: dpDate,
      due_days: parsedDueDays,
      settlement_due_date: settlementDueDate,
      settled_at: paymentStatus === 'pelunasan' ? `${settledAt || new Date().toISOString().slice(0, 10)}T00:00:00.000Z` : null,
      notes: notes?.trim() || null
    })
    .eq('id', transactionId)
    .eq('country', country)
    .select(transactionSelect)
    .single();

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  try {
    const [transaction] = await hydrateTransactions([data]);
    res.json(transaction);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

recapsRouter.patch('/:country/transactions/:transactionId/settle', authenticate, requireWriteAccess, async (req, res) => {
  const { country, transactionId } = req.params;

  if (!validateCountry(country, res)) {
    return;
  }

  const { data, error } = await supabase
    .from('member_transactions')
    .update({
      payment_status: 'pelunasan',
      settled_at: new Date().toISOString()
    })
    .eq('id', transactionId)
    .eq('country', country)
    .select(transactionSelect)
    .single();

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  try {
    const [transaction] = await hydrateTransactions([data]);
    res.json(transaction);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

recapsRouter.patch('/:country/transactions/:transactionId/dp-payment', authenticate, upload.single('proof'), async (req, res) => {
  const { country, transactionId } = req.params;
  const dpAmount = Number(req.body.dpAmount || 0);

  if (!validateCountry(country, res)) {
    return;
  }

  if (dpAmount <= 0 || !req.file) {
    return res.status(400).json({ message: 'Total DP dan proof transfer wajib diisi.' });
  }

  const { data: previous, error: previousError } = await supabase
    .from('member_transactions')
    .select('dp_proof_storage_path')
    .eq('id', transactionId)
    .eq('country', country)
    .single();

  if (previousError) {
    return res.status(500).json({ message: previousError.message });
  }

  try {
    const uploaded = await uploadPaymentProof(country, transactionId, 'dp', req.file);
    const { data, error } = await supabase
      .from('member_transactions')
      .update({
        payment_status: 'dp',
        dp_amount: dpAmount,
        dp_date: new Date().toISOString().slice(0, 10),
        dp_proof_path: uploaded.proofPath,
        dp_proof_storage_path: uploaded.storagePath,
        dp_payment_status: 'pending'
      })
      .eq('id', transactionId)
      .eq('country', country)
      .select(transactionSelect)
      .single();

    if (error) {
      await supabase.storage.from(paymentProofBucket).remove([uploaded.storagePath]);
      return res.status(500).json({ message: error.message });
    }

    if (previous.dp_proof_storage_path) {
      await supabase.storage.from(paymentProofBucket).remove([previous.dp_proof_storage_path]);
    }

    const [transaction] = await hydrateTransactions([data]);
    res.json(transaction);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

recapsRouter.patch('/:country/transactions/:transactionId/settlement-payment', authenticate, upload.single('proof'), async (req, res) => {
  const { country, transactionId } = req.params;
  const settlementAmount = Number(req.body.settlementAmount || 0);

  if (!validateCountry(country, res)) {
    return;
  }

  if (settlementAmount < 0 || !req.file) {
    return res.status(400).json({ message: 'Nominal kurang bayar dan proof transfer wajib diisi.' });
  }

  const { data: previous, error: previousError } = await supabase
    .from('member_transactions')
    .select('settlement_proof_storage_path')
    .eq('id', transactionId)
    .eq('country', country)
    .single();

  if (previousError) {
    return res.status(500).json({ message: previousError.message });
  }

  try {
    const uploaded = await uploadPaymentProof(country, transactionId, 'pelunasan', req.file);
    const { data, error } = await supabase
      .from('member_transactions')
      .update({
        payment_status: 'pelunasan',
        settlement_amount: settlementAmount,
        settlement_proof_path: uploaded.proofPath,
        settlement_proof_storage_path: uploaded.storagePath,
        settlement_payment_status: 'pending',
        settled_at: new Date().toISOString()
      })
      .eq('id', transactionId)
      .eq('country', country)
      .select(transactionSelect)
      .single();

    if (error) {
      await supabase.storage.from(paymentProofBucket).remove([uploaded.storagePath]);
      return res.status(500).json({ message: error.message });
    }

    if (previous.settlement_proof_storage_path) {
      await supabase.storage.from(paymentProofBucket).remove([previous.settlement_proof_storage_path]);
    }

    const [transaction] = await hydrateTransactions([data]);
    res.json(transaction);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

recapsRouter.patch('/:country/transactions/:transactionId/review-payment', authenticate, requireSuperAdmin, async (req, res) => {
  const { country, transactionId } = req.params;
  const { type, status } = req.body;

  if (!validateCountry(country, res)) {
    return;
  }

  if (!['dp', 'settlement'].includes(type) || !allowedReviewStatuses.includes(status)) {
    return res.status(400).json({ message: 'Tipe dan status review payment tidak valid.' });
  }

  const { data: previous, error: previousError } = await supabase
    .from('member_transactions')
    .select('dp_proof_storage_path, settlement_proof_storage_path')
    .eq('id', transactionId)
    .eq('country', country)
    .single();

  if (previousError) {
    return res.status(500).json({ message: previousError.message });
  }

  const payload =
    type === 'dp'
      ? {
          dp_payment_status: status,
          ...(status === 'rejected'
            ? {
                dp_proof_path: null,
                dp_proof_storage_path: null,
              }
            : {}),
        }
      : {
          settlement_payment_status: status,
          ...(status === 'rejected'
            ? {
                settlement_proof_path: null,
                settlement_proof_storage_path: null,
              }
            : {}),
        };

  const { data, error } = await supabase
    .from('member_transactions')
    .update(payload)
    .eq('id', transactionId)
    .eq('country', country)
    .select(transactionSelect)
    .single();

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  if (status === 'rejected') {
    const storagePath = type === 'dp' ? previous.dp_proof_storage_path : previous.settlement_proof_storage_path;

    if (storagePath) {
      await supabase.storage.from(paymentProofBucket).remove([storagePath]);
    }
  }

  try {
    const [transaction] = await hydrateTransactions([data]);
    res.json(transaction);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

recapsRouter.delete('/:country/transactions/:transactionId', authenticate, requireWriteAccess, async (req, res) => {
  const { country, transactionId } = req.params;

  if (!validateCountry(country, res)) {
    return;
  }

  const { error } = await supabase
    .from('member_transactions')
    .delete()
    .eq('id', transactionId)
    .eq('country', country);

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  res.status(204).send();
});
