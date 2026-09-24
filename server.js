const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { hasDatabaseConfig, query } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'local-demo-secret-change-me';
const ATTENDANCE_THRESHOLD = 75;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const sampleStudents = [
    { id: 'STU-1001', name: 'Aarav Mehta', email: 'aarav.mehta@northstar.edu', department: 'Computer Science', section: 'CSE-A', year: '3rd Year' },
    { id: 'STU-1002', name: 'Mira Shah', email: 'mira.shah@northstar.edu', department: 'Computer Science', section: 'CSE-A', year: '3rd Year' },
    { id: 'STU-1003', name: 'Kabir Rao', email: 'kabir.rao@northstar.edu', department: 'Computer Science', section: 'CSE-A', year: '3rd Year' },
    { id: 'STU-1004', name: 'Ananya Iyer', email: 'ananya.iyer@northstar.edu', department: 'Computer Science', section: 'CSE-A', year: '3rd Year' },
    { id: 'STU-1005', name: 'Vihaan Kapoor', email: 'vihaan.kapoor@northstar.edu', department: 'Computer Science', section: 'CSE-A', year: '3rd Year' },
    { id: 'STU-1006', name: 'Sara Thomas', email: 'sara.thomas@northstar.edu', department: 'Information Technology', section: 'IT-B', year: '2nd Year' }
];

const departments = ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil', 'Commerce', 'Mathematics', 'Humanities'];
const additionalCseStudents = ['Riya Nair', 'Arjun Malhotra', 'Ishita Bose', 'Dev Patel', 'Kavya Menon', 'Aditya Singh', 'Nisha Verma', 'Rohan Gupta', 'Meera Joshi', 'Yash Agarwal', 'Tanya Sethi', 'Sahil Khan', 'Pooja Reddy', 'Karan Bhat', 'Simran Kaur', 'Harsh Vyas', 'Neel Shah', 'Aditi Rao', 'Manav Jain', 'Diya Kapoor'];
const students = [...sampleStudents, ...Array.from({ length: 4994 }, (_, index) => {
    const department = departments[index % departments.length];
    const isCseDemo = index < additionalCseStudents.length;
    const displayName = isCseDemo ? additionalCseStudents[index] : `Student ${String(index + 7).padStart(4, '0')}`;
    return { id: `STU-${1007 + index}`, name: displayName, email: `student${index + 7}@northstar.edu`, department: isCseDemo ? 'Computer Science' : department, section: isCseDemo ? 'CSE-A' : `${department.slice(0, 3).toUpperCase()}-${(index % 6) + 1}`, year: `${(index % 4) + 1}th Year` };
})];
const faculty = Array.from({ length: 500 }, (_, index) => {
    if (index === 0) return { id: 'FAC-201', name: 'Dr. Neha Kulkarni', role: 'Faculty', department: 'Computer Science' };
    if (index === 1) return { id: 'FAC-202', name: 'Prof. Rohan Desai', role: 'Faculty', department: 'Information Technology' };
    return { id: `FAC-${201 + index}`, name: `Faculty Member ${index + 1}`, role: 'Faculty', department: departments[index % departments.length] };
});
const currentFaculty = faculty[0];
const users = [
    { id: 'USR-001', name: 'Admin User', email: 'admin@northstar.edu', role: 'ADMIN', passwordHash: bcrypt.hashSync('Admin@123', 10) },
    { id: 'USR-002', name: currentFaculty.name, email: 'faculty@northstar.edu', role: 'FACULTY', passwordHash: bcrypt.hashSync('Faculty@123', 10), facultyId: currentFaculty.id },
    { id: 'USR-003', name: 'Aarav Mehta', email: 'student@northstar.edu', role: 'STUDENT', passwordHash: bcrypt.hashSync('Student@123', 10), studentId: 'STU-1001' }
];

const subjects = [
    { id: 'SUB-301', code: 'CS-301', name: 'Database Systems', facultyId: 'FAC-201', section: 'CSE-A' },
    { id: 'SUB-302', code: 'CS-302', name: 'Computer Networks', facultyId: 'FAC-201', section: 'CSE-A' },
    { id: 'SUB-303', code: 'IT-205', name: 'Web Engineering', facultyId: 'FAC-202', section: 'IT-B' }
];

const attendance = [
    { id: 'ATT-1', studentId: 'STU-1001', subjectId: 'SUB-301', date: '2026-09-22', status: 'present', markedBy: 'FAC-201' },
    { id: 'ATT-2', studentId: 'STU-1002', subjectId: 'SUB-301', date: '2026-09-22', status: 'present', markedBy: 'FAC-201' },
    { id: 'ATT-3', studentId: 'STU-1003', subjectId: 'SUB-301', date: '2026-09-22', status: 'absent', markedBy: 'FAC-201' },
    { id: 'ATT-4', studentId: 'STU-1004', subjectId: 'SUB-301', date: '2026-09-22', status: 'present', markedBy: 'FAC-201' },
    { id: 'ATT-5', studentId: 'STU-1005', subjectId: 'SUB-301', date: '2026-09-22', status: 'absent', markedBy: 'FAC-201' },
    { id: 'ATT-6', studentId: 'STU-1001', subjectId: 'SUB-302', date: '2026-09-23', status: 'present', markedBy: 'FAC-201' },
    { id: 'ATT-7', studentId: 'STU-1002', subjectId: 'SUB-302', date: '2026-09-23', status: 'absent', markedBy: 'FAC-201' },
    { id: 'ATT-8', studentId: 'STU-1003', subjectId: 'SUB-302', date: '2026-09-23', status: 'absent', markedBy: 'FAC-201' },
    { id: 'ATT-9', studentId: 'STU-1004', subjectId: 'SUB-302', date: '2026-09-23', status: 'present', markedBy: 'FAC-201' },
    { id: 'ATT-10', studentId: 'STU-1005', subjectId: 'SUB-302', date: '2026-09-23', status: 'absent', markedBy: 'FAC-201' },
    { id: 'ATT-11', studentId: 'STU-1006', subjectId: 'SUB-303', date: '2026-09-24', status: 'present', markedBy: 'FAC-202' },
    ...Array.from({ length: 20 }, (_, index) => ({ id: `ATT-${12 + index}`, studentId: `STU-${1007 + index}`, subjectId: 'SUB-301', date: '2026-09-24', status: index % 4 === 0 ? 'absent' : 'present', markedBy: 'FAC-201' }))
];

const correctionRequests = [
    { id: 'CR-1001', attendanceId: 'ATT-8', studentId: 'STU-1003', subjectId: 'SUB-302', requestedBy: 'FAC-201', requestedAt: '2026-09-24T09:20:00.000Z', currentStatus: 'absent', requestedStatus: 'present', reason: 'Student was present but marked absent during a late roll call.', status: 'pending' }
];

const auditLog = [
    { id: 'LOG-1', action: 'Attendance recorded', actor: 'Dr. Neha Kulkarni', detail: 'Computer Networks · CSE-A', entity: 'attendance', entityId: 'ATT-6', oldValue: null, newValue: 'present', timestamp: '2026-09-23T11:40:00.000Z' },
    { id: 'LOG-2', action: 'Correction requested', actor: 'Dr. Neha Kulkarni', detail: 'Kabir Rao · Computer Networks', entity: 'attendance_correction', entityId: 'CR-1001', oldValue: 'absent', newValue: 'present', reason: 'Student was present but marked absent during a late roll call.', timestamp: '2026-09-24T09:20:00.000Z' }
];

const findStudent = (id) => students.find((student) => student.id === id);
const findSubject = (id) => subjects.find((subject) => subject.id === id);
const formatSubject = (id) => findSubject(id)?.name || 'Unknown subject';

function summary() {
    const total = attendance.length;
    const present = attendance.filter((record) => record.status === 'present').length;
    return { totalStudents: students.length, facultyCount: faculty.length, departmentCount: departments.length, sectionCount: 42, classesToday: 120, attendanceRate: 87.4, lowAttendance: 342, pendingCorrections: correctionRequests.filter((request) => request.status === 'pending').length, sampleStudents: sampleStudents.length, sampleAttendanceRate: total ? Math.round((present / total) * 1000) / 10 : 0 };
}

function studentSummaries() {
    return students.map((student) => {
        const records = attendance.filter((record) => record.studentId === student.id);
        const present = records.filter((record) => record.status === 'present').length;
        const overall = records.length ? Math.round((present / records.length) * 100) : 0;
        const subjectStats = subjects.filter((subject) => records.some((record) => record.subjectId === subject.id)).map((subject) => {
            const subjectRecords = records.filter((record) => record.subjectId === subject.id);
            const subjectPresent = subjectRecords.filter((record) => record.status === 'present').length;
            return { subjectId: subject.id, subject: subject.name, code: subject.code, present: subjectPresent, total: subjectRecords.length, percentage: Math.round((subjectPresent / subjectRecords.length) * 100) };
        });
        return { ...student, present, total: records.length, overall, status: records.length === 0 ? 'No records' : overall < ATTENDANCE_THRESHOLD ? 'At risk' : 'On track', subjectStats };
    });
}

function nextId(prefix, collection) {
    return `${prefix}-${collection.length + 1001}`;
}

app.get('/api/bootstrap', (req, res) => res.json({ summary: summary(), currentFaculty, institution: { name: 'Northstar University', scale: 'Production target', students: students.length, faculty: faculty.length, departments, sections: 42, subjects: 180 }, students: studentSummaries(), subjects, faculty, attendance, correctionRequests, auditLog }));

function signUser(user) {
    return jwt.sign({ sub: user.id, role: user.role, name: user.name, facultyId: user.facultyId, studentId: user.studentId }, JWT_SECRET, { expiresIn: '8h' });
}

function authenticate(req, res, next) {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Login required.' });
    try { req.user = jwt.verify(header.slice(7), JWT_SECRET); next(); } catch { return res.status(401).json({ error: 'Invalid or expired login token.' }); }
}

function allow(...roles) {
    return (req, res, next) => { if (!req.user || !roles.includes(req.user.role)) return res.status(403).json({ error: 'You do not have permission for this action.' }); next(); };
}

app.post('/api/auth/login', async (req, res) => {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });
    try {
        const dbUser = hasDatabaseConfig ? (await query('SELECT id, name, email, role, password_hash AS passwordHash FROM users WHERE email = :email LIMIT 1', { email }))[0] : null;
        const user = dbUser || users.find((item) => item.email === email);
        if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ error: 'Invalid email or password.' });
        return res.json({ token: signUser(user), user: { id: user.id, name: user.name, email: user.email, role: user.role, facultyId: user.facultyId, studentId: user.studentId } });
    } catch (error) { return res.status(500).json({ error: 'Login service is unavailable.' }); }
});

app.get('/api/auth/me', authenticate, (req, res) => res.json({ user: req.user }));
app.get('/api/admin/summary', authenticate, allow('ADMIN'), (req, res) => res.json({ ...summary(), database: hasDatabaseConfig ? 'mysql' : 'demo-memory' }));
app.get('/api/reports/low-attendance', authenticate, allow('ADMIN', 'FACULTY'), (req, res) => res.json(studentSummaries().filter((student) => student.total > 0 && student.overall < ATTENDANCE_THRESHOLD).map((student) => ({ id: student.id, name: student.name, department: student.department, section: student.section, overall: student.overall, warning: `Attendance below ${ATTENDANCE_THRESHOLD}%` }))));
app.get('/api/reports/subject', authenticate, allow('ADMIN', 'FACULTY'), (req, res) => res.json(subjects.map((subject) => { const records = attendance.filter((record) => record.subjectId === subject.id); const present = records.filter((record) => record.status === 'present').length; return { ...subject, totalClasses: records.length, present, absent: records.length - present, percentage: records.length ? Math.round((present / records.length) * 100) : 0 }; })));
app.get('/api/students/me/attendance', authenticate, allow('STUDENT'), (req, res) => { const student = studentSummaries().find((item) => item.id === req.user.studentId); if (!student) return res.status(404).json({ error: 'Student profile not found.' }); res.json({ student, history: attendance.filter((record) => record.studentId === student.id).map((record) => ({ ...record, subject: formatSubject(record.subjectId) })) }); });
app.get('/api/attendance', (req, res) => {
    const records = attendance.map((record) => ({ ...record, student: findStudent(record.studentId)?.name, subject: formatSubject(record.subjectId) }));
    res.json(records);
});

app.post('/api/attendance', authenticate, allow('FACULTY', 'ADMIN'), (req, res) => {
    const { subjectId, date, markedBy, records } = req.body;
    if (!subjectId || !date || !markedBy || !Array.isArray(records) || !records.length) return res.status(400).json({ error: 'Subject, date, marker, and at least one student record are required.' });
    const subject = findSubject(subjectId);
    if (!subject) return res.status(404).json({ error: 'Subject not found.' });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`))) return res.status(400).json({ error: 'Date must be a valid YYYY-MM-DD value.' });
    const invalidRecord = records.find(({ studentId, status }) => !findStudent(studentId) || !['present', 'absent'].includes(status));
    if (invalidRecord) return res.status(400).json({ error: 'Each record must reference a valid student and use present or absent status.' });
    const duplicateKeys = new Set();
    for (const record of records) { const key = `${record.studentId}:${subjectId}:${date}`; if (duplicateKeys.has(key)) return res.status(409).json({ error: 'Duplicate student attendance in the same register.' }); duplicateKeys.add(key); }
    if (records.some(({ studentId }) => attendance.some((record) => record.studentId === studentId && record.subjectId === subjectId && record.date === date))) return res.status(409).json({ error: 'Attendance already exists for one or more students on this date.' });
    records.forEach(({ studentId, status }) => {
        const existing = attendance.find((record) => record.studentId === studentId && record.subjectId === subjectId && record.date === date);
        if (!existing) attendance.push({ id: nextId('ATT', attendance), studentId, subjectId, date, status, markedBy });
    });
    auditLog.unshift({ id: nextId('LOG', auditLog), action: 'Attendance recorded', actor: markedBy === currentFaculty.id ? currentFaculty.name : 'Prof. Rohan Desai', detail: `${subject.name} · ${date}`, entity: 'attendance_register', entityId: `${subjectId}:${date}`, oldValue: null, newValue: records.map((record) => `${record.studentId}:${record.status}`).join(','), timestamp: new Date().toISOString() });
    res.status(201).json({ message: 'Attendance saved.', summary: summary() });
});

app.post('/api/corrections', authenticate, allow('ADMIN', 'FACULTY', 'STUDENT'), (req, res) => {
    const { attendanceId, requestedBy, requestedStatus, reason } = req.body;
    const record = attendance.find((item) => item.id === attendanceId);
    if (!record || !reason?.trim() || !['present', 'absent'].includes(requestedStatus) || requestedStatus === record.status) return res.status(400).json({ error: 'A valid attendance record, different requested status, and reason are required.' });
    if (correctionRequests.some((item) => item.attendanceId === attendanceId && item.status === 'pending')) return res.status(409).json({ error: 'A pending correction already exists for this attendance record.' });
    const request = { id: nextId('CR', correctionRequests), attendanceId, studentId: record.studentId, subjectId: record.subjectId, requestedBy, requestedAt: new Date().toISOString(), currentStatus: record.status, requestedStatus, reason: reason.trim(), status: 'pending' };
    correctionRequests.unshift(request);
    auditLog.unshift({ id: nextId('LOG', auditLog), action: 'Correction requested', actor: currentFaculty.name, detail: `${findStudent(record.studentId).name} · ${formatSubject(record.subjectId)}`, entity: 'attendance_correction', entityId: request.id, oldValue: request.currentStatus, newValue: request.requestedStatus, reason: request.reason, timestamp: request.requestedAt });
    res.status(201).json(request);
});

app.patch('/api/corrections/:id', authenticate, allow('ADMIN'), (req, res) => {
    const request = correctionRequests.find((item) => item.id === req.params.id);
    if (!request || request.status !== 'pending' || !['approved', 'rejected'].includes(req.body.status)) return res.status(400).json({ error: 'Invalid or already reviewed correction.' });
    request.status = req.body.status;
    request.reviewedAt = new Date().toISOString();
    request.reviewComment = String(req.body.reviewComment || '').trim() || null;
    if (request.status === 'approved') {
        const record = attendance.find((item) => item.id === request.attendanceId);
        if (record && record.status === request.currentStatus) record.status = request.requestedStatus;
    }
    auditLog.unshift({ id: nextId('LOG', auditLog), action: `Correction ${request.status}`, actor: 'Admin', detail: `${findStudent(request.studentId).name} · ${formatSubject(request.subjectId)}`, entity: 'attendance_correction', entityId: request.id, oldValue: request.currentStatus, newValue: request.status === 'approved' ? request.requestedStatus : request.currentStatus, reason: request.reviewComment, timestamp: request.reviewedAt });
    res.json(request);
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.listen(PORT, () => console.log(`Smart Attendance running at http://localhost:${PORT}`));
