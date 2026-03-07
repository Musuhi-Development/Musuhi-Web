# Musuhi - ボイスダイアリー & ギフトプラットフォーム

声で記録し、声で繋がる。感情と思い出を大切な人と共有するプラットフォーム。

## 🚀 セットアップガイド

### 前提条件

- Node.js 18以上
- Docker & Docker Compose
- Supabaseアカウント

### 1. Supabaseプロジェクト作成

1. [Supabase](https://supabase.com)にアクセスしてアカウント作成
2. "New Project"をクリック
3. プロジェクト情報を入力：
   - Name: `musuhi`（任意）
   - Database Password: 安全なパスワードを設定
   - Region: `Northeast Asia (Tokyo)` 推奨
4. プロジェクト作成完了まで待つ（数分かかります）

### 2. Supabase API認証情報取得

プロジェクト作成後：

1. Project Settings → API に移動
2. 以下の値をコピー：
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** (secret) → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Supabase Auth設定

1. Authentication → URL Configuration に移動
2. 以下を設定：
   - **Site URL**: `http://localhost:3001`
   - **Redirect URLs**: `http://localhost:3001/api/auth/callback`

### 4. 環境変数設定

`.env.local`ファイルを作成して編集：

```bash
# .env.exampleをコピー
cp .env.example .env.local

# エディタで開いて編集
nano .env.local  # または vim, code など
```

`.env.local`に以下を設定：

```bash
# Database (そのまま)
DATABASE_URL="postgresql://musuhi_user:musuhi_password@db:5432/musuhi_db?schema=public"

# Supabase (ステップ2で取得した値を設定)
NEXT_PUBLIC_SUPABASE_URL="https://xxxxxxxxxxxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGc......your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGc......your-service-role-key"
```

⚠️ **重要**: `.env.local`ファイルを作成してから次のステップに進んでください。

### 5. アプリケーション起動

```bash
# Dockerコンテナ起動
docker-compose up -d

# ログ確認
docker-compose logs -f next-app

# データベーススキーマ適用
docker-compose exec next-app npx prisma db push
```

アプリケーションが起動したら: http://localhost:3001

### 6. テストユーザー作成

Supabase Dashboardでユーザーを作成：

1. [Supabase Dashboard](https://supabase.com/dashboard) → プロジェクト選択
2. Authentication → Users に移動
3. "Add user" → "Create new user"をクリック
4. 以下を入力：
   - Email: `test@example.com`
   - Password: `password123`
   - Auto Confirm User: ✅ ON（重要）
5. 追加のテストユーザーも同様に作成

### 7. ログイン

http://localhost:3001/login にアクセスして、作成したアカウントでログイン

## 🛠 開発コマンド

```bash
# コンテナ起動
docker-compose up -d

# コンテナ停止
docker-compose down

# ログ表示
docker-compose logs -f next-app

# Prisma Studio（DB管理ツール）
# http://localhost:5555 で自動起動

# データベースリセット
docker-compose exec next-app npx prisma db push --force-reset
```

## 📁 プロジェクト構造

```
.
├── prisma/
│   ├── schema.prisma      # データベーススキーマ
│   └── seed.ts            # シードスクリプト（Supabase Authガイド）
├── src/
│   ├── app/
│   │   ├── (auth)/        # 認証ページ（login, signup）
│   │   ├── (main)/        # メインアプリ（home, board, gift, mypage）
│   │   └── api/           # APIエンドポイント
│   ├── components/        # 共通UIコンポーネント
│   └── lib/
│       ├── auth.ts        # 認証ユーティリティ
│       ├── prisma.ts      # Prismaクライアント
│       └── supabase/      # Supabaseクライアント
├── docker-compose.yml     # Docker設定
└── .env.local            # 環境変数
```

## 🔧 トラブルシューティング

### Supabase接続エラー

```
Error: supabaseUrl is required
```

→ `.env.local`の`NEXT_PUBLIC_SUPABASE_URL`と`NEXT_PUBLIC_SUPABASE_ANON_KEY`が正しく設定されているか確認

### ログインできない

1. Supabase Dashboardで"Auto Confirm User"がONになっているか確認
2. Emailが正しいか確認（スペルミス注意）
3. Supabase Dashboardの Authentication → Users でユーザーが作成されているか確認

### データベース接続エラー

```bash
# コンテナ再起動
docker-compose restart

# データベーススキーマ再適用
docker-compose exec next-app npx prisma db push
```

## 📚 技術スタック

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: PostgreSQL 16 (Docker)
- **ORM**: Prisma 5
- **Authentication**: Supabase Auth
- **Icons**: Lucide React
- **Deployment**: Docker Compose

## 📝 API エンドポイント

- `POST /api/auth/login` - ログイン
- `POST /api/auth/signup` - 新規登録
- `POST /api/auth/logout` - ログアウト
- `GET /api/recordings` - 録音一覧取得
- `POST /api/recordings` - 録音作成
- `GET /api/gifts` - ギフト一覧取得
- `POST /api/gifts` - ギフト作成
- `GET /api/board` - ボード投稿一覧取得
- `POST /api/board` - ボード投稿作成
- `GET /api/users/me` - 現在のユーザー情報取得

詳細は[API_IMPLEMENTATION.md](API_IMPLEMENTATION.md)を参照

## ⚠️ 注意事項

- `.env.local`は **絶対にGitにコミットしない**
- `SUPABASE_SERVICE_ROLE_KEY`は本番環境のみで使用する機密情報
- 開発環境では`http://localhost:3001`を使用
- 本番デプロイ時はURL設定を更新すること

## 📄 ライセンス

This project is private and confidential.
