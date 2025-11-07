const supabase = require('../database/supabase');

module.exports = async (req, res) => {
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

    // Untuk testing, langsung return success
    return res.json({ 
      success: true, 
      user: { 
        id: 'user-' + Date.now(), 
        username, 
        email: username + '@example.com' 
      },
      sessionToken: 'token-' + Date.now()
    });

    /*
    // Kode Supabase (comment dulu)
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Username atau password salah' });
    }

    return res.json({ 
      success: true, 
      user: { id: user.id, username: user.username, email: user.email },
      sessionToken: 'token-' + Date.now()
    });
    */

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};