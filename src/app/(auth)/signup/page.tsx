"use client";

import { Suspense, useState, FormEvent, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, User as UserIcon, AtSign, AlertCircle, CheckCircle, Camera, Loader2, Eye, EyeOff } from "lucide-react";
import { InlineOverlay } from "@/components/ui/Overlay";
import { createBrowserClient } from "@supabase/ssr";

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
  const [googleLoading, setGoogleLoading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  async function handleGoogleSignup() {
    setGoogleLoading(true);
    setError("");

    // createBrowserClient stores the PKCE code_verifier in cookies so the
    // server-side callback route can access it during exchangeCodeForSession.
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const redirectTo = `${window.location.origin}/api/auth/callback${
      returnTitle ? `?returnTitle=${encodeURIComponent(returnTitle)}` :
      giftToken ? `?giftToken=${giftToken}` : ""
    }`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });

    if (error) {
      setError("Googleログインに失敗しました");
      setGoogleLoading(false);
    }
  }

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

          {/* Google Signup Button */}
          <button
            type="button"
            onClick={handleGoogleSignup}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-6"
          >
            {googleLoading ? (
              <Loader2 size={20} className="animate-spin text-gray-500" />
            ) : (
              <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#4285F4" d="M44.5 20H24v8.5h11.8C34.7 33.9 29.8 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3 12.9 3 4 11.9 4 23s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.2-3z"/>
                <path fill="#34A853" d="M6.3 14.7l7 5.1C15 16.1 19.1 13 24 13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3c-7.6 0-14.2 4.2-17.7 10.7z" transform="translate(0,0.5)"/>
                <path fill="#FBBC05" d="M24 43c5.6 0 10.6-1.9 14.5-5.1l-6.7-5.5C29.8 34.1 27 35 24 35c-5.8 0-10.7-3.1-11.8-8.5l-7 5.4C8.6 39.4 15.8 43 24 43z" transform="translate(0,-0.5)"/>
                <path fill="#EA4335" d="M44.5 20H24v8.5h11.8c-0.7 2.3-2.2 4.3-4.1 5.7l6.7 5.5C42.4 36 44.5 30 44.5 23c0-1-.1-2-.2-3z" transform="translate(0,0)"/>
              </svg>
            )}
            <span className="text-sm font-medium text-gray-700">Googleで登録</span>
          </button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white text-gray-500">またはメールアドレスで登録</span>
            </div>
          </div>

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
