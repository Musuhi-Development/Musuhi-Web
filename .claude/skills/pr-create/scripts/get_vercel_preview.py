#!/usr/bin/env python3
"""
GitHub Deployments API 経由で Vercel プレビュー URL を取得する。

Vercel は GitHub と連携している場合、コミット SHA を ref として GitHub Deployment を作成し、
デプロイ完了時に environment_url を設定する。
ブランチの HEAD SHA を取得してそれにマッチするデプロイを探す。

Usage:
  python3 get_vercel_preview.py <owner/repo> <branch> [--timeout 180]

Exit code:
  0 - URL を stdout に出力して終了
  1 - タイムアウトまたはデプロイ失敗
"""
import subprocess
import json
import sys
import time
import argparse


def gh_api(path: str) -> list | dict | None:
    result = subprocess.run(
        ["gh", "api", path],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        return None
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError:
        return None


def get_branch_sha(repo: str, branch: str) -> str | None:
    data = gh_api(f"repos/{repo}/branches/{branch}")
    if data is None:
        return None
    return data.get("commit", {}).get("sha")


def get_vercel_preview_url(repo: str, branch: str, timeout: int) -> str | None:
    start = time.time()

    # ブランチの HEAD SHA を取得
    head_sha = get_branch_sha(repo, branch)
    if head_sha:
        print(f"Branch HEAD SHA: {head_sha[:12]}...", file=sys.stderr)

    while time.time() - start < timeout:
        # 直近のデプロイを取得（Vercel は SHA を ref として登録する）
        # environment=Preview で絞り込み
        deployments = gh_api(
            f"repos/{repo}/deployments?environment=Preview&per_page=20"
        )
        if deployments is None:
            time.sleep(10)
            continue

        for deployment in deployments:
            dep_id = deployment.get("id")
            dep_ref = deployment.get("ref", "")

            # SHA マッチ、またはブランチ名マッチの両方に対応
            is_match = (
                (head_sha and dep_ref == head_sha)
                or dep_ref == branch
            )
            if not is_match:
                continue

            statuses = gh_api(
                f"repos/{repo}/deployments/{dep_id}/statuses?per_page=10"
            )
            if not statuses:
                continue

            for status in statuses:
                state = status.get("state")
                env_url = status.get("environment_url")

                if state == "success" and env_url:
                    return env_url

                if state in ("failure", "error"):
                    print(
                        f"[warn] Deployment {dep_id} failed: {status.get('description', 'unknown')}",
                        file=sys.stderr,
                    )

        elapsed = int(time.time() - start)
        print(f"Waiting for Vercel deployment... ({elapsed}s / {timeout}s)", file=sys.stderr)
        time.sleep(15)

    return None


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Vercel プレビュー URL を GitHub Deployments API 経由で取得"
    )
    parser.add_argument("repo", help="owner/repo 形式 (例: Musuhi-Development/Musuhi-Web)")
    parser.add_argument("branch", help="ブランチ名")
    parser.add_argument(
        "--timeout",
        type=int,
        default=180,
        help="タイムアウト秒数 (default: 180)",
    )
    args = parser.parse_args()

    url = get_vercel_preview_url(args.repo, args.branch, args.timeout)
    if url:
        print(url)
        sys.exit(0)
    else:
        print("[error] Vercel preview URL を取得できませんでした", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
