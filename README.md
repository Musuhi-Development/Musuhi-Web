# Musuhi-Web

声で記録し、声で繋がる。ボイスダイアリー & ギフトプラットフォーム

## 🚀 クイックスタート

### 前提条件
- Docker & Docker Compose
- Supabaseアカウント（無料）

### セットアップ（5分）

1. **リポジトリをクローン**
   ```bash
   git clone https://github.com/Musuhi-Development/Musuhi-Web.git
   cd Musuhi-Web
   ```

2. **Supabaseプロジェクトを作成**
   
   詳細は [SETUP_GUIDE.md](SETUP_GUIDE.md) を参照

3. **環境変数を設定**
   ```bash
   cp .env.example .env.local
   # エディタで .env.local を開き、Supabase認証情報を入力
   ```

4. **アプリケーションを起動**
   ```bash
   docker-compose up -d
   ```

5. **テストユーザーを作成**
   
   [SUPABASE_USER_GUIDE.md](SUPABASE_USER_GUIDE.md) の手順に従ってSupabase Dashboardでユーザーを作成

6. **ログイン**
   
   http://localhost:3001/login にアクセス

## 📚 ドキュメント

- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - 完全なセットアップガイド
- **[SUPABASE_USER_GUIDE.md](SUPABASE_USER_GUIDE.md)** - ユーザー作成とログイン手順
- **[API_IMPLEMENTATION.md](API_IMPLEMENTATION.md)** - API仕様書

## 目次

- [01. 概要](#01-概要)
- [02. 技術スタック](#02-技術スタック)
- [03. 環境構築](#03-環境構築)
- [04. 実行手順](#04-実行手順)
- [05. Prisma（データベースORM）](#05-prismaデータベースorm)
- [06. Git操作ガイド](#06-git操作ガイド)
- [07. プロジェクト構成](#07-プロジェクト構成)
- [08. アーキテクチャ](#08-アーキテクチャ)
- [09. チーム開発者向け情報](#09-チーム開発者向け情報)

---

## 01. 概要

Musuhiは、声を手軽に録音し、アルバムとして残したり、大切な人へギフトとして贈ったり、仲間と共有できるプラットフォームです。

### 主な機能
- 🎙️ **ボイスダイアリー** - 日々の思いを声で記録
- 🎁 **ボイスギフト** - 大切な人に声のメッセージを贈る
- 👥 **寄せ音声** - 複数人でメッセージを集めて1つのギフトに
- 📢 **ボイスボード** - コミュニティで声を共有

## 02. 技術スタック

- **フロントエンド:** Next.js 16 (App Router), React 19, TypeScript
- **スタイリング:** Tailwind CSS 4
- **データベース:** PostgreSQL 16
- **ORM:** Prisma 5
- **認証:** Supabase Auth
- **インフラ:** Docker, Docker Compose
- **その他:** Lucide React (アイコン)

## 03. 環境構築

### 3.1 前提条件

- Docker & Docker Compose
- Node.js 18+ (ローカル開発する場合)
- Supabaseアカウント

### 3.2 セットアップ手順

#### ステップ1: リポジトリクローン
```bash
git clone https://github.com/Musuhi-Development/Musuhi-Web.git
cd Musuhi-Web
```

#### ステップ2: Supabaseプロジェクト作成

1. https://supabase.com でプロジェクト作成
2. Project Settings → API から認証情報を取得
3. Authentication → URL Configuration で Redirect URL を設定

詳細: [SETUP_GUIDE.md](SETUP_GUIDE.md)

#### ステップ3: 環境変数設定

```bash
cp .env.example .env.local
```

`.env.local` を編集：
```env
NEXT_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

3. **Dockerコンテナをビルドして起動します。**
   ```bash
   docker-compose up --build -d
   ```
   初回起動時は、依存関係のインストールとNext.jsのビルドに時間がかかる場合があります。

4. **アプリケーションにアクセスします。**
   - **Next.jsアプリ:** http://localhost:3001
   - **Prisma Studio:** http://localhost:5555

## 04. 実行手順

環境構築が完了している前提で、PCを起動した状態からアプリケーションを起動する手順を説明します。

### Windows (WSLを利用) の場合

1.  **Docker Desktopの起動**
    - タスクバーまたはスタートメニューから「Docker Desktop」を起動します。
    - Docker Desktopが起動し、クジラのアイコンが表示されるのを待ちます（通常30秒〜1分程度）。

2.  **Visual Studio Code (VSCode) の起動とプロジェクトを開く**
    - VSCodeを起動します。
    - 左下の緑色の `><` アイコンをクリックし、「**Connect to WSL**」を選択します。新しいVSCodeウィンドウがWSL環境に接続された状態で開きます。
    - VSCodeの上部メニューから `File` > `Open Folder...` を選択し、プロジェクトフォルダ（`Musuhi-Web`）を開きます。

3.  **ターミナルを開いてアプリケーションを起動**
    - VSCodeの上部メニューから `Terminal` > `New Terminal` を選択し、ターミナルを開きます。
    - ターミナルで以下のコマンドを実行します。
      ```bash
      docker compose up
      ```
    - ビルドが完了し、ターミナルに `Ready` と表示されたら、起動完了です（初回は数分かかることがあります）。

4.  **ブラウザでアクセス**
    - **Next.jsアプリ:** http://localhost:3001
    - **Prisma Studio（DBのGUI）:** http://localhost:5555

### 4.2 Macの場合

1.  **Docker Desktopの起動**
    - アプリケーションフォルダまたはDockから「Docker Desktop」を起動します。
    - Docker Desktopが起動し、クジラのアイコンが表示されるのを待ちます（通常30秒〜1分程度）。

2.  **Visual Studio Code (VSCode) の起動とプロジェクトを開く**
    - VSCodeを起動します。
    - VSCodeの上部メニューから `File` > `Open Folder...` を選択し、プロジェクトフォルダ（`Musuhi-Web`）を開きます。

3.  **ターミナルを開いてアプリケーションを起動**
    - VSCodeの上部メニューから `Terminal` > `New Terminal` を選択し、ターミナルを開きます。
    - ターミナルで以下のコマンドを実行します。
      ```bash
      docker compose up
      ```
    - ビルドが完了し、ターミナルに `Ready` と表示されたら、起動完了です（初回は数分かかることがあります）。

4.  **ブラウザでアクセス**
    - **Next.jsアプリ:** http://localhost:3001
    - **Prisma Studio（DBのGUI）:** http://localhost:5555

### 4.3 アプリケーションの停止方法

VSCodeで開いているターミナルで `Ctrl + C` を押すと、アプリケーションが停止します。

## 05. Prisma（データベースORM）

### 5.1 Prismaとは

Prismaは、型安全なデータベースアクセスを提供する次世代ORMです。このプロジェクトでは、PostgreSQLとのやり取りにPrismaを使用しています。

**主な特徴：**
- TypeScriptとの完全な型統合
- 直感的なデータモデリング
- マイグレーション管理
- Prisma Studio（GUIツール）によるデータベースの可視化

### 5.2 Prisma Studioの使い方

Prisma Studioは、データベースの内容をブラウザで確認・編集できるGUIツールです。

#### Docker環境での起動方法

**自動起動（推奨）：**

Docker環境では、`docker compose up` を実行すると自動的にPrisma Studioも起動します。

```bash
docker compose up
```

ブラウザで http://localhost:5555 にアクセスしてください。

#### 手動で起動する場合

Docker内で手動起動：
```bash
docker compose exec next-app npx prisma studio --port 5555 --hostname 0.0.0.0
```

ローカル環境で起動：
```bash
npm run prisma:studio
```

### 5.3 基本的なコマンド

#### Docker環境

```bash
# Prisma Clientの生成（スキーマからクライアントコードを生成）
docker compose exec next-app npx prisma generate

# データベースへのスキーマ反映（スキーマの変更をDBに反映）
docker compose exec next-app npx prisma db push

# Prisma Studioの起動（GUIでDB確認）
docker compose exec next-app npx prisma studio --port 5555 --hostname 0.0.0.0
```

#### ローカル環境

```bash
# Prisma Clientの生成
npm run prisma:generate

# データベースへのスキーマ反映
npm run prisma:push

# Prisma Studioの起動
npm run prisma:studio
```

### 5.4 コード内での使用方法

```typescript
import { prisma } from '@/lib/prisma'

// ユーザーの取得例
const user = await prisma.user.findUnique({
  where: { id: userId }
})

// レコーディングの作成例
const recording = await prisma.recording.create({
  data: {
    title: 'タイトル',
    audioUrl: 'https://...',
    duration: 120,
    userId: userId
  }
})
```

詳しくは[Prisma公式ドキュメント](https://www.prisma.io/docs)を参照してください。

## 06. Git操作ガイド

### 6.1 基本的なワークフロー

```bash
# 1. 最新の状態を取得
git checkout main
git pull origin main

# 2. 新しいブランチを作成
git checkout -b feature/your-feature-name

# 3. 変更を加えてコミット
git add .
git commit -m "feat: 新機能の説明"

# 4. リモートにプッシュ
git push origin feature/your-feature-name

# 5. GitHubでプルリクエストを作成
```

### 6.2 ブランチ戦略

- **`main`**: 本番環境にデプロイされる安定版ブランチ
- **`feature/機能名`**: 新機能開発用ブランチ
- **`fix/修正内容`**: バグ修正用ブランチ
- **`refactor/対象`**: リファクタリング用ブランチ

**例：**
```bash
feature/voice-recording    # 音声録音機能
fix/login-error           # ログインエラー修正
refactor/prisma-queries   # Prismaクエリのリファクタリング
```

### 6.3 コミットメッセージ規約

コミットメッセージは、以下のプレフィックスを使用してください：

- `feat:` - 新機能の追加
- `fix:` - バグ修正
- `docs:` - ドキュメントのみの変更
- `style:` - コードの意味に影響しない変更（空白、フォーマットなど）
- `refactor:` - バグ修正や機能追加を伴わないコードの改善
- `test:` - テストの追加や修正
- `chore:` - ビルドプロセスやツールの変更

**例：**
```bash
git commit -m "feat: ユーザープロフィール編集機能を追加"
git commit -m "fix: 音声再生時のエラーハンドリングを修正"
git commit -m "docs: READMEにPrisma Studioの説明を追加"
```

### 6.4 便利なGitコマンド

```bash
# 現在の状態を確認
git status

# 変更内容を確認
git diff

# コミット履歴を確認
git log --oneline

# ブランチ一覧を確認
git branch -a

# 変更を一時退避
git stash
git stash pop  # 退避した変更を戻す

# 直前のコミットを修正
git commit --amend

# 特定のファイルのみコミット
git add src/components/NewComponent.tsx
git commit -m "feat: 新しいコンポーネントを追加"
```

### 6.5 困ったときは

```bash
# 間違えてコミットした場合（まだpushしていない）
git reset --soft HEAD~1  # コミットを取り消し、変更は残す

# ローカルの変更を全て破棄して最新に戻す
git checkout .
git pull origin main

# コンフリクトが発生した場合
# 1. コンフリクトしているファイルを手動で編集
# 2. 編集後、以下を実行
git add .
git commit -m "fix: コンフリクトを解決"
```

## 07. プロジェクト構成

```
src/
├── app/
│   ├── layout.tsx                   # ルートレイアウト
│   ├── page.tsx                     # LP or /home へのリダイレクト
│   │
│   ├── (auth)/                      # 認証関連
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   │
│   ├── (main)/                      # メインアプリ（要ログイン）
│   │   ├── home/page.tsx            # ホーム（ボイスアルバム）
│   │   ├── record/page.tsx          # 録音
│   │   ├── gift/page.tsx            # ボイスギフト
│   │   ├── board/page.tsx           # ボイスボード
│   │   └── mypage/page.tsx          # マイページ
│   │
│   └── api/                         # API Routes (BFF)
│
├── components/
│   ├── ui/                          # 汎用UIパーツ
│   ├── shared/                      # 共通コンポーネント
│   └── features/                    # 機能別コンポーネント
│
├── lib/
│   ├── supabase/                    # Supabaseクライアント
│   ├── prisma.ts                    # Prismaクライアント
│   ├── database.types.ts            # DB型定義
│   └── ai-client.ts                 # AI APIクライアント
│
└── types/                           # アプリケーション固有の型定義
```

## 08. アーキテクチャ

- **Next.js App Router:** ファイルシステムベースのルーティングと、サーバーコンポーネント・クライアントコンポーネントを活用したレンダリング戦略を採用しています。
- **Docker:** Next.jsアプリケーションとPostgreSQLデータベースをコンテナ化し、開発環境の再現性を高めています。
- **Prisma:** 型安全なデータベースアクセスを提供するORMとして使用しています。スキーマファイル（`prisma/schema.prisma`）でデータモデルを定義します。
- **BFF (Backend For Frontend):** `src/app/api` にAPIルートを配置し、フロントエンドが必要とする形式にデータを加工・提供します。外部API（Supabase, AI APIなど）との連携もここで行います。
- **PostgreSQL:** ユーザーデータ、録音データ、ギフト情報などを格納します。

## 09. チーム開発者向け情報

- 新機能の開発は、`feature/`ブランチを切ってから行ってください。
- UIコンポーネントは、`src/components`以下に粒度を意識して配置してください。
  - `ui/`: 再利用性の高い最小単位のコンポーネント (Button, Inputなど)
  - `shared/`: 複数のページで利用される共通コンポーネント (Header, Footerなど)
  - `features/`: 特定の機能ドメインに強く関連するコンポーネント (Recorder, Albumなど)
- 不明点があれば、随時コミュニケーションを取りながら進めましょう。
