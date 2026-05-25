const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

let supabase = null;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('Supabase configuration missing. Set SUPABASE_URL and SUPABASE_KEY in backend/.env');
} else {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
  }
}

module.exports = supabase;
