# Supabase データベースセットアップガイド

## 📋 概要

SupabaseのPostgreSQLデータベースにPrismaスキーマを適用し、テストデータを作成します。

## 🔑 ステップ1: Database接続情報を取得

### 1. Supabase Dashboardにアクセス

1. https://supabase.com/dashboard にアクセス
2. プロジェクト（wppdlbesluwicvdkyapd）を選択

### 2. Database設定ページに移動

左サイドバーから：
```
⚙️ Project Settings → 🗄️ Database
```

### 3. Connection stringをコピー

**"Connect to your project"** ダイアログで以下を選択：

1. **Type**: `URI` を選択
2. **Source**: `Primary Database` のまま
3. **Method**: `Direct connection` を選択（重要！）

> ⚠️ **重要**: Prismaを使用する場合は必ず **"Direct connection"** を選択してください。Session poolerを使用すると`prisma db push`が失敗します。

4. 表示された接続文字列をコピー

接続文字列の形式：
```
postgresql://postgres:[YOUR-PASSWORD]@db.wppdlbesluwicvdkyapd.supabase.co:5432/postgres
```

⚠️ **注意**: `[YOUR-PASSWORD]` 部分は実際のパスワードに自動で置き換わっています。そのままコピーしてください。

### 4. パスワードを忘れた場合

Database設定ページ下部の：
- "Database password" → "Reset database password"
- 新しいパスワードを設定

---

## 🔧 ステップ2: 環境変数を更新

`.env.local` を編集：

```bash
# Database - ステップ1でコピーした接続文字列をそのまま貼り付け
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.wppdlbesluwicvdkyapd.supabase.co:5432/postgres"

# Supabase (そのまま)
NEXT_PUBLIC_SUPABASE_URL="https://wppdlbesluwicvdkyapd.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."
```

**重要ポイント:**
- Supabase Dashboardからコピーした接続文字列を**そのまま**貼り付ける
- パスワードは自動で含まれています（手動で置き換え不要）
- **Direct connection** を選択したことを確認
- URLの末尾に `?pgbouncer=true` などは **付けない**

---

## 🗄️ ステップ3: Prismaスキーマを適用

### コンテナ内でスキーマ適用

```bash
# 1. コンテナ再起動（環境変数を反映）
docker-compose down
docker-compose up -d

# 2. Prismaスキーマを適用
docker-compose exec next-app npx prisma db push

# 3. Prisma Clientを再生成
docker-compose exec next-app npx prisma generate
```

### 確認

Supabase Dashboard → Table Editor で以下のテーブルが作成されていることを確認：
- User
- Recording
- Gift
- Yosegaki
- YosegakiContribution
- Board
- Comment
- Like
- Connection

---

## 📊 ステップ4: テストユーザーを作成

### Supabase Authでユーザー作成

[SUPABASE_USER_GUIDE.md](SUPABASE_USER_GUIDE.md) の手順に従って、**最低2人**のユーザーを作成してください：

**ユーザー1:**
- Email: `test@example.com`
- Password: `password123`
- Auto Confirm User: ✅ ON

**ユーザー2（必須）:**
- Email: `demo@example.com`
- Password: `password123`
- Auto Confirm User: ✅ ON

> ⚠️ **重要**: シードスクリプトは最低2人のユーザーを必要とします。

### 初回ログインで同期

作成した各ユーザーで1回ログインして、Prisma DBに同期します：

1. http://localhost:3001/login にアクセス
2. `test@example.com` でログイン → DBに自動作成
3. マイページで正常に表示されることを確認
4. ログアウト（右上のプロフィールアイコン → Logout）
5. `demo@example.com` でログイン → DBに自動作成
6. 同様に確認してログアウト

### 確認

**Supabase Dashboard:**
- Table Editor → User テーブル → 2つのユーザーレコードを確認

**Prisma Studio:**
```bash
docker-compose exec next-app npx prisma studio
```
- http://localhost:5555 → User テーブルで確認

---

## 🎲 ステップ5: テストデータを作成

### 前提条件の確認

シードスクリプトを実行する前に確認：
- ✅ Supabase Authで最低2人のユーザーを作成済み
- ✅ 各ユーザーで1回ログインし、Prisma DBに同期済み

### シードスクリプト実行

```bash
docker-compose exec next-app npm run prisma:seed
```

**実行すると**:
- 既存のユーザーを自動検出（最初の2人を使用）
- 既存のテストデータをクリーンアップ
- 新しいサンプルデータを作成

### 作成されるテストデータ

| データ種類 | 件数 | 内容 |
|-----------|------|------|
| Recordings | 4件 | 音声録音（プライベート、友達限定、公開） |
| Gifts | 2件 | ギフト（送信済み、開封済み） |
| Yosegaki | 1件 | 寄せ書き（2人分のcontribution） |
| Board Posts | 3件 | 掲示板投稿 |
| Comments | 3件 | 投稿へのコメント |
| Likes | 3件 | 投稿へのいいね |
| Connections | 1件 | ユーザー間の承認済みつながり |

### データ確認

**Supabase Dashboard:**
- Table Editor → 各テーブルでデータを確認

**Prisma Studio:**
```bash
docker-compose exec next-app npx prisma studio
```
- http://localhost:5555 → 各モデルのデータを確認

**アプリケーション:**
- http://localhost:3001/home → 録音一覧
- http://localhost:3001/board → ボード投稿
- http://localhost:3001/gift → ギフト一覧
- http://localhost:3001/mypage → つながり確認

### トラブルシューティング

**エラー: "Not enough users found in database"**

```
⚠️  Error: Not enough users found in database.
Please create at least 2 users via Supabase Auth...
```

**原因**: ユーザーが1人以下、またはログインしていない

**解決方法**:
1. Supabase Authで2人以上のユーザーを作成
2. 各ユーザーでログインしてPrisma DBに同期
3. シードスクリプトを再実行

---

## 🔍 トラブルシューティング

### エラー: "Can't reach database server"

**原因:** DATABASE_URLが間違っている

**解決策:**
1. 接続文字列を再確認
2. パスワードに特殊文字が含まれる場合はURLエンコード
3. Supabase Dashboardで **Direct connection** を選択したか確認

### エラー: "SSL connection required"

**原因:** Supabaseはデフォルトで SSL 接続が必要

**解決策:** DATABASE_URLの末尾に追加：
```
?sslmode=require
```

例：
```
postgresql://postgres.xxxxx:password@xxxxx.supabase.com:5432/postgres?sslmode=require
```

### シードデータが作成されない

**原因:** ユーザーがデータベースに存在しない

**解決策:**
1. Supabase Authでユーザー作成
2. 一度ログインしてDBに同期
3. シードスクリプト再実行

### テーブルが作成されない

```bash
# 強制的にスキーマをリセット
docker-compose exec next-app npx prisma db push --force-reset

# 再度適用
docker-compose exec next-app npx prisma db push
```

⚠️ **警告**: `--force-reset` は全データを削除します

---

## 📝 次のステップ

セットアップ完了後：

1. **アプリケーションをテスト**
   - ログイン・ログアウト
   - 録音の閲覧
   - ボード投稿の閲覧・いいね
   - ギフトの閲覧

2. **データを追加**
   - 新しいボード投稿を作成
   - ギフトを送信
   - プロフィールを編集

3. **APIをテスト**
   - Postman や curl でAPIエンドポイントをテスト
   - [API_IMPLEMENTATION.md](API_IMPLEMENTATION.md) 参照

---

## 💾 バックアップ

### Supabaseデータベースのバックアップ

Supabase Dashboard → Database → Backups
- 自動バックアップが有効
- 手動バックアップも可能

### ローカルバックアップ

```bash
# Supabaseからエクスポート
docker-compose exec next-app npx prisma db pull

# データをJSON形式でエクスポート
docker-compose exec next-app npx prisma studio
# → Export機能を使用
```

---

## 🎯 完了チェックリスト

- [ ] Supabase Database URLを取得
- [ ] `.env.local` の DATABASE_URL を更新
- [ ] `docker-compose down && docker-compose up -d` で再起動
- [ ] `npx prisma db push` でスキーマ適用
- [ ] Supabase Table Editorでテーブル確認
- [ ] Supabase Authで2ユーザー作成
- [ ] 両方のユーザーで一度ログイン（DB同期）
- [ ] `npm run prisma:seed` でテストデータ作成
- [ ] アプリケーションでデータ表示確認

すべて完了したら、本格的な開発を開始できます！
