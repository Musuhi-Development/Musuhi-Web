import { prisma } from "../src/lib/prisma";

async function processScheduledVoiceGifts() {
  const now = new Date();

  const dueGifts = await prisma.voiceGift.findMany({
    where: {
      status: "scheduled",
      sendAt: { lte: now },
    },
    select: { id: true },
  });

  if (dueGifts.length === 0) {
    console.log("No scheduled voice gifts to process.");
    return;
  }

  await Promise.all(
    dueGifts.map(async (gift) => {
      await prisma.voiceGift.update({
        where: { id: gift.id },
        data: { status: "sent" },
      });
      await prisma.voiceGiftRecipient.updateMany({
        where: { voiceGiftId: gift.id, status: "pending" },
        data: { status: "delivered", deliveredAt: now },
      });
    })
  );

  console.log(`Processed ${dueGifts.length} scheduled voice gifts.`);
}

processScheduledVoiceGifts()
  .catch((error) => {
    console.error("Failed to process scheduled voice gifts:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
