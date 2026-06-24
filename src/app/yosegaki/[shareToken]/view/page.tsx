import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { YosegakiViewClient, type CardData } from "./YosegakiViewClient";

type Props = {
  params: Promise<{ shareToken: string }>;
  searchParams: Promise<{ sender?: string }>;
};

export default async function YosegakiViewPage({ params, searchParams }: Props) {
  const { shareToken } = await params;
  const { sender } = await searchParams;
  const senderView = sender === "1";

  const yosegaki = await prisma.yosegaki.findUnique({
    where: { shareToken },
    include: {
      creator: {
        select: { id: true, name: true, displayName: true },
      },
      contributions: {
        orderBy: { createdAt: "asc" },
        include: {
          contributor: {
            select: { id: true, name: true, displayName: true },
          },
          recording: {
            select: { id: true, title: true, audioUrl: true, duration: true, images: true },
          },
        },
      },
    },
  });

  if (!yosegaki || (yosegaki.status !== "completed" && yosegaki.status !== "delivered")) {
    notFound();
  }

  const organizerName =
    yosegaki.organizerName || yosegaki.creator.displayName || yosegaki.creator.name || "企画者";
  const senderName = yosegaki.senderName || organizerName;

  const cards: CardData[] = [
    {
      id: "organizer",
      isOrganizer: true,
      imageUrl: yosegaki.organizerImageUrl ?? null,
      title: yosegaki.organizerAudioTitle || "企画者メッセージ",
      message: yosegaki.organizerAudioComment ?? null,
      audioUrl: yosegaki.organizerAudioUrl ?? null,
      audioDuration: null,
      participantName: organizerName,
    },
    ...yosegaki.contributions.map((c): CardData => ({
      id: c.id,
      isOrganizer: false,
      imageUrl: c.imageUrl ?? (Array.isArray(c.recording?.images) ? (c.recording.images as string[])[0] ?? null : null),
      title: c.title || c.recording?.title || "（タイトルなし）",
      message: c.message ?? null,
      audioUrl: c.audioUrl ?? c.recording?.audioUrl ?? null,
      audioDuration: c.audioDuration ?? c.recording?.duration ?? null,
      participantName: c.participantName || c.contributor?.displayName || c.contributor?.name || "参加者",
    })),
  ];

  return (
    <YosegakiViewClient
      title={yosegaki.title}
      recipientName={yosegaki.recipientName}
      description={yosegaki.description ?? ""}
      senderName={senderName}
      cards={cards}
      senderView={senderView}
    />
  );
}
