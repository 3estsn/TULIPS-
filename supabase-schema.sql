-- ==============================================================
-- TULIPS 高校向け学習記録システム - 新規 Supabase スキーマ定義
-- 
-- 【使い方】
-- 1. Supabase ダッシュボード (https://supabase.com/dashboard) を開きます。
-- 2. プロジェクトを選択し、左メニューの「SQL Editor」を開きます。
-- 3. 「New query」を押し、このファイルの内容をすべて貼り付けて「Run」を実行してください。
-- ==============================================================

-- 1. 学習記録テーブル (study_records)
CREATE TABLE IF NOT EXISTS public.study_records (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    subject_id TEXT NOT NULL,
    material_id TEXT NOT NULL,
    material_name TEXT NOT NULL,
    date TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    notes TEXT,
    method TEXT DEFAULT 'manual',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. 定期テスト課題テーブル (教員配信: regular_test_tasks)
CREATE TABLE IF NOT EXISTS public.regular_test_tasks (
    id TEXT PRIMARY KEY,
    teacher_id TEXT NOT NULL,
    teacher_name TEXT NOT NULL,
    title TEXT NOT NULL,
    subject_id TEXT NOT NULL,
    target_grade INTEGER NOT NULL,
    target_class TEXT NOT NULL,
    scope TEXT NOT NULL,
    deadline TEXT NOT NULL,
    notes TEXT,
    material_ids JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. 生徒学習計画タスクテーブル (student_tasks)
CREATE TABLE IF NOT EXISTS public.student_tasks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    subject_id TEXT NOT NULL,
    material_id TEXT NOT NULL,
    material_name TEXT NOT NULL,
    regular_test_task_id TEXT,
    deadline TEXT NOT NULL,
    buffer_days INTEGER DEFAULT 1,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. 教材構造マスターテーブル (materials)
CREATE TABLE IF NOT EXISTS public.materials (
    id TEXT PRIMARY KEY,
    subject_id TEXT NOT NULL,
    name TEXT NOT NULL,
    is_default BOOLEAN DEFAULT false,
    structure JSONB DEFAULT '{}'::jsonb
);

-- 5. 教科マスターテーブル (subjects)
CREATE TABLE IF NOT EXISTS public.subjects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    color TEXT
);

-- 6. ユーザープロファイルテーブル (users)
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    role TEXT NOT NULL DEFAULT 'student',
    grade INTEGER,
    class_room TEXT,
    student_number INTEGER,
    weekly_goal_minutes INTEGER DEFAULT 900,
    focus_subject_id TEXT DEFAULT 'math'
);

-- ==============================================================
-- Supabase Realtime (リアルタイム同期) の有効化
-- ==============================================================
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.study_records;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.regular_test_tasks;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.student_tasks;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.materials;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.subjects;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- Row Level Security (RLS) 設定 & 全公開ポリシー
ALTER TABLE public.study_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regular_test_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public all access on study_records" ON public.study_records;
CREATE POLICY "Allow public all access on study_records" ON public.study_records FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all access on regular_test_tasks" ON public.regular_test_tasks;
CREATE POLICY "Allow public all access on regular_test_tasks" ON public.regular_test_tasks FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all access on student_tasks" ON public.student_tasks;
CREATE POLICY "Allow public all access on student_tasks" ON public.student_tasks FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all access on materials" ON public.materials;
CREATE POLICY "Allow public all access on materials" ON public.materials FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all access on subjects" ON public.subjects;
CREATE POLICY "Allow public all access on subjects" ON public.subjects FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all access on users" ON public.users;
CREATE POLICY "Allow public all access on users" ON public.users FOR ALL USING (true) WITH CHECK (true);

-- 初期教科マスターデータ挿入
INSERT INTO public.subjects (id, name, category, color) VALUES
('japanese', '国語', 'japanese', '#ef4444'),
('math', '数学', 'math', '#3b82f6'),
('science', '理科', 'science', '#10b981'),
('social', '社会', 'social', '#eab308'),
('english', '英語', 'english', '#8b5cf6'),
('info', '情報', 'info', '#06b6d4'),
('other', 'その他', 'other', '#64748b')
ON CONFLICT (id) DO NOTHING;
