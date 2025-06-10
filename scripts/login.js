//the user system works with local storage. technically not a good solution, since that info shouldnt be on the users system, but since we are working without a proper database it should be fine
let users = JSON.parse(localStorage.getItem('users')) || [];
const adminExists = users.some(u => u.username === 'admin');
//default admin login info
if (!adminExists) {
    users.push({ username: 'admin', password: 'admin123' });
    localStorage.setItem('users', JSON.stringify(users));
}

const form = document.getElementById('loginForm');
const message = document.getElementById('message');

//login by checking if login data is in the localstorage
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