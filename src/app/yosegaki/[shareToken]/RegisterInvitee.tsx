"use client";

import { useEffect } from "react";

type Props = { shareToken: string };

// ログイン済みユーザーがshareTokenページを訪問した際、自動で参加者として登録する
export default function RegisterInvitee({ shareToken }: Props) {
  useEffect(() => {
    fetch(`/api/yosegaki/share/${shareToken}/register`, { method: "POST" }).catch(() => {});
  }, [shareToken]);

  return null;
}
