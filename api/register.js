const supabase = require('../database/supabase');

module.exports = async (req, res) => {
  // Set CORS headers
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
    const { username, email, password } = req.body;
    
    console.log('🔐 Registration attempt:', { username, email });
    
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Semua field harus diisi' });
    }

    // Untuk testing, langsung return success dulu
    // Kita bypass Supabase sementara
    
    return res.json({ 
      success: true, 
      message: 'Registrasi berhasil! Silakan login.',
      user: { 
        id: 'user-' + Date.now(), 
        username, 
        email 
      }
    });

    /* 
    // Kode Supabase (comment dulu untuk testing)
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('id')
      .or(`username.eq.${username},email.eq.${email}`);

    if (checkError) {
      console.error('❌ Check error:', checkError);
      return res.status(500).json({ error: 'Database error' });
    }

    if (existingUsers && existingUsers.length > 0) {
      return res.status(400).json({ error: 'Username atau Email sudah digunakan' });
    }

    const newUser = {
      id: Math.random().toString(36).slice(2, 10) + Date.now().toString(36),
      username,
      email,
      password,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('users')
      .insert([newUser])
      .select()
      .single();

    if (error) {
      console.error('❌ Insert error:', error);
      return res.status(500).json({ error: 'Error membuat user' });
    }

    return res.json({ 
      success: true, 
      message: 'Registrasi berhasil! Silakan login.',
      user: { id: data.id, username: data.username, email: data.email }
    });
    */

  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};