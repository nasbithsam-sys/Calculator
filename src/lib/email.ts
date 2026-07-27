import { env } from "@/lib/env";

interface ExpertReviewEmailParams {
  to: string;
  referenceNumber: string;
  name?: string;
}

export async function sendExpertReviewEmail({ to, referenceNumber, name }: ExpertReviewEmailParams) {
  if (!env.EMAIL_PROVIDER_KEY || !env.EMAIL_SENDER_ADDRESS) {
    return {
      success: false,
      pending: true,
      error: "Email provider is not configured.",
    };
  }

  // In production, integrate Resend, Sendgrid, etc.
  try {
    // Provider SDK integration belongs here. Do not claim delivery unless the provider call succeeds.
    console.info("Email provider configured; delivery adapter is not installed.", {
      referenceNumber,
      recipientDomain: to.split("@")[1],
      hasName: Boolean(name),
    });
    return { success: false, pending: true, error: "Email delivery adapter is not installed." };
  } catch (error) {
    console.error("Failed to send email", error);
    return { success: false, error };
  }
}
