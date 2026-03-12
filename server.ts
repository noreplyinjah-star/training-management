import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database('training.db');

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT DEFAULT 'admin'
  );

  CREATE TABLE IF NOT EXISTS programs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS topics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    program_id INTEGER,
    name TEXT NOT NULL,
    FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS trainees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    program_id INTEGER,
    name TEXT NOT NULL,
    email TEXT,
    FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS grades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trainee_id INTEGER,
    topic_id INTEGER,
    score INTEGER CHECK(score >= 0 AND score <= 100),
    status TEXT, -- 'pass' or 'fail'
    UNIQUE(trainee_id, topic_id),
    FOREIGN KEY (trainee_id) REFERENCES trainees(id) ON DELETE CASCADE,
    FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    username TEXT,
    action TEXT,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// Helper to log activity
const logActivity = (userId, username, action, details) => {
  db.prepare('INSERT INTO activity_logs (user_id, username, action, details) VALUES (?, ?, ?, ?)').run(userId, username, action, details);
};

// Seed admin if not exists
const adminExists = db.prepare('SELECT * FROM users WHERE username = ?').get('admin');
if (!adminExists) {
  db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run('admin', 'admin123', 'admin');
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // API Routes
  app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password);
    if (user) {
      res.json({ success: true, user: { id: user.id, username: user.username, role: user.role } });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  });

  // Programs
  app.get('/api/programs', (req, res) => {
    const programs = db.prepare('SELECT * FROM programs ORDER BY created_at DESC').all();
    res.json(programs);
  });

  app.post('/api/programs', (req, res) => {
    const { name, end_date, userId, username } = req.body;
    const result = db.prepare('INSERT INTO programs (name, end_date) VALUES (?, ?)').run(name, end_date);
    logActivity(userId, username, 'إضافة برنامج', `تم إضافة البرنامج: ${name}`);
    res.json({ id: result.lastInsertRowid });
  });

  app.delete('/api/programs/:id', (req, res) => {
    const { userId, username } = req.query;
    const program = db.prepare('SELECT name FROM programs WHERE id = ?').get(req.params.id);
    db.prepare('DELETE FROM programs WHERE id = ?').run(req.params.id);
    if (program) logActivity(userId, username, 'حذف برنامج', `تم حذف البرنامج: ${program.name}`);
    res.json({ success: true });
  });

  // Topics
  app.get('/api/programs/:id/topics', (req, res) => {
    const topics = db.prepare('SELECT * FROM topics WHERE program_id = ?').all(req.params.id);
    res.json(topics);
  });

  app.post('/api/programs/:id/topics', (req, res) => {
    const { names, userId, username } = req.body; // Array of names
    const program = db.prepare('SELECT name FROM programs WHERE id = ?').get(req.params.id);
    const insert = db.prepare('INSERT INTO topics (program_id, name) VALUES (?, ?)');
    const insertMany = db.transaction((programId, topicNames) => {
      for (const name of topicNames) insert.run(programId, name.trim());
    });
    insertMany(req.params.id, names);
    logActivity(userId, username, 'إضافة موضوعات', `تم إضافة ${names.length} موضوعات للبرنامج: ${program?.name}`);
    res.json({ success: true });
  });

  app.delete('/api/topics/:id', (req, res) => {
    const { userId, username } = req.query;
    const topic = db.prepare('SELECT name FROM topics WHERE id = ?').get(req.params.id);
    db.prepare('DELETE FROM topics WHERE id = ?').run(req.params.id);
    if (topic) logActivity(userId, username, 'حذف موضوع', `تم حذف الموضوع: ${topic.name}`);
    res.json({ success: true });
  });

  // Trainees
  app.get('/api/programs/:id/trainees', (req, res) => {
    const trainees = db.prepare('SELECT * FROM trainees WHERE program_id = ?').all(req.params.id);
    res.json(trainees);
  });

  app.post('/api/programs/:id/trainees', (req, res) => {
    const { trainees, userId, username } = req.body; // Array of {name, email}
    const program = db.prepare('SELECT name FROM programs WHERE id = ?').get(req.params.id);
    const insert = db.prepare('INSERT INTO trainees (program_id, name, email) VALUES (?, ?, ?)');
    const insertMany = db.transaction((programId, traineeList) => {
      for (const t of traineeList) insert.run(programId, t.name.trim(), t.email?.trim() || '');
    });
    insertMany(req.params.id, trainees);
    logActivity(userId, username, 'إضافة متدربين', `تم إضافة ${trainees.length} متدربين للبرنامج: ${program?.name}`);
    res.json({ success: true });
  });

  app.delete('/api/trainees/:id', (req, res) => {
    const { userId, username } = req.query;
    const trainee = db.prepare('SELECT name FROM trainees WHERE id = ?').get(req.params.id);
    db.prepare('DELETE FROM trainees WHERE id = ?').run(req.params.id);
    if (trainee) logActivity(userId, username, 'حذف متدرب', `تم حذف المتدرب: ${trainee.name}`);
    res.json({ success: true });
  });

  // Grades
  app.get('/api/grades/:programId', (req, res) => {
    const grades = db.prepare(`
      SELECT g.*, t.name as trainee_name, top.name as topic_name 
      FROM grades g
      JOIN trainees t ON g.trainee_id = t.id
      JOIN topics top ON g.topic_id = top.id
      WHERE t.program_id = ?
    `).all(req.params.programId);
    res.json(grades);
  });

  app.post('/api/grades', (req, res) => {
    const { trainee_id, topic_id, score, userId, username } = req.body;
    const status = score >= 50 ? 'pass' : 'fail';
    const trainee = db.prepare('SELECT name FROM trainees WHERE id = ?').get(trainee_id);
    const topic = db.prepare('SELECT name FROM topics WHERE id = ?').get(topic_id);
    
    db.prepare(`
      INSERT INTO grades (trainee_id, topic_id, score, status)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(trainee_id, topic_id) DO UPDATE SET
        score = excluded.score,
        status = excluded.status
    `).run(trainee_id, topic_id, score, status);

    logActivity(userId, username, 'رصد درجة', `تم رصد درجة ${score} للمتدرب ${trainee?.name} في موضوع ${topic?.name}`);
    res.json({ success: true });
  });

  // Trainee Report
  app.get('/api/trainees/:id/report', (req, res) => {
    const trainee = db.prepare('SELECT * FROM trainees WHERE id = ?').get(req.params.id);
    if (!trainee) return res.status(404).json({ error: 'Trainee not found' });

    const totalTopics = db.prepare('SELECT COUNT(*) as count FROM topics WHERE program_id = ?').get(trainee.program_id).count;
    const grades = db.prepare(`
      SELECT g.*, top.name as topic_name 
      FROM topics top
      LEFT JOIN grades g ON g.topic_id = top.id AND g.trainee_id = ?
      WHERE top.program_id = ?
    `).all(req.params.id, trainee.program_id);

    const evaluated = grades.filter(g => g.score !== null).length;
    const passed = grades.filter(g => g.status === 'pass').length;
    const failed = grades.filter(g => g.status === 'fail').length;
    const incomplete = totalTopics - evaluated;

    res.json({
      trainee,
      stats: { totalTopics, evaluated, passed, failed, incomplete },
      details: grades
    });
  });

  // Staff Management
  app.get('/api/staff', (req, res) => {
    const staff = db.prepare('SELECT id, username, role FROM users').all();
    res.json(staff);
  });

  app.post('/api/staff', (req, res) => {
    const { username, password, role, userId, adminUsername } = req.body;
    try {
      const result = db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run(username, password, role || 'staff');
      logActivity(userId, adminUsername, 'إضافة موظف', `تم إضافة الموظف: ${username} بصلاحية ${role}`);
      res.json({ id: result.lastInsertRowid });
    } catch (e) {
      res.status(400).json({ error: 'Username already exists' });
    }
  });

  app.delete('/api/staff/:id', (req, res) => {
    const { userId, username } = req.query;
    const staff = db.prepare('SELECT username FROM users WHERE id = ?').get(req.params.id);
    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    if (staff) logActivity(userId, username, 'حذف موظف', `تم حذف الموظف: ${staff.username}`);
    res.json({ success: true });
  });

  // Activity Logs
  app.get('/api/logs', (req, res) => {
    const logs = db.prepare('SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 100').all();
    res.json(logs);
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
