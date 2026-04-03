"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, Save } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import { InlineOverlay } from "@/components/ui/Overlay";

export default function EditProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [location, setLocation] = useState("");
  const [birthday, setBirthday] = useState("");
  const [anniversariesText, setAnniversariesText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    setLoading(true);
    try {
      const res = await fetch("/api/users/me");
      
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      
      if (!res.ok) {
        throw new Error("プロフィールの取得に失敗しました");
      }
      
      const data = await res.json();
      const user = data.user;
      
      setName(user.name || "");
      setDisplayName(user.displayName || "");
      setBio(user.bio || "");
      setAvatarUrl(user.avatarUrl || "");
      setLocation(user.location || "");
      setBirthday(user.birthday ? new Date(user.birthday).toISOString().slice(0, 10) : "");
      setAnniversariesText(
        Array.isArray(user.anniversaries)
          ? user.anniversaries
              .map((item: any) => {
                if (!item) return "";
                if (typeof item === "string") return item;
                return item.date ? `${item.label || ""},${item.date}` : item.label || "";
              })
              .filter(Boolean)
              .join("\n")
          : ""
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  function parseAnniversaries(text: string) {
    return text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [label, date] = line.split(",").map((v) => v?.trim());
        return { label, ...(date ? { date } : {}) };
      })
      .filter((item) => item.label);
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

      if (!uploadRes.ok) {
        throw new Error("アバター画像のアップロードに失敗しました");
      }

      const { url } = await uploadRes.json();
      setAvatarUrl(url);
    } catch (error) {
      console.error("Avatar upload error:", error);
      alert(error instanceof Error ? error.message : "アバター画像のアップロードに失敗しました");
    } finally {
      setUploadingAvatar(false);
    }
  }

  function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      handleAvatarUpload(file);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/users/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          displayName: displayName.trim() || null,
          bio: bio.trim() || null,
          avatarUrl: avatarUrl || null,
          location: location.trim() || null,
          birthday: birthday || null,
          anniversaries: parseAnniversaries(anniversariesText),
        }),
      });

      if (!res.ok) {
        throw new Error("プロフィールの更新に失敗しました");
      }

      router.push("/mypage");
    } catch (error) {
      console.error("Save error:", error);
      setError(error instanceof Error ? error.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const displayInitial = (displayName || name || "U").charAt(0).toUpperCase();

  return (
    <div className="pb-24 min-h-screen bg-gray-50">
      <PageHeader 
        title="プロフィール編集" 
        showBackButton={true}
        actionButton={
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-orange-500 font-bold disabled:text-gray-300 flex items-center gap-1"
          >
            {saving ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Save size={16} />
                保存
              </>
            )}
          </button>
        }
      />

      <div className="p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* アバター */}
        <div className="flex flex-col items-center">
          <div className="relative w-24 h-24 mb-4">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                displayInitial
              )}
              {uploadingAvatar && (
                <InlineOverlay>
                  <Loader2 className="text-white animate-spin" size={24} />
                </InlineOverlay>
              )}
            </div>
            <button
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar || saving}
              className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-md border border-gray-100 text-gray-500 hover:text-gray-700 disabled:opacity-50"
            >
              <Camera size={16} />
            </button>
          </div>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleAvatarChange}
            className="hidden"
          />
          <p className="text-xs text-gray-500">クリックして画像を変更</p>
        </div>

        {/* ID（変更不可） */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ユーザーID
          </label>
          <input
            type="text"
            value={name}
            disabled
            className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-500"
          />
          <p className="text-xs text-gray-500 mt-1">※ IDは変更できません</p>
        </div>

        {/* 表示名 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            表示名
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="表示名を入力"
            disabled={saving}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200 disabled:opacity-50"
          />
        </div>

        {/* 自己紹介 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            自己紹介
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="自己紹介を入力"
            rows={4}
            disabled={saving}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200 resize-none disabled:opacity-50"
          />
          <p className="text-xs text-gray-500 mt-1">{bio.length}/200</p>
        </div>

        {/* 場所 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            場所
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="例: 東京都"
            disabled={saving}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200 disabled:opacity-50"
          />
        </div>

        {/* 誕生日 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            誕生日
          </label>
          <input
            type="date"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
            disabled={saving}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200 disabled:opacity-50"
          />
        </div>

        {/* 記念日 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            記念日
          </label>
          <textarea
            value={anniversariesText}
            onChange={(e) => setAnniversariesText(e.target.value)}
            placeholder={"1行に1件、\"名称,YYYY-MM-DD\" 形式で入力\n例: 結婚記念日,2020-10-10"}
            rows={4}
            disabled={saving}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200 resize-none disabled:opacity-50"
          />
        </div>
      </div>
    </div>
  );
}

