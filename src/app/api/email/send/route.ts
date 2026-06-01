import { NextResponse } from "next/server";
import { z } from "zod";
import { sendEmail } from "@/lib/mailer";

const bodySchema = z.object({
  to: z.union([z.string().email(), z.array(z.string().email())]),
  subject: z.string().min(1),
  html: z.string().optional(),
  text: z.string().optional(),
  from: z.string().optional(),
  replyTo: z.string().email().optional(),
});

export async function POST(request: Request) {
  const secret = process.env.INTERNAL_API_SECRET;
  if (secret) {
    const authHeader = request.headers.get("x-internal-secret");
    if (authHeader !== secret) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { to, subject, html, text } = parsed.data;
  if (!html && !text) {
    return NextResponse.json(
      { error: "Either html or text is required" },
      { status: 400 }
    );
  }

  try {
    await sendEmail(parsed.data);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[email/send] Failed to send email:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
