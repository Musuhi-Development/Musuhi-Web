"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Calendar, Copy, Gift, Loader2, Play, Pause, Users, Check } from "lucide-react";
import { clsx } from "clsx";
import { useUser } from "@/hooks/useUser";

type Recording = {
	id: string;
	title: string;
	duration: number;
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
	const [playingId, setPlayingId] = useState<string | null>(null);
	const [isPlaying, setIsPlaying] = useState(false);
	const audioRef = useRef<HTMLAudioElement | null>(null);

	useEffect(() => {
		if (!giftId) return;
		fetchGift(giftId);
		fetchRecordings();
	}, [giftId]);

	useEffect(() => {
		return () => {
			if (audioRef.current) {
				audioRef.current.pause();
				audioRef.current = null;
			}
		};
	}, []);

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

	const togglePlayPause = (recording: { id: string; audioUrl?: string }) => {
		if (!recording.audioUrl) {
			alert("音声ファイルが見つかりません");
			return;
		}

		if (playingId === recording.id && isPlaying) {
			audioRef.current?.pause();
			setIsPlaying(false);
			return;
		}

		if (playingId !== recording.id) {
			if (audioRef.current) {
				audioRef.current.pause();
				audioRef.current = null;
			}

			const audio = new Audio(recording.audioUrl);
			audioRef.current = audio;
			setPlayingId(recording.id);

			audio.onended = () => {
				setIsPlaying(false);
				setPlayingId(null);
			};

			audio.onerror = () => {
				alert("音声の再生に失敗しました");
				setIsPlaying(false);
				setPlayingId(null);
			};

			audio.play().then(() => {
				setIsPlaying(true);
			}).catch((err) => {
				console.error("Playback error:", err);
				alert("音声の再生に失敗しました");
				setIsPlaying(false);
				setPlayingId(null);
			});
		} else {
			audioRef.current?.play();
			setIsPlaying(true);
		}
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

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString("ja-JP", { year: "numeric", month: "numeric", day: "numeric" });
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
					<h1 className="text-lg font-bold text-gray-800">ボイスギフト詳細</h1>
					<span className="text-xs text-gray-400">{gift.status}</span>
				</div>
			</div>

			<div className="px-6 py-6 space-y-6">
				<div className="bg-white rounded-3xl shadow-md p-6">
					<div className="flex items-center gap-4 mb-4">
						<div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#4A7BC8] to-[#2A5CAA] flex items-center justify-center text-white">
							<Gift size={24} />
						</div>
						<div>
							<h2 className="text-xl font-bold text-gray-800">{gift.title}</h2>
							<p className="text-xs text-gray-500">作成日: {formatDate(gift.createdAt)}</p>
						</div>
					</div>
					{gift.message && <p className="text-sm text-gray-600">{gift.message}</p>}
				</div>

				{isOwner && (
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

				<div className="bg-white rounded-3xl shadow-md p-6">
					<h3 className="text-sm font-bold text-gray-700 mb-3">送信者</h3>
					<div className="flex flex-wrap gap-2">
						{(gift.recordings || []).map((recording: any) => recording.contributor)
							.filter((contributor: any, index: number, list: any[]) =>
								list.findIndex((c) => c.id === contributor.id) === index
							)
							.map((contributor: any) => (
								<span key={contributor.id} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs">
									{contributor.displayName || contributor.name}
								</span>
							))}
					</div>
				</div>

				<div className="bg-white rounded-3xl shadow-md p-6">
					<h3 className="text-sm font-bold text-gray-700 mb-3">受信者</h3>
					<div className="flex flex-wrap gap-2">
						{gift.recipients.map((recipient: any) => (
							<span key={recipient.id} className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs">
								{recipient.recipient?.displayName || recipient.recipient?.name || recipient.recipientEmail || "未設定"}
							</span>
						))}
					</div>
				</div>

				<div className="bg-white rounded-3xl shadow-md p-6">
					<h3 className="text-sm font-bold text-gray-700 mb-3">収録音声</h3>
					{gift.recordings.length === 0 ? (
						<p className="text-sm text-gray-500">まだ音声がありません</p>
					) : (
						<div className="space-y-2">
							{gift.recordings.map((item: any) => (
								<div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
										<button
											onClick={() => togglePlayPause(item.recording)}
											className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-100 to-blue-100 flex items-center justify-center"
										>
											{playingId === item.recording.id && isPlaying ? (
												<Pause size={16} className="text-[#2A5CAA]" />
											) : (
												<Play size={16} className="text-[#2A5CAA]" />
											)}
										</button>
									<div className="flex-1">
										<p className="text-sm font-semibold text-gray-800">{item.recording.title}</p>
										<p className="text-xs text-gray-500">
											{item.contributor.displayName || item.contributor.name}
										</p>
									</div>
								</div>
							))}
						</div>
					)}
				</div>

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

				<div className="text-xs text-gray-500 bg-white rounded-2xl p-4 shadow-sm flex items-center gap-2">
					<Users size={14} />
					ボイスギフトは複数の送信者が参加し、同じ内容で複数の受信者へ届けられます。
				</div>
			</div>
		</div>
	);
}
