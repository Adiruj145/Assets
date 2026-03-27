// loader.js - ระบบหน้าโหลดอัตโนมัติทุกหน้า

document.addEventListener("DOMContentLoaded", () => {
    // 1. สร้าง HTML และ CSS ของหน้าโหลด
    injectLoader();

    // 2. สั่งให้หายไปเมื่อโหลดหน้าเว็บเสร็จ (หน่วงเวลา 0.5 วิ เพื่อความนุ่มนวล)
    window.addEventListener('load', () => {
        setTimeout(() => {
            hideLoading();
        }, 500);
    });

    // 3. ดักจับการกดลิงก์ (<a>) เพื่อโชว์หน้าโหลดก่อนเปลี่ยนหน้า
    document.body.addEventListener('click', (e) => {
        // หาว่าเป็นลิงก์ หรือปุ่มที่มีลิงก์ไหม
        const link = e.target.closest('a');
        
        if (link) {
            const href = link.getAttribute('href');
            const target = link.getAttribute('target');

            // เงื่อนไข: ต้องเป็นลิงก์จริง, ไม่ใช่ #, ไม่ใช่ javascript, และไม่เปิด tab ใหม่
            if (href && href !== '#' && !href.startsWith('javascript') && target !== '_blank') {
                showLoading(); // โชว์หน้าโหลดทันที
            }
        }
    });
});

// ================= ฟังก์ชันหลัก =================

function injectLoader() {
    // สร้าง Style (CSS)
    const style = document.createElement('style');
    style.innerHTML = `
        #global-loader {
            position: fixed;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background-color: rgba(255, 255, 255, 0.95);
            z-index: 99999; /* อยู่บนสุดของทุกสิ่ง */
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            transition: opacity 0.3s ease;
        }
        .loader-hidden {
            opacity: 0;
            pointer-events: none; /* กดทะลุได้เมื่อซ่อน */
        }
        .spinner-custom {
            width: 3.5rem; height: 3.5rem;
            border: 0.3em solid #e9ecef;
            border-top: 0.3em solid #0d6efd; /* สีฟ้า */
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .blink-text { animation: blink 1.5s infinite; }
        @keyframes blink { 50% { opacity: 0.5; } }
    `;
    document.head.appendChild(style);

    // สร้าง Element (HTML)
    const loaderDiv = document.createElement('div');
    loaderDiv.id = 'global-loader';
    loaderDiv.innerHTML = `
        <div class="spinner-custom mb-3"></div>
        <h6 class="fw-bold text-secondary blink-text">กำลังประมวลผล...</h6>
    `;
    document.body.prepend(loaderDiv);
}

// สั่งโชว์
function showLoading() {
    const loader = document.getElementById('global-loader');
    if (loader) {
        loader.classList.remove('loader-hidden');
        loader.style.display = 'flex';
    }
}

// สั่งซ่อน
function hideLoading() {
    const loader = document.getElementById('global-loader');
    if (loader) {
        loader.classList.add('loader-hidden');
        // รอให้ Fade จบก่อนค่อยซ่อน display
        setTimeout(() => {
            loader.style.display = 'none';
        }, 300);
    }
}