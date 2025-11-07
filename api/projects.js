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
    // Simple auth check
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method === 'GET') {
      // Get all projects for user + built-in
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .or(`user_id.eq.${userId},builtin.is.true`)
        .order('builtin', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Get projects error:', error);
        return res.status(500).json({ error: 'Failed to fetch projects' });
      }

      res.json(data);
    }

    if (req.method === 'POST') {
      // Create new project
      const { name } = req.body;
      
      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Project name is required' });
      }

      // Check if project already exists
      const { data: existingProject } = await supabase
        .from('projects')
        .select('id')
        .eq('name', name.trim())
        .eq('user_id', userId)
        .single();

      if (existingProject) {
        return res.status(400).json({ error: 'Project dengan nama tersebut sudah ada!' });
      }

      const newProject = {
        id: Math.random().toString(36).slice(2, 10),
        name: name.trim(),
        builtin: false,
        user_id: userId,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('projects')
        .insert([newProject])
        .select()
        .single();

      if (error) {
        console.error('Create project error:', error);
        return res.status(500).json({ error: 'Failed to create project' });
      }

      res.json({ success: true, id: data.id, project: data });
    }

    if (req.method === 'DELETE') {
      // Delete project
      const projectId = req.query.id;

      if (!projectId) {
        return res.status(400).json({ error: 'Project ID is required' });
      }

      // Check if project exists and belongs to user
      const { data: project } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .eq('user_id', userId)
        .single();

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      if (project.builtin) {
        return res.status(400).json({ error: 'Cannot delete built-in project' });
      }

      // Move tasks to inbox
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ project_id: 'inbox' })
        .eq('project_id', projectId)
        .eq('user_id', userId);

      if (updateError) {
        console.error('Update tasks error:', updateError);
      }

      // Delete project
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)
        .eq('user_id', userId);

      if (error) {
        console.error('Delete project error:', error);
        return res.status(500).json({ error: 'Failed to delete project' });
      }

      res.json({ success: true });
    }

    res.status(404).json({ error: 'Endpoint not found' });
  } catch (error) {
    console.error('Projects API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};