const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');

const baseUrl = 'http://127.0.0.1:3210';
let server;

async function request(path, options = {}) {
    const response = await fetch(`${baseUrl}${path}`, options);
    const body = await response.json();
    return { status: response.status, body };
}

async function waitForServer() {
    for (let attempt = 0; attempt < 100; attempt += 1) {
        try { await fetch(`${baseUrl}/api/bootstrap`); return; } catch { await new Promise((resolve) => setTimeout(resolve, 100)); }
    }
    throw new Error('Test server did not start.');
}

(async () => {
    server = spawn(process.execPath, ['server.js'], { cwd: require('node:path').join(__dirname, '..'), env: { ...process.env, PORT: '3210', JWT_SECRET: 'test-secret' }, stdio: 'ignore' });
    try {
        await waitForServer();
        const invalidLogin = await request('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'admin@northstar.edu', password: 'wrong' }) });
        assert.equal(invalidLogin.status, 401);

        const login = await request('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'admin@northstar.edu', password: 'Admin@123' }) });
        assert.equal(login.status, 200);
        const token = login.body.token;
        const auth = { Authorization: `Bearer ${token}` };
        const facultyLogin = await request('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'faculty@northstar.edu', password: 'Faculty@123' }) });
        const facultyAuth = { Authorization: `Bearer ${facultyLogin.body.token}` };

        const bootstrap = await request('/api/bootstrap');
        assert.equal(bootstrap.body.students.length, 5000);
        assert.equal(bootstrap.body.faculty.length, 500);

        const lowAttendance = await request('/api/reports/low-attendance', { headers: auth });
        assert.equal(lowAttendance.status, 200);
        const subjectReport = await request('/api/reports/subject', { headers: auth });
        assert.equal(subjectReport.status, 200);

        const firstAttendance = await request('/api/attendance', { method: 'POST', headers: { ...facultyAuth, 'Content-Type': 'application/json' }, body: JSON.stringify({ subjectId: 'SUB-301', date: '2026-09-30', markedBy: 'FAC-201', records: [{ studentId: 'STU-1001', status: 'present' }] }) });
        assert.equal(firstAttendance.status, 201);
        const duplicate = await request('/api/attendance', { method: 'POST', headers: { ...facultyAuth, 'Content-Type': 'application/json' }, body: JSON.stringify({ subjectId: 'SUB-301', date: '2026-09-30', markedBy: 'FAC-201', records: [{ studentId: 'STU-1001', status: 'absent' }] }) });
        assert.equal(duplicate.status, 409);

        const correction = await request('/api/corrections', { method: 'POST', headers: { ...facultyAuth, 'Content-Type': 'application/json' }, body: JSON.stringify({ attendanceId: 'ATT-1', requestedBy: 'FAC-201', requestedStatus: 'absent', reason: 'Correction test' }) });
        assert.equal(correction.status, 201);
        const duplicateCorrection = await request('/api/corrections', { method: 'POST', headers: { ...facultyAuth, 'Content-Type': 'application/json' }, body: JSON.stringify({ attendanceId: 'ATT-1', requestedBy: 'FAC-201', requestedStatus: 'absent', reason: 'Duplicate correction test' }) });
        assert.equal(duplicateCorrection.status, 409);
        const rejected = await request(`/api/corrections/${correction.body.id}`, { method: 'PATCH', headers: { ...auth, 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'rejected', reviewComment: 'Not enough evidence' }) });
        assert.equal(rejected.body.status, 'rejected');
        const approvedCorrection = await request('/api/corrections', { method: 'POST', headers: { ...facultyAuth, 'Content-Type': 'application/json' }, body: JSON.stringify({ attendanceId: 'ATT-2', requestedBy: 'FAC-201', requestedStatus: 'absent', reason: 'Approved correction test' }) });
        assert.equal(approvedCorrection.status, 201);
        const approved = await request(`/api/corrections/${approvedCorrection.body.id}`, { method: 'PATCH', headers: { ...auth, 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'approved', reviewComment: 'Verified by admin' }) });
        assert.equal(approved.body.status, 'approved');
        const attendanceAfterApproval = await request('/api/attendance');
        assert.equal(attendanceAfterApproval.body.find((record) => record.id === 'ATT-2').status, 'absent');

        const studentLogin = await request('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'student@northstar.edu', password: 'Student@123' }) });
        const studentOnly = await request('/api/students/me/attendance', { headers: { Authorization: `Bearer ${studentLogin.body.token}` } });
        assert.equal(studentOnly.status, 200);
        const forbidden = await request('/api/admin/summary', { headers: { Authorization: `Bearer ${studentLogin.body.token}` } });
        assert.equal(forbidden.status, 403);
        const unauthorizedWrite = await request('/api/attendance', { method: 'POST', headers: { Authorization: `Bearer ${studentLogin.body.token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ subjectId: 'SUB-301', date: '2026-10-01', markedBy: 'FAC-201', records: [{ studentId: 'STU-1001', status: 'present' }] }) });
        assert.equal(unauthorizedWrite.status, 403);
        console.log('API tests passed: authentication, scale, reports, corrections, and role protection.');
    } finally {
        if (server) server.kill();
    }
})().catch((error) => { console.error(error); if (server) server.kill(); process.exitCode = 1; });
