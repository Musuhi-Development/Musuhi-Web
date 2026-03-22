# Musuhi 開発手順書（Session Pooler + Prisma）

この手順書は、Musuhi-Web を以下の方針で開発・運用するための実務ガイドです。

- 認証: Supabase Auth
- ストレージ: Supabase Storage
- DB: Supabase PostgreSQL
- ORM/スキーマ管理: Prisma
- 開発実行: Docker Compose
- 接続方針: Session Pooler を基本利用

---

## 1. 役割分担（重要）

### Prisma の役割
- `prisma/schema.prisma` でデータモデルを定義する
- Prisma Client で型安全にクエリを書く
- スキーマ変更の適用（`db push` もしくは migrate）を行う

### Supabase の役割
- PostgreSQL 本体を提供する
- Auth（ログイン/ユーザー管理）を提供する
- Storage（音声/画像/アバター）を提供する
- RLS ポリシーでアクセス制御する

### 運用原則
- スキーマの正は Prisma
- 実データの正は Supabase PostgreSQL
- アプリコードは Prisma Client 経由で DB を操作する

---

## 2. 前提条件

- Docker / Docker Compose が利用可能
- Supabase プロジェクトが作成済み
- `.env.local` が存在する

---

## 3. 環境変数の設定

`.env.local` の必須項目:

```env
NEXT_PUBLIC_SUPABASE_URL="https://<project-ref>.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<anon-key>"
SUPABASE_SERVICE_ROLE_KEY="<service-role-key>"

# Session Pooler 前提
DATABASE_URL="postgresql://<user>:<password>@<pooler-host>:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://<user>:<password>@<pooler-host>:6543/postgres?pgbouncer=true&connection_limit=1"
```

注意:
- このプロジェクトでは Session Pooler 利用を前提に運用
- WSL/Docker 環境では Direct host (`db.<ref>.supabase.co:5432`) が到達不可のケースがある
- その場合は Pooler 側に統一する

---

## 4. 起動手順

```bash
docker compose up --build
```

確認ポイント:
- `next-app` が起動している
- ログに Prisma 接続エラー（P1001 / Tenant or user not found）が出ない
- `http://localhost:3001` にアクセスできる

---

## 5. 日常開発フロー

### 5.1 UI / API ロジックのみ変更（スキーマ変更なし）
1. コード修正
2. 動作確認
3. 必要なら `docker compose logs -f next-app` でログ確認

### 5.2 DBスキーマ変更あり
1. `prisma/schema.prisma` を変更
2. 起動中コンテナで適用

```bash
docker exec musuhi_next_app npx prisma generate
docker exec musuhi_next_app npx prisma db push
```

3. Prisma Client 利用コードを更新
4. API/画面動作を確認

---

## 6. 認証・ユーザー同期の動き

- ログイン時、Supabase Auth のセッションCookieを発行
- APIアクセス時、`src/lib/auth.ts` がセッションを検証
- Prisma 側 User レコードが未作成でも、必要に応じて補完同期される

確認API:
- `GET /api/users/me` が `200` なら認証/DB連携は正常

---

## 7. Storage アップロード運用

- 音声: `voice-recordings`
- 画像: `recording-images`
- アバター: `avatars`

RLS の基本条件:
- `bucket_id = '<bucket-name>'`
- `(storage.foldername(name))[1] = auth.uid()::text`

よくあるエラー:
- `new row violates row-level security policy`
  - バケットポリシー未設定、または `auth.uid()` と保存パスが不一致

---

## 8. ローカルDB -> Supabase 反映

ローカル Postgres（`musuhi_postgres`）で作業したデータを Supabase に反映したい場合:

```bash
bash ./scripts/sync-local-data-to-supabase.sh
```

補足:
- スクリプトは `.env.local` の `DIRECT_URL` / `DATABASE_URL` を参照
- 環境により Direct host が解決不可なら Pooler にフォールバック
- `Tenant or user not found` が出る場合は接続文字列のユーザー名/パスワード不一致を疑う

---

## 9. トラブルシューティング

### P1001: Can't reach database server
- ホスト到達不可。WSL/Docker の DNS/IPv6 制約が多い
- Pooler 側 URL に統一する

### FATAL: Tenant or user not found
- 接続文字列の資格情報が誤っている
- Supabase Dashboard から接続文字列を再取得して貼り直す

### GET /api/users/me が 401
- セッションCookie未発行、または期限切れ
- 再ログインして確認

### Upload 403（Storage）
- バケットRLSの INSERT ポリシーを確認
- `auth.uid()` とアップロードパス先頭フォルダが一致しているか確認

---

## 10. リリース前チェック

- `GET /api/users/me` が 200
- 録音一覧/投稿一覧が 200
- アバターアップロードが成功
- Prisma スキーマと実DBが一致
- `.env.local` の秘匿情報がコミット対象外である

---

## 11. 参考

- `prisma/schema.prisma`
- `src/lib/auth.ts`
- `src/app/api/upload/avatar/route.ts`
- `src/app/api/upload/route.ts`
- `src/app/api/upload/image/route.ts`
- `SUPABASE_DATABASE_SETUP.md`
- `SUPABASE_IMAGE_STORAGE_SETUP.md`
- `SUPABASE_STORAGE_SETUP.md`
