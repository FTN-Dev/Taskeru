const supabase = require('../database/supabase');

module.exports = async (req, res) => {
  console.log('✅ Register endpoint hit');
  
  // CORS headers
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

    // Gunakan real Supabase
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('id')
      .or(`username.eq.${username},email.eq.${email}`);

    console.log('Existing users check:', existingUsers, checkError);

    if (checkError) {
      console.error('Check error:', checkError);
      return res.status(500).json({ error: 'Database error: ' + checkError.message });
    }

    if (existingUsers && existingUsers.length > 0) {
      return res.status(400).json({ error: 'Username atau Email sudah digunakan' });
    }

    // Create user
    const newUser = {
      id: Math.random().toString(36).slice(2, 10) + Date.now().toString(36),
      username,
      email,
      password, // Dalam production, hash dulu!
      created_at: new Date().toISOString()
    };

    console.log('Creating user:', newUser);

    const { data, error } = await supabase
      .from('users')
      .insert([newUser])
      .select()
      .single();

    if (error) {
      console.error('Insert error:', error);
      return res.status(500).json({ error: 'Error membuat user: ' + error.message });
    }

    console.log('User created successfully:', data);

    return res.json({ 
      success: true, 
      message: 'Registrasi berhasil! Silakan login.',
      user: { id: data.id, username: data.username, email: data.email }
    });

  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
};