# Musuhi-Web

このプロジェクトは、Next.jsとDocker、MariaDBを使用して構築されたボイスメッセージングアプリケーションです。

## 概要

Musuhiは、声を手軽に録音し、アルバムとして残したり、大切な人へギフトとして贈ったり、仲間と共有したりできるサービスです。

## 技術スタック

- **フロントエンド:** Next.js (App Router), React, TypeScript
- **データベース:** MariaDB
- **インフラストラクチャ:** Docker, Docker Compose
- **その他:** Supabase (認証連携予定), etc.

## 環境構築

### 前提条件

- Docker
- Docker Compose

### セットアップ手順

1. **リポジトリをクローンします。**
   ```bash
   git clone https://github.com/Musuhi-Development/Musuhi-Web.git
   cd Musuhi-Web
   ```

2. **環境変数を設定します。**
   `.env.local` ファイルを作成し、SupabaseのURLとAnonキーを設定してください。（現在は空でも動作します）
   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   ```

3. **Dockerコンテナをビルドして起動します。**
   ```bash
   docker-compose up --build -d
   ```
   初回起動時は、依存関係のインストールとNext.jsのビルドに時間がかかる場合があります。

4. **アプリケーションにアクセスします。**
   ブラウザで `http://localhost:3000` を開きます。

### 実行方法

- **開発サーバーの起動:**
  ```bash
  docker-compose up
  ```
- **コンテナの停止:**
  ```bash
  docker-compose down
  ```
- **コンテナの再ビルド:**
  ```bash
  docker-compose up --build
  ```

## プロジェクト構成

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
│   ├── database.types.ts            # DB型定義
│   └── ai-client.ts                 # AI APIクライアント
│
└── types/                           # アプリケーション固有の型定義
```

## アーキテクチャ

- **Next.js App Router:** ファイルシステムベースのルーティングと、サーバーコンポーネント・クライアントコンポーネントを活用したレンダリング戦略を採用しています。
- **Docker:** Next.jsアプリケーションとMariaDBデータベースをコンテナ化し、開発環境の再現性を高めています。
- **BFF (Backend For Frontend):** `src/app/api` にAPIルートを配置し、フロントエンドが必要とする形式にデータを加工・提供します。外部API（Supabase, AI APIなど）との連携もここで行います。
- **MariaDB:** ユーザーデータ、録音データ、ギフト情報などを格納します。

---
**チーム開発者向け:**

- 新機能の開発は、`feature/`ブランチを切ってから行ってください。
- UIコンポーネントは、`src/components`以下に粒度を意識して配置してください。
  - `ui/`: 再利用性の高い最小単位のコンポーネント (Button, Inputなど)
  - `shared/`: 複数のページで利用される共通コンポーネント (Header, Footerなど)
  - `features/`: 特定の機能ドメインに強く関連するコンポーネント (Recorder, Albumなど)
- 不明点があれば、随時コミュニケーションを取りながら進めましょう。
