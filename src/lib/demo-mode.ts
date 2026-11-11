// Demo routes require an explicit opt-in. Account data always comes from the real API.
export const isDemoModeEnabled = process.env.NEXT_PUBLIC_API_MOCKING === "enabled";
