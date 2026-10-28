# CBT SAS - SMKN 1 Wakatobi

Aplikasi ujian berbasis komputer (CBT) statis: HTML + Tailwind (CDN) + Supabase.

## Struktur
- `index.html` - kerangka halaman
- `css/style.css` - gaya tampilan & cetak
- `js/*.js` - modul aplikasi (urutan pemuatan diatur di `index.html`)
- `supabase/migration.sql` - kolom tambahan yang wajib dibuat di database

## Setup
1. Jalankan `supabase/migration.sql` di Supabase SQL Editor.
2. Isi `SUPABASE_URL` dan `SUPABASE_ANON_KEY` di `js/config.js`.
3. Deploy ke GitHub Pages (Settings > Pages > Deploy from a branch > `main` / root).

## Fitur
Token ujian 15 menit, cetak kartu peserta, upload CSV siswa, rekap nilai & berita acara, mesin CBT dengan timer dan auto-submit.
