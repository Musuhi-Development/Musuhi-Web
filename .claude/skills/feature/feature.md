---
name: feature
description: >
  新機能・改善の実装ワークフロー全体（Issue作成 → developからブランチ切り出し → 実装サポート → PR作成）を進行する。
  ユーザーが「新機能を作りたい」「featureを始めたい」「〇〇を実装したい」「新しい機能の開発を開始したい」
  などと言ったときに必ず使用すること。
---

# feature — 新機能実装ワークフロー

Issue作成からPRまでの一連の流れを順番に進行する。
各ステップで完了を確認してから次に進むこと。

## フロー概要

1. Issue を作成する（issue-new スキル相当）
2. develop から機能ブランチを切る
3. 実装をサポートする
4. develop へ PR を作成する（pr-create スキル相当）

---

## Phase 1: Issue を作成する

`issue-new` スキルの手順に従い、GitHubにIssueを作成する。

- Issue番号を必ず控えておく（ブランチ名に使用する）
- 機能追加または改善として作成する

---

## Phase 2: ブランチを作成する

Issueが作成できたら、以下の手順でブランチを切る。

**ブランチ名の形式:** `gh-{Issue番号}-{内容を表す短いslug}`
- slug はハイフン区切りの英小文字（例: `add-voice-gift-search`、`update-profile-ui`）

```bash
# developブランチが最新か確認
git fetch origin
git checkout develop
git pull origin develop

# ブランチを作成して移動
git checkout -b gh-{Issue番号}-{slug}
```

ブランチ作成後、ユーザーに確認する：
```
✅ ブランチ `gh-{Issue番号}-{slug}` を作成しました。

実装を進めてください。
完了したら「実装完了」と教えていただければPR作成に移ります。
```

---

## Phase 3: 実装をサポートする

ユーザーからの質問や相談に対応しながら実装をサポートする。

**開発環境の起動（まだ起動していない場合）:**
```bash
docker compose up -d
# アプリ: http://localhost:3001
# Prisma Studio: http://localhost:5555
```

**実装中の注意点（ユーザーに伝える）:**
- `CLAUDE.md` のコーディング規約に従う
- コミットは日本語で簡潔に（動詞から始める）
- npm / prisma コマンドはコンテナ内で実行する:
  ```bash
  docker compose exec next-app npx prisma generate   # スキーマ変更後
  docker compose exec next-app npx prisma db push    # DB反映
  docker compose exec next-app npm run lint          # Lint確認
  ```
- ログは `docker compose logs -f next-app` で確認
- こまめにコミットしておく

ユーザーが「実装完了」「できた」「PR作ろう」などと言ったらPhase 4へ進む。

---

## Phase 4: PR を作成する

`pr-create` スキルの手順に従い、develop へのPRを作成する。

- マージ先は `develop`（自動判定される）
- PRタイトルには Issue番号のプレフィックスを付けると良い
- 関連IssueのフィールドにIssue番号を記載する

---

## 完了メッセージ

```
🎉 機能開発ワークフローが完了しました！

📌 Issue: #XX
🌿 ブランチ: gh-XX-slug
🔗 PR: [PR URL]

レビュー後にdevelopへマージしてください。
本番リリース時は /release を実行してください。
```
