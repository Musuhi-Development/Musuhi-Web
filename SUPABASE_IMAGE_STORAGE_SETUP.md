# Supabase画像ストレージ設定ガイド

## 📦 画像用のStorageバケット作成

ジャーナル添付画像とユーザーアバター画像をSupabaseに保存するため、2つのStorageバケットを作成します。

## 手順

### 1. Supabase Dashboardにアクセス

1. https://supabase.com/dashboard にアクセス
2. プロジェクト（wppdlbesluwicvdkyapd）を選択
3. 左サイドバーから **Storage** をクリック

---

## バケット1: recording-images（ジャーナル添付画像用）

### 2-1. バケットを作成

1. **「Create a new bucket」** ボタンをクリック
2. 以下の情報を入力：

**Bucket name:**
```
recording-images
```

**Public bucket:**
- ✅ ON（チェックを入れる）

3. **「Create bucket」** をクリック

### 2-2. RLSポリシーを作成（必須）

Storage → recording-images → **Policies** タブを開き、SQL Editor で以下を実行：

```sql
-- 認証済みユーザーは自分のフォルダにアップロード可能
CREATE POLICY "Users can upload images to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'recording-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 認証済みユーザーは自分の画像を更新可能
CREATE POLICY "Users can update own images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'recording-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 認証済みユーザーは自分の画像を削除可能
CREATE POLICY "Users can delete own images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'recording-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 誰でも公開画像を読み取り可能
CREATE POLICY "Anyone can read images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'recording-images');
```

---

## バケット2: avatars（ユーザーアバター用）

### 3-1. バケットを作成

1. **「Create a new bucket」** ボタンをクリック
2. 以下の情報を入力：

**Bucket name:**
```
avatars
```

**Public bucket:**
- ✅ ON（チェックを入れる）

3. **「Create bucket」** をクリック

### 3-2. RLSポリシーを作成（必須）

Storage → avatars → **Policies** タブを開き、SQL Editor で以下を実行：

```sql
-- 認証済みユーザーは自分のアバターをアップロード可能
CREATE POLICY "Users can upload own avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 認証済みユーザーは自分のアバターを更新可能
CREATE POLICY "Users can update own avatar"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 認証済みユーザーは自分のアバターを削除可能
CREATE POLICY "Users can delete own avatar"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 誰でもアバター画像を読み取り可能
CREATE POLICY "Anyone can read avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');
```

---

## 4. 動作確認

### ジャーナル添付画像のテスト

1. http://localhost:3001/record にアクセス
2. 録音を行う
3. 「写真を追加」から画像をアップロード（最大5枚）
4. タイトルを入力して保存
5. Supabase Storage → recording-images でファイルが作成されていることを確認

### アバター画像のテスト

1. http://localhost:3001/signup にアクセス
2. 新規登録フォームで「プロフィール画像」を選択
3. 画像をアップロード
4. アカウント作成
5. Supabase Storage → avatars でファイルが作成されていることを確認

---

## 5. トラブルシューティング

### エラー: "new row violates row-level security policy" (403エラー)

**原因**: RLSポリシーが設定されていない

**解決策**:
1. 上記「2-2」「3-2」のSQL文を実行
2. SQL Editorで以下を実行してポリシーを確認:
```sql
SELECT policyname, cmd
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND (policyname LIKE '%recording-images%' OR policyname LIKE '%avatars%');
```

### エラー: "Invalid file type"

**原因**: サポートされていない画像形式

**解決策**:
- recording-images: JPEG, PNG, WebP, GIF のみ対応
- avatars: JPEG, PNG, WebP のみ対応

### エラー: "File size exceeds limit"

**原因**: ファイルサイズ制限超過

**解決策**:
- recording-images: 最大5MB
- avatars: 最大2MB
- 画像を圧縮してから再度アップロード

---

## 📊 ストレージ使用状況の確認

**Dashboard → Storage**

- recording-images: ジャーナル添付画像の使用量
- avatars: アバター画像の使用量
- Total: 合計使用量（無料プラン: 1GB）

---

## 🎯 完了チェックリスト

### recording-images バケット
- [ ] バケット作成（Public ON）
- [ ] INSERT policy 作成
- [ ] UPDATE policy 作成
- [ ] DELETE policy 作成
- [ ] SELECT policy 作成
- [ ] /record ページでテスト

### avatars バケット
- [ ] バケット作成（Public ON）
- [ ] INSERT policy 作成
- [ ] UPDATE policy 作成
- [ ] DELETE policy 作成
- [ ] SELECT policy 作成
- [ ] /signup ページでテスト

---

## 💡 クイックセットアップ（まとめ）

```bash
# 1. Supabase Dashboard → Storage
#    - recording-images バケット作成（Public ON）
#    - avatars バケット作成（Public ON）

# 2. SQL Editor で一括実行:
```

```sql
-- recording-images ポリシー
CREATE POLICY "Users can upload images to own folder" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'recording-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can update own images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'recording-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete own images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'recording-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Anyone can read images" ON storage.objects FOR SELECT TO public USING (bucket_id = 'recording-images');

-- avatars ポリシー
CREATE POLICY "Users can upload own avatar" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can update own avatar" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete own avatar" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Anyone can read avatars" ON storage.objects FOR SELECT TO public USING (bucket_id = 'avatars');
```

完了です！これでジャーナル画像添付とアバター設定機能が動作します。
