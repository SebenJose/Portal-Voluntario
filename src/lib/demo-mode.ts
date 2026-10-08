// Production builds require explicit opt-in; development keeps the local demonstration.
export const isDemoModeEnabled = process.env.NEXT_PUBLIC_API_MOCKING === "enabled" ||
  (process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_API_MOCKING !== "disabled");
