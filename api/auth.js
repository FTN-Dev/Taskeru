const supabase = require('../../database/supabase');

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

  const { action } = req.query;

  try {
    if (req.method === 'POST' && action === 'register') {
      const { username, email, password } = req.body;
      
      console.log('Registration attempt:', { username, email });
      
      if (!username || !email || !password) {
        return res.status(400).json({ error: 'Semua field harus diisi' });
      }

      // Check if user already exists - FIXED QUERY
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
        password, // Note: Dalam production sebaiknya di-hash
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
    }

    if (req.method === 'POST' && action === 'login') {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: 'Username dan password harus diisi' });
      }

      // Find user
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .single();

      if (error || !user) {
        return res.status(401).json({ error: 'Username atau password salah' });
      }

      // Create session token
      const sessionToken = Math.random().toString(36).slice(2) + Date.now().toString(36);
      
      return res.json({ 
        success: true, 
        user: { id: user.id, username: user.username, email: user.email },
        sessionToken 
      });
    }

    res.status(404).json({ error: 'Endpoint not found' });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
};