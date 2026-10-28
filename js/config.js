/**
 * Konfigurasi Supabase & state global aplikasi
 */
// ==========================================
// KONFIGURASI SUPABASE (Ganti dengan kredensial Anda)
// ==========================================
const SUPABASE_URL = 'https://xtsvuydmdyirsnzrrzmt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0c3Z1eWRtZHlpcnNuenJyem10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMxNzA3MjYsImV4cCI6MjEwODc0NjcyNn0.ilTHrt7MYhzhIuctiWedrV8neh1TCS_hIrehmEqSWsI';

// Inisialisasi Klien Supabase (jika kredensial belum diisi, fallback ke mode lokal/demo)
let supabaseClient = null;
try {
    if (SUPABASE_URL !== 'https://YOUR_PROJECT_REF.supabase.co') {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
} catch (e) {
    console.warn("Supabase belum dikonfigurasi dengan benar, menggunakan state memori lokal.");
}

// State Aplikasi
let currentUser = null; // { role: 'admin'|'teacher'|'student', data: {...} }
let currentSettings = { school_name: 'SMKN 1 Wakatobi', headmaster_name: 'Drs. La Ode...', headmaster_nip: '1968...', academic_year: '2026/2027', semester: 'Ganjil' };
