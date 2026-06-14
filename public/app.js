/**
 * EduPulse - Student Performance Tracker
 * Client-Side JavaScript Logic
 */

// ==========================================
// LANDING SCREEN → APP LAUNCH TRANSITION
// ==========================================

/**
 * Called when user clicks "Get Started" on the landing screen.
 * Animates the splash screen out and reveals the main dashboard.
 */
function launchApp() {
  const landing = document.getElementById('landing-screen');
  const app     = document.getElementById('app-container');
  const btn     = document.getElementById('btn-start');

  // Button press feedback
  btn.classList.add('launching');
  btn.querySelector('.btn-start-text').innerHTML =
    '<i class="fa-solid fa-circle-notch fa-spin"></i> Loading...';

  // After brief delay, animate the screen out
  setTimeout(() => {
    landing.classList.add('landing-exit');

    setTimeout(() => {
      landing.style.display = 'none';
      app.style.display     = 'flex';

      // Trigger the app fade-in animation
      requestAnimationFrame(() => {
        app.classList.add('app-enter');
      });
    }, 600);
  }, 400);
}

document.addEventListener('DOMContentLoaded', () => {

  // Global Application State
  const state = {
    activeTab: 'dashboard',
    students: [],
    reports: [],
    charts: {}, // Store Chart.js instances to destroy them before rendering new ones
    selectedProfileTab: 'prof-grades'
  };

  // API base URL (empty for relative paths since frontend is served by backend)
  const API_BASE = '';

  // DOM Elements - Navigation
  const navItems = document.querySelectorAll('.nav-item');
  const tabPanes = document.querySelectorAll('.tab-pane');
  const pageTitle = document.getElementById('page-title');
  const pageSubtitle = document.getElementById('page-subtitle');
  const currentTimeEl = document.getElementById('current-time');
  const btnRefresh = document.getElementById('btn-refresh');

  // DOM Elements - Modals
  const studentModal = document.getElementById('student-modal');
  const studentModalTitle = document.getElementById('student-modal-title');
  const studentForm = document.getElementById('student-form');
  const btnQuickAdd = document.getElementById('btn-quick-add');
  const btnAddStudent = document.getElementById('btn-add-student');
  const btnCancelStudent = document.getElementById('btn-cancel-student');
  const closeStudentModal = document.getElementById('close-student-modal');

  const profileModal = document.getElementById('profile-modal');
  const closeProfileModal = document.getElementById('close-profile-modal');
  const btnCloseProfile = document.getElementById('btn-close-profile');
  const profileTabBtns = document.querySelectorAll('.profile-tab-btn');
  const profileTabContents = document.querySelectorAll('.profile-tab-content');

  // ==========================================
  // HELPER FUNCTIONS & TOAST SYSTEM
  // ==========================================

  // Update real-time clock in header
  function updateClock() {
    const now = new Date();
    currentTimeEl.innerHTML = `<i class="fa-regular fa-clock"></i> ${now.toLocaleString()}`;
  }
  setInterval(updateClock, 1000);
  updateClock();

  // Toast System
  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'fa-circle-info';
    if (type === 'success') icon = 'fa-circle-check';
    if (type === 'warning') icon = 'fa-triangle-exclamation';
    if (type === 'danger') icon = 'fa-circle-xmark';

    toast.innerHTML = `
      <i class="fa-solid ${icon} toast-icon"></i>
      <div class="toast-body">${message}</div>
    `;

    container.appendChild(toast);
    
    // Animate in
    setTimeout(() => toast.classList.add('active'), 50);

    // Remove toast after 4s
    setTimeout(() => {
      toast.classList.remove('active');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // API Call Wrapper
  async function apiCall(endpoint, method = 'GET', data = null) {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    if (data) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, options);
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || `HTTP error! Status: ${response.status}`);
      }
      return result;
    } catch (err) {
      showToast(err.message, 'danger');
      throw err;
    }
  }

  // ==========================================
  // ROUTING & TAB NAVIGATION
  // ==========================================
  
  const tabMetadata = {
    dashboard: { title: 'Dashboard', subtitle: 'Track academic metrics and student attendance trends' },
    students: { title: 'Students Directory', subtitle: 'Manage enrolled student profiles and view aggregates' },
    marks: { title: 'Grades Entry', subtitle: 'Record and update subject marks for mid-term and final exams' },
    attendance: { title: 'Daily Attendance', subtitle: 'Mark and review daily present/absent logs' },
    reports: { title: 'Academic Reports', subtitle: 'Analyze student ranks, print report cards, or export reports' }
  };

  function switchTab(tabId) {
    state.activeTab = tabId;

    // Toggle active menu item
    navItems.forEach(item => {
      if (item.getAttribute('data-tab') === tabId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Toggle active tab pane
    tabPanes.forEach(pane => {
      if (pane.id === `tab-${tabId}`) {
        pane.classList.add('active');
      } else {
        pane.classList.remove('active');
      }
    });

    // Update headers
    const meta = tabMetadata[tabId] || { title: 'Dashboard', subtitle: '' };
    pageTitle.textContent = meta.title;
    pageSubtitle.textContent = meta.subtitle;

    // Trigger tab-specific loaders
    loadTabData(tabId);
  }

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const tabId = item.getAttribute('data-tab');
      switchTab(tabId);
    });
  });

  // Global Refresh Button
  btnRefresh.addEventListener('click', () => {
    loadTabData(state.activeTab);
    showToast('Data refreshed successfully', 'success');
  });

  // Load appropriate data based on active tab
  function loadTabData(tabId) {
    switch (tabId) {
      case 'dashboard':
        loadDashboardStats();
        loadDashboardCharts();
        break;
      case 'students':
        loadStudentsList();
        break;
      case 'marks':
        loadMarksOptions();
        loadRecentMarksLogs();
        break;
      case 'attendance':
        loadAttendanceSheet();
        break;
      case 'reports':
        loadReportsGrid();
        break;
    }
  }

  // Initialize App on load
  switchTab('dashboard');

  // ==========================================
  // TAB 1: DASHBOARD LOGIC & CHART RENDERING
  // ==========================================

  async function loadDashboardStats() {
    try {
      const stats = await apiCall('/api/dashboard/stats');
      
      // Update UI cards
      document.getElementById('stat-total-students').textContent = stats.totalStudents;
      document.getElementById('stat-class-average').textContent = stats.classAverage ? `${stats.classAverage}%` : '-';
      document.getElementById('stat-attendance-rate').textContent = stats.attendanceRate ? `${stats.attendanceRate}%` : '-';
      
      if (stats.topStudent) {
        document.getElementById('stat-top-student').textContent = stats.topStudent.name;
        document.getElementById('stat-top-student-score').innerHTML = `<i class="fa-solid fa-star"></i> Avg: ${stats.topStudent.score}%`;
      } else {
        document.getElementById('stat-top-student').textContent = '-';
        document.getElementById('stat-top-student-score').textContent = '-';
      }

      // Update Risk Alerts Panel
      const riskContainer = document.getElementById('risk-cards-container');
      const riskBadge = document.getElementById('risk-badge');
      riskBadge.textContent = `${stats.riskCount} Students At Risk`;

      if (stats.riskCount === 0) {
        riskBadge.className = 'badge badge-success';
        riskContainer.innerHTML = `
          <div class="empty-state-card" style="grid-column: 1/-1; text-align: center; padding: 20px; color: var(--success);">
            <i class="fa-solid fa-circle-check" style="font-size: 24px; margin-bottom: 8px;"></i>
            <p>Excellent! No students are currently in the academic or attendance risk category.</p>
          </div>
        `;
      } else {
        riskBadge.className = 'badge badge-danger';
        riskContainer.innerHTML = '';
        stats.riskList.forEach(student => {
          const isLowScore = student.avg_score < 50;
          const isLowAttendance = student.attendance_rate < 75;
          
          let alertReasons = [];
          if (isLowScore) alertReasons.push(`Score: ${student.avg_score || 0}%`);
          if (isLowAttendance) alertReasons.push(`Attendance: ${student.attendance_rate || 0}%`);

          const card = document.createElement('div');
          card.className = 'risk-card';
          card.innerHTML = `
            <div class="risk-info">
              <h4>${student.name}</h4>
              <p>Roll No: ${student.roll_number}</p>
            </div>
            <div class="risk-badges">
              ${isLowScore ? '<span class="badge badge-danger">Academic Risk</span>' : ''}
              ${isLowAttendance ? '<span class="badge badge-warning">Low Attendance</span>' : ''}
              <span style="font-size: 11px; margin-top: 4px; opacity: 0.8;">(${alertReasons.join(' | ')})</span>
            </div>
          `;
          riskContainer.appendChild(card);
        });
      }
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
    }
  }

  async function loadDashboardCharts() {
    try {
      const data = await apiCall('/api/dashboard/charts');
      
      // Chart theme colors helper
      const primaryColor = '#6366f1';
      const accentColor = '#06b6d4';
      
      // 1. Subject Averages Chart
      if (state.charts.subject) state.charts.subject.destroy();
      
      const ctxSubject = document.getElementById('chart-subject-averages').getContext('2d');
      state.charts.subject = new Chart(ctxSubject, {
        type: 'bar',
        data: {
          labels: data.subjectAverages.map(d => d.subject),
          datasets: [{
            label: 'Class Average %',
            data: data.subjectAverages.map(d => d.average),
            backgroundColor: 'rgba(99, 102, 241, 0.45)',
            borderColor: primaryColor,
            borderWidth: 2,
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: 'y',
          plugins: { legend: { display: false } },
          scales: {
            x: { min: 0, max: 100, grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8' } },
            y: { grid: { display: false }, ticks: { color: '#94a3b8' } }
          }
        }
      });

      // 2. Attendance Trends Chart
      if (state.charts.attendance) state.charts.attendance.destroy();

      const ctxAttendance = document.getElementById('chart-attendance-trends').getContext('2d');
      // Set line gradient fill
      const gradient = ctxAttendance.createLinearGradient(0, 0, 0, 220);
      gradient.addColorStop(0, 'rgba(6, 182, 212, 0.3)');
      gradient.addColorStop(1, 'rgba(6, 182, 212, 0.0)');

      state.charts.attendance = new Chart(ctxAttendance, {
        type: 'line',
        data: {
          labels: data.attendanceTrends.map(d => {
            // Short date format MM/DD
            const parts = d.date.split('-');
            return parts.length === 3 ? `${parts[1]}/${parts[2]}` : d.date;
          }),
          datasets: [{
            label: 'Attendance Rate %',
            data: data.attendanceTrends.map(d => d.rate),
            backgroundColor: gradient,
            borderColor: accentColor,
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: accentColor
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, ticks: { color: '#94a3b8' } },
            y: { min: 0, max: 100, grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8' } }
          }
        }
      });

      // 3. Grade Distribution Chart
      if (state.charts.grades) state.charts.grades.destroy();

      const ctxGrades = document.getElementById('chart-grade-distribution').getContext('2d');
      state.charts.grades = new Chart(ctxGrades, {
        type: 'doughnut',
        data: {
          labels: data.gradeDistribution.map(d => d.grade),
          datasets: [{
            data: data.gradeDistribution.map(d => d.count),
            backgroundColor: [
              '#10b981', // A - Emerald
              '#06b6d4', // B - Cyan
              '#f59e0b', // C - Amber
              '#ef4444', // D - Red/Rose
              '#6b7280'  // F - Grey
            ],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
              labels: { color: '#94a3b8', font: { family: 'Inter', size: 11 } }
            }
          },
          cutout: '65%'
        }
      });

    } catch (err) {
      console.error('Error loading dashboard charts:', err);
    }
  }

  // ==========================================
  // TAB 2: STUDENTS DIRECTORY (CRUD)
  // ==========================================

  const searchInput = document.getElementById('search-student');
  const filterClass = document.getElementById('filter-class');

  // Trigger search/filters
  searchInput.addEventListener('input', filterStudentsTable);
  filterClass.addEventListener('change', filterStudentsTable);

  async function loadStudentsList() {
    try {
      state.students = await apiCall('/api/students');
      renderStudentsTable(state.students);
    } catch (err) {
      console.error('Error loading students:', err);
    }
  }

  function renderStudentsTable(studentsList) {
    const tbody = document.getElementById('students-table-body');
    tbody.innerHTML = '';

    if (studentsList.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center text-muted">No students found. Add a new student to get started.</td>
        </tr>
      `;
      return;
    }

    studentsList.forEach(student => {
      const row = document.createElement('tr');
      
      // Academic averages indicator classes
      let scoreClass = 'text-muted';
      if (student.avg_score >= 90) scoreClass = 'text-success font-semibold';
      else if (student.avg_score >= 70) scoreClass = 'text-info';
      else if (student.avg_score > 0 && student.avg_score < 50) scoreClass = 'text-danger font-semibold';

      let attClass = 'text-muted';
      if (student.attendance_rate >= 90) attClass = 'text-success';
      else if (student.attendance_rate > 0 && student.attendance_rate < 75) attClass = 'text-danger';

      row.innerHTML = `
        <td><strong>${student.roll_number}</strong></td>
        <td>${student.name}</td>
        <td><span class="badge badge-info">${student.class_name}</span></td>
        <td>${student.email}</td>
        <td class="${scoreClass}">${student.avg_score ? `${student.avg_score}%` : 'N/A'}</td>
        <td class="${attClass}">${student.attendance_rate ? `${student.attendance_rate}%` : 'N/A'}</td>
        <td>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-secondary btn-sm btn-view-profile" data-id="${student.id}" title="View Complete Profile">
              <i class="fa-solid fa-eye text-info"></i>
            </button>
            <button class="btn btn-secondary btn-sm btn-edit-student" data-id="${student.id}" title="Edit Student Profile">
              <i class="fa-solid fa-pen text-primary"></i>
            </button>
            <button class="btn btn-secondary btn-sm btn-delete-student" data-id="${student.id}" title="Delete Record">
              <i class="fa-solid fa-trash text-danger"></i>
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(row);
    });

    // Attach row events
    document.querySelectorAll('.btn-view-profile').forEach(btn => {
      btn.addEventListener('click', () => openStudentProfile(btn.getAttribute('data-id')));
    });

    document.querySelectorAll('.btn-edit-student').forEach(btn => {
      btn.addEventListener('click', () => openEditStudentModal(btn.getAttribute('data-id')));
    });

    document.querySelectorAll('.btn-delete-student').forEach(btn => {
      btn.addEventListener('click', () => deleteStudent(btn.getAttribute('data-id')));
    });
  }

  function filterStudentsTable() {
    const query = searchInput.value.toLowerCase().trim();
    const selectedClass = filterClass.value;

    const filtered = state.students.filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(query) || 
                            student.roll_number.toLowerCase().includes(query);
      const matchesClass = selectedClass === '' || student.class_name === selectedClass;
      return matchesSearch && matchesClass;
    });

    renderStudentsTable(filtered);
  }

  // Modals Toggles

  /**
   * Generates the next roll number in the '25M11MCxxx' series.
   * Scans all students in state, finds the highest numeric suffix,
   * and returns the next incremented roll number.
   */
  function getNextRollNumber() {
    const PREFIX = '25M11MC';
    let maxNum = 0;

    state.students.forEach(student => {
      const roll = student.roll_number || '';
      if (roll.startsWith(PREFIX)) {
        const numPart = parseInt(roll.slice(PREFIX.length), 10);
        if (!isNaN(numPart) && numPart > maxNum) {
          maxNum = numPart;
        }
      }
    });

    const nextNum = maxNum + 1;
    return `${PREFIX}${String(nextNum).padStart(3, '0')}`;
  }

  function openAddStudentModal() {
    studentModalTitle.textContent = 'Add New Student';
    document.getElementById('student-id').value = '';
    studentForm.reset();

    // Auto-fill next roll number in the 25M11MCxxx series
    const nextRoll = getNextRollNumber();
    document.getElementById('student-roll').value = nextRoll;
    document.getElementById('student-roll').readOnly = false;

    studentModal.classList.add('active');
  }

  function openEditStudentModal(id) {
    const student = state.students.find(s => s.id == id);
    if (!student) return;

    studentModalTitle.textContent = 'Edit Student Details';
    document.getElementById('student-id').value = student.id;
    document.getElementById('student-name').value = student.name;
    document.getElementById('student-roll').value = student.roll_number;
    document.getElementById('student-roll').readOnly = true; // Prevent roll number changes on edit
    document.getElementById('student-email').value = student.email;
    document.getElementById('student-class').value = student.class_name;
    
    studentModal.classList.add('active');
  }

  btnQuickAdd.addEventListener('click', openAddStudentModal);
  btnAddStudent.addEventListener('click', openAddStudentModal);
  
  const closeStudentModalFn = () => studentModal.classList.remove('active');
  closeStudentModal.addEventListener('click', closeStudentModalFn);
  btnCancelStudent.addEventListener('click', closeStudentModalFn);

  // Handle student form submit
  studentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('student-id').value;
    const studentData = {
      name: document.getElementById('student-name').value.trim(),
      roll_number: document.getElementById('student-roll').value.trim().toUpperCase(),
      email: document.getElementById('student-email').value.trim(),
      class_name: document.getElementById('student-class').value
    };

    try {
      if (id) {
        // Edit Mode
        await apiCall(`/api/students/${id}`, 'PUT', studentData);
        showToast('Student details updated successfully', 'success');
      } else {
        // Add Mode
        await apiCall('/api/students', 'POST', studentData);
        showToast('Student registered successfully', 'success');
      }
      studentModal.classList.remove('active');
      loadStudentsList();
    } catch (err) {
      console.error(err);
    }
  });

  // Delete Student
  async function deleteStudent(id) {
    const student = state.students.find(s => s.id == id);
    if (!student) return;

    const confirmDelete = confirm(`Are you absolutely sure you want to delete student "${student.name}" (Roll No: ${student.roll_number})?\nThis will remove all associated marks and attendance records forever.`);
    if (!confirmDelete) return;

    try {
      await apiCall(`/api/students/${id}`, 'DELETE');
      showToast('Student record deleted successfully', 'warning');
      loadStudentsList();
    } catch (err) {
      console.error(err);
    }
  }

  // ==========================================
  // PROFILE VIEW MODAL LOGIC
  // ==========================================

  async function openStudentProfile(id) {
    try {
      const data = await apiCall(`/api/students/${id}`);
      
      // Populate fields
      document.getElementById('prof-name').textContent = data.name;
      document.getElementById('prof-roll').textContent = data.roll_number;
      document.getElementById('prof-email').textContent = data.email;
      document.getElementById('prof-class').textContent = data.class_name;
      document.getElementById('prof-gpa').textContent = data.avg_score ? `${data.avg_score}%` : 'N/A';
      document.getElementById('prof-att').textContent = data.attendance_rate ? `${data.attendance_rate}%` : 'N/A';

      // Load Profile Grades
      const gradesTbody = document.getElementById('prof-grades-table-body');
      gradesTbody.innerHTML = '';
      if (!data.marks || data.marks.length === 0) {
        gradesTbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">No marks recorded yet.</td></tr>`;
      } else {
        data.marks.forEach(m => {
          let scoreClass = '';
          if (m.score >= 90) scoreClass = 'text-success font-semibold';
          else if (m.score < 50) scoreClass = 'text-danger font-semibold';
          
          let statusText = 'Pass';
          let statusBadge = 'badge-success';
          if (m.score < 50) {
            statusText = 'Fail';
            statusBadge = 'badge-danger';
          }

          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td><strong>${m.subject}</strong></td>
            <td>${m.exam_type}</td>
            <td class="${scoreClass}">${m.score} / ${m.max_score}</td>
            <td><span class="badge ${statusBadge}">${statusText}</span></td>
          `;
          gradesTbody.appendChild(tr);
        });
      }

      // Load Profile Attendance Log
      const attendanceLog = document.getElementById('prof-attendance-log-container');
      attendanceLog.innerHTML = '';
      if (!data.attendance || data.attendance.length === 0) {
        attendanceLog.innerHTML = `<p class="text-muted text-center" style="grid-column: 1/-1;">No attendance logs found.</p>`;
      } else {
        data.attendance.forEach(a => {
          let statusClass = 'present';
          if (a.status === 'Absent') statusClass = 'absent';
          else if (a.status === 'Late') statusClass = 'late';

          const card = document.createElement('div');
          card.className = `attendance-log-card ${statusClass}`;
          
          // Format Date to short string
          const date = new Date(a.date);
          const dateStr = date.toLocaleDateString(undefined, {month: 'short', day: 'numeric'});

          card.innerHTML = `
            <span class="log-date">${dateStr}</span>
            <span class="log-status">${a.status}</span>
          `;
          attendanceLog.appendChild(card);
        });
      }

      // Open Modal
      switchProfileTab('prof-grades');
      profileModal.classList.add('active');
    } catch (err) {
      console.error(err);
    }
  }

  // Profile Tab toggling
  function switchProfileTab(profileTabId) {
    state.selectedProfileTab = profileTabId;
    
    profileTabBtns.forEach(btn => {
      if (btn.getAttribute('data-profile-tab') === profileTabId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    profileTabContents.forEach(content => {
      if (content.id === `${profileTabId}-tab`) {
        content.classList.add('active');
      } else {
        content.classList.remove('active');
      }
    });
  }

  profileTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      switchProfileTab(btn.getAttribute('data-profile-tab'));
    });
  });

  const closeProfileModalFn = () => profileModal.classList.remove('active');
  closeProfileModal.addEventListener('click', closeProfileModalFn);
  btnCloseProfile.addEventListener('click', closeProfileModalFn);

  // ==========================================
  // TAB 3: GRADES ENTRY LOGIC
  // ==========================================

  const selectStudentMarks = document.getElementById('marks-student-id');
  const marksForm = document.getElementById('marks-form');

  // Fill student dropdown for marks entry
  async function loadMarksOptions() {
    try {
      const list = await apiCall('/api/students');
      selectStudentMarks.innerHTML = '<option value="">-- Choose Student --</option>';
      list.forEach(student => {
        const opt = document.createElement('option');
        opt.value = student.id;
        opt.textContent = `${student.name} (${student.roll_number})`;
        selectStudentMarks.appendChild(opt);
      });
    } catch (err) {
      console.error(err);
    }
  }

  // Fetch recent grades entered
  async function loadRecentMarksLogs() {
    const tbody = document.getElementById('recent-marks-body');
    tbody.innerHTML = '';
    try {
      const logs = await apiCall('/api/marks');
      if (logs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No grade records logged yet.</td></tr>`;
        return;
      }

      // Slice to show top 10 recent
      const recent = logs.reverse().slice(0, 10);
      recent.forEach(log => {
        const tr = document.createElement('tr');
        let scoreClass = 'text-info';
        if (log.score >= 90) scoreClass = 'text-success font-semibold';
        else if (log.score < 50) scoreClass = 'text-danger font-semibold';

        tr.innerHTML = `
          <td><strong>${log.roll_number}</strong></td>
          <td>${log.name}</td>
          <td>${log.subject}</td>
          <td><span class="badge badge-info">${log.exam_type}</span></td>
          <td class="${scoreClass}">${log.score} / ${log.max_score}</td>
        `;
        tbody.appendChild(tr);
      });
    } catch (err) {
      console.error(err);
    }
  }

  // Handle Marks Entry Submit
  marksForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      student_id: parseInt(selectStudentMarks.value),
      subject: document.getElementById('marks-subject').value,
      exam_type: document.getElementById('marks-exam-type').value,
      score: parseFloat(document.getElementById('marks-score').value),
      max_score: parseInt(document.getElementById('marks-max-score').value)
    };

    try {
      await apiCall('/api/marks', 'POST', data);
      showToast('Student scores logged successfully', 'success');
      marksForm.reset();
      loadRecentMarksLogs();
    } catch (err) {
      console.error(err);
    }
  });

  // ==========================================
  // TAB 4: ATTENDANCE MANAGEMENT
  // ==========================================

  const attDateInput = document.getElementById('attendance-date');
  const btnSaveAttendance = document.getElementById('btn-save-attendance');

  // Set default date to today YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];
  attDateInput.value = todayStr;
  attDateInput.max = todayStr; // Prevent picking future dates

  attDateInput.addEventListener('change', loadAttendanceSheet);

  async function loadAttendanceSheet() {
    const date = attDateInput.value;
    const tbody = document.getElementById('attendance-table-body');
    tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Retrieving attendance logs...</td></tr>';
    
    try {
      const data = await apiCall(`/api/attendance?date=${date}`);
      tbody.innerHTML = '';

      if (!data.list || data.list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No students registered in database.</td></tr>';
        updateAttendanceCounters([]);
        return;
      }

      data.list.forEach(student => {
        // Default to 'Present' if not marked yet
        const status = student.status || 'Present';
        const tr = document.createElement('tr');
        tr.setAttribute('data-student-id', student.student_id);

        tr.innerHTML = `
          <td><strong>${student.roll_number}</strong></td>
          <td>${student.name}</td>
          <td><span class="badge badge-info">${student.class_name}</span></td>
          <td class="text-center">
            <div class="status-toggler">
              <button type="button" class="status-btn present ${status === 'Present' ? 'active' : ''}" data-status="Present">Present</button>
              <button type="button" class="status-btn late ${status === 'Late' ? 'active' : ''}" data-status="Late">Late</button>
              <button type="button" class="status-btn absent ${status === 'Absent' ? 'active' : ''}" data-status="Absent">Absent</button>
            </div>
          </td>
        `;
        tbody.appendChild(tr);
      });

      // Bind status toggler click events
      document.querySelectorAll('.status-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const toggler = e.target.parentElement;
          // Deactivate all buttons in this row toggler
          toggler.querySelectorAll('.status-btn').forEach(b => b.classList.remove('active'));
          // Activate clicked button
          e.target.classList.add('active');
          // Update counters
          updateAttendanceCountersFromTable();
        });
      });

      updateAttendanceCountersFromTable();

    } catch (err) {
      console.error(err);
    }
  }

  function updateAttendanceCountersFromTable() {
    let present = 0, late = 0, absent = 0;
    document.querySelectorAll('#attendance-table-body tr').forEach(row => {
      const activeBtn = row.querySelector('.status-btn.active');
      if (activeBtn) {
        const status = activeBtn.getAttribute('data-status');
        if (status === 'Present') present++;
        else if (status === 'Late') late++;
        else if (status === 'Absent') absent++;
      }
    });

    document.getElementById('att-summary-present').innerHTML = `<i class="fa-solid fa-circle-check"></i> Present: ${present}`;
    document.getElementById('att-summary-late').innerHTML = `<i class="fa-solid fa-clock"></i> Late: ${late}`;
    document.getElementById('att-summary-absent').innerHTML = `<i class="fa-solid fa-circle-xmark"></i> Absent: ${absent}`;
  }

  // Handle Save Attendance Click
  btnSaveAttendance.addEventListener('click', async () => {
    const date = attDateInput.value;
    const records = [];

    document.querySelectorAll('#attendance-table-body tr').forEach(row => {
      const studentId = parseInt(row.getAttribute('data-student-id'));
      const activeBtn = row.querySelector('.status-btn.active');
      
      if (studentId && activeBtn) {
        records.push({
          student_id: studentId,
          status: activeBtn.getAttribute('data-status')
        });
      }
    });

    if (records.length === 0) {
      showToast('No student records to save', 'warning');
      return;
    }

    try {
      await apiCall('/api/attendance', 'POST', { date, records });
      showToast(`Daily attendance saved for ${date}`, 'success');
      loadAttendanceSheet();
    } catch (err) {
      console.error(err);
    }
  });

  // ==========================================
  // TAB 5: REPORTS GENERATION
  // ==========================================

  const btnExportCsv = document.getElementById('btn-export-csv');
  const btnPrintReport = document.getElementById('btn-print-report');

  async function loadReportsGrid() {
    const tbody = document.getElementById('reports-table-body');
    tbody.innerHTML = '<tr><td colspan="15" class="text-center text-muted">Running analytics and generating grid...</td></tr>';
    
    try {
      state.reports = await apiCall('/api/reports');
      tbody.innerHTML = '';

      if (state.reports.length === 0) {
        tbody.innerHTML = '<tr><td colspan="15" class="text-center text-muted">No student grade data exists to compile report cards.</td></tr>';
        return;
      }

      state.reports.forEach(student => {
        const tr = document.createElement('tr');
        
        // Subject scores
        const getScoreStr = (subj, type) => {
          return student.subjects[subj] && student.subjects[subj][type] !== undefined 
            ? student.subjects[subj][type] 
            : '-';
        };

        // Avg class
        let avgClass = 'text-muted';
        if (student.avg_score >= 90) avgClass = 'text-success font-semibold';
        else if (student.avg_score < 50) avgClass = 'text-danger font-semibold';

        tr.innerHTML = `
          <td><strong>${student.rank}</strong></td>
          <td>${student.roll_number}</td>
          <td>${student.name}</td>
          
          <td>${getScoreStr('Data Structures', 'Mid-term')}</td>
          <td>${getScoreStr('Data Structures', 'Final')}</td>
          
          <td>${getScoreStr('Database Systems', 'Mid-term')}</td>
          <td>${getScoreStr('Database Systems', 'Final')}</td>
          
          <td>${getScoreStr('Java Programming', 'Mid-term')}</td>
          <td>${getScoreStr('Java Programming', 'Final')}</td>
          
          <td>${getScoreStr('Web Technologies', 'Mid-term')}</td>
          <td>${getScoreStr('Web Technologies', 'Final')}</td>
          
          <td>${getScoreStr('Software Engineering', 'Mid-term')}</td>
          <td>${getScoreStr('Software Engineering', 'Final')}</td>
          
          <td class="${avgClass}"><strong>${student.avg_score ? `${student.avg_score}%` : '0%'}</strong></td>
          <td><strong>${student.attendance_rate ? `${student.attendance_rate}%` : '0%'}</strong></td>
        `;
        tbody.appendChild(tr);
      });

    } catch (err) {
      console.error(err);
    }
  }

  // Export CSV
  btnExportCsv.addEventListener('click', () => {
    if (state.reports.length === 0) {
      showToast('No report records to export.', 'warning');
      return;
    }

    const headers = [
      'Rank', 'Roll Number', 'Student Name', 'Class',
      'DSA Mid', 'DSA Final',
      'DBMS Mid', 'DBMS Final',
      'Java Mid', 'Java Final',
      'Web Tech Mid', 'Web Tech Final',
      'SE Mid', 'SE Final',
      'Average Score %', 'Attendance Rate %'
    ];

    const getScore = (student, subj, type) => {
      return student.subjects[subj] && student.subjects[subj][type] !== undefined 
        ? student.subjects[subj][type] 
        : '';
    };

    const csvRows = [headers.join(',')];
    
    state.reports.forEach(s => {
      const row = [
        s.rank,
        `"${s.roll_number}"`,
        `"${s.name}"`,
        `"${s.class_name}"`,
        getScore(s, 'Data Structures', 'Mid-term'),
        getScore(s, 'Data Structures', 'Final'),
        getScore(s, 'Database Systems', 'Mid-term'),
        getScore(s, 'Database Systems', 'Final'),
        getScore(s, 'Java Programming', 'Mid-term'),
        getScore(s, 'Java Programming', 'Final'),
        getScore(s, 'Web Technologies', 'Mid-term'),
        getScore(s, 'Web Technologies', 'Final'),
        getScore(s, 'Software Engineering', 'Mid-term'),
        getScore(s, 'Software Engineering', 'Final'),
        s.avg_score,
        s.attendance_rate
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Student_Performance_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('Report downloaded as CSV file', 'success');
  });

  // Print View Trigger
  btnPrintReport.addEventListener('click', () => {
    window.print();
  });

});
