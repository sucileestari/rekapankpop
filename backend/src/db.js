import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib diisi di backend/.env');
}

export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

export const coProofBucket = process.env.SUPABASE_CO_PROOF_BUCKET || 'co-proofs';
export const recapCategoryBucket = process.env.SUPABASE_RECAP_CATEGORY_BUCKET || 'recap-categories';
export const paymentProofBucket = process.env.SUPABASE_PAYMENT_PROOF_BUCKET || 'payment-proofs';
