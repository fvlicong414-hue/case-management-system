-- ============================================================================
-- 追加マイグレーション: 既存のデータベースに後から追加したカラムを反映する
-- ============================================================================
-- postgres.sql の CREATE TABLE IF NOT EXISTS は「テーブルが無ければ作る」だけで、
-- 既にあるテーブルに新しい列を追加することはできない。
-- そのため、後からテーブルへ列を追加した場合は、ここに
-- ALTER TABLE ... ADD COLUMN IF NOT EXISTS ... を追記していく。
-- (何度実行しても安全なように IF NOT EXISTS を必ず付ける)

ALTER TABLE settings ADD COLUMN IF NOT EXISTS monthly_fixed_cost DOUBLE PRECISION NOT NULL DEFAULT 0.0;
