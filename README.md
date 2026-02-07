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

## 実行手順

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
    - Webブラウザで `http://localhost:3000` を開きます。

### Macの場合

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
    - Webブラウザで `http://localhost:3000` を開きます。

### アプリケーションの停止方法

VSCodeで開いているターミナルで `Ctrl + C` を押すと、アプリケーションが停止します。

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
