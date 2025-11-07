// database/supabase.js
const { createClient } = require('@supabase/supabase-js');

console.log('🔧 Loading Supabase client...');

// Manual Supabase credentials - GANTI DENGAN VALUE ANDA
const supabaseUrl = 'https://qduqlhscmwfxtizaezqj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkdXFsaHNjbXdmeHRpemFlenFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0MDA5MjUsImV4cCI6MjA3Nzk3NjkyNX0.gqC4dRucgJRoDVlElEIQfn0-Olro809jAZJk-JZjIvg'; 

// Atau tetap gunakan environment variables jika ada, fallback ke manual
const finalSupabaseUrl = process.env.SUPABASE_URL || supabaseUrl;
const finalSupabaseKey = process.env.SUPABASE_ANON_KEY || supabaseKey;

console.log('🔧 Supabase URL:', finalSupabaseUrl ? 'Set' : 'Not set');
console.log('🔧 Supabase Key:', finalSupabaseKey ? 'Set' : 'Not set');

if (!finalSupabaseUrl || !finalSupabaseKey || finalSupabaseUrl.includes('your-project-id')) {
  console.log('❌ Supabase credentials not properly configured');
  console.log('🔧 Using mock Supabase client for testing');
  
  // Mock client untuk testing
  const mockClient = {
    from: (table) => ({
      select: (columns) => ({
        eq: (col, val) => {
          console.log(`🔧 Mock SELECT from ${table} where ${col} = ${val}`);
          return Promise.resolve({ data: null, error: null });
        },
        or: (condition) => {
          console.log(`🔧 Mock SELECT from ${table} with OR: ${condition}`);
          return Promise.resolve({ data: [], error: null });
        },
        single: () => {
          console.log(`🔧 Mock SELECT single from ${table}`);
          return Promise.resolve({ data: null, error: { message: 'No user found' } });
        }
      }),
      insert: (data) => {
        console.log(`🔧 Mock INSERT into ${table}:`, data);
        return {
          select: () => ({
            single: () => Promise.resolve({ 
              data: { 
                id: 'mock-' + Date.now(), 
                ...data[0],
                created_at: new Date().toISOString()
              }, 
              error: null 
            })
          })
        };
      }
    })
  };
  
  module.exports = mockClient;
} else {
  console.log('✅ Using real Supabase client with manual credentials');
  try {
    const supabase = createClient(finalSupabaseUrl, finalSupabaseKey);
    
    // Test connection
    supabase.from('users').select('count', { count: 'exact', head: true })
      .then(result => {
        console.log('✅ Supabase connection test:', result.error ? 'Error' : 'Success');
        if (result.error) {
          console.error('❌ Supabase error:', result.error);
        }
      });
    
    module.exports = supabase;
  } catch (error) {
    console.error('❌ Error creating Supabase client:', error);
    // Fallback to mock client
    console.log('🔧 Falling back to mock client');
    module.exports = {
      from: (table) => ({
        select: () => ({
          eq: () => Promise.resolve({ data: null, error: null }),
          or: () => Promise.resolve({ data: [], error: null }),
          single: () => Promise.resolve({ data: null, error: null })
        }),
        insert: (data) => ({
          select: () => ({
            single: () => Promise.resolve({ data: data[0], error: null })
          })
        })
      })
    };
  }
}