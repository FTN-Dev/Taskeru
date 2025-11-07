const supabase = require('../database/supabase');

module.exports = async (req, res) => {
  console.log('✅ Projects endpoint hit:', req.method, req.url);
  
  // CORS headers
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
      // Get all projects for user
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Get projects error:', error);
        return res.status(500).json({ error: 'Failed to fetch projects' });
      }

      res.json(data || []);
    }

    if (req.method === 'POST') {
      // Create new project
      const { name } = req.body;
      
      console.log('📝 Creating project:', { name, userId });

      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Project name is required' });
      }

      const newProject = {
        id: Math.random().toString(36).slice(2, 10) + Date.now().toString(36),
        name: name.trim(),
        user_id: userId,
        builtin: false,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('projects')
        .insert([newProject])
        .select()
        .single();

      if (error) {
        console.error('Create project error:', error);
        return res.status(500).json({ error: 'Failed to create project: ' + error.message });
      }

      console.log('✅ Project created:', data.id);
      res.json({ id: data.id, name: data.name, builtin: data.builtin });
    }

    res.status(404).json({ error: 'Endpoint not found' });
  } catch (error) {
    console.error('Projects API error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
};