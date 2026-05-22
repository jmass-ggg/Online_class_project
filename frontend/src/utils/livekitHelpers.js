export function normalizeLiveKitPayload(payload = {}) {
  const source = payload.data || payload;
  const nestedSession = source.session || {};
  return {
    serverUrl: source.server_url || source.livekit_url || source.url || nestedSession.server_url || "",
    participantToken: source.participant_token || source.token || nestedSession.participant_token || nestedSession.token || "",
    roomName: source.room_name || source.livekit_room_name || nestedSession.livekit_room_name || "",
    session: nestedSession.id ? nestedSession : source.session || source
  };
}

export function saveLiveKitSession(sessionId, payload) {
  const normalized = normalizeLiveKitPayload(payload);
  sessionStorage.setItem(`livekit:session:${sessionId}`, JSON.stringify(normalized));
  return normalized;
}

export function getLiveKitSession(sessionId) {
  const stored = sessionStorage.getItem(`livekit:session:${sessionId}`);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function clearLiveKitSession(sessionId) {
  sessionStorage.removeItem(`livekit:session:${sessionId}`);
}
