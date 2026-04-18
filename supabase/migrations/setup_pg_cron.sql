-- ============================================================
-- pg_cron 자동 수집 스케줄 설정
-- 매주 토요일 오전 3시부터 active 지역을 5분 간격으로 순차 수집
--
-- 실행 전 준비:
--   1. Supabase 대시보드 → Database → Extensions → pg_cron, pg_net 활성화
--   2. 아래 YOUR_SERVICE_ROLE_KEY를 실제 service_role key로 교체 후 실행
-- ============================================================

-- ──────────────────────────────────────────────────────────
-- 0. DB 설정값 저장 (service_role key는 절대 코드에 커밋하지 말 것)
-- ──────────────────────────────────────────────────────────
ALTER DATABASE postgres
  SET app.supabase_url        = 'https://mdpqzcwamhzxybldvctr.supabase.co';

ALTER DATABASE postgres
  SET app.service_role_key    = 'YOUR_SERVICE_ROLE_KEY';  -- ← 여기 교체

-- ──────────────────────────────────────────────────────────
-- 1. 단일 지역 Edge Function 호출 함수
--    pg_net으로 update-hotspots를 비동기 호출한다.
--    last_updated는 Edge Function 내부에서 직접 업데이트함.
-- ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.call_update_hotspots(region_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM net.http_post(
    url     := current_setting('app.supabase_url') || '/functions/v1/update-hotspots',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body    := jsonb_build_object('region', region_name)
  );
END;
$$;

-- ──────────────────────────────────────────────────────────
-- 2. active stations → 개별 cron 잡 동기화 함수
--    매주 토요일 2:50에 실행되어 3:00부터 5분 간격으로 잡을 등록.
--    stations 테이블이 변경되면 자동으로 다음 주에 반영됨.
-- ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.sync_station_cron_jobs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rec   RECORD;
  idx   int := 0;
  hr    int;
  mn    int;
  sched text;
BEGIN
  -- 기존 자동 생성 잡 전체 제거
  FOR rec IN
    SELECT jobname FROM cron.job WHERE jobname LIKE 'spottr_auto_%'
  LOOP
    PERFORM cron.unschedule(rec.jobname);
  END LOOP;

  -- active stations를 id 오름차순으로 읽어 3:00부터 5분 간격 등록
  FOR rec IN
    SELECT name FROM public.stations WHERE active = true ORDER BY id
  LOOP
    mn    := (idx * 5) % 60;
    hr    := 3 + ((idx * 5) / 60);
    sched := mn || ' ' || hr || ' * * 6';  -- 매주 토요일 (0=일, 6=토)

    PERFORM cron.schedule(
      'spottr_auto_' || rec.name,           -- 잡 이름
      sched,                                 -- cron 표현식
      format(
        'SELECT public.call_update_hotspots(%L);',
        rec.name
      )
    );

    idx := idx + 1;
  END LOOP;

  RAISE NOTICE 'spottr: % 개 지역 cron 잡 등록 완료', idx;
END;
$$;

-- ──────────────────────────────────────────────────────────
-- 3. 마스터 잡: 매주 토요일 2:50에 지역 잡 동기화 실행
-- ──────────────────────────────────────────────────────────
SELECT cron.schedule(
  'spottr_sync_jobs',   -- 잡 이름
  '50 2 * * 6',         -- 매주 토요일 02:50 (UTC 기준)
  'SELECT public.sync_station_cron_jobs();'
);

-- ──────────────────────────────────────────────────────────
-- 4. 최초 1회 즉시 동기화 (지금 잡을 바로 등록하고 싶을 때)
-- ──────────────────────────────────────────────────────────
SELECT public.sync_station_cron_jobs();

-- ──────────────────────────────────────────────────────────
-- 확인 쿼리 (실행 후 등록된 잡 목록 조회)
-- ──────────────────────────────────────────────────────────
-- SELECT jobname, schedule, command
-- FROM cron.job
-- WHERE jobname LIKE 'spottr%'
-- ORDER BY jobname;
