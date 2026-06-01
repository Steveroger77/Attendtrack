import express from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import initSqlJs from 'sql.js';

const app = express();
const PORT = 3000;
const DB_PATH = path.join(process.cwd(), 'attendtrack.db');
const JWT_SECRET = process.env.JWT_SECRET || 'college-secure-attendtrack-secret-key-2026';

app.use(express.json({ limit: '10mb' }));
app.use(cors());

// --- SECURITY HEADERS MIDDLEWARE ---
app.use((req, res, next) => {
  // 1. Strict-Transport-Security (HSTS)
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  // 2. Content-Security-Policy (CSP)
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://aistudiocdn.com https://esm.sh; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; connect-src 'self' ws: wss: https://esm.sh https://aistudiocdn.com;");

  // 3. X-Content-Type-Options: nosniff
  res.setHeader('X-Content-Type-Options', 'nosniff');

  next();
});

// --- DATABASE PROMISE WRAPPERS USING PURE JS/WASM SQL.JS ---
let sqlDb: any;
let batchModeActive = false;

const dbReadyPromise = (async () => {
  const SQL = await initSqlJs();
  let fileBuffer: Buffer | null = null;
  if (fs.existsSync(DB_PATH)) {
    try {
      fileBuffer = fs.readFileSync(DB_PATH);
    } catch (e) {
      console.error('Failed to read database file, creating a new one', e);
    }
  }

  if (fileBuffer && fileBuffer.length > 0) {
    sqlDb = new SQL.Database(fileBuffer);
  } else {
    sqlDb = new SQL.Database();
  }

  // Enable foreign key constraints
  sqlDb.run('PRAGMA foreign_keys = ON;');
})();

function persistDb() {
  if (!sqlDb || batchModeActive) return;
  try {
    const data = sqlDb.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  } catch (e) {
    console.error('Failed to persist database file', e);
  }
}

const sanitizeParams = (params: any[]): any[] => {
  return params.map(p => p === undefined ? null : p);
};

const dbRun = async (query: string, params: any[] = []): Promise<{ lastID: number; changes: number }> => {
  await dbReadyPromise;
  const cleanParams = sanitizeParams(params);
  sqlDb.run(query, cleanParams);
  persistDb();

  const lastIDRow = sqlDb.exec("SELECT last_insert_rowid() AS id");
  const lastID = lastIDRow[0]?.values[0]?.[0] as number || 0;

  const changesRow = sqlDb.exec("SELECT changes() AS changes");
  const changes = changesRow[0]?.values[0]?.[0] as number || 0;

  return { lastID, changes };
};

const dbAll = async <T>(query: string, params: any[] = []): Promise<T[]> => {
  await dbReadyPromise;
  const cleanParams = sanitizeParams(params);
  const stmt = sqlDb.prepare(query);
  try {
    stmt.bind(cleanParams);
    const result: T[] = [];
    while (stmt.step()) {
      result.push(stmt.getAsObject() as unknown as T);
    }
    return result;
  } finally {
    stmt.free();
  }
};

const dbGet = async <T>(query: string, params: any[] = []): Promise<T | undefined> => {
  await dbReadyPromise;
  const cleanParams = sanitizeParams(params);
  const stmt = sqlDb.prepare(query);
  try {
    cleanParams.length ? stmt.bind(cleanParams) : null;
    if (stmt.step()) {
      return stmt.getAsObject() as unknown as T;
    }
    return undefined;
  } finally {
    stmt.free();
  }
};

// --- SECURITY RBAC MIDDLEWARES ---
interface AuthUser {
  id: number;
  name: string;
  email: string;
  college_id: string;
  role: 'ADMIN' | 'LECTURER' | 'STUDENT';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

function authenticateJWT(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Forbidden: Invalid custom session session' });
  }
}

const requireRole = (roles: ('ADMIN' | 'LECTURER' | 'STUDENT')[]) => {
  return (req: any, res: any, next: any) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Forbidden: Requires one of these roles: ${roles.join(', ')}` });
    }
    next();
  };
};

// --- SERVER-SIDE SEEDING ---
async function initDatabase() {
  console.log('Initializing database and schemas...');
  batchModeActive = true;
  try {
    // Create tables with correct indices
    await dbRun(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        college_id TEXT NOT NULL UNIQUE,
        role TEXT NOT NULL,
        password_hash TEXT NOT NULL
      );
    `);
  
  await dbRun(`CREATE INDEX IF NOT EXISTS idx_users_college_id ON users(college_id);`);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE
    );
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS sections (
      id INTEGER PRIMARY KEY,
      course_id INTEGER NOT NULL,
      section_name TEXT NOT NULL,
      FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE
    );
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS enrollments (
      id INTEGER PRIMARY KEY,
      student_id INTEGER NOT NULL,
      section_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      UNIQUE(student_id, section_id, course_id),
      FOREIGN KEY(student_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(section_id) REFERENCES sections(id) ON DELETE CASCADE,
      FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE
    );
  `);
  await dbRun(`CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON enrollments(student_id);`);
  await dbRun(`CREATE INDEX IF NOT EXISTS idx_enrollments_section_id ON enrollments(section_id);`);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS timetable (
      id INTEGER PRIMARY KEY,
      section_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      lecturer_id INTEGER NOT NULL,
      day_of_week INTEGER NOT NULL,
      period_index INTEGER NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      FOREIGN KEY(section_id) REFERENCES sections(id) ON DELETE CASCADE,
      FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE,
      FOREIGN KEY(lecturer_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
  await dbRun(`CREATE INDEX IF NOT EXISTS idx_timetable_lecturer_id ON timetable(lecturer_id);`);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS attendance_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      enrollment_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      period_index INTEGER NOT NULL,
      status TEXT NOT NULL,
      marked_by INTEGER NOT NULL,
      marked_at TEXT NOT NULL,
      version INTEGER DEFAULT 1,
      UNIQUE(enrollment_id, date, period_index),
      FOREIGN KEY(enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE,
      FOREIGN KEY(marked_by) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
  await dbRun(`CREATE INDEX IF NOT EXISTS idx_att_enrollment_date ON attendance_records(enrollment_id, date);`);
  await dbRun(`CREATE INDEX IF NOT EXISTS idx_att_date_period ON attendance_records(date, period_index);`);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS attendance_audits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      record_id INTEGER NOT NULL,
      old_status TEXT,
      new_status TEXT NOT NULL,
      changed_by INTEGER NOT NULL,
      changed_at TEXT NOT NULL,
      reason TEXT,
      FOREIGN KEY(record_id) REFERENCES attendance_records(id) ON DELETE CASCADE,
      FOREIGN KEY(changed_by) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
  await dbRun(`CREATE INDEX IF NOT EXISTS idx_audits_record_id ON attendance_audits(record_id);`);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS holidays (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      reason TEXT NOT NULL,
      lecturer_id INTEGER NOT NULL,
      FOREIGN KEY(lecturer_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS leave_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id TEXT NOT NULL,
      student_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      section_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      period_index INTEGER NOT NULL,
      reason TEXT NOT NULL,
      status TEXT NOT NULL,
      reviewed_by INTEGER,
      reviewed_at TEXT,
      request_start_date TEXT,
      request_end_date TEXT,
      FOREIGN KEY(student_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE,
      FOREIGN KEY(section_id) REFERENCES sections(id) ON DELETE CASCADE,
      FOREIGN KEY(reviewed_by) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
  await dbRun(`CREATE INDEX IF NOT EXISTS idx_leaves_group ON leave_requests(group_id);`);
  await dbRun(`CREATE INDEX IF NOT EXISTS idx_leaves_student ON leave_requests(student_id);`);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lecturer_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      section_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(lecturer_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE,
      FOREIGN KEY(section_id) REFERENCES sections(id) ON DELETE CASCADE
    );
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS active_pins (
      timetable_id INTEGER PRIMARY KEY,
      pin TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      FOREIGN KEY(timetable_id) REFERENCES timetable(id) ON DELETE CASCADE
    );
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Check if database needs seeding
  const userCount = await dbGet<{ count: number }>('SELECT COUNT(*) as count FROM users');
  if (userCount && userCount.count === 0) {
    console.log('Seeding initial system database with Bcrypt hashes and demo schedules...');

    // Seed settings
    await dbRun(`INSERT INTO system_settings (key, value) VALUES ('edit_window_days', '2')`);
    await dbRun(`INSERT INTO system_settings (key, value) VALUES ('required_attendance_percentage', '75')`);
    await dbRun(`INSERT INTO system_settings (key, value) VALUES ('warning_attendance_percentage', '80')`);

    // Seed users with bcyrpt hashes
    const defaultUsers = [
      { id: 1, name: 'tanguturi prakasam panthulu', email: 't.panthulu@btech.edu', college_id: 'L001', role: 'LECTURER', pass: 'l001pass' },
      { id: 2, name: 'veereham bhakalam panthulu', email: 'v.panthulu@btech.edu', college_id: 'L002', role: 'LECTURER', pass: 'l002pass' },
      { id: 3, name: 'pingali venkayya', email: 'p.venkayya@btech.edu', college_id: 'L003', role: 'LECTURER', pass: 'l003pass' },
      { id: 4, name: 'bossu', email: 'bossu@btech.edu', college_id: 'L004', role: 'LECTURER', pass: 'l004pass' },
      { id: 5, name: 'heisenberg', email: 'heisenberg@btech.edu', college_id: 'L005', role: 'LECTURER', pass: 'l005pass' },
      { id: 6, name: 'amit', email: 'amit@btech.edu', college_id: 'BT2023001', role: 'STUDENT', pass: 'bt2023001pass' },
      { id: 7, name: 'jon snow', email: 'j.snow@btech.edu', college_id: 'BT2023002', role: 'STUDENT', pass: 'bt2023002pass' },
      { id: 8, name: 'pedhodu', email: 'pedhodu@btech.edu', college_id: 'BT2023003', role: 'STUDENT', pass: 'bt2023003pass' },
      { id: 9, name: 'chinnodu', email: 'chinnodu@btech.edu', college_id: 'BT2023004', role: 'STUDENT', pass: 'bt2023004pass' },
      { id: 10, name: 'zukir', email: 'zukir@btech.edu', college_id: 'BT2023005', role: 'STUDENT', pass: 'bt2023005pass' },
      { id: 11, name: 'relangi Mavayya', email: 'admin@btech.edu', college_id: 'ADMIN01', role: 'ADMIN', pass: 'admin01pass' }
    ];

    for (const u of defaultUsers) {
      const hash = bcrypt.hashSync(u.pass, 10);
      await dbRun('INSERT INTO users (id, name, email, college_id, role, password_hash) VALUES (?, ?, ?, ?, ?, ?)', [
        u.id, u.name, u.email, u.college_id, u.role, hash
      ]);
    }

    // Seed courses
    const defaultCourses = [
      { id: 101, title: 'Cloud Computing', code: 'CC501' },
      { id: 102, title: 'Full Stack Development', code: 'WD601' },
      { id: 103, title: 'Cryptography Network Systems', code: 'CS505' },
      { id: 104, title: 'Python', code: 'CS101' },
      { id: 105, title: 'Artificial Intelligence', code: 'AI701' }
    ];
    for (const c of defaultCourses) {
      await dbRun('INSERT INTO courses (id, title, code) VALUES (?, ?, ?)', [c.id, c.title, c.code]);
    }

    // Seed sections
    const defaultSections = [
      { id: 201, course_id: 101, section_name: 'A' },
      { id: 202, course_id: 102, section_name: 'A' },
      { id: 203, course_id: 103, section_name: 'B' },
      { id: 204, course_id: 104, section_name: 'A' },
      { id: 205, course_id: 105, section_name: 'B' }
    ];
    for (const s of defaultSections) {
      await dbRun('INSERT INTO sections (id, course_id, section_name) VALUES (?, ?, ?)', [s.id, s.course_id, s.section_name]);
    }

    // Seed enrollments (all students id 6 to 10 in all subjects)
    let enrollmentId = 1;
    for (const studentId of [6, 7, 8, 9, 10]) {
      for (const sect of defaultSections) {
        await dbRun('INSERT INTO enrollments (id, student_id, section_id, course_id) VALUES (?, ?, ?, ?)', [
          enrollmentId++, studentId, sect.id, sect.course_id
        ]);
      }
    }

    // Seed timetable
    const initialTimetable = [
      // Monday
      { id: 301, section_id: 204, course_id: 104, day_of_week: 1, period_index: 1, start_time: '09:00', end_time: '10:00', lecturer_id: 4 }, // Python -> Bossu
      { id: 302, section_id: 201, course_id: 101, day_of_week: 1, period_index: 2, start_time: '10:00', end_time: '11:00', lecturer_id: 1 }, // CC -> Prakasam
      { id: 303, section_id: 202, course_id: 102, day_of_week: 1, period_index: 3, start_time: '11:00', end_time: '12:00', lecturer_id: 2 }, // FSD -> Veereham
      { id: 304, section_id: 203, course_id: 103, day_of_week: 1, period_index: 4, start_time: '13:00', end_time: '14:00', lecturer_id: 3 }, // CNS -> Pingali

      // Tuesday
      { id: 305, section_id: 202, course_id: 102, day_of_week: 2, period_index: 1, start_time: '09:00', end_time: '10:00', lecturer_id: 2 },
      { id: 306, section_id: 204, course_id: 104, day_of_week: 2, period_index: 2, start_time: '10:00', end_time: '11:00', lecturer_id: 4 },
      { id: 307, section_id: 205, course_id: 105, day_of_week: 2, period_index: 3, start_time: '11:00', end_time: '12:00', lecturer_id: 5 }, // AI -> Heisenberg
      { id: 308, section_id: 201, course_id: 101, day_of_week: 2, period_index: 4, start_time: '13:00', end_time: '14:00', lecturer_id: 1 },

      // Wednesday
      { id: 309, section_id: 203, course_id: 103, day_of_week: 3, period_index: 1, start_time: '09:00', end_time: '10:00', lecturer_id: 3 },
      { id: 310, section_id: 205, course_id: 105, day_of_week: 3, period_index: 2, start_time: '10:00', end_time: '11:00', lecturer_id: 5 },
      { id: 311, section_id: 201, course_id: 101, day_of_week: 3, period_index: 3, start_time: '11:00', end_time: '12:00', lecturer_id: 1 },
      { id: 312, section_id: 204, course_id: 104, day_of_week: 3, period_index: 4, start_time: '13:00', end_time: '14:00', lecturer_id: 4 },

      // Thursday
      { id: 313, section_id: 202, course_id: 102, day_of_week: 4, period_index: 1, start_time: '09:00', end_time: '10:00', lecturer_id: 2 },
      { id: 314, section_id: 203, course_id: 103, day_of_week: 4, period_index: 2, start_time: '10:00', end_time: '11:00', lecturer_id: 3 },
      { id: 315, section_id: 204, course_id: 104, day_of_week: 4, period_index: 3, start_time: '11:00', end_time: '12:00', lecturer_id: 4 },
      { id: 316, section_id: 205, course_id: 105, day_of_week: 4, period_index: 4, start_time: '13:00', end_time: '14:00', lecturer_id: 5 },

      // Friday
      { id: 317, section_id: 205, course_id: 105, day_of_week: 5, period_index: 1, start_time: '09:00', end_time: '10:00', lecturer_id: 5 },
      { id: 318, section_id: 202, course_id: 102, day_of_week: 5, period_index: 2, start_time: '10:00', end_time: '11:00', lecturer_id: 2 },
      { id: 319, section_id: 203, course_id: 103, day_of_week: 5, period_index: 3, start_time: '11:00', end_time: '12:00', lecturer_id: 3 },
      { id: 320, section_id: 201, course_id: 101, day_of_week: 5, period_index: 4, start_time: '13:00', end_time: '14:00', lecturer_id: 1 }
    ];
    for (const t of initialTimetable) {
      await dbRun('INSERT INTO timetable (id, section_id, course_id, day_of_week, period_index, start_time, end_time, lecturer_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [
        t.id, t.section_id, t.course_id, t.day_of_week, t.period_index, t.start_time, t.end_time, t.lecturer_id
      ]);
    }

    // Seed batch attendance records (August, September, November 2023)
    console.log('Generating batch attendance rows in a single SQL transaction for maximum speed...');
    await dbRun('BEGIN TRANSACTION;');
    try {
      const statuses = ['PRESENT', 'PRESENT', 'PRESENT', 'ABSENT', 'LATE', 'PRESENT', 'PRESENT'];
      const months = [7, 8, 10]; // August, September, November
      const year = 2023;

      const allEnrollments = await dbAll<{ id: number; student_id: number; section_id: number; course_id: number }>('SELECT * FROM enrollments');
      const allTimetable = await dbAll<{ id: number; section_id: number; course_id: number; day_of_week: number; period_index: number; lecturer_id: number }>('SELECT * FROM timetable');

      for (const month of months) {
        const dateObj = new Date(year, month, 1);
        while (dateObj.getMonth() === month) {
          const dayOfWeek = dateObj.getUTCDay();
          if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Skip weekends
            const dateStr = dateObj.toISOString().split('T')[0];

            for (const item of allTimetable) {
              if (item.day_of_week === dayOfWeek) {
                // Find enrolled students
                const students = allEnrollments.filter(e => e.section_id === item.section_id);
                for (const enroll of students) {
                  const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
                  const markedAt = new Date(new Date(dateStr).getTime() + 10 * 60 * 60 * 1000).toISOString();
                  await dbRun(`
                    INSERT INTO attendance_records (enrollment_id, date, period_index, status, marked_by, marked_at, version)
                    VALUES (?, ?, ?, ?, ?, ?, 1)
                  `, [enroll.id, dateStr, item.period_index, randomStatus, item.lecturer_id, markedAt]);
                }
              }
            }
          }
          dateObj.setDate(dateObj.getDate() + 1);
        }
      }
      await dbRun('COMMIT;');
      console.log('Batch attendance generated successfully!');
    } catch (err) {
      await dbRun('ROLLBACK;');
      console.error('Failed mock generation:', err);
    }
  }
  } finally {
    batchModeActive = false;
    persistDb();
  }
  console.log('Database initialization completed.');
}

// Ensure database is initialized before taking server requests
initDatabase().catch(err => {
  console.error('Critical database initialization failure:', err);
});

// --- API ROUTE HANDLERS ---

// 1. Auth Login
app.post('/api/auth/login', async (req, res) => {
  const { collegeId, password } = req.body;
  if (!collegeId || !password) {
    return res.status(400).json({ error: 'College ID and Password are required' });
  }

  try {
    const userRow = await dbGet<any>('SELECT * FROM users WHERE LOWER(college_id) = LOWER(?)', [collegeId.trim()]);
    if (!userRow) {
      return res.status(401).json({ error: 'Invalid College ID or Password' });
    }

    const matches = bcrypt.compareSync(password, userRow.password_hash);
    if (!matches) {
      return res.status(401).json({ error: 'Invalid College ID or Password' });
    }

    const tokenUser: AuthUser = {
      id: userRow.id,
      name: userRow.name,
      email: userRow.email,
      college_id: userRow.college_id,
      role: userRow.role
    };

    const token = jwt.sign(tokenUser, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: tokenUser
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Server auth failure: ' + err.message });
  }
});

// 2. Get Mock Login Details (to preserve mock experience securely but list simple hints)
app.get('/api/auth/mock-logins', async (req, res) => {
  try {
    const list = await dbAll<any>('SELECT name, college_id, role FROM users LIMIT 15');
    // Only return names and college IDs, we won't return secure password hashes
    const listWithHints = list.map(item => ({
      name: item.name,
      college_id: item.college_id,
      role: item.role,
      password: `${item.college_id.toLowerCase()}pass` // Show standard developer demo hint password
    }));
    res.json(listWithHints);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Lecturer Timetable for Date
app.get('/api/timetable/lecturer', authenticateJWT, requireRole(['LECTURER', 'ADMIN']), async (req, res) => {
  const dateStr = (req.query.date as string) || new Date().toISOString().split('T')[0];
  const lecturerId = req.user!.id;
  const targetDay = new Date(dateStr).getUTCDay();

  try {
    const records = await dbAll<any>(`
      SELECT t.*, c.title as course_title, c.code as course_code, s.section_name
      FROM timetable t
      JOIN courses c ON t.course_id = c.id
      JOIN sections s ON t.section_id = s.id
      WHERE t.lecturer_id = ? AND t.day_of_week = ?
      ORDER BY t.period_index ASC
    `, [lecturerId, targetDay]);

    const formatted = records.map(r => ({
      id: r.id,
      section_id: r.section_id,
      lecturer_id: r.lecturer_id,
      day_of_week: r.day_of_week,
      period_index: r.period_index,
      start_time: r.start_time,
      end_time: r.end_time,
      course: { id: r.course_id, title: r.course_title, code: r.course_code },
      section: { id: r.section_id, course_id: r.course_id, section_name: r.section_name }
    }));

    res.json(formatted);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Lecturer Courses
app.get('/api/courses/lecturer', authenticateJWT, requireRole(['LECTURER', 'ADMIN']), async (req, res) => {
  const lecturerId = req.user!.id;
  try {
    const list = await dbAll<any>(`
      SELECT DISTINCT t.course_id, t.section_id, c.title as course_title, c.code as course_code, s.section_name
      FROM timetable t
      JOIN courses c ON t.course_id = c.id
      JOIN sections s ON t.section_id = s.id
      WHERE t.lecturer_id = ?
    `, [lecturerId]);

    const formatted = list.map(item => ({
      id: `${item.course_id}-${item.section_id}`,
      course: { id: item.course_id, title: item.course_title, code: item.course_code },
      section: { id: item.section_id, course_id: item.course_id, section_name: item.section_name }
    }));
    res.json(formatted);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Lecturer Missed Attendance Slots
app.get('/api/attendance/missed', authenticateJWT, requireRole(['LECTURER', 'ADMIN']), async (req, res) => {
  const lecturerId = req.user!.id;
  try {
    const timetable = await dbAll<any>(`
      SELECT t.*, c.title as course_title, c.code as course_code, s.section_name
      FROM timetable t
      JOIN courses c ON t.course_id = c.id
      JOIN sections s ON t.section_id = s.id
      WHERE t.lecturer_id = ?
    `, [lecturerId]);

    const holidays = await dbAll<any>('SELECT date FROM holidays WHERE lecturer_id = ?', [lecturerId]);
    const holidayDates = new Set(holidays.map(h => h.date));

    // Scrape last 30 calendar days to verify unmarked periods
    const missed: any[] = [];
    const today = new Date();
    
    for (let i = 1; i <= 30; i++) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateString = d.toISOString().split('T')[0];
      const dayOfWeek = d.getUTCDay();

      if (dayOfWeek === 0 || dayOfWeek === 6 || holidayDates.has(dateString)) continue;

      const activePeriods = timetable.filter(t => t.day_of_week === dayOfWeek);
      for (const period of activePeriods) {
        // Evaluate if any attendance record exits
        const check = await dbGet<any>(`
          SELECT 1 FROM attendance_records ar
          JOIN enrollments e ON ar.enrollment_id = e.id
          WHERE e.section_id = ? AND ar.date = ? AND ar.period_index = ?
          LIMIT 1
        `, [period.section_id, dateString, period.period_index]);

        if (!check) {
          missed.push({
            date: dateString,
            period: {
              id: period.id,
              section_id: period.section_id,
              lecturer_id: period.lecturer_id,
              day_of_week: period.day_of_week,
              period_index: period.period_index,
              start_time: period.start_time,
              end_time: period.end_time,
              course: { id: period.course_id, title: period.course_title, code: period.course_code },
              section: { id: period.section_id, course_id: period.course_id, section_name: period.section_name }
            }
          });
        }
      }
    }

    res.json(missed.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.period.period_index - b.period.period_index));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Lecturer Attendance Reports
app.get('/api/reports/lecturer', authenticateJWT, requireRole(['LECTURER', 'ADMIN']), async (req, res) => {
  const lecturerId = req.user!.id;
  const startDateStr = req.query.startDate as string;
  const endDateStr = req.query.endDate as string;

  try {
    const coursesList = await dbAll<any>(`
      SELECT DISTINCT t.course_id, t.section_id, c.title as course_title, c.code as course_code, s.section_name
      FROM timetable t
      JOIN courses c ON t.course_id = c.id
      JOIN sections s ON t.section_id = s.id
      WHERE t.lecturer_id = ?
    `, [lecturerId]);

    const holidays = await dbAll<any>('SELECT date FROM holidays WHERE lecturer_id = ?', [lecturerId]);
    const holidayDates = new Set(holidays.map(h => h.date));

    const sDate = startDateStr ? new Date(`${startDateStr}T00:00:00Z`) : new Date('2023-01-01T00:00:00Z');
    const eDate = endDateStr ? new Date(`${endDateStr}T23:59:59Z`) : new Date();

    const result = [];
    for (const tc of coursesList) {
      const enrolls = await dbAll<any>('SELECT id FROM enrollments WHERE course_id = ? AND section_id = ?', [tc.course_id, tc.section_id]);
      const enrollIds = enrolls.map(e => e.id);
      const studentCount = enrolls.length;

      if (studentCount === 0) {
        result.push({
          course: { id: tc.course_id, title: tc.course_title, code: tc.course_code },
          section: { id: tc.section_id, course_id: tc.course_id, section_name: tc.section_name },
          attendance_percentage: 100,
          total_marked: 0,
          total_possible: 0
        });
        continue;
      }

      // Query total marked
      let total_marked = 0;
      if (enrollIds.length > 0) {
        const placeholders = enrollIds.map(() => '?').join(',');
        const queryParams = [...enrollIds];
        let dateQuery = '';
        if (startDateStr) {
          dateQuery += ' AND date >= ?';
          queryParams.push(startDateStr);
        }
        if (endDateStr) {
          dateQuery += ' AND date <= ?';
          queryParams.push(endDateStr);
        }

        const countRow = await dbGet<{ count: number }>(`
          SELECT COUNT(*) as count FROM attendance_records
          WHERE enrollment_id IN (${placeholders}) ${dateQuery} AND status != 'ABSENT'
        `, queryParams);
        total_marked = countRow?.count || 0;
      }

      // Query schedule entries to calculate sessions
      const relevantTimetable = await dbAll<any>(`
        SELECT day_of_week FROM timetable WHERE lecturer_id = ? AND course_id = ? AND section_id = ?
      `, [lecturerId, tc.course_id, tc.section_id]);
      const daysOfClass = new Set(relevantTimetable.map(t => t.day_of_week));

      let total_class_sessions = 0;
      for (let d = new Date(sDate); d <= eDate; d.setUTCDate(d.getUTCDate() + 1)) {
        const dateString = d.toISOString().split('T')[0];
        const dayOfWeek = d.getUTCDay();
        if (holidayDates.has(dateString)) continue;
        if (daysOfClass.has(dayOfWeek)) {
          total_class_sessions++;
        }
      }

      const total_possible = total_class_sessions * studentCount;
      const pct = total_possible > 0 ? Math.round((total_marked / total_possible) * 100) : 100;

      result.push({
        course: { id: tc.course_id, title: tc.course_title, code: tc.course_code },
        section: { id: tc.section_id, course_id: tc.course_id, section_name: tc.section_name },
        attendance_percentage: pct,
        total_marked,
        total_possible
      });
    }

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Get Section Students with Details for Class Period marking
app.get('/api/sections/:sectionId/students', authenticateJWT, async (req, res) => {
  const sectionId = parseInt(req.params.sectionId);
  const dateStr = req.query.date as string;
  const periodIndex = parseInt(req.query.periodIndex as string);

  try {
    const enrollments = await dbAll<any>(`
      SELECT e.id as enrollment_id, e.student_id, u.name, u.college_id
      FROM enrollments e
      JOIN users u ON e.student_id = u.id
      WHERE e.section_id = ?
    `, [sectionId]);

    const formatted = [];
    for (const e of enrollments) {
      // Calculate overall attendance percentage for this student enrollment
      const totalCountRow = await dbGet<{ count: number }>('SELECT COUNT(*) as count FROM attendance_records WHERE enrollment_id = ?', [e.enrollment_id]);
      const presentCountRow = await dbGet<{ count: number }>("SELECT COUNT(*) as count FROM attendance_records WHERE enrollment_id = ? AND status != 'ABSENT'", [e.enrollment_id]);

      const total = totalCountRow?.count || 0;
      const docs = presentCountRow?.count || 0;
      const percentage = total > 0 ? Math.round((docs / total) * 100) : 100;

      // Check current status for the given day and slot
      const statusRow = await dbGet<{ status: string }>('SELECT status FROM attendance_records WHERE enrollment_id = ? AND date = ? AND period_index = ?', [
        e.enrollment_id, dateStr, periodIndex
      ]);

      formatted.push({
        enrollment_id: e.enrollment_id,
        student_id: e.student_id,
        name: e.name,
        college_id: e.college_id,
        attendance_percentage: percentage,
        status: statusRow ? statusRow.status : undefined
      });
    }

    res.json(formatted);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Bulk Mark Attendance with Security Rules window & Admin Override check
app.post('/api/attendance/bulk', authenticateJWT, requireRole(['LECTURER', 'ADMIN']), async (req, res) => {
  const { date, periodIndex, items } = req.body;
  const actorId = req.user!.id;

  try {
    // Check edit window in system settings
    const windowRow = await dbGet<{ value: string }>("SELECT value FROM system_settings WHERE key = 'edit_window_days'");
    const windowDays = windowRow ? parseInt(windowRow.value) : 2;

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const recDate = new Date(date); recDate.setHours(0, 0, 0, 0);
    const daysDiff = (today.getTime() - recDate.getTime()) / (1000 * 3600 * 24);

    if (daysDiff > windowDays && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: `Edit window expired; you can only mark for the past ${windowDays} days. Please consult administration.` });
    }

    const results = [];
    for (const item of items) {
      const existing = await dbGet<any>('SELECT * FROM attendance_records WHERE enrollment_id = ? AND date = ? AND period_index = ?', [
        item.enrollment_id, date, periodIndex
      ]);

      if (existing) {
        const oldStatus = existing.status;
        if (oldStatus !== item.status) {
          // Update record and log audit trailing
          await dbRun(`
            UPDATE attendance_records
            SET status = ?, marked_by = ?, marked_at = ?, version = version + 1
            WHERE id = ?
          `, [item.status, actorId, new Date().toISOString(), existing.id]);

          await dbRun(`
            INSERT INTO attendance_audits (record_id, old_status, new_status, changed_by, changed_at)
            VALUES (?, ?, ?, ?, ?)
          `, [existing.id, oldStatus, item.status, actorId, new Date().toISOString()]);
        }
      } else {
        // Create new attendance record
        const insertRes = await dbRun(`
          INSERT INTO attendance_records (enrollment_id, date, period_index, status, marked_by, marked_at, version)
          VALUES (?, ?, ?, ?, ?, ?, 1)
        `, [item.enrollment_id, date, periodIndex, item.status, actorId, new Date().toISOString()]);

        await dbRun(`
          INSERT INTO attendance_audits (record_id, old_status, new_status, changed_by, changed_at)
          VALUES (?, NULL, ?, ?, ?)
         `, [insertRes.lastID, item.status, actorId, new Date().toISOString()]);
      }
      results.push({ local_id: item.local_id, status: 'APPLIED' });
    }

    res.json(results);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 9. Update Timetable Entry Slot Details
app.post('/api/timetable/entry', authenticateJWT, requireRole(['LECTURER', 'ADMIN']), async (req, res) => {
  const { updatedEntry } = req.body;
  try {
    await dbRun(`
      UPDATE timetable
      SET start_time = ?, end_time = ?
      WHERE id = ?
    `, [updatedEntry.start_time, updatedEntry.end_time, updatedEntry.id]);

    res.json(updatedEntry);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 10. Get Holidays
app.get('/api/holidays/lecturer/:lecturerId', authenticateJWT, async (req, res) => {
  const lecturerId = parseInt(req.params.lecturerId);
  try {
    const arr = await dbAll<any>('SELECT * FROM holidays WHERE lecturer_id = ? ORDER BY date DESC', [lecturerId]);
    res.json(arr);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 11. Add holiday
app.post('/api/holidays', authenticateJWT, requireRole(['LECTURER', 'ADMIN']), async (req, res) => {
  const { date, reason } = req.body;
  const lecturerId = req.user!.id;
  try {
    const result = await dbRun('INSERT INTO holidays (date, reason, lecturer_id) VALUES (?, ?, ?)', [
      date, reason, lecturerId
    ]);
    res.json({ id: result.lastID, date, reason, lecturer_id: lecturerId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 12. Remove holiday
app.delete('/api/holidays/:id', authenticateJWT, requireRole(['LECTURER', 'ADMIN']), async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    await dbRun('DELETE FROM holidays WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 13. Student Timetable
app.get('/api/timetable/student', authenticateJWT, requireRole(['STUDENT', 'ADMIN']), async (req, res) => {
  const studentId = req.user!.id;
  try {
    const list = await dbAll<any>(`
      SELECT t.*, c.title as course_title, c.code as course_code, s.section_name
      FROM timetable t
      JOIN enrollments e ON t.section_id = e.section_id
      JOIN courses c ON t.course_id = c.id
      JOIN sections s ON t.section_id = s.id
      WHERE e.student_id = ?
      ORDER BY t.day_of_week ASC, t.period_index ASC
    `, [studentId]);

    const formatted = list.map(r => ({
      id: r.id,
      section_id: r.section_id,
      lecturer_id: r.lecturer_id,
      day_of_week: r.day_of_week,
      period_index: r.period_index,
      start_time: r.start_time,
      end_time: r.end_time,
      course: { id: r.course_id, title: r.course_title, code: r.course_code },
      section: { id: r.section_id, course_id: r.course_id, section_name: r.section_name }
    }));
    res.json(formatted);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 14. Student Dashboard Summary Cards
app.get('/api/student/dashboard/:studentId', authenticateJWT, async (req, res) => {
  const studentId = parseInt(req.params.studentId);
  try {
    const enrollments = await dbAll<any>(`
      SELECT e.id as enrollment_id, e.course_id, e.section_id, c.title as course_title, c.code as course_code
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      WHERE e.student_id = ?
    `, [studentId]);

    const summaries = [];
    for (const e of enrollments) {
      const records = await dbAll<any>('SELECT status FROM attendance_records WHERE enrollment_id = ?', [e.enrollment_id]);
      const attended = records.filter(r => r.status !== 'ABSENT').length;
      const total = records.length;
      const pct = total > 0 ? Math.round((attended / total) * 100) : 100;

      summaries.push({
        course_id: e.course_id,
        section_id: e.section_id,
        code: e.course_code,
        title: e.course_title,
        percentage: pct,
        attended,
        total
      });
    }

    res.json(summaries);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 15. Student Attendance Details for Slot
app.get('/api/student/attendance/details', authenticateJWT, async (req, res) => {
  const studentId = parseInt(req.query.studentId as string);
  const courseId = parseInt(req.query.courseId as string);
  const sectionId = parseInt(req.query.sectionId as string);
  const dateStr = req.query.date as string;
  const periodIndex = parseInt(req.query.periodIndex as string);

  try {
    const enrollment = await dbGet<any>(`
      SELECT id FROM enrollments WHERE student_id = ? AND course_id = ? AND section_id = ?
    `, [studentId, courseId, sectionId]);

    if (!enrollment) {
      return res.json(null);
    }

    const record = await dbGet<any>(`
      SELECT ar.*, u.name as marker_name
      FROM attendance_records ar
      JOIN users u ON ar.marked_by = u.id
      WHERE ar.enrollment_id = ? AND ar.date = ? AND ar.period_index = ?
    `, [enrollment.id, dateStr, periodIndex]);

    if (!record) {
      return res.json(null);
    }

    // Capture history path audit logs
    const audits = await dbAll<any>(`
      SELECT aa.*, u.name as changer_name
      FROM attendance_audits aa
      JOIN users u ON aa.changed_by = u.id
      WHERE aa.record_id = ?
      ORDER BY aa.changed_at ASC
    `, [record.id]);

    const historyMapped = audits.map(a => ({
      old_status: a.old_status,
      new_status: a.new_status,
      changed_by: a.changer_name,
      changed_at: a.changed_at
    }));

    res.json({
      status: record.status,
      marked_by: record.marker_name,
      marked_at: record.marked_at,
      history: historyMapped
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 16. Student Course History list
app.get('/api/student/course/history', authenticateJWT, async (req, res) => {
  const studentId = parseInt(req.query.studentId as string);
  const courseId = parseInt(req.query.courseId as string);
  const sectionId = parseInt(req.query.sectionId as string);

  try {
    const enrollment = await dbGet<any>(`
      SELECT id FROM enrollments WHERE student_id = ? AND course_id = ? AND section_id = ?
    `, [studentId, courseId, sectionId]);

    if (!enrollment) {
      return res.json([]);
    }

    const list = await dbAll<any>(`
      SELECT date, period_index, status FROM attendance_records
      WHERE enrollment_id = ?
      ORDER BY date DESC, period_index DESC
    `, [enrollment.id]);

    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 17. Admin Manage Users: List All
app.get('/api/admin/users', authenticateJWT, requireRole(['ADMIN']), async (req, res) => {
  try {
    const list = await dbAll<any>('SELECT id, name, email, college_id, role FROM users ORDER BY id DESC');
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 18. Admin Manage Users: Create
app.post('/api/admin/users', authenticateJWT, requireRole(['ADMIN']), async (req, res) => {
  const { name, email, college_id, role } = req.body;
  if (!name || !email || !college_id || !role) {
    return res.status(400).json({ error: 'Missing user fields' });
  }

  try {
    // Hash password: standard password is college_id lowercase + 'pass'
    const defaultPassword = `${college_id.toLowerCase()}pass`;
    const passwordHash = bcrypt.hashSync(defaultPassword, 10);

    const checkUnique = await dbGet<any>('SELECT 1 FROM users WHERE LOWER(college_id) = LOWER(?) OR LOWER(email) = LOWER(?)', [college_id, email]);
    if (checkUnique) {
      return res.status(400).json({ error: 'College ID or Email already exists in the system.' });
    }

    const resObj = await dbRun(`
      INSERT INTO users (name, email, college_id, role, password_hash)
      VALUES (?, ?, ?, ?, ?)
    `, [name, email, college_id, role, passwordHash]);

    res.json({ id: resObj.lastID, name, email, college_id, role });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 19. Admin Manage Users: Update
app.put('/api/admin/users/:id', authenticateJWT, requireRole(['ADMIN']), async (req, res) => {
  const userId = parseInt(req.params.id);
  const { name, email, college_id, role } = req.body;

  try {
    // Verify unique constraints
    const duplicate = await dbGet<any>(`
      SELECT 1 FROM users
      WHERE (LOWER(college_id) = LOWER(?) OR LOWER(email) = LOWER(?)) AND id != ?
    `, [college_id, email, userId]);

    if (duplicate) {
      return res.status(400).json({ error: 'College ID or Email belongs to another user.' });
    }

    // Keep password hashing or update fields
    await dbRun(`
      UPDATE users
      SET name = ?, email = ?, college_id = ?, role = ?
      WHERE id = ?
    `, [name, email, college_id, role, userId]);

    res.json({ id: userId, name, email, college_id, role });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 20. Admin Manage Users: Delete
app.delete('/api/admin/users/:id', authenticateJWT, requireRole(['ADMIN']), async (req, res) => {
  const userId = parseInt(req.params.id);
  try {
    await dbRun('DELETE FROM users WHERE id = ?', [userId]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 21. Get App Settings
app.get('/api/admin/settings', authenticateJWT, async (req, res) => {
  try {
    const list = await dbAll<{ key: string; value: string }>('SELECT * FROM system_settings');
    const settings: Record<string, number> = {};
    list.forEach(item => {
      settings[item.key] = parseInt(item.value);
    });
    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 22. Save App Settings
app.post('/api/admin/settings', authenticateJWT, requireRole(['ADMIN']), async (req, res) => {
  const settings = req.body;
  try {
    for (const key of Object.keys(settings)) {
      await dbRun('INSERT OR REPLACE INTO system_settings (key, value) VALUES (?, ?)', [key, String(settings[key])]);
    }
    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 23. Full system Audit Logs
app.get('/api/admin/audit-logs', authenticateJWT, requireRole(['ADMIN']), async (req, res) => {
  try {
    const audits = await dbAll<any>(`
      SELECT aa.*,
             u_changer.name as changer_name,
             u_student.name as student_name,
             u_student.college_id as student_college_id,
             c.title as course_title,
             c.code as course_code,
             sec.section_name,
             ar.date
      FROM attendance_audits aa
      JOIN attendance_records ar ON aa.record_id = ar.id
      JOIN enrollments e ON ar.enrollment_id = e.id
      JOIN users u_student ON e.student_id = u_student.id
      JOIN users u_changer ON aa.changed_by = u_changer.id
      JOIN courses c ON e.course_id = c.id
      JOIN sections sec ON e.section_id = sec.id
      ORDER BY aa.changed_at DESC
      LIMIT 100
    `);

    const mapped = audits.map(a => ({
      id: a.id,
      changed_at: a.changed_at,
      student_name: a.student_name,
      student_college_id: a.student_college_id,
      changer_name: a.changer_name,
      course_title: a.course_title,
      course_code: a.course_code,
      section_name: a.section_name,
      old_status: a.old_status,
      new_status: a.new_status
    }));

    res.json(mapped);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 24. Admin Stats Dashboard counts
app.get('/api/admin/dashboard-stats', authenticateJWT, requireRole(['ADMIN']), async (req, res) => {
  try {
    const totalUsersRow = await dbGet<{ count: number }>('SELECT COUNT(*) as count FROM users');
    const totalStudentsRow = await dbGet<{ count: number }>("SELECT COUNT(*) as count FROM users WHERE role = 'STUDENT'");
    const totalLecturersRow = await dbGet<{ count: number }>("SELECT COUNT(*) as count FROM users WHERE role = 'LECTURER'");

    res.json({
      totalUsers: totalUsersRow?.count || 0,
      totalStudents: totalStudentsRow?.count || 0,
      totalLecturers: totalLecturersRow?.count || 0
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 25. Get Full course timetables
app.get('/api/admin/timetable', authenticateJWT, requireRole(['ADMIN']), async (req, res) => {
  try {
    const list = await dbAll<any>(`
      SELECT t.*, c.title as course_title, c.code as course_code, s.section_name
      FROM timetable t
      JOIN courses c ON t.course_id = c.id
      JOIN sections s ON t.section_id = s.id
      ORDER BY t.day_of_week ASC, t.period_index ASC
    `);

    const formatted = list.map(r => ({
      id: r.id,
      section_id: r.section_id,
      lecturer_id: r.lecturer_id,
      day_of_week: r.day_of_week,
      period_index: r.period_index,
      start_time: r.start_time,
      end_time: r.end_time,
      course: { id: r.course_id, title: r.course_title, code: r.course_code },
      section: { id: r.section_id, course_id: r.course_id, section_name: r.section_name }
    }));
    res.json(formatted);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 26. Update All Lecturer Assignments
app.post('/api/admin/timetable/assignments', authenticateJWT, requireRole(['ADMIN']), async (req, res) => {
  const assignments = req.body; // Record<timetableId, lecturerId>
  try {
    for (const timetableIdStr of Object.keys(assignments)) {
      const timetableId = parseInt(timetableIdStr);
      const lecturerId = assignments[timetableIdStr];
      if (lecturerId === null) {
        // Can make assignment null or throw
        await dbRun('UPDATE timetable SET lecturer_id = 0 WHERE id = ?', [timetableId]);
      } else {
        await dbRun('UPDATE timetable SET lecturer_id = ? WHERE id = ?', [lecturerId, timetableId]);
      }
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 27. Get All Courses and sections list
app.get('/api/courses-sections', authenticateJWT, async (req, res) => {
  try {
    const list = await dbAll<any>(`
      SELECT s.id as section_id, s.section_name, c.id as course_id, c.title as course_title, c.code as course_code
      FROM sections s
      JOIN courses c ON s.course_id = c.id
      ORDER BY c.title ASC, s.section_name ASC
    `);
    const formatted = list.map(item => ({
      course: { id: item.course_id, title: item.course_title, code: item.course_code },
      section: { id: item.section_id, course_id: item.course_id, section_name: item.section_name }
    }));
    res.json(formatted);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 28. Get sections assigned to lecturer
app.get('/api/lecturer/:lecturerId/sections', authenticateJWT, async (req, res) => {
  const lecturerId = parseInt(req.params.lecturerId);
  try {
    const list = await dbAll<any>(`
      SELECT DISTINCT section_id FROM timetable WHERE lecturer_id = ?
    `, [lecturerId]);
    res.json(list.map(item => item.section_id));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 29. Update sections assigned to lecturer (by replacing rows in timetable)
app.post('/api/lecturer/:lecturerId/sections', authenticateJWT, requireRole(['ADMIN']), async (req, res) => {
  const lecturerId = parseInt(req.params.lecturerId);
  const sectionIds: number[] = req.body; // array of section IDs

  try {
    // For safety, clear previous and assign new mapping or update entries
    if (sectionIds.length === 0) {
      await dbRun('UPDATE timetable SET lecturer_id = 0 WHERE lecturer_id = ?', [lecturerId]);
    } else {
      const placeholders = sectionIds.map(() => '?').join(',');
      await dbRun(`UPDATE timetable SET lecturer_id = ? WHERE section_id IN (${placeholders})`, [lecturerId, ...sectionIds]);
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 30. Leave request create single
app.post('/api/leave/request', authenticateJWT, requireRole(['STUDENT', 'ADMIN']), async (req, res) => {
  const { block_list, reason, startDate, endDate } = req.body;
  const studentId = req.user!.id;
  const groupId = Math.random().toString(36).substr(2, 9);

  try {
    for (const b of block_list) {
      // b contains: { date, period_index, course_id, section_id, start_date, end_date }
      await dbRun(`
        INSERT INTO leave_requests (group_id, student_id, course_id, section_id, date, period_index, reason, status, request_start_date, request_end_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?)
      `, [groupId, studentId, b.course_id, b.section_id, b.date, b.period_index, reason, startDate, endDate]);
    }
    res.json({ success: true, groupId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 31. Bulk leave requests (computes multiple periods across dates autonomously)
app.post('/api/leave/request/bulk', authenticateJWT, requireRole(['STUDENT', 'ADMIN']), async (req, res) => {
  const studentId = req.user!.id;
  const { startDate, endDate, reason } = req.body;
  const groupId = Math.random().toString(36).substr(2, 9);

  try {
    const list = await dbAll<any>(`
      SELECT t.*, c.id as course_id, s.id as section_id
      FROM timetable t
      JOIN enrollments e ON t.section_id = e.section_id
      JOIN courses c ON t.course_id = c.id
      JOIN sections s ON t.section_id = s.id
      WHERE e.student_id = ?
    `, [studentId]);

    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateString = d.toISOString().split('T')[0];
      const dayOfWeek = d.getUTCDay();

      const classes = list.filter(t => t.day_of_week === dayOfWeek);
      for (const cls of classes) {
        await dbRun(`
          INSERT INTO leave_requests (group_id, student_id, course_id, section_id, date, period_index, reason, status, request_start_date, request_end_date)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?)
        `, [groupId, studentId, cls.course_id, cls.section_id, dateString, cls.period_index, reason, startDate, endDate]);
      }
    }

    res.json({ success: true, groupId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 32. Get Student Leave requests
app.get('/api/leave/student/:studentId', authenticateJWT, async (req, res) => {
  const studentId = parseInt(req.params.studentId);
  try {
    const list = await dbAll<any>('SELECT * FROM leave_requests WHERE student_id = ? ORDER BY date DESC', [studentId]);
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 33. Get Consolidated Leave requests of Lecturer
app.get('/api/leave/lecturer/:lecturerId', authenticateJWT, requireRole(['LECTURER', 'ADMIN']), async (req, res) => {
  const lecturerId = parseInt(req.params.lecturerId);
  try {
    // Get all classes of lecturer
    const classSections = await dbAll<any>('SELECT DISTINCT section_id FROM timetable WHERE lecturer_id = ?', [lecturerId]);
    const sectionIds = classSections.map(c => c.section_id);

    if (sectionIds.length === 0) {
      return res.json([]);
    }

    const placeholders = sectionIds.map(() => '?').join(',');
    const list = await dbAll<any>(`
      SELECT lr.*, u.name as student_name, u.email as student_email, u.college_id as student_college_id, c.title as course_title
      FROM leave_requests lr
      JOIN users u ON lr.student_id = u.id
      JOIN courses c ON lr.course_id = c.id
      WHERE lr.section_id IN (${placeholders})
      ORDER BY lr.date DESC
    `, sectionIds);

    // Group by groupId
    const groups: Record<string, any> = {};
    list.forEach(item => {
      if (!groups[item.group_id]) {
        groups[item.group_id] = {
          groupId: item.group_id,
          student: { id: item.student_id, name: item.student_name, email: item.student_email, college_id: item.student_college_id },
          reason: item.reason,
          startDate: item.request_start_date || item.date,
          endDate: item.request_end_date || item.date,
          status: item.status,
          courseTitles: [],
          periodCount: 0
        };
      }
      if (!groups[item.group_id].courseTitles.includes(item.course_title)) {
        groups[item.group_id].courseTitles.push(item.course_title);
      }
      groups[item.group_id].periodCount++;
    });

    res.json(Object.values(groups));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 34. Pending leave count
app.get('/api/leave/lecturer/:lecturerId/pending-count', authenticateJWT, requireRole(['LECTURER', 'ADMIN']), async (req, res) => {
  const lecturerId = parseInt(req.params.lecturerId);
  try {
    const classSections = await dbAll<any>('SELECT DISTINCT section_id FROM timetable WHERE lecturer_id = ?', [lecturerId]);
    const sectionIds = classSections.map(c => c.section_id);
    if (sectionIds.length === 0) return res.json(0);

    const placeholders = sectionIds.map(() => '?').join(',');
    const countRow = await dbGet<{ count: number }>(`
      SELECT COUNT(DISTINCT group_id) as count FROM leave_requests
      WHERE section_id IN (${placeholders}) AND status = 'PENDING'
    `, sectionIds);

    res.json(countRow?.count || 0);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 35. Review leave request group (Accept or Reject)
app.post('/api/leave/review', authenticateJWT, requireRole(['LECTURER', 'ADMIN']), async (req, res) => {
  const { groupId, status } = req.body;
  const reviewerId = req.user!.id;

  try {
    // 1. Update status on leave requests table
    await dbRun(`
      UPDATE leave_requests
      SET status = ?, reviewed_by = ?, reviewed_at = ?
      WHERE group_id = ?
    `, [status, reviewerId, new Date().toISOString(), groupId]);

    // 2. If approved, synchronously update matching attendance records to AttendanceStatus.EXCUSED!
    if (status === 'APPROVED') {
      const matchRequests = await dbAll<any>('SELECT * FROM leave_requests WHERE group_id = ?', [groupId]);
      for (const reqItem of matchRequests) {
        const studentEnrollment = await dbGet<any>(`
          SELECT id FROM enrollments WHERE student_id = ? AND section_id = ? AND course_id = ?
        `, [reqItem.student_id, reqItem.section_id, reqItem.course_id]);

        if (studentEnrollment) {
          const oldRecord = await dbGet<any>(`
             SELECT id, status FROM attendance_records WHERE enrollment_id = ? AND date = ? AND period_index = ?
          `, [studentEnrollment.id, reqItem.date, reqItem.period_index]);

          if (oldRecord) {
            const oldStatus = oldRecord.status;
            if (oldStatus !== 'EXCUSED') {
              await dbRun(`
                UPDATE attendance_records
                SET status = 'EXCUSED', marked_by = ?, marked_at = ?, version = version + 1
                WHERE id = ?
              `, [reviewerId, new Date().toISOString(), oldRecord.id]);

              await dbRun(`
                INSERT INTO attendance_audits (record_id, old_status, new_status, changed_by, changed_at, reason)
                VALUES (?, ?, 'EXCUSED', ?, ?, ?)
              `, [oldRecord.id, oldStatus, reviewerId, new Date().toISOString(), 'Leave group authorized excuse']);
            }
          } else {
            // Write a brand new EXCUSED entry
            const inserted = await dbRun(`
              INSERT INTO attendance_records (enrollment_id, date, period_index, status, marked_by, marked_at, version)
              VALUES (?, ?, ?, 'EXCUSED', ?, ?, 1)
            `, [studentEnrollment.id, reqItem.date, reqItem.period_index, reviewerId, new Date().toISOString()]);

            await dbRun(`
              INSERT INTO attendance_audits (record_id, old_status, new_status, changed_by, changed_at, reason)
              VALUES (?, NULL, 'EXCUSED', ?, ?, ?)
            `, [inserted.lastID, reviewerId, new Date().toISOString(), 'Leave group authorized excuse']);
          }
        }
      }
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 36. Student Consolidated leave list
app.get('/api/leave/student-consolidated/:studentId', authenticateJWT, async (req, res) => {
  const studentId = parseInt(req.params.studentId);
  try {
    const list = await dbAll<any>(`
      SELECT lr.*, c.title as course_title, u.name as lecturer_name
      FROM leave_requests lr
      LEFT JOIN courses c ON lr.course_id = c.id
      LEFT JOIN timetable t ON lr.course_id = t.course_id AND lr.section_id = t.section_id AND lr.period_index = t.period_index
      LEFT JOIN users u ON t.lecturer_id = u.id
      WHERE lr.student_id = ?
      ORDER BY lr.date DESC
    `, [studentId]);

    const groups: Record<string, any> = {};
    list.forEach(item => {
      if (!groups[item.group_id]) {
        groups[item.group_id] = {
          groupId: item.group_id,
          reason: item.reason,
          startDate: item.request_start_date || item.date,
          endDate: item.request_end_date || item.date,
          details: [],
          overallStatus: item.status
        };
      }
      const existingDetail = groups[item.group_id].details.find((d: any) => d.courseTitle === (item.course_title || 'Unknown Course'));
      if (!existingDetail) {
        groups[item.group_id].details.push({
          courseTitle: item.course_title || 'Unknown Course',
          lecturerName: item.lecturer_name || 'Assigned Instructor',
          status: item.status
        });
      }
    });

    res.json(Object.values(groups));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 37. Announcements post
app.post('/api/announcements', authenticateJWT, requireRole(['LECTURER', 'ADMIN']), async (req, res) => {
  const { course_id, section_id, content } = req.body;
  const lecturerId = req.user!.id;
  try {
    const record = await dbRun(`
      INSERT INTO announcements (lecturer_id, course_id, section_id, content, created_at)
      VALUES (?, ?, ?, ?, ?)
    `, [lecturerId, course_id, section_id, content, new Date().toISOString()]);

    res.json({ id: record.lastID, lecturer_id: lecturerId, course_id, section_id, content, created_at: new Date().toISOString() });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 38. Student Announcements list
app.get('/api/announcements/student/:studentId', authenticateJWT, requireRole(['STUDENT', 'ADMIN']), async (req, res) => {
  const studentId = parseInt(req.params.studentId);
  try {
    const enrolls = await dbAll<any>('SELECT section_id FROM enrollments WHERE student_id = ?', [studentId]);
    const sectionIds = enrolls.map(e => e.section_id);

    if (sectionIds.length === 0) {
      return res.json([]);
    }

    const placeholders = sectionIds.map(() => '?').join(',');
    const list = await dbAll<any>(`
      SELECT a.*, u.name as lecturer_name, u.email as lecturer_email, u.college_id as lecturer_college_id, c.title as course_title, c.code as course_code, s.section_name
      FROM announcements a
      JOIN users u ON a.lecturer_id = u.id
      JOIN courses c ON a.course_id = c.id
      JOIN sections s ON a.section_id = s.id
      WHERE a.section_id IN (${placeholders})
      ORDER BY a.created_at DESC
    `, sectionIds);

    const formatted = list.map(item => ({
      id: item.id,
      lecturer_id: item.lecturer_id,
      course_id: item.course_id,
      section_id: item.section_id,
      content: item.content,
      created_at: item.created_at,
      lecturer: { id: item.lecturer_id, name: item.lecturer_name, email: item.lecturer_email, college_id: item.lecturer_college_id },
      course: { id: item.course_id, title: item.course_title, code: item.course_code },
      section: { id: item.section_id, course_id: item.course_id, section_name: item.section_name }
    }));

    res.json(formatted);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 38b. Lecturer Announcements list
app.get('/api/announcements/lecturer/:lecturerId', authenticateJWT, requireRole(['LECTURER', 'ADMIN']), async (req, res) => {
  const lecturerId = parseInt(req.params.lecturerId);
  try {
    const list = await dbAll<any>(`
      SELECT a.*, c.title as course_title, c.code as course_code, s.section_name
      FROM announcements a
      JOIN courses c ON a.course_id = c.id
      JOIN sections s ON a.section_id = s.id
      WHERE a.lecturer_id = ?
      ORDER BY a.created_at DESC
    `, [lecturerId]);

    const formatted = list.map(item => ({
      id: item.id,
      lecturer_id: item.lecturer_id,
      course_id: item.course_id,
      section_id: item.section_id,
      content: item.content,
      created_at: item.created_at,
      course: { id: item.course_id, title: item.course_title, code: item.course_code },
      section: { id: item.section_id, course_id: item.course_id, section_name: item.section_name }
    }));

    res.json(formatted);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 39. CSV bulkImportUsers
app.post('/api/import/users', authenticateJWT, requireRole(['ADMIN']), async (req, res) => {
  const { csvData } = req.body;
  if (!csvData) {
    return res.status(400).json({ error: 'Missing CSV body content' });
  }

  const lines = csvData.trim().split('\n').slice(1); // skip header
  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  try {
    await dbRun('BEGIN TRANSACTION;');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const [name, email, college_id, role] = line.split(',').map((s: string) => s.trim());
      if (!name || !email || !college_id || !role) {
        failed++;
        errors.push(`Row ${i + 2}: Missing data values.`);
        continue;
      }

      if (!['ADMIN', 'LECTURER', 'STUDENT'].includes(role.toUpperCase())) {
        failed++;
        errors.push(`Row ${i + 2}: Invalid target role "${role}".`);
        continue;
      }

      const checkDup = await dbGet<any>('SELECT 1 FROM users WHERE LOWER(college_id) = LOWER(?) OR LOWER(email) = LOWER(?)', [college_id, email]);
      if (checkDup) {
        failed++;
        errors.push(`Row ${i + 2}: College ID "${college_id}" or Email "${email}" already registered.`);
        continue;
      }

      // Hash default secure password
      const defaultPassword = `${college_id.toLowerCase()}pass`;
      const pHash = bcrypt.hashSync(defaultPassword, 10);

      await dbRun('INSERT INTO users (name, email, college_id, role, password_hash) VALUES (?, ?, ?, ?, ?)', [
        name, email, college_id, role.toUpperCase(), pHash
      ]);

      success++;
    }
    await dbRun('COMMIT;');
    res.json({ success, failed, errors });
  } catch (err: any) {
    await dbRun('ROLLBACK;');
    res.status(500).json({ error: 'Transaction rollback: ' + err.message });
  }
});

// 40. CSV bulkImportEnrollments
app.post('/api/import/enrollments', authenticateJWT, requireRole(['ADMIN']), async (req, res) => {
  const { csvData } = req.body;
  if (!csvData) {
    return res.status(400).json({ error: 'Missing CSV body content' });
  }

  const lines = csvData.trim().split('\n').slice(1); // skip header
  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  try {
    await dbRun('BEGIN TRANSACTION;');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const [student_college_id, course_code, section_name] = line.split(',').map((s: string) => s.trim());
      if (!student_college_id || !course_code || !section_name) {
        failed++;
        errors.push(`Row ${i + 2}: Missing student enrollment fields.`);
        continue;
      }

      const student = await dbGet<any>('SELECT id FROM users WHERE LOWER(college_id) = LOWER(?)', [student_college_id]);
      if (!student) {
        failed++;
        errors.push(`Row ${i + 2}: Student with ID "${student_college_id}" not found.`);
        continue;
      }

      const course = await dbGet<any>('SELECT id FROM courses WHERE LOWER(code) = LOWER(?)', [course_code]);
      if (!course) {
        failed++;
        errors.push(`Row ${i + 2}: Course matching code "${course_code}" not found.`);
        continue;
      }

      const section = await dbGet<any>('SELECT id FROM sections WHERE course_id = ? AND LOWER(section_name) = LOWER(?)', [course.id, section_name]);
      if (!section) {
        failed++;
        errors.push(`Row ${i + 2}: Section "${section_name}" for course code "${course_code}" not found.`);
        continue;
      }

      // Check duplicate enrollment
      const checkDup = await dbGet<any>('SELECT 1 FROM enrollments WHERE student_id = ? AND section_id = ? AND course_id = ?', [
        student.id, section.id, course.id
      ]);
      if (checkDup) {
        failed++;
        errors.push(`Row ${i + 2}: Student already enrolled.`);
        continue;
      }

      await dbRun('INSERT INTO enrollments (student_id, section_id, course_id) VALUES (?, ?, ?)', [
        student.id, section.id, course.id
      ]);
      success++;
    }
    await dbRun('COMMIT;');
    res.json({ success, failed, errors });
  } catch (err: any) {
    await dbRun('ROLLBACK;');
    res.status(500).json({ error: 'Transaction enrollment rollback: ' + err.message });
  }
});

// 41. Generate Session PIN for Class Period
app.post('/api/session/pin', authenticateJWT, requireRole(['LECTURER', 'ADMIN']), async (req, res) => {
  const { timetableId } = req.body;
  const pin = Math.floor(1000 + Math.random() * 9000).toString();
  // PIN expires in 120 seconds
  const expiresAt = Date.now() + 120 * 1000;

  try {
    await dbRun('INSERT OR REPLACE INTO active_pins (timetable_id, pin, expires_at) VALUES (?, ?, ?)', [
      timetableId, pin, expiresAt
    ]);
    res.json({ pin });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 42. Get Active PIN for Timetable Slot
app.get('/api/session/pin/:timetableId', authenticateJWT, async (req, res) => {
  const timetableId = parseInt(req.params.timetableId);
  try {
    const pinRow = await dbGet<any>('SELECT pin, expires_at FROM active_pins WHERE timetable_id = ?', [timetableId]);
    if (pinRow && pinRow.expires_at > Date.now()) {
      return res.json({ pin: pinRow.pin });
    }
    res.json({ pin: null });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 43. Secure Student Check-in using Single-Use verification
app.post('/api/session/checkin', authenticateJWT, requireRole(['STUDENT', 'ADMIN']), async (req, res) => {
  const { studentId, pin } = req.body;
  const actorId = req.user!.id; // Authenticated user must equal studentId

  if (req.user!.role === 'STUDENT' && req.user!.id !== studentId) {
    return res.status(403).json({ error: 'Forbidden: Cannot check-in for another student.' });
  }

  try {
    const activePin = await dbGet<any>('SELECT * FROM active_pins WHERE pin = ?', [pin.trim()]);
    if (!activePin || activePin.expires_at < Date.now()) {
      return res.status(200).json({ success: false, message: 'Invalid or expired check-in PIN.' });
    }

    const timetableEntry = await dbGet<any>(`
      SELECT t.*, c.title as course_title, s.section_name
      FROM timetable t
      JOIN courses c ON t.course_id = c.id
      JOIN sections s ON t.section_id = s.id
      WHERE t.id = ?
    `, [activePin.timetable_id]);

    if (!timetableEntry) {
      return res.status(200).json({ success: false, message: 'Associated class period not found.' });
    }

    const studentEnrollment = await dbGet<any>(`
      SELECT id FROM enrollments WHERE student_id = ? AND section_id = ?
    `, [studentId, timetableEntry.section_id]);

    if (!studentEnrollment) {
      return res.status(200).json({ success: false, message: `You are not enrolled in Sec ${timetableEntry.section_name} of ${timetableEntry.course_title}.` });
    }

    const dateStr = new Date().toISOString().split('T')[0];
    const existingObj = await dbGet<any>(`
      SELECT * FROM attendance_records WHERE enrollment_id = ? AND date = ? AND period_index = ?
    `, [studentEnrollment.id, dateStr, timetableEntry.period_index]);

    if (existingObj) {
      if (existingObj.status === 'PRESENT') {
        return res.json({ success: true, message: 'You are already checked in!', courseTitle: timetableEntry.course_title });
      }

      await dbRun(`
        UPDATE attendance_records
        SET status = 'PRESENT', marked_by = ?, marked_at = ?, version = version + 1
        WHERE id = ?
      `, [timetableEntry.lecturer_id, new Date().toISOString(), existingObj.id]);

      await dbRun(`
        INSERT INTO attendance_audits (record_id, old_status, new_status, changed_by, changed_at, reason)
        VALUES (?, ?, 'PRESENT', ?, ?, 'Self check-in via active period PIN')
      `, [existingObj.id, existingObj.status, studentId, new Date().toISOString()]);
    } else {
      const inserted = await dbRun(`
        INSERT INTO attendance_records (enrollment_id, date, period_index, status, marked_by, marked_at, version)
        VALUES (?, ?, ?, 'PRESENT', ?, ?, 1)
      `, [studentEnrollment.id, dateStr, timetableEntry.period_index, timetableEntry.lecturer_id, new Date().toISOString()]);

      await dbRun(`
        INSERT INTO attendance_audits (record_id, old_status, new_status, changed_by, changed_at, reason)
        VALUES (?, NULL, 'PRESENT', ?, ?, 'Self check-in via active period PIN')
      `, [inserted.lastID, studentId, new Date().toISOString()]);
    }

    res.json({
      success: true,
      message: `Successfully checked in for ${timetableEntry.course_title}!`,
      courseTitle: timetableEntry.course_title
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


// --- INTEGRATE VITE DEV SERVER OR STANDALONE STATIC SERVINGS ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express SQL-Secure Fullstack Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
