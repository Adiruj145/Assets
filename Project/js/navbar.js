// navbar.js
document.addEventListener("DOMContentLoaded", () => {
    const navContainer = document.getElementById("navbar-placeholder");
    if (!navContainer) return;

    const user = JSON.parse(localStorage.getItem('kc_current_user'));
    if (!user) return; // ถ้าไม่ล็อกอิน ไม่โชว์

    const currentPage = window.location.pathname.split("/").pop();
    const homeLink = user.role === 'admin' ? 'admin.html' : 'asset_form.html';

    navContainer.innerHTML = `
    <nav class="navbar navbar-expand-lg navbar-light bg-white shadow-sm mb-4">
        <div class="container">
            <a class="navbar-brand fw-bold text-primary" href="../Front/create_form.html">
                <i class="bi bi-file-earmark-text"></i> KC Asset System
            </a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav ms-auto align-items-center">
                    
                    <li class="nav-item dropdown">
                        <a class="nav-link dropdown-toggle ${currentPage.includes('create_form.html') ? 'active fw-bold text-primary' : ''}" 
                           href="#" id="createDocDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                            สร้างเอกสาร
                        </a>
                        <ul class="dropdown-menu shadow" aria-labelledby="createDocDropdown">
                            <li><a class="dropdown-item" href="create_form.html?type=form1">📝 1. ใบตัดสปอยทรัพย์สิน</a></li>
                            <li><a class="dropdown-item" href="create_form.html?type=form2">🔧 2. ใบแจ้งซ่อมช่าง</a></li>
                            <li><a class="dropdown-item" href="create_form.html?type=form3">🚚 3. ใบเคลื่อนย้ายทรัพย์สิน</a></li>
                            <li><a class="dropdown-item" href="create_form.html?type=form4">🛠️ 4. ใบส่งซ่อมร้านค้า</a></li>
                            <li><a class="dropdown-item" href="create_form.html?type=form5">💥 5. ใบแจ้งของแตกหัก</a></li>
                        </ul>
                    </li>

                    <li class="nav-item">
                        <a class="nav-link ${currentPage === 'history.html' ? 'active fw-bold text-primary' : ''}" href="history.html">ประวัติ</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link ${currentPage === 'profile.html' ? 'active fw-bold text-primary' : ''}" href="profile.html">โปรไฟล์</a>
                    </li>

                    ${user.role === 'admin' ? `
                    <li class="nav-item">
                        <a class="nav-link ${currentPage === 'admin.html' ? 'active fw-bold text-danger' : ''}" href="admin.html">⚙️ Dashboard</a>
                    </li>
                    ` : ''}

                    

                    <li class="nav-item mx-2 text-muted">|</li>

                    <li class="nav-item dropdown">
                        <a class="nav-link dropdown-toggle" href="#" id="userDropdown" role="button" data-bs-toggle="dropdown">
                            <span class="fw-bold text-dark">${user.username}</span> 
                            <span class="badge bg-secondary rounded-pill small">${user.department}</span>
                        </a>
                        <ul class="dropdown-menu dropdown-menu-end">
                            <li><a class="dropdown-item" href="profile.html">ข้อมูลส่วนตัว</a></li>
                            
                            <li><a class="dropdown-item" href="setting.html">การตั้งค่า</a></li>
                            
                            <li><hr class="dropdown-divider"></li>
                            <li><a class="dropdown-item text-danger" href="#" onclick="logout()">ออกจากระบบ</a></li>
                        </ul>
                    </li>
                </ul>
            </div>
        </div>
    </nav>
    `;
});

function logout() {
    localStorage.removeItem('kc_current_user');
    window.location.href = '../Front/login.html';
}
// เพิ่มโค้ดนี้ใน navbar.js
document.addEventListener('DOMContentLoaded', () => {
    // เช็คค่าจาก localStorage ที่บันทึกไว้จากหน้า setting
    const isDark = localStorage.getItem('kc_theme_dark') === 'true';
    if (isDark) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
});

// ป้องกันการคลิกขวา
document.addEventListener('contextmenu', event => event.preventDefault());

// ป้องกันปุ่ม F12 และ Ctrl+Shift+I
// document.onkeydown = function(e) {
//     if(e.keyCode == 123) return false; // F12
//     if(e.ctrlKey && e.shiftKey && e.keyCode == 'I'.charCodeAt(0)) return false;
// };
const APP_VERSION = 'v1.0.4'; // กำหนดเลขเวอร์ชันตรงนี้ที่เดียว