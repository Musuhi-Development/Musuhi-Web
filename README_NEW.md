# Musuhi Web

音声で感情を記録・共有するボイスアルバムアプリケーション

## 機能

- 🎙️ **音声録音** - 日々の出来事を音声で記録
- 🎁 **ボイスギフト** - 大切な人に音声メッセージを送る
- 📝 **寄せ音声** - 複数人からの音声メッセージを集める
- 💬 **コミュニティボード** - 音声付き投稿の共有
- 🤝 **つながり** - ユーザー同士のコネクション機能
- 🤖 **AI感情分析** - 音声から感情を自動分析

## 技術スタック

- **フロントエンド**: Next.js 16 (App Router), React 19, TypeScript
- **スタイリング**: Tailwind CSS 4
- **バックエンド**: Next.js API Routes
- **データベース**: PostgreSQL + Prisma ORM
- **認証**: Supabase Auth
- **ストレージ**: Supabase Storage
- **開発環境**: Docker + Docker Compose

## セットアップ

### 前提条件

- Docker & Docker Compose
- Node.js 20+ (ローカル開発の場合)
- Supabaseアカウント

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd Musuhi-Web
```

### 2. 環境変数の設定

`.env.example` を `.env.local` にコピー：

```bash
cp .env.example .env.local
```

Supabaseの認証情報を設定：

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Supabaseの設定

#### ストレージバケットの作成

1. Supabaseダッシュボードで Storage > New bucket
2. バケット名: `audio-recordings`
3. Public bucket: 有効化

#### ストレージポリシーの設定

```sql
-- 認証済みユーザーはアップロード可能
create policy "Authenticated users can upload"
on storage.objects for insert
to authenticated
with check (bucket_id = 'audio-recordings');

-- 全員が読み取り可能
create policy "Anyone can read"
on storage.objects for select
to public
using (bucket_id = 'audio-recordings');
```

### 4. アプリケーションの起動

#### Dockerを使用（推奨）

```bash
docker compose up --build
```

アプリケーションがポート3001で起動します：
- アプリ: http://localhost:3001
- Prisma Studio: http://localhost:5555

#### ローカル開発

```bash
# 依存関係のインストール
npm install

# Prismaの設定
npx prisma generate
npx prisma db push

# 開発サーバー起動
npm run dev
```

## プロジェクト構造

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 認証ページ
│   │   ├── login/
│   │   └── signup/
│   ├── (main)/            # メインアプリ
│   │   ├── home/          # ホーム（録音一覧）
│   │   ├── record/        # 録音ページ
│   │   ├── gift/          # ギフト
│   │   ├── board/         # コミュニティボード
│   │   └── mypage/        # マイページ
│   └── api/               # APIルート
│       ├── auth/          # 認証API
│       ├── recordings/    # 録音API
│       ├── gifts/         # ギフトAPI
│       ├── yosegaki/      # 寄せ音声API
│       ├── board/         # ボードAPI
│       ├── connections/   # つながりAPI
│       ├── users/         # ユーザーAPI
│       └── upload/        # ファイルアップロードAPI
├── components/            # Reactコンポーネント
│   └── shared/           # 共有コンポーネント
├── hooks/                # カスタムフック
├── lib/                  # ユーティリティとクライアント
│   ├── prisma.ts         # Prismaクライアント
│   ├── auth.ts           # 認証ヘルパー
│   └── supabase/         # Supabaseクライアント
└── prisma/
    └── schema.prisma     # データベーススキーマ
```

## API ドキュメント

詳細なAPI実装ガイドは [API_IMPLEMENTATION.md](./API_IMPLEMENTATION.md) を参照してください。

## 開発手順書

日常開発・DB運用・Session Pooler + Prisma の手順は [DEVELOPMENT_RUNBOOK.md](./DEVELOPMENT_RUNBOOK.md) を参照してください。

### 主要なAPIエンドポイント

#### 認証
- `POST /api/auth/login` - ログイン
- `POST /api/auth/signup` - サインアップ
- `POST /api/auth/logout` - ログアウト

#### 録音
- `GET /api/recordings` - 録音一覧
- `POST /api/recordings` - 新規録音
- `GET /api/recordings/[id]` - 録音詳細
- `PUT /api/recordings/[id]` - 録音更新
- `DELETE /api/recordings/[id]` - 録音削除

#### ギフト
- `GET /api/gifts` - ギフト一覧
- `POST /api/gifts` - ギフト作成
- `GET /api/gifts/[id]` - ギフト詳細

#### ボード
- `GET /api/board` - 投稿一覧
- `POST /api/board` - 新規投稿
- `POST /api/board/[id]/like` - いいね
- `POST /api/board/[id]/comment` - コメント追加

## 開発

### 利用可能なスクリプト

```bash
# 開発サーバー
npm run dev

# ビルド
npm run build

# 本番サーバー
npm start

# Prisma Studio（データベースGUI）
npm run prisma:studio

# Prismaマイグレーション
npm run prisma:push

# Prismaクライアント生成
npm run prisma:generate
```

### データベースの管理

Prisma Studioでデータベースを視覚的に管理：

```bash
npm run prisma:studio
```

または Docker使用時は http://localhost:5555

## トラブルシューティング

### npm installがエラーになる

WSL環境で権限エラーが発生する場合は、Dockerを使用：

```bash
docker compose up --build
```

### Supabase認証エラー

1. `.env.local` の環境変数を確認
2. Supabaseダッシュボードでプロジェクトの有効化を確認
3. リダイレクトURL設定: `http://localhost:3001/api/auth/callback`

### データベース接続エラー

Docker Composeのデータベースヘルスチェックを確認：

```bash
docker compose ps
```

## ライセンス

MIT

## 貢献

プルリクエストを歓迎します！大きな変更の場合は、まずIssueを開いて変更内容を議論してください。
