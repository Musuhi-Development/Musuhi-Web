---
name: pr-create
description: >
  GitHubのPull Requestを.github/PULL_REQUEST_TEMPLATE.mdに従って作成する。
  ユーザーが「PR作成」「プルリクを出したい」「レビューに出したい」「変更をマージしたい」などと言ったときに必ず使用すること。
  ブランチ確認 → 情報収集 → プレビュー確認 → gh pr create → Vercel プレビュー URL 取得 の流れで進行する。
---

# pr-create — GitHub PR 作成スキル

`.github/PULL_REQUEST_TEMPLATE.md` のテンプレートに従い、質の高いPRを作成する。
マージ先ブランチはブランチ名から自動判定する。
PR 作成後は Vercel プレビュー URL を取得して PR 本文に追記する。

## フロー概要

1. 現在のブランチと変更内容を確認する
2. PR情報をヒヤリングする
3. PRタイトルと本文を生成してプレビュー確認を取る
4. `gh pr create` でPRを作成する
5. Vercel プレビュー URL を取得して PR に追記する

---

## Step 1: 現在の状態を確認する

```bash
git branch --show-current
git log develop..HEAD --oneline
git diff develop --stat
```

ブランチ名・コミット履歴・変更ファイル一覧をユーザーに表示する。

---

## Step 2: PR情報を収集する

```
📋 PR作成アシスタントです。

【Q1】このPRの概要を教えてください。
何をするPRで、なぜそれが必要ですか？

【Q2】変更の種類を選んでください：
1. 🆕 新機能
2. 🐛 バグ修正
3. ⚡ 改善・リファクタリング
4. 📚 ドキュメント
5. 🔧 設定変更
6. 💥 破壊的変更

【Q3】関連するIssue番号を教えてください。（なければ「なし」）

【Q4】DBスキーマの変更はありますか？（あり: 内容 / なし）

【Q5】レビュアーに特に見てほしい点を教えてください。（なければ「なし」）
```

---

## Step 3: PRのタイトルと本文を生成する

git log の内容と収集した情報をもとにPRを組み立てる。

**タイトル形式:** `[絵文字] 変更内容の要約`
- 新機能→🆕 バグ修正→🐛 改善→⚡ ドキュメント→📚 設定→🔧 破壊的変更→💥

**本文（`.github/PULL_REQUEST_TEMPLATE.md` のセクションに従う）:**
- 概要: 収集した内容をそのまま記載
- 変更内容: git log から自動生成した箇条書き
- 変更の種類: 選択された種類にチェック
- 関連Issue: `closes #番号`（なければ省略）
- テスト確認: ローカル動作確認済みにチェック
- DBスキーマ変更: 回答を反映
- レビュー観点: 収集した内容を記載
- Vercel プレビュー: `> ⏳ デプロイ待機中...`（後で更新）

プレビュー表示後に確認を取る：
```
このPRを作成してよいですか？（「OK」または修正内容）
```

---

## Step 4: マージ先を判定してPRを作成する

**マージ先の判定ルール:**
- ブランチ名が `gh-*-fix-*` にマッチする → `main`
- それ以外 → `develop`

**リモートへのプッシュ（未プッシュの場合）:**
```bash
git push -u origin HEAD
```

**PR作成:**
```bash
gh pr create \
  --title "PRタイトル" \
  --body "$(cat <<'EOF'
PR本文（Vercel プレビュー欄は「⏳ デプロイ待機中...」と記載）
EOF
)" \
  --base [マージ先ブランチ]
```

PR URL を変数に保存する：
```bash
PR_URL=$(gh pr create ...)
PR_NUMBER=$(echo "$PR_URL" | grep -oE '[0-9]+$')
```

---

## Step 5: Vercel プレビュー URL を取得して PR に追記する

### リポジトリ情報を取得する

```bash
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
BRANCH=$(git branch --show-current)
```

### プレビュー URL を取得する（最大 3 分待機）

```bash
PREVIEW_URL=$(python3 .claude/skills/pr-create/scripts/get_vercel_preview.py "$REPO" "$BRANCH" --timeout 180)
```

### 取得に成功した場合は PR 本文を更新する

現在の PR 本文を取得し、`⏳ デプロイ待機中...` を実際の URL に置換する：

```bash
CURRENT_BODY=$(gh pr view "$PR_NUMBER" --json body -q .body)
NEW_BODY=$(echo "$CURRENT_BODY" | sed "s|⏳ デプロイ待機中\.\.\.|🔗 $PREVIEW_URL|g")
gh pr edit "$PR_NUMBER" --body "$NEW_BODY"
```

### 取得に失敗した場合（タイムアウト・Vercel 未連携など）

ユーザーにその旨を伝えて PR URL のみ案内する。

---

## Step 6: 完了メッセージ

**Vercel プレビュー取得成功時:**
```
✅ PRを作成しました！
🔗 PR:      [PR URL]
🌐 Preview: [Vercel プレビュー URL]

・レビュー依頼を忘れずに！
・マージ後はブランチを削除してください。
```

**Vercel プレビュー取得失敗時:**
```
✅ PRを作成しました！
🔗 PR: [PR URL]

⚠️  Vercel プレビュー URL を自動取得できませんでした。
   Vercel ダッシュボードの Deployments タブから手動で確認してください。
   → https://vercel.com/dashboard

・レビュー依頼を忘れずに！
・マージ後はブランチを削除してください。
```
