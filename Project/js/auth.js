//
const USERS_KEY = 'kc_users'; 
const CURRENT_USER_KEY = 'kc_current_user';

function login(username, password) {
    const localUsers = JSON.parse(localStorage.getItem(USERS_KEY)) || [];
    const defaultUsers = [{
        username: 'admin',
        password: '1234',
        name: 'IT Admin',
        department: 'IT',
        role: 'admin'
    }];

    const allUsers = [...defaultUsers, ...localUsers];

    // เช็คโดยไม่สนตัวพิมพ์เล็กใหญ่ และแปลงรหัสเป็น String เสมอ
    const user = allUsers.find(u => 
        u.username.toLowerCase() === username.toLowerCase() && 
        u.password.toString() === password.toString()
    );

    if (user) {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
        return true;
    }
    return false; 
}

function logout() {
    localStorage.removeItem(CURRENT_USER_KEY);
    window.location.href = 'login.html'; 
}

function checkAuth() {
    const user = JSON.parse(localStorage.getItem(CURRENT_USER_KEY));
    if (!user) {
        window.location.href = 'login.html';
        return null;
    }
    return user;
}

function getCurrentUser() {
    return JSON.parse(localStorage.getItem(CURRENT_USER_KEY));
}