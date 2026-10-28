/**
 * Inisialisasi, login/logout, halaman utama
 */
// Inisialisasi Awal Saat Halaman Dimuat
window.addEventListener('DOMContentLoaded', async () => {
    await fetchSettings();
    renderHomeOrDashboard();
});

async function fetchSettings() {
    if (supabaseClient) {
        const { data } = await supabaseClient.from('settings').select('*').eq('id', 1).single();
        if (data) currentSettings = data;
    }
    document.getElementById('lbl-school-name').innerText = currentSettings.school_name;
    document.getElementById('lbl-semester-info').innerText = `SAS TA ${currentSettings.academic_year} (${currentSettings.semester})`;
}

function renderAuthStatus() {
    const statusDiv = document.getElementById('header-auth-status');
    if (!currentUser) {
        statusDiv.innerHTML = `<span class="text-xs text-slate-400">Belum Login</span>`;
    } else {
        statusDiv.innerHTML = `
            <button onclick="logout()" class="bg-rose-600 hover:bg-rose-500 text-white px-3 py-1 rounded-lg text-xs font-medium transition flex items-center space-x-1">
                <i class="fa-solid fa-right-from-bracket"></i> <span>Keluar</span>
            </button>
        `;
    }
}

function logout() {
    clearInterval(examTimerInterval); clearInterval(tokenTimer); examRunning = false;
    currentUser = null;
    renderHomeOrDashboard();
    showModal('Logout Berhasil', 'Anda telah keluar dari sistem.');
}

// ==========================================
// RENDER HALAMAN UTAMA / LOGIN PILIHAN
// ==========================================
function renderHomeOrDashboard() {
    renderAuthStatus();
    const content = document.getElementById('app-content');

    if (!currentUser) {
        content.innerHTML = `
            <div class="max-w-md mx-auto space-y-6 my-auto pt-6">
                <div class="text-center space-y-2">
                    <div class="inline-flex p-4 bg-blue-600/20 border border-blue-500/30 rounded-3xl text-blue-400 text-3xl mb-2">
                        <i class="fa-solid fa-shield-halved"></i>
                    </div>
                    <h2 class="text-2xl font-bold text-white">Portal Ujian Sumatif</h2>
                    <p class="text-sm text-slate-400">Pilih akses masuk sesuai peran Anda di SMKN 1 Wakatobi</p>
                </div>

                <!-- Tab Selector -->
                <div class="flex rounded-xl bg-slate-800 p-1.5 border border-slate-700">
                    <button onclick="switchLoginTab('student')" id="tab-student" class="flex-1 py-2 text-xs font-bold rounded-lg bg-blue-600 text-white transition shadow">Siswa</button>
                    <button onclick="switchLoginTab('teacher')" id="tab-teacher" class="flex-1 py-2 text-xs font-bold rounded-lg text-slate-400 hover:text-white transition">Guru</button>
                    <button onclick="switchLoginTab('admin')" id="tab-admin" class="flex-1 py-2 text-xs font-bold rounded-lg text-slate-400 hover:text-white transition">Admin</button>
                </div>

                <!-- Form Login Container -->
                <div id="login-form-container" class="bg-slate-800/80 border border-slate-700 p-6 rounded-2xl shadow-xl">
                    <!-- Rendered by switchLoginTab -->
                </div>
            </div>
        `;
        switchLoginTab('student');
    } else {
        if (currentUser.role === 'admin') renderAdminDashboard();
        else if (currentUser.role === 'teacher') renderTeacherDashboard();
        else if (currentUser.role === 'student') renderStudentDashboard();
    }
}

function switchLoginTab(role) {
    ['student', 'teacher', 'admin'].forEach(r => {
        const btn = document.getElementById(`tab-${r}`);
        if (r === role) {
            btn.className = "flex-1 py-2 text-xs font-bold rounded-lg bg-blue-600 text-white transition shadow";
        } else {
            btn.className = "flex-1 py-2 text-xs font-bold rounded-lg text-slate-400 hover:text-white transition";
        }
    });

    const container = document.getElementById('login-form-container');
    if (role === 'student') {
        container.innerHTML = `
            <form onsubmit="handleLogin(event, 'student')" class="space-y-4">
                <h3 class="text-base font-bold text-white mb-2"><i class="fa-solid fa-user-graduate text-blue-400 mr-2"></i>Login Siswa</h3>
                <div>
                    <label class="block text-xs font-medium text-slate-300 mb-1">Nomor Induk Siswa Nasional (NISN)</label>
                    <input type="text" id="login-nisn" required placeholder="Contoh: 0081234567" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500">
                </div>
                <div>
                    <label class="block text-xs font-medium text-slate-300 mb-1">PIN Siswa (Default: 12345)</label>
                    <input type="password" id="login-pin" required placeholder="•••••" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500">
                </div>
                <button type="submit" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl transition shadow-lg text-sm">Masuk Ujian</button>
            </form>
        `;
    } else if (role === 'teacher') {
        container.innerHTML = `
            <form onsubmit="handleLogin(event, 'teacher')" class="space-y-4">
                <h3 class="text-base font-bold text-white mb-2"><i class="fa-solid fa-chalkboard-user text-emerald-400 mr-2"></i>Login Guru Mapel</h3>
                <div>
                    <label class="block text-xs font-medium text-slate-300 mb-1">Nomor Handphone (WhatsApp)</label>
                    <input type="text" id="login-phone" required placeholder="Contoh: 081234567890" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500">
                </div>
                <div>
                    <label class="block text-xs font-medium text-slate-300 mb-1">PIN Guru (Default: 12345)</label>
                    <input type="password" id="login-tpin" required placeholder="•••••" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500">
                </div>
                <button type="submit" class="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-xl transition shadow-lg text-sm">Masuk Dashboard Guru</button>
            </form>
        `;
    } else if (role === 'admin') {
        container.innerHTML = `
            <form onsubmit="handleLogin(event, 'admin')" class="space-y-4">
                <h3 class="text-base font-bold text-white mb-2"><i class="fa-solid fa-user-shield text-amber-400 mr-2"></i>Login Administrator</h3>
                <div>
                    <label class="block text-xs font-medium text-slate-300 mb-1">Username Admin</label>
                    <input type="text" id="login-admin-user" required value="admin" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500">
                </div>
                <div>
                    <label class="block text-xs font-medium text-slate-300 mb-1">Password (Default: 12345)</label>
                    <input type="password" id="login-admin-pass" required placeholder="•••••" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500">
                </div>
                <button type="submit" class="w-full bg-amber-600 hover:bg-amber-500 text-white font-semibold py-2.5 rounded-xl transition shadow-lg text-sm">Masuk Panel Admin</button>
            </form>
        `;
    }
}

async function handleLogin(e, role) {
    e.preventDefault();
    if (role === 'admin') {
        const u = document.getElementById('login-admin-user').value;
        const p = document.getElementById('login-admin-pass').value;
        if (supabaseClient) {
            const { data } = await supabaseClient.from('admins').select('*').eq('username', u).eq('password', p).single();
            if (data) {
                currentUser = { role: 'admin', data };
            } else {
                showModal('Login Gagal', 'Username atau password admin salah!', 'error');
                return;
            }
        } else {
            if (u === 'admin' && p === '12345') currentUser = { role: 'admin', data: { username: 'admin' } };
            else { showModal('Login Gagal', 'Username/Password salah', 'error'); return; }
        }
    } else if (role === 'teacher') {
        const phone = document.getElementById('login-phone').value;
        const pin = document.getElementById('login-tpin').value;
        if (supabaseClient) {
            const { data } = await supabaseClient.from('teachers').select('*').eq('phone', phone).eq('pin', pin).single();
            if (data) currentUser = { role: 'teacher', data };
            else { showModal('Login Gagal', 'No HP atau PIN Guru tidak terdaftar!', 'error'); return; }
        } else {
            currentUser = { role: 'teacher', data: { id: 1, name: 'Guru Demo', phone } };
        }
    } else if (role === 'student') {
        const nisn = document.getElementById('login-nisn').value;
        const pin = document.getElementById('login-pin').value;
        if (supabaseClient) {
            const { data } = await supabaseClient.from('students').select('*').eq('nisn', nisn).eq('pin', pin).single();
            if (data) currentUser = { role: 'student', data };
            else { showModal('Login Gagal', 'NISN atau PIN Siswa salah/tidak ditemukan!', 'error'); return; }
        } else {
            currentUser = { role: 'student', data: { nisn, name: 'Siswa Demo', kelas: 'XI TKJ' } };
        }
    }
    renderHomeOrDashboard();
    showModal('Login Berhasil', `Selamat datang, ${currentUser.data.name || currentUser.data.username || 'Pengguna'}`);
}
