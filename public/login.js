const token = localStorage.getItem('attendance_token');
if (token) window.location.replace('/');

const accounts = {
    admin: ['admin@northstar.edu', 'Admin@123'],
    faculty: ['faculty@northstar.edu', 'Faculty@123'],
    student: ['student@northstar.edu', 'Student@123']
};

document.querySelectorAll('[data-page-demo]').forEach((button) => button.addEventListener('click', () => {
    const [email, password] = accounts[button.dataset.pageDemo];
    document.querySelector('#page-login-email').value = email;
    document.querySelector('#page-login-password').value = password;
    document.querySelector('#page-login-error').textContent = '';
}));

document.querySelector('#page-login-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const error = document.querySelector('#page-login-error');
    const submit = document.querySelector('.login-submit');
    error.textContent = '';
    submit.disabled = true;
    submit.textContent = 'Signing in...';
    try {
        const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: document.querySelector('#page-login-email').value.trim(), password: document.querySelector('#page-login-password').value }) });
        const body = await response.json();
        if (!response.ok) { error.textContent = body.error || 'Invalid email or password.'; return; }
        localStorage.setItem('attendance_token', body.token);
        window.location.replace('/');
    } catch {
        error.textContent = 'Unable to connect to the attendance server.';
    } finally {
        submit.disabled = false;
        submit.innerHTML = 'Sign in <span>→</span>';
    }
});
