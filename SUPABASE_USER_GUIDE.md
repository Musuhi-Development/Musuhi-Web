# Supabase テストユーザー作成ガイド

## 📝 概要

Musuhi アプリケーションでログインするには、Supabase Dashboard でユーザーを作成する必要があります。

## 🔧 ユーザー作成手順

### 1. Supabase Dashboard にアクセス

1. https://supabase.com/dashboard にアクセス
2. プロジェクト一覧から `musuhi` プロジェクトを選択

### 2. Authentication ページに移動

左サイドバーから：
```
🔐 Authentication → 👥 Users
```

### 3. ユーザー作成

1. 右上の **"Add user"** ボタンをクリック
2. **"Create new user"** を選択

### 4. ユーザー情報入力

以下の情報を入力：

| フィールド | 値 |
|-----------|-----|
| Email | `test@example.com` |
| Password | `password123` |
| Auto Confirm User | ✅ **必ずONにする** |

⚠️ **重要**: "Auto Confirm User" をONにしないと、メール確認が必要になります。

### 5. 追加のテストユーザー

同じ手順で追加ユーザーを作成：

**ユーザー2:**
- Email: `demo@example.com`
- Password: `password123`
- Auto Confirm User: ✅ ON

## ✅ ログインテスト

### 1. アプリケーションにアクセス

```
http://localhost:3001/login
```

### 2. 作成したアカウントでログイン

- Email: `test@example.com`
- Password: `password123`

### 3. 初回ログイン時の動作

- Supabase Auth で認証
- データベースにユーザープロフィールを自動作成
- ホーム画面にリダイレクト

## 🔍 トラブルシューティング

### ログインできない場合

#### 1. Supabase Dashboard でユーザーが作成されているか確認

Authentication → Users で該当ユーザーが表示されるか確認

#### 2. "Auto Confirm User" がONになっているか確認

ユーザー一覧で該当ユーザーをクリックし、"Email Confirmed" が `true` になっているか確認

#### 3. メール確認が必要な場合

もし "Auto Confirm User" をOFFにしてしまった場合：

1. Supabase Dashboard → Authentication → Users
2. 該当ユーザーを選択
3. "..." メニュー → "Confirm email" をクリック

### エラー: "Invalid login credentials"

- メールアドレスとパスワードを再確認
- パスワードは最低6文字必要

### エラー: "Authentication service is not configured"

- `.env.local` の環境変数が正しく設定されているか確認
- `docker-compose restart` でコンテナを再起動

### データベースに同期されない

初回ログイン時に自動的にデータベースに同期されます。
Prisma Studio (http://localhost:5555) で `User` テーブルを確認してください。

## 📊 ユーザー管理

### Prisma Studio でユーザー確認

```
http://localhost:5555
```

左サイドバーから `User` モデルを選択してユーザー一覧を表示

### ユーザー削除

**Supabase Dashboard:**
1. Authentication → Users
2. 該当ユーザーを選択
3. "..." メニュー → "Delete user"

**注意**: Supabaseでユーザーを削除すると、データベースのユーザー情報もカスケード削除されます。

## 🎯 推奨テストシナリオ

### シナリオ1: 基本ログイン
1. `test@example.com` でログイン
2. ホーム画面が表示されることを確認
3. マイページで自分のプロフィールが表示されることを確認

### シナリオ2: 複数ユーザー
1. `test@example.com` でログイン → ログアウト
2. `demo@example.com` でログイン
3. 異なるユーザーとして動作することを確認

### シナリオ3: パスワード変更
1. Supabase Dashboard → Authentication → Users
2. ユーザーを選択 → "..." → "Reset password"
3. 新しいパスワードでログインテスト

## 📱 次のステップ

ログインが成功したら：

1. **録音機能を試す** → `/home` → 録音ボタン
2. **ボード投稿を見る** → `/board`
3. **ギフトを作成** → `/gift` → 新規作成
4. **プロフィール編集** → `/mypage` → 編集

## 💡 ヒント

- 本番環境では必ず強力なパスワードを使用
- テスト用の `password123` は開発環境のみで使用
- Email確認を有効にする場合は、Supabase Email Templatesを設定
