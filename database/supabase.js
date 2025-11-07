const { createClient } = require('@supabase/supabase-js');

console.log('🔧 Loading Supabase client...');

// MANUAL CREDENTIALS - GANTI DENGAN MILIK ANDA
const supabaseUrl = 'https://qduqlhscmwfxtizaezqj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkdXFsaHNjbXdmeHRpemFlenFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0MDA5MjUsImV4cCI6MjA3Nzk3NjkyNX0.gqC4dRucgJRoDVlElEIQfn0-Olro809jAZJk-JZjIvg';

console.log('🔧 Supabase URL:', supabaseUrl);
console.log('🔧 Supabase Key:', supabaseKey ? 'Set' : 'Not set');

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project-id')) {
  console.log('❌ Please update Supabase credentials in database/supabase.js');
  console.log('🔧 Using mock Supabase client for now');
  
  // Mock client
  const mockClient = {
    from: (table) => ({
      select: (columns) => ({
        eq: (col, val) => {
          console.log(`🔧 Mock SELECT from ${table} where ${col} = ${val}`);
          return Promise.resolve({ data: [], error: null });
        },
        or: (condition) => {
          console.log(`🔧 Mock SELECT from ${table} with OR: ${condition}`);
          return Promise.resolve({ data: [], error: null });
        },
        single: () => {
          console.log(`🔧 Mock SELECT single from ${table}`);
          return Promise.resolve({ data: null, error: { message: 'No data found' } });
        },
        order: (col, opts) => ({
          eq: () => Promise.resolve({ data: [], error: null })
        })
      }),
      insert: (data) => {
        console.log(`🔧 Mock INSERT into ${table}:`, data);
        return {
          select: () => ({
            single: () => Promise.resolve({ 
              data: data[0], 
              error: null 
            })
          })
        };
      },
      update: (data) => ({
        eq: (col, val) => ({
          select: () => ({
            single: () => Promise.resolve({ 
              data: { ...data, id: val }, 
              error: null 
            })
          })
        })
      }),
      delete: () => ({
        eq: () => Promise.resolve({ data: null, error: null })
      })
    })
  };
  
  module.exports = mockClient;
} else {
  console.log('✅ Using real Supabase client');
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test connection
    supabase.from('projects').select('count', { count: 'exact', head: true })
      .then(result => {
        if (result.error) {
          console.error('❌ Supabase connection error:', result.error);
        } else {
          console.log('✅ Supabase connected successfully');
        }
      });
    
    module.exports = supabase;
  } catch (error) {
    console.error('❌ Error creating Supabase client:', error);
    // Fallback to mock
    module.exports = { from: () => ({ /* mock methods */ }) };
  }
}