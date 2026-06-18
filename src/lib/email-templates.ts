// ─────────────────────────────────────────────────────────────
//  Musuhi メールテンプレート
//  カラーパレット: ネイビー #2A5CAA / ライトブルー #4A7BC8 / グレー各種
// ─────────────────────────────────────────────────────────────

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.musuhi-voice.com";

const BASE_STYLES = `
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap');
    body { margin:0; padding:0; background:#F9FAFB; font-family:'Noto Sans JP',sans-serif; }
    .wrapper { max-width:600px; margin:0 auto; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,.08); }
    .header { background:linear-gradient(135deg,#4A7BC8 0%,#2A5CAA 100%); padding:40px 32px 36px; text-align:center; }
    .logo { font-size:28px; font-weight:700; color:#fff; letter-spacing:.05em; margin:0 0 4px; }
    .tagline { font-size:13px; color:rgba(255,255,255,.85); margin:0; }
    .body { padding:36px 32px; }
    .greeting { font-size:16px; color:#111827; line-height:1.7; margin:0 0 20px; }
    .gift-card { background:#EBF2FF; border:1px solid #BFDBFE; border-radius:12px; padding:20px 24px; margin:24px 0; }
    .gift-label { font-size:11px; font-weight:700; color:#1F4580; letter-spacing:.1em; text-transform:uppercase; margin:0 0 6px; }
    .gift-title { font-size:20px; font-weight:700; color:#111827; margin:0 0 10px; }
    .gift-message { font-size:14px; color:#374151; line-height:1.75; margin:0; white-space:pre-wrap; }
    .cta-wrapper { text-align:center; margin:32px 0 24px; }
    .cta-btn { display:inline-block; background:#2A5CAA; color:#fff!important; text-decoration:none!important; font-size:16px; font-weight:700; padding:14px 40px; border-radius:50px; letter-spacing:.03em; box-shadow:0 4px 14px rgba(42,92,170,.35); }
    .note { font-size:12px; color:#9CA3AF; line-height:1.7; margin:0; }
    .divider { border:none; border-top:1px solid #F3F4F6; margin:28px 0; }
    .footer { background:#F9FAFB; padding:20px 32px; text-align:center; }
    .footer-text { font-size:11px; color:#9CA3AF; line-height:1.7; margin:0; }
    .sender-chip { display:inline-flex; align-items:center; gap:8px; background:#EBF2FF; border-radius:50px; padding:6px 16px 6px 6px; margin:0 0 20px; }
    .sender-avatar { width:32px; height:32px; border-radius:50%; background:linear-gradient(135deg,#4A7BC8,#2A5CAA); display:inline-flex; align-items:center; justify-content:center; font-size:14px; font-weight:700; color:#fff; }
    .sender-name { font-size:14px; font-weight:600; color:#1F4580; }
    .invite-card { background:#EFF6FF; border:1px solid #BFDBFE; border-radius:12px; padding:20px 24px; margin:24px 0; }
    .invite-icon { width:48px; height:48px; background:linear-gradient(135deg,#4A7BC8,#2A5CAA); border-radius:12px; margin:0 auto 12px; display:flex; align-items:center; justify-content:center; }
  </style>
`.trim();

function htmlWrapper(content: string): string {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Musuhi</title>
  ${BASE_STYLES}
</head>
<body style="background:#F9FAFB;padding:24px 16px;">
  <div class="wrapper">
    ${content}
    <div class="footer">
      <p class="footer-text">
        このメールは Musuhi からお送りしています。<br>
        心のこもった声のギフトで、大切な人とのつながりを育みましょう。<br><br>
        © Musuhi. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────
//  ギフト受信通知メール
// ─────────────────────────────────────────────────────────────
export function giftDeliveryHtml({
  senderName,
  giftTitle,
  giftUrl,
}: {
  senderName: string;
  giftTitle: string;
  giftMessage?: string | null;
  giftUrl: string;
}): string {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Musuhi</title>
</head>
<body style="margin:0;padding:24px 16px;background:#F5F0E8;font-family:'Noto Sans JP','Hiragino Kaku Gothic ProN',sans-serif;">
  <div style="max-width:520px;margin:0 auto;">

    <!-- 導入文 -->
    <p style="text-align:center;font-size:15px;color:#5a4a38;line-height:1.9;margin:0 0 20px;">
      ${escapeHtml(senderName)}さんから、あなたへ。<br>
      素敵なボイスギフトが届いています。
    </p>

    <!-- 封筒風カード（全体リンク） -->
    <a href="${giftUrl}" style="display:block;text-decoration:none;" target="_blank">
      <div style="position:relative;background:linear-gradient(160deg,#FEFBF6 0%,#FAF5EC 100%);border:2px solid #c9b99a;border-radius:12px;box-shadow:0 6px 24px rgba(120,95,55,0.18);overflow:hidden;">

        <!-- 消印アイコン（右上） -->
        <img src="${APP_URL}/icons/stamp1.png" width="72" height="72" alt="" style="position:absolute;top:4px;right:4px;opacity:0.8;mix-blend-mode:multiply;pointer-events:none;">

        <!-- 内枠装飾 -->
        <div style="margin:12px;border:1px solid rgba(184,149,106,0.5);border-radius:6px;padding:24px 20px 20px;">

          <!-- 水引画像 -->
          <div style="text-align:center;margin-bottom:12px;">
            <img src="${APP_URL}/icons/mizuhiki-bow.png" width="80" height="28" alt="" style="object-fit:contain;">
          </div>

          <!-- 宛名 -->
          <p style="text-align:center;font-size:18px;font-weight:700;color:#3a2e1e;margin:0 0 12px;letter-spacing:.03em;">
            ${escapeHtml(giftTitle)}へ
          </p>

          <!-- 区切り線 -->
          <hr style="border:none;border-top:1px solid #c9b99a;margin:0 16px 14px;">

          <!-- 差出人 -->
          <p style="text-align:center;font-size:13px;color:#7a6a55;margin:0;">
            ${escapeHtml(senderName)}より
          </p>

        </div>

        <!-- 開封CTAボタン -->
        <div style="background:linear-gradient(135deg,#4A7BC8 0%,#2A5CAA 100%);padding:14px;text-align:center;">
          <span style="font-size:14px;font-weight:700;color:#fff;letter-spacing:.05em;">ギフトを開く</span>
        </div>
      </div>
    </a>

    <!-- フッター -->
    <div style="margin-top:28px;text-align:center;">
      <hr style="border:none;border-top:1px solid #d4c9b5;margin:0 0 20px;">
      <p style="font-size:22px;font-weight:700;color:#2A5CAA;letter-spacing:.08em;margin:0 0 4px;">Musuhi</p>
      <p style="font-size:11px;color:#9a8a76;margin:0 0 12px;">声からはじまる　自分と人とのつながり</p>
      <p style="font-size:11px;color:#b0a090;margin:0;">© 2026 Musuhi. All rights reserved.</p>
    </div>

  </div>
</body>
</html>`;
}

export function giftDeliveryText({
  senderName,
  giftTitle,
  giftMessage,
  giftUrl,
}: {
  senderName: string;
  giftTitle: string;
  giftMessage?: string | null;
  giftUrl: string;
}): string {
  return [
    `【Musuhi】${senderName} さんから声のギフトが届きました`,
    "",
    `${senderName} さんがあなたに「${giftTitle}」というギフトを送りました。`,
    ...(giftMessage ? ["", giftMessage] : []),
    "",
    "以下のリンクからギフトを開けます:",
    giftUrl,
    "",
    "─",
    "Musuhi — 声でつながる、心のギフト",
  ].join("\n");
}

// ─────────────────────────────────────────────────────────────
//  コラボ招待メール（共同作成）
// ─────────────────────────────────────────────────────────────
export function collabInviteHtml({
  inviterName,
  giftTitle,
  giftMessage,
  inviteUrl,
}: {
  inviterName: string;
  giftTitle: string;
  giftMessage?: string | null;
  inviteUrl: string;
}): string {
  const initial = inviterName.charAt(0) || "?";
  const messageBlock = giftMessage
    ? `<p style="font-size:14px;color:#374151;line-height:1.75;margin:8px 0 0;">${escapeHtml(giftMessage)}</p>`
    : "";

  return htmlWrapper(`
    <div class="header">
      <p class="logo">Musuhi</p>
      <p class="tagline">一緒に声のギフトを届けよう</p>
    </div>
    <div class="body">
      <div class="sender-chip">
        <span class="sender-avatar">${escapeHtml(initial)}</span>
        <span class="sender-name">${escapeHtml(inviterName)} さんから招待</span>
      </div>
      <p class="greeting">
        ${escapeHtml(inviterName)} さんが、あなたを声のギフト作りに招待しています。<br>
        みんなで音声を集めて、特別なギフトを届けましょう！
      </p>
      <div class="invite-card">
        <p class="gift-label" style="color:#1F4580;">プロジェクト</p>
        <p class="gift-title">${escapeHtml(giftTitle)}</p>
        ${messageBlock}
      </div>
      <div class="cta-wrapper">
        <a href="${inviteUrl}" class="cta-btn">参加して声を録音する</a>
      </div>
      <hr class="divider">
      <p class="note">
        上のボタンから参加ページにアクセスして、<br>
        あなたの声のメッセージを録音・追加してください。<br><br>
        みんなの声が集まったら、${escapeHtml(inviterName)} さんが贈り先へ届けます。
      </p>
    </div>
  `);
}

export function collabInviteText({
  inviterName,
  giftTitle,
  inviteUrl,
}: {
  inviterName: string;
  giftTitle: string;
  inviteUrl: string;
}): string {
  return [
    `【Musuhi】${inviterName} さんから声のギフト作りに招待されました`,
    "",
    `${inviterName} さんが「${giftTitle}」という声のギフトプロジェクトに招待しています。`,
    "以下のリンクから参加して、あなたの声を録音・追加してください。",
    "",
    inviteUrl,
    "",
    "─",
    "Musuhi — 声でつながる、心のギフト",
  ].join("\n");
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
