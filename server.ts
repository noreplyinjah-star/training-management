import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize Supabase client
// Note: These should be set in your environment variables
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null as any;

// Helper to log activity
const logActivity = async (userId: any, username: any, action: any, details: any) => {
  if (!supabase) return;
  await supabase.from('activity_logs').insert([
    { user_id: userId, username, action, details }
  ]);
};

// Seed admin if not exists
const seedAdmin = async () => {
  if (!supabase) return;
  try {
    const { data: adminExists } = await supabase
      .from('users')
      .select('*')
      .eq('username', 'admin')
      .single();

    if (!adminExists) {
      await supabase.from('users').insert([
        { username: 'admin', password: 'admin123', role: 'admin' }
      ]);
      console.log('Default admin user seeded in Supabase.');
    }
  } catch (err) {
    console.error('Error seeding admin user:', err);
  }
};

async function startServer() {
  await seedAdmin();
  const app = express();
  app.use(express.json());

  // API Routes
  app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    if (!supabase) {
      return res.status(500).json({ success: false, message: 'Supabase URL not configured' });
    }
    
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .single();

    if (user && !error) {
      res.json({ success: true, user: { id: user.id, username: user.username, role: user.role } });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  });

  // Programs
  app.get('/api/programs', async (req, res) => {
    if (!supabase) return res.json([]);
    const { data: programs } = await supabase
      .from('programs')
      .select('*')
      .order('created_at', { ascending: false });
    res.json(programs || []);
  });

  app.post('/api/programs', async (req, res) => {
    const { name, end_date, userId, username } = req.body;
    if (!supabase) return res.json({ id: null });
    
    const { data, error } = await supabase
      .from('programs')
      .insert([{ name, end_date }])
      .select()
      .single();
      
    if (!error && data) {
      await logActivity(userId, username, 'إضافة برنامج', `تم إضافة البرنامج: ${name}`);
      res.json({ id: data.id });
    } else {
      res.status(500).json({ error: error?.message });
    }
  });

  app.delete('/api/programs/:id', async (req, res) => {
    const { userId, username } = req.query;
    if (!supabase) return res.json({ success: true });
    
    const { data: program } = await supabase
      .from('programs')
      .select('name')
      .eq('id', req.params.id)
      .single();
      
    await supabase.from('programs').delete().eq('id', req.params.id);
    
    if (program) await logActivity(userId, username, 'حذف برنامج', `تم حذف البرنامج: ${program.name}`);
    res.json({ success: true });
  });

  // Topics
  app.get('/api/programs/:id/topics', async (req, res) => {
    if (!supabase) return res.json([]);
    const { data: topics } = await supabase
      .from('topics')
      .select('*')
      .eq('program_id', req.params.id);
    res.json(topics || []);
  });

  app.post('/api/programs/:id/topics', async (req, res) => {
    const { names, userId, username } = req.body; // Array of names
    if (!supabase) return res.json({ success: true });
    
    const { data: program } = await supabase
      .from('programs')
      .select('name')
      .eq('id', req.params.id)
      .single();
      
    const topicsToInsert = names.map((name: string) => ({
      program_id: req.params.id,
      name: name.trim()
    }));
    
    await supabase.from('topics').insert(topicsToInsert);
    
    await logActivity(userId, username, 'إضافة موضوعات', `تم إضافة ${names.length} موضوعات للبرنامج: ${program?.name}`);
    res.json({ success: true });
  });

  app.delete('/api/topics/:id', async (req, res) => {
    const { userId, username } = req.query;
    if (!supabase) return res.json({ success: true });
    
    const { data: topic } = await supabase
      .from('topics')
      .select('name')
      .eq('id', req.params.id)
      .single();
      
    await supabase.from('topics').delete().eq('id', req.params.id);
    
    if (topic) await logActivity(userId, username, 'حذف موضوع', `تم حذف الموضوع: ${topic.name}`);
    res.json({ success: true });
  });

  // Trainees
  app.get('/api/programs/:id/trainees', async (req, res) => {
    if (!supabase) return res.json([]);
    const { data: trainees } = await supabase
      .from('trainees')
      .select('*')
      .eq('program_id', req.params.id);
    res.json(trainees || []);
  });

  app.post('/api/programs/:id/trainees', async (req, res) => {
    const { trainees, userId, username } = req.body; // Array of {name, email}
    if (!supabase) return res.json({ success: true });
    
    const { data: program } = await supabase
      .from('programs')
      .select('name')
      .eq('id', req.params.id)
      .single();
      
    const traineesToInsert = trainees.map((t: any) => ({
      program_id: req.params.id,
      name: t.name.trim(),
      email: t.email?.trim() || ''
    }));
    
    await supabase.from('trainees').insert(traineesToInsert);
    
    await logActivity(userId, username, 'إضافة متدربين', `تم إضافة ${trainees.length} متدربين للبرنامج: ${program?.name}`);
    res.json({ success: true });
  });

  app.delete('/api/trainees/:id', async (req, res) => {
    const { userId, username } = req.query;
    if (!supabase) return res.json({ success: true });
    
    const { data: trainee } = await supabase
      .from('trainees')
      .select('name')
      .eq('id', req.params.id)
      .single();
      
    await supabase.from('trainees').delete().eq('id', req.params.id);
    
    if (trainee) await logActivity(userId, username, 'حذف متدرب', `تم حذف المتدرب: ${trainee.name}`);
    res.json({ success: true });
  });

  // Grades
  app.get('/api/grades/:programId', async (req, res) => {
    if (!supabase) return res.json([]);
    
    // In Supabase, we can use joins via foreign keys
    const { data: grades, error } = await supabase
      .from('grades')
      .select(`
        *,
        trainees!inner(name, program_id),
        topics!inner(name)
      `)
      .eq('trainees.program_id', req.params.programId);
      
    if (error) {
      console.error(error);
      return res.json([]);
    }
    
    // Map to match the expected format
    const formattedGrades = grades.map((g: any) => ({
      ...g,
      trainee_name: g.trainees.name,
      topic_name: g.topics.name
    }));
    
    res.json(formattedGrades);
  });

  app.post('/api/grades', async (req, res) => {
    const { trainee_id, topic_id, score, userId, username } = req.body;
    if (!supabase) return res.json({ success: true });
    
    const status = score >= 50 ? 'pass' : 'fail';
    
    const { data: trainee } = await supabase.from('trainees').select('name').eq('id', trainee_id).single();
    const { data: topic } = await supabase.from('topics').select('name').eq('id', topic_id).single();
    
    // Upsert grade
    await supabase
      .from('grades')
      .upsert({ 
        trainee_id, 
        topic_id, 
        score, 
        status 
      }, { onConflict: 'trainee_id,topic_id' });

    await logActivity(userId, username, 'رصد درجة', `تم رصد درجة ${score} للمتدرب ${trainee?.name} في موضوع ${topic?.name}`);
    res.json({ success: true });
  });

  // Trainee Report
  app.get('/api/trainees/:id/report', async (req, res) => {
    if (!supabase) return res.json({ error: 'Supabase not configured' });
    
    const { data: trainee } = await supabase
      .from('trainees')
      .select('*')
      .eq('id', req.params.id)
      .single();
      
    if (!trainee) return res.status(404).json({ error: 'Trainee not found' });

    const { count: totalTopics } = await supabase
      .from('topics')
      .select('*', { count: 'exact', head: true })
      .eq('program_id', trainee.program_id);

    // Get all topics for the program
    const { data: topics } = await supabase
      .from('topics')
      .select('*')
      .eq('program_id', trainee.program_id);
      
    // Get all grades for the trainee
    const { data: grades } = await supabase
      .from('grades')
      .select('*')
      .eq('trainee_id', req.params.id);
      
    // Merge topics and grades
    const reportGrades = (topics || []).map((top: any) => {
      const grade = (grades || []).find((g: any) => g.topic_id === top.id);
      return {
        ...grade,
        topic_name: top.name,
        topic_id: top.id,
        trainee_id: trainee.id
      };
    });

    const evaluated = reportGrades.filter((g: any) => g.score !== undefined && g.score !== null).length;
    const passed = reportGrades.filter((g: any) => g.status === 'pass').length;
    const failed = reportGrades.filter((g: any) => g.status === 'fail').length;
    const incomplete = (totalTopics || 0) - evaluated;

    res.json({
      trainee,
      stats: { totalTopics: totalTopics || 0, evaluated, passed, failed, incomplete },
      details: reportGrades
    });
  });

  // Staff Management
  app.get('/api/staff', async (req, res) => {
    if (!supabase) return res.json([]);
    const { data: staff } = await supabase
      .from('users')
      .select('id, username, role');
    res.json(staff || []);
  });

  app.post('/api/staff', async (req, res) => {
    const { username, password, role, userId, adminUsername } = req.body;
    if (!supabase) return res.json({ id: null });
    
    const { data, error } = await supabase
      .from('users')
      .insert([{ username, password, role: role || 'staff' }])
      .select()
      .single();
      
    if (error) {
      res.status(400).json({ error: 'Username already exists' });
    } else {
      await logActivity(userId, adminUsername, 'إضافة موظف', `تم إضافة الموظف: ${username} بصلاحية ${role}`);
      res.json({ id: data.id });
    }
  });

  app.delete('/api/staff/:id', async (req, res) => {
    const { userId, username } = req.query;
    if (!supabase) return res.json({ success: true });
    
    const { data: staff } = await supabase
      .from('users')
      .select('username')
      .eq('id', req.params.id)
      .single();
      
    await supabase.from('users').delete().eq('id', req.params.id);
    
    if (staff) await logActivity(userId, username, 'حذف موظف', `تم حذف الموظف: ${staff.username}`);
    res.json({ success: true });
  });

  // Activity Logs
  app.get('/api/logs', async (req, res) => {
    if (!supabase) return res.json([]);
    const { data: logs } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    res.json(logs || []);
  });

  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(3000, '0.0.0.0', () => {
    console.log('Server running on http://localhost:3000');
  });
}

startServer();
