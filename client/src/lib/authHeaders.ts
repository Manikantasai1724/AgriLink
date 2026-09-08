export async function getAuthHeaders(
  baseHeaders: Record<string, string> = {},
): Promise<Record<string, string>> {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  const userId = typeof window !== "undefined" ? localStorage.getItem("user_id") : null;

  if (token) {
    return {
      ...baseHeaders,
      Authorization: `Bearer ${token}`,
      ...(userId ? { "firebase-uid": userId, "x-firebase-uid": userId } : {}),
    };
  }

  return { ...baseHeaders };
}
