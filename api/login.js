// api/login.js
const supabase = require('../database/supabase');

module.exports = async (req, res) => {
  console.log('✅ Login endpoint hit');
  
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body;
    
    console.log('🔐 Login attempt:', { username });
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username dan password harus diisi' });
    }

    // GUNAKAN REAL SUPABASE - HAPUS TESTING MODE
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .single();

    console.log('🔍 Login query result:', { user, error });

    if (error || !user) {
      console.log('❌ Login failed - user not found or password wrong');
      return res.status(401).json({ error: 'Username atau password salah' });
    }

    console.log('✅ Login successful for user:', user.username);

    return res.json({ 
      success: true, 
      user: { 
        id: user.id, 
        username: user.username, 
        email: user.email 
      },
      sessionToken: 'token-' + Date.now()
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
};