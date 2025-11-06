const { createClient } = require('@supabase/supabase-js');

// Environment variables akan di-set di Vercel
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  // Fallback untuk development
  const supabase = {
    from: () => ({
      select: () => ({ eq: () => ({ data: [], error: null }) }),
      insert: () => ({ select: () => ({ single: () => ({ data: null, error: new Error('No Supabase config') }) }) }),
      update: () => ({ eq: () => ({ select: () => ({ single: () => ({ data: null, error: new Error('No Supabase config') }) }) }) }),
      delete: () => ({ eq: () => ({ error: null }) })
    })
  };
  module.exports = supabase;
} else {
  const supabase = createClient(supabaseUrl, supabaseKey);
  module.exports = supabase;
}