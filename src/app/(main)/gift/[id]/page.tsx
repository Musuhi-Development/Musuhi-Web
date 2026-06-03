"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Calendar, Copy, Loader2, Check } from "lucide-react";
import { clsx } from "clsx";
import { useUser } from "@/hooks/useUser";
import { WaveformPlayer } from "@/components/WaveformPlayer";
import { MizuhikiBow } from "@/components/shared/MizuhikiBow";

type Recording = {
	id: string;
	title: string;
	duration: number;
};

const emotionToAnimal: { [key: string]: string } = {
	"嬉しい": "/animal/dog.png",
	"感謝": "/animal/rabbit.png",
	"楽しい": "/animal/horse.png",
	"幸せ": "/animal/cat.png",
	"ワクワク": "/animal/lion.png",
	"応援": "/animal/tiger.png",
	"疲れた": "/animal/monkey.png",
	"悲しい": "/animal/turtle.png",
	"イライラ": "/animal/bear.png",
};

export default function GiftDetailPage() {
	const router = useRouter();
	const params = useParams();
	const giftId = Array.isArray(params?.id) ? params?.id[0] : (params?.id as string | undefined);
	const { user } = useUser();
	const [gift, setGift] = useState<any | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [recordings, setRecordings] = useState<Recording[]>([]);
	const [selectedRecordingIds, setSelectedRecordingIds] = useState<string[]>([]);
	const [addingRecording, setAddingRecording] = useState(false);
	const [sendAt, setSendAt] = useState("");
	const [updatingSchedule, setUpdatingSchedule] = useState(false);
	const [sendingNow, setSendingNow] = useState(false);
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		if (!giftId) return;
		fetchGift(giftId);
		fetchRecordings();
	}, [giftId]);

	async function fetchGift(id: string) {
		setLoading(true);
		setError(null);
		try {
			const res = await fetch(`/api/voice-gifts/${id}`);
			if (!res.ok) {
				throw new Error("ボイスギフトの取得に失敗しました");
			}
			const data = await res.json();
			setGift(data.voiceGift);
			if (data.voiceGift?.sendAt) {
				setSendAt(new Date(data.voiceGift.sendAt).toISOString().slice(0, 16));
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "エラーが発生しました");
		} finally {
			setLoading(false);
		}
	}

	async function fetchRecordings() {
		try {
			const res = await fetch("/api/recordings");
			if (res.ok) {
				const data = await res.json();
				setRecordings(data.recordings || []);
			}
		} catch (error) {
			console.error("Failed to fetch recordings:", error);
		}
	}

	const isOwner = gift?.ownerId === user?.id;
	const isParticipant = gift?.participants?.some((p: any) => p.userId === user?.id);
	const canEdit = isOwner || isParticipant;

	const distinctContributorCount = useMemo(() => {
		const ids = new Set(
			(gift?.recordings || []).map((r: any) => r.contributor?.id).filter(Boolean)
		);
		return ids.size;
	}, [gift]);
	const isCollab = distinctContributorCount > 1 || (gift?.participants?.length || 0) > 1;

	const displayTitle = useMemo(() => {
		const first = (gift?.recordings || [])[0];
		const title = first?.recording?.title;
		return title && String(title).trim() ? title : "無題";
	}, [gift]);

	const repImage = useMemo(() => {
		const firstRec = (gift?.recordings || [])[0]?.recording;
		const images = firstRec?.images;
		return Array.isArray(images) && images.length > 0 ? images[0] : null;
	}, [gift]);

	const repEmotions: string[] = useMemo(() => {
		const firstRec = (gift?.recordings || [])[0]?.recording;
		return Array.isArray(firstRec?.emotions) ? firstRec.emotions : [];
	}, [gift]);

	const shareLink = useMemo(() => {
		if (!gift?.shareToken) return "";
		if (typeof window === "undefined") return "";
		return `${window.location.origin}/gift/share/${gift.shareToken}`;
	}, [gift?.shareToken]);

	const handleCopy = async () => {
		if (!shareLink) return;
		await navigator.clipboard.writeText(`ボイスギフトを作りませんか？\n${shareLink}`);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const handleToggleRecording = (recordingId: string) => {
		setSelectedRecordingIds((prev) =>
			prev.includes(recordingId) ? prev.filter((id) => id !== recordingId) : [...prev, recordingId]
		);
	};

	const handleAddRecordings = async () => {
		if (!giftId) return;
		if (selectedRecordingIds.length === 0) return;
		setAddingRecording(true);
		try {
			await Promise.all(
				selectedRecordingIds.map((recordingId) =>
					fetch(`/api/voice-gifts/${giftId}/recordings`, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ recordingId }),
					})
				)
			);
			setSelectedRecordingIds([]);
			await fetchGift(giftId);
		} catch (error) {
			console.error("Add recording error:", error);
			alert("録音の追加に失敗しました");
		} finally {
			setAddingRecording(false);
		}
	};

	const handleSendNow = async () => {
		if (!giftId) return;
		setSendingNow(true);
		try {
			const res = await fetch(`/api/voice-gifts/${giftId}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ sendNow: true }),
			});
			if (!res.ok) {
				throw new Error("送信に失敗しました");
			}
			await fetchGift(giftId);
		} catch (error) {
			console.error("Send now error:", error);
			alert("送信に失敗しました");
		} finally {
			setSendingNow(false);
		}
	};

	const handleUpdateSchedule = async () => {
		if (!giftId) return;
		if (!sendAt) {
			alert("送信日時を選択してください");
			return;
		}
		setUpdatingSchedule(true);
		try {
			const res = await fetch(`/api/voice-gifts/${giftId}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ sendAt }),
			});
			if (!res.ok) {
				throw new Error("送信日時の更新に失敗しました");
			}
			await fetchGift(giftId);
		} catch (error) {
			console.error("Update schedule error:", error);
			alert("送信日時の更新に失敗しました");
		} finally {
			setUpdatingSchedule(false);
		}
	};

	const formatDateTime = (dateString: string) => {
		const date = new Date(dateString);
		const pad = (n: number) => String(n).padStart(2, "0");
		return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<Loader2 className="w-8 h-8 animate-spin text-[#2A5CAA]" />
			</div>
		);
	}

	if (error || !gift) {
		return (
			<div className="min-h-screen bg-gray-50 p-6">
				<p className="text-red-500 mb-4">{error || "ボイスギフトが見つかりません"}</p>
				<button onClick={() => router.push("/gift")} className="text-[#2A5CAA] font-medium">
					一覧へ戻る
				</button>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50 pb-24">
			<div className="bg-white px-6 py-4 shadow-sm">
				<div className="flex items-center justify-between">
					<button onClick={() => router.back()} className="text-gray-500">戻る</button>
					<h1 className="text-lg font-bold text-gray-800">ボイスギフト</h1>
					<span className="w-8" />
				</div>
			</div>

			<div className="px-6 py-6 space-y-6">
				{/* ポラロイドカード（ボイスアルバムの音声ジャーナル詳細と統一） */}
				<div
					className="relative bg-[#F3EBDD] rounded-2xl p-5 sm:p-7 shadow-[0_18px_40px_rgba(0,0,0,0.12)]"
					style={{
						backgroundImage:
							"radial-gradient(rgba(255,255,255,0.5) 0.5px, transparent 0.5px), radial-gradient(rgba(120,95,55,0.06) 0.5px, transparent 0.5px)",
						backgroundSize: "5px 5px",
						backgroundPosition: "0 0, 2.5px 2.5px",
					}}
				>
					<div className="relative bg-white rounded-[3px] px-5 sm:px-6 pt-6 pb-6 shadow-[0_16px_34px_-8px_rgba(0,0,0,0.25)]">
						{/* クラフト紙テープ */}
						<div
							className="absolute -top-2 left-1/2 -translate-x-1/2 w-24 h-7 rotate-[-3deg] z-20 bg-[#9CB38D] shadow-[0_3px_6px_-1px_rgba(0,0,0,0.22),inset_0_0_10px_rgba(60,75,50,0.18)]"
							style={{
								backgroundImage:
									"radial-gradient(rgba(255,255,255,0.10) 0.5px, transparent 0.6px), repeating-linear-gradient(112deg, rgba(60,75,50,0.05) 0px, rgba(60,75,50,0.05) 1px, transparent 1px, transparent 3px)",
								backgroundSize: "3px 3px, auto",
							}}
							aria-hidden="true"
						/>

						{/* 写真 */}
						{repImage ? (
							<img
								src={repImage}
								alt={displayTitle}
								className="w-full rounded-sm object-cover max-h-64 sm:max-h-72 ring-1 ring-black/[0.07]"
							/>
						) : (
							<div className="w-full h-52 rounded-sm bg-gradient-to-br from-teal-100 to-blue-100 flex items-center justify-center ring-1 ring-black/[0.07]">
								{repEmotions.length > 0 && emotionToAnimal[repEmotions[0]] ? (
									<img src={emotionToAnimal[repEmotions[0]]} alt="" className="w-24 h-24 object-contain" />
								) : (
									<span className="text-6xl">🎵</span>
								)}
							</div>
						)}

						<div className="pt-4 px-1 space-y-3 pb-3">
							{/* タイトル（=録音タイトル） */}
							<p className="text-lg font-bold text-gray-800 tracking-wide leading-snug pr-9">
								{displayTitle}
							</p>

							{/* メッセージをポラロイド内に表示 */}
							{gift.message && (
								<p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
									{gift.message}
								</p>
							)}

							{/* 収録音声（複数＝寄せ音声は貢献者名付きで列挙） */}
							{(gift.recordings || []).length === 0 ? (
								<p className="text-sm text-gray-500">まだ音声がありません</p>
							) : (
								<div className="space-y-2">
									{gift.recordings.map((item: any) => (
										<div
											key={item.id}
											className="rounded-2xl bg-transparent border border-[#1e50a2]/30 px-3 py-2.5"
										>
											{isCollab && (
												<p className="text-[11px] text-gray-500 mb-1">
													{item.contributor?.displayName || item.contributor?.name || "ユーザー"}
												</p>
											)}
											{item.recording?.audioUrl ? (
												<WaveformPlayer src={item.recording.audioUrl} duration={item.recording.duration} />
											) : (
												<p className="text-xs text-gray-400">{item.recording?.title || "音声"}</p>
											)}
										</div>
									))}
								</div>
							)}

							{/* 感情タグ */}
							{repEmotions.length > 0 && (
								<div className="flex flex-wrap gap-2 pr-10">
									{repEmotions.map((emotion: string) => (
										<span key={emotion} className="text-xs px-2 py-1 bg-blue-50 text-[#2A5CAA] rounded-full">
											#{emotion}
										</span>
									))}
								</div>
							)}
						</div>

						{/* 録音日時：ポラロイド右下に配置 */}
						<p className="absolute bottom-3 right-4 text-[10px] text-gray-400 whitespace-nowrap">
							{formatDateTime(gift.sendAt || gift.createdAt)}
						</p>
					</div>
				</div>

				{/* 手紙エリア（ポラロイド直下・便箋風） */}
				<div
					className="relative rounded-2xl bg-[#FAF7F2] shadow-sm px-6 sm:px-8 py-7 pb-12"
					style={{
						backgroundImage:
							"repeating-linear-gradient(transparent, transparent 31px, rgba(120,95,55,0.10) 31px, rgba(120,95,55,0.10) 32px)",
					}}
				>
					{/* 宛名「○○へ」 */}
					<p className="text-xl font-bold text-gray-800 mb-5">{gift.title}へ</p>
					{/* メッセージ本文 */}
					<p className="text-[15px] text-gray-700 leading-[2rem] whitespace-pre-wrap min-h-[4rem]">
						{gift.message || ""}
					</p>
					{/* 右下に水引モチーフ */}
					<MizuhikiBow className="absolute bottom-3 right-4 w-10 h-7 opacity-80" />
				</div>

				{/* ─── 以下は編集可能なオーナー/参加者向けの管理UI ─── */}
				{/* 共有リンクは複数人で作成（寄せ音声）の場合のみ表示。1人で作成（通常版）では非表示 */}
				{isOwner && isCollab && (
					<div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-3xl p-6 shadow-md">
						<h3 className="text-sm font-bold text-gray-700 mb-2">共有リンク</h3>
						<p className="text-xs text-gray-600 mb-3">
							友人に共有して参加してもらいましょう。
						</p>
						<div className="flex items-center gap-2">
							<input
								type="text"
								readOnly
								value={shareLink}
								className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-500"
							/>
							<button
								onClick={handleCopy}
								className="px-3 py-2 bg-[#2A5CAA] text-white rounded-lg text-xs flex items-center gap-1"
							>
								{copied ? <Check size={12} /> : <Copy size={12} />}
								{copied ? "コピー済" : "コピー"}
							</button>
						</div>
					</div>
				)}

				{canEdit && gift.status !== "sent" && (
					<div className="bg-white rounded-3xl shadow-md p-6 space-y-4">
						<h3 className="text-sm font-bold text-gray-700">音声を追加</h3>
						{recordings.length === 0 ? (
							<p className="text-sm text-gray-500">録音がありません</p>
						) : (
							<div className="grid grid-cols-2 gap-3">
								{recordings.map((recording) => {
									const selected = selectedRecordingIds.includes(recording.id);
									return (
										<button
											key={recording.id}
											onClick={() => handleToggleRecording(recording.id)}
											className={clsx(
												"p-3 rounded-2xl border text-left",
												selected ? "bg-blue-50 border-[#2A5CAA]" : "bg-white border-gray-200"
											)}
										>
											<p className="text-sm font-semibold text-gray-800 truncate">{recording.title}</p>
											<p className="text-xs text-gray-500">{Math.round(recording.duration)}秒</p>
										</button>
									);
								})}
							</div>
						)}
						<button
							onClick={handleAddRecordings}
							className="w-full bg-[#2A5CAA] text-white py-2 rounded-full text-sm font-semibold disabled:opacity-50"
							disabled={addingRecording || selectedRecordingIds.length === 0}
						>
							{addingRecording ? "追加中..." : "選択した音声を追加"}
						</button>
					</div>
				)}

				{isOwner && gift.status !== "sent" && (
					<div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-6 shadow-md space-y-3">
						<h3 className="text-sm font-bold text-gray-700">送信管理</h3>
						<div>
							<label className="text-xs font-bold text-gray-500 mb-1 block">送信日時</label>
							<div className="relative">
								<input
									type="datetime-local"
									value={sendAt}
									onChange={(e) => setSendAt(e.target.value)}
									className="w-full appearance-none bg-white border border-gray-200 text-gray-700 py-3 px-4 rounded-lg focus:outline-none focus:border-[#2A5CAA]"
								/>
								<Calendar className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
							</div>
						</div>
						<div className="flex gap-3">
							<button
								onClick={handleUpdateSchedule}
								className="flex-1 bg-white border border-[#2A5CAA] text-[#2A5CAA] py-2 rounded-full text-sm font-semibold"
								disabled={updatingSchedule}
							>
								{updatingSchedule ? "更新中..." : "送信予約を更新"}
							</button>
							<button
								onClick={handleSendNow}
								className="flex-1 bg-[#2A5CAA] text-white py-2 rounded-full text-sm font-semibold"
								disabled={sendingNow}
							>
								{sendingNow ? "送信中..." : "今すぐ送信"}
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
