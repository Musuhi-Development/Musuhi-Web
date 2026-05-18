---
name: release
description: >
  developブランチをmainにマージするリリースPRを作成し、マージ後のback-merge PRまでサポートする。
  ユーザーが「リリースしたい」「本番に反映したい」「release PRを作りたい」「mainにマージしたい」
  などと言ったときに必ず使用すること。
---

# release — リリースワークフロー

`develop` → `main` のリリースPRを作成し、マージ後の `main` → `develop` back-merge PRまで進行する。

## フロー概要

1. develop の状態を確認する
2. リリース内容のサマリを生成する
3. develop → main の PR を作成する
4. マージ後に main → develop の back-merge PR を作成する

---

## Phase 1: develop の状態を確認する

```bash
# 最新状態を取得
git fetch origin

# developとmainの差分を確認
git log origin/main..origin/develop --oneline

# 未マージのPRがないか確認
gh pr list --base develop --state open
```

未マージのPRがある場合はユーザーに警告する：
```
⚠️ developに未マージのPRがあります：
[PR一覧]

リリース前にマージするか、対象外とするか確認してください。
```

**ビルド確認（推奨）:**
リリース前に本番ビルドが通ることをコンテナ内で確認する：
```bash
docker compose exec next-app npm run build
```
ビルドエラーがあればリリースを中断してユーザーに報告する。

問題なければPhase 2へ進む。

---

## Phase 2: リリース内容のサマリを生成する

```bash
# mainからdevelopへの差分コミット一覧を取得
git log origin/main..origin/develop --oneline --no-merges
```

コミット一覧からリリース内容をカテゴリ別に整理する：
- 🆕 新機能
- 🐛 バグ修正
- ⚡ 改善
- 🔧 その他

---

## Phase 3: develop → main の PR を作成する

**PRタイトル形式:** `🚀 Release YYYY-MM-DD`（今日の日付）

**PR本文:**
```markdown
## リリース内容

### 🆕 新機能
- [コミット一覧から生成]

### 🐛 バグ修正
- [コミット一覧から生成]

### ⚡ 改善・その他
- [コミット一覧から生成]

## チェックリスト
- [ ] ローカルで動作確認済み
- [ ] テスト・ビルドが通ることを確認
- [ ] DBマイグレーションが必要な場合は手順を確認
```

```bash
gh pr create \
  --title "🚀 Release $(date +%Y-%m-%d)" \
  --body "$(cat <<'EOF'
PR本文
EOF
)" \
  --base main \
  --head develop
```

PR作成後、ユーザーに伝える：
```
✅ リリースPRを作成しました！
🔗 [PR URL]

PRをレビュー・マージしたら「マージしました」と教えてください。
back-merge PRを作成します。
```

---

## Phase 4: main → develop の back-merge PR を作成する

ユーザーが「マージしました」「マージ完了」などと言ったら：

```bash
# mainの最新を取得
git fetch origin

# back-merge PRを作成
gh pr create \
  --title "🔀 Back merge: main → develop ($(date +%Y-%m-%d))" \
  --body "$(cat <<'EOF'
## 概要
リリース後のmainをdevelopへback-mergeする。

## 関連リリースPR
[リリースPRのURL]
EOF
)" \
  --base develop \
  --head main
```

---

## 完了メッセージ

```
🎉 リリースワークフローが完了しました！

🚀 リリースPR: [URL]
🔀 Back-merge PR: [URL]

Back-merge PRをマージしてdevelopを最新に保ってください。
```
