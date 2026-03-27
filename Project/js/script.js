// =======================================================
// 1. การตั้งค่าเริ่มต้น และตัวแปรส่วนกลาง
// =======================================================
const { PDFDocument, rgb } = PDFLib;
const fontUrl = '../Prompt-Regular.ttf'; 

let currentPdfDoc = null; 
let lastMainItem = "เอกสาร";

function getVal(id) {
    const el = document.getElementById(id);
    return el ? el.value : '';
}

const fill = (name, val, fontSize = 13) => { 
    try { 
        const field = form.getTextField(name);
        if(field && val) { 
            field.setText(val); 
            field.setFontSize(fontSize);
            
            // 🌟 แก้ตรงนี้: สั่งลบสีพื้นหลัง (Background) ออกให้เป็นโปร่งใส
            field.updateAppearances(customFont);
            
            // เพิ่มบรรทัดนี้เพื่อความชัวร์ในบาง Browser
            const widgets = field.acroField.getWidgets();
            widgets.forEach((widget) => {
                widget.setAppearanceCharacteristics({ backgroundColor: undefined }); // ลบสีพื้นหลัง
            });
        }
    } catch(e) {} 
};

// =======================================================
// 2. ฟังก์ชันหลักสำหรับเตรียมข้อมูล PDF
// =======================================================
async function preparePdfData() {
    const user = JSON.parse(localStorage.getItem('kc_current_user'));
    const selector = document.getElementById('docTypeSelect'); 
    const type = selector ? selector.value : 'form1'; 

    const fileMap = {
        'form1': '../File/1.pdf', 'form2': '../File/2.pdf', 
        'form3': '../File/3.pdf', 'form4': '../File/4.pdf', 'form5': '../File/5.pdf'
    };
    const fileName = fileMap[type] || '../File/1.pdf';
    
    const response = await fetch(fileName);
    if (!response.ok) throw new Error(`หาไฟล์ PDF ไม่เจอในระบบ: ${fileName}`);
    
    const pdfBytes = await response.arrayBuffer();
    const pdfDoc = await PDFDocument.load(pdfBytes);
    pdfDoc.registerFontkit(fontkit);
    
    const fontRes = await fetch(fontUrl);
    const customFont = await pdfDoc.embedFont(await fontRes.arrayBuffer());
    const form = pdfDoc.getForm();

    const fill = (name, val, fontSize = 20) => { 
        try { 
            const field = form.getTextField(name);
            if(field && val) { 
                field.setText(val); 
                field.setFontSize(fontSize);
                field.updateAppearances(customFont); 
            }
        } catch(e) {} 
    };

    // --- Header ---
    fill('date', new Date().toLocaleDateString('th-TH'));
    fill('dept', user ? user.department : '-');
    fill('user', user ? (user.displayName || user.username) : '-');
    fill('user', user ? user.location : '-');

    // --- Logic แยกตามฟอร์ม ---
    // Form 1
    if (type === 'form1') {
        fill('f1_dept', getVal('f1_dept'));
        fill('f1_date', getVal('f1_date'));
        
        ['broken','expired','cost','cancel'].forEach(k => {
            const el = document.getElementById(`f1_chk_${k}`);
            if(el && el.checked) {
                try { form.getCheckBox(`f1_chk_${k}`).check(); } catch(e) {}
            }
        });

        ['assets','dept','buy'].forEach(k => {
            const el = document.getElementById(`f1_chk_${k}`);
            if(el && el.checked) {
                try { form.getCheckBox(`f1_chk_${k}`).check(); } catch(e) {}
            }
        });
        
        document.querySelectorAll('#tbl_f1_damaged_broken tbody tr').forEach((row, idx) => {
            const inputs = row.querySelectorAll('input');
            const i = idx + 1;
            fill(`f1_num_${i}`, inputs[0]?.value);
            fill(`f1_item_${i}`,     inputs[1]?.value);
            fill(`f1_serial_${i}`,   inputs[2]?.value);
            fill(`f1_code_${i}`,     inputs[3]?.value);
            fill(`f1_room${i}`,      inputs[4]?.value);
            if(idx === 0) lastMainItem = inputs[1]?.value;
        });

        document.querySelectorAll('#tbl_f1_damaged_expired tbody tr').forEach((row, idx) => {
            const inputs = row.querySelectorAll('input');
            const i = idx + 1;
            fill(`f1_num_new_${i}`,  inputs[0]?.value);
            fill(`f1_item_new_${i}`, inputs[1]?.value);
            fill(`f1_serial_new_${i}`, inputs[2]?.value);
            fill(`f1_code_new_${i}`,   inputs[3]?.value);
            fill(`f1_roomn${i}`,      inputs[4]?.value); 
        });
    }

    //
    else if (type === 'form2') {
    // 1. เติมข้อมูลส่วนหัว (Header)
    fill('f2_user', getVal('f2_user')); // ผู้แจ้งซ่อม
    fill('f2_dept', getVal('f2_dept')); // แผนก
    fill('f2_location',  getVal('f2_location'));  // สถานที่
    fill('f2_date', getVal('f2_date')); // วันที่
    fill('f2_desc', getVal('f2_desc', 14));

    lastMainItem = "ใบแจ้งซ่อมช่าง";
    }
    // Form 3
    else if (type === 'form3') {
        fill('date', getVal('f3_date'));
        fill('dept', getVal('f3_dept'));

        ['change','transfer','maid','store','borrow'].forEach(k => {
            const el = document.getElementById(`f3_chk_${k}`);
            if(el && el.checked) {
                try { form.getCheckBox(`f3_chk_${k}`).check(); } catch(e) {}
            }
        });

        ['repair','no_item','other'].forEach(k => {
            const el = document.getElementById(`f3_chk_reason_${k}`);
            if(el && el.checked) {
                try { form.getCheckBox(`f3_chk_reason_${k}`).check(); } catch(e) {}
            }
        });
        
        document.querySelectorAll('#tbl_f3_items_old tbody tr').forEach((row, idx) => {
            const inputs = row.querySelectorAll('input');
            const i = idx + 1;
            fill(`num_${i}`, inputs[0]?.value);
            fill(`old_item_${i}`, inputs[1]?.value);
            fill(`old_sn_${i}`,   inputs[2]?.value);
            fill(`old_code_${i}`,   inputs[3]?.value);
            fill(`old_from_${i}`, inputs[4]?.value);
            fill(`old_to_${i}`,   inputs[5]?.value);
            if(idx === 0) lastMainItem = inputs[1]?.value;
        });

        document.querySelectorAll('#tbl_f3_items_new tbody tr').forEach((row, idx) => {
            const inputs = row.querySelectorAll('input');
            const i = idx + 1;
            fill(`numN_${i}`, inputs[0]?.value);
            fill(`new_item_${i}`, inputs[1]?.value);
            fill(`new_sn_${i}`,   inputs[2]?.value);
            fill(`new_code_${i}`,   inputs[3]?.value);
            fill(`new_from_${i}`, inputs[4]?.value);
            fill(`new_to_${i}`,   inputs[5]?.value);
        });
    }
    // Form 4
    else if (type === 'form4') {
        fill('f4_date', getVal('f4_date'));
        fill('f4_user', getVal('f4_user'));
        fill('f4_dept', getVal('f4_dept'));
        fill('f4_location',  getVal('f4_location'));
        fill('f4_other_desc', getVal('f4_other_desc'));
        
        ['no','none','other'].forEach(k => {
            const el = document.getElementById(`f4_${k}`);
            if(el && el.checked) {
                try { form.getCheckBox(`f4_${k}`).check(); } catch(e) {}
            }
        });

        document.querySelectorAll('#tbl_f4_items tbody tr').forEach((row, idx) => {
            const inputs = row.querySelectorAll('input');
            const i = idx + 1;
            fill(`f4_num_${i}`,  inputs[0]?.value);
            fill(`f4_item_${i}`, inputs[1]?.value);
            fill(`f4_prob_${i}`, inputs[2]?.value);
            if(idx === 0) lastMainItem = inputs[1]?.value;
        });
    }
    // Form 5
    else if (type === 'form5') {
        // 1. เติมข้อมูลส่วนหัว
        fill('f5_dept', getVal('f5_dept'));     // แผนก
        fill('f5_outlet', getVal('f5_outlet')); // OUTLET
        fill('f5_date', getVal('f5_date'));   // ระหว่างวันที่

        // 2. จัดการ Checkbox ประเภทของที่แตกหัก (ถ้ามี)
        ['plate', 'spoon', 'cloth', 'other'].forEach(k => {
            const el = document.getElementById(`f5_chk_${k}`);
            if (el && el.checked) {
                try { 
                    // ชื่อ Field ใน PDF ต้องตั้งให้ตรงกับ chk_plate, chk_spoon เป็นต้น
                    form.getCheckBox(`f5_chk_${k}`).check(); 
                } catch (e) { console.log("หา Checkbox ไม่เจอ: " + k); }
            }
        });

        // 3. ดึงข้อมูลจากตารางรายการของแตกหัก
        const rows = document.querySelectorAll('#tbl_f5_items tbody tr');
        rows.forEach((row, idx) => {
            const inputs = row.querySelectorAll('input');
            const i = idx + 1; // ลำดับ 1, 2, 3...
            
            // เติมค่าลงในฟิลด์ PDF (ต้องตั้งชื่อฟิลด์ใน PDF เป็น f5_date_1, f5_item_1, f5_qty_1)
            fill(`f5_date_item_${i}`, inputs[0]?.value); // วัน/เดือน/ปี
            fill(`f5_mainitem_${i}`, inputs[1]?.value); // รายการ
            fill(`f5_count_${i}`,  inputs[2]?.value); // จำนวนชิ้น
            
            // ใช้รายการแรกตั้งเป็นชื่อไฟล์
            if (idx === 0) lastMainItem = inputs[1]?.value || "ของแตกหัก";
        });
    }
    // --- ระบบจัดการรูปภาพแนบท้าย ---
    const fileInput = document.getElementById('attach_img');
    if (fileInput && fileInput.files.length > 0) {
        let currentPage;
        const A4_WIDTH = 595.28;
        const A4_HEIGHT = 841.89;

        for (let i = 0; i < fileInput.files.length; i++) {
            const file = fileInput.files[i];
            const arrayBuffer = await file.arrayBuffer();
            let pdfImage;

            if (file.type === 'image/png') {
                pdfImage = await pdfDoc.embedPng(arrayBuffer);
            } else {
                pdfImage = await pdfDoc.embedJpg(arrayBuffer);
            }

            if (pdfImage) {
                if (i % 2 === 0) currentPage = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
                const imgDims = pdfImage.scaleToFit(500, 350);
                const xPos = (A4_WIDTH - imgDims.width) / 2;
                const yPos = (i % 2 === 0) ? 430 : 50;
                currentPage.drawImage(pdfImage, { x: xPos, y: yPos, width: imgDims.width, height: imgDims.height });
            }
        }
    }

    return pdfDoc;
}

// =======================================================
// 3. ระบบแสดงตัวอย่างในแท็บใหม่ (New Tab Preview)
// =======================================================
async function startPreview() {
    try {
        // แสดง Loading ระหว่างเตรียมไฟล์
        Swal.fire({ 
            title: 'กำลังเตรียมเอกสาร...', 
            allowOutsideClick: false, 
            didOpen: () => Swal.showLoading() 
        });
        
        currentPdfDoc = await preparePdfData(); 
        const pdfBytes = await currentPdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const pdfUrl = URL.createObjectURL(blob);
        
        Swal.close();

        // 🌟 สั่งเปิดแท็บใหม่
        const previewWindow = window.open('', '_blank');
        if (!previewWindow) {
            Swal.fire('แจ้งเตือน', 'เบราว์เซอร์ของคุณบล็อก Pop-up กรุณากดอนุญาตที่มุมขวาบนของช่อง URL', 'warning');
            return;
        }

        // 🌟 ดึงค่าประเภทฟอร์มปัจจุบันมาใช้ในสคริปต์ของหน้าใหม่
        const currentType = document.getElementById('docTypeSelect').value;

        // 🌟 สร้างหน้าเว็บสำหรับ Preview พร้อมปุ่ม Print
        previewWindow.document.write(`
            <!DOCTYPE html>
            <html lang="th">
            <head>
                <meta charset="UTF-8">
                <title>ตรวจสอบเอกสาร - KC Asset System</title>
                <style>
                    body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #525659; display: flex; flex-direction: column; height: 100vh; }
                    .top-bar { background-color: #212529; padding: 12px 25px; display: flex; justify-content: space-between; align-items: center; color: white; box-shadow: 0 4px 8px rgba(0,0,0,0.4); z-index: 100; }
                    .btn-group { display: flex; gap: 12px; }
                    .btn-print { background-color: #0dcaf0; color: #000; border: none; padding: 10px 24px; font-size: 15px; border-radius: 6px; cursor: pointer; font-weight: bold; transition: 0.2s; }
                    .btn-print:hover { background-color: #0bacce; }
                    .btn-save { background-color: #198754; color: white; border: none; padding: 10px 24px; font-size: 15px; border-radius: 6px; cursor: pointer; font-weight: bold; transition: 0.2s; }
                    .btn-save:hover { background-color: #157347; }
                    .btn-cancel { background: transparent; color: #fff; border: 1px solid #666; padding: 8px 16px; border-radius: 6px; cursor: pointer; transition: 0.2s; }
                    .btn-cancel:hover { background: rgba(255,255,255,0.1); }
                    iframe { flex-grow: 1; border: none; width: 100%; }
                </style>
            </head>
            <body>
                <div class="top-bar">
                    <h3 style="margin: 0; font-size: 1.2rem;">🔍 ตรวจสอบความถูกต้องก่อนดำเนินการ</h3>
                    <div class="btn-group">
                        <button class="btn-cancel" onclick="window.close()">❌</button>
                        
                        <button class="btn-print" id="btnPrint">🖨️</button>
                        
                        <button class="btn-save" id="btnConfirm">✅</button>
                    </div>
                </div>
                
                <iframe id="pdfFrame" src="${pdfUrl}#toolbar=0"></iframe>
                
                <script>
                    // ฟังก์ชันสำหรับปุ่มปริ้น
                    document.getElementById('btnPrint').addEventListener('click', function() {
                        const frame = document.getElementById('pdfFrame');
                        frame.contentWindow.focus();
                        frame.contentWindow.print(); // สั่งปริ้นเนื้อหาใน iframe
                        
                        // บันทึกข้อมูลเข้า Google Sheets ทันทีที่มีการสั่งปริ้น
                        if(window.opener && !window.opener.closed) {
                            window.opener.saveToCloud("${currentType}", window.opener.lastMainItem);
                        }
                    });

                    // ฟังก์ชันสำหรับปุ่มยืนยันและดาวน์โหลด
                    document.getElementById('btnConfirm').addEventListener('click', function() {
                        this.innerText = "กำลังดาวน์โหลด...";
                        this.disabled = true;
                        
                        if(window.opener && !window.opener.closed) {
                            window.opener.finalDownload(); // สั่งให้หน้าหลักโหลดไฟล์และส่งข้อมูล
                        }
                        
                        setTimeout(() => { window.close(); }, 1500); 
                    });
                </script>
            </body>
            </html>
        `);
        previewWindow.document.close();

    } catch (err) {
        Swal.fire('Error', 'ไม่สามารถสร้างตัวอย่างได้: ' + err.message, 'error');
        console.error(err);
    }
}

// =======================================================
// 4. ระบบดาวน์โหลดและส่งข้อมูลเข้า DB
// =======================================================
async function finalDownload() {
    if (!currentPdfDoc) return;

    try {
        const pdfBytes = await currentPdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);

        const user = JSON.parse(localStorage.getItem('kc_current_user'));
        const fileDate = new Date().toLocaleDateString('th-TH').replace(/\//g, '-');
        const deptName = user ? user.department : 'Unknown';
        
        link.download = `[${deptName}]_${fileDate}_${lastMainItem}.pdf`;
        link.click();
        
        // ☁️ ส่งข้อมูลเข้า Google Sheets
        const type = document.getElementById('docTypeSelect').value;
        saveToCloud(type, lastMainItem);

        Swal.fire('สำเร็จ', 'บันทึกข้อมูลและดาวน์โหลดเอกสารเรียบร้อย', 'success');

    } catch (err) {
        Swal.fire('Error', 'การดาวน์โหลดล้มเหลว: ' + err.message, 'error');
    }
}

// =======================================================
// 5. ระบบบันทึกข้อมูลออนไลน์ (Cloud Sync)
// =======================================================
async function saveToCloud(type, mainItem) {
    const userObj = JSON.parse(localStorage.getItem('kc_current_user')) || {};
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzB_46oXNcauQY7Z_PaFsR7_VUMuBnJSVnz1KM0Jfj0IXrBawIySrHAbiK6klZJHpFq/exec'; 

    const dataToSend = {
        type: type,
        user: userObj.displayName || userObj.username || 'Guest',
        dept: userObj.department || '-',
        main_item: mainItem,
        detail: "บันทึกจากระบบ Preview",
        timestamp: new Date().toISOString()
    };

    fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
    })
    .then(() => console.log("Cloud: บันทึกประวัติสำเร็จ"))
    .catch(error => console.error('Cloud Error:', error));
}