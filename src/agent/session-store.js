import crypto from "node:crypto";

const sessions = new Map();

export function createChatSession() {
  const sessionId = crypto.randomUUID();
  const session = {
    sessionId,
    createdAt: new Date().toISOString(),
    responseId: null
  };

  sessions.set(sessionId, session);
  return session;
}

export function getChatSession(sessionId) {
  return sessions.get(sessionId);
}

export function ensureChatSession(sessionId) {
  const existingSession = getChatSession(sessionId);

  if (existingSession) {
    return existingSession;
  }

  const session = {
    sessionId,
    createdAt: new Date().toISOString(),
    responseId: null
  };

  sessions.set(sessionId, session);
  return session;
}

export function updateSessionResponse(sessionId, responseId) {
  const session = ensureChatSession(sessionId);
  session.responseId = responseId;
  return session;
}
