"use client";

import { Suspense, useState, FormEvent, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, User as UserIcon, AtSign, AlertCircle, CheckCircle, Camera, Loader2, Eye, EyeOff } from "lucide-react";
import { InlineOverlay } from "@/components/ui/Overlay";

function SignupPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const giftToken = searchParams.get("giftToken");
  const returnTitle = searchParams.get("returnTitle");
  const [userId, setUserId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  async function handleAvatarUpload(file: File) {
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await fetch("/api/upload/avatar", {
        method: "POST",
        body: formData,
      });
      if (!uploadRes.ok) throw new Error("アバター画像のアップロードに失敗しました");
      const { url } = await uploadRes.json();
      setAvatarUrl(url);
    } catch (error) {
      alert(error instanceof Error ? error.message : "アバター画像のアップロードに失敗しました");
    } finally {
      setUploadingAvatar(false);
    }
  }

  function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) handleAvatarUpload(file);
  }

  async function handleSignup(e: FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");

    if (password.length < 6) {
      setError("パスワードは6文字以上で入力してください");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          name: userId,
          displayName: displayName || userId,
          avatarUrl: avatarUrl || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "サインアップに失敗しました");
        return;
      }

      if (data.emailConfirmationRequired || !data.sessionCreated) {
        setInfo("アカウントを作成しました。メール確認後にログインしてください。");
        const loginDest = returnTitle
          ? `/login?returnTitle=${encodeURIComponent(returnTitle)}`
          : giftToken
          ? `/login?giftToken=${giftToken}`
          : "/login";
        router.push(loginDest);
        return;
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("musuhi-login-session-id", String(Date.now()));
      }

      if (returnTitle) {
        router.push(`/gift/new?title=${encodeURIComponent(returnTitle)}`);
        router.refresh();
        return;
      }

      if (giftToken) {
        try {
          const joinRes = await fetch(`/api/voice-gifts/share/${giftToken}/join`, { method: "POST" });
          if (joinRes.ok) {
            const joinData = await joinRes.json();
            router.push(`/gift/${joinData.voiceGiftId}`);
            router.refresh();
            return;
          }
          const shareRes = await fetch(`/api/voice-gifts/share/${giftToken}`);
          if (shareRes.ok) {
            const shareData = await shareRes.json();
            if (shareData.voiceGift?.id) {
              router.push(`/gift/${shareData.voiceGift.id}`);
              router.refresh();
              return;
            }
          }
        } catch (joinError) {
          console.error("Join voice gift error:", joinError);
        }
      }

      // 新規登録成功 → プロフィール作成画面へ
      router.push("/mypage/edit");
      router.refresh();
    } catch (err) {
      setError("サインアップに失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#EBF2FF] to-[#E3EAF5] p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/icons/Musuhi1.png" alt="Musuhi" className="h-[168px] w-auto object-contain mx-auto mb-1" />
          <p className="text-gray-600 leading-snug">
            声からはじまる<br />自分と人とのつながり
          </p>
        </div>

        {/* Signup Form */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            新規登録
          </h2>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {info && (
            <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2">
              <CheckCircle size={20} className="text-emerald-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-emerald-700">{info}</p>
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            {/* ユーザーID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ユーザーID
              </label>
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="musuhi_taro123"
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2A5CAA] focus:border-transparent"
                  required
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">他のユーザーにも公開される「背番号」のようなIDです。本名やメールアドレスではなく、お好きな半角英数字で設定してください（一度設定すると後から変更できません）</p>
            </div>

            {/* 名前（表示名） */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                名前（表示名）
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="山田太郎"
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2A5CAA] focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* アバター画像 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                プロフィール画像（任意）
              </label>
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-[#4A7BC8] to-[#2A5CAA] flex items-center justify-center text-white text-xl font-bold overflow-hidden">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    (displayName || userId).charAt(0).toUpperCase() || "?"
                  )}
                  {uploadingAvatar && (
                    <InlineOverlay>
                      <Loader2 className="text-white animate-spin" size={20} />
                    </InlineOverlay>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar || loading}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition-colors disabled:opacity-50"
                >
                  <Camera size={16} />
                  {avatarUrl ? "変更" : "画像を選択"}
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>
            </div>

            {/* メールアドレス */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                メールアドレス
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2A5CAA] focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* パスワード */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                パスワード
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="6文字以上"
                  className="w-full pl-11 pr-11 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2A5CAA] focus:border-transparent"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? "パスワードを非表示" : "パスワードを表示"}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#4A7BC8] to-[#2A5CAA] text-white py-3 rounded-lg font-medium hover:from-[#2A5CAA] hover:to-[#1F4580] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  登録中...
                </>
              ) : (
                "Musuhiをはじめる >"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              すでにアカウントをお持ちの方は
              <Link
                href="/login"
                className="text-[#2A5CAA] font-medium hover:text-[#1F4580] ml-1"
              >
                ログイン
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-8">
          © 2026 Musuhi. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#EBF2FF] to-[#E3EAF5]" />}>
      <SignupPageInner />
    </Suspense>
  );
}
