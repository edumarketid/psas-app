/**
 * Dashboard siswa & ubah PIN
 */
// ==========================================
// STUDENT DASHBOARD & CBT EXAM RUNNER
// ==========================================
async function renderStudentDashboard() {
    const content = document.getElementById('app-content');
    let activeExams = [];
    doneExamIds = [];
    if (supabaseClient) {
        const { data } = await supabaseClient.from('exams').select('*').eq('is_active', true);
        activeExams = data || [];
        const { data: done } = await supabaseClient.from('student_results').select('exam_id').eq('student_nisn', currentUser.data.nisn);
        doneExamIds = (done || []).map(r => r.exam_id);
    }
    studentExams = activeExams;

    content.innerHTML = `
        <div class="space-y-6">
            <div class="bg-gradient-to-r from-blue-900 to-indigo-900 border border-blue-700 p-5 rounded-2xl shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <span class="bg-blue-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">Siswa Peserta Ujian</span>
                    <h2 class="text-xl font-bold text-white mt-1">${currentUser.data.name}</h2>
                    <p class="text-xs text-blue-200">NISN: ${currentUser.data.nisn} &bull; Kelas: ${currentUser.data.kelas}</p>
                </div>
                <button onclick="openChangePinModal()" class="bg-slate-800/80 hover:bg-slate-800 text-slate-200 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-600 transition">
                    <i class="fa-solid fa-key mr-1"></i> Ubah PIN Siswa
                </button>
            </div>

            <div>
                <h3 class="text-base font-bold text-white mb-3 flex items-center"><i class="fa-solid fa-clipboard-list text-emerald-400 mr-2"></i>Daftar Ujian Aktif</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    ${activeExams.length === 0 ? `
                        <div class="col-span-full bg-slate-800/50 border border-slate-700 p-6 rounded-2xl text-center text-slate-400">
                            <i class="fa-solid fa-triangle-exclamation text-3xl text-amber-400 mb-2"></i>
                            <p class="text-sm font-semibold">Belum ada jadwal ujian yang diaktifkan oleh admin.</p>
                            <p class="text-xs text-slate-500 mt-1">Silakan menunggu instruksi pengawas atau guru pengampu.</p>
                        </div>
                    ` : activeExams.map(ex => `
                        <div class="bg-slate-800 border border-slate-700 p-5 rounded-2xl flex flex-col justify-between shadow hover:border-blue-500 transition">
                            <div>
                                <span class="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold">${ex.subject}</span>
                                <h4 class="font-bold text-white text-base mt-2">${ex.title}</h4>
                                <p class="text-xs text-slate-400 mt-1">Jumlah Soal: ${ex.questions?.length || 0} Pilihan Ganda &bull; Waktu: ${examDurationMin(ex)} menit</p>
                            </div>
                            <button onclick="requestStartExam(${ex.id})" ${doneExamIds.includes(ex.id) ? 'disabled' : ''} class="mt-4 disabled:opacity-40 disabled:cursor-not-allowed w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl text-xs transition shadow flex items-center justify-center space-x-2">
                                <i class="fa-solid fa-play"></i> <span>${doneExamIds.includes(ex.id) ? 'Sudah Dikerjakan' : 'Mulai Ujian SAS'}</span>
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    tryResumeExam();
}

async function openChangePinModal() {
    const newPin = prompt("Masukkan PIN Baru (angka):");
    if (!newPin) return;
    if (supabaseClient) {
        await supabaseClient.from('students').update({ pin: newPin }).eq('nisn', currentUser.data.nisn);
    }
    showModal('Berhasil', 'PIN siswa berhasil diperbarui.');
}
