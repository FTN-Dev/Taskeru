const { createClient } = require('@supabase/supabase-js');

console.log('🔧 Initializing Supabase client...');
console.log('Supabase URL:', process.env.SUPABASE_URL ? '✅ Set' : '❌ Not set');
console.log('Supabase Key:', process.env.SUPABASE_ANON_KEY ? '✅ Set' : '❌ Not set');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ MISSING SUPABASE ENVIRONMENT VARIABLES');
  console.error('Please set SUPABASE_URL and SUPABASE_ANON_KEY in Vercel environment variables');
  
  // Create mock supabase client untuk development
  const mockSupabase = {
    from: (table) => {
      console.log(`📊 Mock Supabase accessing table: ${table}`);
      return {
        select: (columns = '*') => ({
          eq: (column, value) => ({
            data: [],
            error: null
          }),
          or: (conditions) => ({
            data: [],
            error: null
          }),
          single: () => ({
            data: null,
            error: new Error('Supabase not configured')
          })
        }),
        insert: (data) => {
          console.log(`➕ Mock insert into ${table}:`, data);
          return {
            select: (columns = '*') => ({
              single: () => ({
                data: data[0],
                error: null
              })
            })
          };
        },
        update: (data) => ({
          eq: (column, value) => ({
            select: (columns = '*') => ({
              single: () => ({
                data: null,
                error: new Error('Supabase not configured')
              })
            })
          })
        }),
        delete: () => ({
          eq: (column, value) => ({
            error: new Error('Supabase not configured')
          })
        })
      };
    }
  };
  
  module.exports = mockSupabase;
} else {
  console.log('✅ Supabase configured successfully');
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Test connection
  supabase.from('users').select('count').then(result => {
    console.log('🔌 Supabase connection test:', result.error ? '❌ Failed' : '✅ Success');
    if (result.error) {
      console.error('Connection error:', result.error);
    }
  });
  
  module.exports = supabase;
}