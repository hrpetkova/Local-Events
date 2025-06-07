// Ensure admin is always registered
const existingUsers = JSON.parse(localStorage.getItem('users')) || [];
const adminExists = existingUsers.some(u => u.username === 'admin');
if (!adminExists) {
    existingUsers.push({ username: 'admin', password: 'admin123' });
    localStorage.setItem('users', JSON.stringify(existingUsers));
}

const form = document.getElementById('registerForm');
const message = document.getElementById('message');

form.addEventListener('submit', e => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    if (!username || !password) return;

    let users = JSON.parse(localStorage.getItem('users')) || [];
    const exists = users.find(user => user.username === username);

    if (exists) {
    message.style.color = 'red';
    message.textContent = 'Username already exists.';
    } else {
    users.push({ username, password });
    localStorage.setItem('users', JSON.stringify(users));
    message.style.color = 'green';
    message.textContent = 'Registration successful! Redirecting to login...';
    form.reset();
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 1500);
    }
});