/**
 * Mesin CBT: sesi, timer, jawaban, penilaian, simpan
 */
// ==========================================
// CBT ENGINE: token, sesi tahan-refresh, timer, auto-submit
// ==========================================

const SESS_KEY = 'cbt_session';
let activeExamSession = null, currentQuestionIndex = 0, studentAnswers = {}, examTimerInterval = null;
let examEndAt = 0, examRunning = false, examSubmitting = false, examViolations = 0, pendingPayload = null;
let studentExams = [], doneExamIds = [];

const examDurationMin = ex => ex.duration_minutes || ((ex.questions?.length || 0) * 2); // default 2 menit/soal

function saveSession() {
    try { localStorage.setItem(SESS_KEY, JSON.stringify({ nisn: currentUser.data.nisn, examId: activeExamSession.id, endAt: examEndAt, answers: studentAnswers, idx: currentQuestionIndex, violations: examViolations })); } catch (e) {}
}
function clearSession() { try { localStorage.removeItem(SESS_KEY); } catch (e) {} }
function loadSession() {
    try { const s = JSON.parse(localStorage.getItem(SESS_KEY)); return s && s.nisn === currentUser.data.nisn ? s : null; } catch (e) { return null; }
}

// Keamanan dasar: catat perpindahan tab/aplikasi, blok klik kanan & salin saat ujian
document.addEventListener('visibilitychange', () => {
    if (!examRunning) return;
    if (document.hidden) { examViolations++; saveSession(); }
    else showModal('Peringatan', `Anda meninggalkan halaman ujian (${examViolations}x). Aktivitas ini tercatat dan dilaporkan ke pengawas.`, 'error');
});
['contextmenu', 'copy', 'cut', 'paste'].forEach(ev => document.addEventListener(ev, e => { if (examRunning) e.preventDefault(); }));
window.addEventListener('beforeunload', e => { if (examRunning) { e.preventDefault(); e.returnValue = ''; } });

async function requestStartExam(id) {
    const ex = studentExams.find(e => e.id === id);
    if (!ex) return;
    if (!ex.questions || !ex.questions.length) { showModal('Tidak Tersedia', 'Paket soal ini belum memiliki butir soal.', 'error'); return; }
    if (supabaseClient) {
        const { data } = await supabaseClient.from('student_results').select('id').eq('student_nisn', currentUser.data.nisn).eq('exam_id', id).limit(1);
        if (data && data.length) { showModal('Sudah Dikerjakan', 'Anda sudah menyelesaikan ujian ini. Ujian tidak dapat diulang.', 'error'); renderStudentDashboard(); return; }
    }
    const input = prompt('Masukkan TOKEN ujian dari pengawas (6 digit):');
    if (!input) return;
    const t = await getToken();
    if (!t.code || input.trim() !== String(t.code)) {
        showModal('Token Tidak Valid', 'Token salah atau sudah diganti. Minta token terbaru kepada pengawas.', 'error');
        return;
    }
    if (!confirm(`Waktu ujian ${examDurationMin(ex)} menit. Timer akan langsung berjalan dan tidak dapat dihentikan. Mulai sekarang?`)) return;
    examEndAt = Date.now() + examDurationMin(ex) * 60000;
    examViolations = 0;
    startExam(ex, { answers: {}, idx: 0 });
}

function tryResumeExam() {
    const s = loadSession();
    if (!s) return;
    const ex = studentExams.find(e => e.id === s.examId);
    if (!ex || doneExamIds.includes(ex.id)) { clearSession(); return; }
    examEndAt = s.endAt; examViolations = s.violations || 0;
    startExam(ex, { answers: s.answers || {}, idx: s.idx || 0 });
}

function startExam(exam, resume) {
    activeExamSession = exam;
    currentQuestionIndex = resume.idx || 0;
    studentAnswers = resume.answers || {};
    examSubmitting = false; examRunning = true;
    saveSession();

    document.getElementById('app-content').innerHTML = `
        <div class="max-w-3xl mx-auto space-y-4">
            <div class="bg-slate-800 border border-slate-700 p-4 rounded-2xl flex justify-between items-center shadow">
                <div>
                    <h3 class="font-bold text-white text-sm sm:text-base">${esc(exam.title)}</h3>
                    <p class="text-xs text-slate-400">${esc(exam.subject)} &bull; ${esc(currentUser.data.name)}</p>
                </div>
                <div id="timer-box" class="bg-rose-500/20 border border-rose-500/40 text-rose-400 px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center space-x-1.5">
                    <i class="fa-regular fa-clock"></i><span id="exam-timer">00:00:00</span>
                </div>
            </div>
            <div class="bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-xl space-y-4 select-none">
                <div class="flex justify-between items-center text-xs text-slate-400 border-b border-slate-700 pb-3">
                    <span>Soal Nomor <strong id="q-number" class="text-white text-sm">1</strong> dari ${exam.questions.length}</span>
                    <span id="answered-status" class="text-blue-400 font-semibold">Belum dijawab</span>
                </div>
                <div id="question-text" class="text-sm sm:text-base text-slate-100 font-medium leading-relaxed"></div>
                <div id="options-container" class="space-y-3 pt-2"></div>
            </div>
            <div class="flex justify-between items-center">
                <button onclick="prevQuestion()" id="btn-prev" class="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs font-semibold border border-slate-700 transition"><i class="fa-solid fa-arrow-left mr-1"></i> Sebelumnya</button>
                <button onclick="nextQuestion()" id="btn-next" class="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-xl text-xs font-semibold transition shadow">Selanjutnya <i class="fa-solid fa-arrow-right ml-1"></i></button>
            </div>
            <div class="bg-slate-800 border border-slate-700 p-4 rounded-2xl">
                <p class="text-[11px] text-slate-400 mb-2">Navigasi soal (hijau = sudah dijawab)</p>
                <div id="q-nav" class="flex flex-wrap gap-2"></div>
            </div>
        </div>`;
    renderQuestion();

    clearInterval(examTimerInterval);
    const tick = () => {
        const left = Math.max(0, Math.round((examEndAt - Date.now()) / 1000));
        const el = document.getElementById('exam-timer');
        if (el) {
            el.innerText = [Math.floor(left / 3600), Math.floor(left % 3600 / 60), left % 60].map(v => String(v).padStart(2, '0')).join(':');
            if (left <= 300) document.getElementById('timer-box').classList.add('animate-pulse');
        }
        if (left <= 0) { clearInterval(examTimerInterval); submitExam(true); }
    };
    tick();
    examTimerInterval = setInterval(tick, 1000);
}

function renderQuestion() {
    const qs = activeExamSession.questions, q = qs[currentQuestionIndex];
    const letters = ['A', 'B', 'C', 'D', 'E'];
    document.getElementById('q-number').innerText = currentQuestionIndex + 1;
    document.getElementById('question-text').innerText = q.question;
    const done = studentAnswers[currentQuestionIndex] !== undefined;
    const st = document.getElementById('answered-status');
    st.innerText = done ? 'Sudah dijawab' : 'Belum dijawab';
    st.className = done ? 'text-emerald-400 font-semibold' : 'text-blue-400 font-semibold';

    document.getElementById('options-container').innerHTML = q.options.map((opt, idx) => {
        const sel = studentAnswers[currentQuestionIndex] === idx;
        return `
            <label onclick="selectAnswer(${idx})" class="flex items-center space-x-3 p-3.5 rounded-xl border cursor-pointer transition ${sel ? 'bg-blue-600/20 border-blue-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-700/50'}">
                <span class="w-7 h-7 rounded-lg ${sel ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'} flex items-center justify-center font-bold text-xs">${letters[idx]}</span>
                <span class="text-sm flex-1">${esc(opt)}</span>
            </label>`;
    }).join('');

    document.getElementById('q-nav').innerHTML = qs.map((_, i) => `
        <button onclick="goQuestion(${i})" class="w-8 h-8 rounded-lg text-xs font-bold ${i === currentQuestionIndex ? 'bg-blue-600 text-white ring-2 ring-blue-300' : studentAnswers[i] !== undefined ? 'bg-emerald-600/80 text-white' : 'bg-slate-900 text-slate-400 border border-slate-700'}">${i + 1}</button>`).join('');

    document.getElementById('btn-prev').style.visibility = currentQuestionIndex === 0 ? 'hidden' : 'visible';
    const nextBtn = document.getElementById('btn-next');
    if (currentQuestionIndex === qs.length - 1) {
        nextBtn.innerHTML = `Selesai & Kumpulkan <i class="fa-solid fa-check ml-1"></i>`;
        nextBtn.className = "bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl text-xs font-semibold transition shadow";
    } else {
        nextBtn.innerHTML = `Selanjutnya <i class="fa-solid fa-arrow-right ml-1"></i>`;
        nextBtn.className = "bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-xl text-xs font-semibold transition shadow";
    }
}

function selectAnswer(idx) { studentAnswers[currentQuestionIndex] = idx; saveSession(); renderQuestion(); }
function goQuestion(i) { currentQuestionIndex = i; saveSession(); renderQuestion(); }
function prevQuestion() { if (currentQuestionIndex > 0) goQuestion(currentQuestionIndex - 1); }
function nextQuestion() {
    const total = activeExamSession.questions.length;
    if (currentQuestionIndex < total - 1) { goQuestion(currentQuestionIndex + 1); return; }
    const blank = total - Object.keys(studentAnswers).length;
    const msg = blank > 0 ? `Masih ada ${blank} soal belum dijawab. Tetap kumpulkan jawaban?` : 'Apakah Anda yakin ingin menyelesaikan ujian dan mengirimkan jawaban?';
    if (confirm(msg)) submitExam(false);
}

// Simpan ke Supabase. Jika kolom tambahan belum dibuat, coba lagi dengan kolom dasar agar nilai tidak hilang.
async function saveResult(p) {
    if (!supabaseClient) return true;
    let { error } = await supabaseClient.from('student_results').insert([p.full]);
    if (error) ({ error } = await supabaseClient.from('student_results').insert([p.base]));
    return !error;
}

async function submitExam(isTimeout) {
    if (examSubmitting) return;
    examSubmitting = true; examRunning = false;
    clearInterval(examTimerInterval);

    const total = activeExamSession.questions.length;
    let correctCount = 0;
    activeExamSession.questions.forEach((q, idx) => { if (studentAnswers[idx] === q.answer) correctCount++; });
    const score = Math.round((correctCount / total) * 10000) / 100;

    const base = { student_nisn: currentUser.data.nisn, student_name: currentUser.data.name, exam_id: activeExamSession.id, score, answers: studentAnswers };
    pendingPayload = { base, full: { ...base, correct_count: correctCount, total_questions: total, violations: examViolations } };
    const saved = await saveResult(pendingPayload);
    if (saved) { clearSession(); doneExamIds.push(activeExamSession.id); }

    document.getElementById('app-content').innerHTML = `
        <div class="max-w-md mx-auto my-auto bg-slate-800 border border-slate-700 p-8 rounded-2xl text-center space-y-4 shadow-2xl">
            <div class="inline-flex p-4 bg-emerald-500/20 text-emerald-400 text-4xl rounded-3xl mb-1"><i class="fa-solid fa-award"></i></div>
            <h2 class="text-xl font-bold text-white">${isTimeout ? 'Waktu Ujian Habis!' : 'Ujian Telah Diselesaikan'}</h2>
            <p class="text-xs text-slate-400">${isTimeout ? 'Jawaban Anda dikumpulkan otomatis.' : 'Terima kasih telah mengikuti Penilaian Sumatif Akhir Semester.'}</p>
            <div class="bg-slate-900 border border-slate-700 p-4 rounded-xl">
                <span class="text-xs text-slate-400">Nilai Akhir Anda</span>
                <div class="text-3xl font-extrabold text-emerald-400 mt-1">${score.toFixed(1)}</div>
                <span class="text-[10px] text-slate-500">Benar: ${correctCount} dari ${total} soal</span>
            </div>
            <div id="save-status" class="text-xs ${saved ? 'text-emerald-400' : 'text-amber-400'}">${saved ? '<i class="fa-solid fa-cloud-arrow-up mr-1"></i>Nilai tersimpan di server.' : '<i class="fa-solid fa-triangle-exclamation mr-1"></i>Nilai BELUM tersimpan (koneksi bermasalah).'}</div>
            ${saved ? '' : `<button onclick="retrySave()" class="w-full bg-amber-600 hover:bg-amber-500 text-white font-semibold py-2.5 rounded-xl text-xs transition">Coba Kirim Ulang</button>`}
            <button onclick="renderStudentDashboard()" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl text-xs transition">Kembali ke Beranda Siswa</button>
        </div>`;
}

async function retrySave() {
    if (!pendingPayload) return;
    if (await saveResult(pendingPayload)) {
        clearSession(); doneExamIds.push(activeExamSession.id);
        const el = document.getElementById('save-status');
        el.className = 'text-xs text-emerald-400'; el.innerHTML = '<i class="fa-solid fa-cloud-arrow-up mr-1"></i>Nilai tersimpan di server.';
    } else showModal('Gagal', 'Masih gagal menyimpan. Periksa koneksi internet atau hubungi pengawas.', 'error');
}
