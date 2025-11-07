const { createClient } = require('@supabase/supabase-js');

// Simple Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('🔧 Using mock Supabase client');
  module.exports = {
    from: () => ({
      select: () => ({
        eq: () => ({ data: null, error: null }),
        or: () => ({ data: [], error: null }),
        single: () => ({ data: null, error: { message: 'No user found' } })
      }),
      insert: (data) => ({
        select: () => ({
          single: () => ({ data: data[0], error: null })
        })
      })
    })
  };
} else {
  console.log('🔧 Using real Supabase client');
  const supabase = createClient(supabaseUrl, supabaseKey);
  module.exports = supabase;
}