"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { Mail, AlertCircle, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch {
      setError("送信に失敗しました。しばらくしてからお試しください。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#EBF2FF] to-[#E3EAF5] p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/icons/Musuhi1.png" alt="Musuhi" className="h-[168px] w-auto object-contain mx-auto mb-1" />
          <p className="text-gray-600 leading-snug">
            声からはじまる<br />自分と人とのつながり
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-2">パスワード再設定</h2>
          <p className="text-sm text-gray-500 mb-6">
            登録済みのメールアドレスを入力してください。パスワード再設定用のリンクをお送りします。
          </p>

          {sent ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <CheckCircle size={48} className="text-[#2A5CAA]" />
              <p className="text-sm text-gray-700 text-center leading-relaxed">
                メールを送信しました。<br />
                受信ボックスをご確認ください。
              </p>
              <Link href="/login" className="text-sm text-[#2A5CAA] hover:text-[#1F4580] underline">
                ログインページへ戻る
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#4A7BC8] to-[#2A5CAA] text-white py-3 rounded-lg font-medium hover:from-[#2A5CAA] hover:to-[#1F4580] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      送信中...
                    </span>
                  ) : (
                    "再設定メールを送信"
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link href="/login" className="text-sm text-[#2A5CAA] hover:text-[#1F4580]">
                  ログインページへ戻る
                </Link>
              </div>
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
