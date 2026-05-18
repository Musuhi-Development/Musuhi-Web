# Musuhi-Web — Claude Code 指示書

このファイルは Claude Code がこのリポジトリで作業する際に自動的に読み込まれます。
プロジェクト固有の前提・規約・ワークフローを記載しています。

---

## 🏗 プロジェクト概要

**Musuhi-Web** は Musuhi プロジェクトの Next.js フロントエンドです。

| 項目 | 内容 |
| --- | --- |
| フレームワーク | Next.js 16 (App Router) / React 19 |
| 言語 | TypeScript |
| スタイリング | Tailwind CSS v4 |
| DB ORM | Prisma 5 |
| 認証・ストレージ | Supabase |
| デプロイ | Docker (Dockerfile / docker-compose.yml) |
| バックエンド (別リポジトリ) | `musuhi-ai-api/` (FastAPI / Dify 連携) |

主なディレクトリ：

```
src/
  app/          # Next.js App Router のページ・APIルート
  components/   # 共有 UI コンポーネント
  lib/          # ユーティリティ・Supabase クライアントなど
prisma/         # スキーマ・seed
scripts/        # 運用スクリプト
public/         # 静的ファイル
```

---

## 🌿 ブランチ戦略

| ブランチ | 役割 |
| --- | --- |
| `main` | 本番リリース用。直接コミット禁止。リリースPRのみマージ。 |
| `develop` | 開発の統合ブランチ。**新規作業のベース**。 |
| `gh-{issue番号}-{slug}` | 機能開発・改善ブランチ（develop から派生） |
| `gh-{issue番号}-fix-{slug}` | ホットフィックス（main から派生） |
| `release/{YYYYMMDD}` 等 | リリース統合用（develop → main） |

**命名規則の例:**
- `gh-12-add-voice-gift-search`
- `gh-15-fix-login-redirect`

---

## 🔄 開発ワークフロー (Issue ドリブン)

すべての作業は **Issue → ブランチ → 実装 → PR** の流れで進めます。

1. **新機能・改善** → `/feature` Skill を実行
   - Issue 作成 → develop からブランチ作成 → 実装 → PR 作成（→ develop）
2. **本番リリース** → `/release` Skill を実行
   - develop → main の PR 作成 → マージ後に main → develop の back-merge PR
3. **緊急バグ修正** → `/hotfix` Skill を実行
   - main からブランチ作成 → 修正 → main にリリース → develop へ back-merge
4. **Issue 単体作成** → `/issue-new` Skill
5. **PR 単体作成** → `/pr-create` Skill

詳細は `.claude/skills/` 配下の各 SKILL.md を参照してください。

---

## 📐 コーディング規約

### TypeScript / React
- 既存の `src/components/` のスタイル（型定義の方法、Tailwind の書き方）を踏襲する
- 関数コンポーネントを使用、`'use client'` ディレクティブは必要な場合のみ付与
- Server Component と Client Component の境界を明確にする
- Props 型は `type` で定義（`interface` 不可ではないが既存に合わせる）

### スタイリング
- Tailwind CSS v4 のクラスを使用
- `clsx` / `tailwind-merge` で条件付きクラスを組み立てる
- 既存の Tailwind 設定（`tailwind.config.ts`）に合わせる

### Prisma / DB
- スキーマ変更時は `npm run prisma:generate` を実行
- マイグレーション前後で `prisma db push` の影響を確認

### コミットメッセージ
- 日本語で簡潔に。動詞から始める。
- 例: `VoiceGiftのAllフィルタを削除しデフォルトを受信済みに変更`
- Co-Authored-By トレーラーは Claude Code のデフォルトに従う

---

## ⚙️ 開発コマンド

```bash
npm run dev              # 開発サーバー起動
npm run build            # 本番ビルド (prisma generate を含む)
npm run lint             # ESLint
npm run prisma:generate  # Prisma クライアント生成
npm run prisma:push      # DB スキーマ反映
npm run prisma:studio    # Prisma Studio 起動
npm run prisma:seed      # seed 実行
```

---

## 🚦 作業時の重要ルール

1. **`develop` ブランチに直接コミットしない** — 必ず作業ブランチを切る
2. **`main` への直接マージ禁止** — リリースPR経由のみ
3. **環境変数ファイル（`.env.local`）は絶対にコミットしない**
4. **PR は必ずテンプレートに従う** (`.github/PULL_REQUEST_TEMPLATE.md`)
5. **Issue は必ずテンプレートを使用** (`.github/ISSUE_TEMPLATE/`)
6. **DB スキーマ変更を含む PR は明示する** — レビュアーが見落とさないように
7. **破壊的操作 (`git push --force`, `reset --hard` 等) は事前確認**

---

## 🔗 関連ドキュメント

- [`README.md`](./README.md) — セットアップと運用ガイド
- [`SETUP_GUIDE.md`](./SETUP_GUIDE.md) — 環境構築の詳細手順
- [`API_IMPLEMENTATION.md`](./API_IMPLEMENTATION.md) — API 実装メモ
- [`DEVELOPMENT_RUNBOOK.md`](./DEVELOPMENT_RUNBOOK.md) — 開発時のランブック
- [`claude_code_guide.md`](./claude_code_guide.md) — Claude Code 利用ガイド
- `SUPABASE_*.md` — Supabase 関連の設定ドキュメント

---

## 🛠 Skill 一覧 (`.claude/skills/`)

| Skill | ファイル | 用途 |
| --- | --- | --- |
| `issue-new` | `.claude/skills/issue-new/issue-new.md` | Issue を対話形式で作成 |
| `pr-create` | `.claude/skills/pr-create/pr-create.md` | PR を作成（テンプレート準拠） |
| `feature` | `.claude/skills/feature/feature.md` | 新機能実装ワークフロー（Issue → ブランチ → 実装 → PR） |
| `release` | `.claude/skills/release/release.md` | リリースPR作成（develop → main、back-merge 含む） |
| `hotfix` | `.claude/skills/hotfix/hotfix.md` | 緊急バグ修正ワークフロー（main → fix → main マージ → develop へ back-merge） |

各 Skill は `/{skill-name}` の形で呼び出せます。
Skill ファイルは `.claude/skills/{name}/{name}.md` に配置し、スクリプトや参照ファイルは同フォルダ内に追加します。
