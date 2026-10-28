/**
 * Dashboard admin: pengaturan, guru, siswa, aktivasi soal
 */
// ==========================================
// ADMIN DASHBOARD
// ==========================================
async function renderAdminDashboard() {
    const content = document.getElementById('app-content');
    content.innerHTML = `
        <div class="space-y-6">
            <div class="bg-slate-800 border border-slate-700 p-4 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 class="text-xl font-bold text-white flex items-center"><i class="fa-solid fa-gauge text-amber-400 mr-2"></i>Panel Administrator</h2>
                    <p class="text-xs text-slate-400">Kelola kurikulum, data guru, siswa, jadwal ujian, dan aktivasi soal.</p>
                </div>
                <div class="flex flex-wrap gap-2">
                    <button onclick="adminTab('settings')" class="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-xs rounded-xl font-medium transition"><i class="fa-solid fa-gear mr-1"></i> Pengaturan</button>
                    <button onclick="adminTab('teachers')" class="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-xs rounded-xl font-medium transition"><i class="fa-solid fa-chalkboard-user mr-1"></i> Data Guru</button>
                    <button onclick="adminTab('students')" class="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-xs rounded-xl font-medium transition"><i class="fa-solid fa-user-graduate mr-1"></i> Data Siswa</button>
                    <button onclick="adminTab('exams')" class="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-xs rounded-xl font-medium transition"><i class="fa-solid fa-file-shield mr-1"></i> Aktivasi & Jadwal Soal</button>
                    <button onclick="adminTab('token')" class="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-xs rounded-xl font-medium transition"><i class="fa-solid fa-key mr-1"></i> Token Ujian</button>
                    <button onclick="adminTab('cards')" class="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-xs rounded-xl font-medium transition"><i class="fa-solid fa-id-card mr-1"></i> Cetak Kartu</button>
                    <button onclick="adminTab('recap')" class="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-xs rounded-xl font-medium transition"><i class="fa-solid fa-table-list mr-1"></i> Rekap & Berita Acara</button>
                </div>
            </div>
            <div id="admin-content-area" class="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 sm:p-6">
                <!-- Default tab: Exams & Activation -->
            </div>
        </div>
    `;
    adminTab('exams');
}

async function adminTab(tab) {
    const area = document.getElementById('admin-content-area');
    clearInterval(tokenTimer);
    if (['token', 'cards', 'recap'].includes(tab)) return adminTabExtra(tab, area);
    if (tab === 'settings') {
        area.innerHTML = `
            <h3 class="text-base font-bold text-white mb-4"><i class="fa-solid fa-school text-blue-400 mr-2"></i>Pengaturan Identitas Sekolah & Tahun Ajaran</h3>
            <form onsubmit="saveSettings(event)" class="space-y-4 max-w-xl">
                <div>
                    <label class="block text-xs font-medium text-slate-300 mb-1">Nama Sekolah</label>
                    <input type="text" id="set-school" value="${currentSettings.school_name || ''}" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white">
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-medium text-slate-300 mb-1">Nama Kepala Sekolah</label>
                        <input type="text" id="set-kepsek" value="${currentSettings.headmaster_name || ''}" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white">
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-slate-300 mb-1">NIP Kepala Sekolah</label>
                        <input type="text" id="set-nip" value="${currentSettings.headmaster_nip || ''}" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white">
                    </div>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-medium text-slate-300 mb-1">Tahun Ajaran</label>
                        <input type="text" id="set-year" value="${currentSettings.academic_year || ''}" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white">
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-slate-300 mb-1">Semester</label>
                        <select id="set-semester" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white">
                            <option value="Ganjil" ${currentSettings.semester === 'Ganjil' ? 'selected' : ''}>Ganjil</option>
                            <option value="Genap" ${currentSettings.semester === 'Genap' ? 'selected' : ''}>Genap</option>
                        </select>
                    </div>
                </div>
                <button type="submit" class="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition">Simpan Pengaturan</button>
            </form>
        `;
    } else if (tab === 'teachers') {
        let teachers = [];
        if (supabaseClient) {
            const { data } = await supabaseClient.from('teachers').select('*');
            teachers = data || [];
        }
        area.innerHTML = `
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-base font-bold text-white"><i class="fa-solid fa-chalkboard-user text-emerald-400 mr-2"></i>Manajemen Data Guru (Login No HP & PIN)</h3>
                <button onclick="openAddTeacherModal()" class="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-2 rounded-xl"><i class="fa-solid fa-plus mr-1"></i> Tambah Guru</button>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full text-left text-xs text-slate-300">
                    <thead class="bg-slate-900 text-slate-400 uppercase">
                        <tr>
                            <th class="p-3">Nama Guru</th>
                            <th class="p-3">NIP</th>
                            <th class="p-3">No HP (WhatsApp)</th>
                            <th class="p-3">PIN Default</th>
                            <th class="p-3 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-700">
                        ${teachers.length === dataIsEmpty() ? `<tr><td colspan="5" class="p-4 text-center text-slate-500">Belum ada data guru.</td></tr>` : teachers.map(t => `
                            <tr>
                                <td class="p-3 font-semibold text-white">${t.name}</td>
                                <td class="p-3">${t.nip || '-'}</td>
                                <td class="p-3">${t.phone}</td>
                                <td class="p-3 font-mono">${t.pin}</td>
                                <td class="p-3 text-center">
                                    <button onclick="deleteTeacher(${t.id})" class="text-rose-400 hover:text-rose-300 px-2 py-1"><i class="fa-solid fa-trash"></i></button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } else if (tab === 'students') {
        let students = [];
        if (supabaseClient) {
            const { data } = await supabaseClient.from('students').select('*').order('kelas').order('name').limit(300);
            students = data || [];
        }
        area.innerHTML = `
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-base font-bold text-white"><i class="fa-solid fa-user-graduate text-blue-400 mr-2"></i>Data Siswa Peserta Ujian</h3>
                <div class="flex flex-wrap gap-2">
                    <button onclick="downloadStudentTemplate()" class="bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold px-3 py-2 rounded-xl"><i class="fa-solid fa-download mr-1"></i> Template CSV</button>
                    <button onclick="document.getElementById('csv-file').click()" class="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-2 rounded-xl"><i class="fa-solid fa-file-csv mr-1"></i> Upload CSV</button>
                    <input type="file" id="csv-file" accept=".csv,text/csv" class="hidden" onchange="importStudentsCSV(this)">
                    <button onclick="openAddStudentModal()" class="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-2 rounded-xl"><i class="fa-solid fa-plus mr-1"></i> Tambah Siswa</button>
                </div>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full text-left text-xs text-slate-300">
                    <thead class="bg-slate-900 text-slate-400 uppercase">
                        <tr>
                            <th class="p-3">NISN</th>
                            <th class="p-3">Nama Siswa</th>
                            <th class="p-3">Kelas</th>
                            <th class="p-3">PIN</th>
                            <th class="p-3 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-700">
                        ${students.map(s => `
                            <tr>
                                <td class="p-3 font-mono">${s.nisn}</td>
                                <td class="p-3 font-semibold text-white">${s.name}</td>
                                <td class="p-3">${s.kelas}</td>
                                <td class="p-3 font-mono">${s.pin}</td>
                                <td class="p-3 text-center">
                                    <button onclick="deleteStudent(${s.id})" class="text-rose-400 hover:text-rose-300 px-2 py-1"><i class="fa-solid fa-trash"></i></button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } else if (tab === 'exams') {
        let exams = [];
        if (supabaseClient) {
            const { data } = await supabaseClient.from('exams').select('*, teachers(name)');
            exams = data || [];
        }
        area.innerHTML = `
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-base font-bold text-white"><i class="fa-solid fa-file-shield text-amber-400 mr-2"></i>Aktivasi Soal Ujian & Jadwal Beranda</h3>
            </div>
            <p class="text-xs text-slate-400 mb-4">Guru mengunggah soal, admin mengaktifkan soal dan menjadwalkannya agar tampil di beranda siswa.</p>
            <div class="space-y-3">
                ${exams.length === 0 ? `<p class="text-xs text-slate-500">Belum ada paket soal yang diunggah oleh guru.</p>` : exams.map(ex => `
                    <div class="bg-slate-900 border border-slate-700 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div>
                            <h4 class="font-bold text-white text-sm">${ex.title} (${ex.subject})</h4>
                            <p class="text-xs text-slate-400">Kelas: <span class="text-blue-400">${ex.kelas}</span> &bull; Pembuat: ${ex.teachers?.name || 'Guru'} &bull; Jumlah Soal: ${ex.questions?.length || 0} Soal</p>
                        </div>
                        <div class="flex items-center space-x-3">
                            <label class="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" ${ex.is_active ? 'checked' : ''} onchange="toggleExamActivation(${ex.id}, this.checked)" class="sr-only peer">
                                <div class="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                            </label>
                            <span class="text-xs font-semibold ${ex.is_active ? 'text-emerald-400' : 'text-slate-400'}">${ex.is_active ? 'Aktif' : 'Non-Aktif'}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
}

function dataIsEmpty() { return 0; }

async function saveSettings(e) {
    e.preventDefault();
    currentSettings.school_name = document.getElementById('set-school').value;
    currentSettings.headmaster_name = document.getElementById('set-kepsek').value;
    currentSettings.headmaster_nip = document.getElementById('set-nip').value;
    currentSettings.academic_year = document.getElementById('set-year').value;
    currentSettings.semester = document.getElementById('set-semester').value;

    if (supabaseClient) {
        const { exam_token, token_updated_at, ...settingsOnly } = currentSettings;
        await supabaseClient.from('settings').update(settingsOnly).eq('id', 1);
    }
    fetchSettings();
    showModal('Berhasil', 'Pengaturan sekolah berhasil diperbarui.');
}

async function openAddTeacherModal() {
    const name = prompt("Nama Lengkap Guru dan Gelar:");
    if (!name) return;
    const nip = prompt("NIP Guru (Opsional):");
    const phone = prompt("Nomor HP (WhatsApp) untuk Login:");
    if (!phone) return;

    if (supabaseClient) {
        const { error } = await supabaseClient.from('teachers').insert([{ name, nip, phone, pin: '12345' }]);
        if (error) { showModal('Gagal', error.message, 'error'); return; }
    }
    showModal('Berhasil', 'Guru berhasil ditambahkan dengan PIN default 12345.');
    adminTab('teachers');
}

async function deleteTeacher(id) {
    if (!confirm('Yakin ingin menghapus data guru ini?')) return;
    if (supabaseClient) await supabaseClient.from('teachers').delete().eq('id', id);
    adminTab('teachers');
}

async function openAddStudentModal() {
    const nisn = prompt("NISN Siswa:");
    if (!nisn) return;
    const name = prompt("Nama Lengkap Siswa:");
    if (!name) return;
    const kelas = prompt("Kelas (Contoh: XI TKJ):");
    if (!kelas) return;

    if (supabaseClient) {
        const { error } = await supabaseClient.from('students').insert([{ nisn, name, kelas, pin: '12345' }]);
        if (error) { showModal('Gagal', error.message, 'error'); return; }
    }
    showModal('Berhasil', 'Siswa berhasil ditambahkan dengan PIN default 12345.');
    adminTab('students');
}

async function deleteStudent(id) {
    if (!confirm('Yakin ingin menghapus siswa ini?')) return;
    if (supabaseClient) await supabaseClient.from('students').delete().eq('id', id);
    adminTab('students');
}

async function toggleExamActivation(id, status) {
    if (supabaseClient) {
        await supabaseClient.from('exams').update({ is_active: status }).eq('id', id);
    }
    showModal('Status Diperbarui', `Ujian berhasil ${status ? 'diaktifkan' : 'dinonaktifkan'}.`);
}

// ==========================================
// ADMIN: KARTU PESERTA, REKAP, BERITA ACARA
// ==========================================
async function adminTabExtra(tab, area) {
    if (tab === 'token') return renderTokenTab(area);
    if (tab === 'cards') return renderCardsTab(area);
    if (tab === 'recap') return renderRecapTab(area);
}
