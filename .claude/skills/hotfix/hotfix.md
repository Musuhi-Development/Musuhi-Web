---
name: hotfix
description: >
  本番環境のバグを緊急修正するホットフィックスワークフロー（Issue作成 → mainからfixブランチ → 修正 → main PR → develop back-merge）を進行する。
  ユーザーが「本番でバグが発生した」「緊急修正が必要」「hotfixしたい」「mainのバグを直したい」「本番障害」
  などと言ったときに必ず使用すること。
---

# hotfix — 緊急バグ修正ワークフロー

本番（main）で発生したバグを素早く修正し、developへのback-mergeまで行う。
作業は `main` を起点とし、`develop` の変更には影響を与えない。

## フロー概要

1. バグの Issue を作成する（issue-new スキル相当）
2. main から fix ブランチを切る
3. 修正をサポートする
4. main へ PR を作成してリリースする
5. main → develop の back-merge PR を作成する

---

## Phase 1: バグの Issue を作成する

`issue-new` スキルの手順に従い、バグ修正のIssueを作成する。

- 種類は「🐛 バグ修正」を選ぶ
- 優先度は「🔴 高」を推奨
- Issue番号を必ず控えておく

---

## Phase 2: main から fix ブランチを切る

```bash
# mainの最新を取得
git fetch origin
git checkout main
git pull origin main

# fixブランチを作成
git checkout -b gh-{Issue番号}-fix-{バグの内容を表すslug}
```

**ブランチ名の形式:** `gh-{Issue番号}-fix-{slug}`
- 例: `gh-42-fix-login-redirect`, `gh-55-fix-payment-error`

ブランチ作成後にユーザーに伝える：
```
✅ fixブランチ `gh-{Issue番号}-fix-{slug}` を main から作成しました。

修正を進めてください。
完了したら「修正完了」と教えていただければPR作成に移ります。
```

---

## Phase 3: 修正をサポートする

ユーザーからの相談に対応しながら修正をサポートする。

修正中の注意点:
- 修正範囲はバグに関係する最小限にとどめる（余分なリファクタリングはしない）
- DBスキーマ変更が発生した場合は必ずユーザーに確認する
- コミットメッセージ例: `ログインリダイレクトのバグを修正`

ユーザーが「修正完了」「できた」「PRを作ろう」などと言ったらPhase 4へ進む。

---

## Phase 4: main へ PR を作成する

`pr-create` スキルの手順に従ってPRを作成する。

- ブランチ名が `gh-*-fix-*` なので、マージ先は自動的に `main` と判定される
- PRタイトルに `🐛 [hotfix]` プレフィックスを付けると良い
- 関連IssueフィールドにIssue番号を記載する

PR作成後にユーザーに伝える：
```
✅ hotfix PRを作成しました！
🔗 [PR URL]

PRをレビュー・マージしたら「マージしました」と教えてください。
developへのback-merge PRを作成します。
```

---

## Phase 5: main → develop の back-merge PR を作成する

ユーザーが「マージしました」「マージ完了」などと言ったら：

```bash
git fetch origin

gh pr create \
  --title "🔀 Back merge: hotfix #XX → develop" \
  --body "$(cat <<'EOF'
## 概要
hotfixのmainへのマージをdevelopへback-mergeする。

## 関連Issue
closes #XX

## 関連hotfix PR
[hotfix PRのURL]
EOF
)" \
  --base develop \
  --head main
```

---

## 完了メッセージ

```
🎉 hotfixワークフローが完了しました！

📌 Issue: #XX
🌿 ブランチ: gh-XX-fix-slug
🐛 hotfix PR: [URL]（mainにマージ済み）
🔀 Back-merge PR: [URL]

Back-merge PRをマージしてdevelopにも修正を反映してください。
```
