const THEMES: { name: string; questions: string[] }[] = [
  {
    name: "感謝",
    questions: [
      "今日感謝したことは？",
      "感謝の気持ち「ありがとう」を伝えたい人は？",
      "うれしかった出来事は？",
      "最近もらって嬉しかった言葉は？",
      "今日よかったことは？どんないいことがあった？",
      "幸せだなと感じたことは？",
      "最近笑顔になった出来事は？",
      "最近楽しかったことは？",
    ],
  },
  {
    name: "自己理解",
    questions: [
      "最近頑張ったことは？",
      "今日の自分を褒めるなら？",
      "今日はどんな1日だった？",
      "最近夢中になっていること、好きなことは？",
      "どんな時に自分らしいと感じる？",
      "今の気持ちに名前をつけるとしたら？",
      "今、いちばん大切にしたいことは？",
      "最近の悩みから学んだことは？",
    ],
  },
  {
    name: "人とのつながり",
    questions: [
      "心に残っている会話、忘れられない出来事は？",
      "今伝えたいことがある人は？",
      "最近励まされた言葉は？",
      "今、誰に気持ちを届けたい？",
      "あなたの人生に影響を与えた人は？",
      "最近会いたい人は？",
      "最近応援したいと思った人は？",
      "謝りたいこと、謝りたい人は？",
    ],
  },
  {
    name: "思い出",
    questions: [
      "今日いちばん心が動いた瞬間は？",
      "これまでに叶えてきたことは？",
      "人生の転機となった出来事は？",
      "最近感動したことは？",
      "今日という日を一言で表すなら？",
      "最近撮ったお気に入りの写真は？",
      "最近心に残った言葉は？",
      "最近懐かしく思い出したことは？",
    ],
  },
  {
    name: "未来",
    questions: [
      "未来の自分に残したい今の気持ちは？",
      "これから挑戦したいこと、あなたの夢は？",
      "半年後どうなっていたい？",
      "最近ワクワクしたことは？",
      "1年後の自分へメッセージを送るなら？",
      "大切にしたい価値観は？",
      "今叶えたい願い、天に届けたい願いは？",
      "大切な人へメッセージを送るなら？",
    ],
  },
];

// 日付（JST）から経過日数を計算（全ユーザー共通・決定論的）
function getDaysSinceEpoch(date: Date): number {
  const jst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return Math.floor(jst.getTime() / (1000 * 60 * 60 * 24));
}

export function getDailyQuestion(date: Date = new Date()): string {
  const days = getDaysSinceEpoch(date);
  const themeIndex = days % THEMES.length;
  const theme = THEMES[themeIndex];
  const cycle = Math.floor(days / THEMES.length);
  const questionIndex = cycle % theme.questions.length;
  return theme.questions[questionIndex];
}
