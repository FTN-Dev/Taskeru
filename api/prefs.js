const supabase = require('../../database/supabase');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method === 'GET') {
      // Untuk simplifikasi, kita simpan preferences di localStorage frontend
      res.json({ theme: "dark", lastTab: "all" });
    }

    res.status(404).json({ error: 'Endpoint not found' });
  } catch (error) {
    console.error('Prefs API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};