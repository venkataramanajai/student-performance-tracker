const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, '../performance.db');

// Connect to SQLite database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err.message);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
    initializeDatabase();
  }
});

// Helper functions to use async/await with sqlite3
const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

// Initialize database schema and insert seed data if empty
function initializeDatabase() {
  db.serialize(async () => {
    // Enable foreign keys
    await dbRun('PRAGMA foreign_keys = ON;');

    // 1. Create Students table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        roll_number TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        class_name TEXT NOT NULL
      );
    `);

    // 2. Create Marks table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS marks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        subject TEXT NOT NULL,
        score REAL NOT NULL,
        max_score REAL NOT NULL,
        exam_type TEXT NOT NULL,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
      );
    `);

    // 3. Create Attendance table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('Present', 'Absent', 'Late')),
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        UNIQUE(student_id, date)
      );
    `);

    console.log('Database tables verified/created successfully.');

    // Seed mock data if database is empty
    const studentCount = await dbGet('SELECT COUNT(*) as count FROM students');
    if (studentCount.count === 0) {
      console.log('Seeding mock data for Student Performance Tracker...');
      await seedData();
    }
  });
}

// Seed clean, deterministic data — no random noise
async function seedData() {
  try {
    const studentsData = [
      { roll: '25M11MC001', name: 'Aarav Sharma',  email: 'aarav.sharma@mca.edu',  class_name: 'MCA Sem-I'  },
      { roll: '25M11MC002', name: 'Diya Patel',    email: 'diya.patel@mca.edu',    class_name: 'MCA Sem-I'  },
      { roll: '25M11MC003', name: 'Rohan Das',     email: 'rohan.das@mca.edu',     class_name: 'MCA Sem-II' },
      { roll: '25M11MC004', name: 'Ananya Iyer',   email: 'ananya.iyer@mca.edu',   class_name: 'MCA Sem-I'  },
      { roll: '25M11MC005', name: 'Kabir Singh',   email: 'kabir.singh@mca.edu',   class_name: 'MCA Sem-II' },
      { roll: '25M11MC006', name: 'Meera Sen',     email: 'meera.sen@mca.edu',     class_name: 'MCA Sem-II' }
    ];

    const insertedStudents = [];
    for (const s of studentsData) {
      const result = await dbRun(
        'INSERT INTO students (roll_number, name, email, class_name) VALUES (?, ?, ?, ?)',
        [s.roll, s.name, s.email, s.class_name]
      );
      insertedStudents.push({ id: result.id, ...s });
    }

    console.log(`Seeded ${insertedStudents.length} students.`);

    // ── CLEAN MARKS DATA ─────────────────────────────────────────────────────
    // Fixed, realistic scores for each student × subject × exam type.
    // No Math.random() — every value is intentional and meaningful.
    //
    // Roll        | Student       | Profile
    // ------------|---------------|--------------------------------------------------
    // 25M11MC001  | Aarav Sharma  | Strong in DSA & Java, average elsewhere
    // 25M11MC002  | Diya Patel    | Top overall performer
    // 25M11MC003  | Rohan Das     | Struggling across all subjects (at-risk)
    // 25M11MC004  | Ananya Iyer   | High performer, consistent
    // 25M11MC005  | Kabir Singh   | Average, steady performer
    // 25M11MC006  | Meera Sen     | Strong in DBMS & SE, average in others
    // -------------------------------------------------------------------------

    const marksData = [
      //  25M11MC001 — Aarav Sharma
      //  Subject                  Mid  Final
      { roll:'25M11MC001', subject:'Data Structures',     exam:'Mid-term', score:92 },
      { roll:'25M11MC001', subject:'Data Structures',     exam:'Final',    score:95 },
      { roll:'25M11MC001', subject:'Database Systems',    exam:'Mid-term', score:74 },
      { roll:'25M11MC001', subject:'Database Systems',    exam:'Final',    score:78 },
      { roll:'25M11MC001', subject:'Java Programming',    exam:'Mid-term', score:91 },
      { roll:'25M11MC001', subject:'Java Programming',    exam:'Final',    score:93 },
      { roll:'25M11MC001', subject:'Web Technologies',    exam:'Mid-term', score:76 },
      { roll:'25M11MC001', subject:'Web Technologies',    exam:'Final',    score:80 },
      { roll:'25M11MC001', subject:'Software Engineering',exam:'Mid-term', score:68 },
      { roll:'25M11MC001', subject:'Software Engineering',exam:'Final',    score:72 },

      //  25M11MC002 — Diya Patel  (top performer)
      { roll:'25M11MC002', subject:'Data Structures',     exam:'Mid-term', score:94 },
      { roll:'25M11MC002', subject:'Data Structures',     exam:'Final',    score:97 },
      { roll:'25M11MC002', subject:'Database Systems',    exam:'Mid-term', score:91 },
      { roll:'25M11MC002', subject:'Database Systems',    exam:'Final',    score:95 },
      { roll:'25M11MC002', subject:'Java Programming',    exam:'Mid-term', score:88 },
      { roll:'25M11MC002', subject:'Java Programming',    exam:'Final',    score:92 },
      { roll:'25M11MC002', subject:'Web Technologies',    exam:'Mid-term', score:90 },
      { roll:'25M11MC002', subject:'Web Technologies',    exam:'Final',    score:93 },
      { roll:'25M11MC002', subject:'Software Engineering',exam:'Mid-term', score:87 },
      { roll:'25M11MC002', subject:'Software Engineering',exam:'Final',    score:91 },

      //  25M11MC003 — Rohan Das  (at-risk / struggling)
      { roll:'25M11MC003', subject:'Data Structures',     exam:'Mid-term', score:38 },
      { roll:'25M11MC003', subject:'Data Structures',     exam:'Final',    score:44 },
      { roll:'25M11MC003', subject:'Database Systems',    exam:'Mid-term', score:42 },
      { roll:'25M11MC003', subject:'Database Systems',    exam:'Final',    score:48 },
      { roll:'25M11MC003', subject:'Java Programming',    exam:'Mid-term', score:35 },
      { roll:'25M11MC003', subject:'Java Programming',    exam:'Final',    score:40 },
      { roll:'25M11MC003', subject:'Web Technologies',    exam:'Mid-term', score:50 },
      { roll:'25M11MC003', subject:'Web Technologies',    exam:'Final',    score:53 },
      { roll:'25M11MC003', subject:'Software Engineering',exam:'Mid-term', score:45 },
      { roll:'25M11MC003', subject:'Software Engineering',exam:'Final',    score:49 },

      //  25M11MC004 — Ananya Iyer  (consistent high performer)
      { roll:'25M11MC004', subject:'Data Structures',     exam:'Mid-term', score:88 },
      { roll:'25M11MC004', subject:'Data Structures',     exam:'Final',    score:92 },
      { roll:'25M11MC004', subject:'Database Systems',    exam:'Mid-term', score:85 },
      { roll:'25M11MC004', subject:'Database Systems',    exam:'Final',    score:89 },
      { roll:'25M11MC004', subject:'Java Programming',    exam:'Mid-term', score:90 },
      { roll:'25M11MC004', subject:'Java Programming',    exam:'Final',    score:94 },
      { roll:'25M11MC004', subject:'Web Technologies',    exam:'Mid-term', score:86 },
      { roll:'25M11MC004', subject:'Web Technologies',    exam:'Final',    score:88 },
      { roll:'25M11MC004', subject:'Software Engineering',exam:'Mid-term', score:83 },
      { roll:'25M11MC004', subject:'Software Engineering',exam:'Final',    score:87 },

      //  25M11MC005 — Kabir Singh  (average / steady)
      { roll:'25M11MC005', subject:'Data Structures',     exam:'Mid-term', score:66 },
      { roll:'25M11MC005', subject:'Data Structures',     exam:'Final',    score:70 },
      { roll:'25M11MC005', subject:'Database Systems',    exam:'Mid-term', score:72 },
      { roll:'25M11MC005', subject:'Database Systems',    exam:'Final',    score:75 },
      { roll:'25M11MC005', subject:'Java Programming',    exam:'Mid-term', score:68 },
      { roll:'25M11MC005', subject:'Java Programming',    exam:'Final',    score:73 },
      { roll:'25M11MC005', subject:'Web Technologies',    exam:'Mid-term', score:74 },
      { roll:'25M11MC005', subject:'Web Technologies',    exam:'Final',    score:77 },
      { roll:'25M11MC005', subject:'Software Engineering',exam:'Mid-term', score:70 },
      { roll:'25M11MC005', subject:'Software Engineering',exam:'Final',    score:74 },

      //  25M11MC006 — Meera Sen  (strong in DBMS & SE)
      { roll:'25M11MC006', subject:'Data Structures',     exam:'Mid-term', score:62 },
      { roll:'25M11MC006', subject:'Data Structures',     exam:'Final',    score:67 },
      { roll:'25M11MC006', subject:'Database Systems',    exam:'Mid-term', score:88 },
      { roll:'25M11MC006', subject:'Database Systems',    exam:'Final',    score:91 },
      { roll:'25M11MC006', subject:'Java Programming',    exam:'Mid-term', score:60 },
      { roll:'25M11MC006', subject:'Java Programming',    exam:'Final',    score:65 },
      { roll:'25M11MC006', subject:'Web Technologies',    exam:'Mid-term', score:63 },
      { roll:'25M11MC006', subject:'Web Technologies',    exam:'Final',    score:68 },
      { roll:'25M11MC006', subject:'Software Engineering',exam:'Mid-term', score:85 },
      { roll:'25M11MC006', subject:'Software Engineering',exam:'Final',    score:89 }
    ];

    // Build a roll → id map for clean insertion
    const rollToId = {};
    insertedStudents.forEach(s => { rollToId[s.roll] = s.id; });

    for (const m of marksData) {
      await dbRun(
        'INSERT INTO marks (student_id, subject, score, max_score, exam_type) VALUES (?, ?, ?, ?, ?)',
        [rollToId[m.roll], m.subject, m.score, 100, m.exam]
      );
    }
    console.log(`Seeded ${marksData.length} marks records (clean, fixed data).`);

    // ── CLEAN ATTENDANCE DATA ─────────────────────────────────────────────────
    // Deterministic attendance for the last 15 weekdays.
    // Pattern per student is fixed — no random generation.
    //
    // P = Present | L = Late | A = Absent
    // Days:  D1   D2   D3   D4   D5   D6   D7   D8   D9  D10  D11  D12  D13  D14  D15
    const attendancePattern = {
      '25M11MC001': ['P','P','P','P','P','P','P','P','P','P','P','P','P','P','P'], // 100% present
      '25M11MC002': ['P','P','P','P','P','P','P','P','P','P','P','P','P','L','P'], // 1 Late
      '25M11MC003': ['P','A','P','A','L','P','A','P','L','A','P','P','A','P','A'], // 5 Absent, 2 Late (at-risk)
      '25M11MC004': ['P','P','P','P','P','P','P','P','P','P','P','L','P','P','P'], // 1 Late
      '25M11MC005': ['P','P','P','L','P','A','P','P','P','L','P','P','P','A','P'], // 2 Absent, 2 Late
      '25M11MC006': ['P','P','P','P','P','P','P','P','P','P','P','P','L','P','P'], // 1 Late
    };

    const statusMap = { P: 'Present', L: 'Late', A: 'Absent' };

    // Collect last 15 weekdays (most recent first, then reverse for chronological order)
    const weekdays = [];
    const cursor = new Date();
    while (weekdays.length < 15) {
      const dow = cursor.getDay();
      if (dow !== 0 && dow !== 6) {
        const yyyy = cursor.getFullYear();
        const mm   = String(cursor.getMonth() + 1).padStart(2, '0');
        const dd   = String(cursor.getDate()).padStart(2, '0');
        weekdays.push(`${yyyy}-${mm}-${dd}`);
      }
      cursor.setDate(cursor.getDate() - 1);
    }
    weekdays.reverse(); // oldest → newest (D1 → D15)

    for (const student of insertedStudents) {
      const pattern = attendancePattern[student.roll] || Array(15).fill('P');
      for (let i = 0; i < weekdays.length; i++) {
        const status = statusMap[pattern[i]] || 'Present';
        await dbRun(
          'INSERT INTO attendance (student_id, date, status) VALUES (?, ?, ?)',
          [student.id, weekdays[i], status]
        );
      }
    }
    console.log(`Seeded ${insertedStudents.length * 15} attendance records (clean, fixed data).`);
    console.log('Seed process completed successfully.');
  } catch (error) {
    console.error('Error seeding data:', error);
  }
}


module.exports = {
  db,
  dbRun,
  dbAll,
  dbGet
};
