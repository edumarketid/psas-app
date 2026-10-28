/**
 * Dashboard guru: paket soal
 */
// ==========================================
// TEACHER DASHBOARD
// ==========================================
async function renderTeacherDashboard() {
    const content = document.getElementById('app-content');
    content.innerHTML = `
        <div class="space-y-6">
            <div class="bg-slate-800 border border-slate-700 p-4 rounded-2xl flex justify-between items-center">
                <div>
                    <h2 class="text-xl font-bold text-white"><i class="fa-solid fa-chalkboard-user text-emerald-400 mr-2"></i>Dashboard Guru Mapel</h2>
                    <p class="text-xs text-slate-400">Selamat datang, ${currentUser.data.name} &bull; Buat dan unggah soal ujian SAS.</p>
                </div>
                <button onclick="openAddExamModal()" class="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow"><i class="fa-solid fa-plus mr-1"></i> Buat Paket Soal Baru</button>
            </div>

            <div class="bg-slate-800/50 border border-slate-700 p-4 rounded-2xl">
                <h3 class="text-sm font-bold text-white mb-3">Paket Soal Anda</h3>
                <div id="teacher-exam-list" class="space-y-3">
                    <!-- Loaded via async -->
                </div>
            </div>
        </div>
    `;
    loadTeacherExams();
}

async function loadTeacherExams() {
    const listEl = document.getElementById('teacher-exam-list');
    let exams = [];
    if (supabaseClient) {
        const { data } = await supabaseClient.from('exams').select('*').eq('teacher_id', currentUser.data.id);
        exams = data || [];
    }
    if (exams.length === 0) {
        listEl.innerHTML = `<p class="text-xs text-slate-500">Anda belum membuat soal ujian. Klik tombol di atas untuk membuat.</p>`;
        return;
    }
    listEl.innerHTML = exams.map(ex => `
        <div class="bg-slate-900 border border-slate-700 p-3 rounded-xl flex justify-between items-center text-xs">
            <div>
                <h4 class="font-bold text-white text-sm">${ex.title} (${ex.subject})</h4>
                <p class="text-slate-400">Kelas: ${ex.kelas} &bull; Soal: ${ex.questions?.length || 0} Butir &bull; Status: <span class="${ex.is_active ? 'text-emerald-400 font-bold' : 'text-amber-400'}">${ex.is_active ? 'Aktif (Ditayang Admin)' : 'Menunggu Aktivasi Admin'}</span></p>
            </div>
            <button onclick="deleteExam(${ex.id})" class="text-rose-400 hover:text-rose-300 p-2"><i class="fa-solid fa-trash"></i></button>
        </div>
    `).join('');
}

async function openAddExamModal() {
    const title = prompt("Judul Ujian (Contoh: Sumatif Akhir Semester Jaringan Komputer):");
    if (!title) return;
    const subject = prompt("Mata Pelajaran:");
    if (!subject) return;
    const kelas = prompt("Target Kelas (Contoh: XI TKJ):");
    if (!kelas) return;

    // Sample default question format
    const sampleQuestions = [
        {
            question: "Perangkat jaringan yang berfungsi untuk menghubungkan dua atau lebih jaringan yang berbeda segmen disebut?",
            options: ["Switch", "Router", "Hub", "Repeater", "Access Point"],
            answer: 1
        },
        {
            question: "Berapa jumlah host usable pada subnet mask /28?",
            options: ["14", "30", "62", "126", "254"],
            answer: 0
        }
    ];

    if (supabaseClient) {
        await supabaseClient.from('exams').insert([{
            title, subject, kelas,
            teacher_id: currentUser.data.id,
            questions: sampleQuestions,
            is_active: false
        }]);
    }
    loadTeacherExams();
    showModal('Berhasil', 'Paket soal berhasil diunggah. Mohon hubungi admin untuk mengaktifkan tayangan ujian.');
}

async function deleteExam(id) {
    if (!confirm('Hapus paket soal ini?')) return;
    if (supabaseClient) await supabaseClient.from('exams').delete().eq('id', id);
    loadTeacherExams();
}
