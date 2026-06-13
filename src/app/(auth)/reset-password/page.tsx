"use client";

import { useState, useEffect, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

function ResetPasswordInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exchanging, setExchanging] = useState(true);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code || !supabase) {
      setError("無効なリンクです。パスワード再設定メールを再送してください。");
      setExchanging(false);
      return;
    }

    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        setError("リンクの有効期限が切れています。パスワード再設定メールを再送してください。");
      }
      setExchanging(false);
    });
  }, [searchParams]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("パスワードが一致しません");
      return;
    }
    if (password.length < 6) {
      setError("パスワードは6文字以上で入力してください");
      return;
    }
    if (!supabase) {
      setError("設定エラーが発生しました");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setError(error.message);
        return;
      }
      await supabase.auth.signOut();
      setDone(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch {
      setError("パスワードの更新に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#EBF2FF] to-[#E3EAF5] p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/icons/Musuhi1.png" alt="Musuhi" className="h-[168px] w-auto object-contain mx-auto mb-1" />
          <p className="text-gray-600">気持ちを残す</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6">パスワード再設定</h2>

          {done ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <CheckCircle size={48} className="text-[#2A5CAA]" />
              <p className="text-sm text-gray-700 text-center leading-relaxed">
                パスワードを更新しました。<br />
                3秒後にログインページへ移動します。
              </p>
              <Link href="/login" className="text-sm text-[#2A5CAA] hover:text-[#1F4580] underline">
                今すぐログインページへ
              </Link>
            </div>
          ) : exchanging ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-2 border-[#2A5CAA] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-red-600">{error}</p>
                    <Link href="/forgot-password" className="text-xs text-[#2A5CAA] underline mt-1 block">
                      再設定メールを再送する
                    </Link>
                  </div>
                </div>
              )}

              {!error && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      新しいパスワード
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      新しいパスワード（確認）
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type={showConfirm ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="もう一度入力"
                        className="w-full pl-11 pr-11 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2A5CAA] focus:border-transparent"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        aria-label={showConfirm ? "パスワードを非表示" : "パスワードを表示"}
                      >
                        {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-[#4A7BC8] to-[#2A5CAA] text-white py-3 rounded-lg font-medium hover:from-[#2A5CAA] hover:to-[#1F4580] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        更新中...
                      </span>
                    ) : (
                      "パスワードを更新する"
                    )}
                  </button>
                </form>
              )}
            </>
          )}
        </div>

        <p className="text-center text-sm text-gray-500 mt-8">
          © 2026 Musuhi. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#EBF2FF] to-[#E3EAF5]" />}>
      <ResetPasswordInner />
    </Suspense>
  );
}
