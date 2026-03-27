// settings.js

document.addEventListener('DOMContentLoaded', () => {
    // ตรวจสอบการ Login
    const user = JSON.parse(localStorage.getItem('kc_current_user'));
    if (!user) { window.location.href = 'login.html'; return; }

    // 🛡️ ระบบซ่อน/โชว์เมนู Admin ตาม Role
    const adminRoot = document.getElementById('menu-admin-root');
    if (user.role === 'admin') {
        if (adminRoot) adminRoot.setAttribute('style', 'display: flex !important'); // โชว์ถ้าเป็น Admin
        loadDepartments();
        loadAnnouncement();
    } else {
        if (adminRoot) adminRoot.setAttribute('style', 'display: none !important'); // ซ่อนถ้าไม่ใช่ Admin
    }
    
    loadProfile();
    loadDarkMode();

    const passForm = document.getElementById('changePassForm');
    if(passForm) passForm.addEventListener('submit', changePassword);
});

// ฟังก์ชันสลับหน้าจอ (View Navigation)
function goTo(viewId) {
    if(typeof showLoading === 'function') showLoading();
    setTimeout(() => {
        document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
        document.getElementById(viewId).classList.add('active');
        window.scrollTo(0, 0); // เลื่อนไปบนสุดทุกครั้งที่เปลี่ยนหน้า
        if(typeof hideLoading === 'function') hideLoading();
    }, 300);
}

// ================= PERSONAL LOGIC =================

function toggleDarkMode() {
    const isDark = document.getElementById('darkModeSwitch').checked;
    if(isDark) document.body.classList.add('dark-mode');
    else document.body.classList.remove('dark-mode');
    localStorage.setItem('kc_theme_dark', isDark);
}

function loadDarkMode() {
    const isDark = localStorage.getItem('kc_theme_dark') === 'true';
    if(document.getElementById('darkModeSwitch')) {
        document.getElementById('darkModeSwitch').checked = isDark;
    }
    if(isDark) document.body.classList.add('dark-mode');
}

function loadProfile() {
    const user = JSON.parse(localStorage.getItem('kc_current_user'));
    const usersDB = JSON.parse(localStorage.getItem('kc_users_db') || '[]');
    const dbUser = usersDB.find(u => u.username === user.username) || user;

    if(document.getElementById('profileName')) document.getElementById('profileName').value = dbUser.displayName || dbUser.username;
    if(document.getElementById('profilePhone')) document.getElementById('profilePhone').value = dbUser.phone || '';
    if(document.getElementById('profileEmail')) document.getElementById('profileEmail').value = dbUser.email || '';
}

function saveProfile() {
    const name = document.getElementById('profileName').value;
    const phone = document.getElementById('profilePhone').value;
    const email = document.getElementById('profileEmail').value;

    let user = JSON.parse(localStorage.getItem('kc_current_user'));
    let usersDB = JSON.parse(localStorage.getItem('kc_users_db') || '[]');
    const index = usersDB.findIndex(u => u.username === user.username);

    if(index !== -1) {
        usersDB[index].displayName = name;
        usersDB[index].phone = phone;
        usersDB[index].email = email;
        localStorage.setItem('kc_users_db', JSON.stringify(usersDB));

        user.displayName = name;
        localStorage.setItem('kc_current_user', JSON.stringify(user));

        alert('✅ บันทึกข้อมูลส่วนตัวเรียบร้อย');
        goTo('view-level2-personal');
    }
}

function changePassword(e) {
    e.preventDefault();
    const oldPass = document.getElementById('oldPass').value;
    const newPass = document.getElementById('newPass').value;
    
    let user = JSON.parse(localStorage.getItem('kc_current_user'));
    let usersDB = JSON.parse(localStorage.getItem('kc_users_db') || '[]');
    const index = usersDB.findIndex(u => u.username === user.username);
    
    if (index === -1 || usersDB[index].password !== oldPass) {
        return alert('❌ รหัสผ่านเดิมไม่ถูกต้อง');
    }

    usersDB[index].password = newPass;
    localStorage.setItem('kc_users_db', JSON.stringify(usersDB));
    alert('✅ เปลี่ยนรหัสผ่านเรียบร้อย');
    document.getElementById('changePassForm').reset();
    goTo('view-level2-personal');
}

// ================= ADMIN LOGIC =================

function loadAnnouncement() {
    const announce = JSON.parse(localStorage.getItem('kc_announcement') || '{}');
    if(document.getElementById('announceText')) document.getElementById('announceText').value = announce.text || '';
    if(document.getElementById('announceActive')) document.getElementById('announceActive').checked = announce.active || false;
}

function saveAnnouncement() {
    const text = document.getElementById('announceText').value;
    const active = document.getElementById('announceActive').checked;
    localStorage.setItem('kc_announcement', JSON.stringify({ text, active, date: new Date().toLocaleString() }));
    alert('✅ บันทึกประกาศเรียบร้อย');
    goTo('view-level2-admin');
}

function loadDepartments() {
    const defaultDepts = ['IT', 'HK', 'FO', 'FB', 'ENG', 'AC', 'HR', 'SALES'];
    const currentDepts = JSON.parse(localStorage.getItem('kc_departments')) || defaultDepts;
    const deptInput = document.getElementById('deptConfig');
    if(deptInput) deptInput.value = currentDepts.join(', ');
}

function saveDepartments() {
    const rawText = document.getElementById('deptConfig').value;
    const newDepts = rawText.split(',').map(d => d.trim()).filter(d => d !== "");
    localStorage.setItem('kc_departments', JSON.stringify(newDepts));
    alert('✅ บันทึกรายชื่อแผนกเรียบร้อย');
    goTo('view-level2-admin');
}

function backupData() {
    const data = {
        users: JSON.parse(localStorage.getItem('kc_users_db')),
        departments: JSON.parse(localStorage.getItem('kc_departments')),
        announcement: JSON.parse(localStorage.getItem('kc_announcement'))
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `KC_Backup_${APP_VERSION}_${new Date().toISOString().slice(0,10)}.json`;
    link.click();
}

function restoreData() {
    const file = document.getElementById('restoreFile').files[0];
    if (!file) return alert('กรุณาเลือกไฟล์ Backup ก่อน');
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (data.users) localStorage.setItem('kc_users_db', JSON.stringify(data.users));
            if (data.departments) localStorage.setItem('kc_departments', JSON.stringify(data.departments));
            alert('✅ กู้คืนข้อมูลสำเร็จ');
            location.reload();
        } catch (error) { alert('❌ ไฟล์ไม่ถูกต้อง'); }
    };
    reader.readAsText(file);
}

function factoryReset() {
    if (confirm('ยืนยันล้างข้อมูลทั้งหมด? ข้อมูลผู้ใช้และประวัติจะหายไป (ยกเว้น Admin ปัจจุบัน)')) {
        const currentUser = JSON.parse(localStorage.getItem('kc_current_user'));
        localStorage.clear();
        localStorage.setItem('kc_users_db', JSON.stringify([currentUser]));
        localStorage.setItem('kc_current_user', JSON.stringify(currentUser));
        alert('🧹 ล้างระบบเรียบร้อย');
        location.reload();
    }
}
// เพิ่มไว้ใน DOMContentLoaded ของ setting.js
document.getElementById('display-version').innerText = APP_VERSION;
// ใน setting.js
