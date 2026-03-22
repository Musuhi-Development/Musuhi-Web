#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env.local"
TMP_DIR="${TMPDIR:-/tmp}"
DUMP_SQL="$TMP_DIR/musuhi_local_dump.sql"
SYNC_SQL="$TMP_DIR/musuhi_local_sync.sql"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "[ERROR] .env.local が見つかりません: $ENV_FILE"
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "[ERROR] docker が見つかりません"
  exit 1
fi

if ! docker ps --format '{{.Names}}' | grep -q '^musuhi_postgres$'; then
  echo "[ERROR] musuhi_postgres コンテナが起動していません"
  echo "       docker compose up -d db を先に実行してください"
  exit 1
fi

DIRECT_URL="$(grep '^DIRECT_URL=' "$ENV_FILE" | sed -e 's/^DIRECT_URL=//' -e 's/^"//' -e 's/"$//')"
DATABASE_URL="$(grep '^DATABASE_URL=' "$ENV_FILE" | sed -e 's/^DATABASE_URL=//' -e 's/^"//' -e 's/"$//')"

if [[ -z "$DIRECT_URL" && -z "$DATABASE_URL" ]]; then
  echo "[ERROR] .env.local の DIRECT_URL / DATABASE_URL が未設定です"
  exit 1
fi

extract_host() {
  local url="$1"
  echo "$url" | sed -E 's|^postgres(ql)?://[^@]+@([^:/?]+).*|\2|'
}

docker_can_resolve() {
  local host="$1"
  docker run --rm postgres:16-alpine sh -lc "getent hosts $host >/dev/null 2>&1"
}

TARGET_URL=""
if [[ -n "$DIRECT_URL" ]]; then
  DIRECT_HOST="$(extract_host "$DIRECT_URL")"
  if docker_can_resolve "$DIRECT_HOST"; then
    TARGET_URL="$DIRECT_URL"
  else
    echo "[WARN] DIRECT_URLホスト($DIRECT_HOST)をDockerから解決できません。DATABASE_URLへフォールバックします。"
  fi
fi

if [[ -z "$TARGET_URL" && -n "$DATABASE_URL" ]]; then
  DB_HOST="$(extract_host "$DATABASE_URL")"
  if docker_can_resolve "$DB_HOST"; then
    TARGET_URL="$DATABASE_URL"
  fi
fi

if [[ -z "$TARGET_URL" ]]; then
  echo "[ERROR] Supabase接続先ホストをDockerから解決できませんでした"
  exit 1
fi

cat > "$SYNC_SQL" <<'SQL'
BEGIN;
TRUNCATE TABLE
  "Like",
  "Comment",
  "Board",
  "YosegakiContribution",
  "Gift",
  "Recording",
  "Yosegaki",
  "Connection",
  "User"
CASCADE;
SQL

echo "[INFO] ローカルDBからデータをダンプしています..."
docker exec musuhi_postgres sh -lc 'PGPASSWORD="$POSTGRES_PASSWORD" pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --schema=public --data-only --inserts --column-inserts --disable-triggers --no-owner --no-privileges' > "$DUMP_SQL"

cat "$DUMP_SQL" >> "$SYNC_SQL"
echo "COMMIT;" >> "$SYNC_SQL"

echo "[INFO] Supabase へ反映しています..."
docker run --rm -i -e TARGET_URL="$TARGET_URL" postgres:16-alpine sh -lc 'psql "$TARGET_URL" -v ON_ERROR_STOP=1' < "$SYNC_SQL"

echo "[DONE] ローカルPostgreSQL -> Supabase へデータ同期が完了しました"
