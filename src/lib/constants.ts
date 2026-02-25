// Westfield 1st Ward Silent Auction - Design Constants

export const AUCTION_CONFIG = {
  name: "Westfield 1st Ward",
  title: "Silent Auction",
  tagline: "Supporting Our Community",
  // Set these before the event
  startTime: new Date("2026-03-01T18:00:00-07:00"),
  endTime: new Date("2026-03-25T20:30:00-07:00"), // March 25, 2026 at 8:30 PM MST
};

export const COLORS = {
  // Primary palette
  cream: "#FEFDFB",
  coral: "#E07A5F",
  coralHover: "#C96A52",
  slate: "#2D3748",
  slateLight: "#4A5568",
  sage: "#81B29A",
  sageLight: "#A8D5BA",
  
  // Neutrals
  gray50: "#F9FAFB",
  gray100: "#F3F4F6",
  gray200: "#E5E7EB",
  gray300: "#D1D5DB",
  gray400: "#9CA3AF",
  gray500: "#6B7280",
  
  // Feedback
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
};

export const FONTS = {
  heading: "'Plus Jakarta Sans', sans-serif",
  body: "'Inter', sans-serif",
};
