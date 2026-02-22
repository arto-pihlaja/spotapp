import { api } from '@/lib/apiClient';
import type { Session, CreateSessionInput, SessionsResult } from '../types';

export async function fetchSessions(spotId: string): Promise<SessionsResult> {
  const res = await api.get<Session[] | { sessionCount: number }>(`/spots/${spotId}/sessions`);
  // Anonymous users get { sessionCount: N } instead of array
  if (!Array.isArray(res.data)) {
    return { sessions: [], sessionCount: res.data.sessionCount };
  }
  return { sessions: res.data, sessionCount: res.data.length };
}

export async function createSession(
  spotId: string,
  input: CreateSessionInput,
): Promise<Session> {
  const res = await api.post<Session>(`/spots/${spotId}/sessions`, input);
  return res.data;
}

export async function leaveSession(
  spotId: string,
  sessionId: string,
): Promise<{ sessionId: string }> {
  const res = await api.delete<{ sessionId: string }>(`/spots/${spotId}/sessions/${sessionId}`);
  return res.data;
}
