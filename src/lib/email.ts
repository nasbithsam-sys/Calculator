import { env } from "@/lib/env";

interface ExpertReviewEmailParams {
  to: string;
  referenceNumber: string;
  name?: string;
}

export async function sendExpertReviewEmail({ to, referenceNumber, name }: ExpertReviewEmailParams) {
  if (!env.EMAIL_PROVIDER_KEY || !env.EMAIL_SENDER_ADDRESS) {
    console.log("Mock Email Sent: Expert Review Request", { to, referenceNumber });
    return { success: true, mocked: true };
  }

  // In production, integrate Resend, Sendgrid, etc.
  try {
    // const resend = new Resend(env.EMAIL_PROVIDER_KEY);
    // await resend.emails.send({ ... });
    console.log("Real email would be sent here via provider.");
    return { success: true };
  } catch (error) {
    console.error("Failed to send email", error);
    return { success: false, error };
  }
}
