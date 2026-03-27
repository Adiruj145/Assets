const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzB_46oXNcauQY7Z_PaFsR7_VUMuBnJSVnz1KM0Jfj0IXrBawIySrHAbiK6klZJHpFq/exec'; 

let globalHistoryData = [];

// ====================================================
// ⏳ ฟังก์ชันแสดงสถานะกำลังโหลด (Loading State)
// ====================================================
function showLoadingState() {
    // 1. โชว์หมุนๆ ในตารางประวัติ
    const tbody = document.getElementById('allHistoryTable');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-5 text-muted">
                    <div class="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                    กำลังดึงข้อมูลจากฐานข้อมูล กรุณารอสักครู่...
                </td>
            </tr>
        `;
    }

    // 2. โชว์หมุนๆ หรือข้อความกระพริบ ในกล่องตัวเลขด้านบน
    if(document.getElementById('totalDocs')) {
        document.getElementById('totalDocs').innerHTML = '<div class="spinner-grow spinner-grow-sm text-primary" role="status"></div>';
    }
    if(document.getElementById('topDeptCount')) {
        document.getElementById('topDeptCount').innerHTML = '<small class="text-muted">กำลังคำนวณ...</small>';
    }
}


async function loadAdminData() {
    const tbody = document.getElementById('allHistoryTable');
    
    // 🌟 1. บังคับวาดสถานะกำลังโหลดลงในตารางทันที
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-5 text-primary fw-bold">
                    <div class="spinner-border spinner-border-sm me-2" role="status"></div>
                    กำลังดึงข้อมูลล่าสุดจาก Google Sheets...
                </td>
            </tr>
        `;
    }

    // 🌟 2. สั่งให้กล่องตัวเลขแสดงสถานะกำลังคำนวณ
    const docVal = document.getElementById('totalDocs');
    const userVal = document.getElementById('totalUsers');
    if (docVal) docVal.innerHTML = '<span class="spinner-grow spinner-grow-sm text-primary"></span>';
    if (userVal) userVal.innerHTML = '<span class="spinner-grow spinner-grow-sm text-info"></span>';

    try {
        // 3. เริ่มดึงข้อมูล
        const response = await fetch(SCRIPT_URL);
        if (!response.ok) throw new Error("Network response was not ok");
        
        globalHistoryData = await response.json();

        // 🌟 4. เมื่อข้อมูลมาถึง ค่อยสั่งวาดส่วนประกอบต่างๆ ทับลงไป
        renderStats();
        renderChart();
        renderAllHistory();
        
    } catch (error) {
        console.error("Error fetching admin data:", error);
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger py-4">❌ ไม่สามารถเชื่อมต่อฐานข้อมูลได้ กรุณารีเฟรชหน้าเว็บใหม่</td></tr>`;
        }
    }
}
function getDepartments() {
    const defaultDepts = ['IT', 'HK', 'FO', 'FB', 'ENG', 'AC', 'HR', 'SALES', 'SEC', 'GARDEN'];
    return JSON.parse(localStorage.getItem('kc_departments')) || defaultDepts;
}

function renderDeptDropdowns() {
    const targetIds = ['newDept', 'edit_dept']; 
    const depts = getDepartments(); 
    targetIds.forEach(id => {
        const select = document.getElementById(id);
        if (select) {
            select.innerHTML = ''; 
            depts.forEach(dept => {
                const option = document.createElement('option');
                option.value = dept;
                option.innerText = dept;
                select.appendChild(option);
            });
        }
    });
}

// ====================================================
// 📊 ส่วนแสดงผลกล่องสถิติ
// ====================================================
function renderStats() {
    const history = globalHistoryData;
    const users = JSON.parse(localStorage.getItem('kc_users_db') || '[]');

    if(document.getElementById('totalDocs')) document.getElementById('totalDocs').innerText = history.length;
    if(document.getElementById('totalUsers')) document.getElementById('totalUsers').innerText = users.length;

    if (history.length > 0) {
        const deptCounts = {};
        history.forEach(h => { 
            const d = h.dept || '-';
            deptCounts[d] = (deptCounts[d] || 0) + 1; 
        });
        
        const topDept = Object.keys(deptCounts).reduce((a, b) => deptCounts[a] > deptCounts[b] ? a : b);
        
        if(document.getElementById('topDept')) document.getElementById('topDept').innerText = topDept;
        if(document.getElementById('topDeptCount')) document.getElementById('topDeptCount').innerText = `${deptCounts[topDept]} รายการ`;
    }
}

// ====================================================
// 📊 ส่วนแสดงผลกราฟสถิติ (วงกลม + เส้น)
// ====================================================
// ====================================================
// 📊 ส่วนแสดงผลกราฟสถิติ (เวอร์ชันแยกฟังก์ชันเพื่อรองรับการเลือกวัน)
// ====================================================

// 1. ฟังก์ชันหลักที่ถูกเรียกตอนโหลดข้อมูลสำเร็จ
function renderChart() {
    const history = globalHistoryData; 
    if (history.length === 0) return;

    renderDeptChart();    // วาดกราฟวงกลม
    renderLineChart(7);   // วาดกราฟเส้น เริ่มต้นที่ 7 วัน
}

// 2. ฟังก์ชันวาดกราฟวงกลมแยกตามแผนก
function renderDeptChart() {
    const history = globalHistoryData;
    const deptCounts = {};
    history.forEach(h => { 
        const d = h.dept || '-';
        deptCounts[d] = (deptCounts[d] || 0) + 1; 
    });

    const ctxDept = document.getElementById('deptChart');
    if (ctxDept) {
        // ทำลายกราฟเก่าก่อนวาดใหม่ป้องกันบั๊กแสดงผลซ้อน
        if (window.myChartInstance) window.myChartInstance.destroy();

        window.myChartInstance = new Chart(ctxDept, {
            type: 'doughnut',
            data: {
                labels: Object.keys(deptCounts),
                datasets: [{
                    data: Object.values(deptCounts),
                    backgroundColor: ['#0d6efd', '#198754', '#ffc107', '#dc3545', '#0dcaf0', '#6610f2', '#fd7e14', '#20c997'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { 
                    legend: { position: 'bottom' } 
                },
                animation: {
                    animateRotate: true,
                    animateScale: true
                }
            }
        });
    }
}

// 3. ฟังก์ชันวาดกราฟเส้น (รองรับการเลือก 7, 15, 30 วัน)
function renderLineChart(days) {
    const history = globalHistoryData;
    const dateCounts = {};
    const now = new Date();
    const dateLabels = [];

    // สร้างแกน X (วันที่) ตามจำนวนวันที่เลือก เรียงจากอดีต -> ปัจจุบัน (ซ้ายไปขวา)
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const label = d.toLocaleDateString('th-TH', { day: '2-digit', month: 'short' });
        dateLabels.push(label);
        dateCounts[label] = 0; // ตั้งค่าเริ่มต้นเป็น 0 ทุกวัน
    }

    // นับจำนวนเอกสารจริงลงในแต่ละวัน
    history.forEach(h => {
        const dateObj = new Date(h.timestamp);
        const label = dateObj.toLocaleDateString('th-TH', { day: '2-digit', month: 'short' });
        if (dateCounts.hasOwnProperty(label)) {
            dateCounts[label]++;
        }
    });

    const ctxLine = document.getElementById('lineChart');
    if (ctxLine) {
        // ทำลายกราฟเส้นเก่าก่อนวาดใหม่เสมอ
        if (window.myLineChart) window.myLineChart.destroy();

        window.myLineChart = new Chart(ctxLine, {
            type: 'line',
            data: {
                labels: dateLabels,
                datasets: [{
                    label: 'จำนวนเอกสาร (ใบ)',
                    data: dateLabels.map(day => dateCounts[day]),
                    borderColor: '#14a3db',
                    backgroundColor: 'rgba(0, 187, 255, 0.15)',
                    borderWidth: 2,
                    tension: 0.4, // ทำให้เส้นมีความโค้งมน
                    fill: true,
                    pointRadius: days > 15 ? 2 : 4, // ถ้าวันเยอะให้จุดเล็กลง
                    pointBackgroundColor: '#1683b9'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { 
                    y: { 
                        beginAtZero: true, 
                        ticks: { stepSize: 1 } 
                    },
                    x: {
                        grid: { display: false }
                    }
                },
                animations: {
                    y: { duration: 1000, from: 500 } // เพิ่มแอนิเมชันตอนกราฟพุ่งขึ้น
                }
            }
        });
    }
}

// 4. ฟังก์ชันสำหรับปุ่มกดสลับช่วงเวลา (เรียกจาก HTML)
function updateChartRange(days, btn) {
    // 1. เปลี่ยนสถานะปุ่ม (Active)
    const buttons = btn.parentElement.querySelectorAll('.btn');
    buttons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    // 2. สั่งวาดกราฟเส้นใหม่ตามวันที่เลือก
    renderLineChart(days);
}

// ====================================================
// 👥 ส่วนจัดการ User (CRUD)
// ====================================================
//
// ====================================================
// 👥 ส่วนจัดการ User (CRUD) - แก้ไข Key เป็น 'kc_users' เพื่อให้ตรงกับ auth.js
// ====================================================
function renderUserTable() {
    // เปลี่ยนจาก 'kc_users_db' เป็น 'kc_users'
    const users = JSON.parse(localStorage.getItem('kc_users') || '[]');
    const tbody = document.getElementById('userTable');
    if(!tbody) return;

    tbody.innerHTML = '';
    users.forEach(u => {
        const tr = document.createElement('tr');
        
        let actions = '';
        if (u.role !== 'admin') {
            actions = `
                <button onclick="openEditModal(${u.id})" class="btn btn-sm btn-warning me-1">
                    <i class="bi bi-pencil-square"></i> แก้ไข
                </button>
                <button onclick="deleteUser(${u.id})" class="btn btn-sm btn-outline-danger">
                    <i class="bi bi-trash"></i> ลบ
                </button>
            `;
        } else {
            actions = '<span class="badge bg-secondary">Main Admin</span>';
        }

        tr.innerHTML = `
            <td>${u.username}</td>
            <td><span class="badge bg-info text-dark">${u.department || '-'}</span></td>
            <td>${u.role}</td>
            <td>${actions}</td>
        `;
        tbody.appendChild(tr);
    });
}

function addUser() {
    const u = document.getElementById('newUser').value;
    const p = document.getElementById('newPass').value;
    const d = document.getElementById('newDept').value; 

    if(!u || !p) return alert('กรุณากรอกข้อมูล Username และ Password');
    
    // เปลี่ยนชื่อ Key เป็น 'kc_users'
    const users = JSON.parse(localStorage.getItem('kc_users') || '[]');
    if(users.find(x => x.username === u)) return alert('ชื่อผู้ใช้นี้มีอยู่ในระบบแล้ว');

    users.push({ 
        id: Date.now(), 
        username: u, 
        password: p, 
        role: 'user', 
        department: d 
    });

    localStorage.setItem('kc_users', JSON.stringify(users)); // บันทึกลง Key ที่ถูกต้อง
    
    document.getElementById('newUser').value = '';
    document.getElementById('newPass').value = '';
    
    renderUserTable();
    renderStats();
}

function deleteUser(id) {
    if(confirm('ยืนยันลบผู้ใช้นี้ออกจากระบบ?')) {
        let users = JSON.parse(localStorage.getItem('kc_users') || '[]');
        users = users.filter(u => u.id !== id);
        localStorage.setItem('kc_users', JSON.stringify(users)); // อัปเดตข้อมูล
        renderUserTable();
        renderStats();
    }
}

// ฟังก์ชัน saveEditUser ต้องเปลี่ยนชื่อ Key ด้วยเช่นกัน
function saveEditUser() {
    const id = parseInt(document.getElementById('edit_id').value);
    const newDept = document.getElementById('edit_dept').value;
    const newPass = document.getElementById('edit_password').value.trim();

    let users = JSON.parse(localStorage.getItem('kc_users') || '[]');
    const index = users.findIndex(u => u.id === id);

    if (index !== -1) {
        users[index].department = newDept;
        if (newPass !== "") {
            users[index].password = newPass;
        }
        
        localStorage.setItem('kc_users', JSON.stringify(users)); // บันทึกลง Key ที่ถูกต้อง
        renderUserTable();
        editModalInstance.hide();
        alert('✅ อัปเดตข้อมูลเรียบร้อย');
    }
}

// ====================================================
// ✏️ ส่วน Modal แก้ไข User
// ====================================================
let editModalInstance;

function openEditModal(id) {
    const users = JSON.parse(localStorage.getItem('kc_users_db') || '[]');
    const user = users.find(u => u.id === id);
    if (!user) return;

    document.getElementById('edit_id').value = user.id;
    document.getElementById('edit_username').value = user.username;
    document.getElementById('edit_dept').value = user.department; 
    document.getElementById('edit_password').value = ''; 

    const modalEl = document.getElementById('editUserModal');
    editModalInstance = new bootstrap.Modal(modalEl);
    editModalInstance.show();
}

function saveEditUser() {
    const id = parseInt(document.getElementById('edit_id').value);
    const newDept = document.getElementById('edit_dept').value;
    const newPass = document.getElementById('edit_password').value.trim();

    let users = JSON.parse(localStorage.getItem('kc_users_db') || '[]');
    const index = users.findIndex(u => u.id === id);

    if (index !== -1) {
        users[index].department = newDept;
        if (newPass !== "") {
            users[index].password = newPass;
            alert('✅ อัปเดตข้อมูลและเปลี่ยนรหัสผ่านเรียบร้อย');
        } else {
            alert('✅ อัปเดตข้อมูลแผนกเรียบร้อย (รหัสผ่านเดิม)');
        }
        
        localStorage.setItem('kc_users_db', JSON.stringify(users));
        renderUserTable();
        editModalInstance.hide();
    }
}

// โหลดข้อมูลเมื่อเปิดหน้าเว็บ
document.addEventListener("DOMContentLoaded", () => {
    renderDeptDropdowns();
    renderUserTable();
    loadAdminData(); 
});
let viewModalInstance = null;

function viewDocDetail(index) {
    const doc = globalHistoryData[index];
    const container = document.getElementById('documentDetailContent');
    
    // จัดรูปแบบข้อมูลที่จะแสดง (ปรับตาม Column ใน Google Sheets ของคุณ)
    let detailHtml = `
        <div class="row g-3">
            <div class="col-6">
                <small class="text-muted d-block">วันเวลาที่บันทึก</small>
                <p class="fw-bold">${new Date(doc.timestamp).toLocaleString('th-TH')}</p>
            </div>
            <div class="col-6 text-end">
                <small class="text-muted d-block">สถานะ</small>
                <span class="badge bg-success">บันทึกสำเร็จ</span>
            </div>
            <hr>
            <div class="col-12">
                <small class="text-muted d-block">รายการ / ชื่อเอกสาร</small>
                <h4 class="text-primary fw-bold">${doc.item || '-'}</h4>
            </div>
            <div class="col-md-6">
                <div class="p-3 bg-light rounded-3">
                    <small class="text-muted d-block">ประเภทรายการ</small>
                    <span class="fw-bold">${doc.type || 'ทั่วไป'}</span>
                </div>
            </div>
            <div class="col-md-6">
                <div class="p-3 bg-light rounded-3">
                    <small class="text-muted d-block">ผู้ทำรายการ (User)</small>
                    <span class="fw-bold">${doc.user || 'ไม่ระบุ'}</span>
                </div>
            </div>
        </div>
    `;

    container.innerHTML = detailHtml;

    // สั่งเปิด Modal
    if (!viewModalInstance) {
        viewModalInstance = new bootstrap.Modal(document.getElementById('viewDetailModal'));
    }
    viewModalInstance.show();
}
// ====================================================
// 📜 ฟังก์ชันวาดตารางประวัติ (History Table)
// ====================================================
// แก้ไขในไฟล์ admin.js ช่วงบรรทัดที่ 300 เป็นต้นไป
function renderAllHistory() {
    const history = globalHistoryData;
    const tbody = document.getElementById('allHistoryTable');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    const displayData = [...history].reverse();

    displayData.forEach((row, index) => {
        const dateObj = new Date(row.timestamp);
        
        // 🌟 จุดสำคัญ: ต้องใส่ hour และ minute เพื่อให้หน้าเว็บโชว์เวลา
        const dateStr = dateObj.toLocaleDateString('th-TH', { 
            day: '2-digit', 
            month: '2-digit', 
            year: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });

        const formNames = { 
            'form1': 'ใบตัดสปอย', 'form2': 'ใบแจ้งซ่อมช่าง', 
            'form3': 'ใบเคลื่อนย้าย', 'form4': 'ส่งซ่อมร้านค้า', 'form5': 'ของแตกหัก' 
        };
        const formName = formNames[row.type] || row.type;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${dateStr}</td>
            <td><span class="badge bg-light text-dark fw-normal">${formName}</span></td> 
            <td class="fw-bold text-primary">${row.item || '-'}</td>
            <td><i class="bi bi-person-circle me-1"></i>${row.user || '-'}</td>
            <td class="text-end">
                <button onclick="viewDocDetail(${history.length - 1 - index})" class="btn btn-sm btn-outline-primary border-0">
                    <i class="bi bi-eye-fill"></i> ดู
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// ฟังก์ชันค้นหาในตาราง
function filterHistory() {
    const input = document.getElementById('searchInput').value.toLowerCase();
    const rows = document.querySelectorAll('#allHistoryTable tr');
    rows.forEach(row => {
        row.style.display = row.innerText.toLowerCase().includes(input) ? '' : 'none';
    });
}

// ฟังก์ชัน Export ข้อมูลเป็นไฟล์ CSV
function exportToCSV() {
    const history = globalHistoryData;
    if(history.length === 0) return alert('ไม่มีข้อมูลให้ Export');

    let csv = "\uFEFFวัน/เวลา,ประเภท,รายการ,ผู้ทำรายการ\n";
    history.forEach(r => {
        const dateStr = new Date(r.timestamp).toLocaleString('th-TH');
        csv += `"${dateStr}","${r.type || '-'}","${r.item || '-'}","${r.user || '-'}"\n`;
    });

    const link = document.createElement("a");
    link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    link.download = `History_Export_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
}