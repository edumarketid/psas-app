/**
 * Admin: rekap nilai global & berita acara
 */
// ---------- Rekap Nilai ----------
let recapState = { results: [], exams: [], students: [] };

async function renderRecapTab(area) {
    area.innerHTML = '<p class="text-xs text-slate-400">Memuat rekap nilai...</p>';
    let results = [], exams = [], students = [];
    if (supabaseClient) {
        const [r, e, s] = await Promise.all([
            supabaseClient.from('student_results').select('*').limit(10000),
            supabaseClient.from('exams').select('id, title, subject, kelas'),
            supabaseClient.from('students').select('nisn, kelas').limit(10000)
        ]);
        results = r.data || []; exams = e.data || []; students = s.data || [];
    }
    recapState = { results, exams, students };
    const kelasList = [...new Set(students.map(s => s.kelas))].sort();
    const today = new Date().toISOString().slice(0, 10);
    area.innerHTML = `
        <h3 class="text-base font-bold text-white mb-4"><i class="fa-solid fa-table-list text-emerald-400 mr-2"></i>Rekap Nilai Global & Berita Acara</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div><label class="block text-xs text-slate-300 mb-1">Paket Ujian</label>
                <select id="rc-exam" onchange="applyRecap()" class="${inputCls}"><option value="all">Semua Ujian</option>${exams.map(x => `<option value="${x.id}">${esc(x.title)} (${esc(x.subject)} - ${esc(x.kelas)})</option>`).join('')}</select></div>
            <div><label class="block text-xs text-slate-300 mb-1">Kelas</label>
                <select id="rc-kelas" onchange="applyRecap()" class="${inputCls}"><option value="all">Semua Kelas</option>${kelasList.map(k => `<option value="${esc(k)}">${esc(k)}</option>`).join('')}</select></div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <div><label class="block text-xs text-slate-300 mb-1">Ruang / Sesi</label><input id="rc-ruang" class="${inputCls}" placeholder="Lab Komputer 1 / Sesi 1"></div>
            <div><label class="block text-xs text-slate-300 mb-1">Nama Pengawas</label><input id="rc-pengawas" class="${inputCls}" placeholder="Nama pengawas"></div>
            <div><label class="block text-xs text-slate-300 mb-1">Tanggal Ujian</label><input id="rc-tgl" type="date" value="${today}" class="${inputCls}"></div>
        </div>
        <div class="mb-4"><label class="block text-xs text-slate-300 mb-1">Catatan Selama Ujian (untuk Berita Acara)</label><input id="rc-catatan" class="${inputCls}" placeholder="Contoh: Ujian berjalan lancar, tidak ada kendala."></div>
        <div class="flex flex-wrap gap-2 mb-4">
            <button onclick="exportRecapCSV()" class="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-xl"><i class="fa-solid fa-file-csv mr-1"></i> Unduh Rekap (CSV)</button>
            <button onclick="printBA()" class="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-xl"><i class="fa-solid fa-print mr-1"></i> Cetak Berita Acara</button>
        </div>
        <div id="recap-table"></div>`;
    applyRecap();
}

function recapRows() {
    const exId = document.getElementById('rc-exam').value, kl = document.getElementById('rc-kelas').value;
    const exMap = Object.fromEntries(recapState.exams.map(e => [e.id, e]));
    const klMap = Object.fromEntries(recapState.students.map(s => [String(s.nisn), s.kelas]));
    return recapState.results
        .filter(r => (exId === 'all' || String(r.exam_id) === exId) && (kl === 'all' || klMap[String(r.student_nisn)] === kl))
        .map(r => ({
            nisn: r.student_nisn, name: r.student_name, kelas: klMap[String(r.student_nisn)] || '-',
            subject: exMap[r.exam_id]?.subject || '-', title: exMap[r.exam_id]?.title || '-',
            score: Number(r.score) || 0, correct: r.correct_count ?? '', total: r.total_questions ?? '',
            violations: r.violations ?? '', time: r.submitted_at || r.created_at || ''
        }))
        .sort((a, b) => a.kelas.localeCompare(b.kelas) || a.name.localeCompare(b.name));
}
const fmtTime = t => t ? new Date(t).toLocaleString('id-ID') : '-';

function applyRecap() {
    const rows = recapRows();
    const scores = rows.map(r => r.score);
    const avg = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '-';
    document.getElementById('recap-table').innerHTML = `
        <p class="text-xs text-slate-400 mb-2">${rows.length} hasil &bull; Rata-rata: <b class="text-white">${avg}</b> &bull; Tertinggi: <b class="text-white">${scores.length ? Math.max(...scores) : '-'}</b> &bull; Terendah: <b class="text-white">${scores.length ? Math.min(...scores) : '-'}</b></p>
        <div class="overflow-x-auto"><table class="w-full text-left text-xs text-slate-300">
            <thead class="bg-slate-900 text-slate-400 uppercase"><tr><th class="p-3">NISN</th><th class="p-3">Nama</th><th class="p-3">Kelas</th><th class="p-3">Mapel</th><th class="p-3 text-center">Nilai</th><th class="p-3 text-center">Pindah Tab</th><th class="p-3">Waktu Kumpul</th></tr></thead>
            <tbody class="divide-y divide-slate-700">${rows.length ? rows.map(r => `<tr><td class="p-3 font-mono">${esc(r.nisn)}</td><td class="p-3 font-semibold text-white">${esc(r.name)}</td><td class="p-3">${esc(r.kelas)}</td><td class="p-3">${esc(r.subject)}</td><td class="p-3 text-center font-bold text-emerald-400">${r.score.toFixed(1)}</td><td class="p-3 text-center">${r.violations === '' ? '-' : r.violations}</td><td class="p-3">${fmtTime(r.time)}</td></tr>`).join('') : '<tr><td colspan="7" class="p-4 text-center text-slate-500">Belum ada hasil ujian.</td></tr>'}</tbody>
        </table></div>`;
}

function exportRecapCSV() {
    const rows = recapRows();
    if (!rows.length) { showModal('Tidak Ada Data', 'Belum ada hasil ujian untuk diunduh.', 'error'); return; }
    downloadCSV(`rekap_nilai_${new Date().toISOString().slice(0, 10)}.csv`,
        [['No', 'NISN', 'Nama', 'Kelas', 'Mata Pelajaran', 'Judul Ujian', 'Nilai', 'Benar', 'Jumlah Soal', 'Pindah Tab', 'Waktu Kumpul']]
            .concat(rows.map((r, i) => [i + 1, r.nisn, r.name, r.kelas, r.subject, r.title, r.score, r.correct, r.total, r.violations, fmtTime(r.time)])));
}

function printBA() {
    const rows = recapRows();
    const exId = document.getElementById('rc-exam').value, kl = document.getElementById('rc-kelas').value;
    const ex = recapState.exams.find(e => String(e.id) === exId);
    const kelasTarget = kl !== 'all' ? kl : (ex ? ex.kelas : null);
    const terdaftar = recapState.students.filter(s => !kelasTarget || s.kelas === kelasTarget).length;
    const hadir = rows.length, tidak = Math.max(0, terdaftar - hadir);
    const scores = rows.map(r => r.score);
    const v = id => document.getElementById(id).value.trim();
    const tgl = new Date(v('rc-tgl') + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const line = '<span style="display:inline-block;min-width:60mm;border-bottom:1px dotted #000">&nbsp;</span>';
    document.getElementById('print-area').innerHTML = `
        <div class="ba">
            <h2>BERITA ACARA PELAKSANAAN<br>PENILAIAN SUMATIF AKHIR SEMESTER ${esc(currentSettings.semester).toUpperCase()}</h2>
            <p style="text-align:center;margin:1mm 0 6mm">${esc(currentSettings.school_name)} &bull; Tahun Pelajaran ${esc(currentSettings.academic_year)}</p>
            <p>Pada hari ini <b>${tgl}</b>, telah diselenggarakan Penilaian Sumatif Akhir Semester berbasis komputer (CBT) dengan keterangan sebagai berikut:</p>
            <table class="info">
                <tr><td>1.</td><td>Mata Pelajaran</td><td>: ${esc(ex ? ex.subject + ' - ' + ex.title : 'Semua mata pelajaran')}</td></tr>
                <tr><td>2.</td><td>Kelas</td><td>: ${esc(kelasTarget || 'Semua kelas')}</td></tr>
                <tr><td>3.</td><td>Ruang / Sesi</td><td>: ${esc(v('rc-ruang')) || line}</td></tr>
                <tr><td>4.</td><td>Peserta terdaftar</td><td>: ${terdaftar} orang</td></tr>
                <tr><td>5.</td><td>Peserta hadir (mengumpulkan)</td><td>: ${hadir} orang</td></tr>
                <tr><td>6.</td><td>Peserta tidak hadir</td><td>: ${tidak} orang</td></tr>
                <tr><td>7.</td><td>Nilai rata-rata / tertinggi / terendah</td><td>: ${scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) + ' / ' + Math.max(...scores) + ' / ' + Math.min(...scores) : '-'}</td></tr>
                <tr><td>8.</td><td>Catatan selama ujian</td><td>: ${esc(v('rc-catatan')) || line}</td></tr>
            </table>
            <p style="margin-top:4mm">Demikian berita acara ini dibuat dengan sebenarnya untuk dipergunakan sebagaimana mestinya.</p>
            <div class="sign">
                <div>Pengawas Ujian,<br><br><br><br><b><u>${esc(v('rc-pengawas')) || '.............................'}</u></b></div>
                <div>Mengetahui,<br>Kepala Sekolah<br><br><br><b><u>${esc(currentSettings.headmaster_name)}</u></b><br>NIP. ${esc(currentSettings.headmaster_nip)}</div>
            </div>
            <div style="page-break-before:always"></div>
            <h2 style="font-size:12pt">LAMPIRAN DAFTAR NILAI PESERTA</h2>
            <table class="list"><thead><tr><th>No</th><th>NISN</th><th>Nama</th><th>Kelas</th><th>Mapel</th><th>Nilai</th></tr></thead>
            <tbody>${rows.map((r, i) => `<tr><td>${i + 1}</td><td>${esc(r.nisn)}</td><td>${esc(r.name)}</td><td>${esc(r.kelas)}</td><td>${esc(r.subject)}</td><td>${r.score.toFixed(1)}</td></tr>`).join('')}</tbody></table>
        </div>`;
    window.print();
}
