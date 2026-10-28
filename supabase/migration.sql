-- Jalankan di Supabase > SQL Editor
alter table settings add column if not exists exam_token text;
alter table settings add column if not exists token_updated_at timestamptz;
alter table exams add column if not exists duration_minutes int;          -- opsional (default 2 menit/soal)
alter table student_results add column if not exists correct_count int;
alter table student_results add column if not exists total_questions int;
alter table student_results add column if not exists violations int default 0;
