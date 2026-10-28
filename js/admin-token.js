/**
 * Admin: token ujian otomatis (refresh 15 menit)
 */
// ==========================================
// TOKEN UJIAN OTOMATIS (refresh 15 menit)
// ==========================================
const TOKEN_MS = 15 * 60 * 1000;
let tokenTimer = null, curToken = { code: null, at: 0 }, rotating = false;
const genToken = () => String(Math.floor(100000 + Math.random() * 900000));

async function getToken() {
    if (supabaseClient) {
        const { data } = await supabaseClient.from('settings').select('exam_token, token_updated_at').eq('id', 1).single();
        if (data) return { code: data.exam_token, at: data.token_updated_at ? new Date(data.token_updated_at).getTime() : 0 };
    }
    return curToken;
}
async function rotateToken() {
    rotating = true;
    curToken = { code: genToken(), at: Date.now() };
    if (supabaseClient) {
        const { error } = await supabaseClient.from('settings').update({ exam_token: curToken.code, token_updated_at: new Date(curToken.at).toISOString() }).eq('id', 1);
        if (error) showModal('Gagal Menyimpan Token', error.message + ' — pastikan kolom exam_token & token_updated_at sudah dibuat di tabel settings.', 'error');
    }
    rotating = false;
    return curToken;
}

async function renderTokenTab(area) {
    area.innerHTML = `
        <h3 class="text-base font-bold text-white mb-1"><i class="fa-solid fa-key text-amber-400 mr-2"></i>Token Ujian Otomatis</h3>
        <p class="text-xs text-slate-400 mb-4">Token acak 6 digit diganti otomatis tiap 15 menit. Bacakan/tampilkan token ini kepada siswa di ruang ujian. <strong class="text-amber-400">Biarkan halaman ini tetap terbuka selama ujian</strong> agar token terus diperbarui.</p>
        <div class="bg-slate-900 border border-slate-700 rounded-2xl p-8 text-center max-w-md">
            <div id="tok-code" class="text-5xl sm:text-6xl font-mono font-extrabold tracking-[0.3em] text-amber-400 pl-4">------</div>
            <p class="text-xs text-slate-400 mt-3">Berganti otomatis dalam <span id="tok-left" class="font-mono text-white">--:--</span></p>
            <button onclick="manualRotateToken()" class="mt-5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold px-4 py-2 rounded-xl"><i class="fa-solid fa-rotate mr-1"></i> Acak Token Sekarang</button>
        </div>`;
    let t = await getToken();
    curToken = t;
    if (!t.code || Date.now() - t.at >= TOKEN_MS) await rotateToken();
    const tick = async () => {
        const codeEl = document.getElementById('tok-code');
        if (!codeEl) { clearInterval(tokenTimer); return; }
        let left = TOKEN_MS - (Date.now() - curToken.at);
        if (left <= 0 && !rotating) { await rotateToken(); left = TOKEN_MS; }
        codeEl.innerText = curToken.code || '------';
        const s = Math.max(0, Math.round(left / 1000));
        document.getElementById('tok-left').innerText = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    };
    await tick();
    clearInterval(tokenTimer);
    tokenTimer = setInterval(tick, 1000);
}
async function manualRotateToken() { await rotateToken(); }
