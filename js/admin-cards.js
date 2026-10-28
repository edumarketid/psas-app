/**
 * Admin: pusat cetak kartu peserta ujian
 */
let cardStudents = [];

async function renderCardsTab(area) {
    area.innerHTML = '<p class="text-xs text-slate-400">Memuat data siswa...</p>';
    cardStudents = [];
    if (supabaseClient) {
        const { data } = await supabaseClient.from('students').select('*').order('kelas').order('name').limit(5000);
        cardStudents = data || [];
    }
    const kelasList = [...new Set(cardStudents.map(s => s.kelas))].sort();
    area.innerHTML = `
        <h3 class="text-base font-bold text-white mb-1"><i class="fa-solid fa-id-card text-blue-400 mr-2"></i>Pusat Cetak Kartu Peserta Ujian</h3>
        <p class="text-xs text-slate-400 mb-4">Cetak kartu login massal (8 kartu per lembar A4). Pilih "Simpan sebagai PDF" di dialog cetak bila perlu.</p>
        <div class="flex flex-col sm:flex-row gap-3 max-w-xl items-end">
            <div class="flex-1 w-full"><label class="block text-xs text-slate-300 mb-1">Pilih Kelas</label>
                <select id="card-kelas" onchange="updateCardCount()" class="${inputCls}">
                    <option value="all">Semua Kelas</option>${kelasList.map(k => `<option value="${esc(k)}">${esc(k)}</option>`).join('')}
                </select></div>
            <button onclick="printCards()" class="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl"><i class="fa-solid fa-print mr-1"></i> Cetak Kartu</button>
        </div>
        <p id="card-count" class="text-xs text-slate-400 mt-3"></p>`;
    updateCardCount();
}
const cardList = () => { const k = document.getElementById('card-kelas').value; return k === 'all' ? cardStudents : cardStudents.filter(s => s.kelas === k); };
function updateCardCount() { document.getElementById('card-count').innerText = `${cardList().length} kartu akan dicetak.`; }

async function printCards() {
    const list = cardList();
    if (!list.length) { showModal('Tidak Ada Data', 'Tidak ada siswa pada kelas yang dipilih.', 'error'); return; }
    const t = await getToken();
    const tokenTxt = t.code && Date.now() - t.at < TOKEN_MS ? t.code : '------';
    const card = s => `
        <div class="pa-card">
            <h4>KARTU PESERTA UJIAN</h4>
            <div class="sub">${esc(currentSettings.school_name)} &bull; SAS ${esc(currentSettings.semester)} ${esc(currentSettings.academic_year)}</div>
            <table>
                <tr><td>Nama</td><td>: <b>${esc(s.name)}</b></td></tr>
                <tr><td>Kelas</td><td>: ${esc(s.kelas)}</td></tr>
                <tr><td>ID Login (NISN)</td><td>: <span class="mono">${esc(s.nisn)}</span></td></tr>
                <tr><td>PIN</td><td>: <span class="mono">${esc(s.pin)}</span></td></tr>
                <tr><td>Token Aktif</td><td>: <span class="mono">${tokenTxt}</span></td></tr>
            </table>
            <div class="note">Token berganti tiap 15 menit. Gunakan token terbaru dari pengawas saat memulai ujian.</div>
        </div>`;
    let html = '';
    for (let i = 0; i < list.length; i += 8) html += `<div class="pa-page"><div class="pa-grid">${list.slice(i, i + 8).map(card).join('')}</div></div>`;
    document.getElementById('print-area').innerHTML = html;
    window.print();
}
