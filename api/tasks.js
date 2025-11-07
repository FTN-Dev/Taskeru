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

  try {
    // Simple auth check (dalam production gunakan JWT)
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method === 'GET') {
      // Get all tasks for user
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Get tasks error:', error);
        return res.status(500).json({ error: 'Failed to fetch tasks' });
      }

      // Format data untuk kompatibilitas dengan frontend
      const formattedTasks = data.map(task => ({
        id: task.id,
        title: task.title,
        desc: task.description,
        due: task.due_date,
        priority: task.priority,
        project: task.project_id,
        completed: task.completed,
        createdAt: task.created_at,
        updatedAt: task.updated_at
      }));

      res.json(formattedTasks);
    }

    if (req.method === 'POST') {
      // Create new task
      const { title, desc, due, priority, project } = req.body;
      
      if (!title || !title.trim()) {
        return res.status(400).json({ error: 'Task title is required' });
      }

      const newTask = {
        id: Math.random().toString(36).slice(2, 10),
        title: title.trim(),
        description: (desc || "").trim(),
        due_date: due || null,
        priority: Number(priority || 2),
        project_id: project || 'inbox',
        user_id: userId,
        completed: false,
        created_at: Date.now(),
        updated_at: Date.now()
      };

      const { data, error } = await supabase
        .from('tasks')
        .insert([newTask])
        .select()
        .single();

      if (error) {
        console.error('Create task error:', error);
        return res.status(500).json({ error: 'Failed to create task' });
      }

      res.json({ 
        success: true, 
        id: data.id,
        task: {
          id: data.id,
          title: data.title,
          desc: data.description,
          due: data.due_date,
          priority: data.priority,
          project: data.project_id,
          completed: data.completed,
          createdAt: data.created_at,
          updatedAt: data.updated_at
        }
      });
    }

    if (req.method === 'PUT') {
      // Update task
      const taskId = req.query.id;
      const { title, desc, due, priority, project, completed } = req.body;

      if (!taskId) {
        return res.status(400).json({ error: 'Task ID is required' });
      }

      const updates = {
        title: title?.trim(),
        description: desc?.trim(),
        due_date: due || null,
        priority: priority ? Number(priority) : undefined,
        project_id: project,
        completed: completed !== undefined ? Boolean(completed) : undefined,
        updated_at: Date.now()
      };

      // Remove undefined fields
      Object.keys(updates).forEach(key => updates[key] === undefined && delete updates[key]);

      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Update task error:', error);
        return res.status(500).json({ error: 'Failed to update task' });
      }

      res.json({ 
        success: true, 
        task: {
          id: data.id,
          title: data.title,
          desc: data.description,
          due: data.due_date,
          priority: data.priority,
          project: data.project_id,
          completed: data.completed,
          createdAt: data.created_at,
          updatedAt: data.updated_at
        }
      });
    }

    if (req.method === 'DELETE') {
      // Delete task
      const taskId = req.query.id;

      if (!taskId) {
        return res.status(400).json({ error: 'Task ID is required' });
      }

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .eq('user_id', userId);

      if (error) {
        console.error('Delete task error:', error);
        return res.status(500).json({ error: 'Failed to delete task' });
      }

      res.json({ success: true });
    }

    res.status(404).json({ error: 'Endpoint not found' });
  } catch (error) {
    console.error('Tasks API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};