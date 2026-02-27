import { api } from '@/lib/apiClient';
import type { UserForModeration, BlockUserResponse, SpotForModeration, DeleteSpotResponse, RevertWikiResponse, AuditLogEntry, AuditLogMeta, AuditAction, InvitationCode, CreateInvitationCodeInput } from '../types';

export function fetchUsers() {
  return api.get<UserForModeration[]>('/admin/users').then((r) => r.data);
}

export function blockUser(userId: string) {
  return api.post<BlockUserResponse>(`/admin/users/${userId}/block`, {}).then((r) => r.data);
}

export function unblockUser(userId: string) {
  return api.post<BlockUserResponse>(`/admin/users/${userId}/unblock`, {}).then((r) => r.data);
}

export function fetchSpots() {
  return api.get<SpotForModeration[]>('/admin/spots').then((r) => r.data);
}

export function deleteSpot(spotId: string) {
  return api.delete<DeleteSpotResponse>(`/admin/spots/${spotId}`).then((r) => r.data);
}

export function revertWiki(spotId: string) {
  return api.put<RevertWikiResponse>(`/admin/spots/${spotId}/wiki/revert`, {}).then((r) => r.data);
}

export function fetchInvitationCodes() {
  return api.get<InvitationCode[]>('/admin/invitation-codes').then((r) => r.data);
}

export function createInvitationCode(input: CreateInvitationCodeInput) {
  return api.post<InvitationCode>('/admin/invitation-codes', input).then((r) => r.data);
}

export function fetchAuditLogs(params: { page?: number; limit?: number; action?: AuditAction }) {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.action) searchParams.set('action', params.action);
  const qs = searchParams.toString();
  return api.get<AuditLogEntry[]>(`/admin/audit-logs${qs ? `?${qs}` : ''}`).then((r) => ({
    logs: r.data,
    meta: r.meta as unknown as AuditLogMeta,
  }));
}
