const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const { dbRun, dbAll, dbGet } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Serve static frontend files from 'public' folder
app.use(express.static(path.join(__dirname, '../public')));

// ==========================================
// 1. DASHBOARD ANALYTICS ENDPOINTS
// ==========================================

// Get overall stats for summary cards
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    // Total Students
    const totalStudents = await dbGet('SELECT COUNT(*) as count FROM students');
    
    // Class Average
    const classAvg = await dbGet('SELECT AVG(score) as avgScore FROM marks');
    
    // Attendance Rate (Overall)
    const overallAttendance = await dbGet(`
      SELECT CAST(SUM(CASE WHEN status IN ('Present', 'Late') THEN 1 ELSE 0 END) AS REAL) / COUNT(*) * 100 as rate 
      FROM attendance
    `);

    // Top Performing Student
    const topStudent = await dbGet(`
      SELECT s.name, AVG(m.score) as avg_score
      FROM students s
      JOIN marks m ON s.id = m.student_id
      GROUP BY s.id
      ORDER BY avg_score DESC
      LIMIT 1
    `);

    // Students at Risk (Attendance < 75% or Average Grade < 50%)
    const atRiskStudentsQuery = await dbAll(`
      SELECT s.id, s.name, s.roll_number,
             ROUND(avg_m.avg_score, 1) as avg_score,
             ROUND(att.rate, 1) as attendance_rate
      FROM students s
      LEFT JOIN (
        SELECT student_id, AVG(score) as avg_score FROM marks GROUP BY student_id
      ) avg_m ON s.id = avg_m.student_id
      LEFT JOIN (
        SELECT student_id, CAST(SUM(CASE WHEN status IN ('Present', 'Late') THEN 1 ELSE 0 END) AS REAL) / COUNT(*) * 100 as rate FROM attendance GROUP BY student_id
      ) att ON s.id = att.student_id
      WHERE avg_score < 50 OR attendance_rate < 75
    `);

    res.json({
      totalStudents: totalStudents.count || 0,
      classAverage: classAvg.avgScore ? Math.round(classAvg.avgScore * 10) / 10 : 0,
      attendanceRate: overallAttendance.rate ? Math.round(overallAttendance.rate * 10) / 10 : 0,
      topStudent: topStudent ? { name: topStudent.name, score: Math.round(topStudent.avg_score * 10) / 10 } : null,
      riskCount: atRiskStudentsQuery.length,
      riskList: atRiskStudentsQuery
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve dashboard stats.' });
  }
});

// Get data for charts (subject averages, attendance trends, grade distribution)
app.get('/api/dashboard/charts', async (req, res) => {
  try {
    // 1. Subject Averages
    const subjectAverages = await dbAll(`
      SELECT subject, ROUND(AVG(score), 1) as average 
      FROM marks 
      GROUP BY subject
    `);

    // 2. Attendance Trends (grouped by date)
    const attendanceTrends = await dbAll(`
      SELECT date, 
             ROUND(CAST(SUM(CASE WHEN status IN ('Present', 'Late') THEN 1 ELSE 0 END) AS REAL) / COUNT(*) * 100, 1) as rate 
      FROM attendance 
      GROUP BY date 
      ORDER BY date ASC 
      LIMIT 15
    `);

    // 3. Grade Distribution
    // Calculate final average for each student and bucket them
    const studentGrades = await dbAll(`
      SELECT AVG(score) as student_avg 
      FROM marks 
      GROUP BY student_id
    `);

    const grades = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    studentGrades.forEach(row => {
      const avg = row.student_avg;
      if (avg >= 90) grades.A++;
      else if (avg >= 80) grades.B++;
      else if (avg >= 70) grades.C++;
      else if (avg >= 50) grades.D++;
      else grades.F++;
    });

    res.json({
      subjectAverages,
      attendanceTrends,
      gradeDistribution: [
        { grade: 'A (90%+)', count: grades.A },
        { grade: 'B (80-89%)', count: grades.B },
        { grade: 'C (70-79%)', count: grades.C },
        { grade: 'D (50-69%)', count: grades.D },
        { grade: 'F (<50%)', count: grades.F }
      ]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve chart analytics.' });
  }
});

// ==========================================
// 2. STUDENTS ENDPOINTS
// ==========================================

// Get all students with aggregated scores and attendance
app.get('/api/students', async (req, res) => {
  try {
    const students = await dbAll(`
      SELECT s.*, 
             ROUND(avg_m.avg_score, 1) as avg_score,
             ROUND(att.rate, 1) as attendance_rate
      FROM students s
      LEFT JOIN (
        SELECT student_id, AVG(score) as avg_score FROM marks GROUP BY student_id
      ) avg_m ON s.id = avg_m.student_id
      LEFT JOIN (
        SELECT student_id, CAST(SUM(CASE WHEN status IN ('Present', 'Late') THEN 1 ELSE 0 END) AS REAL) / COUNT(*) * 100 as rate FROM attendance GROUP BY student_id
      ) att ON s.id = att.student_id
      ORDER BY s.roll_number ASC
    `);
    res.json(students);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch students.' });
  }
});

// Get a single student's complete academic detail (for profile cards)
app.get('/api/students/:id', async (req, res) => {
  try {
    const studentId = req.params.id;
    const student = await dbGet('SELECT * FROM students WHERE id = ?', [studentId]);
    if (!student) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    const marks = await dbAll('SELECT subject, score, max_score, exam_type FROM marks WHERE student_id = ? ORDER BY subject, exam_type', [studentId]);
    const attendance = await dbAll('SELECT date, status FROM attendance WHERE student_id = ? ORDER BY date DESC', [studentId]);

    // Calculate details
    const avgScore = marks.length ? marks.reduce((sum, m) => sum + m.score, 0) / marks.length : 0;
    const attended = attendance.filter(a => a.status === 'Present' || a.status === 'Late').length;
    const attendanceRate = attendance.length ? (attended / attendance.length) * 100 : 0;

    res.json({
      ...student,
      avg_score: Math.round(avgScore * 10) / 10,
      attendance_rate: Math.round(attendanceRate * 10) / 10,
      marks,
      attendance
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch student profile.' });
  }
});

// Add a new student
app.post('/api/students', async (req, res) => {
  const { name, roll_number, email, class_name } = req.body;
  if (!name || !roll_number || !email || !class_name) {
    return res.status(400).json({ error: 'All fields (name, roll_number, email, class_name) are required.' });
  }

  try {
    const result = await dbRun(
      'INSERT INTO students (roll_number, name, email, class_name) VALUES (?, ?, ?, ?)',
      [roll_number, name, email, class_name]
    );
    res.status(201).json({ id: result.id, roll_number, name, email, class_name });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      res.status(409).json({ error: 'Roll number already exists.' });
    } else {
      console.error(err);
      res.status(500).json({ error: 'Failed to add student.' });
    }
  }
});

// Update a student
app.put('/api/students/:id', async (req, res) => {
  const { name, roll_number, email, class_name } = req.body;
  const studentId = req.params.id;

  if (!name || !roll_number || !email || !class_name) {
    return res.status(400).json({ error: 'All fields (name, roll_number, email, class_name) are required.' });
  }

  try {
    await dbRun(
      'UPDATE students SET name = ?, roll_number = ?, email = ?, class_name = ? WHERE id = ?',
      [name, roll_number, email, class_name, studentId]
    );
    res.json({ id: studentId, roll_number, name, email, class_name });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      res.status(409).json({ error: 'Roll number already exists.' });
    } else {
      console.error(err);
      res.status(500).json({ error: 'Failed to update student.' });
    }
  }
});

// Delete a student (foreign keys cascade deletes scores and attendance)
app.delete('/api/students/:id', async (req, res) => {
  try {
    const studentId = req.params.id;
    const result = await dbRun('DELETE FROM students WHERE id = ?', [studentId]);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Student not found.' });
    }
    res.json({ message: 'Student and related records deleted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete student.' });
  }
});

// ==========================================
// 3. MARKS ENDPOINTS
// ==========================================

// Get all marks for display or management
app.get('/api/marks', async (req, res) => {
  try {
    const marks = await dbAll(`
      SELECT m.*, s.name, s.roll_number 
      FROM marks m 
      JOIN students s ON m.student_id = s.id 
      ORDER BY s.roll_number ASC, m.subject ASC
    `);
    res.json(marks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch marks.' });
  }
});

// Record a new mark (or update if duplicate exam type & subject for a student)
app.post('/api/marks', async (req, res) => {
  const { student_id, subject, score, max_score, exam_type } = req.body;
  if (!student_id || !subject || score === undefined || !max_score || !exam_type) {
    return res.status(400).json({ error: 'All fields (student_id, subject, score, max_score, exam_type) are required.' });
  }

  try {
    // Check if mark already exists for the student, subject, and exam type
    const existing = await dbGet(
      'SELECT id FROM marks WHERE student_id = ? AND subject = ? AND exam_type = ?',
      [student_id, subject, exam_type]
    );

    if (existing) {
      // Update existing mark
      await dbRun(
        'UPDATE marks SET score = ?, max_score = ? WHERE id = ?',
        [score, max_score, existing.id]
      );
      res.json({ message: 'Student marks updated successfully.', id: existing.id });
    } else {
      // Create new mark record
      const result = await dbRun(
        'INSERT INTO marks (student_id, subject, score, max_score, exam_type) VALUES (?, ?, ?, ?, ?)',
        [student_id, subject, score, max_score, exam_type]
      );
      res.status(201).json({ message: 'Marks recorded successfully.', id: result.id });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to record marks.' });
  }
});

// ==========================================
// 4. ATTENDANCE ENDPOINTS
// ==========================================

// Get attendance sheets by date
app.get('/api/attendance', async (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0];

  try {
    // Select all students and join their attendance status for that date
    const list = await dbAll(`
      SELECT s.id as student_id, s.name, s.roll_number, s.class_name, a.status, a.id as attendance_id
      FROM students s
      LEFT JOIN attendance a ON s.id = a.student_id AND a.date = ?
      ORDER BY s.roll_number ASC
    `, [date]);

    res.json({ date, list });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch attendance.' });
  }
});

// Save bulk attendance sheet for a date
app.post('/api/attendance', async (req, res) => {
  const { date, records } = req.body; // records: [{ student_id, status }]
  if (!date || !records || !Array.isArray(records)) {
    return res.status(400).json({ error: 'Invalid parameters. Need "date" and "records" array.' });
  }

  try {
    for (const record of records) {
      // Insert or update attendance status using SQL INSERT OR REPLACE statement
      await dbRun(`
        INSERT OR REPLACE INTO attendance (student_id, date, status) 
        VALUES (?, ?, ?)
      `, [record.student_id, date, record.status]);
    }
    res.json({ message: `Attendance updated for date ${date}.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update attendance records.' });
  }
});

// ==========================================
// 5. COMPREHENSIVE REPORTS ENDPOINT
// ==========================================
app.get('/api/reports', async (req, res) => {
  try {
    // Get all students
    const students = await dbAll('SELECT id, name, roll_number, email, class_name FROM students ORDER BY roll_number ASC');
    
    const reports = [];
    for (const s of students) {
      // Get all marks for this student
      const marks = await dbAll('SELECT subject, score, max_score, exam_type FROM marks WHERE student_id = ?', [s.id]);
      // Get overall attendance details
      const att = await dbAll('SELECT status FROM attendance WHERE student_id = ?', [s.id]);
      
      const totalMarks = marks.length;
      const avgScore = totalMarks ? marks.reduce((sum, m) => sum + m.score, 0) / totalMarks : 0;
      
      const totalAttendance = att.length;
      const attended = att.filter(a => a.status === 'Present' || a.status === 'Late').length;
      const attendanceRate = totalAttendance ? (attended / totalAttendance) * 100 : 0;

      reports.push({
        id: s.id,
        name: s.name,
        roll_number: s.roll_number,
        email: s.email,
        class_name: s.class_name,
        avg_score: Math.round(avgScore * 10) / 10,
        attendance_rate: Math.round(attendanceRate * 10) / 10,
        marks_count: totalMarks,
        attendance_count: totalAttendance,
        // Subject details maps for quick reference
        subjects: marks.reduce((acc, m) => {
          if (!acc[m.subject]) acc[m.subject] = {};
          acc[m.subject][m.exam_type] = m.score;
          return acc;
        }, {})
      });
    }

    // Sort by average score to calculate rank dynamically
    reports.sort((a, b) => b.avg_score - a.avg_score);
    reports.forEach((student, index) => {
      student.rank = student.avg_score > 0 ? index + 1 : '-';
    });

    // Sort back to alphabetical / Roll number
    reports.sort((a, b) => a.roll_number.localeCompare(b.roll_number));

    res.json(reports);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate consolidated reports.' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Student Performance Tracker server is running on http://localhost:${PORT}`);
});
