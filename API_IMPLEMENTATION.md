# API Implementation Guide

このドキュメントは、Musuhi WebアプリのバックエンドAPI実装の完了状態と、フロントエンドからAPIを呼び出す方法を説明します。

## 完了したバックエンド実装

### 1. Prismaスキーマ ✅
- User（ユーザープロフィール）
- Recording（音声録音）
- Gift（ボイスギフト）
- Yosegaki（寄せ音声）
- YosegakiContribution（寄せ音声への貢献）
- Board（コミュニティボード）
- Comment（コメント）
- Like（いいね）
- Connection（つながり）

### 2. Supabaseクライアント ✅
- `src/lib/supabase/index.ts` - クライアントサイドとサーバーサイドのSupabaseクライアント
- 認証とストレージ機能をサポート

### 3. 認証API ✅
- `POST /api/auth/login` - ログイン
- `POST /api/auth/signup` - サインアップ
- `POST /api/auth/logout` - ログアウト
- `GET /api/auth/callback` - Supabase認証コールバック

### 4. 音声録音API ✅
- `GET /api/recordings` - 録音一覧取得（フィルター対応）
- `POST /api/recordings` - 新規録音作成
- `GET /api/recordings/[id]` - 録音詳細取得
- `PUT /api/recordings/[id]` - 録音更新
- `DELETE /api/recordings/[id]` - 録音削除
- `POST /api/upload` - 音声ファイルアップロード

### 5. ギフトAPI ✅
- `GET /api/gifts` - ギフト一覧取得
- `POST /api/gifts` - ギフト作成
- `GET /api/gifts/[id]` - ギフト詳細取得
- `DELETE /api/gifts/[id]` - ギフト削除

### 6. 寄せ音声API ✅
- `GET /api/yosegaki` - 寄せ音声一覧取得
- `POST /api/yosegaki` - 寄せ音声作成
- `GET /api/yosegaki/[id]` - 寄せ音声詳細取得
- `PUT /api/yosegaki/[id]` - 寄せ音声更新
- `DELETE /api/yosegaki/[id]` - 寄せ音声削除
- `POST /api/yosegaki/[id]/contributions` - 寄せ音声への貢献追加
- `DELETE /api/yosegaki/[id]/contributions` - 寄せ音声の貢献削除

### 7. ボードAPI ✅
- `GET /api/board` - ボード投稿一覧取得
- `POST /api/board` - ボード投稿作成
- `GET /api/board/[id]` - ボード詳細取得
- `PUT /api/board/[id]` - ボード更新
- `DELETE /api/board/[id]` - ボード削除
- `GET /api/board/[id]/comment` - コメント一覧取得
- `POST /api/board/[id]/comment` - コメント追加
- `DELETE /api/board/[id]/comment` - コメント削除
- `POST /api/board/[id]/like` - いいね
- `DELETE /api/board/[id]/like` - いいね取り消し

### 8. ユーザー・つながりAPI ✅
- `GET /api/users/me` - 現在のユーザープロフィール取得
- `PATCH /api/users/me` - プロフィール更新
- `GET /api/connections` - つながり一覧取得
- `POST /api/connections` - つながりリクエスト
- `PATCH /api/connections/[id]` - つながりステータス更新
- `DELETE /api/connections/[id]` - つながり削除

### 9. AI分析API ✅
- `POST /api/analysis` - 音声感情分析（現在はモック実装）

## セットアップ手順

### 1. 依存関係のインストール

Dockerコンテナ内で自動的にインストールされますが、ローカルで開発する場合：

```bash
npm install
```

### 2. 環境変数の設定

`.env.example` を `.env.local` にコピーして、Supabaseの認証情報を設定：

```bash
cp .env.example .env.local
```

**必要な環境変数：**
- `DATABASE_URL` - PostgreSQL接続文字列（Docker Composeで自動設定）
- `NEXT_PUBLIC_SUPABASE_URL` - SupabaseプロジェクトURL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase匿名キー
- `SUPABASE_SERVICE_ROLE_KEY` - Supabaseサービスロールキー

### 3. Prismaマイグレーション

```bash
npx prisma generate
npx prisma db push
```

Docker Composeを使用する場合は自動実行されます。

### 4. Supabase Storageのセットアップ

Supabaseダッシュボードで以下を実行：

1. **ストレージバケットを作成**
   - バケット名: `audio-recordings`
   - パブリックアクセス: 有効

2. **バケットポリシーを設定**
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

### 5. アプリケーション起動

```bash
# Dockerを使用
docker compose up --build

# ローカル開発
npm run dev
```

## フロントエンドからAPIを呼び出す方法

### 例1: 録音一覧を取得

```typescript
"use client";

import { useEffect, useState } from "react";

export default function HomePage() {
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecordings() {
      try {
        const response = await fetch("/api/recordings");
        const data = await response.json();
        setRecordings(data.recordings);
      } catch (error) {
        console.error("Failed to fetch recordings:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchRecordings();
  }, []);

  if (loading) return <div>読み込み中...</div>;

  return (
    <div>
      {recordings.map((recording: any) => (
        <div key={recording.id}>
          <h3>{recording.title}</h3>
          <p>{recording.description}</p>
          <audio src={recording.audioUrl} controls />
        </div>
      ))}
    </div>
  );
}
```

### 例2: 新規録音を作成

```typescript
"use client";

import { useState } from "react";

export default function RecordPage() {
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleSave() {
    if (!audioBlob) return;

    setUploading(true);

    try {
      // 1. 音声ファイルをアップロード
      const formData = new FormData();
      formData.append("file", audioBlob, "recording.webm");

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const { url } = await uploadResponse.json();

      // 2. 録音レコードを作成
      const response = await fetch("/api/recordings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "新しい録音",
          audioUrl: url,
          duration: 120, // 秒
          emotions: ["嬉しい"],
          visibility: "private",
        }),
      });

      const data = await response.json();
      console.log("Recording created:", data.recording);

      // ホーム画面にリダイレクト
      window.location.href = "/home";
    } catch (error) {
      console.error("Failed to save recording:", error);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      {/* 録音UI */}
      <button onClick={handleSave} disabled={uploading}>
        {uploading ? "保存中..." : "保存"}
      </button>
    </div>
  );
}
```

### 例3: ログイン処理

```typescript
"use client";

import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "ログインに失敗しました");
        return;
      }

      // ログイン成功、ホームにリダイレクト
      window.location.href = "/home";
    } catch (error) {
      setError("ログインに失敗しました");
    }
  }

  return (
    <form onSubmit={handleLogin}>
      {error && <div className="error">{error}</div>}
      
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="メールアドレス"
        required
      />
      
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="パスワード"
        required
      />
      
      <button type="submit">ログイン</button>
    </form>
  );
}
```

### 例4: ボード投稿の作成といいね

```typescript
"use client";

import { useState } from "react";

export default function BoardPage() {
  async function createPost() {
    const response = await fetch("/api/board", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "投稿タイトル",
        content: "投稿内容",
        isPublic: true,
      }),
    });

    const data = await response.json();
    console.log("Created:", data.board);
  }

  async function likePost(boardId: string) {
    const response = await fetch(`/api/board/${boardId}/like`, {
      method: "POST",
    });

    const data = await response.json();
    console.log("Liked:", data.like);
  }

  async function unlikePost(boardId: string) {
    const response = await fetch(`/api/board/${boardId}/like`, {
      method: "DELETE",
    });

    const data = await response.json();
    console.log("Unliked:", data.success);
  }

  return <div>{/* UI */}</div>;
}
```

## 次のステップ

1. **フロントエンドページの更新**
   - 各ページ（/home, /record, /gift, /board, /mypage）のダミーデータをAPI呼び出しに置き換え
   - ローディング状態とエラーハンドリングを実装
   - 認証ガードを追加

2. **認証フローの完成**
   - ログイン/サインアップページの実装
   - 認証済みユーザーのみアクセス可能なルートガードを追加
   - セッション管理の実装

3. **Supabase Authの設定**
   - Supabaseダッシュボードで認証プロバイダーを設定
   - メール認証テンプレートをカスタマイズ
   - リダイレクトURLを設定

4. **本番環境AI分析**
   - `/api/analysis` を実際のAI APIに接続
   - 感情分析の精度向上

5. **テストとデバッグ**
   - 各API エンドポイントのテスト
   - エラーケースの処理
   - パフォーマンス最適化

## トラブルシューティング

### npm installがエラーになる場合

WSL環境で権限エラーが発生する場合は、Dockerコンテナ内で実行：

```bash
docker compose up --build
```

コンテナ内で自動的に `npm install` が実行されます。

### データベース接続エラー

Docker Composeを使用している場合、データベースの起動を待機してから接続します。`docker-compose.yml` のヘルスチェックが正しく設定されているか確認してください。

### Supabase認証エラー

1. `.env.local` の環境変数が正しく設定されているか確認
2. Supabaseダッシュボードでプロジェクトが有効化されているか確認
3. リダイレクトURLが正しく設定されているか確認（`http://localhost:3001/api/auth/callback`）

## まとめ

バックエンドAPIの実装が完了しました。次のステップは、フロントエンドの各ページをこれらのAPIに接続することです。上記の例を参考に、既存のダミーデータを実際のAPI呼び出しに置き換えてください。
