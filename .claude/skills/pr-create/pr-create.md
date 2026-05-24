---
name: pr-create
description: >
  GitHubのPull Requestを.github/PULL_REQUEST_TEMPLATE.mdに従って作成する。
  ユーザーが「PR作成」「プルリクを出したい」「レビューに出したい」「変更をマージしたい」などと言ったときに必ず使用すること。
  ブランチ確認 → 情報収集 → プレビュー確認 → gh pr create の流れで進行する。
  PR作成後は GitHub Actions (vercel-preview.yml) が自動でVercelプレビューURLをPR本文に追記する。
---

# pr-create — GitHub PR 作成スキル

`.github/PULL_REQUEST_TEMPLATE.md` のテンプレートに従い、質の高いPRを作成する。
マージ先ブランチはブランチ名から自動判定する。
Vercelプレビュー URL は `.github/workflows/vercel-preview.yml` が自動で取得・追記するため、
PR本文に `> ⏳ デプロイ待機中...` というプレースホルダーを記載するだけでよい。

## フロー概要

1. 現在のブランチと変更内容を確認する
2. PR情報をヒヤリングする
3. PRタイトルと本文を生成してプレビュー確認を取る
4. `gh pr create` でPRを作成する → GitHub Actions が Vercel プレビュー URL を自動追記

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
- Vercel プレビュー: `> ⏳ デプロイ待機中...`（GitHub Actions が自動で更新する）

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
PR本文（Vercel プレビュー欄は「> ⏳ デプロイ待機中...」と記載）
EOF
)" \
  --base [マージ先ブランチ]
```

---

## Step 5: 完了メッセージ

```
✅ PRを作成しました！
🔗 [PR URL]

🤖 Vercel がデプロイ完了すると GitHub Actions が自動でプレビュー URL を PR に追記します。

・レビュー依頼を忘れずに！
・マージ後はブランチを削除してください。
```
