import nodemailer from "nodemailer";

export type SendEmailOptions = {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
};

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT ?? "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error(
      "SMTP configuration is missing. Set SMTP_HOST, SMTP_USER, SMTP_PASS."
    );
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  const { to, subject, html, text, from, replyTo } = options;

  if (!html && !text) {
    throw new Error("Either html or text must be provided.");
  }

  const fromAddress = process.env.SMTP_FROM ?? process.env.SMTP_USER;
  const defaultFrom = fromAddress ? `"Musuhi｜Voice Gift" <${fromAddress}>` : undefined;

  const transporter = createTransporter();
  await transporter.sendMail({
    from: from ?? defaultFrom,
    to: Array.isArray(to) ? to.join(", ") : to,
    subject,
    ...(html ? { html } : {}),
    ...(text ? { text } : {}),
    ...(replyTo ? { replyTo } : {}),
  });
}
