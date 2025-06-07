let users = JSON.parse(localStorage.getItem('users')) || [];
const adminExists = users.some(u => u.username === 'admin');
if (!adminExists) {
    users.push({ username: 'admin', password: 'admin123' });
    localStorage.setItem('users', JSON.stringify(users));
}

const form = document.getElementById('loginForm');
const message = document.getElementById('message');

form.addEventListener('submit', e => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    const updatedUsers = JSON.parse(localStorage.getItem('users')) || [];
    const found = updatedUsers.find(user => user.username === username && user.password === password);

    if (found) {
    localStorage.setItem('currentUser', username);
    message.style.color = 'green';
    message.textContent = 'Login successful! Redirecting...';
    setTimeout(() => {
        window.location.href = '../index.html';

    }, 1000);
    } else {
    message.textContent = 'Invalid username or password.';
    }
});