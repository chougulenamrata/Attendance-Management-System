const state = { data: null, user: null, view: 'overview', markSubject: null, markFaculty: null, token: localStorage.getItem('attendance_token') || '' };
const app = document.querySelector('#app');
const pageTitle = document.querySelector('#page-title');

const initials = (name) => name.split(' ').map((part) => part[0]).slice(0, 2).join('');
const esc = (value) => String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[character]));
const formatDate = (value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const toast = (message) => { const element = document.querySelector('#toast'); element.textContent = message; element.classList.add('show'); setTimeout(() => element.classList.remove('show'), 2500); };
const apiHeaders = () => state.token ? { Authorization: `Bearer ${state.token}` } : {};
function updateProfile() { const faculty = state.data?.faculty.find((item) => item.id === state.markFaculty) || state.data?.currentFaculty; if (!faculty) return; document.querySelector('#profile-name').textContent = faculty.name; document.querySelector('#profile-role').textContent = `${faculty.role} · ${faculty.department}`; document.querySelector('#profile-avatar').textContent = initials(faculty.name); }
function syncAuthScreen() { const modal = document.querySelector('#login-modal'); const shell = document.querySelector('.app-shell'); const button = document.querySelector('#login-button'); if (!modal || !shell) return; modal.hidden = Boolean(state.token); shell.classList.toggle('auth-locked', !state.token); if (button) button.textContent = state.token ? 'Sign out' : 'Sign in'; }

async function loadData() {
    if (!state.token) { window.location.replace('/login.html'); return; }
    const userResponse = await fetch('/api/auth/me', { headers: apiHeaders() });
    if (!userResponse.ok) { localStorage.removeItem('attendance_token'); state.token = ''; window.location.replace('/login.html'); return; }
    state.user = (await userResponse.json()).user;
    const response = await fetch('/api/bootstrap');
    state.data = await response.json();
    state.markFaculty = state.markFaculty || state.data.currentFaculty.id;
    updateProfile();
    syncAuthScreen();
    render();
}

function statCard(label, value, meta, className = '') {
    return `<div class="stat-card ${className}"><div class="stat-label">${label}<span>↗</span></div><div class="stat-number">${value}</div><div class="stat-meta">${meta}</div></div>`;
}

function header(eyebrow, title, description, action = '') {
    return `<div class="page-heading"><div><div class="eyebrow">${eyebrow}</div><h1>${title}</h1><p>${description}</p></div>${action}</div>`;
}

function studentRow(student) {
    return `<tr><td><strong class="student-name">${esc(student.name)}</strong><small>${student.id} · ${student.section}</small></td><td>${student.department}</td><td>${student.total ? `<strong>${student.overall}%</strong><div class="progress"><i style="width:${student.overall}%"></i></div>` : '<span class="muted-value">-</span>'}</td><td>${student.total} sessions</td><td><span class="status ${student.total === 0 ? 'neutral' : student.overall < 75 ? 'risk' : 'good'}">${student.status}</span></td></tr>`;
}

function riskRows() {
    const students = state.data.students.filter((student) => student.total > 0 && student.overall < 75).slice(0, 4);
    return students.map((student) => `<div class="risk-row"><div class="risk-avatar">${initials(student.name)}</div><div class="risk-info"><strong>${esc(student.name)}</strong><small>${student.subjectStats.find((subject) => subject.percentage < 75)?.subject || 'Overall attendance'}</small></div><div><div class="percentage">${student.overall}%</div><div class="progress"><i style="width:${student.overall}%"></i></div></div></div>`).join('') || '<div class="notice">Everyone is currently above the attendance threshold.</div>';
}

function overview() {
    const summary = state.data.summary;
    return `<div class="view-section">${header('Thursday · September 24, 2026', 'Good morning', 'Institution-wide pulse with a live sample roster for this prototype.', '<button class="action-button" data-view="mark">+ Mark attendance</button>')}<div class="stats-grid">${statCard('Total students', summary.totalStudents.toLocaleString(), '8 departments · 42 sections')}${statCard('Today\'s attendance', `${summary.attendanceRate}%`, '<span class="trend">+3.2%</span> vs last week')}${statCard('Classes today', summary.classesToday, '118 completed · 2 upcoming')}${statCard('Needs attention', summary.lowAttendance, 'Across the institution')}</div><div class="dashboard-grid"><div class="panel"><div class="panel-header"><div><div class="panel-title">Attendance trend</div><div class="panel-subtitle">Average presence across your classes</div></div><button class="text-button" data-view="history">View history →</button></div><div class="bars">${['M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => `<div class="bar-group"><div class="bar ${index === 3 ? 'today' : ''}" style="height:${[72, 84, 78, 91, 67, 52][index]}%"><span>${[72, 84, 78, 91, 67, 52][index]}%</span></div><div class="bar-label">${day}</div></div>`).join('')}</div><div class="legend"><span><b></b>This week</span><span><b class="muted"></b>Previous week</span></div></div><div class="panel"><div class="panel-header"><div><div class="panel-title">Low attendance watchlist</div><div class="panel-subtitle">Students below the 75% threshold</div></div><button class="text-button" data-view="students">See all →</button></div><div class="risk-list">${riskRows()}</div></div></div><div class="panel table-panel"><div class="panel-header"><div><div class="panel-title">Live sample roster</div><div class="panel-subtitle">${summary.sampleStudents} records loaded for workflow demonstration</div></div><button class="text-button" data-view="students">Manage students →</button></div><table class="data-table"><thead><tr><th>Student</th><th>Department</th><th>Attendance</th><th>Sessions</th><th>Status</th></tr></thead><tbody>${state.data.students.slice(0, 5).map(studentRow).join('')}</tbody></table></div></div>`;
}

function markView() {
    const subject = state.data.subjects.find((item) => item.id === state.markSubject) || state.data.subjects[0];
    state.markSubject = subject.id;
    const faculty = state.data.faculty.find((item) => item.id === state.markFaculty) || state.data.currentFaculty;
    state.markFaculty = faculty.id;
    const roster = state.data.students.filter((student) => student.section === subject.section);
    return `<div class="view-section">${header('Faculty workspace', 'Mark attendance', 'Record today\'s presence in less than a minute.')}<div class="notice">Attendance is saved with a date and faculty audit trail. Existing records for the same class and date are updated safely.</div><div class="panel"><div class="faculty-assign"><div><div class="panel-title">Faculty marker</div><div class="panel-subtitle">Choose from all 500 faculty members or drag a quick option</div><select class="select faculty-select" id="faculty-select">${state.data.faculty.map((item) => `<option value="${item.id}" ${item.id === faculty.id ? 'selected' : ''}>${esc(item.name)} · ${item.department}</option>`).join('')}</select><div class="faculty-chips">${state.data.faculty.slice(0, 12).map((item) => `<button class="faculty-chip" draggable="true" data-faculty="${item.id}">${esc(item.name)}</button>`).join('')}</div></div><div class="faculty-drop" id="faculty-drop" data-faculty="${faculty.id}">Drop faculty here<strong>${esc(faculty.name)}</strong></div></div><div class="mark-toolbar"><div class="filter-row"><select class="select" id="subject-select">${state.data.subjects.map((item) => `<option value="${item.id}" ${item.id === subject.id ? 'selected' : ''}>${item.code} · ${item.name}</option>`).join('')}</select><input class="date-input" id="attendance-date" type="date" value="2026-09-24"></div><button class="action-button" id="save-attendance">Save attendance</button></div><table class="data-table mark-table"><thead><tr><th>Student</th><th>Section</th><th>Attendance status</th></tr></thead><tbody>${roster.map((student) => `<tr><td><strong>${esc(student.name)}</strong><small>${student.id}</small></td><td>${student.section}</td><td><div class="attendance-toggle"><button class="selected present" data-status="present" data-student="${student.id}">Present</button><button data-status="absent" data-student="${student.id}">Absent</button></div></td></tr>`).join('')}</tbody></table></div></div>`;
}

function studentsView() {
    const sections = [...new Set(state.data.students.map((student) => student.section))];
    return `<div class="view-section">${header('People directory', 'Students', `Monitor ${state.data.students.length.toLocaleString()} students across every department.`)}<div class="panel"><div class="filter-row"><input class="text-input" id="student-search" placeholder="Search by name or ID" type="search"><select class="select" id="section-filter"><option value="all">All sections</option>${sections.map((section) => `<option value="${section}">${section}</option>`).join('')}</select><button class="text-button" data-view="mark">+ Mark attendance</button></div><div class="panel-subtitle">Showing the first 50 matching records for a responsive directory. Search narrows the full 5,000-student dataset.</div><table class="data-table"><thead><tr><th>Student</th><th>Department</th><th>Attendance</th><th>Sessions</th><th>Status</th></tr></thead><tbody id="student-rows">${state.data.students.slice(0, 50).map(studentRow).join('')}</tbody></table></div></div>`;
}

function facultyView() {
    const departments = [...new Set(state.data.faculty.map((member) => member.department))];
    return `<div class="view-section">${header('People directory', 'Faculty', `Manage all ${state.data.faculty.length.toLocaleString()} faculty members across every department.`)}<div class="panel"><div class="filter-row"><input class="text-input" id="faculty-search" placeholder="Search by name or ID" type="search"><select class="select" id="faculty-department-filter"><option value="all">All departments</option>${departments.map((department) => `<option value="${department}">${department}</option>`).join('')}</select></div><div class="panel-subtitle">Showing the first 50 matching records for a responsive directory. Search narrows the full 500-member dataset.</div><table class="data-table"><thead><tr><th>Faculty member</th><th>Department</th><th>Role</th><th>Faculty ID</th></tr></thead><tbody id="faculty-rows">${state.data.faculty.slice(0, 50).map((member) => `<tr><td><strong class="student-name">${esc(member.name)}</strong></td><td>${member.department}</td><td><span class="status good">${member.role}</span></td><td>${member.id}</td></tr>`).join('')}</tbody></table></div></div>`;
}

function correctionsView() {
    const records = state.data.students.filter((student) => student.total > 0).flatMap((student) => student.subjectStats.map((subject) => { const record = state.data.attendance.find((item) => item.studentId === student.id && item.subjectId === subject.subjectId); return { record, label: `${student.name} · ${subject.subject}` }; })).filter((item) => item.record);
    const firstStatus = records[0]?.record.status || 'present';
    return `<div class="view-section">${header('Governance', 'Correction requests', 'Every change to a submitted register is reviewable and traceable.')}<div class="panel"><div class="panel-header"><div><div class="panel-title">Review queue</div><div class="panel-subtitle">Admin approval is required before attendance is changed</div></div><span class="status pending">${state.data.correctionRequests.filter((item) => item.status === 'pending').length} pending</span></div><div class="notice">Select an attendance record, choose the correction, enter a reason, then submit.</div><div class="filter-row"><select class="select" id="correction-attendance">${records.map((item) => `<option value="${item.record.id}" data-current="${item.record.status}">${item.label} · Current: ${item.record.status}</option>`).join('')}</select><select class="select" id="correction-status"><option value="${firstStatus === 'present' ? 'absent' : 'present'}">Request ${firstStatus === 'present' ? 'Absent' : 'Present'}</option><option value="${firstStatus}">Request ${firstStatus === 'present' ? 'Present' : 'Absent'}</option></select><input class="text-input" id="correction-reason" placeholder="Reason for correction"></div><button class="action-button" id="request-correction">Request correction</button><table class="data-table"><thead><tr><th>Student / subject</th><th>Reason</th><th>Requested</th><th>Status</th><th>Decision</th></tr></thead><tbody>${state.data.correctionRequests.map((request) => { const student = state.data.students.find((item) => item.id === request.studentId); return `<tr><td><strong>${student?.name}</strong><small>${request.subjectId} · ${request.id}</small></td><td>${esc(request.reason)}</td><td>${formatDate(request.requestedAt)}</td><td><span class="status ${request.status === 'pending' ? 'pending' : request.status === 'approved' ? 'good' : 'risk'}">${request.status}</span></td><td>${request.status === 'pending' ? `<button class="text-button decide" data-id="${request.id}" data-status="approved">Approve</button> <button class="text-button decide" data-id="${request.id}" data-status="rejected">Reject</button>` : '—'}</td></tr>`; }).join('')}</tbody></table></div></div>`;
}

function attendanceIdFor(studentId, subjectId) { return state.data.attendance?.find((record) => record.studentId === studentId && record.subjectId === subjectId)?.id || ''; }

function reportsView() {
    const low = state.data.students.filter((student) => student.total > 0 && student.overall < 75);
    return `<div class="view-section">${header('Reporting', 'Attendance reports', 'Student-wise, subject-wise, and low-attendance reporting for review.')}<div class="stats-grid">${statCard('Students below 75%', low.length, 'Actionable watchlist')}${statCard('Subjects tracked', state.data.subjects.length, 'Across active sections')}${statCard('Faculty', state.data.faculty.length, 'Institution directory')}${statCard('Departments', state.data.institution.departments.length, 'Multi-department view')}</div><div class="panel table-panel"><div class="panel-title">Low-attendance students</div><table class="data-table"><thead><tr><th>Student</th><th>Department</th><th>Section</th><th>Attendance</th><th>Warning</th></tr></thead><tbody>${low.slice(0, 50).map((student) => `<tr><td>${student.name}</td><td>${student.department}</td><td>${student.section}</td><td>${student.overall}%</td><td><span class="status risk">Attendance below 75%</span></td></tr>`).join('')}</tbody></table></div></div>`;
}

function myAttendanceView() {
    const student = state.data.students.find((item) => item.id === (state.user?.studentId || 'STU-1001')) || state.data.students[0];
    return `<div class="view-section">${header('Student portal', 'My attendance', 'Subject-wise attendance and low-attendance warnings for the signed-in student.')}<div class="stats-grid">${statCard('Overall attendance', `${student.overall}%`, student.overall < 75 ? 'Attendance below 75%' : 'On track')}${statCard('Present classes', student.present, `${student.total} total classes`)}</div><div class="panel"><div class="panel-title">Subject-wise attendance</div><table class="data-table"><thead><tr><th>Subject</th><th>Present</th><th>Total</th><th>Percentage</th></tr></thead><tbody>${student.subjectStats.map((item) => `<tr><td>${item.subject}</td><td>${item.present}</td><td>${item.total}</td><td><strong>${item.percentage}%</strong> ${item.percentage < 75 ? '<span class="status risk">Warning</span>' : ''}</td></tr>`).join('')}</tbody></table></div></div>`;
}

function historyView() {
    return `<div class="view-section">${header('Audit trail', 'Attendance history', 'A clear record of who changed what, and when.')}<div class="panel"><table class="data-table"><thead><tr><th>Event</th><th>Actor</th><th>Context</th><th>When</th></tr></thead><tbody>${state.data.auditLog.map((record) => `<tr><td><strong>${record.action}</strong><small>${record.id}</small></td><td>${record.actor}</td><td>${record.detail}</td><td>${formatDate(record.timestamp)}</td></tr>`).join('')}</tbody></table></div></div>`;
}

function render() {
    const views = { overview, mark: markView, students: studentsView, faculty: facultyView, reports: reportsView, 'my-attendance': myAttendanceView, corrections: correctionsView, history: historyView };
    app.innerHTML = views[state.view]();
    updateProfile();
    if (state.view === 'overview') {
        const departments = state.data.institution.departments.join(' · ');
        app.querySelector('.view-section').insertAdjacentHTML('afterbegin', `<div class="notice">Coverage: ${state.data.institution.faculty} faculty · ${state.data.institution.sections} sections · ${departments}</div>`);
    }
    pageTitle.textContent = state.view === 'mark' ? 'Mark attendance' : state.view[0].toUpperCase() + state.view.slice(1);
    document.querySelectorAll('.nav-item').forEach((item) => item.classList.toggle('active', item.dataset.view === state.view));
    bindViewEvents();
}

function bindViewEvents() {
    document.querySelectorAll('[data-view]').forEach((element) => element.addEventListener('click', () => { state.view = element.dataset.view; render(); }));
    document.querySelectorAll('.attendance-toggle button').forEach((button) => button.addEventListener('click', () => { button.parentElement.querySelectorAll('button').forEach((item) => item.classList.remove('selected')); button.classList.add('selected', button.dataset.status); }));
    document.querySelectorAll('.faculty-chip').forEach((chip) => { chip.addEventListener('dragstart', (event) => { event.dataTransfer.setData('text/plain', chip.dataset.faculty); }); chip.addEventListener('click', () => { state.markFaculty = chip.dataset.faculty; render(); }); });
    const facultyDrop = document.querySelector('#faculty-drop');
    if (facultyDrop) { facultyDrop.addEventListener('dragover', (event) => event.preventDefault()); facultyDrop.addEventListener('drop', (event) => { event.preventDefault(); state.markFaculty = event.dataTransfer.getData('text/plain'); render(); }); }
    const subjectSelect = document.querySelector('#subject-select');
    if (subjectSelect) subjectSelect.addEventListener('change', () => { state.markSubject = subjectSelect.value; render(); });
    const facultySelect = document.querySelector('#faculty-select');
    if (facultySelect) facultySelect.addEventListener('change', () => { state.markFaculty = facultySelect.value; render(); });
    const save = document.querySelector('#save-attendance');
    if (save) save.addEventListener('click', async () => { if (!state.token) return toast('Sign in as faculty before saving attendance.'); const records = [...document.querySelectorAll('.attendance-toggle')].map((group) => ({ studentId: group.querySelector('button').dataset.student, status: group.querySelector('.selected').dataset.status })); const response = await fetch('/api/attendance', { method: 'POST', headers: { ...apiHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ subjectId: document.querySelector('#subject-select').value, date: document.querySelector('#attendance-date').value, markedBy: state.markFaculty || state.data.currentFaculty.id, records }) }); const body = await response.json(); if (response.ok) { toast('Attendance saved successfully'); await loadData(); state.view = 'mark'; render(); } else toast(body.error || 'Could not save attendance.'); });
    document.querySelectorAll('.decide').forEach((button) => button.addEventListener('click', async () => { if (!state.token) return toast('Sign in as admin before reviewing corrections.'); const response = await fetch(`/api/corrections/${button.dataset.id}`, { method: 'PATCH', headers: { ...apiHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ status: button.dataset.status }) }); const body = await response.json(); toast(response.ok ? `Request ${button.dataset.status}` : body.error); if (response.ok) { await loadData(); state.view = 'corrections'; render(); } }));
    const search = document.querySelector('#student-search');
    const sectionFilter = document.querySelector('#section-filter');
    const filterStudents = () => { const query = search?.value.toLowerCase() || ''; const section = sectionFilter?.value || 'all'; document.querySelector('#student-rows').innerHTML = state.data.students.filter((student) => `${student.name} ${student.id}`.toLowerCase().includes(query) && (section === 'all' || student.section === section)).slice(0, 50).map(studentRow).join(''); };
    if (search) search.addEventListener('input', filterStudents);
    if (sectionFilter) sectionFilter.addEventListener('change', filterStudents);
    const facultySearch = document.querySelector('#faculty-search');
    const facultyDepartment = document.querySelector('#faculty-department-filter');
    const filterFaculty = () => { const query = facultySearch?.value.toLowerCase() || ''; const department = facultyDepartment?.value || 'all'; document.querySelector('#faculty-rows').innerHTML = state.data.faculty.filter((member) => `${member.name} ${member.id}`.toLowerCase().includes(query) && (department === 'all' || member.department === department)).slice(0, 50).map((member) => `<tr><td><strong class="student-name">${esc(member.name)}</strong></td><td>${member.department}</td><td><span class="status good">${member.role}</span></td><td>${member.id}</td></tr>`).join(''); };
    if (facultySearch) facultySearch.addEventListener('input', filterFaculty);
    if (facultyDepartment) facultyDepartment.addEventListener('change', filterFaculty);
    const requestCorrection = document.querySelector('#request-correction');
    const correctionAttendance = document.querySelector('#correction-attendance');
    const correctionStatus = document.querySelector('#correction-status');
    if (correctionAttendance) correctionAttendance.addEventListener('change', () => { const current = correctionAttendance.selectedOptions[0].dataset.current; correctionStatus.value = current === 'present' ? 'absent' : 'present'; });
    if (requestCorrection) requestCorrection.addEventListener('click', async () => { if (!state.token) return toast('Sign in before requesting a correction.'); const reason = document.querySelector('#correction-reason').value.trim(); if (!reason) return toast('Enter a reason for the correction.'); const response = await fetch('/api/corrections', { method: 'POST', headers: { ...apiHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ attendanceId: correctionAttendance.value, requestedBy: state.markFaculty, requestedStatus: correctionStatus.value, reason }) }); const body = await response.json(); toast(response.ok ? 'Correction request submitted.' : body.error); if (response.ok) { await loadData(); state.view = 'corrections'; render(); } });
    const loginButton = document.querySelector('#login-button');
    const loginModal = document.querySelector('#login-modal');
    const loginForm = document.querySelector('#login-form');
    const closeLogin = () => { loginModal.hidden = true; };
    if (loginButton) loginButton.onclick = () => { if (state.token) { state.token = ''; localStorage.removeItem('attendance_token'); window.location.replace('/login.html'); return; } loginModal.hidden = false; document.querySelector('#login-email').focus(); };
    document.querySelector('#login-close')?.addEventListener('click', closeLogin);
    document.querySelectorAll('[data-demo]').forEach((button) => button.addEventListener('click', () => { const accounts = { admin: ['admin@northstar.edu', 'Admin@123'], faculty: ['faculty@northstar.edu', 'Faculty@123'], student: ['student@northstar.edu', 'Student@123'] }; const [email, password] = accounts[button.dataset.demo]; document.querySelector('#login-email').value = email; document.querySelector('#login-password').value = password; }));
    if (loginButton && state.token) loginButton.textContent = 'Signed in · Sign out';
}

document.addEventListener('submit', async (event) => {
    if (event.target.id !== 'login-form') return;
    event.preventDefault();
    const error = document.querySelector('#login-error');
    error.textContent = '';
    const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: document.querySelector('#login-email').value.trim(), password: document.querySelector('#login-password').value }) });
    const body = await response.json();
    if (!response.ok) { error.textContent = body.error || 'Login failed.'; return; }
    state.token = body.token;
    localStorage.setItem('attendance_token', body.token);
    document.querySelector('#login-modal').hidden = true;
    syncAuthScreen();
    toast(`Signed in as ${body.user.name}`);
});

document.querySelectorAll('.nav-item').forEach((item) => item.addEventListener('click', () => { state.view = item.dataset.view; render(); }));
document.querySelector('.mobile-menu').addEventListener('click', () => document.querySelector('.sidebar').classList.toggle('open'));
loadData();
