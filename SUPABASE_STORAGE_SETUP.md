# Supabase Storage 設定ガイド

## 📦 音声録音用のStorageバケット作成

音声ファイルをSupabaseに保存するため、Storageバケットを作成します。

## 手順

### 1. Supabase Dashboardにアクセス

1. https://supabase.com/dashboard にアクセス
2. プロジェクト（wppdlbesluwicvdkyapd）を選択
3. 左サイドバーから **Storage** をクリック

### 2. 新しいバケットを作成

1. **「Create a new bucket」** ボタンをクリック
2. 以下の情報を入力：

**Bucket name:**
```
voice-recordings
```

**Public bucket:**
- ✅ ON（チェックを入れる）
  
> ⚠️ **重要**: Public bucketを有効にすることで、アップロードした音声ファイルに公開URLでアクセスできるようになります。

3. **「Create bucket」** をクリック

### 3. バケット設定の確認

作成したバケット（`voice-recordings`）が一覧に表示されます。

**設定内容:**
- Name: `voice-recordings`
- Public: ✅ Yes
- Files: 0 (初期状態)

### 4. アクセス制御の設定（✅ 必須）

⚠️ **重要**: RLS（Row Level Security）ポリシーを設定しないと、アップロード時に403エラーが発生します。

以下の手順でポリシーを作成してください：

#### 方法1: SQL Editorで実行（推奨）

1. Supabase Dashboard の左サイドバーから **SQL Editor** をクリック
2. **「New query」** をクリック
3. 以下のSQLをコピー＆ペーストして実行：

```sql
-- 認証済みユーザーは自分のフォルダにアップロード可能
CREATE POLICY "Users can upload to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'voice-recordings' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 認証済みユーザーは自分のファイルを更新可能
CREATE POLICY "Users can update own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'voice-recordings' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 認証済みユーザーは自分のファイルを削除可能
CREATE POLICY "Users can delete own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'voice-recordings' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 誰でも公開ファイルを読み取り可能
CREATE POLICY "Anyone can read public files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'voice-recordings');
```

4. **「Run」** ボタンをクリックして実行
5. "Success. No rows returned" と表示されればOK

#### 方法2: Dashboardから手動作成

1. Storage → voice-recordings → **Policies** タブ
2. **「New Policy」** → **「Create a policy from scratch」**
3. 上記の4つのポリシーを1つずつ作成

#### ポリシーの確認

Storage → voice-recordings → Policies タブで以下の4つが表示されていればOK:
- ✅ Users can upload to own folder (INSERT)
- ✅ Users can update own files (UPDATE)
- ✅ Users can delete own files (DELETE)
- ✅ Anyone can read public files (SELECT)

### 5. 動作確認

アプリケーションで録音機能をテストします：

1. http://localhost:3001/record にアクセス
2. 録音ボタンをクリック
3. 音声を録音
4. タイトルを入力して保存
5. 成功したら `/home` にリダイレクト

**Supabase Storageで確認:**
- Dashboard → Storage → voice-recordings
- ユーザーID のフォルダ内にファイルが作成されていることを確認

### 6. トラブルシューティング

#### エラー: "new row violates row-level security policy" (403エラー)

**原因**: RLSポリシーが設定されていない

**解決策**:
1. 上記「4. アクセス制御の設定」のSQL文を実行
2. SQL Editorで以下を実行してポリシーを確認:
```sql
SELECT * FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects';
```
3. 4つのポリシーが存在することを確認

#### エラー: "Failed to upload file"

**原因**: バケットが存在しない、または認証エラー

**解決策**:
1. バケット名が `voice-recordings` であることを確認
2. Public bucketが有効になっているか確認
3. ブラウザのコンソールでエラーログを確認

#### エラー: "Storage quota exceeded"

**原因**: Supabase無料プランの容量制限（1GB）

**解決策**:
- 古いファイルを削除
- プランのアップグレードを検討

## 📊 ストレージ使用状況の確認

**Dashboard → Storage → voice-recordings**

- Total size: 使用容量
- Files: ファイル数
- Last updated: 最終更新日時

## 🎯 完了チェックリスト

- [ ] voice-recordingsバケット作成
- [ ] Public bucket設定ON
- [ ] **RLSポリシー4つを作成（必須）**
  - [ ] INSERT policy (Users can upload to own folder)
  - [ ] UPDATE policy (Users can update own files)
  - [ ] DELETE policy (Users can delete own files)
  - [ ] SELECT policy (Anyone can read public files)
- [ ] ポリシーが正しく作成されたか確認
- [ ] アプリで録音テスト（/record ページ）
- [ ] Supabase Storageでファイル確認

完了したら、音声録音機能が正常に動作します！

## 💡 クイックセットアップ（まとめ）

```bash
# 1. Supabase Dashboard → Storage → Create bucket
#    - Name: voice-recordings
#    - Public: ON

# 2. SQL Editor で以下を実行:
```

```sql
-- RLS ポリシーを一括作成
CREATE POLICY "Users can upload to own folder" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'voice-recordings' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can update own files" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'voice-recordings' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete own files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'voice-recordings' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Anyone can read public files" ON storage.objects FOR SELECT TO public USING (bucket_id = 'voice-recordings');
```

これでアップロードが可能になります！
