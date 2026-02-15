"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Globe, Bell, Lock, Palette } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const [language, setLanguage] = useState("ja");
  const [notifications, setNotifications] = useState(true);

  return (
    <div className="pb-24 min-h-screen bg-gray-50">
      <header className="sticky top-0 bg-white z-30 border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-500">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-gray-800 flex-1">アカウント設定</h1>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* 基本設定 */}
        <section>
          <h2 className="text-xs font-bold text-gray-500 mb-2 px-2">基本設定</h2>
          <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100">
            {/* 言語設定 */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
                    <Globe size={16} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">言語</p>
                    <p className="text-xs text-gray-500">表示言語を選択</p>
                  </div>
                </div>
              </div>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full mt-2 bg-gray-50 border border-gray-200 text-gray-700 py-2 px-3 rounded-lg focus:outline-none focus:border-blue-400"
              >
                <option value="ja">日本語</option>
                <option value="en">English</option>
                <option value="zh">中文</option>
                <option value="ko">한국어</option>
              </select>
            </div>

            {/* テーマ設定 */}
            <button className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center">
                  <Palette size={16} />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-800">テーマ</p>
                  <p className="text-xs text-gray-500">ライト</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-400" />
            </button>
          </div>
        </section>

        {/* 通知設定 */}
        <section>
          <h2 className="text-xs font-bold text-gray-500 mb-2 px-2">通知設定</h2>
          <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-50 text-green-500 flex items-center justify-center">
                  <Bell size={16} />
                </div>
                <div>
                  <p className="font-medium text-gray-800">プッシュ通知</p>
                  <p className="text-xs text-gray-500">新着メッセージなどを通知</p>
                </div>
              </div>
              <button
                onClick={() => setNotifications(!notifications)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications ? "bg-blue-500" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifications ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <button className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="text-left">
                <p className="font-medium text-gray-800">通知の詳細設定</p>
                <p className="text-xs text-gray-500">カテゴリ別に設定</p>
              </div>
              <ChevronRight size={18} className="text-gray-400" />
            </button>
          </div>
        </section>

        {/* プライバシー設定 */}
        <section>
          <h2 className="text-xs font-bold text-gray-500 mb-2 px-2">プライバシー</h2>
          <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100">
            <button className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center">
                  <Lock size={16} />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-800">プライバシー設定</p>
                  <p className="text-xs text-gray-500">公開範囲やブロック設定</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-400" />
            </button>

            <button className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="text-left">
                <p className="font-medium text-gray-800">データ管理</p>
                <p className="text-xs text-gray-500">データのエクスポート・削除</p>
              </div>
              <ChevronRight size={18} className="text-gray-400" />
            </button>
          </div>
        </section>

        {/* その他 */}
        <section>
          <h2 className="text-xs font-bold text-gray-500 mb-2 px-2">その他</h2>
          <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100">
            <button className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <p className="font-medium text-gray-800">利用規約</p>
              <ChevronRight size={18} className="text-gray-400" />
            </button>

            <button className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <p className="font-medium text-gray-800">プライバシーポリシー</p>
              <ChevronRight size={18} className="text-gray-400" />
            </button>

            <button className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <p className="font-medium text-gray-800">ヘルプ・お問い合わせ</p>
              <ChevronRight size={18} className="text-gray-400" />
            </button>

            <div className="p-4 text-center">
              <p className="text-xs text-gray-400">バージョン 1.0.0</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
