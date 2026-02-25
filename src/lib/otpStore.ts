// Shared in-memory OTP store (works for a single-server deployment like Vercel serverless)
// For a one-night auction event this is perfectly fine

export const otpStore = new Map<string, { code: string; expires: number }>();
