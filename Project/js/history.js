// ⚠️ เปลี่ยน URL นี้เป็นลิงก์ Web App ล่าสุดของคุณ
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzB_46oXNcauQY7Z_PaFsR7_VUMuBnJSVnz1KM0Jfj0IXrBawIySrHAbiK6klZJHpFq/exec'; 

// ==========================================
// 1. ฟังก์ชันดึงข้อมูลจาก Google Sheets มาแสดง
// ==========================================
async function loadHistory() {
    const tbody = document.getElementById('historyTableBody');
    
    // 🌟 1. ดึงข้อมูล User ที่กำลัง Login อยู่ปัจจุบัน
    const currentUser = JSON.parse(localStorage.getItem('kc_current_user')) || {};
    const myUsername = currentUser.username; // ดึงชื่อผู้ใช้ของเรามา
    const myRole = currentUser.role; // เช็คระดับสิทธิ์

    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-5 text-muted"><div class="spinner-border spinner-border-sm text-primary me-2" role="status"></div>กำลังโหลดข้อมูลประวัติของคุณ...</td></tr>`;

    try {
        const response = await fetch(SCRIPT_URL);
        if (!response.ok) throw new Error("Network response was not ok");
        
        const data = await response.json();
        tbody.innerHTML = ''; 

        // 🌟 2. กรองข้อมูล: ถ้าไม่ใช่ Admin ให้เห็นเฉพาะรายการที่เป็นของตัวเอง (row.user == myUsername)
        const myData = data.filter(row => {
            if (myRole === 'admin') return true; // แอดมินเห็นทั้งหมด
            return row.user === myUsername; // ยูสเซอร์ทั่วไปเห็นเฉพาะชื่อตัวเองตรงกัน
        });

        if (!myData || myData.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center py-5 text-muted"><i class="bi bi-inbox fs-1 d-block mb-2"></i>ไม่พบประวัติการสร้างเอกสารของคุณ</td></tr>`;
            return;
        }

        // 3. นำข้อมูลที่กรองแล้วมาสร้างตาราง (ส่วนเดิมของคุณ)
                myData.forEach(row => {
                const dateObj = new Date(row.timestamp);
                
                // 🌟 ใส่ hour และ minute กลับเข้าไปเพื่อให้ยูสเซอร์เห็นเวลา
                const dateStr = dateObj.toLocaleDateString('th-TH', { 
                    day: '2-digit', month: '2-digit', year: '2-digit', 
                    hour: '2-digit', minute: '2-digit' 
                });

                // ... ส่วนที่เหลือคงเดิม ...

            const formNames = { 
                'form1': 'ใบตัดสปอย', 'form2': 'ใบแจ้งซ่อมช่าง', 
                'form3': 'ใบเคลื่อนย้าย', 'form4': 'ส่งซ่อมร้านค้า', 'form5': 'ของแตกหัก' 
            };
            const formName = formNames[row.type] || row.type;

            const imgBtn = (row.image && row.image !== "-" && row.image !== "") 
                ? `<a href="${row.image}" target="_blank" class="btn btn-sm btn-outline-primary shadow-sm"><i class="bi bi-image"></i> ดูรูป</a>` 
                : `<span class="badge bg-light text-muted border">ไม่มีรูป</span>`;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="small text-muted">${dateStr}</td>
                <td><span class="badge bg-info text-dark">${formName}</span></td>
                <td>
                    <span class="fw-bold text-dark">${row.item}</span> <br>
                    <small class="text-secondary"><i class="bi bi-building"></i> แผนก: ${row.dept}</small>
                </td>
                <td><i class="bi bi-person-circle text-muted"></i> ${row.user}</td>
                <td class="text-center">${imgBtn}</td>
            `;
            tbody.appendChild(tr);
        });

    } catch (error) {
        console.error("Error fetching history:", error);
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-5 text-danger">⚠️ โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่</td></tr>`;
    }
}

// ==========================================
// 2. ฟังก์ชันค้นหาข้อมูล (Search)
// ==========================================
function filterHistory() {
    const input = document.getElementById("searchInput").value.toLowerCase();
    const trs = document.querySelectorAll("#historyTableBody tr");

    trs.forEach(tr => {
        // ป้องกันไม่ให้ไปซ่อน/ค้นหา แถวที่เป็นข้อความแจ้งเตือน (กรณีไม่มีประวัติหรือ Error)
        if (tr.querySelector('.bi-inbox') || tr.querySelector('.bi-exclamation-triangle')) {
            return;
        }
        
        const text = tr.innerText.toLowerCase();
        tr.style.display = text.includes(input) ? "" : "none";
    });
}

// ==========================================
// สั่งให้ดึงข้อมูลอัตโนมัติ ทันทีที่เปิดหน้าเว็บเสร็จ
// ==========================================
document.addEventListener("DOMContentLoaded", loadHistory);

