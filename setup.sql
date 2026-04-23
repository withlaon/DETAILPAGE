-- =============================================
-- DetailCraft - Supabase 초기 설정 SQL
-- Supabase SQL Editor에서 이 파일을 실행하세요
-- =============================================

-- 1. 상세페이지 테이블 생성
CREATE TABLE IF NOT EXISTS public.detail_pages (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title       TEXT NOT NULL,
  category    TEXT NOT NULL DEFAULT '가방',
  sections    JSONB NOT NULL DEFAULT '[]'::jsonb,
  thumbnail_url TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. updated_at 자동 갱신 함수
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. 트리거 등록
DROP TRIGGER IF EXISTS set_updated_at ON public.detail_pages;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.detail_pages
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 4. RLS(Row Level Security) 활성화
ALTER TABLE public.detail_pages ENABLE ROW LEVEL SECURITY;

-- 5. 모든 작업 허용 정책 (개인/팀 사용용)
--    필요시 auth.uid() 기반으로 변경 가능
DROP POLICY IF EXISTS "allow_all" ON public.detail_pages;
CREATE POLICY "allow_all" ON public.detail_pages
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 6. 인덱스
CREATE INDEX IF NOT EXISTS idx_detail_pages_category ON public.detail_pages(category);
CREATE INDEX IF NOT EXISTS idx_detail_pages_created_at ON public.detail_pages(created_at DESC);

-- =============================================
-- Storage 버킷 설정 (Supabase 대시보드에서 수동으로)
-- 1. Storage > New bucket
-- 2. 이름: detail-images
-- 3. Public bucket: 체크
-- 4. File size limit: 10MB
-- =============================================

-- 완료 확인
SELECT 'Setup complete!' AS status;
