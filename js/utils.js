/**
 * Helper umum: tampilan perangkat, modal, escape HTML, CSV
 */
// Toggle Tampilan Perangkat (HP / Desktop)
function setDeviceMode(mode) {
    const container = document.getElementById('device-container');
    const btnMobile = document.getElementById('btn-mobile');
    const btnDesktop = document.getElementById('btn-desktop');

    if (mode === 'mobile') {
        container.className = "device-frame-mobile w-full bg-slate-900 flex flex-col transition-all duration-300 relative shadow-2xl";
        btnMobile.className = "px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-l-lg border border-blue-500";
        btnDesktop.className = "px-3 py-1.5 text-xs font-medium bg-slate-900 text-slate-300 rounded-r-lg hover:bg-slate-700 border border-slate-600";
    } else {
        container.className = "device-frame-desktop w-full bg-slate-900 flex flex-col transition-all duration-300 relative shadow-2xl";
        btnDesktop.className = "px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-r-lg border border-blue-500";
        btnMobile.className = "px-3 py-1.5 text-xs font-medium bg-slate-900 text-slate-300 rounded-l-lg hover:bg-slate-700 border border-slate-600";
    }
}

function showModal(title, message, type = 'success') {
    const modal = document.getElementById('global-modal');
    const titleEl = document.getElementById('modal-title');
    const msgEl = document.getElementById('modal-message');
    const iconEl = document.getElementById('modal-icon');

    titleEl.innerText = title;
    msgEl.innerText = message;
    if (type === 'error') {
        iconEl.innerHTML = '<i class="fa-solid fa-circle-xmark text-rose-500"></i>';
    } else {
        iconEl.innerHTML = '<i class="fa-solid fa-circle-check text-emerald-400"></i>';
    }
    modal.classList.remove('hidden');
}

function closeModal() {
    document.getElementById('global-modal').classList.add('hidden');
}

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ==========================================
// HELPER CSV
// ==========================================
function downloadCSV(filename, rows) {
    const csv = '\ufeff' + rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = filename; document.body.appendChild(a); a.click(); a.remove();
}

function parseCSV(text) {
    text = text.replace(/^\ufeff/, '');
    const first = text.split(/\r?\n/)[0] || '';
    const d = first.split(';').length > first.split(',').length ? ';' : ',';
    const rows = []; let row = [], cur = '', q = false;
    const endRow = () => { row.push(cur); cur = ''; if (row.some(x => x.trim() !== '')) rows.push(row.map(x => x.trim())); row = []; };
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (q) { if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
        else if (c === '"') q = true;
        else if (c === d) { row.push(cur); cur = ''; }
        else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; endRow(); }
        else cur += c;
    }
    endRow();
    return rows;
}

const inputCls = 'w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white';
