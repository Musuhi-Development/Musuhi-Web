import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('='.repeat(60));
  console.log('Musuhi Database Seed Script');
  console.log('='.repeat(60));
  console.log('');

  // 既存のユーザーを取得
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'asc' },
    take: 2,
  });

  if (users.length < 2) {
    console.log('⚠️  Error: Not enough users found in database.');
    console.log('');
    console.log('Please create at least 2 users via Supabase Auth:');
    console.log('1. Go to Supabase Dashboard → Authentication → Users');
    console.log('2. Create users: test@example.com and demo@example.com');
    console.log('3. Login with both accounts to sync to database');
    console.log('4. Run this seed script again');
    console.log('');
    console.log('See SUPABASE_USER_GUIDE.md for detailed instructions.');
    return;
  }

  const [user1, user2] = users;
  console.log(`✓ Found ${users.length} users:`);
  console.log(`  - ${user1.email}`);
  console.log(`  - ${user2.email}`);
  console.log('');

  // 既存のデータをクリア（オプション）
  console.log('Cleaning existing test data...');
  await prisma.like.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.board.deleteMany({});
  await prisma.yosegakiContribution.deleteMany({});
  await prisma.yosegaki.deleteMany({});
  await prisma.gift.deleteMany({});
  await prisma.recording.deleteMany({});
  await prisma.connection.deleteMany({});
  console.log('✓ Cleaned');
  console.log('');

  // 録音データ作成
  console.log('Creating recordings...');
  const recording1 = await prisma.recording.create({
    data: {
      title: '今日の振り返り',
      description: '充実した一日でした',
      audioUrl: 'https://example.com/audio1.mp3',
      duration: 195,
      emotions: ['嬉しい', '感謝'],
      location: '東京都渋谷区',
      visibility: 'private',
      userId: user1.id,
    },
  });

  const recording2 = await prisma.recording.create({
    data: {
      title: 'ランチが美味しかった',
      description: 'イタリアンレストランでパスタを食べました',
      audioUrl: 'https://example.com/audio2.mp3',
      duration: 105,
      emotions: ['幸せ', 'ワクワク'],
      location: '東京都港区',
      visibility: 'friends',
      userId: user1.id,
    },
  });

  const recording3 = await prisma.recording.create({
    data: {
      title: '仕事でミスしてしまった...',
      description: '次は気をつけます',
      audioUrl: 'https://example.com/audio3.mp3',
      duration: 310,
      emotions: ['悲しい', '励まし'],
      visibility: 'private',
      userId: user1.id,
    },
  });

  const recording4 = await prisma.recording.create({
    data: {
      title: '週末の予定',
      description: '友達と出かける約束をしました',
      audioUrl: 'https://example.com/audio4.mp3',
      duration: 142,
      emotions: ['楽しい', 'ワクワク'],
      location: '東京都新宿区',
      visibility: 'public',
      userId: user2.id,
    },
  });
  console.log(`✓ Created 4 recordings`);

  // ギフト作成
  console.log('Creating gifts...');
  const gift1 = await prisma.gift.create({
    data: {
      title: '誕生日おめでとう！',
      message: 'お誕生日おめでとうございます！素敵な一年になりますように',
      recordingId: recording2.id,
      senderId: user1.id,
      recipientId: user2.id,
      status: 'sent',
      isPublic: false,
    },
  });

  const gift2 = await prisma.gift.create({
    data: {
      title: 'ありがとう',
      message: 'いつも助けてくれてありがとう',
      recordingId: recording4.id,
      senderId: user2.id,
      recipientId: user1.id,
      status: 'opened',
      isPublic: false,
      openedAt: new Date(),
    },
  });
  console.log(`✓ Created 2 gifts`);

  // 寄せ音声作成
  console.log('Creating yosegaki...');
  const yosegaki1 = await prisma.yosegaki.create({
    data: {
      title: '田中さんの退職祝い',
      description: '長年お疲れ様でした！',
      recipientName: '田中太郎',
      recipientEmail: 'tanaka@example.com',
      creatorId: user1.id,
      status: 'collecting',
      dueDate: new Date('2026-03-31'),
      isPublic: false,
    },
  });

  await prisma.yosegakiContribution.create({
    data: {
      yosegakiId: yosegaki1.id,
      recordingId: recording1.id,
      contributorId: user1.id,
      message: 'これからも頑張ってください！',
    },
  });

  await prisma.yosegakiContribution.create({
    data: {
      yosegakiId: yosegaki1.id,
      recordingId: recording4.id,
      contributorId: user2.id,
      message: 'お疲れ様でした！',
    },
  });
  console.log(`✓ Created 1 yosegaki with 2 contributions`);

  // ボード投稿作成
  console.log('Creating board posts...');
  const board1 = await prisma.board.create({
    data: {
      title: '初めての投稿です！',
      content: 'よろしくお願いします',
      audioUrl: 'https://example.com/board1.mp3',
      duration: 45,
      authorId: user1.id,
      isPublic: true,
    },
  });

  const board2 = await prisma.board.create({
    data: {
      title: '今日のランチ',
      content: '美味しいパスタを食べました',
      audioUrl: 'https://example.com/board2.mp3',
      duration: 90,
      authorId: user1.id,
      isPublic: true,
    },
  });

  const board3 = await prisma.board.create({
    data: {
      title: '週末の予定',
      content: '映画を見に行きます',
      audioUrl: 'https://example.com/board3.mp3',
      duration: 60,
      authorId: user2.id,
      isPublic: true,
    },
  });
  console.log(`✓ Created 3 board posts`);

  // コメント作成
  console.log('Creating comments...');
  await prisma.comment.create({
    data: {
      content: 'いいですね！',
      boardId: board1.id,
      authorId: user2.id,
    },
  });

  await prisma.comment.create({
    data: {
      content: '美味しそう！',
      boardId: board2.id,
      authorId: user2.id,
    },
  });

  await prisma.comment.create({
    data: {
      content: '楽しんでください！',
      boardId: board3.id,
      authorId: user1.id,
    },
  });
  console.log(`✓ Created 3 comments`);

  // いいね作成
  console.log('Creating likes...');
  await prisma.like.create({
    data: {
      boardId: board1.id,
      userId: user2.id,
    },
  });

  await prisma.like.create({
    data: {
      boardId: board2.id,
      userId: user2.id,
    },
  });

  await prisma.like.create({
    data: {
      boardId: board3.id,
      userId: user1.id,
    },
  });
  console.log(`✓ Created 3 likes`);

  // つながり作成
  console.log('Creating connections...');
  await prisma.connection.create({
    data: {
      initiatorId: user1.id,
      receiverId: user2.id,
      status: 'accepted',
    },
  });
  console.log(`✓ Created 1 connection`);

  console.log('');
  console.log('='.repeat(60));
  console.log('✅ Seeding completed successfully!');
  console.log('='.repeat(60));
  console.log('');
  console.log('Created:');
  console.log('  - 4 recordings');
  console.log('  - 2 gifts');
  console.log('  - 1 yosegaki (2 contributions)');
  console.log('  - 3 board posts');
  console.log('  - 3 comments');
  console.log('  - 3 likes');
  console.log('  - 1 connection');
  console.log('');
  console.log('You can now:');
  console.log('  - Visit http://localhost:3001/home to see recordings');
  console.log('  - Visit http://localhost:3001/board to see board posts');
  console.log('  - Visit http://localhost:3001/gift to see gifts');
  console.log('  - Check Prisma Studio at http://localhost:5555');
  console.log('');
}

main()
  .catch((e) => {
    console.error('Error during seeding:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
