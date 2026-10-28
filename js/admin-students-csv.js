/**
 * Admin: upload data siswa via CSV
 */
function downloadStudentTemplate() {
    downloadCSV('template_siswa.csv', [['nisn', 'name', 'kelas', 'pin'], ['0081234567', 'Contoh Nama Siswa', 'XI TKJ', '12345']]);
}

async function importStudentsCSV(input) {
    const file = input.files[0]; input.value = '';
    if (!file) return;
    const rows = parseCSV(await file.text());
    if (rows.length < 2) { showModal('CSV Kosong', 'File tidak berisi data. Gunakan kolom: nisn, name, kelas, pin.', 'error'); return; }
    const head = rows[0].map(h => h.toLowerCase());
    const idx = k => head.indexOf(k);
    const hasHeader = idx('nisn') >= 0;
    const col = hasHeader ? { nisn: idx('nisn'), name: idx('name') >= 0 ? idx('name') : idx('nama'), kelas: idx('kelas'), pin: idx('pin') } : { nisn: 0, name: 1, kelas: 2, pin: 3 };
    if (col.name < 0 || col.kelas < 0) { showModal('Format CSV Salah', 'Kolom wajib: nisn, name, kelas (pin opsional).', 'error'); return; }

    const seen = new Set(), valid = []; let invalid = 0, dupFile = 0;
    rows.slice(hasHeader ? 1 : 0).forEach(r => {
        const nisn = (r[col.nisn] || '').trim(), name = (r[col.name] || '').trim(), kelas = (r[col.kelas] || '').trim();
        const pin = col.pin >= 0 && r[col.pin] ? r[col.pin].trim() : '12345';
        if (!nisn || !name || !kelas) { invalid++; return; }
        if (seen.has(nisn)) { dupFile++; return; }
        seen.add(nisn); valid.push({ nisn, name, kelas, pin });
    });

    let existing = new Set();
    if (supabaseClient) {
        const { data } = await supabaseClient.from('students').select('nisn').limit(10000);
        existing = new Set((data || []).map(s => String(s.nisn)));
    }
    const toInsert = valid.filter(s => !existing.has(s.nisn));
    const skipped = valid.length - toInsert.length;
    if (!confirm(`Ditemukan ${toInsert.length} siswa baru untuk diunggah.\nDilewati: ${skipped} NISN sudah ada, ${dupFile} duplikat di file, ${invalid} baris tidak lengkap.\n\nLanjutkan?`)) return;

    if (supabaseClient) {
        for (let i = 0; i < toInsert.length; i += 200) {
            const { error } = await supabaseClient.from('students').insert(toInsert.slice(i, i + 200));
            if (error) { showModal('Upload Gagal', `Terhenti pada baris ${i + 1}: ${error.message}`, 'error'); adminTab('students'); return; }
        }
    }
    showModal('Upload Berhasil', `${toInsert.length} siswa ditambahkan. ${skipped + dupFile + invalid} baris dilewati.`);
    adminTab('students');
}
